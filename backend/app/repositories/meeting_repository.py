"""Data-access layer for Meeting, ScheduledMeeting and related entities."""
from datetime import datetime, timezone
from typing import List, Optional, Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.meeting import Meeting, MeetingStatus
from app.models.meeting_history import MeetingEventType, MeetingHistory
from app.models.participant import Participant
from app.models.scheduled_meeting import ScheduledMeeting, ScheduleStatus


class MeetingRepository:
    """Encapsulates all direct database access for meeting-related records."""

    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Meeting
    # ------------------------------------------------------------------
    def get_by_id(self, meeting_id: str) -> Optional[Meeting]:
        stmt = (
            select(Meeting)
            .options(joinedload(Meeting.host), joinedload(Meeting.participants))
            .where(Meeting.id == meeting_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_by_code(self, meeting_code: str) -> Optional[Meeting]:
        stmt = (
            select(Meeting)
            .options(joinedload(Meeting.host), joinedload(Meeting.participants))
            .where(Meeting.meeting_code == meeting_code)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def code_exists(self, meeting_code: str) -> bool:
        stmt = select(Meeting.id).where(Meeting.meeting_code == meeting_code)
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def create(
        self,
        meeting_code: str,
        title: str,
        invite_url: str,
        host_id: str,
        started_at: datetime,
        scheduled_meeting_id: Optional[str] = None,
    ) -> Meeting:
        meeting = Meeting(
            meeting_code=meeting_code,
            title=title,
            invite_url=invite_url,
            host_id=host_id,
            status=MeetingStatus.ACTIVE,
            started_at=started_at,
            scheduled_meeting_id=scheduled_meeting_id,
        )
        self.db.add(meeting)
        self.db.flush()
        return meeting

    def list_recent(self, limit: int = 10) -> Sequence[Meeting]:
        """Most recently started meetings (ended or active), newest first."""
        stmt = (
            select(Meeting)
            .options(joinedload(Meeting.host), joinedload(Meeting.participants))
            .order_by(Meeting.started_at.desc())
            .limit(limit)
        )
        return self.db.execute(stmt).unique().scalars().all()

    def end_meeting(self, meeting: Meeting, ended_at: datetime) -> Meeting:
        meeting.status = MeetingStatus.ENDED
        meeting.ended_at = ended_at
        meeting.duration_minutes = int((ended_at - meeting.started_at).total_seconds() // 60)
        self.db.flush()
        return meeting

    def delete(self, meeting: Meeting) -> None:
        self.db.delete(meeting)
        self.db.flush()

    # ------------------------------------------------------------------
    # ScheduledMeeting
    # ------------------------------------------------------------------
    def scheduled_code_exists(self, meeting_code: str) -> bool:
        stmt = select(ScheduledMeeting.id).where(ScheduledMeeting.meeting_code == meeting_code)
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def create_scheduled(
        self,
        meeting_code: str,
        title: str,
        description: Optional[str],
        scheduled_start: datetime,
        duration_minutes: int,
        invite_url: str,
        host_id: str,
    ) -> ScheduledMeeting:
        scheduled = ScheduledMeeting(
            meeting_code=meeting_code,
            title=title,
            description=description,
            scheduled_start=scheduled_start,
            duration_minutes=duration_minutes,
            invite_url=invite_url,
            host_id=host_id,
            status=ScheduleStatus.UPCOMING,
        )
        self.db.add(scheduled)
        self.db.flush()
        return scheduled

    def list_upcoming(self, limit: int = 10) -> Sequence[ScheduledMeeting]:
        stmt = (
            select(ScheduledMeeting)
            .options(joinedload(ScheduledMeeting.host))
            .where(
                ScheduledMeeting.status == ScheduleStatus.UPCOMING,
                ScheduledMeeting.scheduled_start >= datetime.now(timezone.utc),
            )
            .order_by(ScheduledMeeting.scheduled_start.asc())
            .limit(limit)
        )
        return self.db.execute(stmt).unique().scalars().all()

    # ------------------------------------------------------------------
    # Participant
    # ------------------------------------------------------------------
    def add_participant(
        self, meeting_id: str, user_id: str, joined_at: datetime, role: str = "attendee"
    ) -> Participant:
        participant = Participant(
            meeting_id=meeting_id, user_id=user_id, joined_at=joined_at, role=role
        )
        self.db.add(participant)
        self.db.flush()
        return participant

    # ------------------------------------------------------------------
    # MeetingHistory
    # ------------------------------------------------------------------
    def add_history_event(
        self,
        meeting_id: str,
        event_type: MeetingEventType,
        user_id: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> MeetingHistory:
        event = MeetingHistory(
            meeting_id=meeting_id, user_id=user_id, event_type=event_type, notes=notes
        )
        self.db.add(event)
        self.db.flush()
        return event
