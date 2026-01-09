"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<NuggetWithLeader[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

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

  // Filter favorites by search query
  const filteredFavorites = searchQuery
    ? favorites.filter(
        (n) =>
          n.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.leader.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.topic_tags.some((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : favorites;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Header
        user={user}
        onSignIn={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
      />

      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              My Favorites
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Your saved nuggets of wisdom
            </p>
          </div>

          {/* Not logged in */}
          {!user && !isLoading && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">❤️</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Sign in to save favorites
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Create an account to start saving your favorite nuggets
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-700 dark:hover:bg-slate-200 transition"
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

          {/* Empty state */}
          {user && !isLoading && favorites.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                No favorites yet
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Start exploring and save the nuggets that inspire you
              </p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-700 dark:hover:bg-slate-200 transition"
              >
                Explore Wisdom
              </button>
            </div>
          )}

          {/* Favorites list */}
          {user && !isLoading && favorites.length > 0 && (
            <>
              {/* Business Style Analysis - show when 3+ favorites */}
              {favorites.length >= 3 && (
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Results count */}
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                {filteredFavorites.length} favorite{filteredFavorites.length !== 1 ? "s" : ""}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>

              {/* Cards */}
              <div className="space-y-6">
                {filteredFavorites.map((nugget) => (
                  <NuggetCard
                    key={nugget.id}
                    nugget={nugget}
                    isFavorited={favoriteIds.has(nugget.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>

              {filteredFavorites.length === 0 && searchQuery && (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  No favorites match your search
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
