"""Meeting model."""
import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, generate_uuid


class MeetingStatus(str, enum.Enum):
    ACTIVE = "active"
    ENDED = "ended"


class Meeting(Base, TimestampMixin):
    """
    Represents an instant or scheduled meeting *instance* that either is
    currently live or has already taken place. Rows persist after the
    meeting ends so they can populate "Recent Meetings" / history views.
    """

    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    meeting_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Instant Meeting")
    invite_url: Mapped[str] = mapped_column(String(500), nullable=False)

    host_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    status: Mapped[MeetingStatus] = mapped_column(
        Enum(MeetingStatus), default=MeetingStatus.ACTIVE, nullable=False, index=True
    )

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    scheduled_meeting_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("scheduled_meetings.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    host: Mapped["User"] = relationship("User", back_populates="hosted_meetings")
    participants: Mapped[List["Participant"]] = relationship(
        "Participant", back_populates="meeting", cascade="all, delete-orphan"
    )
    history_entries: Mapped[List["MeetingHistory"]] = relationship(
        "MeetingHistory", back_populates="meeting", cascade="all, delete-orphan"
    )
    scheduled_meeting: Mapped[Optional["ScheduledMeeting"]] = relationship(
        "ScheduledMeeting", back_populates="meeting_instances"
    )

    def __repr__(self) -> str:
        return f"<Meeting id={self.id} code={self.meeting_code} status={self.status}>"
