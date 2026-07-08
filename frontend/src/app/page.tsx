"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNavBar from "@/components/layout/TopNavBar";
import SideNavBar from "@/components/layout/SideNavBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import UpcomingMeetings from "@/components/dashboard/UpcomingMeetings";
import PersonalInfoCard from "@/components/dashboard/PersonalInfoCard";
import RecentHistory from "@/components/dashboard/RecentHistory";
import CreateMeetingModal from "@/components/modals/CreateMeetingModal";
import JoinMeetingModal from "@/components/modals/JoinMeetingModal";
import ScheduleMeetingModal from "@/components/modals/ScheduleMeetingModal";
import PlaybackModal from "@/components/modals/PlaybackModal";
import { useUpcomingMeetings, useRecentMeetings } from "@/hooks/useMeetings";
import { deleteMeeting, createMeeting } from "@/lib/api/meetings";

export default function DashboardPage() {
  const router = useRouter();
  
  // Tab and Modal states
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [playbackOpen, setPlaybackOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<{ title: string; duration: string } | null>(null);
  
  const [joinCode, setJoinCode] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Settings states
  const [muteAudio, setMuteAudio] = useState(false);
  const [turnOffVideo, setTurnOffVideo] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load Settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setMuteAudio(localStorage.getItem("settings_mute_audio") === "true");
      setTurnOffVideo(localStorage.getItem("settings_turn_off_video") === "true");
      const isDark = localStorage.getItem("settings_dark_mode") === "true";
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const {
    meetings: upcoming,
    loading: upcomingLoading,
    error: upcomingError,
    refresh: refreshUpcoming,
  } = useUpcomingMeetings(10);

  const {
    meetings: recent,
    loading: recentLoading,
    error: recentError,
    refresh: refreshRecent,
  } = useRecentMeetings(10);

  const handleJoinFromCard = useCallback((code: string) => {
    setJoinCode(code);
    setJoinOpen(true);
  }, []);

  const handleScheduleSuccess = useCallback(() => {
    refreshUpcoming();
    setActiveTab("meetings");
  }, [refreshUpcoming]);

  const handleCreateSuccess = useCallback(() => {
    refreshRecent();
  }, [refreshRecent]);

  const handleFeatureClick = useCallback((name: string) => {
    setToast(`${name} is only available in the Pro Enterprise Tier.`);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  return (
    <>
      <TopNavBar activePage={activeTab} onFeatureClick={handleFeatureClick} onTabChange={setActiveTab} />
      <SideNavBar
        activePage={activeTab}
        onNewMeeting={() => setCreateOpen(true)}
        onFeatureClick={handleFeatureClick}
        onTabChange={setActiveTab}
      />

      <main className="md:ml-64 pt-24 px-4 md:px-8 pb-24 max-w-[1280px] mx-auto min-h-[calc(100vh-16px)]">
        
        {/* ─── 1. Home Dashboard Tab ───────────────────────────────── */}
        {activeTab === "dashboard" && (
          <>
            <section className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div>
                <h1 className="text-4xl font-bold text-on-surface mb-2 tracking-tight">
                  Welcome back, Alex
                </h1>
                <p className="text-base text-on-surface-variant">
                  {upcoming.length > 0
                    ? `You have ${upcoming.length} meeting${upcoming.length !== 1 ? "s" : ""} scheduled.`
                    : "No meetings scheduled. Start one now!"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setCreateOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl bg-primary-container text-white shadow-sm hover:opacity-90 transition-all active:scale-95 cursor-pointer"
                >
                  <span
                    className="material-symbols-outlined text-4xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    video_call
                  </span>
                  <span className="text-lg font-semibold">New Meeting</span>
                </button>
                <button
                  onClick={() => {
                    setJoinCode("");
                    setJoinOpen(true);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl bg-white border border-outline-variant text-on-surface shadow-sm hover:bg-surface-container-low transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-4xl text-primary">
                    add_box
                  </span>
                  <span className="text-lg font-semibold">Join</span>
                </button>
                <button
                  onClick={() => setScheduleOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl bg-white border border-outline-variant text-on-surface shadow-sm hover:bg-surface-container-low transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-4xl text-primary">
                    calendar_month
                  </span>
                  <span className="text-lg font-semibold">Schedule</span>
                </button>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <UpcomingMeetings
                meetings={upcoming}
                loading={upcomingLoading}
                error={upcomingError}
                onJoin={handleJoinFromCard}
              />
              <PersonalInfoCard />
            </div>

            <RecentHistory
              meetings={recent}
              loading={recentLoading}
              error={recentError}
            />
          </>
        )}

        {/* ─── 2. Meetings Management Tab ─────────────────────────── */}
        {activeTab === "meetings" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant pb-4 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-on-surface tracking-tight">My Meetings</h1>
                <p className="text-sm text-on-surface-variant">View and manage your scheduled conferences.</p>
              </div>
              <button
                onClick={() => setScheduleOpen(true)}
                className="px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-container transition-all text-sm flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-base">calendar_today</span>
                Schedule a Meeting
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-on-surface">Scheduled Meetings</h2>
              {upcomingLoading ? (
                <div className="p-8 text-center text-on-surface-variant text-sm">Loading meetings...</div>
              ) : upcoming.length === 0 ? (
                <div className="border border-dashed border-outline-variant rounded-2xl p-12 text-center bg-white/50">
                  <span className="material-symbols-outlined text-4xl text-outline mb-3 block">calendar_today</span>
                  <p className="text-on-surface font-semibold text-sm">No Scheduled Meetings</p>
                  <p className="text-xs text-on-surface-variant mt-1">Start by scheduling a meeting for you and your team.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {upcoming.map((meet) => (
                    <div
                      key={meet.id}
                      className="bg-white border border-outline-variant rounded-xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-on-surface">{meet.title}</h3>
                          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded uppercase">
                            Scheduled
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {new Date(meet.scheduled_start).toLocaleString()} ({meet.duration_minutes} mins)
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <span className="material-symbols-outlined text-sm font-mono">vpn_key</span>
                            ID: {meet.meeting_code}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          onClick={() => router.push(`/meeting/${meet.meeting_code}`)}
                          className="flex-1 md:flex-none px-4 py-2 bg-primary text-white font-semibold text-xs rounded-lg hover:bg-primary-container transition-all active:scale-[0.98] cursor-pointer"
                        >
                          Start
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/join/${meet.meeting_code}`);
                            setToast("Invite link copied to clipboard!");
                            setTimeout(() => setToast(null), 3000);
                          }}
                          className="flex-1 md:flex-none px-4 py-2 border border-outline-variant text-on-surface font-semibold text-xs rounded-lg hover:bg-surface-container-low transition-all active:scale-[0.98] cursor-pointer"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm("Are you sure you want to cancel this meeting?")) {
                              try {
                                await deleteMeeting(meet.id);
                                refreshUpcoming();
                                setToast("Meeting canceled successfully.");
                                setTimeout(() => setToast(null), 3000);
                              } catch (err) {
                                alert("Failed to cancel meeting.");
                              }
                            }
                          }}
                          className="p-2 border border-outline-variant text-on-surface-variant hover:bg-error-container hover:text-on-error hover:border-error-container rounded-lg transition-all cursor-pointer"
                          title="Delete Meeting"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── 3. Recordings History Tab ──────────────────────────── */}
        {activeTab === "recordings" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-outline-variant pb-4">
              <h1 className="text-3xl font-bold text-on-surface tracking-tight">Cloud Recordings</h1>
              <p className="text-sm text-on-surface-variant">Access your saved meetings, screen shares, and transcripts.</p>
            </div>

            <div className="grid gap-4">
              {[
                {
                  id: "rec-1",
                  title: "Q3 Sales Pipeline & Strategy Sync",
                  date: "Yesterday at 3:15 PM",
                  duration: "45:12",
                  size: "124 MB",
                  views: 14,
                },
                {
                  id: "rec-2",
                  title: "Engineering Team Standup & Backlog Grooming",
                  date: "July 6, 2026 at 10:00 AM",
                  duration: "30:00",
                  size: "82 MB",
                  views: 8,
                },
                {
                  id: "rec-3",
                  title: "ConnectPro Platform Beta Vibe Check",
                  date: "July 5, 2026 at 4:30 PM",
                  duration: "58:45",
                  size: "161 MB",
                  views: 22,
                },
                ...recent.slice(0, 3).map((r, idx) => ({
                  id: `rec-recent-${idx}`,
                  title: r.title || "Instant Meeting",
                  date: new Date(r.started_at).toLocaleDateString() + " at " + new Date(r.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  duration: "12:34",
                  size: "34 MB",
                  views: 1,
                }))
              ].map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white border border-outline-variant rounded-xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-on-surface">{rec.title}</h3>
                      <span className="text-[10px] bg-secondary-container text-on-secondary-container font-bold px-2 py-0.5 rounded uppercase">
                        Cloud MP4
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {rec.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {rec.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">hard_drive</span>
                        {rec.size}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        {rec.views} views
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => {
                        setSelectedRecording({
                          title: rec.title,
                          duration: rec.duration,
                        });
                        setPlaybackOpen(true);
                      }}
                      className="flex-1 md:flex-none px-4 py-2 bg-primary text-white font-semibold text-xs rounded-lg hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      Play
                    </button>
                    <button
                      onClick={() => {
                        alert("Recording share link copied to clipboard! (mock)");
                      }}
                      className="flex-1 md:flex-none px-4 py-2 border border-outline-variant text-on-surface font-semibold text-xs rounded-lg hover:bg-surface-container-low transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">share</span>
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 4. Contacts Tab ────────────────────────────────────── */}
        {activeTab === "contacts" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-outline-variant pb-4">
              <h1 className="text-3xl font-bold text-on-surface tracking-tight">Contacts Directory</h1>
              <p className="text-sm text-on-surface-variant">Initiate instant video meetings with your team members.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Alice Johnson", email: "alice.j@connectpro.com", role: "Engineering Lead", status: "In a Meeting" },
                { name: "Brian Kim", email: "brian.k@connectpro.com", role: "Product Manager", status: "Available" },
                { name: "Carla Mendes", email: "carla.m@connectpro.com", role: "UX Designer", status: "Away" },
                { name: "David Chen", email: "david.c@connectpro.com", role: "Frontend Developer", status: "Offline" },
                { name: "Emily Taylor", email: "emily.t@connectpro.com", role: "QA Engineer", status: "Available" },
                { name: "Frank Russo", email: "frank.r@connectpro.com", role: "SecOps Specialist", status: "Available" },
              ].map((contact, idx) => {
                const initials = contact.name.split(" ").map(n => n[0]).join("");
                const isOnline = contact.status === "Available" || contact.status === "In a Meeting";
                
                return (
                  <div key={idx} className="bg-white border border-outline-variant rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-all">
                    <div className="relative select-none">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                        {initials}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        contact.status === "Available" ? "bg-green-500" :
                        contact.status === "In a Meeting" ? "bg-red-500" :
                        contact.status === "Away" ? "bg-yellow-500" : "bg-gray-400"
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-on-surface truncate">{contact.name}</h4>
                      <p className="text-xs text-on-surface-variant truncate">{contact.role}</p>
                      <p className="text-[10px] text-outline truncate">{contact.email}</p>
                    </div>

                    {isOnline && (
                      <button
                        onClick={async () => {
                          setToast(`Calling ${contact.name}... starting meeting...`);
                          try {
                            const meet = await createMeeting({
                              title: `Meeting with ${contact.name}`,
                              host_name: "Alex Henderson",
                              host_email: "alex.h@connectpro.com"
                            });
                            setTimeout(() => {
                              router.push(`/meeting/${meet.meeting_code}`);
                            }, 1000);
                          } catch (err) {
                            alert("Failed to start instant meeting.");
                          }
                        }}
                        className="p-2 bg-primary-container text-white rounded-lg hover:bg-primary transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
                        title="Meet Now"
                      >
                        <span className="material-symbols-outlined text-[20px]">videocam</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── 5. Settings Tab ────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-outline-variant pb-4">
              <h1 className="text-3xl font-bold text-on-surface tracking-tight">Client Settings</h1>
              <p className="text-sm text-on-surface-variant">Customize your defaults for call interactions and appearance.</p>
            </div>

            <div className="bg-white border border-outline-variant rounded-2xl p-6 space-y-6 max-w-2xl">
              
              {/* Audio Settings */}
              <div>
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">volume_up</span>
                  Audio Settings
                </h3>
                <div className="space-y-1">
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer select-none">
                    <div>
                      <div className="text-sm font-semibold text-on-surface">Mute microphone when joining</div>
                      <div className="text-xs text-on-surface-variant">Automatically disable your mic on entry.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={muteAudio}
                      onChange={(e) => {
                        setMuteAudio(e.target.checked);
                        localStorage.setItem("settings_mute_audio", String(e.target.checked));
                      }}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="h-px bg-outline-variant/30" />

              {/* Video Settings */}
              <div>
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">videocam</span>
                  Video Settings
                </h3>
                <div className="space-y-1">
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer select-none">
                    <div>
                      <div className="text-sm font-semibold text-on-surface">Turn off video when joining</div>
                      <div className="text-xs text-on-surface-variant">Automatically disable your webcam on entry.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={turnOffVideo}
                      onChange={(e) => {
                        setTurnOffVideo(e.target.checked);
                        localStorage.setItem("settings_turn_off_video", String(e.target.checked));
                      }}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="h-px bg-outline-variant/30" />

              {/* Appearance / Theme Settings */}
              <div>
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">palette</span>
                  Appearance Settings
                </h3>
                <div className="space-y-1">
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer select-none">
                    <div>
                      <div className="text-sm font-semibold text-on-surface">Enable Dark Mode Theme</div>
                      <div className="text-xs text-on-surface-variant">Switch colors to an eye-friendly dark layout.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => {
                        setDarkMode(e.target.checked);
                        localStorage.setItem("settings_dark_mode", String(e.target.checked));
                        if (e.target.checked) {
                          document.documentElement.classList.add("dark");
                        } else {
                          document.documentElement.classList.remove("dark");
                        }
                      }}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </label>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      <BottomNavBar activePage={activeTab} onTabChange={setActiveTab} />

      {/* ─── FAB (Mobile) ──────────────────────────────────────────── */}
      {activeTab === "dashboard" && (
        <button
          onClick={() => setCreateOpen(true)}
          className="fixed bottom-24 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-primary-container text-on-primary-container rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 md:hidden"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      )}

      {/* ─── Modals ────────────────────────────────────────────────── */}
      <CreateMeetingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <JoinMeetingModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        initialCode={joinCode}
      />
      <ScheduleMeetingModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSuccess={handleScheduleSuccess}
      />
      
      {/* Mock Cloud Video Playback Modal */}
      {selectedRecording && (
        <PlaybackModal
          open={playbackOpen}
          onClose={() => setPlaybackOpen(false)}
          title={selectedRecording.title}
          duration={selectedRecording.duration}
        />
      )}

      {/* ─── Toast Notification ─────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] bg-[#242424] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 animate-slide-in max-w-sm">
          <span className="material-symbols-outlined text-primary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            info
          </span>
          <span className="text-sm font-medium">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-white/60 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
    </>
  );
}
