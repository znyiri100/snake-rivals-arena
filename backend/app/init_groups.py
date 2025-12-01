import asyncio
from sqlalchemy.future import select
from app.db import SessionLocal, init_db
from app.sql_models import User, Group

async def init_groups():
    await init_db()
    async with SessionLocal() as db:
        print("Checking for 'other' group...")
        result = await db.execute(select(Group).where(Group.name == "other"))
        other_group = result.scalars().first()
        
        if not other_group:
            print("Creating 'other' group...")
            other_group = Group(name="other")
            db.add(other_group)
            await db.commit()
            await db.refresh(other_group)
        else:
            print("'other' group already exists.")
            
        print("Checking for users without groups...")
        # Fetch all users
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        count = 0
        for user in users:
            # We need to load groups to check if they have any
            await db.refresh(user, attribute_names=["groups"])
            if not user.groups:
                print(f"Assigning user {user.username} to 'other' group.")
                user.groups.append(other_group)
                count += 1
        
        if count > 0:
            await db.commit()
            print(f"Assigned {count} users to 'other' group.")
        else:
            print("No users needed assignment.")

if __name__ == "__main__":
    asyncio.run(init_groups())
