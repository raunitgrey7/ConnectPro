/* ------------------------------------------------------------------ */
/* TypeScript interfaces matching backend Pydantic schemas exactly.   */
/* Generated from inspection of backend/app/schemas/*.py              */
/* ------------------------------------------------------------------ */

// ─── Enums ───────────────────────────────────────────────────────────
export type MeetingStatus = "active" | "ended";
export type ScheduleStatus = "upcoming" | "started" | "cancelled";

// ─── Generic API Envelope ────────────────────────────────────────────
export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

// ─── Health ──────────────────────────────────────────────────────────
export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  database: string;
}

// ─── Request Bodies ──────────────────────────────────────────────────
export interface MeetingCreateRequest {
  title?: string;
  host_name: string;
  host_email: string;
}

export interface MeetingJoinRequest {
  meeting_id?: string;
  invite_url?: string;
  participant_name: string;
  participant_email: string;
}

export interface ScheduleMeetingRequest {
  title: string;
  description?: string;
  date: string;           // YYYY-MM-DD
  time: string;           // HH:MM (24h)
  duration_minutes: number;
  host_name: string;
  host_email: string;
}

// ─── Response Bodies ─────────────────────────────────────────────────
export interface HostSummary {
  id: string;
  name: string;
  email: string;
}

export interface ParticipantSummary {
  id: string;
  user_id: string;
  joined_at: string;      // ISO 8601
  left_at: string | null;
  role: string;
}

export interface MeetingResponse {
  id: string;
  meeting_code: string;
  title: string;
  invite_url: string;
  status: MeetingStatus;
  started_at: string;     // ISO 8601
  ended_at: string | null;
  duration_minutes: number | null;
  host: HostSummary;
  participant_count: number;
}

export interface MeetingDetailResponse extends MeetingResponse {
  participants: ParticipantSummary[];
}

export interface ScheduledMeetingResponse {
  id: string;
  meeting_code: string;
  title: string;
  description: string | null;
  scheduled_start: string; // ISO 8601
  duration_minutes: number;
  invite_url: string;
  status: ScheduleStatus;
  host: HostSummary;
}

export interface JoinMeetingResponse {
  meeting: MeetingResponse;
  participant: ParticipantSummary;
}
