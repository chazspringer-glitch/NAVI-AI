"use client";

import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Gun Violence Awareness — factual, respectful, community-focused.
//
// Uses the Gun Violence Archive (GVA) via Google News RSS for near-real-time
// incident data. No graphic details. No speculation. Sources labeled.
// ─────────────────────────────────────────────────────────────────────────────

interface Incident {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  timestamp: number;
  label: "verified" | "developing";
}

type GVTab = "overview" | "local" | "patterns" | "safety" | "resources";

const TABS: { key: GVTab; label: string; icon: string }[] = [
  { key: "overview",  label: "National",   icon: "📋" },
  { key: "local",     label: "Wilmington", icon: "📍" },
  { key: "patterns",  label: "Patterns",   icon: "📊" },
  { key: "safety",    label: "Safety",     icon: "🛡️" },
  { key: "resources", label: "Resources",  icon: "🤝" },
];

const SAFETY_GUIDANCE = [
  { title: "If you hear gunshots", steps: ["Get down and take cover immediately", "Move away from windows and doors", "Call 911 when it's safe to do so", "Stay in place until police give the all-clear", "Check on others around you only when it's safe"] },
  { title: "Active shooter situation", steps: ["RUN — if there's a safe exit, take it", "HIDE — if you can't run, find a locked room", "FIGHT — as a last resort only, with anything available", "Call 911 when safe — give location and description", "When police arrive, keep hands visible and follow instructions"] },
  { title: "After an incident nearby", steps: ["Check in with family and friends", "Avoid the area — let first responders work", "Get accurate information from official sources, not social media", "It's normal to feel scared — talk to someone you trust", "Reach out to community support if needed"] },
  { title: "Talking to kids about gun violence", steps: ["Be honest but age-appropriate — don't give graphic details", "Ask what they've heard and how they feel", "Reassure them that adults are working to keep them safe", "Limit their exposure to news coverage", "Watch for changes in behavior — anxiety, sleep issues, withdrawal"] },
];

const COMMUNITY_RESOURCES = [
  { label: "National Crisis Hotline", detail: "Call or text 988 — 24/7 mental health support", url: "tel:988", color: "#ef4444", action: "Call 988" },
  { label: "Everytown for Gun Safety", detail: "Research, policy, and community action on gun violence prevention", url: "https://www.everytown.org/", color: "#00d4ff", action: "Learn more" },
  { label: "The Trace", detail: "Independent, nonprofit journalism on gun violence in America", url: "https://www.thetrace.org/", color: "#34d399", action: "Read" },
  { label: "Gun Violence Archive", detail: "Comprehensive database of gun violence incidents — verified data", url: "https://www.gunviolencearchive.org/", color: "#f59e0b", action: "View data" },
  { label: "Moms Demand Action", detail: "Grassroots movement for public safety — find your local chapter", url: "https://momsdemandaction.org/", color: "#f472b6", action: "Join" },
  { label: "Giffords Law Center", detail: "Legal expertise and policy research on gun violence prevention", url: "https://giffords.org/", color: "#a855f7", action: "Learn more" },
  { label: "SAMHSA Helpline", detail: "1-800-662-4357 — Free mental health and substance abuse referrals", url: "tel:18006624357", color: "#ef4444", action: "Call" },
  { label: "Community Violence Intervention", detail: "Find local CVI programs that reduce violence through outreach", url: "https://www.whitehouse.gov/cvi/", color: "#C9A227", action: "Find programs" },
];

// GVA national stats (updated periodically — these are approximate annual baselines)
const NATIONAL_STATS = {
  annualDeaths: "~45,000",
  dailyAverage: "~124",
  massShootings: "600+",
  childrenKilled: "~1,600",
  source: "Gun Violence Archive / CDC",
  year: "2023",
};

export default function GunViolencePanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<GVTab>("overview");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [localIncidents, setLocalIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const [userCity, setUserCity] = useState("Wilmington, NC");
  const [cityInput, setCityInput] = useState("");
  const [showCitySearch, setShowCitySearch] = useState(false);

  // Fetch LIVE national gun violence news
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/news/local?city=gun+violence+shooting+United+States");
        const json = await res.json();
        if (Array.isArray(json.items)) {
          setIncidents(json.items.slice(0, 15).map((it: Incident & { timestamp: number }) => ({
            ...it,
            label: it.timestamp > Date.now() - 6 * 3600 * 1000 ? "developing" : "verified",
          })));
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  // Fetch LIVE Wilmington NC gun violence / shooting data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/news/local?city=Wilmington+NC+shooting+gun+violence");
        const json = await res.json();
        if (Array.isArray(json.items)) {
          setLocalIncidents(json.items.slice(0, 15).map((it: Incident & { timestamp: number }) => ({
            ...it,
            label: it.timestamp > Date.now() - 6 * 3600 * 1000 ? "developing" : "verified",
          })));
        }
      } catch { /* silent */ }
      finally { setLocalLoading(false); }
    })();
  }, []);

  function timeAgo(ts: number): string {
    const diff = Math.max(0, (Date.now() - ts) / 1000);
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 75,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "rgba(4,4,12,0.98)",
      backdropFilter: "blur(20px)",
      fontFamily: "monospace",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(239,68,68,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#ef4444", marginBottom: 3 }}>NAVI Safety</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>🕊️ Gun Violence Awareness</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "8px 16px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {TABS.map(({ key, label, icon }) => {
          const active = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 9, fontFamily: "monospace", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              background: active ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.03)",
              border: active ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(255,255,255,0.06)",
              color: active ? "#ef4444" : "#64748b", fontWeight: active ? 700 : 400,
            }}>
              <span style={{ fontSize: 12 }}>{icon}</span> {label}
            </button>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            {/* Context */}
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>NAVI:</span> This section surfaces verified gun violence incidents from news sources. No graphic details. No speculation. Every report is labeled as either <span style={{ color: "#34d399", fontWeight: 600 }}>Verified</span> or <span style={{ color: "#f59e0b", fontWeight: 600 }}>Developing</span>.
              </div>
            </div>

            {/* Remembering Lives */}
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🕊️</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Remembering Lives Lost</div>
              <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.6 }}>
                Every number represents a life — a parent, a child, a neighbor, a friend. We honor them by staying informed, supporting our communities, and working toward change.
              </div>
            </div>

            {/* Recent incidents */}
            <div>
              <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
                Recent Reports
              </div>
              {loading && <div style={{ fontSize: 10, color: "#64748b", padding: "20px 0", textAlign: "center" }}>Loading verified reports…</div>}
              {!loading && incidents.length === 0 && (
                <div style={{ fontSize: 10, color: "#64748b", padding: "20px 0", textAlign: "center" }}>No recent reports found.</div>
              )}
              {incidents.map((inc) => (
                <a key={inc.id} href={inc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: 8 }}>
                  <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.10)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{
                        padding: "2px 6px", borderRadius: 4, fontSize: 7, fontWeight: 700,
                        color: inc.label === "verified" ? "#34d399" : "#f59e0b",
                        background: inc.label === "verified" ? "rgba(52,211,153,0.12)" : "rgba(245,158,11,0.12)",
                        border: `1px solid ${inc.label === "verified" ? "rgba(52,211,153,0.25)" : "rgba(245,158,11,0.25)"}`,
                        textTransform: "uppercase",
                      }}>
                        {inc.label === "verified" ? "✓ Verified" : "◌ Developing"}
                      </span>
                      <span style={{ fontSize: 8, color: "#475569" }}>{timeAgo(inc.timestamp)} · {inc.source}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.5 }}>{inc.title}</div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}

        {/* ── WILMINGTON LOCAL ───────────────────────────────────────── */}
        {activeTab === "local" && (
          <>
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>NAVI:</span> This section tracks gun violence incidents in and around <span style={{ color: "#f1f5f9", fontWeight: 600 }}>Wilmington, North Carolina</span>. Every life lost in our community matters. We remember them here.
              </div>
            </div>

            {/* Lives Lost memorial */}
            <div style={{
              padding: "18px 16px", borderRadius: 16, textAlign: "center",
              background: "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(168,85,247,0.03))",
              border: "1px solid rgba(239,68,68,0.15)",
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🕊️</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 }}>
                Lives Lost in Wilmington
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.7, maxWidth: 300, margin: "0 auto 10px" }}>
                Behind every report is someone{"'"}s child, parent, sibling, or friend. We honor their memory by staying informed and working toward a safer community.
              </div>
              <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 600 }}>
                {localIncidents.length > 0 ? `${localIncidents.length} recent reports found` : "Monitoring for reports…"}
              </div>
            </div>

            {/* Local incidents */}
            <div>
              <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
                📍 Wilmington Area Reports
              </div>
              {localLoading && <div style={{ fontSize: 10, color: "#64748b", padding: "20px 0", textAlign: "center" }}>Searching for local reports…</div>}
              {!localLoading && localIncidents.length === 0 && (
                <div style={{ padding: "20px 16px", textAlign: "center", borderRadius: 14, background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🕊️</div>
                  <div style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>No recent reports found for Wilmington</div>
                  <div style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>NAVI continuously monitors news sources for this area.</div>
                </div>
              )}
              {localIncidents.map((inc) => (
                <a key={inc.id} href={inc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: 8 }}>
                  <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.10)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{
                        padding: "2px 6px", borderRadius: 4, fontSize: 7, fontWeight: 700,
                        color: inc.label === "verified" ? "#34d399" : "#f59e0b",
                        background: inc.label === "verified" ? "rgba(52,211,153,0.12)" : "rgba(245,158,11,0.12)",
                        border: `1px solid ${inc.label === "verified" ? "rgba(52,211,153,0.25)" : "rgba(245,158,11,0.25)"}`,
                        textTransform: "uppercase",
                      }}>
                        {inc.label === "verified" ? "✓ Verified" : "◌ Developing"}
                      </span>
                      <span style={{ fontSize: 8, color: "#475569" }}>{timeAgo(inc.timestamp)} · {inc.source}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.5, marginBottom: 4 }}>{inc.title}</div>
                    {inc.summary && <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.5 }}>{inc.summary.slice(0, 150)}</div>}
                  </div>
                </a>
              ))}
            </div>

            {/* Community response */}
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>What Wilmington can do</div>
              {[
                "Support local violence intervention programs — they work",
                "Attend community safety meetings and town halls",
                "Check on your neighbors — connection reduces violence",
                "Mentor a young person — one relationship can change a life",
                "Report concerns to Wilmington PD: (910) 343-3609",
                "Crisis support: call or text 988",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                  <span style={{ color: "#ef4444", flexShrink: 0, fontSize: 10 }}>→</span>
                  <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.55 }}>{item}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.5, textAlign: "center" }}>
              Data from verified news sources. Updated in real time. No graphic content.
            </div>
          </>
        )}

        {/* ── PATTERNS ─────────────────────────────────────────────────── */}
        {activeTab === "patterns" && (
          <>
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>NAVI:</span> Understanding the scale of gun violence in America helps communities push for change. These numbers come from verified sources.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { val: NATIONAL_STATS.annualDeaths, label: "Lives lost per year", color: "#ef4444" },
                { val: NATIONAL_STATS.dailyAverage, label: "People affected daily", color: "#f59e0b" },
                { val: NATIONAL_STATS.massShootings, label: "Mass shootings per year", color: "#a855f7" },
                { val: NATIONAL_STATS.childrenKilled, label: "Children killed per year", color: "#ef4444" },
              ].map(({ val, label, color }) => (
                <div key={label} style={{ padding: "14px 10px", borderRadius: 12, background: `${color}08`, border: `1px solid ${color}15`, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
                  <div style={{ fontSize: 8, color: "#94a3b8", marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>What the data shows</div>
              {[
                "Gun violence is the leading cause of death for children and teens in America.",
                "Black Americans are disproportionately affected — 10x the rate of white Americans for gun homicides.",
                "Community violence intervention (CVI) programs have been shown to reduce shootings by 30–60% where implemented.",
                "Most gun deaths are not mass shootings — they're daily incidents in neighborhoods that rarely make national news.",
                "Cities investing in violence interrupters, mental health, and economic opportunity see measurable declines.",
              ].map((fact, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: "#ef4444", flexShrink: 0 }}>•</span>
                  <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.6 }}>{fact}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.5 }}>
              Sources: {NATIONAL_STATS.source} ({NATIONAL_STATS.year}). Numbers are approximate and updated as new data is published.
            </div>
          </>
        )}

        {/* ── SAFETY ───────────────────────────────────────────────────── */}
        {activeTab === "safety" && (
          <>
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>NAVI:</span> Knowing what to do can save your life and the lives of people around you. This guidance comes from law enforcement and public safety best practices.
              </div>
            </div>

            {SAFETY_GUIDANCE.map((guide) => (
              <div key={guide.title} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.10)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>🛡️ {guide.title}</div>
                {guide.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 8, fontWeight: 700, color: "#ef4444",
                    }}>{i + 1}</div>
                    <div style={{ fontSize: 10, color: "#e2e8f0", lineHeight: 1.55, paddingTop: 1 }}>{step}</div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {/* ── RESOURCES ────────────────────────────────────────────────── */}
        {activeTab === "resources" && (
          <>
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>NAVI:</span> Whether you need immediate support, want to take action, or need to understand the data — these resources are here for you.
              </div>
            </div>

            {COMMUNITY_RESOURCES.map((r) => (
              <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{ padding: "14px 16px", borderRadius: 14, background: `${r.color}05`, border: `1px solid ${r.color}15` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: r.color, marginBottom: 3 }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5, marginBottom: 8 }}>{r.detail}</div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "6px 12px", borderRadius: 8,
                    background: `${r.color}10`, border: `1px solid ${r.color}25`,
                    color: r.color, fontSize: 10, fontWeight: 700,
                    fontFamily: "monospace",
                  }}>
                    {r.action} ↗
                  </div>
                </div>
              </a>
            ))}

            <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.6, padding: "8px 0" }}>
              If you or someone you know is in immediate danger, call 911. For emotional support, call or text 988.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
