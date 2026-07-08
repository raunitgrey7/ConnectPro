"use client";

import Link from "next/link";

interface SideNavBarProps {
  activePage?: string;
  onNewMeeting?: () => void;
  onFeatureClick?: (feature: string) => void;
  onTabChange?: (tab: string) => void;
}

export default function SideNavBar({
  activePage = "dashboard",
  onNewMeeting,
  onFeatureClick,
  onTabChange,
}: SideNavBarProps) {
  const menuItems = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard", href: "#" },
    { id: "meetings", icon: "videocam", label: "Meetings", href: "#" },
    { id: "recordings", icon: "videocam_off", label: "Recordings", href: "#" },
    { id: "analytics", icon: "analytics", label: "Analytics", href: "#" },
    { id: "settings", icon: "settings", label: "Settings", href: "#" },
  ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-surface border-r border-outline-variant hidden md:flex flex-col p-4 gap-2">
      {/* Workspace Info */}
      <div className="mb-6">
        <div className="flex items-center gap-4 p-2">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container">
              videocam
            </span>
          </div>
          <div>
            <div className="text-sm font-bold">ProVideo</div>
            <div className="text-xs text-on-surface-variant">Enterprise Tier</div>
          </div>
        </div>
      </div>

      {/* New Meeting Button */}
      <button
        onClick={onNewMeeting}
        className="w-full bg-primary-container text-on-primary-container font-semibold rounded-lg py-3 px-4 flex items-center gap-4 mb-4 hover:bg-primary transition-colors active:scale-[0.98]"
      >
        <span className="material-symbols-outlined">add_circle</span>
        New Meeting
      </button>

      {/* Navigation */}
      <div className="flex flex-col gap-1">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={(e) => {
              e.preventDefault();
              if (onTabChange && ["dashboard", "meetings", "recordings", "settings"].includes(item.id)) {
                onTabChange(item.id);
              } else if (onFeatureClick) {
                onFeatureClick(item.label);
              }
            }}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all ${
              activePage === item.id
                ? "bg-primary-container text-on-primary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-outline-variant">
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onFeatureClick?.("Help");
          }}
          className="flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg"
        >
          <span className="material-symbols-outlined">help</span>
          Help
        </Link>
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onFeatureClick?.("Sign Out");
          }}
          className="flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg"
        >
          <span className="material-symbols-outlined">logout</span>
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
