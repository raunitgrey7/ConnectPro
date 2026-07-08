"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { joinMeeting } from "@/lib/api/meetings";

interface JoinMeetingModalProps {
  open: boolean;
  onClose: () => void;
  initialCode?: string;
}

export default function JoinMeetingModal({
  open,
  onClose,
  initialCode = "",
}: JoinMeetingModalProps) {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await joinMeeting({
        meeting_id: meetingCode,
        participant_name: name,
        participant_email: email,
      });
      onClose();
      router.push(`/meeting/${result.meeting.meeting_code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMeetingCode(initialCode);
    setName("");
    setEmail("");
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Join Meeting">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-error-container text-on-error-container text-sm rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            Meeting Code <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={meetingCode}
            onChange={(e) => setMeetingCode(e.target.value)}
            required
            placeholder="e.g. abc-defg-hij"
            className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            Your Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            disabled={loading || !meetingCode || !name || !email}
            className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Joining..." : "Join"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
