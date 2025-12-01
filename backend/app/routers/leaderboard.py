from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import LeaderboardEntry, ScoreSubmission, GameMode
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
    db: AsyncSession = Depends(get_db)
):
    query = select(DBLeaderboardEntry).order_by(DBLeaderboardEntry.score.desc())
    
    if gameMode:
        query = query.where(DBLeaderboardEntry.game_mode == gameMode)
        
    if group_id:
        # Filter by users in the group
        # This assumes LeaderboardEntry.username matches User.username
        # We need to join with User and then UserGroup
        # Or subquery: select * from leaderboard where username in (select username from users join user_groups on ... where group_id = ...)
        
        # Simpler approach: Get usernames in group first
        # Note: In a real large scale app, a JOIN is better.
        # But here we can do a subquery or join.
        
        # Let's do a JOIN if possible, but LeaderboardEntry doesn't have a direct FK to User (it uses username).
        # So we filter where username is in the list of usernames for that group.
        
        subquery = select(DBUser.username).join(DBUser.groups).where(DBGroup.id == group_id)
        query = query.where(DBLeaderboardEntry.username.in_(subquery))
    
    result = await db.execute(query)
    entries = result.scalars().all()
    return entries

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
