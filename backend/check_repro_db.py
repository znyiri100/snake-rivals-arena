import asyncio
import os
from sqlalchemy import text
from app.db import engine, SessionLocal

async def check():
    async with SessionLocal() as session:
        print("Checking DB for repro_user...")
        result = await session.execute(text("SELECT username, user_id, score, game_mode FROM leaderboard WHERE username = 'repro_user'"))
        rows = result.fetchall()
        for row in rows:
            print(f"Row: {row}")
            if row.user_id:
                print("SUCCESS: user_id is present.")
            else:
                print("FAILURE: user_id is missing.")

if __name__ == "__main__":
    asyncio.run(check())
