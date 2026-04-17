import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Per-city in-memory cache (5-minute TTL, max 20 cities)
const cache = new Map<string, { data: LocalItem[]; ts: number }>();
const CACHE_MS = 5 * 60 * 1000;
const MAX_CITIES = 20;

interface LocalItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  timestamp: number;
  location: string;
}

function decode(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRSS(xml: string, city: string): LocalItem[] {
  const items: LocalItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const titleMatch = new RegExp(`<title[^>]*>([\\s\\S]*?)</title>`, "i").exec(block);
    const linkMatch  = new RegExp(`<link[^>]*>([\\s\\S]*?)</link>`, "i").exec(block);
    const descMatch  = new RegExp(`<description[^>]*>([\\s\\S]*?)</description>`, "i").exec(block);
    const dateMatch  = new RegExp(`<pubDate[^>]*>([\\s\\S]*?)</pubDate>`, "i").exec(block);
    const title = titleMatch ? decode(titleMatch[1]) : "";
    const link  = linkMatch  ? decode(linkMatch[1])  : "";
    const desc  = descMatch  ? decode(descMatch[1]).slice(0, 240)  : "";
    const date  = dateMatch  ? dateMatch[1] : "";
    if (!title || !link) continue;
    // Extract source from Google News title format "Headline - Source"
    const sourceSplit = title.split(" - ");
    const source = sourceSplit.length > 1 ? sourceSplit.pop()!.trim() : "Local News";
    const headline = sourceSplit.join(" - ").trim();
    items.push({
      id: link,
      title: headline,
      summary: desc,
      url: link,
      source,
      category: "local",
      timestamp: date ? new Date(date).getTime() || Date.now() : Date.now(),
      location: city,
    });
    if (items.length >= 8) break;
  }
  return items;
}

/**
 * GET /api/news/local?city=Wilmington,NC
 * Fetches Google News RSS for the given city and returns up to 8 local items.
 */
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim();
  if (!city) {
    return NextResponse.json({ items: [], error: "city parameter required" }, { status: 400 });
  }

  const key = city.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return NextResponse.json({ items: cached.data, cached: true, city });
  }

  try {
    const q = encodeURIComponent(city);
    const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NAVI-LocalNews/1.0)",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) {
      console.warn(`[news/local] Google News returned ${res.status} for "${city}"`);
      return NextResponse.json({ items: [], error: `fetch_failed_${res.status}` });
    }
    const xml = await res.text();
    const items = parseRSS(xml, city);

    // Cache + cap
    cache.set(key, { data: items, ts: Date.now() });
    if (cache.size > MAX_CITIES) {
      const oldest = Array.from(cache.keys())[0];
      if (oldest) cache.delete(oldest);
    }

    return NextResponse.json({ items, cached: false, city });
  } catch (err) {
    console.warn("[news/local] fetch error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ items: [], error: "fetch_failed" });
  }
}
