import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime     = "nodejs";
export const maxDuration = 30;

// Module-level singleton — reused across warm invocations on Vercel
let _openai: import("openai").default | null = null;
function getOpenAIClient(apiKey: string) {
  if (!_openai) _openai = new OpenAI({ apiKey });
  return _openai;
}

function buildPrompt(location: string): string {
  return `You are a local resource assistant. Someone in "${location}" needs real-world help with jobs and basic needs.

Return a JSON array of 7–9 resources. Include ALL of the following categories:
- 2 real staffing/temp agencies that operate in or near "${location}" (e.g. Manpower, Kelly Services, Adecco, Express Employment, Labor Ready/TrueBlue, Aerotek, Staffmark, Spherion)
- 1 official state unemployment/benefits office or website for the state that matches "${location}"
- 1–2 food assistance resources (local food bank, Feeding America affiliate, or SNAP enrollment)
- 1–2 housing or rental assistance resources (HUD, local housing authority, emergency rental assistance)
- 1 workforce development resource (CareerOneStop, local American Job Center, or similar)
- 1 utility assistance program (LIHEAP or a local equivalent)

Each item must use this exact JSON shape:
{
  "name": "Official resource name",
  "type": "temp_agency" | "unemployment" | "food" | "housing" | "utilities" | "workforce" | "social",
  "description": "1–2 sentences: what they offer and who they help",
  "nextStep": "One specific first action — include phone number or URL where possible",
  "url": "https://... (omit the field entirely if you are not confident in the URL)"
}

Return ONLY the raw JSON array — no markdown code fences, no extra explanation.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { location?: string };
    const location = body.location?.trim();

    if (!location) {
      return NextResponse.json({ error: "Location is required." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Service not configured." }, { status: 500 });
    }
    const client = getOpenAIClient(apiKey);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildPrompt(location) },
        { role: "user", content: `Find resources near: ${location}` },
      ],
      temperature: 0.25,
      max_tokens: 1400,
    });

    const raw = (completion.choices[0]?.message?.content ?? "[]").trim();

    // Strip accidental markdown fences the model sometimes adds
    const clean = raw
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    let resources: unknown[];
    try {
      const parsed = JSON.parse(clean);
      resources = Array.isArray(parsed) ? parsed : [];
    } catch {
      return NextResponse.json({ error: "Could not parse resource data. Try again." }, { status: 500 });
    }

    return NextResponse.json({ resources });
  } catch (err) {
    console.error("[/api/resources]", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
