"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { scheduleMeeting } from "@/lib/api/meetings";

interface ScheduleMeetingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ScheduleMeetingModal({
  open,
  onClose,
  onSuccess,
}: ScheduleMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [hostName, setHostName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await scheduleMeeting({
        title,
        description: description || undefined,
        date,
        time,
        duration_minutes: duration,
        host_name: hostName,
        host_email: hostEmail,
      });
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setDuration(60);
    setHostName("");
    setHostEmail("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  // Default minimum date is today
  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal open={open} onClose={handleClose} title="Schedule Meeting">
      {success ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-5xl text-primary mb-3 block">
            check_circle
          </span>
          <p className="text-lg font-semibold text-on-surface">Meeting Scheduled!</p>
          <p className="text-sm text-on-surface-variant mt-1">
            You&apos;ll find it in your upcoming meetings.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-error-container text-on-error-container text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Meeting Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Sprint Planning"
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Date <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                min={today}
                className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Time <span className="text-error">*</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Duration (minutes) <span className="text-error">*</span>
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Your Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Your Email <span className="text-error">*</span>
              </label>
              <input
                type="email"
                value={hostEmail}
                onChange={(e) => setHostEmail(e.target.value)}
                required
                placeholder="Your email"
                className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-outline-variant text-on-surface font-medium rounded-lg hover:bg-surface-container-low transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title || !date || !time || !hostName || !hostEmail}
              className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Scheduling..." : "Schedule"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
