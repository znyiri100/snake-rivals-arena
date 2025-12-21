from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

class GameMode(str, Enum):
    snake = "snake"
    minesweeper = "minesweeper"
    space_invaders = "space_invaders"
    tetris = "tetris"

class Group(BaseModel):
    id: str
    name: str

    model_config = ConfigDict(from_attributes=True)

class User(BaseModel):
    id: str
    username: str
    email: str
    groups: List[Group] = []
    
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    new_group_name: Optional[str] = None
    group_ids: Optional[List[str]] = []

class LeaderboardEntry(BaseModel):
    id: str
    username: str
    score: int
    game_mode: GameMode = Field(alias="gameMode")
    timestamp: datetime
    groups: List[Group] = []
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class ScoreSubmission(BaseModel):
    score: int
    gameMode: GameMode

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
