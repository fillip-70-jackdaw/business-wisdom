"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { NuggetWithLeader, SavedArticle } from "@/lib/supabase/types";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";
import { NuggetCard } from "@/components/NuggetCard";

interface DigestData {
  message: string;
  nuggets: NuggetWithLeader[];
  articles: SavedArticle[];
  generatedAt: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function DigestContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const supabase = createClient();

  // Fetch user and favorites
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setIsLoading(false);
      }
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Fetch favorites for the nuggets
  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      const { data } = await supabase
        .from("favorites")
        .select("nugget_id")
        .eq("user_id", user.id);

      if (data) {
        setFavoriteIds(new Set(data.map((f) => f.nugget_id)));
      }
    };

    fetchFavorites();
  }, [user, supabase]);

  // Fetch digest
  useEffect(() => {
    if (!user) return;

    const fetchDigest = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/digest");
        const data = await response.json();

        if (response.ok) {
          setDigest(data.digest);
        } else {
          console.error("Failed to fetch digest:", data.error);
        }
      } catch (error) {
        console.error("Error fetching digest:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDigest();
  }, [user]);

  // Regenerate digest
  const handleRegenerate = async () => {
    if (!user) return;

    setIsRegenerating(true);
    try {
      const response = await fetch("/api/digest", { method: "POST" });
      const data = await response.json();

      if (response.ok) {
        setDigest(data.digest);
      } else {
        console.error("Failed to regenerate digest:", data.error);
      }
    } catch (error) {
      console.error("Error regenerating digest:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (nuggetId: string) => {
    if (!user) return;

    const isFavorited = favoriteIds.has(nuggetId);
    const newFavorites = new Set(favoriteIds);

    if (isFavorited) {
      newFavorites.delete(nuggetId);
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("nugget_id", nuggetId);
    } else {
      newFavorites.add(nuggetId);
      await supabase.from("favorites").insert({
        user_id: user.id,
        nugget_id: nuggetId,
      });
    }

    setFavoriteIds(newFavorites);
  };

  // Mark article as read and open
  const handleOpenArticle = async (article: SavedArticle) => {
    if (!user) return;

    // Mark as read
    await fetch(`/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: true }),
    });

    // Open in new tab
    window.open(article.url, "_blank");
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const today = new Date();

  return (
    <div className="min-h-screen bg-library">
      <Header
        user={user}
        onSignIn={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
        showFavoritesOnly={false}
        isDigestPage={true}
      />

      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Not logged in */}
          {!user && !isLoading && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">☀️</div>
              <h2 className="text-2xl font-bold text-[var(--parchment)] mb-2">
                Sign in to view your daily digest
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                Get personalized wisdom and articles delivered daily
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-3 bg-[var(--tan)] text-[var(--bg)] rounded-lg font-medium hover:bg-[var(--brass)] transition"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Loading */}
          {user && isLoading && (
            <div className="space-y-6">
              <div className="animate-pulse">
                <div className="h-8 bg-[var(--surface)] rounded w-1/3 mb-2" />
                <div className="h-4 bg-[var(--surface)] rounded w-1/4" />
              </div>
              <div className="h-32 bg-[var(--surface)] rounded-xl" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 bg-[var(--surface)] rounded-xl"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Digest content */}
          {user && !isLoading && digest && (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--parchment)] mb-1">
                      Your Daily Digest
                    </h1>
                    <p className="text-[var(--text-muted)]">
                      {formatDate(today)}
                    </p>
                  </div>
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--parchment)] rounded-lg text-sm font-medium hover:bg-[var(--surface-2)] transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg
                      className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>{isRegenerating ? "Refreshing..." : "Refresh"}</span>
                  </button>
                </div>
              </div>

              {/* Inspirational Message */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💬</div>
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold text-[var(--tan)] mb-2 uppercase tracking-wide">
                      Today&apos;s Message
                    </h2>
                    <p className="text-lg text-[var(--text)] leading-relaxed">
                      {digest.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Saved Articles */}
              {digest.articles.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-[var(--parchment)] mb-4 flex items-center gap-2">
                    <span>📚</span>
                    <span>Your Saved Articles ({digest.articles.length})</span>
                  </h2>
                  <div className="space-y-3">
                    {digest.articles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => handleOpenArticle(article)}
                        className="w-full group block bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 transition-all hover:bg-[var(--surface-2)] hover:-translate-y-0.5 hover:shadow-xl text-left"
                      >
                        <div className="flex gap-3">
                          {/* Image */}
                          {article.image_url && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0">
                              <Image
                                src={article.image_url}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="64px"
                                unoptimized
                              />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[var(--parchment)] font-medium truncate group-hover:text-[var(--tan)] transition-colors">
                              {article.title || article.url}
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {article.domain}
                            </p>
                            {article.description && (
                              <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-1">
                                {article.description}
                              </p>
                            )}
                          </div>

                          {/* Open icon */}
                          <div className="shrink-0 flex items-center">
                            <svg
                              className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--tan)]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wisdom Nuggets */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[var(--parchment)] mb-4 flex items-center gap-2">
                  <span>💡</span>
                  <span>Wisdom for You ({digest.nuggets.length})</span>
                </h2>
                <div className="space-y-4">
                  {digest.nuggets.map((nugget) => (
                    <NuggetCard
                      key={nugget.id}
                      nugget={nugget}
                      isFavorited={favoriteIds.has(nugget.id)}
                      onFavoriteToggle={handleToggleFavorite}
                      showFavorite={true}
                    />
                  ))}
                </div>
              </div>

              {/* Footer message */}
              <div className="text-center text-sm text-[var(--text-muted)] mt-8">
                <p>
                  Your digest refreshes daily.{" "}
                  <button
                    onClick={() => router.push("/settings")}
                    className="text-[var(--tan)] hover:underline"
                  >
                    Manage preferences
                  </button>
                </p>
              </div>
            </>
          )}

          {/* Empty state - no content generated */}
          {user && !isLoading && !digest && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-[var(--parchment)] mb-2">
                No digest available
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                We couldn&apos;t generate your digest right now. Try again later.
              </p>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="px-6 py-3 bg-[var(--tan)] text-[var(--bg)] rounded-lg font-medium hover:bg-[var(--brass)] transition disabled:opacity-50"
              >
                {isRegenerating ? "Generating..." : "Generate Digest"}
              </button>
            </div>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
