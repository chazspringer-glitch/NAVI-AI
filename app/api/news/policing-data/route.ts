import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Washington Post fatal police shootings database (public GitHub CSV)
const WAPO_CSV_URL =
  "https://raw.githubusercontent.com/washingtonpost/data-police-shootings/master/v2/fatal-police-shootings-data.csv";

// 1-hour in-memory cache — the dataset updates ~weekly
let cache: { data: PolicingStats; ts: number } | null = null;
const CACHE_MS = 60 * 60 * 1000;

interface Incident {
  date: string;
  city: string;
  state: string;
  race: string;
  armed: string;
  bodyCamera: boolean;
  age: number;
  gender: string;
}

interface PolicingStats {
  totalIncidents:      number;
  thisYear:            number;
  bodyCameraRate:      number;
  byRace:              Record<string, number>;
  byYear:              Record<string, number>;
  byState:             Record<string, number>;
  recentByState:       Record<string, Incident[]>;
  stateDetails:        Record<string, StateDetail>;
  lastUpdated:         string;
  source:              string;
}

interface StateDetail {
  total:               number;
  thisYear:            number;
  bodyCameraRate:      number;
  byCity:              { city: string; count: number }[];
  byRace:              Record<string, number>;
  byYear:              Record<string, number>;
  unarmedCount:        number;
  recentIncidents:     { date: string; city: string; race: string; armed: string; bodyCamera: boolean }[];
}

function clean(s: string): string {
  return (s ?? "").replace(/^["']|["']$/g, "").trim();
}

const RACE_MAP: Record<string, string> = {
  W: "White", B: "Black", H: "Hispanic", A: "Asian",
  N: "Native American", O: "Other",
};

function normalizeRace(raw: string): string {
  const c = clean(raw).toUpperCase();
  if (RACE_MAP[c]) return RACE_MAP[c];
  // Multi-race codes like "W;B" → use first
  const first = c.split(/[;,]/)[0]?.trim();
  if (RACE_MAP[first]) return "Multiracial";
  if (!c || c === "UNKNOWN" || c === "MALE" || c === "FEMALE") return "Unknown";
  return "Other";
}

function parseCSV(csv: string): Incident[] {
  const lines = csv.split("\n");
  if (lines.length < 2) return [];

  // Build header index from first line
  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => clean(h).toLowerCase());
  const col = (name: string): number => {
    const exact = headers.indexOf(name);
    if (exact >= 0) return exact;
    return headers.findIndex((h) => h.includes(name));
  };

  const dateIdx   = col("date");
  const cityIdx   = col("city");
  const stateIdx  = col("state");
  const raceIdx   = col("race");
  const armedIdx  = col("armed_with");
  const cameraIdx = col("body_camera");
  const ageIdx    = col("age");
  const genderIdx = col("gender");

  if (dateIdx < 0 || stateIdx < 0) return [];

  const incidents: Incident[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim().length < 5) continue;

    // Simple CSV split that respects quoted fields
    const cols: string[] = [];
    let cur = "", inQ = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur.trim());

    const date = clean(cols[dateIdx] ?? "");
    if (!date || date.length < 8) continue;

    incidents.push({
      date,
      city:       clean(cols[cityIdx] ?? ""),
      state:      clean(cols[stateIdx] ?? ""),
      race:       normalizeRace(cols[raceIdx] ?? ""),
      armed:      clean(cols[armedIdx] ?? "Unknown"),
      bodyCamera: clean(cols[cameraIdx] ?? "").toLowerCase() === "true",
      age:        parseInt(clean(cols[ageIdx] ?? "0"), 10) || 0,
      gender:     clean(cols[genderIdx] ?? ""),
    });
  }
  return incidents;
}

function buildStats(incidents: Incident[]): PolicingStats {
  const currentYear = new Date().getFullYear().toString();
  const thisYear = incidents.filter((i) => i.date.startsWith(currentYear));

  const byRace: Record<string, number> = {};
  const byYear: Record<string, number> = {};
  const byState: Record<string, number> = {};
  let cameraCount = 0;

  for (const inc of incidents) {
    const race = inc.race || "Unknown";
    byRace[race] = (byRace[race] ?? 0) + 1;
    const year = inc.date.slice(0, 4);
    byYear[year] = (byYear[year] ?? 0) + 1;
    byState[inc.state] = (byState[inc.state] ?? 0) + 1;
    if (inc.bodyCamera) cameraCount++;
  }

  // Recent incidents by state (this year, up to 10 per state)
  const recentByState: Record<string, Incident[]> = {};
  for (const inc of thisYear) {
    const st = inc.state;
    if (!recentByState[st]) recentByState[st] = [];
    if (recentByState[st].length < 10) recentByState[st].push(inc);
  }

  // Per-state detailed breakdowns
  const stateDetails: Record<string, StateDetail> = {};
  const byStateGroup: Record<string, Incident[]> = {};
  for (const inc of incidents) {
    (byStateGroup[inc.state] ??= []).push(inc);
  }
  for (const [st, stInc] of Object.entries(byStateGroup)) {
    const stThisYear = stInc.filter((i) => i.date.startsWith(currentYear));
    const stCamera = stInc.filter((i) => i.bodyCamera).length;
    const stUnarmed = stInc.filter((i) =>
      !i.armed || i.armed.toLowerCase() === "unarmed" || i.armed.toLowerCase() === "undetermined"
    ).length;
    const cityFreq: Record<string, number> = {};
    const stRace: Record<string, number> = {};
    const stYear: Record<string, number> = {};
    for (const i of stInc) {
      cityFreq[i.city] = (cityFreq[i.city] ?? 0) + 1;
      stRace[i.race || "Unknown"] = (stRace[i.race || "Unknown"] ?? 0) + 1;
      const y = i.date.slice(0, 4);
      stYear[y] = (stYear[y] ?? 0) + 1;
    }
    const byCity = Object.entries(cityFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    stateDetails[st] = {
      total: stInc.length,
      thisYear: stThisYear.length,
      bodyCameraRate: stInc.length > 0 ? Math.round((stCamera / stInc.length) * 100) : 0,
      byCity,
      byRace: stRace,
      byYear: stYear,
      unarmedCount: stUnarmed,
      recentIncidents: stThisYear.slice(-15).reverse().map((i) => ({
        date: i.date, city: i.city, race: i.race, armed: i.armed, bodyCamera: i.bodyCamera,
      })),
    };
  }

  return {
    totalIncidents: incidents.length,
    thisYear:       thisYear.length,
    bodyCameraRate: incidents.length > 0 ? Math.round((cameraCount / incidents.length) * 100) : 0,
    byRace,
    byYear,
    byState,
    recentByState,
    stateDetails,
    lastUpdated:    incidents.length > 0 ? incidents[incidents.length - 1].date : "",
    source:         "Washington Post Fatal Police Shootings Database",
  };
}

/**
 * GET /api/news/policing-data
 * Optional: ?state=NC — returns state-specific stats alongside national
 */
export async function GET(req: NextRequest) {
  const stateFilter = req.nextUrl.searchParams.get("state")?.trim().toUpperCase() || null;

  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return respond(cache.data, stateFilter, true);
  }

  try {
    const res = await fetch(WAPO_CSV_URL, {
      headers: { "User-Agent": "NAVI-PolicingTransparency/1.0" },
    });
    if (!res.ok) {
      console.warn(`[policing-data] WaPo CSV returned ${res.status}`);
      return NextResponse.json({ error: `source_${res.status}` }, { status: 502 });
    }
    const csv = await res.text();
    const incidents = parseCSV(csv);
    const stats = buildStats(incidents);
    cache = { data: stats, ts: Date.now() };
    return respond(stats, stateFilter, false);
  } catch (err) {
    console.error("[policing-data] fetch error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}

function respond(stats: PolicingStats, stateFilter: string | null, cached: boolean) {
  const stateStats = stateFilter ? {
    state:          stateFilter,
    total:          stats.byState[stateFilter] ?? 0,
    recentThisYear: stats.recentByState[stateFilter] ?? [],
  } : null;

  const stateDetail = stateFilter ? (stats.stateDetails[stateFilter] ?? null) : null;

  return NextResponse.json({
    national: {
      totalIncidents: stats.totalIncidents,
      thisYear:       stats.thisYear,
      bodyCameraRate: stats.bodyCameraRate,
      byRace:         stats.byRace,
      byYear:         stats.byYear,
      lastUpdated:    stats.lastUpdated,
      source:         stats.source,
    },
    stateStats,
    stateDetail,
    cached,
  });
}
