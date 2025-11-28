from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..models import LeaderboardEntry, ScoreSubmission, GameMode, User
from ..db import db
from .auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@router.get("", response_model=List[LeaderboardEntry])
async def get_leaderboard(gameMode: Optional[GameMode] = None):
    return db.get_leaderboard(gameMode)

@router.post("")
async def submit_score(submission: ScoreSubmission, current_user: User = Depends(get_current_user)):
    entry = LeaderboardEntry(
        id=str(uuid.uuid4()),
        username=current_user.username,
        score=submission.score,
        gameMode=submission.gameMode,
        timestamp=datetime.now()
    )
    db.add_score(entry)
    return {"message": "Score submitted successfully"}
