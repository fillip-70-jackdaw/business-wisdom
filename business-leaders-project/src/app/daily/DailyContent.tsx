"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { NuggetWithLeader } from "@/lib/supabase/types";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";
import { DailyNuggetCard } from "./DailyNuggetCard";
import { StreakDisplay } from "./StreakDisplay";
import { EmailPreferencesModal } from "./EmailPreferencesModal";
import { getMilestoneMessage } from "@/lib/streakCalculator";

interface DailyData {
  dailyNugget: NuggetWithLeader;
  isFavorited: boolean;
  streakInfo: {
    current_streak: number;
    longest_streak: number;
    last_visit_date: string | null;
    total_visits: number;
  } | null;
  randomFavorite: NuggetWithLeader | null;
  preferences: {
    email_enabled: boolean;
    email_time: string;
    email_timezone: string;
  } | null;
}

interface VisitResponse {
  streak: {
    current: number;
    longest: number;
    totalVisits: number;
  };
  streakMaintained: boolean;
  streakBroken: boolean;
  isNewStreak: boolean;
  milestoneReached: number | null;
}

// Reflection prompts
const REFLECTION_PROMPTS = [
  "How might you apply this wisdom today?",
  "What decision could this insight inform?",
  "Who in your life embodies this principle?",
  "When have you seen this truth play out?",
  "What's one small action this inspires?",
];

export function DailyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DailyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [visitRecorded, setVisitRecorded] = useState(false);
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const supabase = createClient();

  // Get reflection prompt based on day
  const reflectionPrompt =
    REFLECTION_PROMPTS[new Date().getDate() % REFLECTION_PROMPTS.length];

  // Check for settings query param
  useEffect(() => {
    if (searchParams.get("settings") === "true") {
      setShowPreferencesModal(true);
    }
  }, [searchParams]);

  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Fetch daily data
  const fetchDailyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/daily");
      if (!response.ok) throw new Error("Failed to fetch");

      const dailyData: DailyData = await response.json();
      setData(dailyData);
      setCurrentStreak(dailyData.streakInfo?.current_streak || 0);
      setLongestStreak(dailyData.streakInfo?.longest_streak || 0);
      setTotalVisits(dailyData.streakInfo?.total_visits || 0);
      setIsFavorited(dailyData.isFavorited);
    } catch (error) {
      console.error("Error fetching daily data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyData();
  }, [fetchDailyData]);

  // Record visit (once per page load for authenticated users)
  useEffect(() => {
    const recordVisit = async () => {
      if (!user || visitRecorded) return;

      try {
        const response = await fetch("/api/daily/visit", { method: "POST" });
        if (!response.ok) return;

        const result: VisitResponse = await response.json();
        setVisitRecorded(true);
        setCurrentStreak(result.streak.current);
        setLongestStreak(result.streak.longest);
        setTotalVisits(result.streak.totalVisits);

        if (result.milestoneReached) {
          setMilestoneMessage(getMilestoneMessage(result.milestoneReached));
          // Auto-dismiss after 5 seconds
          setTimeout(() => setMilestoneMessage(null), 5000);
        }
      } catch (error) {
        console.error("Error recording visit:", error);
      }
    };

    recordVisit();
  }, [user, visitRecorded]);

  // Toggle favorite
  const handleFavoriteToggle = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!data?.dailyNugget) return;

    const nuggetId = data.dailyNugget.id;
    const wasFavorited = isFavorited;

    // Optimistic update
    setIsFavorited(!wasFavorited);

    try {
      if (wasFavorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("nugget_id", nuggetId);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("favorites") as any).insert({
          user_id: user.id,
          nugget_id: nuggetId,
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setIsFavorited(wasFavorited); // Revert
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header
        user={user}
        onSignIn={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
        isDailyPage={true}
      />

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-serif text-[var(--parchment)] mb-2">
              Daily Wisdom
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Streak Display */}
          {user && currentStreak >= 0 && (
            <StreakDisplay
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              totalVisits={totalVisits}
            />
          )}

          {/* Milestone Celebration */}
          {milestoneMessage && (
            <div className="mb-6 p-4 bg-[rgba(243,112,34,0.1)] border border-[var(--hermes)] rounded-xl text-center">
              <p className="text-[var(--hermes)] font-medium">
                🎉 {milestoneMessage}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--tan)] rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                Loading today&apos;s wisdom...
              </p>
            </div>
          )}

          {/* Daily Nugget */}
          {!isLoading && data?.dailyNugget && (
            <>
              <div className="mb-8">
                <p className="text-xs uppercase tracking-wider text-[var(--tan)] mb-3">
                  Today&apos;s Wisdom
                </p>
                <DailyNuggetCard
                  nugget={data.dailyNugget}
                  isFavorited={isFavorited}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              </div>

              {/* Reflection Prompt */}
              <div className="mb-8 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Reflection
                </p>
                <p className="text-[var(--text)] italic">{reflectionPrompt}</p>
              </div>

              {/* Random Favorite */}
              {user && data.randomFavorite && (
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-wider text-[var(--tan)] mb-3">
                    From Your Favorites
                  </p>
                  <DailyNuggetCard
                    nugget={data.randomFavorite}
                    isFavorited={true}
                    compact
                  />
                </div>
              )}

              {/* Email Settings Link */}
              {user && (
                <div className="text-center">
                  <button
                    onClick={() => setShowPreferencesModal(true)}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--tan)] transition-colors"
                  >
                    {data.preferences?.email_enabled
                      ? "📧 Email digest enabled"
                      : "📧 Set up daily email digest"}
                  </button>
                </div>
              )}

              {/* Sign in prompt for anonymous users */}
              {!user && (
                <div className="text-center p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                  <p className="text-[var(--text-muted)] mb-4">
                    Sign in to track your streak and receive daily emails
                  </p>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-6 py-2 bg-[var(--tan)] text-[var(--bg)] rounded-lg font-medium hover:bg-[var(--brass)] transition"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {user && (
        <EmailPreferencesModal
          isOpen={showPreferencesModal}
          onClose={() => {
            setShowPreferencesModal(false);
            // Clear query param
            if (searchParams.get("settings")) {
              router.replace("/daily");
            }
          }}
          currentPreferences={data?.preferences || null}
          onSave={fetchDailyData}
        />
      )}
    </div>
  );
}
