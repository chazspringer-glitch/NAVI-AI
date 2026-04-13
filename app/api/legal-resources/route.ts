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
  location:      string;
  situationType?: string;
}

const SITUATION_LABELS: Record<string, string> = {
  police:  "police encounter / criminal defense",
  court:   "court proceedings / criminal case",
  housing: "eviction / housing dispute",
  family:  "family law / domestic situation",
  other:   "general legal assistance",
};

function buildPrompt(location: string, situationType?: string): string {
  const sitLabel = situationType ? SITUATION_LABELS[situationType] ?? situationType : "general legal help";

  return `You are a legal aid resource specialist. Someone in "${location}" needs free or low-cost legal help related to: ${sitLabel}.

Return a JSON array of 5–7 local and national legal resources. Include a mix of:
- Local legal aid society or law school clinic (if you know one for this area)
- State bar lawyer referral service
- National org relevant to the situation (e.g., ACLU, NLADA, NHLP, NNEDV, LawHelp.org)
- Court self-help center (mention it exists generically if unsure of local details)
- 211 social services hotline
- Any specialty hotline relevant to the situation type

Each item must use this exact JSON shape:
{
  "name": "Official organization name",
  "type": "legal_aid" | "hotline" | "court_help" | "bar_referral" | "national_org" | "social_services",
  "description": "1–2 sentences: what they offer and who they help",
  "contact": "Phone number and/or website",
  "hours": "Service hours if known, otherwise omit",
  "cost": "Free" | "Low-cost" | "Sliding scale" | "Free initial consult" | "Varies",
  "url": "https://... (only include for nationally known orgs; omit if unsure)"
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
      temperature: 0.25,
      max_tokens:  1400,
      messages: [
        { role: "system", content: buildPrompt(body.location.trim(), body.situationType) },
        { role: "user",   content: `Find legal resources near: ${body.location}` },
      ],
    });

    const raw   = (completion.choices[0]?.message?.content ?? "[]").trim();
    const clean = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    let resources: unknown[];
    try {
      const parsed = JSON.parse(clean);
      resources = Array.isArray(parsed) ? parsed : [];
    } catch {
      return NextResponse.json({ error: "Could not parse resource data. Try again." }, { status: 500 });
    }

    return NextResponse.json({ resources });
  } catch (err) {
    console.error("[/api/legal-resources]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
