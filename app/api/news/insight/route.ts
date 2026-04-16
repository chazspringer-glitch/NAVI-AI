import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime     = "nodejs";
export const maxDuration = 20;
export const dynamic     = "force-dynamic";

// ── Allowed action-button feature IDs ────────────────────────────────────────
// The model is instructed to return 0–3 of these. NewsWebPanel maps each ID
// to a label / icon / color and an open-feature handler in app/page.tsx.
// Kept module-internal because Next.js route files may only export a small
// fixed set of names (GET, POST, runtime, dynamic, etc.).
const ALLOWED_FEATURES = [
  "housing",  "jobs",     "trades",    "legal",     "family",
  "local",    "business", "resume",    "stem",      "ai",
  "history",  "library",  "tv",        "auto",      "academy",
] as const;
type FeatureId = (typeof ALLOWED_FEATURES)[number];

interface InsightRequest {
  title:    string;
  summary?: string;
  source?:  string;
  category?: string;
  url?:     string;
  userContext?: { location?: string; interests?: string[] };
}

interface InsightResponse {
  whatsHappening:    string;
  whyItMatters:      string;
  whatYouShouldDo:   string;
  suggestedFeatures: FeatureId[];
}

// ── In-memory cache (1 hour) ─────────────────────────────────────────────────
const cache = new Map<string, { data: InsightResponse; ts: number }>();
const CACHE_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

// ── OpenAI singleton ─────────────────────────────────────────────────────────
let _openai: OpenAI | null = null;
function getOpenAI(apiKey: string): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey });
  return _openai;
}

export async function POST(req: NextRequest) {
  let body: InsightRequest;
  try {
    body = await req.json() as InsightRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  // Cache key: prefer URL, fall back to title (truncated)
  const cacheKey = (body.url || body.title).slice(0, 256);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return NextResponse.json({ insight: cached.data, cached: true });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI not configured" },
      { status: 503 },
    );
  }

  // ── Build prompt ──────────────────────────────────────────────────────────
  const ctxLines: string[] = [];
  if (body.userContext?.location)            ctxLines.push(`User location: ${body.userContext.location}`);
  if (body.userContext?.interests?.length)   ctxLines.push(`User interests: ${body.userContext.interests.join(", ")}`);
  const ctxBlock = ctxLines.length ? "\n" + ctxLines.join("\n") : "";

  const prompt = [
    `You are NAVI — a sharp, no-fluff AI guide who helps everyday people understand the news AND know what to do about it. You speak warmly and directly to the reader. No jargon. No hedging.`,
    "",
    "A news article was just shared. Break it down for the user as STRICT JSON.",
    "",
    "ARTICLE",
    `Title:    ${body.title}`,
    body.summary  ? `Summary:  ${body.summary}`   : "",
    body.source   ? `Source:   ${body.source}`    : "",
    body.category ? `Category: ${body.category}`  : "",
    ctxBlock,
    "",
    "RETURN JSON with EXACTLY this shape:",
    `{`,
    `  "whatsHappening":    "1–2 sentences in plain English. Explain it like you would to a friend.",`,
    `  "whyItMatters":      "1–2 sentences on the real-world impact for an everyday person — money, jobs, rights, family, daily life.",`,
    `  "whatYouShouldDo":   "1–3 short, concrete actions the reader can take now. If nothing actionable applies, write a one-line 'stay informed' note explaining what to watch for.",`,
    `  "suggestedFeatures": ["feature_id_1", "feature_id_2"]`,
    `}`,
    "",
    "Available feature IDs (pick 0–3 that genuinely help the user act on this story):",
    "- housing  : home buying / renting / housing assistance",
    "- jobs     : job search and careers",
    "- trades   : skilled-trade career paths (CDL, electrician, HVAC, etc.)",
    "- legal    : legal rights / civil-rights guide",
    "- family   : family support resources / benefits",
    "- local    : local resources finder",
    "- business : business plan builder for entrepreneurs",
    "- resume   : resume builder",
    "- stem     : adult STEM education program",
    "- ai       : AI skills program",
    "- history  : Black history education",
    "- library  : NAVI's book library",
    "- tv       : NaviTV educational content",
    "- auto     : car finder",
    "- academy  : enroll in NAVI Academy programs",
    "",
    "RULES",
    "- No markdown. No emojis. No headers in the field values.",
    "- Keep each field tight — do not pad. Be useful, not wordy.",
    "- If the article is fluff or irrelevant to a user's life, say so honestly in whyItMatters.",
    "- Only include features that genuinely fit. Empty array is fine.",
  ].filter(Boolean).join("\n");

  // ── Call OpenAI ───────────────────────────────────────────────────────────
  let raw: string | null = null;
  try {
    const openai = getOpenAI(apiKey);
    const completion = await openai.chat.completions.create({
      model:           "gpt-4o-mini",
      messages:        [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature:     0.6,
      max_tokens:      500,
    });
    raw = completion.choices[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[news/insight] OpenAI error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  if (!raw) {
    return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
  }

  // ── Parse + sanitize ─────────────────────────────────────────────────────
  let parsed: Partial<InsightResponse>;
  try {
    parsed = JSON.parse(raw) as Partial<InsightResponse>;
  } catch (err) {
    console.error("[news/insight] JSON parse failed:", err, "raw:", raw.slice(0, 200));
    return NextResponse.json({ error: "Malformed AI response" }, { status: 502 });
  }

  const insight: InsightResponse = {
    whatsHappening:  String(parsed.whatsHappening  ?? "").trim().slice(0, 600),
    whyItMatters:    String(parsed.whyItMatters    ?? "").trim().slice(0, 600),
    whatYouShouldDo: String(parsed.whatYouShouldDo ?? "").trim().slice(0, 800),
    suggestedFeatures: Array.isArray(parsed.suggestedFeatures)
      ? parsed.suggestedFeatures
          .filter((f): f is FeatureId => ALLOWED_FEATURES.includes(f as FeatureId))
          .slice(0, 3)
      : [],
  };

  // Cache + cap size
  cache.set(cacheKey, { data: insight, ts: Date.now() });
  if (cache.size > MAX_CACHE_ENTRIES) {
    // Drop the oldest 25% to keep memory bounded
    const drop = Math.floor(MAX_CACHE_ENTRIES * 0.25);
    const keys = Array.from(cache.keys()).slice(0, drop);
    keys.forEach((k) => cache.delete(k));
  }

  return NextResponse.json({ insight, cached: false });
}
