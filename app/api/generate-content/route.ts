import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30;

let _openai: OpenAI | null = null;
function getClient() {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set");
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

export async function POST(req: NextRequest) {
  try {
    const { businessType, goal } = await req.json();

    if (!businessType || !goal) {
      return NextResponse.json(
        { error: "businessType and goal are required" },
        { status: 400 },
      );
    }

    const openai = getClient();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a social media marketing expert at Springer Industries. Generate a single social media post suggestion. Respond in valid JSON only — no markdown, no code fences. Use this exact structure:
{
  "postIdea": "A brief description of the post concept (1-2 sentences)",
  "caption": "The full ready-to-post caption with emojis (2-4 sentences)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`,
        },
        {
          role: "user",
          content: `Business type: ${businessType}\nGoal: ${goal}\n\nGenerate a high-performing social media post idea.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const result = JSON.parse(raw);

    return NextResponse.json({ result });
  } catch (err) {
    console.error("[api/generate-content] error:", err);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 },
    );
  }
}
