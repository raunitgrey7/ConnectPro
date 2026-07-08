/* ------------------------------------------------------------------ */
/* Hooks for fetching meeting data from the backend.                   */
/* ------------------------------------------------------------------ */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getUpcomingMeetings,
  getRecentMeetings,
  getMeetingDetail,
} from "@/lib/api/meetings";
import type {
  ScheduledMeetingResponse,
  MeetingResponse,
  MeetingDetailResponse,
} from "@/lib/types/api";

// ─── Upcoming Meetings ──────────────────────────────────────────────

export function useUpcomingMeetings(limit = 10) {
  const [meetings, setMeetings] = useState<ScheduledMeetingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUpcomingMeetings(limit);
      setMeetings(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load upcoming meetings");
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { meetings, loading, error, refresh };
}

// ─── Recent Meetings ─────────────────────────────────────────────────

export function useRecentMeetings(limit = 10) {
  const [meetings, setMeetings] = useState<MeetingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecentMeetings(limit);
      setMeetings(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recent meetings");
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { meetings, loading, error, refresh };
}

// ─── Meeting Detail ──────────────────────────────────────────────────

export function useMeetingDetail(meetingId: string) {
  const [meeting, setMeeting] = useState<MeetingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!meetingId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMeetingDetail(meetingId);
      setMeeting(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meeting details");
      setMeeting(null);
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { meeting, loading, error, refresh };
}
