"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { NuggetWithLeader } from "@/lib/supabase/types";
import { NuggetViewer } from "./NuggetViewer";
import { Header } from "./Header";
import { AuthModal } from "./AuthModal";

// Seeded random number generator for consistent shuffle per session
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Get or create session seed
function getSessionSeed(): number {
  if (typeof window === "undefined") return Date.now();
  const stored = sessionStorage.getItem("shuffleSeed");
  if (stored) return parseInt(stored, 10);
  const seed = Date.now();
  sessionStorage.setItem("shuffleSeed", seed.toString());
  return seed;
}

// Anti-clustering shuffle: no more than 2 consecutive nuggets from same leader
function antiClusterShuffle(nuggets: NuggetWithLeader[], seed: number): NuggetWithLeader[] {
  if (nuggets.length <= 1) return nuggets;

  const rng = seededRandom(seed);
  const pool = [...nuggets];
  const result: NuggetWithLeader[] = [];

  // Fisher-Yates shuffle the pool first
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Build result with anti-clustering
  const maxAttempts = pool.length * 10;
  let attempts = 0;

  while (pool.length > 0 && attempts < maxAttempts) {
    attempts++;

    // Get last 2 leaders in result
    const last1 = result.length > 0 ? result[result.length - 1].leader_id : null;
    const last2 = result.length > 1 ? result[result.length - 2].leader_id : null;

    // Find candidates that differ from last 2
    let candidates = pool.filter(n => n.leader_id !== last1 && n.leader_id !== last2);

    // Relax to differ from last 1 if needed
    if (candidates.length === 0) {
      candidates = pool.filter(n => n.leader_id !== last1);
    }

    // Take whatever remains if still nothing
    if (candidates.length === 0) {
      candidates = pool;
    }

    // Pick random candidate
    const idx = Math.floor(rng() * candidates.length);
    const picked = candidates[idx];
    result.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }

  // Add any remaining (shouldn't happen with maxAttempts guard)
  result.push(...pool);

  // Ensure first 10 are diversified (max 2 per leader)
  const first10 = result.slice(0, Math.min(10, result.length));
  const leaderCounts = new Map<string, number>();
  for (const n of first10) {
    leaderCounts.set(n.leader_id, (leaderCounts.get(n.leader_id) || 0) + 1);
  }

  // If any leader has >2 in first 10, swap with later items
  for (let i = 0; i < Math.min(10, result.length); i++) {
    const n = result[i];
    const count = leaderCounts.get(n.leader_id) || 0;
    if (count > 2) {
      // Find a swap candidate after position 10
      for (let j = 10; j < result.length; j++) {
        const swap = result[j];
        const swapCount = leaderCounts.get(swap.leader_id) || 0;
        if (swapCount < 2) {
          [result[i], result[j]] = [result[j], result[i]];
          leaderCounts.set(n.leader_id, count - 1);
          leaderCounts.set(swap.leader_id, swapCount + 1);
          break;
        }
      }
    }
  }

  return result;
}

export function Feed() {
  const [user, setUser] = useState<User | null>(null);
  const [nuggets, setNuggets] = useState<NuggetWithLeader[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionSeed, setSessionSeed] = useState<number>(0);

  const supabase = createClient();

  // Initialize session seed on client
  useEffect(() => {
    setSessionSeed(getSessionSeed());
  }, []);

  // Fetch user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Fetch all nuggets
  const fetchNuggets = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("nuggets")
        .select(`
          *,
          leader:leaders(*)
        `)
        .eq("status", "published");

      if (error) throw error;

      const nuggetsWithLeaders = (data || []) as unknown as NuggetWithLeader[];
      setNuggets(nuggetsWithLeaders);
      setTotalCount(nuggetsWithLeaders.length);
    } catch (error) {
      console.error("Error fetching nuggets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Fetch favorites for logged-in user
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      return;
    }

    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("nugget_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const favoritesData = (data || []) as { nugget_id: string }[];
      setFavorites(new Set(favoritesData.map((f) => f.nugget_id)));
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  }, [supabase, user]);

  // Initial data fetch
  useEffect(() => {
    fetchNuggets();
  }, [fetchNuggets]);

  // Fetch favorites when user changes
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Filter and shuffle nuggets based on mode
  const displayedNuggets = useMemo(() => {
    const filtered = showFavoritesOnly
      ? nuggets.filter((n) => favorites.has(n.id))
      : nuggets;

    // Apply anti-clustering shuffle (use different seed for favorites vs all)
    const shuffleSeed = showFavoritesOnly ? sessionSeed + 1 : sessionSeed;
    return sessionSeed > 0 ? antiClusterShuffle(filtered, shuffleSeed) : filtered;
  }, [nuggets, favorites, showFavoritesOnly, sessionSeed]);

  // Navigation handlers
  const handleNext = () => {
    if (currentIndex < displayedNuggets.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Reset index when switching modes
  useEffect(() => {
    setCurrentIndex(0);
  }, [showFavoritesOnly]);

  // Toggle favorite
  const handleFavoriteToggle = async () => {
    const currentNugget = displayedNuggets[currentIndex];
    if (!currentNugget) return;

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const nuggetId = currentNugget.id;
    const isFavorited = favorites.has(nuggetId);

    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFavorited) {
        next.delete(nuggetId);
      } else {
        next.add(nuggetId);
      }
      return next;
    });

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("nugget_id", nuggetId);

        if (error) throw error;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("favorites") as any)
          .insert({ user_id: user.id, nugget_id: nuggetId });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert on error
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFavorited) {
          next.add(nuggetId);
        } else {
          next.delete(nuggetId);
        }
        return next;
      });
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowFavoritesOnly(false);
  };

  // Toggle favorites filter
  const handleToggleFavorites = () => {
    if (!user && !showFavoritesOnly) {
      setShowAuthModal(true);
      return;
    }
    setShowFavoritesOnly((prev) => !prev);
  };

  const currentNugget = displayedNuggets[currentIndex];

  return (
    <div className="min-h-screen bg-library">
      <Header
        user={user}
        onSignIn={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={handleToggleFavorites}
        favoritesCount={favorites.size}
      />

      <main className="pt-16 pb-8 min-h-screen flex flex-col justify-start items-center" style={{ paddingTop: "max(4rem, 12vh)" }}>
        {isLoading ? (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--tan)] rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-sm text-[var(--text-muted)]">Loading wisdom...</p>
          </div>
        ) : displayedNuggets.length === 0 ? (
          <div className="text-center">
            <p className="text-[var(--text-muted)]">
              {showFavoritesOnly ? "No favorites yet" : "No nuggets found"}
            </p>
            {showFavoritesOnly && (
              <button
                onClick={() => setShowFavoritesOnly(false)}
                className="mt-3 text-[var(--tan)] hover:text-[var(--parchment)] text-sm underline"
              >
                Browse all nuggets
              </button>
            )}
          </div>
        ) : (
          <NuggetViewer
            nuggets={displayedNuggets}
            currentIndex={currentIndex}
            onNext={handleNext}
            onPrev={handlePrev}
            isFavorited={currentNugget ? favorites.has(currentNugget.id) : false}
            onFavoriteToggle={handleFavoriteToggle}
            totalCount={totalCount}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
