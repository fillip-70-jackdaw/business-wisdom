"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  user: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  showFavoritesOnly?: boolean;
  onToggleFavorites?: () => void;
  favoritesCount?: number;
}

export function Header({
  user,
  onSignIn,
  onSignOut,
  showFavoritesOnly = false,
  onToggleFavorites,
  favoritesCount = 0,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[rgba(51,40,32,0.85)] backdrop-blur-xl border-b border-[rgba(216,179,124,0.1)]">
      <nav className="max-w-[720px] mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-lg text-[var(--parchment)] tracking-tight opacity-90">
            Business Wisdom
          </span>
        </Link>

        {/* Center - Toggle */}
        {onToggleFavorites && (
          <div className="flex items-center bg-[rgba(255,238,214,0.03)] rounded-lg p-1 border border-[rgba(216,179,124,0.12)]">
            <button
              onClick={() => showFavoritesOnly && onToggleFavorites()}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                !showFavoritesOnly
                  ? "bg-[rgba(255,238,214,0.08)] text-[var(--parchment)]"
                  : "text-[rgba(247,232,208,0.5)] hover:text-[var(--tan)]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => !showFavoritesOnly && onToggleFavorites()}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                showFavoritesOnly
                  ? "bg-[rgba(255,238,214,0.08)] text-[var(--parchment)]"
                  : "text-[rgba(247,232,208,0.5)] hover:text-[var(--tan)]"
              }`}
            >
              Favorites
              {favoritesCount > 0 && (
                <span className="text-[10px] bg-[rgba(196,154,92,0.18)] text-[var(--brass)] px-1.5 py-0.5 rounded-full">
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>
        )}

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
