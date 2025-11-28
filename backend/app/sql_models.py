from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from .db import Base
from .models import GameMode
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, index=True)
    score = Column(Integer)
    game_mode = Column(SQLEnum(GameMode))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class GameSession(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, index=True)
    username = Column(String)
    score = Column(Integer, default=0)
    game_mode = Column(SQLEnum(GameMode))
    is_active = Column(Boolean, default=True)
