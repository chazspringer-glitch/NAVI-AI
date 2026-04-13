"use client";

import { useState, useRef } from "react";

// ── Type metadata ─────────────────────────────────────────────────────────────
const TYPE_META = {
  temp_agency:  { label: "Temp Agency",     icon: "💼", color: "#00d4ff" },
  unemployment: { label: "Unemployment",    icon: "🏛️",  color: "#f59e0b" },
  food:         { label: "Food Assistance", icon: "🍎", color: "#4ade80" },
  housing:      { label: "Housing Help",    icon: "🏠", color: "#a855f7" },
  utilities:    { label: "Utility Help",    icon: "⚡", color: "#fbbf24" },
  workforce:    { label: "Workforce",       icon: "📋", color: "#06b6d4" },
  social:       { label: "Social Services", icon: "🤝", color: "#f472b6" },
};

// ── Single resource card ──────────────────────────────────────────────────────
function ResourceCard({ resource }) {
  const meta = TYPE_META[resource.type] ?? {
    label: resource.type ?? "Resource",
    icon: "📍",
    color: "#94a3b8",
  };

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2.5"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${meta.color}28`,
      }}
    >
      {/* Type badge */}
      <span
        className="self-start text-[10px] font-mono px-2 py-0.5 rounded-full"
        style={{
          background: `${meta.color}15`,
          border: `1px solid ${meta.color}38`,
          color: meta.color,
          letterSpacing: "0.05em",
        }}
      >
        {meta.icon} {meta.label}
      </span>

      {/* Name */}
      <div className="text-sm font-mono font-bold text-white leading-snug">
        {resource.name}
      </div>

      {/* Description */}
      <p className="text-xs font-mono text-slate-400 leading-relaxed">
        {resource.description}
      </p>

      {/* Next step */}
      <div
        className="rounded-xl px-3 py-2 flex items-start gap-2"
        style={{
          background: `${meta.color}0c`,
          border: `1px solid ${meta.color}22`,
        }}
      >
        <span className="text-[11px] font-bold mt-0.5 flex-shrink-0" style={{ color: meta.color }}>
          →
        </span>
        <span className="text-[11px] font-mono leading-relaxed" style={{ color: meta.color }}>
          {resource.nextStep}
        </span>
      </div>

      {/* URL (subtle link) */}
      {resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono truncate underline-offset-2 hover:underline"
          style={{ color: "rgba(148,163,184,0.45)" }}
        >
          {resource.url}
        </a>
      )}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2.5 animate-pulse"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="h-4 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="h-4 w-3/4 rounded-lg"  style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="h-3 w-full rounded-lg"  style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="h-3 w-5/6 rounded-lg"  style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="h-8 w-full rounded-xl"  style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LocalResourceFinder({ onClose }) {
  const [location, setLocation] = useState("");
  const [loading, setLoading]   = useState(false);
  const [resources, setResources] = useState(null);
  const [error, setError]        = useState(null);
  const [searchedLocation, setSearchedLocation] = useState("");
  const inputRef = useRef(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const loc = location.trim();
    if (!loc || loading) return;

    setLoading(true);
    setError(null);
    setResources(null);

    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to load resources.");
      setSearchedLocation(loc);
      setResources(data.resources ?? []);
    } catch (err) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden animate-overlay-in"
      style={{ background: "rgba(8,8,15,0.97)", backdropFilter: "blur(16px)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
            📍 Find Local Help
          </span>
          <span className="text-[10px] font-mono text-slate-500 tracking-wide">
            Agencies, offices &amp; services near you
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* ── Search bar ── */}
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="flex items-center flex-1 gap-2 px-3 py-2 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span className="text-sm flex-shrink-0">📍</span>
          <input
            ref={inputRef}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or ZIP code (e.g. Atlanta or 30301)"
            disabled={loading}
            autoFocus
            className="flex-1 bg-transparent font-mono text-sm text-slate-200 placeholder-slate-600 focus:outline-none disabled:opacity-50 min-w-0"
            style={{ caretColor: "#00d4ff" }}
          />
        </div>
        <button
          type="submit"
          disabled={!location.trim() || loading}
          className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "rgba(0,212,255,0.12)",
            border: "1px solid rgba(0,212,255,0.35)",
            color: "#00d4ff",
            boxShadow: location.trim() && !loading ? "0 0 8px rgba(0,212,255,0.12)" : "none",
          }}
        >
          {loading ? "..." : "Search"}
        </button>
      </form>

      {/* ── Scrollable results ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* Empty state */}
        {!loading && !resources && !error && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
            <span style={{ fontSize: 44, filter: "drop-shadow(0 0 12px rgba(0,212,255,0.3))" }}>
              📍
            </span>
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-sm font-mono font-bold text-slate-400">Find help near you</p>
              <p className="text-xs font-mono text-slate-600 text-center leading-relaxed max-w-[260px]">
                Enter your city or ZIP above to find nearby temp agencies, unemployment offices, food banks, and more.
              </p>
            </div>
            {/* Category legend */}
            <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-[300px]">
              {Object.values(TYPE_META).map((m) => (
                <span
                  key={m.label}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                  style={{ background: `${m.color}12`, border: `1px solid ${m.color}30`, color: m.color }}
                >
                  {m.icon} {m.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="flex flex-col gap-3">
            <div
              className="text-[10px] font-mono text-slate-600 mb-1 tracking-widest uppercase animate-pulse"
            >
              Searching for resources…
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-xl px-4 py-3 text-xs font-mono leading-relaxed"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5",
            }}
          >
            ⚠ {error}
            <button
              onClick={handleSearch}
              className="block mt-2 text-[11px] underline"
              style={{ color: "#f87171" }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {resources && resources.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] font-mono text-slate-600 tracking-widest uppercase mb-1">
              {resources.length} resources near {searchedLocation}
            </div>
            {resources.map((r, i) => (
              <ResourceCard key={i} resource={r} />
            ))}
            <p className="text-[10px] font-mono text-slate-700 text-center leading-relaxed pt-2 pb-6 px-2">
              Results are AI-generated suggestions. Always verify details directly with each resource.
            </p>
          </div>
        )}

        {/* Empty results (AI returned []) */}
        {resources && resources.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12">
            <span style={{ fontSize: 32 }}>🔍</span>
            <p className="text-xs font-mono text-slate-500 text-center leading-relaxed max-w-[240px]">
              No results found for "{searchedLocation}". Try a nearby city or a different ZIP code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
