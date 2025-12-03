from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from .db import Base
from .models import GameMode
import uuid
from sqlalchemy import Table, ForeignKey
from sqlalchemy.orm import relationship

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, index=True)
    email = Column(String, index=True)
    hashed_password = Column(String)

    groups = relationship("Group", secondary="user_groups", back_populates="users")

    __table_args__ = (
        # Composite unique constraints for (group_id, username) and (group_id, email)
        # These require the user_groups association table
        # We'll enforce uniqueness via a partial index on the association table
    )

from sqlalchemy import UniqueConstraint

user_groups = Table(
    "user_groups",
    Base.metadata,
    Column("user_id", String, ForeignKey("users.id"), primary_key=True),
    Column("group_id", String, ForeignKey("groups.id"), primary_key=True),
    Column("username", String),
    Column("email", String),
    UniqueConstraint("group_id", "username", name="uq_group_username"),
    UniqueConstraint("group_id", "email", name="uq_group_email"),
)

class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True)

    users = relationship("User", secondary=user_groups, back_populates="groups")

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
