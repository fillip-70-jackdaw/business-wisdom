"use client";

import { useState } from "react";

// Common timezones for dropdown
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
];

interface EmailPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: {
    email_enabled: boolean;
    email_time: string;
    email_timezone: string;
  } | null;
  onSave: () => void;
}

// Generate time options (every 30 minutes)
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  const display = new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { value: time, display };
});

export function EmailPreferencesModal({
  isOpen,
  onClose,
  currentPreferences,
  onSave,
}: EmailPreferencesModalProps) {
  const [enabled, setEnabled] = useState(
    currentPreferences?.email_enabled ?? false
  );
  const [time, setTime] = useState(
    currentPreferences?.email_time?.slice(0, 5) ?? "08:00"
  );
  const [timezone, setTimezone] = useState(
    currentPreferences?.email_timezone ?? "America/New_York"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/daily/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_enabled: enabled,
          email_time: time,
          email_timezone: timezone,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      onSave();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save preferences"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-lg font-semibold text-[var(--parchment)] mb-1">
          Email Digest
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-6">
          Receive daily wisdom in your inbox
        </p>

        {/* Form */}
        <div className="space-y-5">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-[var(--text)]">
              Daily email digest
            </label>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${enabled ? "bg-[var(--hermes)]" : "bg-[var(--surface-2)]"}
              `}
            >
              <span
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                  ${enabled ? "left-6" : "left-1"}
                `}
              />
            </button>
          </div>

          {enabled && (
            <>
              {/* Time Select */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Delivery time
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:ring-1 focus:ring-[var(--tan)] outline-none"
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timezone Select */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:ring-1 focus:ring-[var(--tan)] outline-none"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-[var(--tan)] text-[var(--bg)] rounded-lg text-sm font-medium hover:bg-[var(--brass)] transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
