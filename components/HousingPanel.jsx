"use client";

import { useState, useRef } from "react";

const ACCENT = "#10b981"; // emerald — calm, stable, home

const TYPE_META = {
  private_owner: { label: "Private Owner",        icon: "🔑", color: "#10b981" },
  section_8:     { label: "Section 8 / Voucher",  icon: "🏛️",  color: "#8b5cf6" },
  nonprofit:     { label: "Nonprofit Housing",     icon: "🤝", color: "#06b6d4" },
  emergency:     { label: "Emergency / Bridge",    icon: "⚡", color: "#f59e0b" },
};

const GUIDE_STEPS = [
  {
    icon: "🔍",
    title: "Search",
    desc: "Enter your city or ZIP, set your max monthly budget, and choose how many bedrooms you need.",
  },
  {
    icon: "📋",
    title: "Browse",
    desc: "See private owner rentals, Section 8 contacts, nonprofit housing, and emergency resources near you.",
  },
  {
    icon: "📞",
    title: "Connect",
    desc: "Follow the next step on each listing — call, email, or visit. Bring your ID and proof of income.",
  },
];

const TIPS = [
  "Private owners often work with people who have limited rental history",
  "Section 8 vouchers can lower your rent to roughly 30% of your income",
  "Nonprofit housing rarely requires credit checks",
  "Never send money or sign anything before seeing the unit in person",
];

// ── Listing card ──────────────────────────────────────────────────────────────
function ListingCard({ listing }) {
  const meta = TYPE_META[listing.type] ?? { label: listing.type ?? "Resource", icon: "🏠", color: ACCENT };

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: `1px solid ${meta.color}28`,
      borderRadius: 16,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {/* Type badge */}
      <span style={{
        alignSelf: "flex-start",
        fontSize: 10,
        fontFamily: "monospace",
        padding: "2px 8px",
        borderRadius: 99,
        background: `${meta.color}15`,
        border: `1px solid ${meta.color}38`,
        color: meta.color,
        letterSpacing: "0.05em",
      }}>
        {meta.icon} {meta.label}
      </span>

      {/* Name */}
      <div style={{ fontSize: 14, fontFamily: "monospace", fontWeight: "bold", color: "#f1f5f9", lineHeight: 1.35 }}>
        {listing.name}
      </div>

      {/* Address · rent · bedrooms row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {listing.address && (
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>📍 {listing.address}</span>
        )}
        {listing.rent && (
          <span style={{ fontSize: 11, fontFamily: "monospace", color: meta.color, fontWeight: "bold" }}>
            {listing.rent}
          </span>
        )}
        {listing.bedrooms && (
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>🛏 {listing.bedrooms}</span>
        )}
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.65, margin: 0 }}>
        {listing.description}
      </p>

      {/* Waitlist badge */}
      {listing.waitlist && (
        <span style={{
          alignSelf: "flex-start",
          fontSize: 9,
          fontFamily: "monospace",
          padding: "2px 8px",
          borderRadius: 99,
          background: "rgba(251,191,36,0.1)",
          border: "1px solid rgba(251,191,36,0.25)",
          color: "#fbbf24",
          letterSpacing: "0.06em",
        }}>
          ⏳ Waitlist may apply
        </span>
      )}

      {/* Next step */}
      <div style={{
        background: `${meta.color}0c`,
        border: `1px solid ${meta.color}22`,
        borderRadius: 12,
        padding: "8px 12px",
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 11, fontWeight: "bold", flexShrink: 0, color: meta.color, marginTop: 1 }}>→</span>
        <span style={{ fontSize: 11, fontFamily: "monospace", color: meta.color, lineHeight: 1.55 }}>
          {listing.nextStep}
        </span>
      </div>

      {/* URL */}
      {listing.url && (
        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            color: "rgba(148,163,184,0.45)",
            textDecoration: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {listing.url}
        </a>
      )}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 16,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {[{ w: 90, h: 16 }, { w: "75%", h: 16 }, { w: "100%", h: 12 }, { w: "85%", h: 12 }, { w: "100%", h: 36 }].map(({ w, h }, i) => (
        <div key={i} style={{
          width: w, height: h,
          borderRadius: 8,
          background: "rgba(255,255,255,0.06)",
          animation: "housingPulse 1.5s ease-in-out infinite",
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HousingPanel({ onClose }) {
  const [location,  setLocation]  = useState("");
  const [maxRent,   setMaxRent]   = useState(1200);
  const [bedrooms,  setBedrooms]  = useState("any");
  const [creditScore, setCreditScore] = useState("fair");
  const [income,    setIncome]    = useState("");
  const [goalType,  setGoalType]  = useState("renting");
  const [timeline,  setTimeline]  = useState("asap");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [listings,  setListings]  = useState(null);
  const [error,     setError]     = useState(null);
  const [searchTag, setSearchTag] = useState("");
  const inputRef = useRef(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const loc = location.trim();
    if (!loc || loading) return;

    console.log("[Housing] Search started:", { loc, maxRent, bedrooms });
    setLoading(true);
    setError(null);
    setListings(null);

    try {
      const res = await fetch("/api/housing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc, maxRent, bedrooms }),
      });

      console.log("[Housing] Response status:", res.status, res.statusText);

      // Guard: if server returned HTML (404/500 error page) instead of JSON,
      // read as text so we can log the cause rather than crashing on '<'.
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("[Housing] Non-JSON response:", res.status, text.slice(0, 400));
        throw new Error("Unable to load housing results. Try again.");
      }

      const data = await res.json();
      console.log("[Housing] RAW RESPONSE:", data);

      if (!res.ok || data.error) {
        throw new Error(data.error ?? "Failed to load listings.");
      }

      setSearchTag(
        `${loc} · max $${maxRent.toLocaleString()}/mo · ${bedrooms === "any" ? "any size" : bedrooms + " BR"}`
      );
      setListings(data.listings ?? []);
    } catch (err) {
      console.error("[Housing] Search error:", err);
      setError(err?.message ?? "Unable to load housing results. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasResults = listings && listings.length > 0;
  const isEmpty    = listings && listings.length === 0;

  return (
    <div style={{
      position: "fixed", inset: 0,
      zIndex: 60,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      background: "rgba(4,8,18,0.97)",
      backdropFilter: "blur(16px)",
    }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{
            fontSize: 11,
            fontFamily: "monospace",
            fontWeight: "bold",
            color: "#f1f5f9",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            🏠 Affordable Housing Finder
          </span>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#475569", letterSpacing: "0.04em" }}>
            Private owners · Nonprofits · Section 8 · Emergency help
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 32, height: 32,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>

      {/* ── Search form ── */}
      <form
        onSubmit={handleSearch}
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Location */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "8px 12px",
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>📍</span>
          <input
            ref={inputRef}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or ZIP code (e.g. Detroit or 48201)"
            disabled={loading}
            autoFocus
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "monospace",
              fontSize: 13,
              color: "#e2e8f0",
              caretColor: ACCENT,
            }}
          />
        </div>

        {/* Budget + Bedrooms */}
        <div style={{ display: "flex", gap: 8 }}>

          {/* Budget slider */}
          <div style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "8px 12px",
          }}>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Max Rent / Mo
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: ACCENT, fontWeight: "bold", minWidth: 52 }}>
                ${maxRent.toLocaleString()}
              </span>
              <input
                type="range"
                min={400} max={3000} step={50}
                value={maxRent}
                onChange={(e) => setMaxRent(Number(e.target.value))}
                disabled={loading}
                style={{ flex: 1, accentColor: ACCENT, cursor: "pointer" }}
              />
            </div>
          </div>

          {/* Bedrooms */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "8px 12px",
            minWidth: 86,
          }}>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Bedrooms
            </div>
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              disabled={loading}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e2e8f0",
                fontFamily: "monospace",
                fontSize: 12,
                cursor: "pointer",
                width: "100%",
              }}
            >
              <option value="any">Any</option>
              <option value="studio">Studio</option>
              <option value="1">1 BR</option>
              <option value="2">2 BR</option>
              <option value="3">3 BR+</option>
            </select>
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 10, fontFamily: "monospace", color: "#475569",
            padding: "2px 0", textAlign: "left",
          }}
        >
          {showAdvanced ? "▼" : "▸"} {showAdvanced ? "Less options" : "More options (credit, income, buy vs rent)"}
        </button>

        {showAdvanced && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 12px" }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" }}>Credit Score</div>
                <select value={creditScore} onChange={(e) => setCreditScore(e.target.value)} disabled={loading}
                  style={{ background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontFamily: "monospace", fontSize: 12, cursor: "pointer", width: "100%" }}>
                  <option value="poor">Poor (below 580)</option>
                  <option value="fair">Fair (580–669)</option>
                  <option value="good">Good (670–739)</option>
                  <option value="excellent">Excellent (740+)</option>
                  <option value="unknown">Not sure</option>
                </select>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 12px" }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" }}>Monthly Income</div>
                <input value={income} onChange={(e) => setIncome(e.target.value)} placeholder="e.g. 3000" disabled={loading}
                  style={{ background: "transparent", border: "none", outline: "none", fontFamily: "monospace", fontSize: 12, color: "#e2e8f0", width: "100%" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 12px" }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" }}>Goal</div>
                <select value={goalType} onChange={(e) => setGoalType(e.target.value)} disabled={loading}
                  style={{ background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontFamily: "monospace", fontSize: 12, cursor: "pointer", width: "100%" }}>
                  <option value="renting">Renting</option>
                  <option value="buying">Buying a home</option>
                  <option value="exploring">Just exploring</option>
                </select>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 12px" }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" }}>Timeline</div>
                <select value={timeline} onChange={(e) => setTimeline(e.target.value)} disabled={loading}
                  style={{ background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontFamily: "monospace", fontSize: 12, cursor: "pointer", width: "100%" }}>
                  <option value="asap">ASAP</option>
                  <option value="3months">Within 3 months</option>
                  <option value="exploring">Just exploring</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!location.trim() || loading}
          style={{
            padding: "10px 0",
            borderRadius: 12,
            border: `1px solid ${location.trim() && !loading ? ACCENT + "66" : "rgba(255,255,255,0.08)"}`,
            background: location.trim() && !loading ? `${ACCENT}16` : "rgba(255,255,255,0.03)",
            color: location.trim() && !loading ? ACCENT : "#475569",
            fontFamily: "monospace",
            fontSize: 12,
            fontWeight: "bold",
            cursor: !location.trim() || loading ? "not-allowed" : "pointer",
            letterSpacing: "0.08em",
            boxShadow: location.trim() && !loading ? `0 0 12px ${ACCENT}18` : "none",
            transition: "all 0.2s ease",
          }}
        >
          {loading ? "Searching…" : "🔍  Find Affordable Housing"}
        </button>
      </form>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

        {/* Empty state — guide */}
        {!loading && !listings && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* 3-step guide */}
            <p style={{ margin: 0, fontSize: 10, fontFamily: "monospace", color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              How it works
            </p>
            {GUIDE_STEPS.map((step, i) => (
              <div key={i} style={{
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                background: `${ACCENT}06`,
                border: `1px solid ${ACCENT}18`,
                borderRadius: 14,
                padding: "12px 14px",
              }}>
                <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{step.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: "bold", color: "#f1f5f9", marginBottom: 4 }}>
                    {i + 1}. {step.title}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.6 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}

            {/* Tips */}
            <div style={{
              background: "rgba(139,92,246,0.06)",
              border: "1px solid rgba(139,92,246,0.16)",
              borderRadius: 14,
              padding: "14px 16px",
            }}>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontFamily: "monospace", color: "#a78bfa", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                💡 Good to know
              </p>
              {TIPS.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < TIPS.length - 1 ? 8 : 0 }}>
                  <span style={{ fontSize: 10, color: "#7c3aed", flexShrink: 0, marginTop: 2 }}>▸</span>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "#c4b5fd", lineHeight: 1.55 }}>{tip}</span>
                </div>
              ))}
            </div>

            {/* 211 callout */}
            <div style={{
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.16)",
              borderRadius: 14,
              padding: "12px 14px",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
              <div>
                <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: "bold", color: "#fbbf24", marginBottom: 3 }}>
                  Need help now? Call or text 211
                </div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: "#d97706", lineHeight: 1.5 }}>
                  Free national helpline — connects you to local emergency housing, shelter, and rental assistance immediately.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#334155", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Searching for housing options…
            </div>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 14,
            padding: "14px 16px",
            fontSize: 12,
            fontFamily: "monospace",
            color: "#fca5a5",
            lineHeight: 1.6,
          }}>
            ⚠ {error}
            <button
              onClick={handleSearch}
              style={{
                display: "block",
                marginTop: 8,
                fontSize: 11,
                color: "#f87171",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "monospace",
                padding: 0,
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#334155", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {listings.length} options found · {searchTag}
            </div>
            {listings.map((listing, i) => <ListingCard key={i} listing={listing} />)}
            <div style={{
              background: "rgba(245,158,11,0.05)",
              border: "1px solid rgba(245,158,11,0.12)",
              borderRadius: 12,
              padding: "10px 14px",
              marginTop: 4,
            }}>
              <p style={{ margin: 0, fontSize: 10, fontFamily: "monospace", color: "#92400e", lineHeight: 1.65, textAlign: "center" }}>
                ⚠ Results are AI-generated suggestions based on real program types. Always verify availability and contact information directly with each resource before applying or sending any money.
              </p>
            </div>
            {/* Real listing search links */}
            <div style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: ACCENT, fontWeight: "bold", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                🔗 Search Real Listings
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Zillow Rentals", url: `https://www.zillow.com/homes/for_rent/${encodeURIComponent(location.trim())}_rb/0-${maxRent}_mp/` },
                  { label: "Apartments.com", url: `https://www.apartments.com/${encodeURIComponent(location.trim().toLowerCase().replace(/\s+/g, "-"))}/max-${maxRent}-monthly/` },
                  { label: "AffordableHousing.com", url: `https://affordablehousingonline.com/housing-search/${encodeURIComponent(location.trim())}` },
                  { label: "HUD Resources", url: "https://www.hud.gov/topics/rental_assistance" },
                ].map(({ label, url }) => (
                  <button key={label} onClick={() => window.open(url, "_blank")} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${ACCENT}18`, color: ACCENT, fontSize: 11, fontFamily: "monospace",
                  }}>
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>↗</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Home Ownership Roadmap — only if buying */}
            {goalType === "buying" && (
              <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: "#00d4ff", fontWeight: "bold", marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  🏡 Your Home Ownership Roadmap
                </div>
                {[
                  { step: "1", title: "Improve Your Credit", desc: creditScore === "poor" || creditScore === "fair" ? "Focus on paying down debt and disputing errors. Aim for 620+ for FHA loans." : "Your credit is solid. Keep utilization below 30%.", color: "#f59e0b" },
                  { step: "2", title: "Save for Down Payment", desc: income ? `With $${income}/mo income, aim to save $${Math.round(parseInt(income) * 3.5).toLocaleString()} (3.5% FHA). That's ~${Math.round((parseInt(income) * 3.5) / parseInt(income))} months of saving.` : "Save 3.5% for FHA or 5-20% for conventional. Every dollar counts.", color: "#34d399" },
                  { step: "3", title: "Get Pre-Approved", desc: "Talk to a lender BEFORE looking at homes. This shows sellers you're serious and locks your rate.", color: "#00d4ff" },
                  { step: "4", title: "Know Your Loan Options", desc: creditScore === "poor" || creditScore === "fair" ? "FHA loans accept 580+ credit. USDA loans have no down payment for rural areas." : "You may qualify for conventional loans with better rates. Also check VA if eligible.", color: "#a855f7" },
                  { step: "5", title: "Find & Inspect", desc: "Never skip the home inspection ($300-500). It can save you from $10K+ in hidden problems.", color: "#10b981" },
                ].map(({ step, title, desc, color }) => (
                  <div key={step} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${color}18`, border: `1px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>{step}</div>
                    <div>
                      <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#e2e8f0", marginBottom: 2 }}>{title}</div>
                      <div style={{ fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.55 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* What to Avoid */}
            <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "#f87171", fontWeight: "bold", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                ⚠️ What to Avoid
              </div>
              {[
                "Never pay a deposit or application fee without seeing the unit in person",
                "Avoid listings that ask for payment via Cash App, Zelle, or wire transfer only",
                "If the rent is way below market rate with no explanation — it's likely a scam",
                "Don't sign a lease without reading every page, especially early termination clauses",
                goalType === "buying" ? "Never waive the home inspection to 'speed up' the process" : "Be cautious of landlords who won't provide a written lease agreement",
              ].map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 10, fontFamily: "monospace", color: "#fca5a5", lineHeight: 1.55 }}>
                  <span style={{ color: "#f87171", flexShrink: 0 }}>✕</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>

            {/* Local Support Resources */}
            <div style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "#a855f7", fontWeight: "bold", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                🤝 Local Support
              </div>
              {[
                { icon: "📞", label: "Call 211", desc: "Free helpline for emergency housing, shelter, and rental assistance", action: "tel:211" },
                { icon: "🏛️", label: "Find Your Local PHA", desc: "Public Housing Authority — apply for Section 8 vouchers", action: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts" },
                { icon: "💰", label: "Emergency Rental Assistance", desc: "Federal funds to help cover rent if you're behind", action: "https://home.treasury.gov/policy-issues/coronavirus/assistance-for-state-local-and-tribal-governments/emergency-rental-assistance-program" },
                { icon: "🏠", label: "Habitat for Humanity", desc: "Affordable home ownership programs for qualifying families", action: "https://www.habitat.org/housing-help" },
                { icon: "📋", label: "HUD Counseling", desc: "Free housing counselors near you — no strings attached", action: "https://www.hud.gov/findacounselor" },
              ].map(({ icon, label, desc, action }) => (
                <button key={label} onClick={() => window.open(action, "_blank")} style={{
                  width: "100%", display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.10)", marginBottom: 4,
                  textAlign: "left", color: "#e2e8f0", fontFamily: "monospace",
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#c4b5fd" }}>{label}</div>
                    <div style={{ fontSize: 9, color: "#64748b", marginTop: 1, lineHeight: 1.4 }}>{desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "#64748b", flexShrink: 0 }}>↗</span>
                </button>
              ))}
            </div>

            <div style={{ height: 24 }} />
          </div>
        )}

        {/* Empty results */}
        {isEmpty && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 48 }}>
            <span style={{ fontSize: 32 }}>🔍</span>
            <p style={{ fontSize: 12, fontFamily: "monospace", color: "#64748b", textAlign: "center", lineHeight: 1.65, maxWidth: 240, margin: 0 }}>
              No results found for that location. Try a nearby city or different ZIP code.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes housingPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
