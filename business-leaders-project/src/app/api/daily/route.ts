import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  selectDailyNuggetId,
  getTodayUTC,
  formatDateForDB,
} from "@/lib/dailyNugget";
import type { UserDailyPreferences, NuggetWithLeader } from "@/lib/supabase/types";

// Helper to cast supabase client for new tables (until types are regenerated from DB)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

/**
 * GET /api/daily
 * Returns: today's nugget, user's streak info, random favorite (if any)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const today = getTodayUTC();
    const todayStr = formatDateForDB(today);

    // Get authenticated user (optional - works for anonymous too)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Get or compute today's daily nugget
    // First check cache (use type assertion for new table)
    const { data: cachedDaily } = await (supabase as AnySupabase)
      .from("daily_nuggets")
      .select(
        `
        nugget_id,
        nugget:nuggets(*, leader:leaders(*))
      `
      )
      .eq("date", todayStr)
      .single();

    let dailyNugget;

    if (cachedDaily?.nugget) {
      dailyNugget = cachedDaily.nugget;
    } else {
      // Compute deterministically
      const { data: allNuggets }: { data: { id: string }[] | null } =
        await supabase
          .from("nuggets")
          .select("id")
          .eq("status", "published");

      if (!allNuggets || allNuggets.length === 0) {
        return NextResponse.json(
          { error: "No nuggets available" },
          { status: 404 }
        );
      }

      const nuggetIds = allNuggets.map((n) => n.id);
      const selectedId = selectDailyNuggetId(nuggetIds, today);

      if (!selectedId) {
        return NextResponse.json(
          { error: "Failed to select daily nugget" },
          { status: 500 }
        );
      }

      // Fetch full nugget with leader
      const { data: nugget } = await supabase
        .from("nuggets")
        .select(`*, leader:leaders(*)`)
        .eq("id", selectedId)
        .single();

      dailyNugget = nugget;

      // Cache for the day (upsert to handle race conditions)
      // Only cache if user is authenticated (RLS requires auth for insert)
      if (user && selectedId) {
        await (supabase as AnySupabase)
          .from("daily_nuggets")
          .upsert({ date: todayStr, nugget_id: selectedId });
      }
    }

    if (!dailyNugget) {
      return NextResponse.json(
        { error: "Failed to get daily nugget" },
        { status: 500 }
      );
    }

    // 2. Get user-specific data if authenticated
    let streakInfo = null;
    let randomFavorite = null;
    let preferences: UserDailyPreferences | null = null;
    let isFavorited = false;

    if (user) {
      // Get or create user preferences
      let { data: prefs } = await (supabase as AnySupabase)
        .from("user_daily_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!prefs) {
        // Create default preferences
        const { data: newPrefs } = await (supabase as AnySupabase)
          .from("user_daily_preferences")
          .insert({ user_id: user.id })
          .select()
          .single();
        prefs = newPrefs;
      }

      preferences = prefs;

      // Get streak info
      if (prefs) {
        streakInfo = {
          current_streak: prefs.current_streak,
          longest_streak: prefs.longest_streak,
          last_visit_date: prefs.last_visit_date,
          total_visits: prefs.total_visits,
        };
      }

      // Check if daily nugget is favorited
      const { data: fav } = await supabase
        .from("favorites")
        .select("nugget_id")
        .eq("user_id", user.id)
        .eq("nugget_id", dailyNugget.id)
        .single();

      isFavorited = !!fav;

      // Get random favorite (if user has any, excluding today's daily)
      const { data: favorites }: { data: Array<{ nugget: NuggetWithLeader }> | null } =
        await supabase
          .from("favorites")
          .select(
            `
            nugget_id,
            nugget:nuggets(*, leader:leaders(*))
          `
          )
          .eq("user_id", user.id)
          .neq("nugget_id", dailyNugget.id)
          .limit(10);

      if (favorites && favorites.length > 0) {
        // Pick pseudo-random from pool based on day
        const seed = today.getDate();
        const index = seed % favorites.length;
        randomFavorite = favorites[index]?.nugget;
      }
    }

    return NextResponse.json({
      dailyNugget,
      isFavorited,
      streakInfo,
      randomFavorite,
      preferences: preferences
        ? {
            email_enabled: preferences.email_enabled,
            email_time: preferences.email_time,
            email_timezone: preferences.email_timezone,
          }
        : null,
    });
  } catch (error) {
    console.error("Error in /api/daily:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily data" },
      { status: 500 }
    );
  }
}
