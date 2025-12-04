"""
Migration script to add space_invaders and tetris to GameMode enum.

This script should be run once to update the existing database.
For new databases, the enum will be created with all values automatically.
"""

import asyncio
from sqlalchemy import text
from app.db import engine

async def migrate():
    """Add new game modes to the GameMode enum type in PostgreSQL."""
    async with engine.begin() as conn:
        # Check if the enum type exists
        result = await conn.execute(text("""
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'gamemode'
            );
        """))
        enum_exists = (await result.fetchone())[0]
        
        if not enum_exists:
            print("GameMode enum doesn't exist yet. It will be created automatically.")
            return
        
        # Check current enum values
        result = await conn.execute(text("""
            SELECT enumlabel FROM pg_enum
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'gamemode')
            ORDER BY enumsortorder;
        """))
        current_values = [row[0] for row in await result.fetchall()]
        print(f"Current GameMode values: {current_values}")
        
        # Add space_invaders if it doesn't exist
        if 'space_invaders' not in current_values:
            print("Adding 'space_invaders' to GameMode enum...")
            await conn.execute(text("""
                ALTER TYPE gamemode ADD VALUE 'space_invaders';
            """))
            print("✓ Added 'space_invaders'")
        else:
            print("'space_invaders' already exists")
        
        # Add tetris if it doesn't exist
        if 'tetris' not in current_values:
            print("Adding 'tetris' to GameMode enum...")
            await conn.execute(text("""
                ALTER TYPE gamemode ADD VALUE 'tetris';
            """))
            print("✓ Added 'tetris'")
        else:
            print("'tetris' already exists")
        
        # Verify final state
        result = await conn.execute(text("""
            SELECT enumlabel FROM pg_enum
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'gamemode')
            ORDER BY enumsortorder;
        """))
        final_values = [row[0] for row in await result.fetchall()]
        print(f"\nFinal GameMode values: {final_values}")
        print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    print("Starting GameMode enum migration...")
    asyncio.run(migrate())
