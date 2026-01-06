"use client";

import Image from "next/image";
import Link from "next/link";
import type { NuggetWithLeader } from "@/lib/supabase/types";
import { FavoriteButton } from "./FavoriteButton";

interface NuggetCardProps {
  nugget: NuggetWithLeader;
  isFavorited?: boolean;
  onFavoriteToggle?: (nuggetId: string) => void;
  showFavorite?: boolean;
}

export function NuggetCard({
  nugget,
  isFavorited = false,
  onFavoriteToggle,
  showFavorite = true,
}: NuggetCardProps) {
  return (
    <div className="group relative bg-white/[0.04] border border-white/10 rounded-2xl p-5 transition-all duration-200 ease-out hover:bg-white/[0.06] hover:-translate-y-0.5 hover:shadow-2xl">
      {/* Favorite Button - Top Right */}
      {showFavorite && (
        <div className="absolute top-4 right-4">
          <FavoriteButton
            isFavorited={isFavorited}
            onClick={() => onFavoriteToggle?.(nugget.id)}
            size="sm"
          />
        </div>
      )}

      {/* Header - Avatar + Name */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/leaders/${nugget.leader.slug}`} className="shrink-0">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white/10">
            <Image
              src={nugget.leader.photo_url}
              alt={nugget.leader.name}
              fill
              className="object-cover"
              sizes="36px"
              unoptimized
            />
          </div>
        </Link>
        <div className="min-w-0">
          <Link
            href={`/leaders/${nugget.leader.slug}`}
            className="block text-sm font-semibold text-white/90 hover:text-white truncate"
          >
            {nugget.leader.name}
          </Link>
          <p className="text-xs text-white/40 truncate">
            {nugget.leader.title}
          </p>
        </div>
      </div>

      {/* Nugget Text - Primary Focus */}
      <p className="text-xl font-medium text-white/90 leading-snug tracking-[-0.01em] pr-8">
        {nugget.text}
      </p>

      {/* Metadata */}
      <div className="mt-4 flex items-center gap-1 text-xs text-white/30">
        {nugget.topic_tags.slice(0, 3).map((tag, i) => (
          <span key={tag} className="flex items-center">
            {i > 0 && <span className="mx-1.5">·</span>}
            <span className="capitalize">{tag}</span>
          </span>
        ))}
        {nugget.source_title && (
          <>
            <span className="mx-1.5">·</span>
            <span className="truncate">{nugget.source_title}</span>
          </>
        )}
      </div>
    </div>
  );
}
