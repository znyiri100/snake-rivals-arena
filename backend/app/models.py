from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class GameMode(str, Enum):
    passthrough = "passthrough"
    walls = "walls"

class User(BaseModel):
    id: str
    username: str
    email: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LeaderboardEntry(BaseModel):
    id: str
    username: str
    score: int
    gameMode: GameMode
    timestamp: datetime

class ScoreSubmission(BaseModel):
    score: int
    gameMode: GameMode

class GameSession(BaseModel):
    id: str
    userId: str
    username: str
    score: int
    gameMode: GameMode
    isActive: bool

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
