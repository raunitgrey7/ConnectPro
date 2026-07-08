"""
Seed the database with realistic dummy data:
  - Dummy users
  - 10 upcoming (scheduled) meetings
  - 10 recent (past/active) meetings, each with a few participants
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.database.session import SessionLocal
from app.models.meeting import Meeting, MeetingStatus
from app.models.meeting_history import MeetingEventType, MeetingHistory
from app.models.participant import Participant
from app.models.scheduled_meeting import ScheduledMeeting, ScheduleStatus
from app.models.user import User
from app.utils.id_generator import generate_meeting_code
from app.utils.url_generator import generate_invite_url

logger = get_logger(__name__)

DUMMY_USERS = [
    {"name": "Alice Johnson", "email": "alice.johnson@example.com"},
    {"name": "Brian Kim", "email": "brian.kim@example.com"},
    {"name": "Carla Mendes", "email": "carla.mendes@example.com"},
    {"name": "David Chen", "email": "david.chen@example.com"},
    {"name": "Emma Davis", "email": "emma.davis@example.com"},
    {"name": "Farhan Ali", "email": "farhan.ali@example.com"},
    {"name": "Grace Lee", "email": "grace.lee@example.com"},
    {"name": "Henry Osei", "email": "henry.osei@example.com"},
]

MEETING_TITLES = [
    "Weekly Engineering Sync",
    "Product Roadmap Review",
    "Design Critique",
    "Sprint Retrospective",
    "1:1 with Manager",
    "Marketing Standup",
    "Customer Onboarding Call",
    "Quarterly Business Review",
    "Hiring Panel Interview",
    "All Hands Meeting",
]


def _already_seeded(db: Session) -> bool:
    return db.query(User).count() > 0


def seed_users(db: Session) -> list[User]:
    users = [User(name=u["name"], email=u["email"]) for u in DUMMY_USERS]
    db.add_all(users)
    db.flush()
    return users


def seed_upcoming_meetings(db: Session, users: list[User]) -> None:
    now = datetime.now(timezone.utc)
    for i in range(10):
        host = users[i % len(users)]
        code = generate_meeting_code()
        scheduled_start = now + timedelta(days=i + 1, hours=(i % 5))
        scheduled = ScheduledMeeting(
            meeting_code=code,
            title=MEETING_TITLES[i % len(MEETING_TITLES)],
            description=f"Auto-generated seed data for upcoming meeting #{i + 1}.",
            scheduled_start=scheduled_start,
            duration_minutes=[30, 45, 60][i % 3],
            invite_url=generate_invite_url(code),
            host_id=host.id,
            status=ScheduleStatus.UPCOMING,
        )
        db.add(scheduled)
        db.flush()
        db.add(
            MeetingHistory(
                meeting_id=scheduled.id,
                user_id=host.id,
                event_type=MeetingEventType.SCHEDULED,
                notes=f"Seed data: scheduled by {host.name}",
            )
        )


def seed_recent_meetings(db: Session, users: list[User]) -> None:
    now = datetime.now(timezone.utc)
    for i in range(10):
        host = users[i % len(users)]
        code = generate_meeting_code()
        started_at = now - timedelta(days=i + 1, hours=(i % 4))
        duration = [15, 30, 45, 60][i % 4]
        ended_at = started_at + timedelta(minutes=duration)

        meeting = Meeting(
            meeting_code=code,
            title=MEETING_TITLES[(i + 3) % len(MEETING_TITLES)],
            invite_url=generate_invite_url(code),
            host_id=host.id,
            status=MeetingStatus.ENDED,
            started_at=started_at,
            ended_at=ended_at,
            duration_minutes=duration,
        )
        db.add(meeting)
        db.flush()

        db.add(
            Participant(
                meeting_id=meeting.id,
                user_id=host.id,
                joined_at=started_at,
                left_at=ended_at,
                role="host",
            )
        )
        # Add 1-3 additional attendees per meeting.
        attendee_count = (i % 3) + 1
        for j in range(attendee_count):
            attendee = users[(i + j + 1) % len(users)]
            db.add(
                Participant(
                    meeting_id=meeting.id,
                    user_id=attendee.id,
                    joined_at=started_at + timedelta(minutes=j + 1),
                    left_at=ended_at,
                    role="attendee",
                )
            )

        db.add(
            MeetingHistory(
                meeting_id=meeting.id,
                user_id=host.id,
                event_type=MeetingEventType.CREATED,
                notes="Seed data: meeting created",
            )
        )
        db.add(
            MeetingHistory(
                meeting_id=meeting.id,
                user_id=host.id,
                event_type=MeetingEventType.ENDED,
                notes="Seed data: meeting ended",
            )
        )

    # One currently-active meeting so /meeting/recent and joining flows
    # have a live example to work with.
    host = users[0]
    code = generate_meeting_code()
    live_meeting = Meeting(
        meeting_code=code,
        title="Live Demo Meeting",
        invite_url=generate_invite_url(code),
        host_id=host.id,
        status=MeetingStatus.ACTIVE,
        started_at=now - timedelta(minutes=5),
    )
    db.add(live_meeting)
    db.flush()
    db.add(
        Participant(
            meeting_id=live_meeting.id, user_id=host.id, joined_at=now - timedelta(minutes=5), role="host"
        )
    )
    db.add(
        MeetingHistory(
            meeting_id=live_meeting.id,
            user_id=host.id,
            event_type=MeetingEventType.CREATED,
            notes="Seed data: live demo meeting",
        )
    )


def run_seed(force: bool = False) -> None:
    """Entry point for seeding the database. Safe to call multiple times (no-ops if already seeded)."""
    db = SessionLocal()
    try:
        if _already_seeded(db) and not force:
            logger.info("Database already contains data; skipping seed.")
            return

        logger.info("Seeding database with dummy users and meetings...")
        users = seed_users(db)
        seed_upcoming_meetings(db, users)
        seed_recent_meetings(db, users)
        db.commit()
        logger.info("Seed complete: %d users, 10 upcoming meetings, 11 recent/active meetings.", len(users))
    except Exception:
        db.rollback()
        logger.exception("Seeding failed; rolled back.")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
