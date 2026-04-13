import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime     = "nodejs";
export const maxDuration = 30;

let _openai: OpenAI | null = null;
function getClient(key: string): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: key });
  return _openai;
}

interface RequestBody {
  location:   string;
  childAge?:  string;
  interests?: string;
  budget?:    string;
  quickMode?: boolean;
}

function buildPrompt(body: RequestBody): string {
  const { location, childAge, interests, budget, quickMode } = body;

  const profile = quickMode
    ? `Location: ${location}\nMode: Quick search — return a broad mix of free/low-cost programs for all ages and interests.`
    : [
        `Location: ${location}`,
        childAge  ? `Child age: ${childAge}`     : null,
        interests ? `Interests: ${interests}`    : null,
        budget    ? `Budget: ${budget}`          : null,
      ].filter(Boolean).join("\n");

  return `You are a caring community resource specialist helping a parent in ${location} find local programs for their child. Generate realistic, helpful program suggestions based on the profile below.

CHILD PROFILE:
${profile}

Generate 6–8 real or realistic programs. Prioritize:
- Nationally recognized orgs with local presence: YMCA, Boys & Girls Clubs of America, 4-H, Big Brothers Big Sisters, Girls Who Code, local parks & recreation departments, public libraries, community centers
- Free or low-cost programs, especially those serving underserved communities
- Programs matching the child's interests and age when provided
- Mix of weekday/weekend options where possible

Return a JSON array. Each item must use this exact shape:
{
  "name": "Full program name",
  "organization": "Parent org or department (e.g., 'YMCA of Greater Atlanta')",
  "type": "sports" | "arts" | "stem" | "tutoring" | "community" | "outdoor" | "free_meals",
  "location": "Neighborhood or city (realistic for ${location})",
  "cost": "Free" | "Low-cost (under $25/month)" | "Scholarship available" | "Varies by income" | "$X–$Y/session",
  "description": "1–2 sentences on what the program offers and who it helps",
  "ageRange": "Ages X–Y",
  "contact": "Phone or website (use real contact info for national orgs; omit for local guesses)",
  "url": "https://... (only include for nationally known orgs — omit entirely if unsure)"
}

Return ONLY the raw JSON array — no markdown fences, no explanation.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Service not configured." }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.location?.trim()) {
    return NextResponse.json({ error: "Location is required." }, { status: 400 });
  }

  try {
    const client = getClient(apiKey);
    const completion = await client.chat.completions.create({
      model:       "gpt-4o-mini",
      temperature: 0.3,
      max_tokens:  1600,
      messages: [
        { role: "system", content: buildPrompt(body) },
        { role: "user",   content: `Find youth programs near: ${body.location}` },
      ],
    });

    const raw   = (completion.choices[0]?.message?.content ?? "[]").trim();
    const clean = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    let programs: unknown[];
    try {
      const parsed = JSON.parse(clean);
      programs = Array.isArray(parsed) ? parsed : [];
    } catch {
      return NextResponse.json({ error: "Could not parse program data. Try again." }, { status: 500 });
    }

    return NextResponse.json({ programs });
  } catch (err) {
    console.error("[/api/family-programs]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
