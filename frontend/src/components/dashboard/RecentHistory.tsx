"use client";

import type { MeetingResponse } from "@/lib/types/api";

interface RecentHistoryProps {
  meetings: MeetingResponse[];
  loading: boolean;
  error: string | null;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}

function formatDuration(minutes: number | null) {
  if (minutes === null || minutes === undefined) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-6 py-4"><div className="skeleton h-4 w-40 rounded" /></td>
      <td className="px-6 py-4 hidden sm:table-cell"><div className="skeleton h-4 w-20 rounded" /></td>
      <td className="px-6 py-4 hidden md:table-cell"><div className="skeleton h-4 w-16 rounded" /></td>
      <td className="px-6 py-4"><div className="skeleton h-4 w-28 rounded" /></td>
      <td className="px-6 py-4 text-right"><div className="skeleton h-4 w-14 rounded ml-auto" /></td>
    </tr>
  );
}

export default function RecentHistory({
  meetings,
  loading,
  error,
}: RecentHistoryProps) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Recent History</h2>

      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="px-6 py-4 text-sm font-medium text-on-surface-variant">
                Meeting Title
              </th>
              <th className="px-6 py-4 text-sm font-medium text-on-surface-variant hidden sm:table-cell">
                Duration
              </th>
              <th className="px-6 py-4 text-sm font-medium text-on-surface-variant hidden md:table-cell">
                Participants
              </th>
              <th className="px-6 py-4 text-sm font-medium text-on-surface-variant">
                Date
              </th>
              <th className="px-6 py-4 text-sm font-medium text-on-surface-variant text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-sm">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-error mr-1 align-middle">
                    error_outline
                  </span>
                  {error}
                </td>
              </tr>
            ) : meetings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                  No recent meetings yet.
                </td>
              </tr>
            ) : (
              meetings.map((meeting) => (
                <tr
                  key={meeting.id}
                  className="hover:bg-surface-container-lowest transition-colors"
                >
                  <td className="px-6 py-4 font-semibold">{meeting.title}</td>
                  <td className="px-6 py-4 text-on-surface-variant hidden sm:table-cell">
                    {formatDuration(meeting.duration_minutes)}
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant hidden md:table-cell">
                    {meeting.participant_count} {meeting.participant_count === 1 ? "Person" : "People"}
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">
                    {formatDate(meeting.started_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:underline text-sm font-medium">
                      Report
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
