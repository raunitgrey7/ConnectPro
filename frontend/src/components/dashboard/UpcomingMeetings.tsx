"use client";

import MeetingCard from "./MeetingCard";
import type { ScheduledMeetingResponse } from "@/lib/types/api";

interface UpcomingMeetingsProps {
  meetings: ScheduledMeetingResponse[];
  loading: boolean;
  error: string | null;
  onJoin?: (code: string) => void;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-outline-variant p-6 flex flex-col md:flex-row gap-6 items-center">
      <div className="skeleton min-w-[80px] h-20 rounded-lg" />
      <div className="flex-grow space-y-3 w-full">
        <div className="skeleton h-5 w-3/5 rounded" />
        <div className="skeleton h-4 w-2/5 rounded" />
      </div>
      <div className="skeleton h-10 w-24 rounded-lg" />
    </div>
  );
}

export default function UpcomingMeetings({
  meetings,
  loading,
  error,
  onJoin,
}: UpcomingMeetingsProps) {
  return (
    <section className="lg:col-span-8 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Upcoming Meetings</h2>
        <button className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
          View Calendar{" "}
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant">
          <span className="material-symbols-outlined text-3xl mb-2 block text-error">
            error_outline
          </span>
          <p className="text-sm">{error}</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="p-8 text-center text-on-surface-variant bg-white rounded-xl border border-outline-variant">
          <span className="material-symbols-outlined text-4xl mb-2 block text-outline">
            event_available
          </span>
          <p className="font-medium">No upcoming meetings</p>
          <p className="text-xs mt-1">Schedule a meeting to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting, index) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              isFirst={index === 0}
              onJoin={onJoin}
            />
          ))}
        </div>
      )}
    </section>
  );
}
