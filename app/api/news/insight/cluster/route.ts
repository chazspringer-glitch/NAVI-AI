import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime     = "nodejs";
export const maxDuration = 25;
export const dynamic     = "force-dynamic";

// Same allowlist as single-article insight — keep them in sync if either changes.
const ALLOWED_FEATURES = [
  "housing",  "jobs",     "trades",    "legal",     "family",
  "local",    "business", "resume",    "stem",      "ai",
  "history",  "library",  "tv",        "auto",      "academy",
] as const;
type FeatureId = (typeof ALLOWED_FEATURES)[number];

interface ArticleStub { title: string; summary?: string; source?: string }

interface ClusterInsightRequest {
  clusterId?:   string;
  clusterName:  string;
  keywords?:    string[];
  articles:     ArticleStub[];
  userContext?: { location?: string; interests?: string[] };
}

interface ClusterInsightResponse {
  whatsHappening:    string;
  whyItMatters:      string;
  whatYouShouldDo:   string;
  suggestedFeatures: FeatureId[];
}

// 1-hour in-memory cache keyed by clusterId or fallback hash
const cache = new Map<string, { data: ClusterInsightResponse; ts: number }>();
const CACHE_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;

let _openai: OpenAI | null = null;
function getOpenAI(apiKey: string): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey });
  return _openai;
}

function makeCacheKey(req: ClusterInsightRequest): string {
  if (req.clusterId) return req.clusterId;
  // Fallback: hash article titles
  return req.articles
    .map((a) => a.title)
    .sort()
    .join("|")
    .slice(0, 256);
}

export async function POST(req: NextRequest) {
  let body: ClusterInsightRequest;
  try {
    body = await req.json() as ClusterInsightRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.clusterName || !Array.isArray(body.articles) || body.articles.length === 0) {
    return NextResponse.json({ error: "clusterName and at least one article required" }, { status: 400 });
  }

  const cacheKey = makeCacheKey(body);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return NextResponse.json({ insight: cached.data, cached: true });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI not configured" }, { status: 503 });
  }

  // ── Build prompt — emphasize the TREND across articles ──────────────────
  const ctxLines: string[] = [];
  if (body.userContext?.location)          ctxLines.push(`User location: ${body.userContext.location}`);
  if (body.userContext?.interests?.length) ctxLines.push(`User interests: ${body.userContext.interests.join(", ")}`);
  const ctxBlock = ctxLines.length ? "\n" + ctxLines.join("\n") : "";

  // Cap article count fed to the model so the prompt stays bounded
  const articles = body.articles.slice(0, 10);
  const articleLines = articles.map((a, i) => {
    const src = a.source ? ` (${a.source})` : "";
    const sum = a.summary ? ` — ${a.summary.slice(0, 200)}` : "";
    return `${i + 1}. ${a.title}${src}${sum}`;
  }).join("\n");

  const kwLine = body.keywords?.length
    ? `Common keywords: ${body.keywords.slice(0, 6).join(", ")}`
    : "";

  const prompt = [
    `You are NAVI — a sharp, no-fluff AI guide. The user is looking at a CLUSTER of related news stories that NAVI grouped together by topic. Explain the trend, why it matters, and what to do.`,
    "",
    `CLUSTER: "${body.clusterName}"`,
    kwLine,
    `Articles in this cluster (${articles.length}):`,
    articleLines,
    ctxBlock,
    "",
    "RETURN STRICT JSON:",
    `{`,
    `  "whatsHappening":    "1–2 sentences describing the TREND across these stories. Synthesize — don't summarize one article.",`,
    `  "whyItMatters":      "1–2 sentences on the real-world impact for an everyday person of this developing trend — money, jobs, rights, family, daily life.",`,
    `  "whatYouShouldDo":   "1–3 short, concrete actions the reader can take now. If nothing actionable, write a one-line 'stay informed' note.",`,
    `  "suggestedFeatures": ["feature_id_1", "feature_id_2"]`,
    `}`,
    "",
    "Available feature IDs (pick 0–3 that genuinely help the user act on this trend):",
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
    "- Treat this as a TREND, not a single article. Connect the dots.",
    "- Keep each field tight. Empty suggestedFeatures array is fine.",
  ].filter(Boolean).join("\n");

  let raw: string | null = null;
  try {
    const openai = getOpenAI(apiKey);
    const completion = await openai.chat.completions.create({
      model:           "gpt-4o-mini",
      messages:        [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature:     0.6,
      max_tokens:      550,
    });
    raw = completion.choices[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[news/insight/cluster] OpenAI error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  if (!raw) {
    return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
  }

  let parsed: Partial<ClusterInsightResponse>;
  try {
    parsed = JSON.parse(raw) as Partial<ClusterInsightResponse>;
  } catch (err) {
    console.error("[news/insight/cluster] JSON parse failed:", err, "raw:", raw.slice(0, 200));
    return NextResponse.json({ error: "Malformed AI response" }, { status: 502 });
  }

  const insight: ClusterInsightResponse = {
    whatsHappening:  String(parsed.whatsHappening  ?? "").trim().slice(0, 700),
    whyItMatters:    String(parsed.whyItMatters    ?? "").trim().slice(0, 700),
    whatYouShouldDo: String(parsed.whatYouShouldDo ?? "").trim().slice(0, 900),
    suggestedFeatures: Array.isArray(parsed.suggestedFeatures)
      ? parsed.suggestedFeatures
          .filter((f): f is FeatureId => ALLOWED_FEATURES.includes(f as FeatureId))
          .slice(0, 3)
      : [],
  };

  cache.set(cacheKey, { data: insight, ts: Date.now() });
  if (cache.size > MAX_CACHE_ENTRIES) {
    const drop = Math.floor(MAX_CACHE_ENTRIES * 0.25);
    Array.from(cache.keys()).slice(0, drop).forEach((k) => cache.delete(k));
  }

  return NextResponse.json({ insight, cached: false });
}
