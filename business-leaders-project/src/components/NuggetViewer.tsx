"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { NuggetWithLeader } from "@/lib/supabase/types";
import { LeaderAvatar } from "./LeaderAvatar";

interface NuggetViewerProps {
  nuggets: NuggetWithLeader[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  isFavorited: boolean;
  onFavoriteToggle: () => void;
  totalCount: number;
  isPreface?: boolean;
}

interface SideNavZoneProps {
  side: "left" | "right";
  onClick: () => void;
  disabled: boolean;
  label: string;
}

function SideNavZone({ side, onClick, disabled, label }: SideNavZoneProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) onClick();
    }
  }, [disabled, onClick]);

  if (disabled) return null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={label}
      className={`
        absolute top-1/2 -translate-y-1/2 z-20
        ${side === "left" ? "-left-8 md:-left-16" : "-right-8 md:-right-16"}
        w-16 md:w-24
        h-[70%]
        flex items-center justify-center
        cursor-pointer
        focus:outline-none
        focus-visible:ring-2 focus-visible:ring-[var(--tan)] focus-visible:ring-opacity-50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--library-bg)]
        transition-all duration-200
        touch-none
        hidden md:flex
      `}
      style={{
        background: "transparent",
      }}
    >
      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl transition-opacity duration-250 ease-out pointer-events-none"
        style={{
          opacity: isHovered ? 0.6 : 0,
          background: `radial-gradient(ellipse 80% 60% at ${side === "left" ? "70%" : "30%"} 50%, rgba(182, 139, 76, 0.15) 0%, transparent 70%)`,
        }}
      />

      {/* Arrow icon */}
      <motion.div
        animate={{
          opacity: isHovered ? 0.85 : 0.08,
          scale: isPressed ? 0.94 : isHovered ? 1.04 : 1,
        }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
        className="relative z-10"
      >
        <svg
          className="w-6 h-6 text-[var(--tan)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          {side === "left" ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          )}
        </svg>
      </motion.div>
    </button>
  );
}

function PeekCard({ nugget, side }: { nugget: NuggetWithLeader | null; side: "left" | "right" }) {
  if (!nugget) return null;

  const offset = side === "left" ? "-translate-x-[82%]" : "translate-x-[82%]";

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 ${side === "left" ? "left-0" : "right-0"} ${offset} w-[320px] pointer-events-none hidden lg:block`}
    >
      <div
        className="rounded-2xl border border-[var(--border)] p-6 opacity-20 scale-[0.88] blur-[2px]"
        style={{
          background: "linear-gradient(145deg, var(--card-surface-light), var(--card-surface))",
        }}
      >
        <p className="text-sm font-medium text-[var(--tan)] mb-2">{nugget.leader.name}</p>
        <p className="font-serif text-base text-[var(--parchment)] line-clamp-2 leading-relaxed">
          {nugget.text}
        </p>
      </div>
    </div>
  );
}

export function NuggetViewer({
  nuggets,
  currentIndex,
  onNext,
  onPrev,
  isFavorited,
  onFavoriteToggle,
  totalCount,
  isPreface = false,
}: NuggetViewerProps) {
  const [direction, setDirection] = useState(0);
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const nugget = nuggets[currentIndex];
  const prevNugget = currentIndex > 0 ? nuggets[currentIndex - 1] : null;
  const nextNugget = currentIndex < nuggets.length - 1 ? nuggets[currentIndex + 1] : null;

  // Hide keyboard hint after first interaction
  useEffect(() => {
    if (hasInteracted && showKeyboardHint) {
      const timer = setTimeout(() => setShowKeyboardHint(false), 800);
      return () => clearTimeout(timer);
    }
  }, [hasInteracted, showKeyboardHint]);

  // Check if user has seen hint before
  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("keyboardHintSeen");
      if (seen) setShowKeyboardHint(false);
    }
  }, []);

  if (!nugget) return null;

  const handleNext = () => {
    if (currentIndex < nuggets.length - 1) {
      setDirection(1);
      setHasInteracted(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("keyboardHintSeen", "true");
      }
      onNext();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setHasInteracted(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("keyboardHintSeen", "true");
      }
      onPrev();
    }
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.97,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.97,
    }),
  };

  return (
    <div className="w-full max-w-[720px] mx-auto px-4">
      {/* Card container with side navigation */}
      <div className="relative flex items-center justify-center">
        {/* Soft radial glow behind card */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(216, 179, 124, 0.06) 0%, transparent 70%)",
          }}
        />

        {/* Left peek panel */}
        <PeekCard nugget={prevNugget} side="left" />

        {/* Right peek panel */}
        <PeekCard nugget={nextNugget} side="right" />

        {/* Left side navigation zone */}
        <SideNavZone
          side="left"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          label="Previous insight"
        />

        {/* Right side navigation zone */}
        <SideNavZone
          side="right"
          onClick={handleNext}
          disabled={currentIndex === nuggets.length - 1}
          label="Next insight"
        />

        {/* Mobile edge tap zones (touch devices only) */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-0 top-0 bottom-0 w-12 z-30 md:hidden"
            aria-label="Previous insight"
            style={{ background: "transparent" }}
          />
        )}
        {currentIndex < nuggets.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-12 z-30 md:hidden"
            aria-label="Next insight"
            style={{ background: "transparent" }}
          />
        )}

        {/* Main Card - The Artifact */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={nugget.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              const swipeThreshold = 50;
              if (info.offset.x > swipeThreshold && currentIndex > 0) {
                handlePrev();
              } else if (info.offset.x < -swipeThreshold && currentIndex < nuggets.length - 1) {
                handleNext();
              }
            }}
            transition={{
              x: { type: "tween", duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
              opacity: { duration: 0.3 },
              scale: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
            }}
            className="relative z-10 w-full rounded-3xl border border-[rgba(216,179,124,0.18)] p-10 md:p-12 cursor-grab active:cursor-grabbing touch-pan-y"
            style={{
              /*
               * Parchment material: lighter center, warm edges
               * Subtle cream undertone at center catches light
               */
              background: `
                radial-gradient(ellipse 90% 70% at 50% 45%, rgba(247, 232, 208, 0.06) 0%, transparent 60%),
                radial-gradient(ellipse 100% 100% at 50% 50%, var(--card-surface-light) 0%, var(--card-surface) 100%)
              `,
              boxShadow: `
                0 1px 0 0 rgba(247, 232, 208, 0.08) inset,
                0 -1px 0 0 rgba(0, 0, 0, 0.12) inset,
                0 4px 8px -2px rgba(0, 0, 0, 0.15),
                0 16px 32px -8px rgba(0, 0, 0, 0.18),
                0 32px 64px -16px rgba(0, 0, 0, 0.12)
              `,
            }}
          >
            {/* Favorite Button - hidden for preface */}
            {!isPreface && (
              <button
                onClick={onFavoriteToggle}
                className="absolute top-7 right-7 w-11 h-11 flex items-center justify-center rounded-full bg-[rgba(255,238,214,0.05)] border border-[rgba(216,179,124,0.18)] transition-all duration-200 hover:border-[rgba(216,179,124,0.35)] hover:bg-[rgba(255,238,214,0.08)] active:scale-95"
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <motion.svg
                  animate={isFavorited ? {
                    scale: [0.95, 1.1, 1],
                    filter: ["drop-shadow(0 0 0px transparent)", "drop-shadow(0 0 8px rgba(182, 139, 76, 0.5))", "drop-shadow(0 0 0px transparent)"]
                  } : {}}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isFavorited
                      ? "text-[var(--brass)] fill-[var(--brass)]"
                      : "text-[rgba(247,232,208,0.45)] fill-transparent hover:text-[var(--tan)]"
                  }`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </motion.svg>
              </button>
            )}

            {/* Header - Avatar + Name */}
            <div className="flex items-center gap-4 mb-10">
              {isPreface ? (
                <>
                  <div className="shrink-0 w-14 h-14 rounded-full border-2 border-[rgba(216,179,124,0.25)] bg-[rgba(216,179,124,0.08)] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--tan)] opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[17px] font-medium text-[var(--parchment)]">
                      {nugget.leader.name}
                    </span>
                    <p className="text-sm text-[rgba(247,232,208,0.5)] mt-0.5">
                      {nugget.leader.title}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Link href={`/leaders/${nugget.leader.slug}`} className="shrink-0">
                    <LeaderAvatar
                      name={nugget.leader.name}
                      photoUrl={nugget.leader.photo_url}
                      size={56}
                      className="border-2 border-[rgba(216,179,124,0.25)]"
                    />
                  </Link>
                  <div>
                    <Link
                      href={`/leaders/${nugget.leader.slug}`}
                      className="block text-[17px] font-medium text-[var(--parchment)] hover:text-[var(--tan)] transition-colors"
                    >
                      {nugget.leader.name}
                    </Link>
                    <p className="text-sm text-[rgba(247,232,208,0.5)] mt-0.5">
                      {nugget.leader.title}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Quote */}
            <div className="relative mb-10">
              {/* Decorative opening quotation ornament - hidden for preface */}
              {!isPreface && (
                <span
                  className="absolute -top-2 -left-1 text-[5rem] leading-none font-serif select-none pointer-events-none"
                  style={{
                    color: "var(--tan)",
                    opacity: 0.12,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  &ldquo;
                </span>
              )}
              <blockquote className={`font-serif text-[1.75rem] md:text-[2rem] text-[var(--parchment)] leading-[1.5] tracking-[-0.01em] ${isPreface ? "" : "pl-7"}`}>
                {isPreface ? (
                  nugget.text.split("\n").map((line, i) => (
                    <span key={i} className="block">
                      {line}
                      {i < nugget.text.split("\n").length - 1 && <br />}
                    </span>
                  ))
                ) : (
                  nugget.text
                )}
              </blockquote>
            </div>

            {/* Metadata - softer, warmer - hidden for preface */}
            {!isPreface && (
              <div className="pt-7 border-t border-[rgba(216,179,124,0.12)] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-[rgba(247,232,208,0.4)]">
                  {nugget.topic_tags.slice(0, 3).map((tag, i) => (
                    <span key={tag} className="flex items-center">
                      {i > 0 && <span className="mx-2 opacity-50">·</span>}
                      <span className="capitalize">{tag}</span>
                    </span>
                  ))}
                </div>
                {nugget.source_title && (
                  <span className="text-[13px] text-[rgba(247,232,208,0.35)]">
                    {nugget.source_title}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Keyboard hint - fades after first interaction */}
      <AnimatePresence>
        {showKeyboardHint && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center text-[11px] text-[rgba(247,232,208,0.35)] mt-6 tracking-wide"
          >
            Use ← → to navigate
          </motion.p>
        )}
      </AnimatePresence>

      {/* Collection hint - subtle footer */}
      <p className="text-center text-[11px] text-[rgba(247,232,208,0.25)] mt-4 tracking-widest uppercase">
        Curated from {totalCount} insights
      </p>
    </div>
  );
}
