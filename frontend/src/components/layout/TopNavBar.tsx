"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface TopNavBarProps {
  activePage?: string;
  onFeatureClick?: (feature: string) => void;
  onTabChange?: (tab: string) => void;
}

export default function TopNavBar({
  activePage = "dashboard",
  onFeatureClick,
  onTabChange,
}: TopNavBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: "dashboard", label: "Dashboard", href: "#" },
    { id: "meetings", label: "Meetings", href: "#" },
    { id: "contacts", label: "Contacts", href: "#" },
    { id: "recordings", label: "Recording", href: "#" },
  ];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyPMI = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText("9113034488");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full h-16 bg-surface border-b border-outline-variant flex justify-between items-center px-6 fixed top-0 z-50">
      <div className="flex items-center gap-8">
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onTabChange?.("dashboard");
          }}
          className="text-2xl font-bold text-primary tracking-tight"
        >
          ConnectPro
        </Link>
        <nav className="hidden md:flex gap-0 h-16">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                if (onTabChange) {
                  onTabChange(item.id);
                } else if (onFeatureClick) {
                  onFeatureClick(item.label);
                }
              }}
              className={`flex items-center h-full px-3 text-sm font-medium transition-colors ${
                activePage === item.id || (item.id === "recordings" && activePage === "recordings")
                  ? "text-primary border-b-2 border-primary"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
            search
          </span>
          <input
            className="pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg w-64 focus:outline-none focus:border-primary transition-all text-sm"
            placeholder="Search meetings"
            type="text"
            onKeyDown={(e) => {
              if (e.key === "Enter" && onFeatureClick) {
                onFeatureClick("Search");
              }
            }}
          />
        </div>
        <button
          onClick={() => onFeatureClick?.("Notifications")}
          className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
        >
          notifications
        </button>
        <button
          onClick={() => onTabChange?.("settings")}
          className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
        >
          settings
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-bold cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all select-none"
          >
            AH
          </div>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-outline-variant rounded-2xl shadow-xl p-4 z-50 modal-content">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 mb-4 pb-3 border-b border-outline-variant/30">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-base font-bold">
                  AH
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-bold text-on-surface truncate">Alex Henderson</h4>
                  <p className="text-xs text-on-surface-variant truncate">alex.h@connectpro.com</p>
                  <span className="inline-block px-1.5 py-0.5 mt-1 bg-primary/10 text-primary font-bold rounded text-[9px] uppercase tracking-wide">
                    Pro Enterprise
                  </span>
                </div>
              </div>

              {/* Personal Meeting ID */}
              <div className="bg-surface-container-low rounded-xl p-3 mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-on-surface-variant uppercase font-semibold">Personal Meeting ID</div>
                  <div className="text-sm font-bold font-mono text-on-surface mt-0.5">911 303 4488</div>
                </div>
                <button
                  onClick={handleCopyPMI}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:bg-primary-container/10 px-2 py-1 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copied ? "check" : "content_copy"}
                  </span>
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Menu Actions */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onTabChange?.("settings");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low rounded-xl transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                    settings
                  </span>
                  <span>Account Settings</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onFeatureClick?.("Help Center");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low rounded-xl transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                    help
                  </span>
                  <span>Help Center</span>
                </button>
                <div className="h-px bg-outline-variant/30 my-2" />
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onFeatureClick?.("Sign Out");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error/5 rounded-xl transition-colors text-left font-semibold"
                >
                  <span className="material-symbols-outlined text-error text-[20px]">
                    logout
                  </span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
