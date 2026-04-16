"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  timestamp: number;
}

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

const CATEGORY_COLORS: Record<string, string> = {
  national: "#a855f7",
  world:    "#00d4ff",
  tech:     "#34d399",
  sports:   "#f59e0b",
  business: "#C9A227",
  politics: "#f472b6",
};

const CATEGORY_LABEL: Record<string, string> = {
  national: "National",
  world:    "World",
  tech:     "Tech",
  sports:   "Sports",
  business: "Business",
  politics: "Politics",
};

function timeAgo(ts: number): string {
  const diff = Math.max(0, (Date.now() - ts) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NewsWebPanel({ onClose }: { onClose: () => void }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef     = useRef<NodeT[]>([]);
  const frameRef     = useRef<number>(0);
  const timeRef      = useRef<number>(0);

  const [items,    setItems]    = useState<NewsItem[]>([]);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [size,     setSize]     = useState({ w: 0, h: 0 });
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);

  // ── Fetch news + auto-refresh every 5 minutes ─────────────────────────────
  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      const json = await res.json();
      if (Array.isArray(json.news)) {
        setItems(json.news);
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

  // ── Build/refresh nodes when items or size change ─────────────────────────
  useEffect(() => {
    if (size.w === 0 || size.h === 0) return;
    const cx = size.w / 2;
    const cy = size.h / 2;
    const minR = Math.min(80, Math.min(size.w, size.h) * 0.18);
    const maxR = Math.min(size.w, size.h) * 0.42;

    // Group by category so same-category nodes cluster in arcs
    const byCat: Record<string, NewsItem[]> = {};
    items.forEach((it) => {
      (byCat[it.category] ??= []).push(it);
    });
    const categories = Object.keys(byCat);
    const arcSize = (Math.PI * 2) / Math.max(1, categories.length);

    const newNodes: NodeT[] = [];
    categories.forEach((cat, ci) => {
      const arr = byCat[cat];
      const baseStart = ci * arcSize;
      const subArc = arcSize / Math.max(1, arr.length);
      arr.forEach((item, i) => {
        const angle = baseStart + subArc * i + subArc * 0.5;
        const radius = minR + (maxR - minR) * (0.3 + Math.random() * 0.7);
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
    });
    nodesRef.current = newNodes;
  }, [items, size.w, size.h]);

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
      const cx = size.w / 2;
      const cy = size.h / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Background radial glow
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(size.w, size.h) * 0.6);
      bg.addColorStop(0, "rgba(0,212,255,0.05)");
      bg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size.w, size.h);

      const nodes = nodesRef.current;

      // Update node positions (smooth drift toward orbital target)
      for (const n of nodes) {
        const driftX = Math.sin(t * n.driftSpeed + n.driftPhase) * 6;
        const driftY = Math.cos(t * n.driftSpeed * 0.7 + n.driftPhase) * 6;
        const targetX = cx + Math.cos(n.baseAngle) * n.baseRadius + driftX;
        const targetY = cy + Math.sin(n.baseAngle) * n.baseRadius + driftY;
        n.x += (targetX - n.x) * 0.06;
        n.y += (targetY - n.y) * 0.06;
        if (n.age < 1) n.age = Math.min(1, n.age + 0.018);
      }

      // Spokes from each node to NAVI core
      for (const n of nodes) {
        ctx.strokeStyle = `${n.color}1a`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }

      // Cluster lines: connect same-category nodes within distance threshold
      const linkDist = 200;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          if (a.category !== b.category) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > linkDist) continue;
          const alpha = (1 - d / linkDist) * 0.35;
          const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
          ctx.strokeStyle = `${a.color}${hex}`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // NAVI core (pulsing)
      const pulse = 1 + Math.sin(t * 1.4) * 0.12;
      const coreR = 32 * pulse;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreGrad.addColorStop(0,   "rgba(0,212,255,0.50)");
      coreGrad.addColorStop(0.4, "rgba(201,162,39,0.22)");
      coreGrad.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(0,212,255,0.95)";
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.beginPath();
      ctx.arc(cx, cy, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Nodes
      for (const n of nodes) {
        const sz = n.size * n.age;
        if (sz < 0.5) continue;
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

      ctx.restore();
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { running = false; cancelAnimationFrame(frameRef.current); };
  }, [size.w, size.h]);

  // ── Click → hit-test nearest node ─────────────────────────────────────────
  const handlePointer = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    let nearest: NodeT | null = null;
    let minDist = Infinity;
    for (const n of nodesRef.current) {
      const dx = n.x - x;
      const dy = n.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const hitR = Math.max(n.size * 3, 18);
      if (d < hitR && d < minDist) {
        nearest = n;
        minDist = d;
      }
    }
    if (nearest) setSelected(nearest);
  }, []);

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

      {/* Canvas container */}
      <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden", touchAction: "manipulation" }}>
        <canvas
          ref={canvasRef}
          onClick={(e) => handlePointer(e.clientX, e.clientY)}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (t) handlePointer(t.clientX, t.clientY);
          }}
          style={{ width: size.w, height: size.h, display: "block", cursor: "pointer" }}
        />

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
      {selected && (
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          padding: 16, zIndex: 5,
          animation: "slideUpNW 0.28s ease forwards",
        }}>
          <div style={{
            borderRadius: 16, overflow: "hidden",
            background: "linear-gradient(160deg, rgba(16,16,26,0.98) 0%, rgba(10,10,20,0.98) 100%)",
            border: `1px solid ${CATEGORY_COLORS[selected.category] ?? "#475569"}40`,
            boxShadow: `0 0 32px ${CATEGORY_COLORS[selected.category] ?? "#0006"}26, 0 -10px 40px rgba(0,0,0,0.6)`,
          }}>
            <div style={{ padding: "14px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
                <div style={{
                  padding: "3px 8px", borderRadius: 6,
                  fontSize: 9, fontWeight: 700,
                  color: CATEGORY_COLORS[selected.category] ?? "#94a3b8",
                  background: `${CATEGORY_COLORS[selected.category] ?? "#475569"}1a`,
                  border: `1px solid ${CATEGORY_COLORS[selected.category] ?? "#475569"}33`,
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
            <div style={{ padding: "0 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.4, marginBottom: 8 }}>
                {selected.title}
              </div>
              {selected.summary && (
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.65 }}>
                  {selected.summary}
                </div>
              )}
            </div>
            <a href={selected.url} target="_blank" rel="noopener noreferrer" style={{
              display: "block", padding: "12px 16px", textAlign: "center",
              fontSize: 11, fontWeight: 700,
              color: CATEGORY_COLORS[selected.category] ?? "#00d4ff",
              textDecoration: "none", letterSpacing: "0.08em",
            }}>
              READ FULL STORY ↗
            </a>
          </div>
          <style jsx>{`
            @keyframes slideUpNW {
              from { transform: translateY(110%); opacity: 0; }
              to   { transform: translateY(0);    opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
