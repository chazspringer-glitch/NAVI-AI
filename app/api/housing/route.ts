import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime     = "nodejs";
export const maxDuration = 30;

let _openai: import("openai").default | null = null;
function getClient(key: string) {
  if (!_openai) _openai = new OpenAI({ apiKey: key });
  return _openai;
}

function buildPrompt(location: string, maxRent: number, bedrooms: string): string {
  const bedroomLabel = bedrooms === "any" ? "any number of bedrooms" : `${bedrooms} bedroom(s)`;
  return `You are an affordable housing resource assistant. Someone needs affordable rental housing in or near "${location}" with a budget of $${maxRent}/month and needs ${bedroomLabel}.

Return a JSON array of 5–7 housing resources. Include a realistic mix:
- 1–2 private owner rental opportunities (described at neighborhood level — never an exact private address)
- 1–2 Section 8 / Housing Choice Voucher contacts (the local Public Housing Authority for ${location})
- 1–2 nonprofit or income-restricted housing developments near ${location}
- 1 emergency or transitional housing resource (211, local shelter, or ERAP program)

Each item must use this exact JSON shape:
{
  "name": "Name of the property, program, or organization",
  "type": "private_owner" | "section_8" | "nonprofit" | "emergency",
  "address": "Neighborhood, district, or general area only — never a specific private address",
  "rent": "$X–$Y/mo or 'Income-based' or 'Voucher covers portion'",
  "bedrooms": "Studio, 1BR, 2BR, etc. or range like '1–3BR'",
  "description": "1–2 sentences: what makes this option suitable, who it serves, any notable flexibility",
  "nextStep": "One specific first action — include a phone number format, how to search, or a program name to look up",
  "waitlist": true or false,
  "url": "https://... (only include if you are confident it is a real, stable URL — omit entirely if uncertain)"
}

For private owner options: keep rent at or under $${maxRent}/month. Describe realistic neighborhood-level availability.
For Section 8 and nonprofit: note income-based pricing. Be accurate about waitlists.
Return ONLY the raw JSON array — no markdown code fences, no explanation.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { location?: string; maxRent?: number; bedrooms?: string };
    const location = body.location?.trim();
    const maxRent  = Math.min(Math.max(Number(body.maxRent) || 1200, 300), 6000);
    const bedrooms = typeof body.bedrooms === "string" ? body.bedrooms : "any";

    if (!location) {
      return NextResponse.json({ error: "Location is required." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Service not configured." }, { status: 500 });
    }
    const client = getClient(apiKey);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildPrompt(location, maxRent, bedrooms) },
        { role: "user",   content: `Find affordable housing near: ${location}` },
      ],
      temperature: 0.28,
      max_tokens: 1600,
    });

    const raw   = (completion.choices[0]?.message?.content ?? "[]").trim();
    const clean = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    let listings: unknown[];
    try {
      const parsed = JSON.parse(clean);
      listings = Array.isArray(parsed) ? parsed : [];
    } catch {
      return NextResponse.json({ error: "Could not parse listing data. Try again." }, { status: 500 });
    }

    return NextResponse.json({ listings });
  } catch (err) {
    console.error("[/api/housing]", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
