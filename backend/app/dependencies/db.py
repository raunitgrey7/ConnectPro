"""FastAPI dependency providers for database sessions and services."""
from typing import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.services.meeting_service import MeetingService


def get_db() -> Generator[Session, None, None]:
    """Yield a database session and guarantee it is closed after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_meeting_service(db: Session = Depends(get_db)) -> MeetingService:
    """Provide a MeetingService instance bound to the current request's DB session."""
    return MeetingService(db)
