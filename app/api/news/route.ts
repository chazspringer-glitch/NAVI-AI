import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Public RSS feeds. To add/remove sources, edit this list. The `category`
// field maps to a color in NewsWebPanel.tsx — use one of:
// national | world | tech | sports | business | politics
// ─────────────────────────────────────────────────────────────────────────────
const SOURCES: { url: string; name: string; category: string }[] = [
  { url: "https://feeds.npr.org/1001/rss.xml",                                name: "NPR",         category: "national" },
  { url: "http://feeds.bbci.co.uk/news/rss.xml",                              name: "BBC News",    category: "world"    },
  { url: "https://techcrunch.com/feed/",                                      name: "TechCrunch",  category: "tech"     },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",             name: "CNBC",        category: "business" },
  { url: "https://thehill.com/news/feed/",                                    name: "The Hill",    category: "politics" },
  { url: "https://www.espn.com/espn/rss/news",                                name: "ESPN",        category: "sports"   },
];

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  timestamp: number;
}

// 5-minute in-memory cache (per server instance)
let cache: { data: NewsItem[]; ts: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

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

function pick(block: string, tag: string): string {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block);
  return m ? m[1] : "";
}

function parseRSS(xml: string, source: { name: string; category: string }): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const title = decode(pick(block, "title"));
    const link  = decode(pick(block, "link"));
    const desc  = decode(pick(block, "description"));
    const date  = pick(block, "pubDate") || pick(block, "dc:date");
    if (!title || !link) continue;
    items.push({
      id: link,
      title,
      summary: desc.slice(0, 240),
      url: link,
      source: source.name,
      category: source.category,
      timestamp: date ? new Date(date).getTime() || Date.now() : Date.now(),
    });
    if (items.length >= 5) break; // cap per feed
  }
  return items;
}

async function fetchSource(s: { url: string; name: string; category: string }): Promise<NewsItem[]> {
  try {
    const res = await fetch(s.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NAVI-NewsAggregator/1.0)",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
      // Server-side fetch caching as a second layer
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.warn(`[news] ${s.name} returned ${res.status}`);
      return [];
    }
    const xml = await res.text();
    return parseRSS(xml, s);
  } catch (err) {
    console.warn(`[news] ${s.name} fetch failed:`, err instanceof Error ? err.message : err);
    return [];
  }
}

export async function GET() {
  // Serve from cache when fresh
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json({ news: cache.data, cached: true, fetchedAt: cache.ts });
  }

  const results = await Promise.all(SOURCES.map(fetchSource));
  const news: NewsItem[] = results.flat();

  // Sort newest first
  news.sort((a, b) => b.timestamp - a.timestamp);

  cache = { data: news, ts: Date.now() };
  return NextResponse.json({ news, cached: false, fetchedAt: cache.ts });
}
