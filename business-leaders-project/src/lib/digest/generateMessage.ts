import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NuggetWithLeader, SavedArticle } from "@/lib/supabase/types";

interface MessageContext {
  nuggets: NuggetWithLeader[];
  articles: SavedArticle[];
  favoriteTopics: Map<string, number>;
}

/**
 * Generate an inspirational message for the daily digest
 * Uses Gemini AI to create a personalized, uplifting message that connects
 * the selected nuggets and articles
 */
export async function generateInspirationalMessage(
  context: MessageContext
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY not configured");
    return getFallbackMessage(context);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 300,
      },
    });

    const prompt = buildPrompt(context);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up the response (remove any markdown formatting if present)
    return text.trim();
  } catch (error) {
    console.error("Error generating inspirational message:", error);
    return getFallbackMessage(context);
  }
}

/**
 * Build the prompt for Gemini to generate an inspirational message
 */
function buildPrompt(context: MessageContext): string {
  const { nuggets, articles, favoriteTopics } = context;

  // Extract key info from nuggets
  const leaders = nuggets.map((n) => n.leader.name);
  const nuggetTexts = nuggets.map((n) => `"${n.text}" - ${n.leader.name}`);

  // Extract topic themes
  const topTopics = Array.from(favoriteTopics.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic);

  // Article info
  const articleTitles = articles.map((a) => a.title || a.domain);

  const hasArticles = articles.length > 0;
  const hasTopics = topTopics.length > 0;

  return `You are a wise, inspiring guide helping someone start their day with intention and wisdom.

Write a brief, uplifting message (3-4 sentences) for their daily wisdom digest. The message should:

1. **Be warmly inspirational** - Start with an encouraging observation or question that sets a positive tone
2. **Connect the wisdom** - Weave together themes from the quotes below into a coherent insight
3. **Make it actionable** - End with a gentle prompt that encourages reflection or action today
4. **Feel personal** - Use "you" and "your" to speak directly to them

Guidelines:
- Write in a warm, conversational tone (like a thoughtful mentor, not a motivational poster)
- Keep it 3-4 sentences (60-80 words max)
- Don't just summarize - find the deeper pattern or theme
- Avoid clichés like "success is a journey" or "believe in yourself"
- Don't mention "today's digest" or "selected for you" (they know this)
- Focus on the WHY behind the wisdom, not just WHAT it says

TODAY'S WISDOM:
${nuggetTexts.join("\n")}

LEADERS FEATURED: ${leaders.join(", ")}
${hasTopics ? `THEMES YOU VALUE: ${topTopics.join(", ")}` : ""}
${hasArticles ? `ARTICLES YOU'VE SAVED: ${articleTitles.slice(0, 2).join(", ")}${articles.length > 2 ? ", and more" : ""}` : ""}

Write the inspirational message (plain text, no markdown):`;
}

/**
 * Fallback message when AI generation fails
 */
function getFallbackMessage(context: MessageContext): string {
  const { nuggets, articles } = context;

  const leaderCount = new Set(nuggets.map((n) => n.leader.name)).size;
  const hasArticles = articles.length > 0;

  const messages = [
    `Today's wisdom comes from ${leaderCount} exceptional ${leaderCount === 1 ? "leader" : "leaders"}. ${hasArticles ? "Along with the articles you've saved, " : ""}these insights are here to spark new thinking and strengthen your leadership foundation. What will you apply today?`,

    `Great leaders aren't born knowing everything—they're built through curiosity and consistent learning. ${hasArticles ? "Your saved articles and " : ""}today's nuggets offer fresh perspectives to challenge your assumptions. Which idea will you sit with today?`,

    `The wisdom of ${leaderCount} proven ${leaderCount === 1 ? "leader is" : "leaders are"} at your fingertips. ${hasArticles ? "Combined with what you've been reading, " : ""}these insights can shape how you show up today. What resonates most right now?`,
  ];

  // Rotate through messages based on day of week
  const dayIndex = new Date().getDay();
  return messages[dayIndex % messages.length];
}
