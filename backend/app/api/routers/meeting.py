"""Meeting REST API endpoints."""
from fastapi import APIRouter, Depends, Query, status

from app.dependencies.db import get_meeting_service
from app.schemas.common import APIResponse
from app.schemas.meeting import (
    JoinMeetingResponse,
    MeetingCreateRequest,
    MeetingDetailResponse,
    MeetingJoinRequest,
    MeetingResponse,
    ScheduleMeetingRequest,
    ScheduledMeetingResponse,
)
from app.services.meeting_service import MeetingService

router = APIRouter(prefix="/meeting", tags=["Meetings"])


@router.post(
    "/create",
    response_model=APIResponse[MeetingResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create an instant meeting",
)
def create_meeting(
    payload: MeetingCreateRequest,
    service: MeetingService = Depends(get_meeting_service),
) -> APIResponse[MeetingResponse]:
    """
    Create a new instant meeting.

    - Generates a unique meeting code
    - Generates a secure, shareable invite URL
    - Registers the host as the first participant
    """
    result = service.create_meeting(payload)
    return APIResponse(message="Meeting created successfully.", data=result)


@router.post(
    "/join",
    response_model=APIResponse[JoinMeetingResponse],
    summary="Join an existing meeting",
)
def join_meeting(
    payload: MeetingJoinRequest,
    service: MeetingService = Depends(get_meeting_service),
) -> APIResponse[JoinMeetingResponse]:
    """
    Join a meeting using either its `meeting_id` (code) or its `invite_url`.

    Validates that the meeting exists and is still active before recording
    the participant.
    """
    result = service.join_meeting(payload)
    return APIResponse(message="Joined meeting successfully.", data=result)


@router.post(
    "/schedule",
    response_model=APIResponse[ScheduledMeetingResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Schedule a future meeting",
)
def schedule_meeting(
    payload: ScheduleMeetingRequest,
    service: MeetingService = Depends(get_meeting_service),
) -> APIResponse[ScheduledMeetingResponse]:
    """
    Schedule a meeting for a future date/time.

    Validates that the date/time is well-formed and in the future, and that
    the duration is a positive number of minutes.
    """
    result = service.schedule_meeting(payload)
    return APIResponse(message="Meeting scheduled successfully.", data=result)


@router.get(
    "/upcoming",
    response_model=APIResponse[list[ScheduledMeetingResponse]],
    summary="List upcoming scheduled meetings",
)
def get_upcoming_meetings(
    limit: int = Query(default=10, ge=1, le=100),
    service: MeetingService = Depends(get_meeting_service),
) -> APIResponse[list[ScheduledMeetingResponse]]:
    """Return upcoming scheduled meetings, soonest first. Powers the landing dashboard."""
    result = service.get_upcoming_meetings(limit=limit)
    return APIResponse(message="Upcoming meetings retrieved.", data=result)


@router.get(
    "/recent",
    response_model=APIResponse[list[MeetingResponse]],
    summary="List recent meetings",
)
def get_recent_meetings(
    limit: int = Query(default=10, ge=1, le=100),
    service: MeetingService = Depends(get_meeting_service),
) -> APIResponse[list[MeetingResponse]]:
    """Return the most recently started/completed meetings. Powers the landing dashboard."""
    result = service.get_recent_meetings(limit=limit)
    return APIResponse(message="Recent meetings retrieved.", data=result)


@router.get(
    "/{meeting_id}",
    response_model=APIResponse[MeetingDetailResponse],
    summary="Get meeting details",
)
def get_meeting_detail(
    meeting_id: str,
    service: MeetingService = Depends(get_meeting_service),
) -> APIResponse[MeetingDetailResponse]:
    """Fetch full details for a meeting, including its participant roster. Accepts either the DB id or the meeting_code."""
    meeting = service.get_meeting_detail(meeting_id)
    data = MeetingDetailResponse(
        id=meeting.id,
        meeting_code=meeting.meeting_code,
        title=meeting.title,
        invite_url=meeting.invite_url,
        status=meeting.status,
        started_at=meeting.started_at,
        ended_at=meeting.ended_at,
        duration_minutes=meeting.duration_minutes,
        host=meeting.host,
        participant_count=len(meeting.participants),
        participants=meeting.participants,
    )
    return APIResponse(message="Meeting details retrieved.", data=data)


@router.delete(
    "/{meeting_id}",
    response_model=APIResponse[None],
    summary="Delete / end a meeting",
)
def delete_meeting(
    meeting_id: str,
    service: MeetingService = Depends(get_meeting_service),
) -> APIResponse[None]:
    """Delete a meeting (and cascade-delete its participants) and record an 'ended' history event."""
    service.delete_meeting(meeting_id)
    return APIResponse(message="Meeting deleted successfully.", data=None)
