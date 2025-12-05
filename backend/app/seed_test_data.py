import asyncio
import random
import uuid
import os
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from .sql_models import User, LeaderboardEntry, Group
from .models import GameMode
from .db import DATABASE_URL

# Ensure we use the same DATABASE_URL logic
if not DATABASE_URL:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed_test_data():
    async with AsyncSessionLocal() as session:
        # 1. Create or Get 'test group'
        result = await session.execute(select(Group).where(Group.name == "test group"))
        test_group = result.scalars().first()
        
        if not test_group:
            print("Creating 'test group'...")
            test_group = Group(id=str(uuid.uuid4()), name="test group")
            session.add(test_group)
            await session.commit()
        else:
            print("'test group' already exists.")

        # 2. Create Users test1 to test5
        users = []
        for i in range(1, 6):
            username = f"test{i}"
            email = f"test{i}@example.com"
            
            result = await session.execute(select(User).where(User.username == username))
            user = result.scalars().first()
            
            if not user:
                print(f"Creating user {username}...")
                user = User(
                    id=str(uuid.uuid4()),
                    username=username,
                    email=email,
                    hashed_password="password" # Plaintext as per current auth implementation
                )
                session.add(user)
                users.append(user)
            else:
                print(f"User {username} already exists.")
                users.append(user)
        
        await session.commit()

        # 3. Assign users to group
        from sqlalchemy.orm import selectinload
        
        for user in users:
            # Reload user with groups
            result = await session.execute(
                select(User).where(User.id == user.id).options(selectinload(User.groups))
            )
            loaded_user = result.scalars().first()
            
            if test_group not in loaded_user.groups:
                print(f"Adding {loaded_user.username} to test group...")
                loaded_user.groups.append(test_group)
                session.add(loaded_user)
        
        await session.commit()

        # 4. Add random scores
        game_modes = [GameMode.snake, GameMode.minesweeper, GameMode.space_invaders, GameMode.tetris]
        
        print("Adding random scores...")
        for user in users:
            for mode in game_modes:
                # Add 1-3 scores per game mode per user
                num_scores = random.randint(1, 3)
                for _ in range(num_scores):
                    score = random.randint(100, 5000)
                    entry = LeaderboardEntry(
                        username=user.username,
                        score=score,
                        game_mode=mode
                    )
                    session.add(entry)
        
        await session.commit()
        print("Test data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_test_data())
