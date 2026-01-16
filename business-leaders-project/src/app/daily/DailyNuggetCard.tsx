"use client";

import Image from "next/image";
import Link from "next/link";
import type { NuggetWithLeader } from "@/lib/supabase/types";
import { FavoriteButton } from "@/components/FavoriteButton";

interface DailyNuggetCardProps {
  nugget: NuggetWithLeader;
  isFavorited: boolean;
  onFavoriteToggle?: () => void;
  compact?: boolean;
}

export function DailyNuggetCard({
  nugget,
  isFavorited,
  onFavoriteToggle,
  compact = false,
}: DailyNuggetCardProps) {
  return (
    <div
      className={`
      relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl
      ${compact ? "p-4" : "p-6"}
    `}
    >
      {/* Favorite Button */}
      {onFavoriteToggle && (
        <div className="absolute top-4 right-4">
          <FavoriteButton
            isFavorited={isFavorited}
            onClick={onFavoriteToggle}
          />
        </div>
      )}

      {/* Leader Info */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/leaders/${nugget.leader.slug}`} className="shrink-0">
          <div
            className={`relative rounded-full overflow-hidden bg-[var(--surface-2)] ${compact ? "w-8 h-8" : "w-12 h-12"}`}
          >
            <Image
              src={nugget.leader.photo_url}
              alt={nugget.leader.name}
              fill
              className="object-cover"
              sizes={compact ? "32px" : "48px"}
              unoptimized
            />
          </div>
        </Link>
        <div>
          <Link
            href={`/leaders/${nugget.leader.slug}`}
            className={`block font-semibold text-[var(--parchment)] hover:text-[var(--tan)] ${compact ? "text-sm" : "text-base"}`}
          >
            {nugget.leader.name}
          </Link>
          <p
            className={`text-[var(--text-muted)] ${compact ? "text-xs" : "text-sm"}`}
          >
            {nugget.leader.title}
          </p>
        </div>
      </div>

      {/* Quote */}
      <p
        className={`
        text-[var(--text)] leading-relaxed pr-8
        ${compact ? "text-base" : "text-xl font-medium"}
      `}
      >
        {nugget.text}
      </p>

      {/* Topics */}
      <div className="mt-4 flex items-center gap-1 text-xs text-[var(--text-muted)]">
        {nugget.topic_tags.slice(0, 3).map((tag, i) => (
          <span key={tag} className="flex items-center">
            {i > 0 && <span className="mx-1.5">·</span>}
            <span className="capitalize">{tag}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
