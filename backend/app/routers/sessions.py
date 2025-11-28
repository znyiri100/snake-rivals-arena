from fastapi import APIRouter, HTTPException
from typing import List
from ..models import GameSession
from ..db import db

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("", response_model=List[GameSession])
async def get_active_sessions():
    return db.get_active_sessions()

@router.get("/{id}", response_model=GameSession)
async def get_session(id: str):
    session = db.get_session(id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
