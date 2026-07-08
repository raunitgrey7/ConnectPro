"""MeetingHistory model — immutable audit log of meeting lifecycle events."""
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, generate_uuid, utcnow


class MeetingEventType(str, enum.Enum):
    CREATED = "created"
    JOINED = "joined"
    LEFT = "left"
    ENDED = "ended"
    SCHEDULED = "scheduled"
    CANCELLED = "cancelled"


class MeetingHistory(Base):
    __tablename__ = "meeting_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)

    meeting_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    event_type: Mapped[MeetingEventType] = mapped_column(Enum(MeetingEventType), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="history_entries")

    def __repr__(self) -> str:
        return f"<MeetingHistory meeting_id={self.meeting_id} event={self.event_type}>"
