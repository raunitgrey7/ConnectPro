"""User model."""
from typing import List

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, generate_uuid


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships
    hosted_meetings: Mapped[List["Meeting"]] = relationship(
        "Meeting", back_populates="host", cascade="all, delete-orphan"
    )
    scheduled_meetings: Mapped[List["ScheduledMeeting"]] = relationship(
        "ScheduledMeeting", back_populates="host", cascade="all, delete-orphan"
    )
    participations: Mapped[List["Participant"]] = relationship(
        "Participant", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
