from logging.config import fileConfig
import os
from dotenv import load_dotenv

load_dotenv()

from alembic import context
from sqlalchemy import create_engine, pool

# Import all models so Alembic detects them
from app.database import Base
from app.models import User, RefreshToken, Favorite  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Build the synchronous DB URL from the async one
db_url = os.environ.get("DATABASE_URL", "sqlite:///./spacetoday.db")
sync_url = (
    db_url
    .replace("postgresql+asyncpg://", "postgresql://")
    .replace("sqlite+aiosqlite://", "sqlite://")
)


def run_migrations_offline() -> None:
    context.configure(
        url=sync_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Create engine directly (bypasses configparser interpolation issues with % chars)
    connectable = create_engine(sync_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
