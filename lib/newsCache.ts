/**
 * Shared in-memory cache for the News Web RSS aggregator.
 *
 * /api/news writes the merged RSS feed here on each refresh.
 * /api/health reads the cache state for the diagnostic probe — no internal
 * HTTP loop required, no risk of relative-URL fetch failures in Node.
 *
 * Cache is per-server-instance (lambda worker). Concurrent writes are safe
 * because the cache object is replaced atomically.
 */

export interface NewsCacheItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  timestamp: number;
}

export interface NewsCacheState {
  data: NewsCacheItem[];
  ts:   number;
}

let cache: NewsCacheState | null = null;
export const CACHE_MS = 5 * 60 * 1000;

export function readNewsCache(): NewsCacheState | null {
  return cache;
}

export function writeNewsCache(data: NewsCacheItem[]): NewsCacheState {
  cache = { data, ts: Date.now() };
  return cache;
}

export function isNewsCacheFresh(): boolean {
  return !!cache && Date.now() - cache.ts < CACHE_MS;
}
