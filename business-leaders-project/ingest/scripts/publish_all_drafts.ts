/**
 * Publish All Drafts
 *
 * Moves all draft nuggets to published status.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx ingest/scripts/publish_all_drafts.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log("\nPublishing all draft nuggets...\n");

  // Count drafts first
  const { count: draftCount } = await supabase
    .from("nuggets")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

  console.log(`Found ${draftCount} draft nuggets`);

  if (draftCount === 0) {
    console.log("No drafts to publish.");
    return;
  }

  // Update all drafts to published
  const { error } = await supabase
    .from("nuggets")
    .update({ status: "published" })
    .eq("status", "draft");

  if (error) {
    console.error("Error publishing drafts:", error);
    process.exit(1);
  }

  console.log(`\n✓ Published ${draftCount} nuggets!`);

  // Show final counts
  const { count: publishedCount } = await supabase
    .from("nuggets")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  console.log(`Total published nuggets: ${publishedCount}\n`);
}

main().catch(console.error);
