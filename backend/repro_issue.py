import asyncio
import os
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, select
from app.main import app
from app.db import get_db, Base
from app.sql_models import User, LeaderboardEntry

# Setup explicit DB URL for testing if needed, or rely on env
# We'll use the one from app.db or a test one.
# For reproduction, let's try to use the SAME logic as the app.

async def repro():
    # 1. Setup Client
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 2. Signup
        username = "repro_user"
        email = "repro@example.com"
        password = "password"
        
        signup_payload = {
            "username": username,
            "email": email,
            "password": password
        }
        print(f"Signing up user: {username}")
        response = await client.post("/api/auth/signup", json=signup_payload)
        print(f"Signup Response: {response.status_code} {response.json()}")
        
        if response.status_code != 200:
            print("Signup failed.")
            return

        data = response.json()
        token = data["token"]
        user_id_from_response = data["user"]["id"]
        print(f"User ID from signup: {user_id_from_response}")
        
        # 3. Submit Score
        headers = {"Authorization": f"Bearer {token}"}
        score_payload = {
            "score": 999,
            "gameMode": "snake"
        }
        print("Submitting score...")
        response = await client.post("/api/leaderboard", json=score_payload, headers=headers)
        print(f"Submit Score Response: {response.status_code} {response.json()}")
        
        if response.status_code != 200:
            print("Submit score failed.")
            return

    # 4. Verify DB
    # We need to connect to the DB and check the row.
    # accessing the engine from app.db?
    from app.db import engine, SessionLocal
    
    async with SessionLocal() as session:
        print("Checking DB...")
        stmt = select(LeaderboardEntry).where(LeaderboardEntry.username == username).order_by(LeaderboardEntry.timestamp.desc())
        result = await session.execute(stmt)
        entry = result.scalars().first()
        
        if entry:
            print(f"Found Entry: ID={entry.id}, Score={entry.score}, UserID={entry.user_id}")
            if entry.user_id == user_id_from_response:
                print("SUCCESS: user_id matches!")
            else:
                print(f"FAILURE: user_id mismatch! Expected {user_id_from_response}, got {entry.user_id}")
        else:
            print("FAILURE: No entry found in DB.")

if __name__ == "__main__":
    asyncio.run(repro())
