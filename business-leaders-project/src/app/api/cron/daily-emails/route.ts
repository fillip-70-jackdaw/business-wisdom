import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  selectDailyNuggetId,
  getTodayUTC,
  formatDateForDB,
} from "@/lib/dailyNugget";
import { sendDailyDigest } from "@/lib/email/sendDailyDigest";
import type { Database, NuggetWithLeader } from "@/lib/supabase/types";

// Lazy-initialize Supabase admin client to avoid build-time errors
let _supabaseAdmin: SupabaseClient<Database> | null = null;

function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

/**
 * Get local time for a timezone
 */
function getLocalTimeForTimezone(
  utcDate: Date,
  timezone: string
): { hour: number; minute: number } {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(utcDate);
    const hour = parseInt(
      parts.find((p) => p.type === "hour")?.value || "0",
      10
    );
    const minute = parseInt(
      parts.find((p) => p.type === "minute")?.value || "0",
      10
    );
    return { hour, minute };
  } catch {
    // Fallback to UTC
    return { hour: utcDate.getUTCHours(), minute: utcDate.getUTCMinutes() };
  }
}

/**
 * POST /api/cron/daily-emails
 * Called by Vercel Cron every hour to send emails for that hour's recipients
 *
 * Vercel cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/daily-emails",
 *     "schedule": "0 * * * *"  // Every hour on the hour
 *   }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentMinuteUTC = now.getUTCMinutes();

    // Get today's nugget
    const today = getTodayUTC();
    const todayStr = formatDateForDB(today);

    // Check cache first
    let dailyNuggetId: string | null = null;
    const { data: cached } = await getSupabaseAdmin()
      .from("daily_nuggets")
      .select("nugget_id")
      .eq("date", todayStr)
      .single();

    if (cached) {
      dailyNuggetId = cached.nugget_id;
    } else {
      // Compute deterministically
      const { data: allNuggets } = await getSupabaseAdmin()
        .from("nuggets")
        .select("id")
        .eq("status", "published");

      if (allNuggets && allNuggets.length > 0) {
        const nuggetIds = allNuggets.map((n) => n.id);
        dailyNuggetId = selectDailyNuggetId(nuggetIds, today);

        // Cache it
        if (dailyNuggetId) {
          await getSupabaseAdmin()
            .from("daily_nuggets")
            .upsert({ date: todayStr, nugget_id: dailyNuggetId });
        }
      }
    }

    if (!dailyNuggetId) {
      return NextResponse.json(
        { error: "No daily nugget available" },
        { status: 500 }
      );
    }

    // Fetch full nugget
    const { data: nugget } = await getSupabaseAdmin()
      .from("nuggets")
      .select(`*, leader:leaders(*)`)
      .eq("id", dailyNuggetId)
      .single();

    if (!nugget) {
      return NextResponse.json({ error: "Nugget not found" }, { status: 500 });
    }

    // Find users whose preferred time (in their timezone) matches current UTC hour
    const { data: preferences } = await getSupabaseAdmin()
      .from("user_daily_preferences")
      .select(
        `
        user_id,
        email_time,
        email_timezone,
        current_streak,
        longest_streak
      `
      )
      .eq("email_enabled", true);

    if (!preferences || preferences.length === 0) {
      return NextResponse.json({ sent: 0, message: "No recipients" });
    }

    // Get user emails from Supabase auth
    const userIds = preferences.map((p) => p.user_id);
    const { data: usersData } = await getSupabaseAdmin().auth.admin.listUsers({
      perPage: 1000,
    });

    const userEmailMap = new Map(
      usersData?.users
        ?.filter((u) => userIds.includes(u.id) && u.email)
        .map((u) => [u.id, u.email!]) || []
    );

    let sentCount = 0;
    const errors: string[] = [];
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://businesswisdom.app";

    for (const pref of preferences) {
      // Calculate the local hour for this user
      const localTime = getLocalTimeForTimezone(now, pref.email_timezone);
      const preferredHour = parseInt(pref.email_time.split(":")[0], 10);

      // Check if it's time to send (within first 10 minutes of the preferred hour)
      if (localTime.hour === preferredHour && currentMinuteUTC < 10) {
        const email = userEmailMap.get(pref.user_id);
        if (!email) continue;

        const result = await sendDailyDigest(email, {
          nugget: nugget as NuggetWithLeader,
          streak: {
            current: pref.current_streak,
            longest: pref.longest_streak,
          },
          baseUrl,
        });

        if (result.success) {
          sentCount++;
        } else {
          errors.push(`${email}: ${result.error}`);
        }
      }
    }

    return NextResponse.json({
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

// Also support GET for manual testing (with same auth)
export async function GET(request: NextRequest) {
  return POST(request);
}
