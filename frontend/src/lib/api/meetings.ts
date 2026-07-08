/* ------------------------------------------------------------------ */
/* Meeting-related API functions.                                      */
/* Each function maps 1:1 to a backend endpoint.                       */
/* ------------------------------------------------------------------ */

import { apiClient } from "./client";
import type {
  MeetingCreateRequest,
  MeetingJoinRequest,
  ScheduleMeetingRequest,
  MeetingResponse,
  MeetingDetailResponse,
  JoinMeetingResponse,
  ScheduledMeetingResponse,
} from "@/lib/types/api";

const PREFIX = "/api/meeting";

/** POST /api/meeting/create — create an instant meeting. */
export function createMeeting(data: MeetingCreateRequest): Promise<MeetingResponse> {
  return apiClient.post<MeetingResponse>(`${PREFIX}/create`, data);
}

/** POST /api/meeting/join — join a meeting by code or invite URL. */
export function joinMeeting(data: MeetingJoinRequest): Promise<JoinMeetingResponse> {
  return apiClient.post<JoinMeetingResponse>(`${PREFIX}/join`, data);
}

/** POST /api/meeting/schedule — schedule a future meeting. */
export function scheduleMeeting(data: ScheduleMeetingRequest): Promise<ScheduledMeetingResponse> {
  return apiClient.post<ScheduledMeetingResponse>(`${PREFIX}/schedule`, data);
}

/** GET /api/meeting/upcoming — list upcoming scheduled meetings. */
export function getUpcomingMeetings(limit = 10): Promise<ScheduledMeetingResponse[]> {
  return apiClient.get<ScheduledMeetingResponse[]>(`${PREFIX}/upcoming`, { limit });
}

/** GET /api/meeting/recent — list recent (past/active) meetings. */
export function getRecentMeetings(limit = 10): Promise<MeetingResponse[]> {
  return apiClient.get<MeetingResponse[]>(`${PREFIX}/recent`, { limit });
}

/** GET /api/meeting/{id} — get full meeting details + participants. */
export function getMeetingDetail(meetingId: string): Promise<MeetingDetailResponse> {
  return apiClient.get<MeetingDetailResponse>(`${PREFIX}/${meetingId}`);
}

/** DELETE /api/meeting/{id} — delete/end a meeting. */
export function deleteMeeting(meetingId: string): Promise<null> {
  return apiClient.delete<null>(`${PREFIX}/${meetingId}`);
}
