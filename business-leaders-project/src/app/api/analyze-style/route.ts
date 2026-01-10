import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface NuggetData {
  text: string;
  leaderName: string;
  topicTags: string[];
}

function buildAnalysisPrompt(nuggets: NuggetData[]): string {
  const leaderNames = [...new Set(nuggets.map((n) => n.leaderName))];
  const allTags = nuggets.flatMap((n) => n.topicTags);
  const tagCounts = allTags.reduce(
    (acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  const nuggetTexts = nuggets
    .map((n) => `"${n.text}" - ${n.leaderName}`)
    .join("\n\n");

  return `You are a business psychology analyst. Analyze the following collection of business wisdom nuggets that a user has saved as favorites. Based on their choices, create a personalized "Business Style Profile."

SAVED NUGGETS (${nuggets.length} total):
${nuggetTexts}

LEADERS THEY FOLLOW: ${leaderNames.join(", ")}
TOP TOPICS: ${topTags.join(", ")}

Create a concise, insightful analysis (250-350 words) with these sections:

1. **Your Leadership DNA** - What core philosophy emerges from their choices? What do they value most?

2. **Dominant Themes** - What 2-3 recurring ideas appear across their saved wisdom?

3. **Your Business Archetype** - Give them a creative, memorable archetype name (e.g., "The Strategic Visionary", "The People-First Builder", "The Calculated Risk-Taker") with a brief explanation.

4. **Actionable Insight** - One specific suggestion based on patterns you see.

Guidelines:
- Be specific, reference actual quotes they saved
- Keep tone warm but professional
- Avoid generic advice
- Make it feel personalized and insightful
- Use second person ("You tend to...")
- Format with markdown (bold for section headers)`;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { nuggets } = (await request.json()) as { nuggets: NuggetData[] };

    if (!nuggets || nuggets.length === 0) {
      return NextResponse.json(
        { error: "No nuggets provided" },
        { status: 400 }
      );
    }

    if (nuggets.length < 1) {
      return NextResponse.json(
        { error: "Need at least 1 favorite for analysis" },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    // Initialize Gemini - use gemini-1.5-flash for free tier compatibility
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    // Build prompt and call API
    const prompt = buildAnalysisPrompt(nuggets);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ analysis: text });
  } catch (error) {
    console.error("Analysis error:", error);

    // Get full error details
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorString = String(error);

    // Log full error for debugging
    console.error("Full error:", errorString);

    // Always show the actual error for debugging
    return NextResponse.json(
      { error: `Analysis failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
