import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateStreakUpdate } from "@/lib/streakCalculator";
import type { UserDailyPreferences } from "@/lib/supabase/types";

// Helper to cast supabase client for new tables (until types are regenerated from DB)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

/**
 * POST /api/daily/visit
 * Records a visit to /daily page and updates streak
 * Returns updated streak info with milestone notifications
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current preferences
    let { data: prefs }: { data: UserDailyPreferences | null } = await (
      supabase as AnySupabase
    )
      .from("user_daily_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Create if doesn't exist
    if (!prefs) {
      const { data: newPrefs } = await (supabase as AnySupabase)
        .from("user_daily_preferences")
        .insert({ user_id: user.id })
        .select()
        .single();
      prefs = newPrefs;
    }

    if (!prefs) {
      return NextResponse.json(
        { error: "Failed to get preferences" },
        { status: 500 }
      );
    }

    // Calculate streak update
    const update = calculateStreakUpdate(
      prefs.current_streak,
      prefs.longest_streak,
      prefs.last_visit_date,
      prefs.total_visits
    );

    // Update in database
    const { error: updateError } = await (supabase as AnySupabase)
      .from("user_daily_preferences")
      .update({
        current_streak: update.current_streak,
        longest_streak: update.longest_streak,
        last_visit_date: update.last_visit_date,
        total_visits: update.total_visits,
      })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      streak: {
        current: update.current_streak,
        longest: update.longest_streak,
        totalVisits: update.total_visits,
      },
      streakMaintained: update.streakMaintained,
      streakBroken: update.streakBroken,
      isNewStreak: update.isNewStreak,
      milestoneReached: update.milestoneReached,
    });
  } catch (error) {
    console.error("Error recording visit:", error);
    return NextResponse.json(
      { error: "Failed to record visit" },
      { status: 500 }
    );
  }
}
