from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import GameSession
from ..sql_models import GameSession as DBGameSession
from ..db import get_db

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("", response_model=List[GameSession])
async def get_active_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBGameSession).where(DBGameSession.is_active == True))
    sessions = result.scalars().all()
    return sessions

@router.get("/{id}", response_model=GameSession)
async def get_session(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBGameSession).where(DBGameSession.id == id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
