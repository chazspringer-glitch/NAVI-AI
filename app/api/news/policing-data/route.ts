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
  bodyCameraRate:      number;   // 0–100
  byRace:              Record<string, number>;
  byYear:              Record<string, number>;
  byState:             Record<string, number>;
  recentByState:       Record<string, Incident[]>; // last 10 per state (this year)
  lastUpdated:         string;
  source:              string;
}

function parseCSV(csv: string): Incident[] {
  const lines = csv.split("\n");
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const idx = (name: string) => {
    const i = header.indexOf(name);
    return i >= 0 ? i : header.findIndex((h) => h.includes(name));
  };

  const dateIdx   = idx("date");
  const cityIdx   = idx("city");
  const stateIdx  = idx("state");
  const raceIdx   = idx("race");
  const armedIdx  = idx("armed_with");
  const cameraIdx = idx("body_camera");
  const ageIdx    = idx("age");
  const genderIdx = idx("gender");

  const incidents: Incident[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 5) continue;
    const date = cols[dateIdx]?.trim() ?? "";
    if (!date) continue;
    incidents.push({
      date,
      city:       cols[cityIdx]?.trim() ?? "",
      state:      cols[stateIdx]?.trim() ?? "",
      race:       cols[raceIdx]?.trim() ?? "Unknown",
      armed:      cols[armedIdx]?.trim() ?? "Unknown",
      bodyCamera: cols[cameraIdx]?.trim().toLowerCase() === "true",
      age:        parseInt(cols[ageIdx]?.trim() ?? "0", 10) || 0,
      gender:     cols[genderIdx]?.trim() ?? "",
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

  return {
    totalIncidents: incidents.length,
    thisYear:       thisYear.length,
    bodyCameraRate: incidents.length > 0 ? Math.round((cameraCount / incidents.length) * 100) : 0,
    byRace,
    byYear,
    byState,
    recentByState,
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

  return NextResponse.json({
    national: {
      totalIncidents: stats.totalIncidents,
      thisYear:       stats.thisYear,
      bodyCameraRate: stats.bodyCameraRate,
      byRace:         stats.byRace,
      lastUpdated:    stats.lastUpdated,
      source:         stats.source,
    },
    stateStats,
    cached,
  });
}
