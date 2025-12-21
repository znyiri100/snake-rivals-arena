# Snake Rivals Arena Backend

## Setup
1. Install `uv`: `curl -LsSf https://astral.sh/uv/install.sh | sh` (if not installed)
2. Install dependencies: `uv sync`

## Running the Server
Run the following command from the `backend` directory:

```bash
uv run uvicorn app.main:app --reload
```

The server will start at `http://localhost:8000`.

## Running Tests
```bash
PYTHONPATH=. uv run pytest
```

## API Documentation
Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Data Model

See the **Entity-Relationship (ER) Diagram** in [`../docs/ER_DIAGRAM.svg`](../docs/ER_DIAGRAM.svg) and [`../docs/ER_DIAGRAM.mmd`](../docs/ER_DIAGRAM.mmd) (Mermaid format).

### Overview

The backend uses **SQLAlchemy** for ORM and **Pydantic** for validation/serialization:
- `backend/app/sql_models.py`: Database models (SQLAlchemy ORM classes)
- `backend/app/models.py`: API schemas (Pydantic models for request/response validation)
- `backend/app/db.py`: Database engine, session factory, and initialization

### Core Entities

#### **Users** (`users` table)
- `id` (String UUID, PK): Unique user identifier
- `username` (String, unique, indexed): User login name
- `email` (String, unique, indexed): User email address
- `hashed_password` (String): Bcrypt/argon2 hashed password
- **Relationships**: Many-to-many with `groups` via `user_groups` association table

#### **Groups** (`groups` table)
- `id` (String UUID, PK): Unique group identifier
- `name` (String, unique, indexed): Group display name
- **Relationships**: Many-to-many with `users` via `user_groups` association table

#### **UserGroups** (`user_groups` association table)
- Composite PK: `user_id` (FK → users.id), `group_id` (FK → groups.id)
- Purpose: Implements many-to-many relationship between users and groups

#### **Leaderboard** (`leaderboard` table)
- `id` (String UUID, PK): Entry identifier
- `username` (String, indexed): Username snapshot at time of score entry
- `score` (Integer): Game score
- `game_mode` (Enum: `passthrough` or `walls`): Game mode
- `timestamp` (DateTime, server default: now): When entry was created
- **Note**: Stores username snapshot (not FK) so entries persist even if username changes

### Enums

- **GameMode**: `"passthrough"` or `"walls"` — defines game difficulty/variant

### Database Configuration

The database URL is controlled by the `DATABASE_URL` environment variable:
- **Development**: Defaults to `sqlite+aiosqlite:///./test.db` (SQLite with async support)
- **Production**: Use `postgresql+asyncpg://user:password@host/dbname` (PostgreSQL with async support)

The backend automatically converts `postgres://` URLs to `postgresql+asyncpg://` for Render/Heroku compatibility.

### Migrations

- **Development**: `init_db()` in `db.py` calls `Base.metadata.create_all` to auto-create tables
- **Production**: Use **Alembic** for schema migrations (not configured in this prototype; see `pyproject.toml` for migration framework setup)

### Design Notes

- All primary keys are **UUID strings** (not auto-incrementing integers)
- `user_groups` enforces referential integrity for user–group links
- `leaderboard` intentionally stores `username` snapshots for historical accuracy (entries survive username changes)
- Pydantic models use field aliases (e.g., `gameMode`, `userId`, `isActive`) to match frontend camelCase conventions; `populate_by_name=True` allows both field name and alias in requests/responses
