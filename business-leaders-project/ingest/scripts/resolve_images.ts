/**
 * Image Resolution Pipeline
 *
 * Resolves images for leaders using Wikipedia/Wikimedia Commons.
 * Falls back to generated avatars if no licensed image is found.
 *
 * Usage: npx ts-node ingest/scripts/resolve_images.ts
 */

import * as fs from "fs";
import * as path from "path";
import type { LeaderInput, ImageResult } from "./types";

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT = "BusinessWisdomBot/1.0 (https://github.com/your-repo)";

interface WikipediaImageInfo {
  title: string;
  imageinfo?: Array<{
    url: string;
    descriptionurl: string;
    extmetadata?: {
      LicenseShortName?: { value: string };
      Artist?: { value: string };
      Attribution?: { value: string };
    };
  }>;
}

/**
 * Search Wikipedia for a person and get their main image
 */
async function searchWikipediaImage(
  name: string
): Promise<ImageResult | null> {
  try {
    // First, search for the Wikipedia page
    const searchUrl = new URL(WIKIPEDIA_API);
    searchUrl.searchParams.set("action", "query");
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("titles", name);
    searchUrl.searchParams.set("prop", "pageimages|info");
    searchUrl.searchParams.set("pithumbsize", "400");
    searchUrl.searchParams.set("inprop", "url");

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });
    const searchData = await searchRes.json();

    const pages = searchData.query?.pages;
    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    if (pageId === "-1") return null;

    const page = pages[pageId];
    const thumbnail = page.thumbnail?.source;
    const pageUrl = page.fullurl;

    if (!thumbnail) return null;

    // Get the full image info for licensing
    const imageTitle = page.pageimage;
    if (!imageTitle) {
      // Return thumbnail without full license info
      return {
        photo_url: thumbnail,
        photo_source_url: pageUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`,
        photo_license: "Wikipedia",
        photo_attribution: "Via Wikipedia",
        verified: false,
      };
    }

    // Get detailed image info including license
    const imageUrl = new URL(WIKIPEDIA_API);
    imageUrl.searchParams.set("action", "query");
    imageUrl.searchParams.set("format", "json");
    imageUrl.searchParams.set("titles", `File:${imageTitle}`);
    imageUrl.searchParams.set("prop", "imageinfo");
    imageUrl.searchParams.set("iiprop", "url|extmetadata");

    const imageRes = await fetch(imageUrl.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });
    const imageData = await imageRes.json();

    const imagePages = imageData.query?.pages;
    if (!imagePages) {
      return {
        photo_url: thumbnail,
        photo_source_url: pageUrl,
        photo_license: "Wikipedia",
        photo_attribution: "Via Wikipedia",
        verified: false,
      };
    }

    const imagePageId = Object.keys(imagePages)[0];
    const imagePage = imagePages[imagePageId] as WikipediaImageInfo;
    const imageInfo = imagePage.imageinfo?.[0];

    if (!imageInfo) {
      return {
        photo_url: thumbnail,
        photo_source_url: pageUrl,
        photo_license: "Wikipedia",
        photo_attribution: "Via Wikipedia",
        verified: false,
      };
    }

    const license =
      imageInfo.extmetadata?.LicenseShortName?.value || "Wikipedia";
    const artist =
      imageInfo.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, "") ||
      imageInfo.extmetadata?.Attribution?.value?.replace(/<[^>]*>/g, "") ||
      "Unknown";

    return {
      photo_url: thumbnail,
      photo_source_url: imageInfo.descriptionurl || pageUrl,
      photo_license: license,
      photo_attribution: artist,
      verified: true,
    };
  } catch (error) {
    console.error(`Error fetching image for ${name}:`, error);
    return null;
  }
}

/**
 * Verify that an image URL actually loads
 */
async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) return false;

    const contentType = res.headers.get("content-type");
    return contentType?.startsWith("image/") || false;
  } catch {
    return false;
  }
}

/**
 * Generate a fallback avatar SVG data URL
 */
function generateFallbackAvatar(name: string): ImageResult {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Generate a warm, luxurious color based on name hash
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = 25 + (hash % 20); // Warm brown/tan range (25-45)
  const saturation = 30 + (hash % 20); // 30-50%
  const lightness = 25 + (hash % 15); // 25-40%

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="hsl(${hue}, ${saturation}%, ${lightness}%)"/>
      <text x="50" y="50" dy="0.35em" text-anchor="middle"
            font-family="Georgia, serif" font-size="36" font-weight="500"
            fill="hsl(${hue}, 20%, 85%)">
        ${initials}
      </text>
    </svg>
  `.trim();

  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return {
    photo_url: dataUrl,
    photo_source_url: "",
    photo_license: "generated",
    photo_attribution: "Generated avatar",
    verified: true,
  };
}

/**
 * Resolve image for a single leader
 */
async function resolveLeaderImage(
  leader: LeaderInput
): Promise<ImageResult> {
  console.log(`Resolving image for: ${leader.name}`);

  // Try Wikipedia search
  const searchName = leader.wikipedia_search || leader.name;
  const wikiResult = await searchWikipediaImage(searchName);

  if (wikiResult) {
    // Verify the image actually loads
    const isValid = await verifyImageUrl(wikiResult.photo_url);
    if (isValid) {
      console.log(`  ✓ Found Wikipedia image for ${leader.name}`);
      return wikiResult;
    }
    console.log(`  ✗ Wikipedia image failed verification for ${leader.name}`);
  } else {
    console.log(`  ✗ No Wikipedia image found for ${leader.name}`);
  }

  // Fall back to generated avatar
  console.log(`  → Using generated avatar for ${leader.name}`);
  return generateFallbackAvatar(leader.name);
}

/**
 * Main function: resolve images for all leaders
 */
async function main() {
  const leadersPath = path.join(__dirname, "../sources/leaders.json");
  const leadersData = JSON.parse(fs.readFileSync(leadersPath, "utf-8"));
  const leaders: LeaderInput[] = leadersData.leaders;

  console.log(`\nResolving images for ${leaders.length} leaders...\n`);

  const results: Record<string, ImageResult> = {};
  let wikiCount = 0;
  let fallbackCount = 0;

  for (const leader of leaders) {
    const result = await resolveLeaderImage(leader);
    results[leader.slug] = result;

    if (result.photo_license === "generated") {
      fallbackCount++;
    } else {
      wikiCount++;
    }

    // Rate limit to be polite to Wikipedia
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Write results
  const outputPath = path.join(__dirname, "../queue/image_results.json");
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        stats: {
          total: leaders.length,
          wikipedia_images: wikiCount,
          fallback_avatars: fallbackCount,
        },
        results,
      },
      null,
      2
    )
  );

  console.log(`\n✓ Image resolution complete!`);
  console.log(`  Wikipedia images: ${wikiCount}`);
  console.log(`  Fallback avatars: ${fallbackCount}`);
  console.log(`  Results written to: ${outputPath}\n`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { resolveLeaderImage, generateFallbackAvatar, searchWikipediaImage };
