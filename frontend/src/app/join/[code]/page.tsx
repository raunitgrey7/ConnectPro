"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { joinMeeting } from "@/lib/api/meetings";

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const meetingCode = params.code as string;

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
      router.push(`/meeting/${result.meeting.meeting_code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-tight">ConnectPro</h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            You&apos;re joining meeting
          </p>
          <p className="font-mono text-lg font-bold text-on-surface mt-1">{meetingCode}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-outline-variant p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-on-surface mb-6">
            Enter your details to join
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-error-container text-on-error-container text-sm rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your name"
                autoFocus
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Your Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name || !email}
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining...
                </span>
              ) : (
                "Join Meeting"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          By joining, you agree to ConnectPro&apos;s Terms of Service.
        </p>
      </div>
    </div>
  );
}
