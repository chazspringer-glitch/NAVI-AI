/**
 * Lightweight news clustering — pure-logic, no AI calls.
 *
 *  1. Tokenize each item's title + summary
 *  2. Drop stopwords, very-short tokens, and pure-numeric tokens
 *  3. Compute pairwise Jaccard similarity between keyword sets
 *  4. Union-find to merge transitively-related items
 *  5. Drop groups of size < minClusterSize
 *  6. Name each cluster from its top keywords
 */

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","for","in","on","at","by",
  "with","from","as","is","are","was","were","be","been","being","have",
  "has","had","do","does","did","will","would","could","should","may",
  "might","must","shall","can","this","that","these","those","it","its",
  "their","there","they","we","you","i","he","she","him","her","his",
  "hers","not","no","yes","so","up","down","out","over","under","than",
  "then","such","into","about","after","before","since","while","new",
  "more","most","said","says","just","when","what","why","how","who",
  "which","one","two","get","gets","got","also","like","make","made",
  "take","took","go","going","goes","came","come","year","week","day",
  "time","saying","told","tell","mr","mrs","dr","people","report",
  "reported","reports","news","story","first","last","between","among",
  "another","every","all","any","some","many","much","very","really",
  "still","even","only","because","ago","each","both","other","others",
  "had","here","off","than","through","during","without","within","upon",
  "around","being","else","including","include","includes","including",
  "back","still","again","ever","never","always","often","sometimes",
  "amid","along","across","against","beyond","plus","via",
]);

export interface ClusterableItem {
  id:        string;
  title:     string;
  summary?:  string;
  category?: string;
}

export interface NewsClusterMeta {
  id:        string;
  name:      string;
  itemIds:   string[];
  keywords:  string[];
  /** Average category color of the cluster — used as the bubble accent. */
  category?: string;
}

export interface ClusterResult {
  clusters:      NewsClusterMeta[];
  itemKeywords:  Record<string, string[]>;
  /** Map item id → cluster id. Items not in a cluster are absent. */
  itemCluster:   Record<string, string>;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => {
      if (w.length < 4) return false;
      if (STOPWORDS.has(w)) return false;
      if (/^\d+$/.test(w)) return false;
      return true;
    });
}

function titleCase(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

export function clusterItems(
  items: ClusterableItem[],
  options: { threshold?: number; minClusterSize?: number; maxClusters?: number } = {},
): ClusterResult {
  const { threshold = 0.16, minClusterSize = 2, maxClusters = 8 } = options;

  // ── Tokenize ──────────────────────────────────────────────────────────────
  const itemKeywords: Record<string, string[]> = {};
  const keywordSets  = new Map<string, Set<string>>();
  for (const item of items) {
    const text  = `${item.title} ${item.summary ?? ""}`;
    const words = tokenize(text);
    const set   = new Set(words);
    keywordSets.set(item.id, set);
    itemKeywords[item.id] = Array.from(set).slice(0, 12);
  }

  // ── Union-find ────────────────────────────────────────────────────────────
  const parent: Record<string, string> = {};
  const find = (x: string): string => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  const ids = items.map((i) => i.id);
  for (const id of ids) parent[id] = id;

  // ── Pairwise Jaccard ──────────────────────────────────────────────────────
  for (let i = 0; i < ids.length; i++) {
    const a = keywordSets.get(ids[i]);
    if (!a || a.size === 0) continue;
    for (let j = i + 1; j < ids.length; j++) {
      const b = keywordSets.get(ids[j]);
      if (!b || b.size === 0) continue;
      let intersection = 0;
      // Iterate the smaller set for speed
      const [small, big] = a.size <= b.size ? [a, b] : [b, a];
      Array.from(small).forEach((w) => { if (big.has(w)) intersection++; });
      const unionSize = a.size + b.size - intersection;
      const sim = unionSize > 0 ? intersection / unionSize : 0;
      if (sim >= threshold) union(ids[i], ids[j]);
    }
  }

  // ── Group by root ─────────────────────────────────────────────────────────
  const groups: Record<string, string[]> = {};
  for (const id of ids) {
    const root = find(id);
    (groups[root] ??= []).push(id);
  }

  // ── Build cluster meta ────────────────────────────────────────────────────
  const itemById = new Map(items.map((it) => [it.id, it]));
  let clusters: NewsClusterMeta[] = [];

  for (const [, memberIds] of Object.entries(groups)) {
    if (memberIds.length < minClusterSize) continue;

    // Aggregate keyword frequencies across all members
    const freq: Record<string, number> = {};
    for (const id of memberIds) {
      const set = keywordSets.get(id);
      if (!set) continue;
      Array.from(set).forEach((w) => { freq[w] = (freq[w] ?? 0) + 1; });
    }
    // Bias: keywords that appear in >50% of members are most representative
    const topKw = Object.entries(freq)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([w]) => w)
      .slice(0, 5);

    // Most-common category becomes the cluster's category accent
    const catFreq: Record<string, number> = {};
    for (const id of memberIds) {
      const cat = itemById.get(id)?.category;
      if (cat) catFreq[cat] = (catFreq[cat] ?? 0) + 1;
    }
    const topCat = Object.entries(catFreq).sort((a, b) => b[1] - a[1])[0]?.[0];

    const name = topKw.slice(0, 3).map(titleCase).join(" · ") || "Unlabeled Trend";

    clusters.push({
      id:       `cluster-${memberIds[0].slice(-10)}-${memberIds.length}`,
      name,
      itemIds:  memberIds,
      keywords: topKw,
      category: topCat,
    });
  }

  // Largest clusters first; cap to maxClusters so the UI stays readable
  clusters.sort((a, b) => b.itemIds.length - a.itemIds.length);
  if (clusters.length > maxClusters) clusters = clusters.slice(0, maxClusters);

  // ── Reverse-index item → cluster ──────────────────────────────────────────
  const itemCluster: Record<string, string> = {};
  for (const c of clusters) {
    for (const id of c.itemIds) itemCluster[id] = c.id;
  }

  return { clusters, itemKeywords, itemCluster };
}
