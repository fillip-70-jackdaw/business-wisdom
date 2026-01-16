import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

// Common timezones for dropdown
export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
];

type UserDailyPreferencesInsert =
  Database["public"]["Tables"]["user_daily_preferences"]["Insert"];

/**
 * PATCH /api/daily/preferences
 * Update email preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email_enabled, email_time, email_timezone } = body;

    // Validate timezone
    if (email_timezone && !TIMEZONES.includes(email_timezone)) {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
    }

    // Validate time format (HH:MM:SS or HH:MM)
    if (email_time) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(email_time)) {
        return NextResponse.json(
          { error: "Invalid time format" },
          { status: 400 }
        );
      }
    }

    // Build update object with proper typing
    const upsertData: UserDailyPreferencesInsert = {
      user_id: user.id,
    };

    if (typeof email_enabled === "boolean") {
      upsertData.email_enabled = email_enabled;
    }
    if (email_time) {
      upsertData.email_time =
        email_time.length === 5 ? `${email_time}:00` : email_time;
    }
    if (email_timezone) {
      upsertData.email_timezone = email_timezone;
    }

    // Check if we have any updates besides user_id
    const hasUpdates =
      typeof email_enabled === "boolean" || email_time || email_timezone;

    if (!hasUpdates) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    // Upsert preferences
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("user_daily_preferences")
      .upsert(upsertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ preferences: data });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
