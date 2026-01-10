import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type SavedArticleUpdate = Database["public"]["Tables"]["saved_articles"]["Update"];

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/articles/[id]
 * Update article (mark read/unread, edit title)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { is_read, title } = body;

    // Build update object
    const updates: SavedArticleUpdate = {};
    if (typeof is_read === "boolean") {
      updates.is_read = is_read;
      updates.read_at = is_read ? new Date().toISOString() : null;
    }
    if (typeof title === "string") {
      updates.title = title;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update with RLS ensuring user owns the article
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("saved_articles") as any)
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Article not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ article: data });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/articles/[id]
 * Remove a saved article
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Delete with RLS ensuring user owns the article
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("saved_articles") as any)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
