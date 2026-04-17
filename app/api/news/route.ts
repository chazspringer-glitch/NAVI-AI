import { NextResponse } from "next/server";
import { readNewsCache, writeNewsCache, CACHE_MS } from "@/lib/newsCache";
import { clusterItems } from "@/lib/newsClustering";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Public RSS feeds. To add/remove sources, edit this list. The `category`
// field maps to a color in NewsWebPanel.tsx — available categories:
// national | world | tech | sports | business | politics |
// entertainment | music | fashion | culture | health
// ─────────────────────────────────────────────────────────────────────────────
const SOURCES: { url: string; name: string; category: string }[] = [
  // ── Core news ─────────────────────────────────────────────────────────────
  { url: "https://feeds.npr.org/1001/rss.xml",                                name: "NPR",             category: "national"      },
  { url: "http://feeds.bbci.co.uk/news/rss.xml",                              name: "BBC News",        category: "world"         },
  { url: "https://techcrunch.com/feed/",                                      name: "TechCrunch",      category: "tech"          },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",             name: "CNBC",            category: "business"      },
  { url: "https://thehill.com/news/feed/",                                    name: "The Hill",        category: "politics"      },
  { url: "https://www.espn.com/espn/rss/news",                                name: "ESPN",            category: "sports"        },
  // ── Entertainment & culture ───────────────────────────────────────────────
  { url: "https://www.tmz.com/rss.xml",                                       name: "TMZ",             category: "entertainment" },
  { url: "https://pagesix.com/feed/",                                         name: "Page Six",        category: "entertainment" },
  { url: "https://pitchfork.com/feed/feed-news/rss",                          name: "Pitchfork",       category: "music"         },
  { url: "https://www.billboard.com/feed/",                                   name: "Billboard",       category: "music"         },
  { url: "https://fashionista.com/.rss/full/",                                name: "Fashionista",     category: "fashion"       },
  { url: "https://www.complex.com/feed",                                      name: "Complex",         category: "culture"       },
  // ── Health ────────────────────────────────────────────────────────────────
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml",           name: "NYT Health",      category: "health"        },
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

// Cache lives in lib/newsCache.ts so /api/health can read it directly

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
    if (items.length >= 4) break; // cap per feed (13 sources × 4 = 52 max)
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
  const cached = readNewsCache();
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return NextResponse.json({
      news:      cached.data,
      clusters:  cached.clusters,
      cached:    true,
      fetchedAt: cached.ts,
    });
  }

  const results = await Promise.all(SOURCES.map(fetchSource));
  const news: NewsItem[] = results.flat();

  // Sort newest first
  news.sort((a, b) => b.timestamp - a.timestamp);

  // ── Cluster the merged feed ─────────────────────────────────────────────
  // Pure-logic, no AI calls. Tags each item with extracted keywords and a
  // clusterId when the item belongs to a multi-article topic group.
  const { clusters, itemKeywords, itemCluster } = clusterItems(news, {
    threshold:      0.22,
    minClusterSize: 2,
    maxClusters:    8,
  });

  for (const item of news) {
    const kw = itemKeywords[item.id];
    if (kw && kw.length) (item as NewsItem & { keywords?: string[] }).keywords = kw;
    const cid = itemCluster[item.id];
    if (cid) (item as NewsItem & { clusterId?: string }).clusterId = cid;
  }

  const written = writeNewsCache(news, clusters);
  return NextResponse.json({
    news,
    clusters,
    cached:    false,
    fetchedAt: written.ts,
  });
}
