"use client";

import { useEffect, useRef, useState } from "react";

interface TopicWithCount {
  topic: string;
  count: number;
}

interface TopicsPopoverProps {
  topics: TopicWithCount[];
  selected: string[];
  onChange: (topics: string[]) => void;
  onClose: () => void;
  isFavoritesMode?: boolean;
}

export function TopicsPopover({
  topics,
  selected,
  onChange,
  onClose,
  isFavoritesMode = false,
}: TopicsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [showAllTopics, setShowAllTopics] = useState(false);

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

  // Single-select: clicking a topic sets it as the only filter and closes
  const selectTopic = (topic: string, event: React.MouseEvent) => {
    // Shift-click for multi-select (power user)
    if (event.shiftKey) {
      if (selected.includes(topic)) {
        onChange(selected.filter((t) => t !== topic));
      } else {
        onChange([...selected, topic]);
      }
      // Don't close on shift-click
      return;
    }

    // Normal click: single-select and close
    if (selected.length === 1 && selected[0] === topic) {
      // Clicking the already-selected topic clears it
      onChange([]);
    } else {
      onChange([topic]);
    }
    onClose();
  };

  const clearAll = () => {
    onChange([]);
    onClose();
  };

  // Sort by count descending for top topics
  const sortedByCount = [...topics].sort((a, b) => b.count - a.count);
  const topTopics = sortedByCount.slice(0, 7);

  // All topics sorted alphabetically
  const allTopicsSorted = [...topics].sort((a, b) =>
    a.topic.localeCompare(b.topic)
  );

  const hasMoreTopics = topics.length > 7;

  // Framing copy based on mode
  const framingText = isFavoritesMode
    ? "Themes in your collection."
    : "Browse ideas by theme.";

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 w-72
                 bg-[var(--card-surface)] border border-[var(--border)]
                 rounded-xl shadow-xl z-50"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-1">
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
        <p className="text-[11px] text-[var(--text-muted)] italic">
          {framingText}
        </p>
      </div>

      {/* Top Topics */}
      <div className="p-3">
        <div className="flex flex-wrap gap-1.5">
          {topTopics.map(({ topic, count }) => {
            const isSelected = selected.includes(topic);
            return (
              <button
                key={topic}
                onClick={(e) => selectTopic(topic, e)}
                className={`group relative px-2.5 py-1 text-xs rounded-md transition-all duration-150
                  ${
                    isSelected
                      ? "text-[var(--parchment)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
              >
                {/* Selected indicator: Hermès orange dot */}
                {isSelected && (
                  <span
                    className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: "var(--hermes)" }}
                  />
                )}
                <span className={`capitalize ${isSelected ? "pl-1" : ""}`}>
                  {topic}
                </span>
                <span className="ml-1 opacity-40">{count}</span>
                {/* Subtle underline on hover/selected */}
                <span
                  className={`absolute bottom-0 left-2 right-2 h-px transition-opacity duration-150
                    ${isSelected ? "opacity-30 bg-[var(--hermes)]" : "opacity-0 group-hover:opacity-20 bg-[var(--tan)]"}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Expand/Collapse for all topics */}
      {hasMoreTopics && (
        <>
          <button
            onClick={() => setShowAllTopics(!showAllTopics)}
            className="w-full px-4 py-2 text-[11px] text-[var(--text-muted)] hover:text-[var(--tan)]
                       border-t border-[var(--border)] transition-colors flex items-center justify-between"
          >
            <span>All topics</span>
            <span className={`transition-transform duration-200 ${showAllTopics ? "rotate-180" : ""}`}>
              ↓
            </span>
          </button>

          {showAllTopics && (
            <div className="px-3 pb-3 max-h-48 overflow-y-auto border-t border-[var(--border)]">
              <div className="flex flex-wrap gap-1.5 pt-3">
                {allTopicsSorted.map(({ topic, count }) => {
                  const isSelected = selected.includes(topic);
                  return (
                    <button
                      key={topic}
                      onClick={(e) => selectTopic(topic, e)}
                      className={`group relative px-2.5 py-1 text-xs rounded-md transition-all duration-150
                        ${
                          isSelected
                            ? "text-[var(--parchment)]"
                            : "text-[var(--text-muted)] hover:text-[var(--text)]"
                        }`}
                    >
                      {isSelected && (
                        <span
                          className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
                          style={{ backgroundColor: "var(--hermes)" }}
                        />
                      )}
                      <span className={`capitalize ${isSelected ? "pl-1" : ""}`}>
                        {topic}
                      </span>
                      <span className="ml-1 opacity-40">{count}</span>
                      <span
                        className={`absolute bottom-0 left-2 right-2 h-px transition-opacity duration-150
                          ${isSelected ? "opacity-30 bg-[var(--hermes)]" : "opacity-0 group-hover:opacity-20 bg-[var(--tan)]"}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {topics.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
          No topics available
        </div>
      )}
    </div>
  );
}
