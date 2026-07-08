"""Data-access layer for User entities."""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    """Encapsulates all direct database access for User records."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, name: str, email: str, avatar_url: Optional[str] = None) -> User:
        user = User(name=name, email=email, avatar_url=avatar_url)
        self.db.add(user)
        self.db.flush()
        return user

    def get_or_create(self, name: str, email: str) -> User:
        """Idempotently fetch a user by email, creating one if it doesn't exist yet."""
        existing = self.get_by_email(email)
        if existing:
            return existing
        return self.create(name=name, email=email)
