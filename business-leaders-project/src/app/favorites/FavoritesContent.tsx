"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { NuggetWithLeader } from "@/lib/supabase/types";
import { Header } from "@/components/Header";
import { NuggetCard } from "@/components/NuggetCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { AuthModal } from "@/components/AuthModal";
import { BusinessStyleAnalysis } from "@/components/BusinessStyleAnalysis";

export function FavoritesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<NuggetWithLeader[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const supabase = createClient();

  // Initialize topics from URL or localStorage
  useEffect(() => {
    const urlTopics = searchParams.get("topics")?.split(",").filter(Boolean) || [];

    if (urlTopics.length > 0) {
      setSelectedTopics(urlTopics);
    } else {
      // Try localStorage
      try {
        const stored = localStorage.getItem("bw:selectedTopics");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setSelectedTopics(parsed);
          }
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [searchParams]);

  // Persist topics to URL and localStorage
  const handleTopicsChange = useCallback((topics: string[]) => {
    setSelectedTopics(topics);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (topics.length > 0) {
      params.set("topics", [...topics].sort().join(","));
    } else {
      params.delete("topics");
    }
    const newUrl = params.toString() ? `/favorites?${params.toString()}` : "/favorites";
    router.replace(newUrl, { scroll: false });

    // Update localStorage
    try {
      localStorage.setItem("bw:selectedTopics", JSON.stringify(topics));
    } catch {
      // Ignore localStorage errors
    }
  }, [router, searchParams]);

  // Handle tag click - set single topic filter
  const handleTagClick = useCallback((tag: string) => {
    handleTopicsChange([tag]);
  }, [handleTopicsChange]);

  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setIsLoading(false);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setFavorites([]);
        setFavoriteIds(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          nugget_id,
          nugget:nuggets(
            *,
            leader:leaders(*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      type FavoriteWithNugget = {
        nugget_id: string;
        nugget: NuggetWithLeader | null;
      };

      const nuggetsWithLeaders = ((data || []) as FavoriteWithNugget[])
        .filter((f): f is FavoriteWithNugget & { nugget: NuggetWithLeader } => f.nugget !== null)
        .map((f) => f.nugget);

      setFavorites(nuggetsWithLeaders);
      setFavoriteIds(new Set(nuggetsWithLeaders.map((n) => n.id)));
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  // Remove favorite
  const handleFavoriteToggle = async (nuggetId: string) => {
    if (!user) return;

    // Optimistic update
    setFavorites((prev) => prev.filter((n) => n.id !== nuggetId));
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.delete(nuggetId);
      return next;
    });

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("nugget_id", nuggetId);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing favorite:", error);
      // Refetch on error
      fetchFavorites();
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Derive topics with counts from favorites
  const topicsWithCounts = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    favorites.forEach((n) => {
      n.topic_tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }, [favorites]);

  // Filter favorites by search query and topics
  const filteredFavorites = useMemo(() => {
    let filtered = favorites;

    // Filter by selected topics (ANY-match)
    if (selectedTopics.length > 0) {
      filtered = filtered.filter((n) =>
        n.topic_tags.some((tag) => selectedTopics.includes(tag))
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (n) =>
          n.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.leader.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.topic_tags.some((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    return filtered;
  }, [favorites, selectedTopics, searchQuery]);

  // Get empty message
  const getEmptyMessage = () => {
    if (selectedTopics.length > 0 && searchQuery) {
      return "No favorites match these topics and search";
    }
    if (selectedTopics.length > 0) {
      return "No saved insights for these topics";
    }
    if (searchQuery) {
      return "No favorites match your search";
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-library">
      <Header
        user={user}
        onSignIn={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
        showFavoritesOnly={true}
        favoritesCount={favorites.length}
        topicsWithCounts={topicsWithCounts}
        selectedTopics={selectedTopics}
        onTopicsChange={handleTopicsChange}
      />

      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--parchment)] mb-2">
              My Favorites
            </h1>
            <p className="text-[var(--text-muted)]">
              Your saved nuggets of wisdom
            </p>
          </div>

          {/* Not logged in */}
          {!user && !isLoading && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">❤️</div>
              <h2 className="text-2xl font-bold text-[var(--parchment)] mb-2">
                Sign in to save favorites
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                Create an account to start saving your favorite nuggets
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
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty state - no favorites at all */}
          {user && !isLoading && favorites.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-[var(--parchment)] mb-2">
                No favorites yet
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                Start exploring and save the nuggets that inspire you
              </p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-[var(--tan)] text-[var(--bg)] rounded-lg font-medium hover:bg-[var(--brass)] transition"
              >
                Explore Wisdom
              </button>
            </div>
          )}

          {/* Favorites list */}
          {user && !isLoading && favorites.length > 0 && (
            <>
              {/* Business Style Analysis - show when 1+ favorites */}
              {favorites.length >= 1 && (
                <div className="mb-8">
                  <BusinessStyleAnalysis nuggets={favorites} />
                </div>
              )}

              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search your favorites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--tan)] focus:border-transparent outline-none transition"
                />
              </div>

              {/* Results count */}
              <p className="text-[var(--text-muted)] text-sm mb-4">
                {filteredFavorites.length} favorite{filteredFavorites.length !== 1 ? "s" : ""}
                {searchQuery && ` matching "${searchQuery}"`}
                {selectedTopics.length > 0 && ` in ${selectedTopics.length} topic${selectedTopics.length !== 1 ? "s" : ""}`}
              </p>

              {/* Cards */}
              <div className="space-y-6">
                {filteredFavorites.map((nugget) => (
                  <NuggetCard
                    key={nugget.id}
                    nugget={nugget}
                    isFavorited={favoriteIds.has(nugget.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onTagClick={handleTagClick}
                  />
                ))}
              </div>

              {/* Empty state after filtering */}
              {filteredFavorites.length === 0 && (searchQuery || selectedTopics.length > 0) && (
                <div className="text-center py-12">
                  <p className="text-[var(--text-muted)] mb-4">{getEmptyMessage()}</p>
                  <button
                    onClick={() => {
                      if (selectedTopics.length > 0) {
                        handleTopicsChange([]);
                      }
                      if (searchQuery) {
                        setSearchQuery("");
                      }
                    }}
                    className="text-[var(--tan)] hover:text-[var(--parchment)] text-sm underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
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
