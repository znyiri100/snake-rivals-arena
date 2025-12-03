"""
Migration script to allow duplicate usernames/emails across groups by
- Removing global uniqueness constraints (handled in models)
- Adding `username` and `email` columns to `user_groups`
- Enforcing UNIQUE(group_id, username) and UNIQUE(group_id, email)

This script supports SQLite and Postgres (best-effort). Run with:

    uv run python backend/app/migrations/allow_duplicate_usernames_emails.py

"""
import os
import uuid
from sqlalchemy import create_engine, text
from app.db import DATABASE_URL


def _sync_url(url: str) -> str:
    # Convert async DB URLs to sync variants for migration
    if url.startswith("sqlite+aiosqlite://"):
        return url.replace("sqlite+aiosqlite://", "sqlite://", 1)
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://", 1)
    # Fallback use as-is
    return url


def migrate_sqlite(engine):
    conn = engine.connect()
    trans = conn.begin()
    try:
        # Check if username column already exists
        res = conn.execute(text("PRAGMA table_info(user_groups)"))
        cols = [r[1] for r in res]
        if 'username' in cols and 'email' in cols:
            print('user_groups already has username/email columns — skipping')
            trans.commit()
            return

        print('Creating new user_groups table with username/email and unique constraints')
        # Create new table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS user_groups_new (
                user_id TEXT NOT NULL,
                group_id TEXT NOT NULL,
                username TEXT,
                email TEXT,
                PRIMARY KEY(user_id, group_id),
                UNIQUE (group_id, username),
                UNIQUE (group_id, email)
            )
        '''))

        # Copy existing user_groups with username/email joined from users
        conn.execute(text('''
            INSERT OR IGNORE INTO user_groups_new (user_id, group_id, username, email)
            SELECT ug.user_id, ug.group_id, u.username, u.email
            FROM user_groups ug
            LEFT JOIN users u ON u.id = ug.user_id
        '''))

        # Ensure every user has at least one group: assign to 'other' if none
        # Create 'other' group if missing
        other = conn.execute(text("SELECT id FROM groups WHERE name='other' LIMIT 1")).fetchone()
        if other is None:
            conn.execute(text("INSERT INTO groups (id, name) VALUES (lower(hex(randomblob(16))), 'other')"))
            other = conn.execute(text("SELECT id FROM groups WHERE name='other' LIMIT 1")).fetchone()
        other_id = other[0]

        # Insert users without groups into user_groups_new
        conn.execute(text('''
            INSERT OR IGNORE INTO user_groups_new (user_id, group_id, username, email)
            SELECT u.id, :other_id, u.username, u.email
            FROM users u
            WHERE NOT EXISTS (SELECT 1 FROM user_groups ug WHERE ug.user_id = u.id)
        '''), {'other_id': other_id})

        # Drop old table and rename new
        conn.execute(text('DROP TABLE IF EXISTS user_groups'))
        conn.execute(text('ALTER TABLE user_groups_new RENAME TO user_groups'))

        trans.commit()
        print('SQLite migration completed successfully')
    except Exception:
        trans.rollback()
        raise
    finally:
        conn.close()


def migrate_postgres(engine):
    conn = engine.connect()
    trans = conn.begin()
    try:
        # Add columns if missing
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='user_groups'"))
        cols = [r[0] for r in res]
        if 'username' not in cols:
            conn.execute(text('ALTER TABLE user_groups ADD COLUMN username TEXT'))
        if 'email' not in cols:
            conn.execute(text('ALTER TABLE user_groups ADD COLUMN email TEXT'))

        # Populate username/email from users
        conn.execute(text('''
            UPDATE user_groups ug
            SET username = u.username,
                email = u.email
            FROM users u
            WHERE u.id = ug.user_id
        '''))

        # Create unique constraints if they don't exist (some Postgres versions don't support IF NOT EXISTS)
        res = conn.execute(text("SELECT 1 FROM pg_constraint WHERE conname='uq_group_username' LIMIT 1")).fetchone()
        if not res:
            conn.execute(text("ALTER TABLE user_groups ADD CONSTRAINT uq_group_username UNIQUE (group_id, username)"))
        res = conn.execute(text("SELECT 1 FROM pg_constraint WHERE conname='uq_group_email' LIMIT 1")).fetchone()
        if not res:
            conn.execute(text("ALTER TABLE user_groups ADD CONSTRAINT uq_group_email UNIQUE (group_id, email)"))

        # Ensure every user has at least one group: assign to 'other' if none
        other = conn.execute(text("SELECT id FROM groups WHERE name='other' LIMIT 1")).fetchone()
        if other is None:
            new_id = str(uuid.uuid4())
            conn.execute(text("INSERT INTO groups (id, name) VALUES (:id, 'other')"), {'id': new_id})
            other = (new_id,)
        other_id = other[0]

        conn.execute(text('''
            INSERT INTO user_groups (user_id, group_id, username, email)
            SELECT u.id, :other_id, u.username, u.email
            FROM users u
            WHERE NOT EXISTS (SELECT 1 FROM user_groups ug WHERE ug.user_id = u.id)
            ON CONFLICT DO NOTHING
        '''), {'other_id': other_id})

        trans.commit()
        print('Postgres migration completed successfully')
    except Exception:
        trans.rollback()
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    url = DATABASE_URL or os.getenv('DATABASE_URL', 'sqlite+aiosqlite:///./test.db')
    sync = _sync_url(url)
    print('Using DB URL:', sync)
    engine = create_engine(sync)

    if 'sqlite' in sync and 'memory' not in sync:
        migrate_sqlite(engine)
    else:
        migrate_postgres(engine)

    print('Migration script finished')
