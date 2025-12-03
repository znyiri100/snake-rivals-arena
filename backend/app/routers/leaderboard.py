from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import LeaderboardEntry, ScoreSubmission, GameMode, Group as ModelGroup
from ..sql_models import LeaderboardEntry as DBLeaderboardEntry, User as DBUser, Group as DBGroup
from ..db import get_db
from .auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@router.get("", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    gameMode: Optional[GameMode] = None, 
    group_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    query = select(DBLeaderboardEntry).order_by(DBLeaderboardEntry.score.desc())
    
    if gameMode:
        query = query.where(DBLeaderboardEntry.game_mode == gameMode)
        
    # If caller provided an explicit group_id
    if group_id:
        # Filter by users in the group
        if group_id != "all":
            subquery = select(DBUser.username).join(DBUser.groups).where(DBGroup.id == group_id)
            query = query.where(DBLeaderboardEntry.username.in_(subquery))
        # if group_id == "all", don't filter
    else:
        # No explicit group specified: default to the requesting user's first group if authenticated
        current_user = None
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1]
            try:
                current_user = await get_current_user(token, db)
            except HTTPException:
                current_user = None

        if current_user and getattr(current_user, "groups", None):
            # default to the first group
            default_gid = current_user.groups[0].id
            subquery = select(DBUser.username).join(DBUser.groups).where(DBGroup.id == default_gid)
            query = query.where(DBLeaderboardEntry.username.in_(subquery))

    result = await db.execute(query)
    entries = result.scalars().all()

    # Enrich entries with their users' groups
    usernames = list({e.username for e in entries})
    users_map: Dict[str, List[Dict[str, str]]] = {}
    if usernames:
        u_res = await db.execute(select(DBUser).where(DBUser.username.in_(usernames)))
        users = u_res.scalars().all()
        for u in users:
            # ensure groups relationship is loaded
            try:
                await db.refresh(u, attribute_names=["groups"])
            except Exception:
                pass
            g_list = []
            for g in getattr(u, "groups", []) or []:
                g_list.append({"id": g.id, "name": g.name})
            users_map[u.username] = g_list

    # Build response matching the Pydantic LeaderboardEntry (which now includes groups)
    out = []
    for e in entries:
        out.append({
            "id": e.id,
            "username": e.username,
            "score": e.score,
            "gameMode": e.game_mode,
            "timestamp": e.timestamp,
            "groups": users_map.get(e.username, [])
        })

    return out

@router.post("")
async def submit_score(submission: ScoreSubmission, current_user: DBUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    entry = DBLeaderboardEntry(
        username=current_user.username,
        score=submission.score,
        game_mode=submission.gameMode,
        timestamp=datetime.now()
    )
    db.add(entry)
    await db.commit()
    return {"message": "Score submitted successfully"}
