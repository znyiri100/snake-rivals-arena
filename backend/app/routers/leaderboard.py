from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import LeaderboardEntry, ScoreSubmission, GameMode
from ..sql_models import LeaderboardEntry as DBLeaderboardEntry, User as DBUser
from ..db import get_db
from .auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@router.get("", response_model=List[LeaderboardEntry])
async def get_leaderboard(gameMode: Optional[GameMode] = None, db: AsyncSession = Depends(get_db)):
    query = select(DBLeaderboardEntry).order_by(DBLeaderboardEntry.score.desc())
    if gameMode:
        query = query.where(DBLeaderboardEntry.game_mode == gameMode)
    
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
