import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.db import DATABASE_URL

if not DATABASE_URL:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def verify():
    async with AsyncSessionLocal() as session:
        print("--- Users ---")
        result = await session.execute(text("SELECT username, email FROM users"))
        for row in result:
            print(row)
            
        print("\n--- Leaderboard ---")
        result = await session.execute(text("SELECT username, user_id, score, game_mode FROM leaderboard"))
        for row in result:
            print(row)

if __name__ == "__main__":
    asyncio.run(verify())
