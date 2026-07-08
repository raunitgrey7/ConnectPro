"""Meeting-related Pydantic schemas (requests & responses)."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.meeting import MeetingStatus
from app.models.scheduled_meeting import ScheduleStatus


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------
class MeetingCreateRequest(BaseModel):
    title: Optional[str] = Field(default="Instant Meeting", max_length=255)
    host_name: str = Field(..., min_length=1, max_length=120)
    host_email: EmailStr


class MeetingJoinRequest(BaseModel):
    """Join by either meeting_id (code) or a full invite_url. At least one is required."""

    meeting_id: Optional[str] = Field(default=None, description="The meeting code, e.g. 'abc-defg-hij'")
    invite_url: Optional[str] = Field(default=None, description="Full invite link shared with the participant")
    participant_name: str = Field(..., min_length=1, max_length=120)
    participant_email: EmailStr

    @field_validator("invite_url")
    @classmethod
    def at_least_one_identifier(cls, v: Optional[str], info) -> Optional[str]:
        meeting_id = info.data.get("meeting_id")
        if not meeting_id and not v:
            raise ValueError("Either 'meeting_id' or 'invite_url' must be provided.")
        return v


class ScheduleMeetingRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    date: str = Field(..., description="Meeting date in YYYY-MM-DD format")
    time: str = Field(..., description="Meeting time in HH:MM (24h) format")
    duration_minutes: int = Field(..., gt=0, le=1440, description="Duration in minutes, must be positive")
    host_name: str = Field(..., min_length=1, max_length=120)
    host_email: EmailStr

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError("date must be in YYYY-MM-DD format") from exc
        return v

    @field_validator("time")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError as exc:
            raise ValueError("time must be in HH:MM (24h) format") from exc
        return v


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------
class HostSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: EmailStr


class ParticipantSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    joined_at: datetime
    left_at: Optional[datetime] = None
    role: str


class MeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_code: str
    title: str
    invite_url: str
    status: MeetingStatus
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    host: HostSummary
    participant_count: int = 0


class MeetingDetailResponse(MeetingResponse):
    participants: List[ParticipantSummary] = []


class ScheduledMeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_code: str
    title: str
    description: Optional[str] = None
    scheduled_start: datetime
    duration_minutes: int
    invite_url: str
    status: ScheduleStatus
    host: HostSummary


class JoinMeetingResponse(BaseModel):
    meeting: MeetingResponse
    participant: ParticipantSummary
