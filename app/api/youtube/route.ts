import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// YouTube Data API v3 integration for NaviTV.
// Env: YOUTUBE_API_KEY (free, 10,000 quota units/day)
//
// Fetches latest videos from configured channels via the efficient
// playlistItems path (1 quota unit) instead of search (100 units).
// ─────────────────────────────────────────────────────────────────────────────

const YT_BASE = "https://www.googleapis.com/youtube/v3";

// Per-channel cache (30 min TTL)
const cache = new Map<string, { data: ChannelData; ts: number }>();
const CACHE_MS = 30 * 60 * 1000;

interface VideoItem {
  id:           string;
  title:        string;
  thumbnail:    string;
  publishedAt:  string;
  description:  string;
  viewCount?:   string;
  duration?:    string;
}

interface ChannelData {
  channelId:       string;
  name:            string;
  thumbnail:       string;
  subscriberCount: string;
  videoCount:      string;
  videos:          VideoItem[];
}

async function ytFetch(path: string, params: Record<string, string>, apiKey: string) {
  const url = new URL(`${YT_BASE}/${path}`);
  url.searchParams.set("key", apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`YouTube API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function resolveHandle(handle: string, apiKey: string): Promise<string | null> {
  // Remove @ prefix if present
  const clean = handle.replace(/^@/, "");
  try {
    const data = await ytFetch("channels", {
      forHandle: clean,
      part: "id",
    }, apiKey);
    return data.items?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function fetchChannelData(channelId: string, apiKey: string, maxVideos = 6): Promise<ChannelData> {
  // 1. Channel info (1 unit)
  const chData = await ytFetch("channels", {
    id: channelId,
    part: "snippet,statistics,contentDetails",
  }, apiKey);

  const ch = chData.items?.[0];
  if (!ch) throw new Error("Channel not found");

  const uploadsPlaylistId = ch.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error("No uploads playlist");

  // 2. Latest videos from uploads playlist (1 unit)
  const plData = await ytFetch("playlistItems", {
    playlistId: uploadsPlaylistId,
    part: "snippet",
    maxResults: String(maxVideos),
    order: "date",
  }, apiKey);

  const videoIds = (plData.items ?? [])
    .map((item: { snippet?: { resourceId?: { videoId?: string } } }) =>
      item.snippet?.resourceId?.videoId)
    .filter(Boolean)
    .join(",");

  // 3. Video details — view counts + durations (1 unit)
  let videoDetails: Record<string, { viewCount?: string; duration?: string }> = {};
  if (videoIds) {
    const vData = await ytFetch("videos", {
      id: videoIds,
      part: "statistics,contentDetails",
    }, apiKey);
    for (const v of (vData.items ?? [])) {
      videoDetails[v.id] = {
        viewCount: v.statistics?.viewCount,
        duration: v.contentDetails?.duration,
      };
    }
  }

  const videos: VideoItem[] = (plData.items ?? []).map(
    (item: { snippet?: { resourceId?: { videoId?: string }; title?: string; thumbnails?: { medium?: { url?: string } }; publishedAt?: string; description?: string } }) => {
      const s = item.snippet ?? {};
      const vid = s.resourceId?.videoId ?? "";
      const details = videoDetails[vid] ?? {};
      return {
        id:          vid,
        title:       s.title ?? "",
        thumbnail:   s.thumbnails?.medium?.url ?? "",
        publishedAt: s.publishedAt ?? "",
        description: (s.description ?? "").slice(0, 200),
        viewCount:   formatCount(details.viewCount),
        duration:    formatDuration(details.duration),
      };
    }
  );

  return {
    channelId,
    name:            ch.snippet?.title ?? "",
    thumbnail:       ch.snippet?.thumbnails?.default?.url ?? "",
    subscriberCount: formatCount(ch.statistics?.subscriberCount),
    videoCount:      ch.statistics?.videoCount ?? "0",
    videos,
  };
}

function formatCount(raw?: string): string {
  if (!raw) return "";
  const n = parseInt(raw, 10);
  if (isNaN(n)) return raw;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function formatDuration(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = m[1] ? `${m[1]}:` : "";
  const min = m[2] ?? "0";
  const sec = (m[3] ?? "0").padStart(2, "0");
  return h ? `${h}${min.padStart(2, "0")}:${sec}` : `${min}:${sec}`;
}

/**
 * GET /api/youtube?handle=@thequantumpen
 * GET /api/youtube?channelId=UCxxxxx
 * Returns channel info + latest 6 videos with view counts + durations.
 */
export async function GET(req: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY not configured" },
      { status: 503 },
    );
  }

  const handle    = req.nextUrl.searchParams.get("handle");
  const channelId = req.nextUrl.searchParams.get("channelId");

  if (!handle && !channelId) {
    return NextResponse.json({ error: "handle or channelId required" }, { status: 400 });
  }

  const cacheKey = handle ?? channelId ?? "";
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    return NextResponse.json({ channel: cached.data, cached: true });
  }

  try {
    let resolvedId = channelId;
    if (!resolvedId && handle) {
      resolvedId = await resolveHandle(handle, apiKey);
      if (!resolvedId) {
        return NextResponse.json({ error: "Channel not found" }, { status: 404 });
      }
    }

    const data = await fetchChannelData(resolvedId!, apiKey);
    cache.set(cacheKey, { data, ts: Date.now() });
    if (cache.size > 20) {
      const oldest = Array.from(cache.keys())[0];
      if (oldest) cache.delete(oldest);
    }

    return NextResponse.json({ channel: data, cached: false });
  } catch (err) {
    console.error("[youtube] error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch" },
      { status: 502 },
    );
  }
}
