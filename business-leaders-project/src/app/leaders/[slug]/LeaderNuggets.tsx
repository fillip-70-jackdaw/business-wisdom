"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Nugget } from "@/lib/supabase/types";
import { FavoriteButton } from "@/components/FavoriteButton";
import { AuthModal } from "@/components/AuthModal";

interface LeaderNuggetsProps {
  leaderId: string;
}

export function LeaderNuggets({ leaderId }: LeaderNuggetsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [nuggets, setNuggets] = useState<Nugget[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const supabase = createClient();

  // Fetch user
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

  // Fetch nuggets for this leader
  useEffect(() => {
    const fetchNuggets = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("nuggets")
        .select("*")
        .eq("leader_id", leaderId)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setNuggets(data);
      }
      setIsLoading(false);
    };

    fetchNuggets();
  }, [supabase, leaderId]);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      return;
    }

    const { data } = await supabase
      .from("favorites")
      .select("nugget_id")
      .eq("user_id", user.id);

    if (data) {
      setFavorites(new Set((data as { nugget_id: string }[]).map((f) => f.nugget_id)));
    }
  }, [supabase, user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Toggle favorite
  const handleFavoriteToggle = async (nuggetId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

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
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("nugget_id", nuggetId);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("favorites") as any).insert({ user_id: user.id, nugget_id: nuggetId });
      }
    } catch {
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse"
          >
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-full mb-3" />
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-11/12 mb-3" />
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-9/12" />
          </div>
        ))}
      </div>
    );
  }

  if (nuggets.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        No nuggets found for this leader yet.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {nuggets.map((nugget) => (
          <div
            key={nugget.id}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex justify-between items-start gap-4">
              <blockquote className="text-slate-800 dark:text-slate-100 text-lg leading-relaxed font-serif italic flex-1">
                "{nugget.text}"
              </blockquote>
              <FavoriteButton
                isFavorited={favorites.has(nugget.id)}
                onClick={() => handleFavoriteToggle(nugget.id)}
                size="sm"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {nugget.topic_tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {nugget.source_title && (
                <span className="text-slate-500 dark:text-slate-400 text-sm ml-auto">
                  — {nugget.source_title}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
