"""
Business logic for meeting creation, joining, scheduling, retrieval and
deletion. This layer orchestrates repositories and enforces domain rules; it
never talks to the database directly.
"""
from datetime import datetime, timezone
from typing import List, Optional
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import (
    InvalidScheduleException,
    MeetingEndedException,
    MeetingNotFoundException,
)
from app.core.logging import get_logger
from app.models.meeting import Meeting
from app.models.meeting_history import MeetingEventType
from app.models.scheduled_meeting import ScheduledMeeting
from app.repositories.meeting_repository import MeetingRepository
from app.repositories.user_repository import UserRepository
from app.schemas.meeting import (
    MeetingCreateRequest,
    MeetingJoinRequest,
    ScheduleMeetingRequest,
)
from app.utils.id_generator import generate_meeting_code
from app.utils.url_generator import generate_invite_url

logger = get_logger(__name__)


class MeetingService:
    """Encapsulates all meeting-related business rules."""

    MAX_CODE_GENERATION_ATTEMPTS = 5

    def __init__(self, db: Session) -> None:
        self.db = db
        self.meeting_repo = MeetingRepository(db)
        self.user_repo = UserRepository(db)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _generate_unique_meeting_code(self) -> str:
        for _ in range(self.MAX_CODE_GENERATION_ATTEMPTS):
            code = generate_meeting_code(length=settings.MEETING_ID_LENGTH)
            if not self.meeting_repo.code_exists(code) and not self.meeting_repo.scheduled_code_exists(code):
                return code
        raise RuntimeError("Failed to generate a unique meeting code after multiple attempts.")

    @staticmethod
    def _extract_code_from_invite_url(invite_url: str) -> Optional[str]:
        """Extract the meeting code from '<base>/<meeting_code>?token=<token>'."""
        try:
            path = urlparse(invite_url).path
        except ValueError:
            return None
        segments = [seg for seg in path.split("/") if seg]
        return segments[-1] if segments else None

    @staticmethod
    def _to_response_dict(meeting: Meeting) -> dict:
        return {
            "id": meeting.id,
            "meeting_code": meeting.meeting_code,
            "title": meeting.title,
            "invite_url": meeting.invite_url,
            "status": meeting.status,
            "started_at": meeting.started_at,
            "ended_at": meeting.ended_at,
            "duration_minutes": meeting.duration_minutes,
            "host": meeting.host,
            "participant_count": len(meeting.participants),
        }

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------
    def create_meeting(self, payload: MeetingCreateRequest) -> dict:
        host = self.user_repo.get_or_create(name=payload.host_name, email=payload.host_email)

        meeting_code = self._generate_unique_meeting_code()
        invite_url = generate_invite_url(meeting_code)
        now = datetime.now(timezone.utc)

        meeting = self.meeting_repo.create(
            meeting_code=meeting_code,
            title=payload.title or "Instant Meeting",
            invite_url=invite_url,
            host_id=host.id,
            started_at=now,
        )

        # Host automatically joins as the first participant.
        self.meeting_repo.add_participant(
            meeting_id=meeting.id, user_id=host.id, joined_at=now, role="host"
        )
        self.meeting_repo.add_history_event(
            meeting_id=meeting.id,
            event_type=MeetingEventType.CREATED,
            user_id=host.id,
            notes=f"Meeting created by {host.name}",
        )

        self.db.commit()
        self.db.refresh(meeting)
        logger.info("Meeting created: %s (host=%s)", meeting.meeting_code, host.email)
        return self._to_response_dict(meeting)

    # ------------------------------------------------------------------
    # Join
    # ------------------------------------------------------------------
    def join_meeting(self, payload: MeetingJoinRequest) -> dict:
        meeting_code = payload.meeting_id
        if not meeting_code and payload.invite_url:
            meeting_code = self._extract_code_from_invite_url(payload.invite_url)

        if not meeting_code:
            raise InvalidScheduleException(
                "Could not determine a meeting code from the provided meeting_id or invite_url."
            )

        meeting = self.meeting_repo.get_by_code(meeting_code)
        if meeting is None:
            raise MeetingNotFoundException(meeting_code)

        if meeting.status.value == "ended":
            raise MeetingEndedException(meeting_code)

        participant_user = self.user_repo.get_or_create(
            name=payload.participant_name, email=payload.participant_email
        )
        now = datetime.now(timezone.utc)

        participant = self.meeting_repo.add_participant(
            meeting_id=meeting.id, user_id=participant_user.id, joined_at=now
        )
        self.meeting_repo.add_history_event(
            meeting_id=meeting.id,
            event_type=MeetingEventType.JOINED,
            user_id=participant_user.id,
            notes=f"{participant_user.name} joined the meeting",
        )

        self.db.commit()
        self.db.refresh(meeting)
        self.db.refresh(participant)
        logger.info("User %s joined meeting %s", participant_user.email, meeting_code)

        return {
            "meeting": self._to_response_dict(meeting),
            "participant": participant,
        }

    # ------------------------------------------------------------------
    # Schedule
    # ------------------------------------------------------------------
    def schedule_meeting(self, payload: ScheduleMeetingRequest) -> ScheduledMeeting:
        host = self.user_repo.get_or_create(name=payload.host_name, email=payload.host_email)

        scheduled_start = datetime.strptime(
            f"{payload.date} {payload.time}", "%Y-%m-%d %H:%M"
        ).replace(tzinfo=timezone.utc)

        if scheduled_start <= datetime.now(timezone.utc):
            raise InvalidScheduleException(
                "Scheduled date/time must be in the future.",
                details={"scheduled_start": scheduled_start.isoformat()},
            )

        if payload.duration_minutes <= 0:
            raise InvalidScheduleException("duration_minutes must be a positive integer.")

        meeting_code = self._generate_unique_meeting_code()
        invite_url = generate_invite_url(meeting_code)

        scheduled = self.meeting_repo.create_scheduled(
            meeting_code=meeting_code,
            title=payload.title,
            description=payload.description,
            scheduled_start=scheduled_start,
            duration_minutes=payload.duration_minutes,
            invite_url=invite_url,
            host_id=host.id,
        )

        self.db.commit()
        self.db.refresh(scheduled)
        logger.info("Meeting scheduled: %s at %s", scheduled.meeting_code, scheduled_start)
        return scheduled

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------
    def get_upcoming_meetings(self, limit: int = 10) -> List[ScheduledMeeting]:
        return list(self.meeting_repo.list_upcoming(limit=limit))

    def get_recent_meetings(self, limit: int = 10) -> List[dict]:
        meetings = self.meeting_repo.list_recent(limit=limit)
        return [self._to_response_dict(m) for m in meetings]

    def get_meeting_detail(self, meeting_id: str) -> Meeting:
        meeting = self.meeting_repo.get_by_id(meeting_id) or self.meeting_repo.get_by_code(meeting_id)
        if meeting is None:
            raise MeetingNotFoundException(meeting_id)
        return meeting

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------
    def delete_meeting(self, meeting_id: str) -> None:
        meeting = self.meeting_repo.get_by_id(meeting_id) or self.meeting_repo.get_by_code(meeting_id)
        if meeting is None:
            raise MeetingNotFoundException(meeting_id)

        self.meeting_repo.add_history_event(
            meeting_id=meeting.id,
            event_type=MeetingEventType.ENDED,
            notes="Meeting deleted/ended via API",
        )
        self.db.commit()

        self.meeting_repo.delete(meeting)
        self.db.commit()
        logger.info("Meeting deleted: %s", meeting_id)
