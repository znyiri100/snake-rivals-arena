import asyncio
from sqlalchemy import text
from app.db import SessionLocal

async def check():
    async with SessionLocal() as session:
        print("Checking DB for user 'dad'...")
        result = await session.execute(text("SELECT id, username, email FROM users WHERE username = 'dad'"))
        rows = result.fetchall()
        for row in rows:
            print(f"User: {row}")
            
        print("\nChecking leaderboard for 'dad'...")
        result = await session.execute(text("SELECT id, username, user_id, score, timestamp FROM leaderboard WHERE username = 'dad' ORDER BY timestamp DESC LIMIT 5"))
        rows = result.fetchall()
        for row in rows:
            print(f"Score: {row}")

if __name__ == "__main__":
    asyncio.run(check())

