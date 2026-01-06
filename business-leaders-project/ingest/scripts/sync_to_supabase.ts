/**
 * Sync Queue to Supabase
 *
 * Reads processed queue files and syncs to Supabase database.
 * Leaders are upserted, insights are inserted as drafts.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx ts-node ingest/scripts/sync_to_supabase.ts
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import type { InsightProposal, ImageResult, LeaderInput } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface QueueData {
  insights: InsightProposal[];
}

interface ImageQueueData {
  results: Record<string, ImageResult>;
}

interface LeaderQueueData {
  leaders: LeaderInput[];
}

/**
 * Sync a leader to the database (upsert)
 */
async function syncLeader(
  leader: LeaderInput,
  imageResult: ImageResult | null
): Promise<string | null> {
  const data = {
    name: leader.name,
    slug: leader.slug,
    title: leader.title,
    photo_url: imageResult?.photo_url || generateFallbackUrl(leader.name),
    photo_credit: imageResult?.photo_attribution || null,
    photo_license: imageResult?.photo_license || "generated",
    photo_source_url: imageResult?.photo_source_url || null,
    photo_attribution: imageResult?.photo_attribution || null,
  };

  // Try to find existing leader
  const { data: existing } = await supabase
    .from("leaders")
    .select("id")
    .eq("slug", leader.slug)
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from("leaders")
      .update(data)
      .eq("id", existing.id);

    if (error) {
      console.error(`  Error updating leader ${leader.name}:`, error);
      return null;
    }
    return existing.id;
  } else {
    // Insert new
    const { data: inserted, error } = await supabase
      .from("leaders")
      .insert(data)
      .select("id")
      .single();

    if (error) {
      console.error(`  Error inserting leader ${leader.name}:`, error);
      return null;
    }
    return inserted?.id || null;
  }
}

/**
 * Sync an insight to the database (insert as draft)
 */
async function syncInsight(
  insight: InsightProposal,
  leaderIdMap: Record<string, string>
): Promise<boolean> {
  const leaderId = leaderIdMap[insight.leader_slug];
  if (!leaderId) {
    console.error(`  Leader not found for slug: ${insight.leader_slug}`);
    return false;
  }

  // Check if this insight already exists (by text hash)
  const textHash = hashText(insight.text);
  const { data: existing } = await supabase
    .from("nuggets")
    .select("id")
    .eq("leader_id", leaderId)
    .ilike("text", `%${insight.text.slice(0, 50)}%`)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`  Skipping duplicate insight: ${insight.text.slice(0, 40)}...`);
    return false;
  }

  const { error } = await supabase.from("nuggets").insert({
    leader_id: leaderId,
    text: insight.text,
    topic_tags: insight.topic_tags,
    type: insight.type,
    source_title: insight.source_title,
    source_url: insight.source_url,
    source_year: insight.source_year,
    confidence: insight.confidence,
    status: "draft", // Always insert as draft for review
  });

  if (error) {
    console.error(`  Error inserting insight:`, error);
    return false;
  }

  return true;
}

/**
 * Generate fallback avatar URL
 */
function generateFallbackUrl(name: string): string {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = 25 + (hash % 20);
  const saturation = 30 + (hash % 20);
  const lightness = 25 + (hash % 15);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="hsl(${hue}, ${saturation}%, ${lightness}%)"/><text x="50" y="50" dy="0.35em" text-anchor="middle" font-family="Georgia, serif" font-size="36" font-weight="500" fill="hsl(${hue}, 20%, 85%)">${initials}</text></svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Simple text hash
 */
function hashText(text: string): string {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Main sync function
 */
async function main() {
  console.log("\nSyncing queue to Supabase...\n");

  // Load queue files
  const queueDir = path.join(__dirname, "../queue");
  const insightsPath = path.join(queueDir, "insights_batch.json");
  const imagesPath = path.join(queueDir, "image_results.json");
  const leadersPath = path.join(__dirname, "../sources/leaders.json");

  if (!fs.existsSync(insightsPath)) {
    console.error("No insights batch found. Run generate_insights.ts first.");
    process.exit(1);
  }

  const insightsData: QueueData = JSON.parse(fs.readFileSync(insightsPath, "utf-8"));
  const leadersData: LeaderQueueData = JSON.parse(fs.readFileSync(leadersPath, "utf-8"));

  let imageResults: Record<string, ImageResult> = {};
  if (fs.existsSync(imagesPath)) {
    const imagesData: ImageQueueData = JSON.parse(fs.readFileSync(imagesPath, "utf-8"));
    imageResults = imagesData.results;
  }

  // Get unique leaders from insights
  const insightLeaderSlugs = new Set(insightsData.insights.map((i) => i.leader_slug));
  const leaders = leadersData.leaders.filter((l) => insightLeaderSlugs.has(l.slug));

  console.log(`Syncing ${leaders.length} leaders...`);
  const leaderIdMap: Record<string, string> = {};

  for (const leader of leaders) {
    const imageResult = imageResults[leader.slug] || null;
    const leaderId = await syncLeader(leader, imageResult);
    if (leaderId) {
      leaderIdMap[leader.slug] = leaderId;
      console.log(`  ✓ ${leader.name}`);
    } else {
      console.log(`  ✗ ${leader.name}`);
    }
  }

  console.log(`\nSyncing ${insightsData.insights.length} insights...`);
  let inserted = 0;
  let skipped = 0;

  for (const insight of insightsData.insights) {
    const success = await syncInsight(insight, leaderIdMap);
    if (success) {
      inserted++;
      if (inserted % 10 === 0) {
        console.log(`  Inserted ${inserted} insights...`);
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n✓ Sync complete!`);
  console.log(`  Leaders synced: ${Object.keys(leaderIdMap).length}`);
  console.log(`  Insights inserted: ${inserted}`);
  console.log(`  Insights skipped: ${skipped}\n`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { syncLeader, syncInsight };
