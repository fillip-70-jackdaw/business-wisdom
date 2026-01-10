"use client";

import { useState } from "react";

interface SaveArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, title?: string) => Promise<void>;
}

export function SaveArticleModal({
  isOpen,
  onClose,
  onSave,
}: SaveArticleModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Basic URL validation
      try {
        new URL(url);
      } catch {
        throw new Error("Please enter a valid URL");
      }

      await onSave(url, title || undefined);
      setUrl("");
      setTitle("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUrl("");
    setTitle("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--card-surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Close button */}
        <button
          onClick={handleClose}
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
          Save Article
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-6">
          Add an article to your reading list
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="article-url"
              className="block text-xs font-medium text-[var(--text-muted)] mb-1.5"
            >
              URL
            </label>
            <input
              id="article-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--tan)] focus:border-[var(--tan)] outline-none transition text-sm"
              placeholder="https://example.com/article"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="article-title"
              className="block text-xs font-medium text-[var(--text-muted)] mb-1.5"
            >
              Title{" "}
              <span className="text-[var(--text-muted)] opacity-60">
                (optional - auto-fetched)
              </span>
            </label>
            <input
              id="article-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--tan)] focus:border-[var(--tan)] outline-none transition text-sm"
              placeholder="Article title"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-[var(--border)] text-[var(--text-muted)] rounded-lg text-sm font-medium hover:border-[var(--border-hover)] hover:text-[var(--text)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url}
              className="flex-1 py-2.5 bg-[var(--tan)] text-[var(--bg)] rounded-lg text-sm font-medium hover:bg-[var(--brass)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
