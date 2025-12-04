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
    # 1. Base query for LeaderboardEntry
    query = select(DBLeaderboardEntry).order_by(DBLeaderboardEntry.score.desc())
    
    if gameMode:
        query = query.where(DBLeaderboardEntry.game_mode == gameMode)
        
    # 2. Handle Group Filtering
    if group_id:
        if group_id != "all":
            # Filter by users in the specific group
            subquery = select(DBUser.username).join(DBUser.groups).where(DBGroup.id == group_id)
            query = query.where(DBLeaderboardEntry.username.in_(subquery))
    else:
        # Default group logic
        current_user = None
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1]
            try:
                current_user = await get_current_user(token, db)
            except HTTPException:
                current_user = None

        if current_user and getattr(current_user, "groups", None):
            default_gid = current_user.groups[0].id
            subquery = select(DBUser.username).join(DBUser.groups).where(DBGroup.id == default_gid)
            query = query.where(DBLeaderboardEntry.username.in_(subquery))

    # Execute main query
    result = await db.execute(query)
    entries = result.scalars().all()

    # 3. Efficiently fetch Users with Groups (Eager Loading)
    # We need the groups for each user in the leaderboard to display them.
    # Instead of iterating and lazy-loading (which fails in async), we fetch all relevant users with their groups in one go.
    
    usernames = list({e.username for e in entries})
    users_map: Dict[str, List[Dict[str, str]]] = {}
    
    if usernames:
        # Use selectinload to fetch groups eagerly
        from sqlalchemy.orm import selectinload
        user_query = (
            select(DBUser)
            .where(DBUser.username.in_(usernames))
            .options(selectinload(DBUser.groups))
        )
        u_res = await db.execute(user_query)
        users = u_res.scalars().all()
        
        for u in users:
            g_list = [{"id": g.id, "name": g.name} for g in u.groups]
            users_map[u.username] = g_list

    # 4. Build Response
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
