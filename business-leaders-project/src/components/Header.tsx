"use client";

import { useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { TopicsPopover } from "./TopicsPopover";

interface TopicWithCount {
  topic: string;
  count: number;
}

interface HeaderProps {
  user: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  showFavoritesOnly?: boolean;
  onToggleFavorites?: () => void;
  favoritesCount?: number;
  articlesCount?: number;
  isArticlesPage?: boolean;
  topicsWithCounts?: TopicWithCount[];
  selectedTopics?: string[];
  onTopicsChange?: (topics: string[]) => void;
}

export function Header({
  user,
  onSignIn,
  onSignOut,
  showFavoritesOnly = false,
  onToggleFavorites,
  favoritesCount = 0,
  articlesCount = 0,
  isArticlesPage = false,
  topicsWithCounts = [],
  selectedTopics = [],
  onTopicsChange,
}: HeaderProps) {
  const [showTopicsPopover, setShowTopicsPopover] = useState(false);

  const handleTopicsChange = (topics: string[]) => {
    onTopicsChange?.(topics);
  };

  const clearTopicFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTopicsChange?.([]);
  };

  const hasActiveFilter = selectedTopics.length > 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[rgba(51,40,32,0.85)] backdrop-blur-xl border-b border-[rgba(216,179,124,0.1)]">
      <nav className="max-w-[720px] mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-lg text-[var(--parchment)] tracking-tight opacity-90">
            Business Wisdom
          </span>
        </Link>

        {/* Center - Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[rgba(255,238,214,0.03)] rounded-lg p-1 border border-[rgba(216,179,124,0.12)]">
            <Link
              href="/"
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                !showFavoritesOnly
                  ? "bg-[rgba(255,238,214,0.08)] text-[var(--parchment)]"
                  : "text-[rgba(247,232,208,0.5)] hover:text-[var(--tan)]"
              }`}
            >
              All
            </Link>
            <Link
              href="/favorites"
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                showFavoritesOnly
                  ? "bg-[rgba(255,238,214,0.08)] text-[var(--parchment)]"
                  : "text-[rgba(247,232,208,0.5)] hover:text-[var(--tan)]"
              }`}
            >
              Favorites
              {favoritesCount > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "var(--hermes-soft)",
                    color: "var(--hermes)",
                  }}
                >
                  {favoritesCount}
                </span>
              )}
            </Link>
            <Link
              href="/articles"
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                isArticlesPage
                  ? "bg-[rgba(255,238,214,0.08)] text-[var(--parchment)]"
                  : "text-[rgba(247,232,208,0.5)] hover:text-[var(--tan)]"
              }`}
            >
              Articles
              {articlesCount > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "var(--hermes-soft)",
                    color: "var(--hermes)",
                  }}
                >
                  {articlesCount}
                </span>
              )}
            </Link>
          </div>

          {/* Topics Filter */}
          {topicsWithCounts.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowTopicsPopover(!showTopicsPopover)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5
                  ${
                    hasActiveFilter
                      ? "text-[var(--parchment)]"
                      : "text-[rgba(247,232,208,0.5)] hover:text-[var(--tan)]"
                  }`}
              >
                {/* Hermès orange dot when filter active */}
                {hasActiveFilter && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "var(--hermes)" }}
                  />
                )}
                <span>Topics</span>
                {/* Clear button when filter active */}
                {hasActiveFilter && (
                  <button
                    onClick={clearTopicFilter}
                    className="ml-0.5 text-[var(--text-muted)] hover:text-[var(--parchment)] transition-colors"
                    aria-label="Clear topic filter"
                  >
                    ×
                  </button>
                )}
              </button>

              {showTopicsPopover && (
                <TopicsPopover
                  topics={topicsWithCounts}
                  selected={selectedTopics}
                  onChange={handleTopicsChange}
                  onClose={() => setShowTopicsPopover(false)}
                  isFavoritesMode={showFavoritesOnly}
                />
              )}
            </div>
          )}
        </div>

        {/* Right - Auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={onSignOut}
              className="px-3 py-1.5 text-xs font-medium text-[rgba(247,232,208,0.5)] hover:text-[var(--tan)] transition-colors duration-200"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="px-4 py-1.5 bg-[rgba(255,238,214,0.06)] border border-[rgba(216,179,124,0.18)] hover:border-[rgba(216,179,124,0.32)] text-[var(--parchment)] rounded-lg text-xs font-medium transition-all duration-200"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
