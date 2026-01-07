/**
 * Insight Generation Script
 *
 * Reads insights from data/insights_raw.json and processes them
 * for the queue. All insights are original paraphrases, NOT verbatim quotes.
 *
 * Usage: npx tsx ingest/scripts/generate_insights.ts
 */

import * as fs from "fs";
import * as path from "path";
import type { InsightProposal, TopicTag } from "./types";
import { TOPIC_TAGS } from "./types";

// Source URLs for attribution
const SOURCE_URLS: Record<string, string> = {
  "Founders Podcast": "https://www.founderspodcast.com",
  "Acquired": "https://www.acquired.fm",
};

interface RawInsight {
  leader: string;
  text: string;
  tags: string[];
  type: string;
  source: string;
}

/**
 * Load insights from JSON data file
 */
function loadInsights(): RawInsight[] {
  const dataPath = path.join(__dirname, "../data/insights_raw.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(raw);
}

/**
 * Convert raw insight to InsightProposal format
 */
function convertInsight(raw: RawInsight): InsightProposal {
  // Validate tags against allowed list
  const validTags = raw.tags.filter((t) =>
    TOPIC_TAGS.includes(t as TopicTag)
  ) as TopicTag[];

  return {
    leader_slug: raw.leader,
    text: raw.text,
    topic_tags: validTags.slice(0, 3), // Max 3 tags
    type: raw.type as "quote" | "principle" | "framework" | "story",
    source_title: raw.source,
    source_url: SOURCE_URLS[raw.source] || "https://www.founderspodcast.com",
    source_year: 2023,
    confidence: "paraphrased",
  };
}

/**
 * Generate a simple hash for deduplication
 */
function hashText(text: string): string {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Deduplicate insights based on text similarity
 */
function dedupeInsights(insights: InsightProposal[]): InsightProposal[] {
  const seen = new Set<string>();
  const result: InsightProposal[] = [];

  for (const insight of insights) {
    const hash = hashText(insight.text);
    if (!seen.has(hash)) {
      seen.add(hash);
      result.push(insight);
    }
  }

  return result;
}

/**
 * Balance insights to avoid clustering
 * Ensures no more than 2 consecutive from same leader
 */
function balanceInsights(insights: InsightProposal[]): InsightProposal[] {
  const result: InsightProposal[] = [];
  const remaining = [...insights];

  while (remaining.length > 0) {
    const last1 = result[result.length - 1]?.leader_slug;
    const last2 = result[result.length - 2]?.leader_slug;

    // Find candidates that differ from last 2
    let candidates = remaining.filter(
      (i) => i.leader_slug !== last1 && i.leader_slug !== last2
    );

    // Relax if needed
    if (candidates.length === 0) {
      candidates = remaining.filter((i) => i.leader_slug !== last1);
    }
    if (candidates.length === 0) {
      candidates = remaining;
    }

    // Pick first candidate
    const picked = candidates[0];
    result.push(picked);
    remaining.splice(remaining.indexOf(picked), 1);
  }

  return result;
}

/**
 * Validate insights meet quality bar
 */
function validateInsight(insight: InsightProposal): boolean {
  // Check required fields
  if (!insight.leader_slug || !insight.text || !insight.source_url) {
    return false;
  }

  // Check topic tags
  if (insight.topic_tags.length === 0) {
    console.warn(`  Warning: No valid topic tags for insight from ${insight.leader_slug}`);
    return false;
  }

  return true;
}

/**
 * Main function
 */
async function main() {
  console.log("\nGenerating business insights...\n");

  // Load from JSON
  console.log("Loading insights from data file...");
  const rawInsights = loadInsights();
  console.log(`  Loaded ${rawInsights.length} raw insights`);

  // Convert to proper format
  let insights = rawInsights.map(convertInsight);

  // Validate
  console.log(`Validating ${insights.length} insights...`);
  insights = insights.filter(validateInsight);
  console.log(`  ${insights.length} insights passed validation`);

  // Dedupe
  console.log("Deduplicating...");
  insights = dedupeInsights(insights);
  console.log(`  ${insights.length} unique insights`);

  // Balance
  console.log("Balancing to avoid clustering...");
  insights = balanceInsights(insights);

  // Stats
  const byLeader: Record<string, number> = {};
  for (const insight of insights) {
    byLeader[insight.leader_slug] = (byLeader[insight.leader_slug] || 0) + 1;
  }

  // Write output
  const outputDir = path.join(__dirname, "../queue");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "insights_batch.json");
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        batch_id: `batch_${Date.now()}`,
        stats: {
          total_insights: insights.length,
          unique_leaders: Object.keys(byLeader).length,
          insights_per_leader: byLeader,
        },
        insights,
      },
      null,
      2
    )
  );

  console.log(`\n✓ Generated ${insights.length} insights`);
  console.log(`  Unique leaders: ${Object.keys(byLeader).length}`);
  console.log(`  Output: ${outputPath}\n`);
}

main().catch(console.error);
