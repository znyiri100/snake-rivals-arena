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
        # Check if snake data exists
        result = await session.execute(text("SELECT count(*) FROM leaderboard WHERE game_mode = 'snake'"))
        count = result.scalar()
        if count > 0:
            print("Snake leaderboard already seeded.")
        else:
            print("Seeding snake leaderboard...")
            entries = [
                LeaderboardEntry(username="SnakeMaster", score=1500, game_mode=GameMode.snake),
                LeaderboardEntry(username="Pythonista", score=1100, game_mode=GameMode.snake),
                LeaderboardEntry(username="Cobra", score=850, game_mode=GameMode.snake),
                LeaderboardEntry(username="Viper", score=1800, game_mode=GameMode.snake),
            ]
            session.add_all(entries)
            await session.commit()
            print("Snake seeded!")

        # Check if minesweeper data exists
        result = await session.execute(text("SELECT count(*) FROM leaderboard WHERE game_mode = 'minesweeper'"))
        count = result.scalar()
        if count > 0:
            print("Minesweeper leaderboard already seeded.")
        else:
            print("Seeding minesweeper leaderboard...")
            entries = [
                LeaderboardEntry(username="Viper", score=1200, game_mode=GameMode.minesweeper),
                LeaderboardEntry(username="Anaconda", score=900, game_mode=GameMode.minesweeper),
                LeaderboardEntry(username="SnakeMaster", score=2000, game_mode=GameMode.minesweeper),
            ]
            session.add_all(entries)
            await session.commit()
            print("Minesweeper seeded!")

if __name__ == "__main__":
    asyncio.run(seed())
