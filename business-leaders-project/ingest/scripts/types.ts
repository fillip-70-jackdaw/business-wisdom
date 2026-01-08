/**
 * Ingestion Pipeline Types
 *
 * These types define the data structures used throughout the
 * insight generation and image resolution pipeline.
 */

// Controlled vocabulary for topic tags (max 40 tags)
export const TOPIC_TAGS = [
  "leadership",
  "strategy",
  "innovation",
  "culture",
  "hiring",
  "product",
  "sales",
  "marketing",
  "fundraising",
  "growth",
  "competition",
  "focus",
  "decision-making",
  "risk",
  "failure",
  "success",
  "persistence",
  "vision",
  "execution",
  "simplicity",
  "quality",
  "customer-obsession",
  "frugality",
  "speed",
  "learning",
  "mentorship",
  "partnerships",
  "negotiation",
  "pricing",
  "branding",
  "storytelling",
  "communication",
  "motivation",
  "work-ethic",
  "integrity",
  "long-term-thinking",
  "disruption",
  "platform",
  "network-effects",
  "moats",
] as const;

export type TopicTag = (typeof TOPIC_TAGS)[number];

// Source types
export interface SourceEpisode {
  source: "founders" | "acquired" | "book" | "interview" | "biography";
  title: string;
  url: string;
  year?: number;
  leaders: string[]; // Leader names covered in this source
  company?: string;
}

export interface SourceList {
  source: string;
  description: string;
  episodes: SourceEpisode[];
}

// Leader data for ingestion
export interface LeaderInput {
  name: string;
  slug: string;
  title: string;
  wikipedia_search?: string; // Override for Wikipedia image search
  companies?: string[];
  era?: string; // e.g., "1900s", "modern"
}

// Image resolution result
export interface ImageResult {
  photo_url: string;
  photo_source_url: string;
  photo_license: string;
  photo_attribution: string;
  verified: boolean;
}

// Generated insight (pre-database)
export interface InsightProposal {
  leader_slug: string;
  text: string;
  topic_tags: TopicTag[];
  type: "principle" | "framework" | "story" | "quote";
  source_title: string;
  source_url: string;
  source_year?: number;
  confidence: "paraphrased" | "attributed" | "verified";
}

// Queue file format
export interface QueueBatch {
  generated_at: string;
  batch_id: string;
  leaders: LeaderInput[];
  insights: InsightProposal[];
  image_results: Record<string, ImageResult>;
  stats: {
    total_insights: number;
    total_leaders: number;
    insights_per_leader: Record<string, number>;
  };
}

// Deduplication hash record
export interface DedupeRecord {
  hash: string;
  text: string;
  leader_slug: string;
}
