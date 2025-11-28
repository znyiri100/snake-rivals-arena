from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import AsyncGenerator

# Use SQLite for development, but easy to switch to Postgres
# DATABASE_URL = "postgresql+asyncpg://user:password@localhost/dbname"
DATABASE_URL = "sqlite+aiosqlite:///./test2.db"

engine = create_async_engine(
    DATABASE_URL,
    echo=True, # Log SQL queries for debugging
    future=True
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        # In production, use Alembic for migrations.
        # For dev/prototype, this creates tables if they don't exist.
        await conn.run_sync(Base.metadata.create_all)
