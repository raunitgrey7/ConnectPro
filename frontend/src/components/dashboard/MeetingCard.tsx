"use client";

import type { ScheduledMeetingResponse } from "@/lib/types/api";

interface MeetingCardProps {
  meeting: ScheduledMeetingResponse;
  isFirst?: boolean;
  onJoin?: (code: string) => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }),
    day: d.getDate(),
    time: d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

function formatEndTime(dateStr: string, durationMinutes: number) {
  const d = new Date(dateStr);
  d.setMinutes(d.getMinutes() + durationMinutes);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MeetingCard({
  meeting,
  isFirst = false,
  onJoin,
}: MeetingCardProps) {
  const { month, day, time } = formatDate(meeting.scheduled_start);
  const endTime = formatEndTime(meeting.scheduled_start, meeting.duration_minutes);

  return (
    <div
      className={`bg-white rounded-xl border border-outline-variant p-6 meeting-card-hover flex flex-col md:flex-row gap-6 items-center relative overflow-hidden ${
        isFirst ? "" : ""
      }`}
    >
      {isFirst && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
      )}

      {/* Date Block */}
      <div className="flex flex-col items-center justify-center min-w-[80px] h-20 bg-surface-container-low rounded-lg">
        <span
          className={`text-xs font-bold uppercase ${
            isFirst ? "text-primary" : "text-on-surface-variant"
          }`}
        >
          {month}
        </span>
        <span className="text-2xl font-semibold">{day}</span>
      </div>

      {/* Info */}
      <div className="flex-grow space-y-1">
        <div className="flex items-center gap-2">
          {isFirst && (
            <span className="inline-block w-2 h-2 rounded-full bg-error animate-pulse" />
          )}
          <h3 className="text-lg font-semibold">{meeting.title}</h3>
        </div>
        <div className="flex flex-wrap gap-4 text-on-surface-variant text-xs">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {time} – {endTime}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">fingerprint</span>
            ID: {meeting.meeting_code}
          </span>
        </div>
        {meeting.host && (
          <div className="text-xs text-on-surface-variant mt-1">
            Host: {meeting.host.name}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 w-full md:w-auto">
        {isFirst ? (
          <button
            onClick={() => onJoin?.(meeting.meeting_code)}
            className="flex-grow md:flex-none px-8 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-container active:scale-95 transition-all"
          >
            Join
          </button>
        ) : (
          <button
            onClick={() => onJoin?.(meeting.meeting_code)}
            className="flex-grow md:flex-none px-8 py-2.5 border border-primary text-primary font-bold rounded-lg hover:bg-surface-container-low active:scale-95 transition-all"
          >
            Details
          </button>
        )}
      </div>
    </div>
  );
}
