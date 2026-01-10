/**
 * Fetch article metadata from a URL
 * Extracts Open Graph tags (og:title, og:description, og:image)
 * Falls back to standard meta tags and title element
 */

export interface ArticleMetadata {
  title: string | null;
  description: string | null;
  image_url: string | null;
  domain: string;
}

/**
 * Extract domain from URL for display
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Fetch and parse metadata from a URL
 * Returns null values if fetch fails (article is still saved)
 */
export async function fetchArticleMetadata(
  url: string
): Promise<ArticleMetadata> {
  const domain = extractDomain(url);

  try {
    // Fetch the page with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BusinessWisdom/1.0; +https://businesswisdom.app)",
        Accept: "text/html",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { title: null, description: null, image_url: null, domain };
    }

    const html = await response.text();

    // Extract metadata using regex (lightweight, no DOM parser needed)
    const title = extractMetaContent(html, [
      'property="og:title"',
      'name="og:title"',
      'property="twitter:title"',
      'name="twitter:title"',
    ]) || extractTitleTag(html);

    const description = extractMetaContent(html, [
      'property="og:description"',
      'name="og:description"',
      'property="twitter:description"',
      'name="twitter:description"',
      'name="description"',
    ]);

    let image_url = extractMetaContent(html, [
      'property="og:image"',
      'name="og:image"',
      'property="twitter:image"',
      'name="twitter:image"',
    ]);

    // Make relative image URLs absolute
    if (image_url && !image_url.startsWith("http")) {
      try {
        const urlObj = new URL(url);
        image_url = new URL(image_url, urlObj.origin).href;
      } catch {
        image_url = null;
      }
    }

    return { title, description, image_url, domain };
  } catch (error) {
    // Log but don't throw - we still want to save the article
    console.error("Error fetching metadata:", error);
    return { title: null, description: null, image_url: null, domain };
  }
}

/**
 * Extract content from meta tag using regex
 */
function extractMetaContent(
  html: string,
  attributes: string[]
): string | null {
  for (const attr of attributes) {
    // Match both content="..." and content='...'
    const patterns = [
      new RegExp(`<meta[^>]*${attr}[^>]*content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*${attr}`, "i"),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return decodeHtmlEntities(match[1].trim());
      }
    }
  }
  return null;
}

/**
 * Extract title from <title> tag
 */
function extractTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (match && match[1]) {
    return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}
