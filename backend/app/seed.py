import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.sql_models import User, LeaderboardEntry
from app.models import GameMode
from app.db import Base, DATABASE_URL

# Ensure we use the same DATABASE_URL logic
if not DATABASE_URL:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed():
    async with AsyncSessionLocal() as session:
        # Check if passthrough data exists
        result = await session.execute(text("SELECT count(*) FROM leaderboard WHERE game_mode = 'passthrough'"))
        count = result.scalar()
        if count > 0:
            print("Passthrough leaderboard already seeded.")
        else:
            print("Seeding passthrough leaderboard...")
            entries = [
                LeaderboardEntry(username="SnakeMaster", score=1500, game_mode=GameMode.passthrough),
                LeaderboardEntry(username="Pythonista", score=1100, game_mode=GameMode.passthrough),
                LeaderboardEntry(username="Cobra", score=850, game_mode=GameMode.passthrough),
                LeaderboardEntry(username="Viper", score=1800, game_mode=GameMode.passthrough),
            ]
            session.add_all(entries)
            await session.commit()
            print("Passthrough seeded!")

        # Check if walls data exists
        result = await session.execute(text("SELECT count(*) FROM leaderboard WHERE game_mode = 'walls'"))
        count = result.scalar()
        if count > 0:
            print("Walls leaderboard already seeded.")
        else:
            print("Seeding walls leaderboard...")
            entries = [
                LeaderboardEntry(username="Viper", score=1200, game_mode=GameMode.walls),
                LeaderboardEntry(username="Anaconda", score=900, game_mode=GameMode.walls),
                LeaderboardEntry(username="SnakeMaster", score=2000, game_mode=GameMode.walls),
            ]
            session.add_all(entries)
            await session.commit()
            print("Walls seeded!")

if __name__ == "__main__":
    asyncio.run(seed())
