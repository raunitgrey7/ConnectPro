"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMeetingDetail } from "@/hooks/useMeetings";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

/* ─── Participant Tile ────────────────────────────────────────────── */
function ParticipantTile({
  name,
  isSelf,
  isMuted,
  isVideoOff,
}: {
  name: string;
  isSelf: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const bgColors = [
    "bg-primary-container",
    "bg-tertiary-container",
    "bg-secondary-container",
    "bg-primary",
    "bg-tertiary",
  ];
  const colorIndex = name.length % bgColors.length;

  return (
    <div className="relative rounded-xl overflow-hidden bg-surface-container-highest aspect-video group shadow-sm border border-outline-variant">
      {isVideoOff ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container">
          <div
            className={`w-20 h-20 rounded-full ${bgColors[colorIndex]} text-white flex items-center justify-center font-bold text-2xl mb-2`}
          >
            {initials}
          </div>
          <div className="text-on-surface-variant text-sm">Video Paused</div>
        </div>
      ) : (
        <div
          className={`absolute inset-0 ${bgColors[colorIndex]} flex items-center justify-center`}
        >
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
            {initials}
          </div>
        </div>
      )}

      <div className="absolute bottom-1 left-1 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-white text-sm flex items-center gap-1">
        <span
          className={`material-symbols-outlined text-[16px] ${isMuted ? "text-error" : ""}`}
          style={
            !isMuted
              ? { fontVariationSettings: "'FILL' 1" }
              : undefined
          }
        >
          {isMuted ? "mic_off" : "mic"}
        </span>
        <span>{isSelf ? "You" : name}</span>
      </div>
    </div>
  );
}

/* ─── Chat Sidebar ────────────────────────────────────────────────── */
function ChatSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { sender: "System", text: "Meeting started. Welcome!", time: "Now", isSelf: false },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: message,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSelf: true,
      },
    ]);
    setMessage("");
  };

  return (
    <aside
      className={`sidebar-transition fixed right-0 top-16 bottom-0 w-80 lg:w-96 bg-surface border-l border-outline-variant z-30 flex flex-col shadow-lg lg:shadow-none ${
        open
          ? "translate-x-0"
          : "translate-x-full lg:translate-x-0 lg:static"
      }`}
    >
      <div className="p-4 border-b border-outline-variant flex items-center justify-between">
        <h2 className="text-lg font-semibold">In-call Messages</h2>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-full hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="space-y-1">
            {msg.isSelf ? (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-on-surface-variant text-xs mb-1">
                  <span>{msg.time}</span>
                  <span className="font-bold text-primary">You</span>
                </div>
                <div className="bg-primary-container text-on-primary-container p-2 rounded-lg rounded-tr-none max-w-[90%] text-sm">
                  {msg.text}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                  <span className="font-bold text-on-surface">{msg.sender}</span>
                  <span>{msg.time}</span>
                </div>
                <div className="bg-surface-container-low p-2 rounded-lg rounded-tl-none max-w-[90%] text-sm">
                  {msg.text}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-surface-container-lowest">
        <div className="relative flex items-center">
          <input
            className="w-full bg-surface-container border border-outline-variant rounded-full px-4 py-2 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
            placeholder="Send a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="absolute right-2 p-1 text-primary hover:bg-primary-container/10 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ─── Meeting Room Page ───────────────────────────────────────────── */
export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const { meeting, loading, error } = useMeetingDetail(meetingId);
  const [chatOpen, setChatOpen] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Load defaults from settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const muteAudioSetting = localStorage.getItem("settings_mute_audio") === "true";
      const turnOffVideoSetting = localStorage.getItem("settings_turn_off_video") === "true";
      setMicOn(!muteAudioSetting);
      setCamOn(!turnOffVideoSetting);
    }
  }, []);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <LoadingSpinner className="mb-4" />
          <p className="text-on-surface-variant text-sm">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-5xl text-error mb-3 block">
            error_outline
          </span>
          <h2 className="text-xl font-semibold text-on-surface mb-2">
            Meeting Not Found
          </h2>
          <p className="text-sm text-on-surface-variant mb-6">
            {error || "This meeting doesn't exist or has ended."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-container transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Build participant list: host + participants
  const participants = [
    { name: "You", isSelf: true, isMuted: !micOn, isVideoOff: !camOn },
    ...(meeting.participants || []).slice(0, 5).map((p, i) => ({
      name: `Participant ${i + 1}`,
      isSelf: false,
      isMuted: i % 2 === 0,
      isVideoOff: i % 3 === 0,
    })),
  ];

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-on-surface">
      {/* ─── Header ────────────────────────────────────────────── */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-outline-variant bg-surface z-40">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-on-surface">
                {meeting.title}
              </h1>
              <span className="px-1 py-[1px] bg-surface-container-high text-on-surface-variant rounded text-[10px] font-bold tracking-tight">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant text-xs">
              <span>ID: {meeting.meeting_code}</span>
              <span className="mx-1">•</span>
              <span>{formatTimer(elapsed)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 px-2 py-1 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
            <span
              className="material-symbols-outlined text-[18px] recording-pulse"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              fiber_manual_record
            </span>
            <span>REC</span>
          </div>
          <div className="flex items-center gap-2 border-l border-outline-variant pl-4 ml-2">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs">
              {meeting.host?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto transition-all duration-300">
          <div className="video-grid h-full content-start">
            {participants.map((p, i) => (
              <ParticipantTile
                key={i}
                name={p.name}
                isSelf={p.isSelf}
                isMuted={p.isMuted}
                isVideoOff={p.isVideoOff}
              />
            ))}
          </div>
        </div>

        <ChatSidebar open={chatOpen} onClose={() => setChatOpen(false)} />
      </main>

      {/* ─── Floating Bottom Toolbar ──────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#242424]/90 backdrop-blur-xl px-6 py-2 rounded-2xl flex items-center gap-4 shadow-2xl border border-white/10">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all text-white ${
                micOn ? "bg-white/10 hover:bg-white/20" : "bg-error/20"
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {micOn ? "mic" : "mic_off"}
              </span>
              <span
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#242424] ${
                  micOn ? "bg-primary" : "bg-error"
                }`}
              />
            </button>
            <button
              onClick={() => setCamOn(!camOn)}
              className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all text-white ${
                camOn ? "bg-white/10 hover:bg-white/20" : "bg-error/20"
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {camOn ? "videocam" : "videocam_off"}
              </span>
              <span
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#242424] ${
                  camOn ? "bg-primary" : "bg-error"
                }`}
              />
            </button>
          </div>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Utility */}
          <div className="flex items-center gap-2">
            <button className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all">
              <span className="material-symbols-outlined text-[24px]">group</span>
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary text-[10px] font-bold rounded-full border border-[#242424]">
                {meeting.participant_count}
              </span>
            </button>
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">chat</span>
            </button>
            <button className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all">
              <span className="material-symbols-outlined text-[24px]">
                present_to_all
              </span>
            </button>
            <button className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all">
              <span className="material-symbols-outlined text-[24px]">
                add_reaction
              </span>
            </button>
            <button className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all">
              <span className="material-symbols-outlined text-[24px]">settings</span>
            </button>
          </div>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Leave */}
          <button
            onClick={() => router.push("/")}
            className="bg-error hover:bg-error/90 active:scale-95 px-6 py-2 rounded-xl text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-error/20"
          >
            <span className="material-symbols-outlined">call_end</span>
            <span className="hidden md:inline">Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
}
