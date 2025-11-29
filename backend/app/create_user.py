import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.sql_models import User
from app.db import DATABASE_URL

if not DATABASE_URL:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def create_user():
    async with AsyncSessionLocal() as session:
        # Check if user exists
        user = await session.get(User, "tester")
        if user:
            print("User already exists")
            return

        new_user = User(username="Tester", email="tester@test.com", hashed_password="password")
        session.add(new_user)
        try:
            await session.commit()
            print("User 'Tester' created successfully")
        except Exception as e:
            print(f"Error creating user: {e}")

if __name__ == "__main__":
    asyncio.run(create_user())
