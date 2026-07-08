"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/ui/Modal";

interface PlaybackModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  duration: string;
}

export default function PlaybackModal({ open, onClose, title, duration }: PlaybackModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [speed, setSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Convert duration string "MM:SS" or "HH:MM:SS" to seconds
  const totalSeconds = (() => {
    const parts = duration.split(":").map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return parts[0] * 60 + parts[1];
  })();

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, totalSeconds]);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [open]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${m}:${String(s).padStart(2, "0")}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    setCurrentTime(Math.floor(percentage * totalSeconds));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md modal-overlay">
      <div className="bg-[#141414] w-full max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col modal-content">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between text-white bg-[#1a1a1a]">
          <div className="overflow-hidden mr-4">
            <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Cloud Recording Playback</div>
            <h2 className="text-base font-bold truncate mt-0.5">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                alert("Downloading recording mp4 file (mock)...");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-white rounded-lg font-semibold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative aspect-video bg-[#0a0a0a] flex items-center justify-center overflow-hidden group select-none">
          {/* Animated gradient wave effect background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-tertiary/10 opacity-60" />
          
          <div className="z-10 text-center px-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="material-symbols-outlined text-white text-5xl">cloud_done</span>
            </div>
            <h3 className="text-lg font-bold text-white">ConnectPro Cloud Recording</h3>
            <p className="text-sm text-white/50 mt-1">Video track placeholder — Audio & screenshare captured</p>
            {isPlaying && (
              <div className="flex items-center justify-center gap-1 mt-4">
                <span className="w-1.5 h-6 bg-primary rounded animate-[shimmer_1.2s_infinite]"></span>
                <span className="w-1.5 h-8 bg-primary rounded animate-[shimmer_1.2s_infinite_0.2s]"></span>
                <span className="w-1.5 h-10 bg-primary rounded animate-[shimmer_1.2s_infinite_0.4s]"></span>
                <span className="w-1.5 h-6 bg-primary rounded animate-[shimmer_1.2s_infinite_0.1s]"></span>
              </div>
            )}
          </div>

          {/* Click to play/pause screen overlay */}
          <div
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white backdrop-blur-md">
              <span className="material-symbols-outlined text-4xl">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </div>
          </div>
        </div>

        {/* Player Controls Bar */}
        <div className="p-4 bg-[#1a1a1a] text-white select-none">
          {/* Progress Bar */}
          <div
            onClick={handleProgressBarClick}
            className="w-full h-1.5 bg-white/10 rounded-full mb-4 cursor-pointer relative group"
          >
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
              style={{ width: `${(currentTime / totalSeconds) * 100}%` }}
            />
            <div
              className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-md border border-primary -top-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${(currentTime / totalSeconds) * 100}% - 7px)` }}
            />
          </div>

          {/* Buttons and Settings */}
          <div className="flex items-center justify-between">
            {/* Play/Pause & Time */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>

              <div className="text-xs font-mono text-white/70">
                <span>{formatTime(currentTime)}</span>
                <span className="mx-1.5 text-white/30">/</span>
                <span>{formatTime(totalSeconds)}</span>
              </div>
            </div>

            {/* Volume, Speed & Extra */}
            <div className="flex items-center gap-5">
              {/* Speed Button */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white/50 uppercase font-bold">Speed</span>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="bg-white/10 border border-white/10 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                >
                  <option value={0.5} className="bg-[#141414]">0.5x</option>
                  <option value={1.0} className="bg-[#141414]">1.0x</option>
                  <option value={1.25} className="bg-[#141414]">1.25x</option>
                  <option value={1.5} className="bg-[#141414]">1.5x</option>
                  <option value={2.0} className="bg-[#141414]">2.0x</option>
                </select>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">
                    {isMuted || volume === 0 ? "volume_off" : volume < 50 ? "volume_down" : "volume_up"}
                  </span>
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-20 accent-primary cursor-pointer h-1.5 bg-white/10 rounded-full outline-none"
                />
              </div>

              {/* Fullscreen icon */}
              <button
                onClick={() => {
                  alert("Fullscreen mode (mock)...");
                }}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">fullscreen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
