"use client";

interface BottomNavBarProps {
  activePage?: string;
  onTabChange?: (tab: string) => void;
}

export default function BottomNavBar({ activePage = "dashboard", onTabChange }: BottomNavBarProps) {
  const items = [
    { id: "dashboard", icon: "home", label: "Home" },
    { id: "meetings", icon: "calendar_today", label: "Meetings" },
    { id: "contacts", icon: "person", label: "Contacts" },
    { id: "recordings", icon: "history", label: "Recordings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-[env(safe-area-inset-bottom)] bg-surface border-t border-outline-variant shadow-sm h-20 md:hidden">
      {items.map((item) => {
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange?.(item.id)}
            className={`flex flex-col items-center justify-center active:scale-95 transition-transform duration-150 cursor-pointer ${
              isActive ? "text-primary font-bold" : "text-on-surface-variant"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
