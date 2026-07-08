"""ScheduledMeeting model — a future meeting planned by a host."""
import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, generate_uuid


class ScheduleStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    STARTED = "started"
    CANCELLED = "cancelled"


class ScheduledMeeting(Base, TimestampMixin):
    __tablename__ = "scheduled_meetings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    meeting_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    scheduled_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

    invite_url: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[ScheduleStatus] = mapped_column(
        Enum(ScheduleStatus), default=ScheduleStatus.UPCOMING, nullable=False, index=True
    )

    host_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relationships
    host: Mapped["User"] = relationship("User", back_populates="scheduled_meetings")
    meeting_instances: Mapped[List["Meeting"]] = relationship(
        "Meeting", back_populates="scheduled_meeting"
    )

    def __repr__(self) -> str:
        return f"<ScheduledMeeting id={self.id} title={self.title!r}>"
