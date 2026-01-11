import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateDigest,
  logDigestHistory,
} from "@/lib/digest/selectContent";

/**
 * GET /api/digest
 * Fetch today's personalized daily digest
 * Generates fresh content on each request (no caching for Phase 1)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has digest enabled (default: true)
    const { data: preferences } = await supabase
      .from("digest_preferences")
      .select("enabled")
      .eq("user_id", user.id)
      .single();

    // If no preferences exist, create default (enabled by default - opt-out)
    if (!preferences) {
      await supabase.from("digest_preferences").insert({
        user_id: user.id,
        enabled: true,
        email_enabled: true,
      });
    }

    // Even if disabled, still allow viewing in-app (only email is affected)
    // User might have disabled email but still want to view in app

    // Generate fresh digest content
    const digest = await generateDigest(user.id);

    // Log to digest history (for avoiding repetition)
    await logDigestHistory(user.id, digest.nuggets, digest.articles);

    return NextResponse.json({
      digest: {
        message: digest.message,
        nuggets: digest.nuggets,
        articles: digest.articles,
        generatedAt: digest.generatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Digest generation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to generate digest: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/digest
 * Manually regenerate today's digest (refresh button)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate fresh digest (same as GET, but explicit regeneration)
    const digest = await generateDigest(user.id);

    // Log to history
    await logDigestHistory(user.id, digest.nuggets, digest.articles);

    return NextResponse.json({
      digest: {
        message: digest.message,
        nuggets: digest.nuggets,
        articles: digest.articles,
        generatedAt: digest.generatedAt.toISOString(),
      },
      regenerated: true,
    });
  } catch (error) {
    console.error("Digest regeneration error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to regenerate digest: ${errorMessage}` },
      { status: 500 }
    );
  }
}
