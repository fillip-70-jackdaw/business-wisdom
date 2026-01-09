"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { NuggetWithLeader } from "@/lib/supabase/types";

interface BusinessStyleAnalysisProps {
  nuggets: NuggetWithLeader[];
}

function AnalysisSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-[var(--surface-2)] rounded w-1/3" />
      <div className="space-y-2">
        <div className="h-3 bg-[var(--surface)] rounded w-full" />
        <div className="h-3 bg-[var(--surface)] rounded w-5/6" />
        <div className="h-3 bg-[var(--surface)] rounded w-4/5" />
      </div>
      <div className="h-4 bg-[var(--surface-2)] rounded w-1/4 mt-6" />
      <div className="space-y-2">
        <div className="h-3 bg-[var(--surface)] rounded w-full" />
        <div className="h-3 bg-[var(--surface)] rounded w-3/4" />
      </div>
      <div className="h-4 bg-[var(--surface-2)] rounded w-2/5 mt-6" />
      <div className="space-y-2">
        <div className="h-3 bg-[var(--surface)] rounded w-full" />
        <div className="h-3 bg-[var(--surface)] rounded w-5/6" />
        <div className="h-3 bg-[var(--surface)] rounded w-2/3" />
      </div>
    </div>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

function formatAnalysis(text: string): React.ReactNode {
  // Split by sections marked with **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      // Bold section header
      const content = part.slice(2, -2);
      return (
        <h3
          key={i}
          className="text-[var(--tan)] font-semibold mt-5 mb-2 first:mt-0"
        >
          {content}
        </h3>
      );
    }
    // Regular text - preserve line breaks
    return part.split("\n").map((line, j) => (
      <p
        key={`${i}-${j}`}
        className="text-[var(--text)] leading-relaxed mb-2 last:mb-0"
      >
        {line}
      </p>
    ));
  });
}

export function BusinessStyleAnalysis({ nuggets }: BusinessStyleAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nuggets: nuggets.map((n) => ({
            text: n.text,
            leaderName: n.leader.name,
            topicTags: n.topic_tags,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate analysis");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-[var(--border)] p-6 md:p-8 bg-[var(--card-surface)] shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
          <SparkleIcon className="w-5 h-5 text-[var(--tan)]" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-[var(--parchment)]">
            Your Business Style Profile
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Based on {nuggets.length} saved nugget{nuggets.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Initial State */}
        {!analysis && !isLoading && !error && (
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-4"
          >
            <p className="text-[var(--text-muted)] mb-5 leading-relaxed">
              Discover patterns in the wisdom you&apos;ve saved. Our AI will analyze
              your favorites to reveal your unique business philosophy.
            </p>
            <button
              onClick={generateAnalysis}
              className="px-5 py-2.5 rounded-xl bg-[var(--tan)] text-[var(--bg)] font-medium
                         hover:bg-[var(--brass)] transition-all duration-200
                         flex items-center gap-2"
            >
              <SparkleIcon className="w-4 h-4" />
              Analyze My Style
            </button>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-4"
          >
            <AnalysisSkeleton />
            <p className="text-sm text-[var(--text-muted)] mt-4 flex items-center gap-2">
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyzing your favorites...
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-4"
          >
            <div className="flex items-start gap-3 text-[rgba(220,120,100,0.9)] mb-4">
              <svg
                className="w-5 h-5 mt-0.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <div>
                <p className="font-medium">Analysis Unavailable</p>
                <p className="text-sm opacity-80 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={generateAnalysis}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)]
                         hover:bg-[var(--surface)] hover:text-[var(--text)] transition-all duration-200
                         text-sm font-medium"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Generated Analysis */}
        {analysis && !isLoading && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-2"
          >
            <div className="prose-sm">{formatAnalysis(analysis)}</div>
            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <button
                onClick={generateAnalysis}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)]
                           hover:text-[var(--tan)] hover:border-[var(--tan)]
                           transition-all duration-200 text-sm font-medium
                           flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Regenerate Analysis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
