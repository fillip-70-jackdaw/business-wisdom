import { createClient } from "@/lib/supabase/server";
import type { NuggetWithLeader, SavedArticle } from "@/lib/supabase/types";
import { generateInspirationalMessage } from "./generateMessage";

export interface DigestContent {
  nuggets: NuggetWithLeader[];
  articles: SavedArticle[];
  message: string;
  generatedAt: Date;
}

/**
 * Generate a personalized daily digest for a user
 * @param userId - The user's ID
 * @returns DigestContent with 3 nuggets, up to 3 articles, and an inspirational message
 */
export async function generateDigest(userId: string): Promise<DigestContent> {
  const supabase = await createClient();

  // 1. Fetch unread saved articles (limit 3)
  const articles = await getUnreadArticles(userId, 3);

  // 2. Fetch user's favorite topics to personalize nugget selection
  const favoriteTopics = await getUserFavoriteTopics(userId);

  // 3. Select 3 personalized nuggets
  const nuggets = await selectPersonalizedNuggets(userId, favoriteTopics, 3);

  // 4. Generate inspirational message
  const message = await generateInspirationalMessage({
    nuggets,
    articles,
    favoriteTopics,
  });

  return {
    nuggets,
    articles,
    message,
    generatedAt: new Date(),
  };
}

/**
 * Get unread saved articles for a user
 */
async function getUnreadArticles(
  userId: string,
  limit: number
): Promise<SavedArticle[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("saved_articles")
    .select("*")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching unread articles:", error);
    return [];
  }

  return data || [];
}

/**
 * Analyze user's favorite nuggets to determine their topic preferences
 * Returns a scored map of topics by frequency
 */
async function getUserFavoriteTopics(
  userId: string
): Promise<Map<string, number>> {
  const supabase = await createClient();

  // Fetch all favorited nuggets with their topics
  const { data: favorites, error } = await supabase
    .from("favorites")
    .select(
      `
      nugget_id,
      nuggets (
        topic_tags
      )
    `
    )
    .eq("user_id", userId);

  if (error || !favorites) {
    console.error("Error fetching favorites:", error);
    return new Map();
  }

  // Count topic frequencies
  const topicCounts = new Map<string, number>();

  for (const fav of favorites) {
    const nugget = fav.nuggets as { topic_tags: string[] } | null;
    if (nugget?.topic_tags) {
      for (const tag of nugget.topic_tags) {
        topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
      }
    }
  }

  return topicCounts;
}

/**
 * Select personalized nuggets for the digest
 * Strategy:
 * - Prefer nuggets with topics the user favorites
 * - Avoid nuggets sent in the last 30 days
 * - Diversify: max 1 nugget per leader
 * - Mix quote types (quotes, principles, frameworks, stories)
 */
async function selectPersonalizedNuggets(
  userId: string,
  favoriteTopics: Map<string, number>,
  count: number
): Promise<NuggetWithLeader[]> {
  const supabase = await createClient();

  // 1. Get nuggets sent in the last 30 days to avoid repetition
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentHistory } = await supabase
    .from("digest_history")
    .select("nugget_id")
    .eq("user_id", userId)
    .gte("sent_at", thirtyDaysAgo.toISOString())
    .not("nugget_id", "is", null);

  const recentNuggetIds = new Set(
    recentHistory?.map((h) => h.nugget_id).filter(Boolean) || []
  );

  // 2. Fetch all published nuggets with leaders
  const { data: allNuggets, error } = await supabase
    .from("nuggets")
    .select(
      `
      *,
      leader:leaders (*)
    `
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(500); // Get a large pool to choose from

  if (error || !allNuggets) {
    console.error("Error fetching nuggets:", error);
    return [];
  }

  // 3. Filter out recently sent nuggets
  const availableNuggets = allNuggets.filter(
    (n) => !recentNuggetIds.has(n.id)
  ) as NuggetWithLeader[];

  // 4. Score each nugget based on topic affinity
  const scoredNuggets = availableNuggets.map((nugget) => {
    let score = 0;

    // Add points for matching favorite topics
    if (favoriteTopics.size > 0) {
      for (const tag of nugget.topic_tags) {
        const topicScore = favoriteTopics.get(tag) || 0;
        score += topicScore;
      }
    } else {
      // If no favorites, give all nuggets equal random chance
      score = Math.random();
    }

    // Slight bonus for frameworks and principles (more actionable)
    if (nugget.type === "framework" || nugget.type === "principle") {
      score += 0.5;
    }

    return { nugget, score };
  });

  // 5. Sort by score (highest first)
  scoredNuggets.sort((a, b) => b.score - a.score);

  // 6. Select top nuggets with diversity constraints
  const selected: NuggetWithLeader[] = [];
  const usedLeaderIds = new Set<string>();
  const usedTypes = new Set<string>();

  for (const { nugget } of scoredNuggets) {
    if (selected.length >= count) break;

    // Enforce max 1 per leader
    if (usedLeaderIds.has(nugget.leader_id)) continue;

    // Try to diversify types (but don't enforce strictly)
    if (selected.length > 0 && usedTypes.has(nugget.type) && usedTypes.size < 3) {
      continue;
    }

    selected.push(nugget);
    usedLeaderIds.add(nugget.leader_id);
    usedTypes.add(nugget.type);
  }

  // 7. If we don't have enough (unlikely), just take the top-scored ones
  if (selected.length < count) {
    for (const { nugget } of scoredNuggets) {
      if (selected.length >= count) break;
      if (!selected.find((n) => n.id === nugget.id)) {
        selected.push(nugget);
      }
    }
  }

  return selected;
}

/**
 * Check if a digest has already been generated today for a user
 * @param userId - The user's ID
 * @returns boolean indicating if today's digest exists
 */
export async function hasDigestToday(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("digest_history")
    .select("id")
    .eq("user_id", userId)
    .gte("sent_at", startOfDay.toISOString())
    .limit(1);

  if (error) {
    console.error("Error checking digest history:", error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Log digest content to history
 */
export async function logDigestHistory(
  userId: string,
  nuggets: NuggetWithLeader[],
  articles: SavedArticle[]
): Promise<void> {
  const supabase = await createClient();

  const historyEntries = [
    ...nuggets.map((n) => ({
      user_id: userId,
      nugget_id: n.id,
      article_id: null,
    })),
    ...articles.map((a) => ({
      user_id: userId,
      nugget_id: null,
      article_id: a.id,
    })),
  ];

  const { error } = await supabase.from("digest_history").insert(historyEntries);

  if (error) {
    console.error("Error logging digest history:", error);
  }
}
