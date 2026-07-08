"""Database engine and session factory."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    # Required for SQLite when used with FastAPI's threaded request handling.
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    future=True,
)


def init_db() -> None:
    """Create all database tables. In production, use Alembic migrations instead."""
    from app.database.base import Base
    from app.models import (  # noqa: F401  (import required to register models)
        user,
        meeting,
        participant,
        scheduled_meeting,
        meeting_history,
    )

    Base.metadata.create_all(bind=engine)
