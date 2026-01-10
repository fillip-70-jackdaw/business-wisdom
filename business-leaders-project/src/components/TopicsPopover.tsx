"use client";

import { useEffect, useRef } from "react";

interface TopicsPopoverProps {
  topics: string[];
  selected: string[];
  onChange: (topics: string[]) => void;
  onClose: () => void;
}

export function TopicsPopover({
  topics,
  selected,
  onChange,
  onClose,
}: TopicsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const toggleTopic = (topic: string) => {
    if (selected.includes(topic)) {
      onChange(selected.filter((t) => t !== topic));
    } else {
      onChange([...selected, topic]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 w-72 max-h-80 overflow-y-auto
                 bg-[var(--card-surface)] border border-[var(--border)]
                 rounded-xl shadow-xl z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-sm font-medium text-[var(--parchment)]">
          Topics
        </span>
        {selected.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--tan)] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Topics grid */}
      <div className="p-3 flex flex-wrap gap-2">
        {topics.map((topic) => {
          const isSelected = selected.includes(topic);
          return (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200
                ${
                  isSelected
                    ? "bg-[var(--surface-2)] text-[var(--parchment)] border-[var(--tan)]"
                    : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
                }`}
            >
              <span className="capitalize">{topic}</span>
            </button>
          );
        })}
      </div>

      {topics.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
          No topics available
        </div>
      )}
    </div>
  );
}
