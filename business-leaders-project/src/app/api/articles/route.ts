import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchArticleMetadata, extractDomain } from "@/lib/fetchMetadata";

/**
 * GET /api/articles
 * List user's saved articles with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // 'read', 'unread', or null for all

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from("saved_articles") as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (filter === "read") {
      query = query.eq("is_read", true);
    } else if (filter === "unread") {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ articles: data || [] });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles
 * Save a new article URL
 */
export async function POST(request: NextRequest) {
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
    const { url, title: providedTitle } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Check for duplicate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from("saved_articles") as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("url", url)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Article already saved" },
        { status: 409 }
      );
    }

    // Fetch metadata from URL
    const metadata = await fetchArticleMetadata(url);

    // Insert article
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("saved_articles") as any)
      .insert({
        user_id: user.id,
        url,
        title: providedTitle || metadata.title,
        description: metadata.description,
        image_url: metadata.image_url,
        domain: metadata.domain || extractDomain(url),
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ article: data }, { status: 201 });
  } catch (error) {
    console.error("Error saving article:", error);
    return NextResponse.json(
      { error: "Failed to save article" },
      { status: 500 }
    );
  }
}
