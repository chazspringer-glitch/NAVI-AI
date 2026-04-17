import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Real-time crime data for NAVI Pulse.
//
// Strategy:
//   1. If the city has a known Socrata open-data portal → fetch real
//      incident records (type, location, time).
//   2. For all other cities → Google News RSS search for "[city] crime
//      police report" which catches local crime reporting.
//
// Both paths return the same shape so the panel doesn't care which source
// served the data.
// ─────────────────────────────────────────────────────────────────────────────

// Per-city cache (5-minute TTL)
const cache = new Map<string, { data: CrimeItem[]; ts: number }>();
const CACHE_MS = 5 * 60 * 1000;

interface CrimeItem {
  id:          string;
  title:       string;
  summary:     string;
  url:         string;
  source:      string;
  category:    string; // always "crime"
  timestamp:   number;
  location:    string;
  severity:    "low" | "medium" | "high";
  incidentType?: string;
}

// ── Socrata city mappings ────────────────────────────────────────────────────
// Each entry: { domain, datasetId, fields mapping }
// Add cities as needed — Socrata uses the same API format everywhere.
const SOCRATA_CITIES: Record<string, { domain: string; dataset: string }> = {
  "chicago":      { domain: "data.cityofchicago.org",   dataset: "ijzp-q8t2" },
  "new york":     { domain: "data.cityofnewyork.us",    dataset: "5uac-w243" },
  "los angeles":  { domain: "data.lacity.org",          dataset: "2nrs-mtv8" },
  "philadelphia": { domain: "data.phila.gov",           dataset: "sspu-ckek" },
  "washington":   { domain: "opendata.dc.gov",          dataset: "5jf8-3b3k" },
  "san francisco":{ domain: "data.sfgov.org",           dataset: "tmnf-yvry" },
  "seattle":      { domain: "data.seattle.gov",         dataset: "tazs-3rd5" },
  "austin":       { domain: "data.austintexas.gov",     dataset: "fdj4-gpfu" },
  "denver":       { domain: "data.denvergov.org",       dataset: "5du6-vgbe" },
  "baltimore":    { domain: "data.baltimorecity.gov",   dataset: "wsfq-mvij" },
};

const HIGH_SEVERITY = /\b(homicide|murder|shoot|stabbing|carjack|kidnap|assault with|armed robbery|sexual assault)\b/i;
const MED_SEVERITY  = /\b(robbery|burglary|assault|battery|weapon|arson|DUI|hit.and.run)\b/i;

function classifySeverity(text: string): "low" | "medium" | "high" {
  if (HIGH_SEVERITY.test(text)) return "high";
  if (MED_SEVERITY.test(text)) return "medium";
  return "low";
}

// ── Socrata fetch ───────────────────────────────────────────────────────────
async function fetchSocrata(city: string): Promise<CrimeItem[]> {
  const key = city.toLowerCase().replace(/[^a-z ]/g, "").trim();
  const cfg = Object.entries(SOCRATA_CITIES).find(([k]) => key.includes(k));
  if (!cfg) return [];

  const [, { domain, dataset }] = cfg;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const url = `https://${domain}/resource/${dataset}.json?$where=date>'${since}'&$order=date DESC&$limit=15`;

  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "NAVI-CrimeTracker/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json() as Record<string, string>[];
    return data.map((r, i) => {
      const desc = r.primary_type || r.offense || r.crime_type || r.description || r.incident || "Incident";
      const block = r.block || r.location_description || r.address || "";
      const dateStr = r.date || r.occurred_date || r.report_datetime || r.datetime || "";
      const ts = dateStr ? new Date(dateStr).getTime() : Date.now();
      return {
        id: `socrata-${dataset}-${r.id || r.case_number || i}`,
        title: `${desc}${block ? ` — ${block}` : ""}`,
        summary: `${desc} reported${block ? ` near ${block}` : ""}. Source: ${domain} open data portal.`,
        url: `https://${domain}/resource/${dataset}`,
        source: `${city} Open Data`,
        category: "crime",
        timestamp: isNaN(ts) ? Date.now() : ts,
        location: city,
        severity: classifySeverity(desc),
        incidentType: desc,
      };
    });
  } catch {
    return [];
  }
}

// ── Google News RSS fallback ─────────────────────────────────────────────────
function decode(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchGoogleNewsCrime(city: string): Promise<CrimeItem[]> {
  const q = encodeURIComponent(`${city} crime police report`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NAVI-CrimeTracker/1.0)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: CrimeItem[] = [];
    const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
    for (const block of blocks) {
      const titleM = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(block);
      const linkM  = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(block);
      const descM  = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(block);
      const dateM  = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(block);
      const rawTitle = titleM ? decode(titleM[1]) : "";
      const link = linkM ? decode(linkM[1]) : "";
      if (!rawTitle || !link) continue;
      const srcSplit = rawTitle.split(" - ");
      const source = srcSplit.length > 1 ? srcSplit.pop()!.trim() : "Local News";
      const title = srcSplit.join(" - ").trim();
      const ts = dateM ? new Date(dateM[1]).getTime() : Date.now();
      items.push({
        id: link,
        title,
        summary: descM ? decode(descM[1]).slice(0, 240) : "",
        url: link,
        source,
        category: "crime",
        timestamp: isNaN(ts) ? Date.now() : ts,
        location: city,
        severity: classifySeverity(title),
        incidentType: "Crime Report",
      });
      if (items.length >= 10) break;
    }
    return items;
  } catch {
    return [];
  }
}

/**
 * GET /api/news/crime?city=Wilmington,NC
 */
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim();
  if (!city) {
    return NextResponse.json({ items: [], error: "city required" }, { status: 400 });
  }

  const key = city.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return NextResponse.json({ items: cached.data, cached: true, city });
  }

  // Try Socrata first, fall back to Google News
  let items = await fetchSocrata(city);
  if (items.length === 0) {
    items = await fetchGoogleNewsCrime(city);
  }

  // Sort newest first
  items.sort((a, b) => b.timestamp - a.timestamp);

  cache.set(key, { data: items, ts: Date.now() });
  if (cache.size > 30) {
    const oldest = Array.from(cache.keys())[0];
    if (oldest) cache.delete(oldest);
  }

  return NextResponse.json({ items, cached: false, city });
}
