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
  /** Topic keywords extracted by the clustering algorithm. */
  keywords?: string[];
  /** Set when this item belongs to a multi-article cluster. */
  clusterId?: string;
}

export interface NewsCacheCluster {
  id:        string;
  name:      string;
  itemIds:   string[];
  keywords:  string[];
  category?: string;
}

export interface NewsCacheState {
  data:     NewsCacheItem[];
  clusters: NewsCacheCluster[];
  ts:       number;
}

let cache: NewsCacheState | null = null;
export const CACHE_MS = 5 * 60 * 1000;

export function readNewsCache(): NewsCacheState | null {
  return cache;
}

export function writeNewsCache(
  data: NewsCacheItem[],
  clusters: NewsCacheCluster[] = [],
): NewsCacheState {
  cache = { data, clusters, ts: Date.now() };
  return cache;
}

export function isNewsCacheFresh(): boolean {
  return !!cache && Date.now() - cache.ts < CACHE_MS;
}
