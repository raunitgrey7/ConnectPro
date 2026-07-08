"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { createMeeting } from "@/lib/api/meetings";

interface CreateMeetingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateMeetingModal({
  open,
  onClose,
  onSuccess,
}: CreateMeetingModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const meeting = await createMeeting({
        title: title || "Instant Meeting",
        host_name: hostName,
        host_email: hostEmail,
      });
      onSuccess?.();
      onClose();
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setHostName("");
    setHostEmail("");
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="New Meeting">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-error-container text-on-error-container text-sm rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            Meeting Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Instant Meeting"
            className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            Your Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            required
            placeholder="e.g. Alex Henderson"
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
            placeholder="e.g. alex@connectpro.com"
            className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
          />
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
            disabled={loading || !hostName || !hostEmail}
            className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Start Meeting"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
