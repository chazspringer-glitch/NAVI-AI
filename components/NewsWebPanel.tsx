"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type FeatureId =
  | "housing" | "jobs" | "trades" | "legal" | "family"
  | "local"   | "business" | "resume" | "stem" | "ai"
  | "history" | "library"  | "tv"     | "auto" | "academy";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  timestamp: number;
  keywords?:  string[];
  clusterId?: string;
}

interface NewsCluster {
  id:        string;
  name:      string;
  itemIds:   string[];
  keywords:  string[];
  category?: string;
}

interface Insight {
  whatsHappening:    string;
  whyItMatters:      string;
  whatYouShouldDo:   string;
  suggestedFeatures: FeatureId[];
}

const FEATURE_META: Record<FeatureId, { label: string; icon: string; color: string }> = {
  housing:  { label: "Housing",         icon: "🏠",   color: "#34d399" },
  jobs:     { label: "Job Finder",      icon: "💼",   color: "#00d4ff" },
  trades:   { label: "Trades Mode",     icon: "🚛",   color: "#f59e0b" },
  legal:    { label: "Legal Rights",    icon: "⚖️",   color: "#60a5fa" },
  family:   { label: "Family Support",  icon: "💛",   color: "#f59e0b" },
  local:    { label: "Local Help",      icon: "📍",   color: "#86efac" },
  business: { label: "Business Plan",   icon: "📊",   color: "#C9A227" },
  resume:   { label: "Resume Builder",  icon: "📄",   color: "#a855f7" },
  stem:     { label: "STEM Program",    icon: "🧪",   color: "#34d399" },
  ai:       { label: "AI Skills",       icon: "🤖",   color: "#00d4ff" },
  history:  { label: "Black History",   icon: "📜",   color: "#C9A227" },
  library:  { label: "NAVI Library",    icon: "📚",   color: "#C9A227" },
  tv:       { label: "NaviTV",          icon: "📺",   color: "#a855f7" },
  auto:     { label: "Auto Finder",     icon: "🚗",   color: "#f472b6" },
  academy:  { label: "NAVI Academy",    icon: "🎓",   color: "#00d4ff" },
};

interface NodeT extends NewsItem {
  x: number;
  y: number;
  baseAngle: number;
  baseRadius: number;
  driftSpeed: number;
  driftPhase: number;
  size: number;
  age: number; // 0-1 scale-in animation
  color: string;
}

/** Per-frame cluster geometry computed from current node positions. */
interface ClusterGeom {
  id: string;
  name: string;
  cx: number;
  cy: number;
  r:  number;
  color: string;
  size: number; // member count
}

const CATEGORY_COLORS: Record<string, string> = {
  national:      "#a855f7",
  world:         "#00d4ff",
  tech:          "#34d399",
  sports:        "#f59e0b",
  business:      "#C9A227",
  politics:      "#f472b6",
  entertainment: "#fb923c",
  music:         "#e879f9",
  fashion:       "#f43f5e",
  culture:       "#8b5cf6",
  health:        "#2dd4bf",
  civic:         "#3b82f6",
  local:         "#f97316",
};

const CATEGORY_LABEL: Record<string, string> = {
  national:      "National",
  world:         "World",
  tech:          "Tech",
  sports:        "Sports",
  business:      "Business",
  politics:      "Politics",
  entertainment: "Entertainment",
  music:         "Music",
  fashion:       "Fashion",
  culture:       "Culture",
  health:        "Health",
  civic:         "Civic",
  local:         "Local",
};

function timeAgo(ts: number): string {
  const diff = Math.max(0, (Date.now() - ts) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Safety keyword detection ────────────────────────────────────────────────
const SAFETY_KEYWORDS = /\b(crime|shoot|shot|police|arrest|crash|accident|emergency|fire|storm|flood|hurricane|tornado|death|dead|killed|kill|attack|assault|robbery|theft|stolen|injury|missing|alert|warning|suspect|violence|homicide|investigation|stabbing|carjack|evacuat|arson|hostage|kidnap|overdose|fentanyl|gun|weapon|victim|fatally|manhunt|fugitive|danger|disaster)\b/i;

function isSafetyItem(item: NewsItem): boolean {
  return SAFETY_KEYWORDS.test(item.title) || SAFETY_KEYWORDS.test(item.summary ?? "");
}

// ── Opportunity keyword detection ───────────────────────────────────────────
const OPPORTUNITY_KEYWORDS = /\b(hiring|job[s ]|career|employ|recruit|apprentice|training|workforce|scholarship|grant|fund|voucher|subsid|free program|free class|free course|housing assist|section 8|affordable hous|rent assist|down payment|first.time buyer|benefit|resource|food bank|food pantry|community center|mentor|internship|startup|small business|entrepreneur|wage increase|minimum wage|tax credit|earn|certificate|credential|diploma|GED|tuition|financial aid|FAFSA|unemployment|snap|wic|medicaid|childcare|daycare)\b/i;

function isOpportunityItem(item: NewsItem): boolean {
  if (isSafetyItem(item)) return false; // safety takes priority visually
  return OPPORTUNITY_KEYWORDS.test(item.title) || OPPORTUNITY_KEYWORDS.test(item.summary ?? "");
}

// ── Civic engagement keyword detection ───────────────────────────────────────
const CIVIC_KEYWORDS = /\b(vote|voting|voter|election|ballot|candidate|mayor|council|commissioner|school board|zoning|ordinance|legislat|policy|bill|budget|public hearing|town hall|redistrict|census|representat|senator|governor|amendment|referendum|civic|advocacy|community meeting|public comment|alderman|supervisor|precinct|polling|registration|constituent|city hall|municipal|county board|local government|executive order|veto|bipartisan|gerrymandering|recall|proposition|measure|incumbent|runoff|primary|midterm|caucus)\b/i;

function isCivicItem(item: NewsItem): boolean {
  if (isSafetyItem(item)) return false;
  if (isOpportunityItem(item)) return false;
  return CIVIC_KEYWORDS.test(item.title) || CIVIC_KEYWORDS.test(item.summary ?? "");
}

// ── Policing transparency keyword detection ─────────────────────────────────
const POLICING_KEYWORDS = /\b(police department|police chief|officer involved|use of force|excessive force|body cam|bodycam|police reform|police oversight|police misconduct|police shooting|officer shoot|deputy shoot|internal affairs|citizen complaint|police union|law enforcement|police budget|police account|police train|police review board|civilian oversight|consent decree|department of justice|doj investigation|racial profil|traffic stop|no.knock|qualified immunity|police brutality|police transparency|badge|trooper|sheriff department|police data|arrest rate|incarceration|sentencing|bail reform|prison reform|criminal justice reform|police commission)\b/i;

function isPolicingItem(item: NewsItem): boolean {
  if (isSafetyItem(item)) return false;
  if (isOpportunityItem(item)) return false;
  if (isCivicItem(item)) return false;
  return POLICING_KEYWORDS.test(item.title) || POLICING_KEYWORDS.test(item.summary ?? "");
}

// ── Know Your Rights content (verified, general guidance) ───────────────────
const KNOW_YOUR_RIGHTS = [
  { title: "You have the right to remain silent", body: "You do not have to answer questions about where you are going, where you are from, or what you are doing. Say: \"I am exercising my right to remain silent.\"" },
  { title: "You have the right to refuse consent to a search", body: "Police cannot search you or your belongings without a warrant or your consent. Say: \"I do not consent to this search.\" Do not physically resist." },
  { title: "You have the right to record police", body: "In all 50 states, you have the right to record police officers in public as long as you do not interfere with their duties." },
  { title: "You have the right to ask if you are free to leave", body: "If you are not under arrest, you have the right to calmly leave. Ask: \"Am I being detained, or am I free to go?\"" },
  { title: "You have the right to an attorney", body: "If you are arrested, you have the right to speak with a lawyer before answering any questions. Say: \"I want to speak to a lawyer.\"" },
  { title: "Stay calm and document everything", body: "Remember badge numbers, patrol car numbers, and agency. Write down everything as soon as possible. File a complaint with the department's internal affairs division or civilian oversight board." },
];

// Single unified view — safety, opportunity, civic, and policing awareness are integrated inline.

interface NewsWebPanelProps {
  onClose:   () => void;
  /** Open another NAVI feature when an insight action button is tapped. */
  onAction?: (feature: FeatureId) => void;
  /** Optional context shipped with insight requests for personalized advice. */
  userContext?: { location?: string; interests?: string[] };
}

export default function NewsWebPanel({ onClose, onAction, userContext }: NewsWebPanelProps) {
  const canvasRef         = useRef<HTMLCanvasElement>(null);
  const containerRef      = useRef<HTMLDivElement>(null);
  const nodesRef          = useRef<NodeT[]>([]);
  const clusterGeomRef    = useRef<ClusterGeom[]>([]);
  const frameRef          = useRef<number>(0);
  const timeRef           = useRef<number>(0);
  // Slow continuous rotation (radians) — increments per frame in animate()
  const rotationRef       = useRef<number>(0);
  // activeTabRef removed — single-view panel, no tabs
  // Pinch-to-zoom: current zoom factor (1 = default), in-flight pinch state,
  // and the timestamp of the last pinch end so we can suppress the click that
  // mobile browsers fire after a multi-touch gesture.
  const zoomRef           = useRef<number>(1);
  const pinchStartRef     = useRef<{ dist: number; zoom: number } | null>(null);
  const lastPinchEndRef   = useRef<number>(0);
  const [zoom, setZoom]   = useState<number>(1);

  // Pan offset (single-finger drag)
  const panRef            = useRef({ x: 0, y: 0 });
  const dragRef           = useRef<{ startX: number; startY: number; panX: number; panY: number; moved: boolean } | null>(null);
  const lastDragEndRef    = useRef<number>(0);

  const [items,    setItems]    = useState<NewsItem[]>([]);
  const [clusters, setClusters] = useState<NewsCluster[]>([]);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<NewsCluster | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [size,     setSize]     = useState({ w: 0, h: 0 });
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Location detection for safety + opportunity + civic awareness
  const [userCity,  setUserCity]  = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [localItems, setLocalItems] = useState<NewsItem[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [safetyBannerOpen,      setSafetyBannerOpen]      = useState(true);
  const [opportunityBannerOpen, setOpportunityBannerOpen] = useState(true);

  // Safety overview insight (shows inline in main web, location-aware)
  const [safetyInsight,        setSafetyInsight]        = useState<Insight | null>(null);
  const [safetyInsightLoading, setSafetyInsightLoading] = useState(false);
  const [safetyInsightError,   setSafetyInsightError]   = useState<string | null>(null);

  // Opportunity insight
  const [opInsight,        setOpInsight]        = useState<Insight | null>(null);
  const [opInsightLoading, setOpInsightLoading] = useState(false);
  const [opInsightError,   setOpInsightError]   = useState<string | null>(null);

  // Civic engagement insight
  const [civicBannerOpen,       setCivicBannerOpen]       = useState(true);
  const [civicInsight,          setCivicInsight]          = useState<Insight | null>(null);
  const [civicInsightLoading,   setCivicInsightLoading]   = useState(false);
  const [civicInsightError,     setCivicInsightError]     = useState<string | null>(null);

  // Policing transparency insight + real data
  const [policingBannerOpen,    setPolicingBannerOpen]    = useState(true);
  const [policingInsight,       setPolicingInsight]       = useState<Insight | null>(null);
  const [policingInsightLoading, setPolicingInsightLoading] = useState(false);
  const [policingInsightError,  setPolicingInsightError]  = useState<string | null>(null);
  const [showRights,            setShowRights]            = useState(false);
  const [policingData, setPolicingData] = useState<{
    national: { totalIncidents: number; thisYear: number; bodyCameraRate: number; byRace: Record<string, number>; lastUpdated: string; source: string };
    stateStats: { state: string; total: number; recentThisYear: { date: string; city: string }[] } | null;
  } | null>(null);
  const [policingDataLoading, setPolicingDataLoading] = useState(false);

  // Single-article insight state
  const [insight,        setInsight]        = useState<Insight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError,   setInsightError]   = useState<string | null>(null);

  // Cluster trend insight state
  const [clusterInsight,        setClusterInsight]        = useState<Insight | null>(null);
  const [clusterInsightLoading, setClusterInsightLoading] = useState(false);
  const [clusterInsightError,   setClusterInsightError]   = useState<string | null>(null);

  // ── Fetch news + auto-refresh every 5 minutes ─────────────────────────────
  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      const json = await res.json();
      if (Array.isArray(json.news)) {
        setItems(json.news);
        setClusters(Array.isArray(json.clusters) ? json.clusters : []);
        setError(null);
        setRefreshedAt(Date.now());
      } else {
        setError("No news available");
      }
    } catch (err) {
      console.error("[news] fetch error:", err);
      setError("Failed to load news");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  // ── Track container size for canvas ───────────────────────────────────────
  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Merged items: national + local (deduplicated by id), then filtered by category
  const mergedItems = (() => {
    let merged: NewsItem[];
    if (localItems.length === 0) {
      merged = items;
    } else {
      const ids = new Set(items.map((i) => i.id));
      const unique = localItems.filter((li) => !ids.has(li.id));
      merged = [...unique, ...items];
    }
    if (categoryFilter !== "all") {
      merged = merged.filter((it) => it.category === categoryFilter);
    }
    return merged;
  })();

  // ── Build/refresh nodes when items, clusters, or size change ──────────────
  useEffect(() => {
    if (size.w === 0 || size.h === 0) return;

    const cx = size.w / 2;
    const cy = size.h / 2;
    const minR = Math.min(110, Math.min(size.w, size.h) * 0.22);
    const maxR = Math.min(size.w, size.h) * 0.42;

    const clusterMap = new Map<string, NewsItem[]>();
    for (const c of clusters) clusterMap.set(c.id, []);
    const singletons: NewsItem[] = [];
    for (const it of mergedItems) {
      if (it.clusterId && clusterMap.has(it.clusterId)) {
        clusterMap.get(it.clusterId)!.push(it);
      } else {
        singletons.push(it);
      }
    }

    // Each cluster + the singleton bucket gets one "group slot" in the ring
    const groupCount = clusters.length + (singletons.length > 0 ? 1 : 0);
    if (groupCount === 0) {
      nodesRef.current = [];
      return;
    }
    const arcSize = (Math.PI * 2) / groupCount;
    const newNodes: NodeT[] = [];

    clusters.forEach((cluster, ci) => {
      const members = clusterMap.get(cluster.id) ?? [];
      if (members.length === 0) return;
      const baseStart = ci * arcSize;
      // Cluster footprint: keep members packed tight so the bubble around
      // them stays compact. Larger clusters get slightly more room.
      const footprintFrac = members.length <= 2 ? 0.22
                          : members.length <= 4 ? 0.35
                          : 0.50;
      const footprint = arcSize * footprintFrac;
      const subArc = footprint / Math.max(1, members.length);
      const baseRadius = minR + (maxR - minR) * 0.55;
      members.forEach((item, i) => {
        const angle = baseStart + (arcSize - footprint) * 0.5 + subArc * i + subArc * 0.5;
        const jitter = (Math.random() - 0.5) * 10;
        const radius = baseRadius + jitter;
        const existing = nodesRef.current.find((n) => n.id === item.id);
        const color = CATEGORY_COLORS[item.category] ?? "#94a3b8";
        newNodes.push({
          ...item,
          x: existing?.x ?? cx + Math.cos(angle) * radius,
          y: existing?.y ?? cy + Math.sin(angle) * radius,
          baseAngle: angle,
          baseRadius: radius,
          driftSpeed: 0.2 + Math.random() * 0.3,
          driftPhase: Math.random() * Math.PI * 2,
          size: 6 + Math.random() * 4,
          age: existing?.age ?? 0,
          color,
        });
      });
    });

    if (singletons.length > 0) {
      const baseStart = clusters.length * arcSize;
      const sub = arcSize / singletons.length;
      singletons.forEach((item, i) => {
        const angle = baseStart + sub * i + sub * 0.5;
        const radius = minR + (maxR - minR) * (0.3 + Math.random() * 0.6);
        const existing = nodesRef.current.find((n) => n.id === item.id);
        const color = CATEGORY_COLORS[item.category] ?? "#94a3b8";
        newNodes.push({
          ...item,
          x: existing?.x ?? cx + Math.cos(angle) * radius,
          y: existing?.y ?? cy + Math.sin(angle) * radius,
          baseAngle: angle,
          baseRadius: radius,
          driftSpeed: 0.25 + Math.random() * 0.4,
          driftPhase: Math.random() * Math.PI * 2,
          size: 6 + Math.random() * 4,
          age: existing?.age ?? 0,
          color,
        });
      });
    }

    nodesRef.current = newNodes;
  }, [mergedItems, clusters, categoryFilter, size.w, size.h]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animation loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (size.w === 0 || size.h === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = size.w * dpr;
    canvas.height = size.h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const animate = () => {
      if (!running) return;
      timeRef.current += 0.016;
      const t = timeRef.current;
      // Slow global rotation: ~one revolution every ~3 minutes
      rotationRef.current += 0.0006;
      const rot  = rotationRef.current;
      const zoomNow = zoomRef.current;
      const cx = size.w / 2;
      const cy = size.h / 2;
      const pcx = cx + panRef.current.x;
      const pcy = cy + panRef.current.y;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Background radial glow
      const bg = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, Math.max(size.w, size.h) * 0.6);
      bg.addColorStop(0, "rgba(0,212,255,0.05)");
      bg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size.w, size.h);

      const nodes = nodesRef.current;

      // Update node positions (smooth drift toward rotated, zoomed target)
      for (const n of nodes) {
        const driftX = Math.sin(t * n.driftSpeed + n.driftPhase) * 6;
        const driftY = Math.cos(t * n.driftSpeed * 0.7 + n.driftPhase) * 6;
        const angleNow = n.baseAngle + rot;
        const r = n.baseRadius * zoomNow;
        const targetX = pcx + Math.cos(angleNow) * r + driftX;
        const targetY = pcy + Math.sin(angleNow) * r + driftY;
        n.x += (targetX - n.x) * 0.06;
        n.y += (targetY - n.y) * 0.06;
        if (n.age < 1) n.age = Math.min(1, n.age + 0.018);
      }

      // Faint spoke from each node to NAVI core
      for (const n of nodes) {
        ctx.strokeStyle = `${n.color}1a`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(pcx, pcy);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }

      // ── Compute cluster geometry from current node positions ─────────────
      const geoms: ClusterGeom[] = [];
      for (const c of clusters) {
        const members = nodes.filter((n) => n.clusterId === c.id);
        if (members.length < 2) continue;
        let mx = 0, my = 0;
        for (const m of members) { mx += m.x; my += m.y; }
        mx /= members.length;
        my /= members.length;
        let r = 0;
        for (const m of members) {
          const dx = m.x - mx, dy = m.y - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > r) r = d;
        }
        // Padding so the bubble visibly contains the glow halos
        r += 22 + Math.min(8, members.length);
        // Clamp to a sensible max per cluster size so a 2-member cluster
        // can't take over the canvas when its members temporarily drift
        // apart during the layout transition.
        const maxR = members.length <= 2 ? 75
                   : members.length <= 4 ? 110
                   : members.length <= 6 ? 140
                   : 170;
        r = Math.min(r, maxR);
        const accent = CATEGORY_COLORS[c.category ?? ""] ?? "#94a3b8";
        geoms.push({ id: c.id, name: c.name, cx: mx, cy: my, r, color: accent, size: members.length });
      }
      // Save for hit-testing
      clusterGeomRef.current = geoms;

      // ── Draw cluster bubbles + labels ────────────────────────────────────
      for (const g of geoms) {
        const isSelected = selectedCluster?.id === g.id;
        // Outer translucent fill
        const bubble = ctx.createRadialGradient(g.cx, g.cy, g.r * 0.3, g.cx, g.cy, g.r);
        bubble.addColorStop(0, `${g.color}14`);
        bubble.addColorStop(0.7, `${g.color}0a`);
        bubble.addColorStop(1, `${g.color}00`);
        ctx.fillStyle = bubble;
        ctx.beginPath();
        ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
        ctx.fill();
        // Dashed edge ring
        ctx.strokeStyle = `${g.color}${isSelected ? "aa" : "55"}`;
        ctx.lineWidth = isSelected ? 1.4 : 0.8;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Connect each member to the cluster centroid (subtle)
        for (const m of nodes.filter((n) => n.clusterId === g.id)) {
          ctx.strokeStyle = `${g.color}22`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(g.cx, g.cy);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }
      }

      // NAVI core (pulsing) — follows pan
      const pulse = 1 + Math.sin(t * 1.4) * 0.12;
      const coreR = 32 * pulse;
      const coreGrad = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, coreR);
      coreGrad.addColorStop(0,   "rgba(0,212,255,0.50)");
      coreGrad.addColorStop(0.4, "rgba(201,162,39,0.22)");
      coreGrad.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(pcx, pcy, coreR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(0,212,255,0.95)";
      ctx.beginPath();
      ctx.arc(pcx, pcy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.beginPath();
      ctx.arc(pcx, pcy, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Nodes
      for (const n of nodes) {
        const sz = n.size * n.age;
        if (sz < 0.5) continue;
        const safety = isSafetyItem(n);
        const opportunity = !safety && isOpportunityItem(n);
        const civic = !safety && !opportunity && isCivicItem(n);
        const policing = !safety && !opportunity && !civic && isPolicingItem(n);
        // Safety ring — subtle pulsing red outline
        if (safety) {
          const ringAlpha = 0.4 + Math.sin(t * 2.5 + n.driftPhase) * 0.2;
          ctx.strokeStyle = `rgba(239,68,68,${ringAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(n.x, n.y, sz * 3.8, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Opportunity ring — pulsing green outline
        if (opportunity) {
          const ringAlpha = 0.45 + Math.sin(t * 2.0 + n.driftPhase) * 0.2;
          ctx.strokeStyle = `rgba(52,211,153,${ringAlpha})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(n.x, n.y, sz * 3.8, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Civic ring — pulsing blue outline
        if (civic) {
          const ringAlpha = 0.4 + Math.sin(t * 1.8 + n.driftPhase) * 0.2;
          ctx.strokeStyle = `rgba(59,130,246,${ringAlpha})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(n.x, n.y, sz * 3.8, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Policing ring — pulsing amber outline
        if (policing) {
          const ringAlpha = 0.4 + Math.sin(t * 2.2 + n.driftPhase) * 0.2;
          ctx.strokeStyle = `rgba(245,158,11,${ringAlpha})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(n.x, n.y, sz * 3.8, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Glow
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, sz * 3.2);
        g.addColorStop(0,   `${n.color}cc`);
        g.addColorStop(0.5, `${n.color}33`);
        g.addColorStop(1,   `${n.color}00`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, sz * 3.2, 0, Math.PI * 2);
        ctx.fill();
        // Solid
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, sz, 0, Math.PI * 2);
        ctx.fill();
        // Bright pip
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, sz * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Cluster name labels ─────────────────────────────────────────────
      // Drawn last so labels sit above the bubble + nodes. Position label
      // above the bubble, falling back to inside if it would be off-screen.
      ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      for (const g of geoms) {
        const label = g.name.length > 38 ? g.name.slice(0, 36) + "…" : g.name;
        let lx = g.cx, ly = g.cy - g.r - 10;
        if (ly < 18) ly = g.cy - g.r + 14;
        // Pill background for readability
        const padX = 8, padY = 4;
        const metrics = ctx.measureText(label);
        const w = metrics.width + padX * 2;
        const h = 14 + padY;
        // Clamp to viewport horizontally so labels don't get clipped
        if (lx - w / 2 < 6) lx = w / 2 + 6;
        if (lx + w / 2 > size.w - 6) lx = size.w - 6 - w / 2;
        ctx.fillStyle = "rgba(8,8,16,0.78)";
        roundRect(ctx, lx - w / 2, ly - h * 0.7, w, h, 6);
        ctx.fill();
        ctx.strokeStyle = `${g.color}55`;
        ctx.lineWidth = 0.8;
        roundRect(ctx, lx - w / 2, ly - h * 0.7, w, h, 6);
        ctx.stroke();
        // Text
        ctx.fillStyle = g.color;
        ctx.fillText(label, lx, ly + 1);
        // Member count chip
        ctx.fillStyle = `${g.color}aa`;
        ctx.font = "700 8px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillText(`${g.size}`, lx + w / 2 - 8, ly - 5);
        ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      }
      ctx.textAlign = "start";

      ctx.restore();
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { running = false; cancelAnimationFrame(frameRef.current); };
  }, [size.w, size.h, clusters]);

  // ── Click → hit-test nearest node ─────────────────────────────────────────
  // ── Fetch NAVI insight whenever a node is selected ────────────────────────
  useEffect(() => {
    if (!selected) {
      setInsight(null);
      setInsightError(null);
      setInsightLoading(false);
      return;
    }
    let cancelled = false;
    setInsight(null);
    setInsightError(null);
    setInsightLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/news/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:    selected.title,
            summary:  selected.summary,
            source:   selected.source,
            category: selected.category,
            url:      selected.url,
            userContext,
          }),
        });
        if (cancelled) return;
        if (!res.ok) {
          setInsightError("NAVI couldn't break this one down right now.");
          return;
        }
        const json = await res.json() as { insight?: Insight; error?: string };
        if (json.insight) {
          setInsight(json.insight);
        } else {
          setInsightError(json.error ?? "No insight returned.");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[news/insight] fetch error:", err);
        setInsightError("NAVI couldn't reach the insight service.");
      } finally {
        if (!cancelled) setInsightLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selected, userContext]);

  // ── Detect user city via geolocation (runs once on mount) ───────────────
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
            { headers: { "User-Agent": "NAVI-News/1.0" } },
          );
          if (!res.ok) return;
          const geo = await res.json() as { address?: { city?: string; town?: string; county?: string; state?: string } };
          const a = geo.address ?? {};
          const city = a.city || a.town || a.county || "";
          const state = a.state || "";
          if (city || state) setUserCity([city, state].filter(Boolean).join(", "));
        } catch { /* silent — location is best-effort */ }
      },
      () => { /* permission denied or error — silent */ },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  // ── Fetch local news when city is known ─────────────────────────────────
  useEffect(() => {
    if (!userCity) { setLocalItems([]); return; }
    let cancelled = false;
    setLocalLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/news/local?city=${encodeURIComponent(userCity)}`);
        if (cancelled) return;
        const json = await res.json();
        if (Array.isArray(json.items)) setLocalItems(json.items);
      } catch { /* silent */ }
      finally { if (!cancelled) setLocalLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [userCity]);

  // ── Auto-fetch safety overview when safety items exist ─────────────────
  // Integrated into the main web (not a separate tab). Fires when items
  // change and at least one is safety-flagged. Includes the user's detected
  // city so the AI can tailor advice to their area.
  useEffect(() => {
    const safetyItems = mergedItems.filter(isSafetyItem);
    if (safetyItems.length === 0) {
      setSafetyInsight(null);
      setSafetyInsightLoading(false);
      return;
    }
    let cancelled = false;
    setSafetyInsight(null);
    setSafetyInsightError(null);
    setSafetyInsightLoading(true);
    const articles = safetyItems.slice(0, 10).map((it) => ({
      title: it.title, summary: it.summary, source: it.source,
    }));
    const locationCtx = userCity
      ? { ...userContext, location: userCity }
      : userContext;
    (async () => {
      try {
        const res = await fetch("/api/news/insight/cluster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clusterId: `safety-${userCity || "general"}`,
            clusterName: userCity
              ? `Safety Awareness — ${userCity}`
              : "Safety & Public Safety",
            keywords: ["safety", "crime", "emergency", "police", "alert"],
            articles,
            userContext: locationCtx,
          }),
        });
        if (cancelled) return;
        if (!res.ok) { setSafetyInsightError("Could not generate safety overview."); return; }
        const json = await res.json() as { insight?: Insight };
        if (json.insight) setSafetyInsight(json.insight);
        else setSafetyInsightError("No overview generated.");
      } catch {
        if (!cancelled) setSafetyInsightError("Could not reach the insight service.");
      } finally {
        if (!cancelled) setSafetyInsightLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [items, userCity, userContext]);

  // ── Auto-fetch opportunity insight when opportunity items exist ──────────
  useEffect(() => {
    const opItems = mergedItems.filter(isOpportunityItem);
    if (opItems.length === 0) {
      setOpInsight(null);
      setOpInsightLoading(false);
      return;
    }
    let cancelled = false;
    setOpInsight(null);
    setOpInsightError(null);
    setOpInsightLoading(true);
    const articles = opItems.slice(0, 10).map((it) => ({
      title: it.title, summary: it.summary, source: it.source,
    }));
    const locationCtx = userCity ? { ...userContext, location: userCity } : userContext;
    (async () => {
      try {
        const res = await fetch("/api/news/insight/cluster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clusterId: `opportunity-${userCity || "general"}`,
            clusterName: userCity
              ? `Opportunities Near ${userCity}`
              : "Jobs, Training & Community Resources",
            keywords: ["jobs", "training", "grants", "housing", "free resources", "hiring"],
            articles,
            userContext: locationCtx,
          }),
        });
        if (cancelled) return;
        if (!res.ok) { setOpInsightError("Could not generate opportunity overview."); return; }
        const json = await res.json() as { insight?: Insight };
        if (json.insight) setOpInsight(json.insight);
        else setOpInsightError("No overview generated.");
      } catch {
        if (!cancelled) setOpInsightError("Could not reach the insight service.");
      } finally {
        if (!cancelled) setOpInsightLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [items, userCity, userContext]);

  // ── Auto-fetch civic insight when civic items exist ─────────────────────
  useEffect(() => {
    const civicItems = mergedItems.filter(isCivicItem);
    if (civicItems.length === 0) {
      setCivicInsight(null);
      setCivicInsightLoading(false);
      return;
    }
    let cancelled = false;
    setCivicInsight(null);
    setCivicInsightError(null);
    setCivicInsightLoading(true);
    const articles = civicItems.slice(0, 10).map((it) => ({
      title: it.title, summary: it.summary, source: it.source,
    }));
    const locationCtx = userCity ? { ...userContext, location: userCity } : userContext;
    (async () => {
      try {
        const res = await fetch("/api/news/insight/cluster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clusterId: `civic-${userCity || "general"}`,
            clusterName: userCity
              ? `Civic Activity — ${userCity}`
              : "Civic Engagement & Local Government",
            keywords: ["voting", "election", "council", "policy", "local government", "civic engagement"],
            articles,
            userContext: locationCtx,
          }),
        });
        if (cancelled) return;
        if (!res.ok) { setCivicInsightError("Could not generate civic overview."); return; }
        const json = await res.json() as { insight?: Insight };
        if (json.insight) setCivicInsight(json.insight);
        else setCivicInsightError("No overview generated.");
      } catch {
        if (!cancelled) setCivicInsightError("Could not reach the insight service.");
      } finally {
        if (!cancelled) setCivicInsightLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [items, userCity, userContext]);

  // ── Fetch real policing data from Washington Post database ──────────────
  useEffect(() => {
    let cancelled = false;
    setPolicingDataLoading(true);
    const stateAbbr = userCity?.split(",").pop()?.trim() || "";
    const param = stateAbbr.length === 2 ? `?state=${stateAbbr}` : "";
    (async () => {
      try {
        const res = await fetch(`/api/news/policing-data${param}`);
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          setPolicingData(json);
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setPolicingDataLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [userCity]);

  // ── Auto-fetch policing transparency insight ────────────────────────────
  useEffect(() => {
    const polItems = mergedItems.filter(isPolicingItem);
    if (polItems.length === 0) {
      setPolicingInsight(null);
      setPolicingInsightLoading(false);
      return;
    }
    let cancelled = false;
    setPolicingInsight(null);
    setPolicingInsightError(null);
    setPolicingInsightLoading(true);
    const articles = polItems.slice(0, 10).map((it) => ({
      title: it.title, summary: it.summary, source: it.source,
    }));
    const locationCtx = userCity ? { ...userContext, location: userCity } : userContext;
    (async () => {
      try {
        const res = await fetch("/api/news/insight/cluster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clusterId: `policing-${userCity || "general"}`,
            clusterName: userCity
              ? `Policing & Accountability — ${userCity}`
              : "Policing & Criminal Justice",
            keywords: ["police", "use of force", "accountability", "oversight", "reform", "transparency"],
            articles,
            userContext: locationCtx,
          }),
        });
        if (cancelled) return;
        if (!res.ok) { setPolicingInsightError("Could not generate policing overview."); return; }
        const json = await res.json() as { insight?: Insight };
        if (json.insight) setPolicingInsight(json.insight);
        else setPolicingInsightError("No overview generated.");
      } catch {
        if (!cancelled) setPolicingInsightError("Could not reach the insight service.");
      } finally {
        if (!cancelled) setPolicingInsightLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mergedItems, userCity, userContext]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch NAVI cluster trend insight when a cluster is selected ──────────
  useEffect(() => {
    if (!selectedCluster) {
      setClusterInsight(null);
      setClusterInsightError(null);
      setClusterInsightLoading(false);
      return;
    }
    let cancelled = false;
    setClusterInsight(null);
    setClusterInsightError(null);
    setClusterInsightLoading(true);
    const memberItems = mergedItems.filter((it) => selectedCluster.itemIds.includes(it.id));
    const articles = memberItems.slice(0, 10).map((it) => ({
      title:   it.title,
      summary: it.summary,
      source:  it.source,
    }));
    (async () => {
      try {
        const res = await fetch("/api/news/insight/cluster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clusterId:   selectedCluster.id,
            clusterName: selectedCluster.name,
            keywords:    selectedCluster.keywords,
            articles,
            userContext,
          }),
        });
        if (cancelled) return;
        if (!res.ok) {
          setClusterInsightError("NAVI couldn't analyze this trend right now.");
          return;
        }
        const json = await res.json() as { insight?: Insight; error?: string };
        if (json.insight) setClusterInsight(json.insight);
        else setClusterInsightError(json.error ?? "No insight returned.");
      } catch (err) {
        if (cancelled) return;
        console.error("[news/insight/cluster] fetch error:", err);
        setClusterInsightError("NAVI couldn't reach the trend insight service.");
      } finally {
        if (!cancelled) setClusterInsightLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCluster, items, userContext]);

  const handlePointer = useCallback((clientX: number, clientY: number) => {
    // Suppress taps after a pinch or drag gesture
    if (Date.now() - lastPinchEndRef.current < 350) return;
    if (Date.now() - lastDragEndRef.current < 350) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // 1. Hit-test nodes first (they sit on top of bubbles visually)
    let nearestNode: NodeT | null = null;
    let minNodeDist = Infinity;
    for (const n of nodesRef.current) {
      const dx = n.x - x;
      const dy = n.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const hitR = Math.max(n.size * 3, 18);
      if (d < hitR && d < minNodeDist) {
        nearestNode = n;
        minNodeDist = d;
      }
    }
    if (nearestNode) {
      setSelectedCluster(null);
      setSelected(nearestNode);
      return;
    }

    // 2. Cluster bubble hit — pick the smallest bubble that contains the point
    // (smaller = more specific). This avoids the case where overlapping
    // bubbles always select the largest one.
    let nearestCluster: { id: string; r: number } | null = null;
    for (const g of clusterGeomRef.current) {
      const dx = g.cx - x;
      const dy = g.cy - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < g.r && (!nearestCluster || g.r < nearestCluster.r)) {
        nearestCluster = { id: g.id, r: g.r };
      }
    }
    if (nearestCluster) {
      const cluster = clusters.find((c) => c.id === nearestCluster!.id);
      if (cluster) {
        setSelected(null);
        setSelectedCluster(cluster);
      }
    }
  }, [clusters]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "rgba(2,2,8,0.99)",
      fontFamily: "monospace",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(0,212,255,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 4,
        background: "rgba(2,2,8,0.85)",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#00d4ff", marginBottom: 3 }}>NAVI Pulse</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>📡 News Web</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {refreshedAt && (
            <span style={{ fontSize: 8, color: "#475569", letterSpacing: "0.1em" }}>
              ↻ {timeAgo(refreshedAt)}
            </span>
          )}
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
        </div>
      </div>

      {/* ── Policing transparency banner ──────────────────────────────── */}
      {mergedItems.filter(isPolicingItem).length > 0 && policingBannerOpen && (
        <div style={{
          padding: "8px 16px", flexShrink: 0,
          borderBottom: "1px solid rgba(245,158,11,0.10)",
          background: "rgba(245,158,11,0.03)",
          display: "flex", alignItems: "flex-start", gap: 10,
          zIndex: 4,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", marginTop: 4, flexShrink: 0,
            background: "#f59e0b", boxShadow: "0 0 8px #f59e0b",
            animation: policingInsightLoading ? "pulseDot 1.2s ease-in-out infinite" : "none",
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 9, letterSpacing: "0.20em", textTransform: "uppercase",
              color: "#f59e0b", fontWeight: 700, marginBottom: 3,
            }}>
              ⚖️ Policing Transparency{userCity ? ` — ${userCity}` : ""} · {mergedItems.filter(isPolicingItem).length} stories
            </div>
            {policingInsightLoading && (
              <div style={{ fontSize: 10, color: "#64748b" }}>Analyzing policing data…</div>
            )}
            {!policingInsightLoading && policingInsightError && (
              <div style={{ fontSize: 10, color: "#fbbf24" }}>{policingInsightError}</div>
            )}
            {!policingInsightLoading && policingInsight && (
              <>
                <div style={{ fontSize: 10, color: "#fbbf24", lineHeight: 1.55, fontWeight: 600, marginBottom: 2 }}>
                  {policingInsight.whatsHappening}
                </div>
                <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.55, marginBottom: 4 }}>
                  {policingInsight.whatYouShouldDo}
                </div>
              </>
            )}

            {/* Real policing data stats */}
            {policingData && !policingDataLoading && (
              <div style={{
                marginTop: 6, padding: "8px 10px", borderRadius: 8,
                background: "rgba(245,158,11,0.04)",
                border: "1px solid rgba(245,158,11,0.12)",
              }}>
                <div style={{ fontSize: 8, letterSpacing: "0.16em", textTransform: "uppercase", color: "#f59e0b", fontWeight: 700, marginBottom: 6 }}>
                  📊 Verified Data — {policingData.national.source}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>{policingData.national.totalIncidents.toLocaleString()}</div>
                    <div style={{ fontSize: 7, color: "#94a3b8" }}>Total since 2015</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>{policingData.national.thisYear.toLocaleString()}</div>
                    <div style={{ fontSize: 7, color: "#94a3b8" }}>This year</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>{policingData.national.bodyCameraRate}%</div>
                    <div style={{ fontSize: 7, color: "#94a3b8" }}>Body cam rate</div>
                  </div>
                </div>
                {policingData.stateStats && policingData.stateStats.total > 0 && (
                  <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.5, borderTop: "1px solid rgba(245,158,11,0.10)", paddingTop: 5, marginTop: 4 }}>
                    <span style={{ color: "#fbbf24", fontWeight: 700 }}>{policingData.stateStats.state}:</span>{" "}
                    {policingData.stateStats.total.toLocaleString()} total incidents
                    {policingData.stateStats.recentThisYear.length > 0 && (
                      <> · {policingData.stateStats.recentThisYear.length} this year
                        {policingData.stateStats.recentThisYear.length > 0 && (
                          <span style={{ color: "#64748b" }}> (latest: {policingData.stateStats.recentThisYear[policingData.stateStats.recentThisYear.length - 1]?.city})</span>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 7, color: "#475569", marginTop: 4 }}>
                  Last updated: {policingData.national.lastUpdated}
                </div>
              </div>
            )}
            {policingDataLoading && (
              <div style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>Loading public data…</div>
            )}

            {/* Know Your Rights toggle */}
            <button
              onClick={() => setShowRights(!showRights)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 6, marginTop: 2,
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.22)",
                color: "#f59e0b", fontSize: 9, fontWeight: 700,
                fontFamily: "monospace", cursor: "pointer",
              }}
            >
              📋 Know Your Rights {showRights ? "▲" : "▼"}
            </button>

            {showRights && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {KNOW_YOUR_RIGHTS.map((r) => (
                  <div key={r.title} style={{
                    padding: "8px 10px", borderRadius: 8,
                    background: "rgba(245,158,11,0.04)",
                    border: "1px solid rgba(245,158,11,0.12)",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", marginBottom: 3 }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.55 }}>
                      {r.body}
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.5, padding: "4px 0" }}>
                  This is general guidance based on established U.S. constitutional rights. For legal advice specific to your situation, consult a licensed attorney.
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setPolicingBannerOpen(false)}
            style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: "none", background: "transparent", color: "#475569", fontSize: 10, cursor: "pointer" }}
            aria-label="Dismiss policing banner">
            ✕
          </button>
        </div>
      )}

      {/* ── Location bar ──────────────────────────────────────────────── */}
      <div style={{
        padding: "6px 16px", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(2,2,8,0.75)",
        display: "flex", alignItems: "center", gap: 8,
        zIndex: 4,
      }}>
        <span style={{ fontSize: 12, flexShrink: 0 }}>📍</span>
        {!showLocationSearch ? (
          <>
            <button
              onClick={() => { setShowLocationSearch(true); setLocationInput(userCity ?? ""); }}
              style={{
                flex: 1, textAlign: "left", padding: 0,
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              <span style={{ fontSize: 11, color: userCity ? "#f1f5f9" : "#64748b", fontWeight: userCity ? 600 : 400 }}>
                {userCity ?? "Detecting location…"}
              </span>
              {localLoading && <span style={{ fontSize: 8, color: "#f97316", marginLeft: 6 }}>loading local…</span>}
              {!localLoading && localItems.length > 0 && (
                <span style={{ fontSize: 8, color: "#f97316", marginLeft: 6 }}>{localItems.length} local</span>
              )}
            </button>
            <button
              onClick={() => { setShowLocationSearch(true); setLocationInput(""); }}
              style={{
                padding: "4px 8px", borderRadius: 6, flexShrink: 0,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#64748b", fontSize: 9, fontFamily: "monospace",
                cursor: "pointer",
              }}
            >
              Change
            </button>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const city = locationInput.trim();
              if (city) {
                setUserCity(city);
                setShowLocationSearch(false);
              }
            }}
            style={{ flex: 1, display: "flex", gap: 6 }}
          >
            <input
              autoFocus
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="City, State (e.g. Wilmington, NC)"
              style={{
                flex: 1, padding: "6px 10px", borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(249,115,22,0.25)",
                color: "#e2e8f0", fontSize: 11, fontFamily: "monospace",
                outline: "none",
              }}
            />
            <button type="submit" style={{
              padding: "6px 12px", borderRadius: 8,
              background: "rgba(249,115,22,0.15)",
              border: "1px solid rgba(249,115,22,0.35)",
              color: "#f97316", fontSize: 10, fontWeight: 700,
              fontFamily: "monospace", cursor: "pointer",
            }}>Go</button>
            <button type="button" onClick={() => setShowLocationSearch(false)} style={{
              padding: "6px 8px", borderRadius: 8,
              background: "none", border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748b", fontSize: 10, fontFamily: "monospace", cursor: "pointer",
            }}>✕</button>
          </form>
        )}
      </div>

      {/* ── Category filter bar ───────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 5, padding: "6px 16px",
        overflowX: "auto", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(2,2,8,0.75)",
        zIndex: 4,
      }}>
        {[
          { key: "all", label: "All" },
          ...Object.entries(CATEGORY_LABEL).map(([key, label]) => ({ key, label })),
        ].map(({ key, label }) => {
          const active = categoryFilter === key;
          const color = key === "all" ? "#00d4ff" : (CATEGORY_COLORS[key] ?? "#64748b");
          // Count items in this category from merged (unfiltered) set
          const allMerged = (() => {
            if (localItems.length === 0) return items;
            const ids = new Set(items.map((i) => i.id));
            return [...localItems.filter((li) => !ids.has(li.id)), ...items];
          })();
          const count = key === "all" ? allMerged.length : allMerged.filter((i) => i.category === key).length;
          if (key !== "all" && count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => {
                setCategoryFilter(key);
                setSelected(null);
                setSelectedCluster(null);
                // Reset pan/zoom when switching categories for a clean view
                panRef.current = { x: 0, y: 0 };
                zoomRef.current = 1;
                setZoom(1);
              }}
              style={{
                padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap",
                fontSize: 9, fontFamily: "monospace", cursor: "pointer",
                fontWeight: active ? 700 : 400,
                background: active ? `${color}18` : "rgba(255,255,255,0.03)",
                border: active ? `1px solid ${color}45` : "1px solid rgba(255,255,255,0.06)",
                color: active ? color : "#64748b",
                transition: "all 0.15s ease",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {key !== "all" && (
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: color, flexShrink: 0,
                }} />
              )}
              {label}
              <span style={{ fontSize: 7, opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Safety awareness banner — location-based, inline ─────────── */}
      {mergedItems.filter(isSafetyItem).length > 0 && safetyBannerOpen && (
        <div style={{
          padding: "8px 16px", flexShrink: 0,
          borderBottom: "1px solid rgba(239,68,68,0.10)",
          background: "rgba(239,68,68,0.03)",
          display: "flex", alignItems: "flex-start", gap: 10,
          zIndex: 4,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", marginTop: 4, flexShrink: 0,
            background: "#ef4444", boxShadow: "0 0 8px #ef4444",
            animation: safetyInsightLoading ? "pulseDot 1.2s ease-in-out infinite" : "none",
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 9, letterSpacing: "0.20em", textTransform: "uppercase",
              color: "#ef4444", fontWeight: 700, marginBottom: 3,
            }}>
              🛡️ Safety Awareness{userCity ? ` — ${userCity}` : ""} · {mergedItems.filter(isSafetyItem).length} flagged
            </div>
            {safetyInsightLoading && (
              <div style={{ fontSize: 10, color: "#64748b" }}>Analyzing safety patterns…</div>
            )}
            {!safetyInsightLoading && safetyInsightError && (
              <div style={{ fontSize: 10, color: "#fca5a5" }}>{safetyInsightError}</div>
            )}
            {!safetyInsightLoading && safetyInsight && (
              <>
                <div style={{ fontSize: 10, color: "#fca5a5", lineHeight: 1.55, fontWeight: 600, marginBottom: 2 }}>
                  {safetyInsight.whatsHappening}
                </div>
                <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.55 }}>
                  {safetyInsight.whatYouShouldDo}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setSafetyBannerOpen(false)}
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              border: "none", background: "transparent",
              color: "#475569", fontSize: 10, cursor: "pointer",
            }}
            aria-label="Dismiss safety banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Opportunity awareness banner — location-based, inline ───── */}
      {mergedItems.filter(isOpportunityItem).length > 0 && opportunityBannerOpen && (
        <div style={{
          padding: "8px 16px", flexShrink: 0,
          borderBottom: "1px solid rgba(52,211,153,0.10)",
          background: "rgba(52,211,153,0.03)",
          display: "flex", alignItems: "flex-start", gap: 10,
          zIndex: 4,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", marginTop: 4, flexShrink: 0,
            background: "#34d399", boxShadow: "0 0 8px #34d399",
            animation: opInsightLoading ? "pulseDot 1.2s ease-in-out infinite" : "none",
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 9, letterSpacing: "0.20em", textTransform: "uppercase",
              color: "#34d399", fontWeight: 700, marginBottom: 3,
            }}>
              💡 Opportunities{userCity ? ` — ${userCity}` : ""} · {mergedItems.filter(isOpportunityItem).length} detected
            </div>
            {opInsightLoading && (
              <div style={{ fontSize: 10, color: "#64748b" }}>Scanning for opportunities…</div>
            )}
            {!opInsightLoading && opInsightError && (
              <div style={{ fontSize: 10, color: "#86efac" }}>{opInsightError}</div>
            )}
            {!opInsightLoading && opInsight && (
              <>
                <div style={{ fontSize: 10, color: "#86efac", lineHeight: 1.55, fontWeight: 600, marginBottom: 2 }}>
                  {opInsight.whatsHappening}
                </div>
                <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.55 }}>
                  {opInsight.whatYouShouldDo}
                </div>
                {opInsight.suggestedFeatures.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                    {opInsight.suggestedFeatures.map((fid) => {
                      const meta = FEATURE_META[fid];
                      if (!meta) return null;
                      return (
                        <button
                          key={fid}
                          onClick={() => { onAction?.(fid); }}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "4px 8px", borderRadius: 6,
                            background: "rgba(52,211,153,0.08)",
                            border: "1px solid rgba(52,211,153,0.25)",
                            color: "#34d399", fontSize: 8, fontWeight: 700,
                            fontFamily: "monospace", cursor: "pointer",
                          }}
                        >
                          {meta.icon} {meta.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
          <button
            onClick={() => setOpportunityBannerOpen(false)}
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              border: "none", background: "transparent",
              color: "#475569", fontSize: 10, cursor: "pointer",
            }}
            aria-label="Dismiss opportunity banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Civic engagement banner — location-based, inline ────────── */}
      {mergedItems.filter(isCivicItem).length > 0 && civicBannerOpen && (
        <div style={{
          padding: "8px 16px", flexShrink: 0,
          borderBottom: "1px solid rgba(59,130,246,0.10)",
          background: "rgba(59,130,246,0.03)",
          display: "flex", alignItems: "flex-start", gap: 10,
          zIndex: 4,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", marginTop: 4, flexShrink: 0,
            background: "#3b82f6", boxShadow: "0 0 8px #3b82f6",
            animation: civicInsightLoading ? "pulseDot 1.2s ease-in-out infinite" : "none",
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 9, letterSpacing: "0.20em", textTransform: "uppercase",
              color: "#3b82f6", fontWeight: 700, marginBottom: 3,
            }}>
              🏛️ Civic Pulse{userCity ? ` — ${userCity}` : ""} · {mergedItems.filter(isCivicItem).length} stories
            </div>
            {civicInsightLoading && (
              <div style={{ fontSize: 10, color: "#64748b" }}>Scanning civic activity…</div>
            )}
            {!civicInsightLoading && civicInsightError && (
              <div style={{ fontSize: 10, color: "#93c5fd" }}>{civicInsightError}</div>
            )}
            {!civicInsightLoading && civicInsight && (
              <>
                <div style={{ fontSize: 10, color: "#93c5fd", lineHeight: 1.55, fontWeight: 600, marginBottom: 2 }}>
                  {civicInsight.whatsHappening}
                </div>
                <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.55 }}>
                  {civicInsight.whatYouShouldDo}
                </div>
                {civicInsight.suggestedFeatures.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                    {civicInsight.suggestedFeatures.map((fid) => {
                      const meta = FEATURE_META[fid];
                      if (!meta) return null;
                      return (
                        <button key={fid} onClick={() => { onAction?.(fid); }}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "4px 8px", borderRadius: 6,
                            background: "rgba(59,130,246,0.08)",
                            border: "1px solid rgba(59,130,246,0.25)",
                            color: "#3b82f6", fontSize: 8, fontWeight: 700,
                            fontFamily: "monospace", cursor: "pointer",
                          }}>
                          {meta.icon} {meta.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
          <button onClick={() => setCivicBannerOpen(false)}
            style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: "none", background: "transparent", color: "#475569", fontSize: 10, cursor: "pointer" }}
            aria-label="Dismiss civic banner">
            ✕
          </button>
        </div>
      )}

      {/* Canvas container */}
      <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden", touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          onClick={(e) => {
            // Desktop clicks only — on touch devices taps are handled in touchEnd
            if (Date.now() - lastDragEndRef.current < 400) return;
            if (Date.now() - lastPinchEndRef.current < 400) return;
            handlePointer(e.clientX, e.clientY);
          }}
          // ── Touch: 1-finger drag to pan, 2-finger pinch to zoom ──────────
          onTouchStart={(e) => {
            if (e.touches.length === 2) {
              // Start pinch
              dragRef.current = null;
              const t1 = e.touches[0];
              const t2 = e.touches[1];
              const dx = t1.clientX - t2.clientX;
              const dy = t1.clientY - t2.clientY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              pinchStartRef.current = { dist, zoom: zoomRef.current };
              e.preventDefault();
            } else if (e.touches.length === 1) {
              // Record start for potential drag or tap
              const t = e.touches[0];
              dragRef.current = {
                startX: t.clientX,
                startY: t.clientY,
                panX: panRef.current.x,
                panY: panRef.current.y,
                moved: false,
              };
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 2 && pinchStartRef.current) {
              // Pinch zoom
              const t1 = e.touches[0];
              const t2 = e.touches[1];
              const dx = t1.clientX - t2.clientX;
              const dy = t1.clientY - t2.clientY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const ratio = dist / pinchStartRef.current.dist;
              const next = Math.max(0.55, Math.min(2.5, pinchStartRef.current.zoom * ratio));
              zoomRef.current = next;
              setZoom(next);
              e.preventDefault();
            } else if (e.touches.length === 1 && dragRef.current && !pinchStartRef.current) {
              // Single-finger drag → pan
              const t = e.touches[0];
              const dx = t.clientX - dragRef.current.startX;
              const dy = t.clientY - dragRef.current.startY;
              if (!dragRef.current.moved && Math.sqrt(dx * dx + dy * dy) > 8) {
                dragRef.current.moved = true;
              }
              if (dragRef.current.moved) {
                panRef.current = {
                  x: dragRef.current.panX + dx,
                  y: dragRef.current.panY + dy,
                };
                e.preventDefault();
              }
            }
          }}
          onTouchEnd={(e) => {
            if (e.touches.length < 2 && pinchStartRef.current) {
              pinchStartRef.current = null;
              lastPinchEndRef.current = Date.now();
            }
            if (dragRef.current) {
              if (!dragRef.current.moved) {
                // It was a tap, not a drag — select node/cluster
                handlePointer(dragRef.current.startX, dragRef.current.startY);
              } else {
                lastDragEndRef.current = Date.now();
              }
              dragRef.current = null;
            }
          }}
          // ── Desktop: ctrl/⌘ + wheel zooms (matches browser convention) ───
          onWheel={(e) => {
            // Only zoom when modifier is held — otherwise let the page scroll
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            const delta = -e.deltaY * 0.0015;
            const next = Math.max(0.55, Math.min(2.5, zoomRef.current * (1 + delta)));
            zoomRef.current = next;
            setZoom(next);
          }}
          style={{ width: size.w, height: size.h, display: "block", cursor: "pointer" }}
        />

        {/* Zoom indicator + reset (only visible when zoom != 1) */}
        {(Math.abs(zoom - 1) > 0.02 || Math.abs(panRef.current.x) > 5 || Math.abs(panRef.current.y) > 5) && (
          <button
            onClick={() => { zoomRef.current = 1; setZoom(1); panRef.current = { x: 0, y: 0 }; }}
            style={{
              position: "absolute", top: 12, left: 12, zIndex: 2,
              padding: "6px 10px", borderRadius: 8,
              background: "rgba(8,8,16,0.7)",
              border: "1px solid rgba(0,212,255,0.25)",
              color: "#00d4ff", fontSize: 9, fontFamily: "monospace",
              fontWeight: 700, letterSpacing: "0.08em",
              cursor: "pointer", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", gap: 6,
            }}
            aria-label="Reset zoom"
          >
            <span>{Math.round(zoom * 100)}%</span>
            <span style={{ opacity: 0.6 }}>· RESET</span>
          </button>
        )}

        {/* Loading overlay */}
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#00d4ff", fontSize: 11, letterSpacing: "0.18em" }}>
            <div style={{ fontSize: 24, animation: "spin 2s linear infinite" }}>📡</div>
            FETCHING NEWS PULSE…
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error overlay */}
        {!loading && error && items.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", fontSize: 11 }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 11 }}>
            No news available right now.
          </div>
        )}

        {/* Category legend */}
        {!loading && items.length > 0 && (
          <div style={{
            position: "absolute", bottom: 16, left: 16, right: 16,
            display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center",
            padding: "10px 12px", borderRadius: 12,
            background: "rgba(8,8,16,0.65)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(8px)",
            zIndex: 1,
          }}>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#94a3b8" }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: CATEGORY_COLORS[k],
                  boxShadow: `0 0 6px ${CATEGORY_COLORS[k]}`,
                }} />
                {v}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel (slides up when a node is selected) */}
      {selected && (() => {
        const accent = CATEGORY_COLORS[selected.category] ?? "#475569";
        return (
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            padding: 16, zIndex: 5,
            animation: "slideUpNW 0.28s ease forwards",
          }}>
            <div style={{
              borderRadius: 16, overflow: "hidden",
              background: "linear-gradient(160deg, rgba(16,16,26,0.98) 0%, rgba(10,10,20,0.98) 100%)",
              border: `1px solid ${accent}40`,
              boxShadow: `0 0 32px ${accent}26, 0 -10px 40px rgba(0,0,0,0.6)`,
              maxHeight: "82vh",
              display: "flex", flexDirection: "column",
            }}>
              {/* Header — always visible */}
              <div style={{ padding: "14px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
                  <div style={{
                    padding: "3px 8px", borderRadius: 6,
                    fontSize: 9, fontWeight: 700,
                    color: accent,
                    background: `${accent}1a`,
                    border: `1px solid ${accent}33`,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                  }}>
                    {CATEGORY_LABEL[selected.category] ?? selected.category}
                  </div>
                  <div style={{ fontSize: 9, color: "#64748b" }}>
                    {selected.source} · {timeAgo(selected.timestamp)}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 11, flexShrink: 0 }} aria-label="Close detail">✕</button>
              </div>

              {/* Scrollable body */}
              <div style={{ overflowY: "auto", padding: "0 16px 8px", flex: 1 }}>
                {/* Title + summary */}
                <div style={{ paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.4, marginBottom: 8 }}>
                    {selected.title}
                  </div>
                  {selected.summary && (
                    <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.65 }}>
                      {selected.summary}
                    </div>
                  )}
                </div>

                {/* NAVI Breakdown */}
                <div style={{ paddingTop: 14 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#00d4ff",
                      boxShadow: "0 0 8px #00d4ff",
                      animation: insightLoading ? "pulseDot 1.2s ease-in-out infinite" : "none",
                    }} />
                    <div style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "#00d4ff", fontWeight: 700 }}>
                      NAVI Breakdown
                    </div>
                  </div>

                  {insightLoading && (
                    <div style={{
                      padding: "16px", textAlign: "center",
                      fontSize: 10, color: "#64748b", letterSpacing: "0.1em",
                    }}>
                      NAVI is reading the story…
                    </div>
                  )}

                  {!insightLoading && insightError && (
                    <div style={{
                      padding: "10px 12px", borderRadius: 10,
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.18)",
                      fontSize: 10, color: "#fca5a5", lineHeight: 1.6,
                    }}>
                      {insightError}
                    </div>
                  )}

                  {!insightLoading && insight && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <InsightSection
                        label="WHAT'S HAPPENING"
                        body={insight.whatsHappening}
                        color="#00d4ff"
                      />
                      <InsightSection
                        label="WHY IT MATTERS"
                        body={insight.whyItMatters}
                        color="#C9A227"
                      />
                      <InsightSection
                        label="WHAT YOU SHOULD DO"
                        body={insight.whatYouShouldDo}
                        color="#34d399"
                      />

                      {/* Action buttons — open NAVI features */}
                      {insight.suggestedFeatures.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <div style={{ fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase", color: "#475569", fontWeight: 700, marginBottom: 8 }}>
                            Take Action
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {insight.suggestedFeatures.map((fid) => {
                              const meta = FEATURE_META[fid];
                              if (!meta) return null;
                              return (
                                <button
                                  key={fid}
                                  onClick={() => { onAction?.(fid); }}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    padding: "8px 12px", borderRadius: 10,
                                    background: `${meta.color}10`,
                                    border: `1px solid ${meta.color}40`,
                                    color: meta.color, fontSize: 10, fontWeight: 700,
                                    fontFamily: "monospace", cursor: "pointer",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  <span style={{ fontSize: 13 }}>{meta.icon}</span>
                                  {meta.label}
                                  <span style={{ fontSize: 10, opacity: 0.6 }}>↗</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Read full story footer — always visible */}
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", padding: "12px 16px", textAlign: "center",
                  fontSize: 11, fontWeight: 700,
                  color: accent,
                  textDecoration: "none", letterSpacing: "0.08em",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                  flexShrink: 0,
                }}
              >
                READ FULL STORY ↗
              </a>
            </div>
            <style jsx>{`
              @keyframes slideUpNW {
                from { transform: translateY(110%); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
              }
              @keyframes pulseDot {
                0%, 100% { opacity: 0.4; transform: scale(1);   }
                50%      { opacity: 1;   transform: scale(1.4); }
              }
            `}</style>
          </div>
        );
      })()}

      {/* Cluster trend detail panel */}
      {selectedCluster && (() => {
        const accent = CATEGORY_COLORS[selectedCluster.category ?? ""] ?? "#00d4ff";
        const memberItems = mergedItems.filter((it) => selectedCluster.itemIds.includes(it.id));
        return (
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            padding: 16, zIndex: 6,
            animation: "slideUpNW 0.28s ease forwards",
          }}>
            <div style={{
              borderRadius: 16, overflow: "hidden",
              background: "linear-gradient(160deg, rgba(16,16,26,0.98) 0%, rgba(10,10,20,0.98) 100%)",
              border: `1px solid ${accent}55`,
              boxShadow: `0 0 32px ${accent}33, 0 -10px 40px rgba(0,0,0,0.6)`,
              maxHeight: "82vh",
              display: "flex", flexDirection: "column",
            }}>
              {/* Header */}
              <div style={{ padding: "14px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
                  <div style={{
                    padding: "3px 8px", borderRadius: 6,
                    fontSize: 9, fontWeight: 700,
                    color: accent,
                    background: `${accent}1a`,
                    border: `1px solid ${accent}33`,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                  }}>
                    Trend · {memberItems.length} stories
                  </div>
                  {selectedCluster.keywords.length > 0 && (
                    <div style={{ fontSize: 9, color: "#64748b" }}>
                      {selectedCluster.keywords.slice(0, 4).join(", ")}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCluster(null)}
                  style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 11, flexShrink: 0 }}
                  aria-label="Close cluster detail"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable body */}
              <div style={{ overflowY: "auto", padding: "0 16px 8px", flex: 1 }}>
                {/* Cluster name */}
                <div style={{ paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.35, marginBottom: 4 }}>
                    {selectedCluster.name}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>
                    NAVI grouped these stories by topic similarity.
                  </div>
                </div>

                {/* NAVI Trend Breakdown */}
                <div style={{ paddingTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#00d4ff",
                      boxShadow: "0 0 8px #00d4ff",
                      animation: clusterInsightLoading ? "pulseDot 1.2s ease-in-out infinite" : "none",
                    }} />
                    <div style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "#00d4ff", fontWeight: 700 }}>
                      Trend Analysis
                    </div>
                  </div>

                  {clusterInsightLoading && (
                    <div style={{ padding: "16px", textAlign: "center", fontSize: 10, color: "#64748b", letterSpacing: "0.1em" }}>
                      NAVI is connecting the dots…
                    </div>
                  )}

                  {!clusterInsightLoading && clusterInsightError && (
                    <div style={{
                      padding: "10px 12px", borderRadius: 10,
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.18)",
                      fontSize: 10, color: "#fca5a5", lineHeight: 1.6,
                    }}>
                      {clusterInsightError}
                    </div>
                  )}

                  {!clusterInsightLoading && clusterInsight && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <InsightSection label="WHAT'S HAPPENING"   body={clusterInsight.whatsHappening}  color="#00d4ff" />
                      <InsightSection label="WHY IT MATTERS"     body={clusterInsight.whyItMatters}    color="#C9A227" />
                      <InsightSection label="WHAT YOU SHOULD DO" body={clusterInsight.whatYouShouldDo} color="#34d399" />

                      {clusterInsight.suggestedFeatures.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <div style={{ fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase", color: "#475569", fontWeight: 700, marginBottom: 8 }}>
                            Take Action
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {clusterInsight.suggestedFeatures.map((fid) => {
                              const meta = FEATURE_META[fid];
                              if (!meta) return null;
                              return (
                                <button
                                  key={fid}
                                  onClick={() => { onAction?.(fid); }}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    padding: "8px 12px", borderRadius: 10,
                                    background: `${meta.color}10`,
                                    border: `1px solid ${meta.color}40`,
                                    color: meta.color, fontSize: 10, fontWeight: 700,
                                    fontFamily: "monospace", cursor: "pointer",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  <span style={{ fontSize: 13 }}>{meta.icon}</span>
                                  {meta.label}
                                  <span style={{ fontSize: 10, opacity: 0.6 }}>↗</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Member stories list */}
                <div style={{ paddingTop: 18 }}>
                  <div style={{ fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase", color: "#475569", fontWeight: 700, marginBottom: 8 }}>
                    Stories in this trend
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {memberItems.slice(0, 15).map((it) => {
                      const itColor = CATEGORY_COLORS[it.category] ?? "#94a3b8";
                      return (
                        <button
                          key={it.id}
                          onClick={() => { setSelectedCluster(null); setSelected(it); }}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 8,
                            padding: "8px 10px", borderRadius: 8,
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            cursor: "pointer", textAlign: "left", width: "100%",
                            fontFamily: "monospace",
                          }}
                        >
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: itColor, boxShadow: `0 0 6px ${itColor}`,
                            marginTop: 5, flexShrink: 0,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.4 }}>
                              {it.title}
                            </div>
                            <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>
                              {it.source} · {timeAgo(it.timestamp)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Canvas helpers ──────────────────────────────────────────────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

// ── Insight section helper ──────────────────────────────────────────────────
function InsightSection({ label, body, color }: { label: string; body: string; color: string }) {
  if (!body) return null;
  return (
    <div style={{
      padding: "10px 12px", borderRadius: 10,
      background: `${color}07`,
      border: `1px solid ${color}1f`,
    }}>
      <div style={{
        fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase",
        color, fontWeight: 700, marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.65 }}>
        {body}
      </div>
    </div>
  );
}
