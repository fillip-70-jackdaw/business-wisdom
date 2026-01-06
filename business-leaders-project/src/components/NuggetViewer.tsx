"use client";

import { useState, useEffect } from "react";
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
}

function PeekCard({ nugget, side }: { nugget: NuggetWithLeader | null; side: "left" | "right" }) {
  if (!nugget) return null;

  const offset = side === "left" ? "-translate-x-[82%]" : "translate-x-[82%]";

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 ${side === "left" ? "left-0" : "right-0"} ${offset} w-[320px] pointer-events-none`}
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
      {/* Card container with peek panels */}
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

        {/* Main Card - The Artifact */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={nugget.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
              opacity: { duration: 0.3 },
              scale: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
            }}
            className="relative z-10 w-full rounded-3xl border border-[rgba(216,179,124,0.18)] p-10 md:p-12"
            style={{
              /*
               * Card kept darker than background for squint-test separation
               * Inner gradient: lighter center, darker edges (leather effect)
               */
              background: `
                radial-gradient(ellipse 120% 80% at 50% 0%, rgba(247, 232, 208, 0.035) 0%, transparent 50%),
                radial-gradient(ellipse 100% 100% at 50% 50%, var(--card-surface-light) 0%, var(--card-surface) 100%)
              `,
              boxShadow: `
                0 1px 0 0 rgba(247, 232, 208, 0.05) inset,
                0 -1px 0 0 rgba(0, 0, 0, 0.15) inset,
                0 4px 8px -2px rgba(0, 0, 0, 0.2),
                0 16px 32px -8px rgba(0, 0, 0, 0.25),
                0 32px 64px -16px rgba(0, 0, 0, 0.2)
              `,
            }}
          >
            {/* Favorite Button */}
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

            {/* Header - Avatar + Name */}
            <div className="flex items-center gap-4 mb-10">
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
            </div>

            {/* Quote */}
            <div className="relative mb-10">
              {/* Decorative opening quotation ornament */}
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
              <blockquote className="font-serif text-[1.75rem] md:text-[2rem] text-[var(--parchment)] leading-[1.5] tracking-[-0.01em] pl-7">
                {nugget.text}
              </blockquote>
            </div>

            {/* Metadata - softer, warmer */}
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-5 mt-6">
        {/* Prev Button */}
        <motion.button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          className="w-11 h-11 flex items-center justify-center rounded-full border border-[rgba(216,179,124,0.2)] bg-[rgba(255,238,214,0.04)] transition-all duration-200 hover:border-[var(--brass)] hover:shadow-[0_0_16px_rgba(182,139,76,0.18)] disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:border-[rgba(216,179,124,0.2)] disabled:hover:scale-100"
          aria-label="Previous"
        >
          <svg className="w-4 h-4 text-[var(--tan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        {/* Progress - book-like with bookmark accent */}
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-[var(--parchment)] tabular-nums">
            {currentIndex + 1}
          </span>
          <span className="text-[rgba(247,232,208,0.4)]">/</span>
          <span className="text-sm text-[rgba(247,232,208,0.5)] tabular-nums">
            {nuggets.length}
          </span>
          {/* Bookmark accent */}
          <div className="w-10 h-[3px] bg-[var(--brass)] ml-1.5 rounded-full opacity-70" />
        </div>

        {/* Next Button */}
        <motion.button
          onClick={handleNext}
          disabled={currentIndex === nuggets.length - 1}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          className="w-11 h-11 flex items-center justify-center rounded-full border border-[rgba(216,179,124,0.2)] bg-[rgba(255,238,214,0.04)] transition-all duration-200 hover:border-[var(--brass)] hover:shadow-[0_0_16px_rgba(182,139,76,0.18)] disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:border-[rgba(216,179,124,0.2)] disabled:hover:scale-100"
          aria-label="Next"
        >
          <svg className="w-4 h-4 text-[var(--tan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>
      </div>

      {/* Keyboard hint - fades after first interaction */}
      <AnimatePresence>
        {showKeyboardHint && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center text-[11px] text-[rgba(247,232,208,0.35)] mt-3 tracking-wide"
          >
            Use ← → to navigate
          </motion.p>
        )}
      </AnimatePresence>

      {/* Collection hint */}
      <p className="text-center text-[11px] text-[rgba(247,232,208,0.3)] mt-4 tracking-widest uppercase">
        Curated from {totalCount} insights
      </p>
    </div>
  );
}
