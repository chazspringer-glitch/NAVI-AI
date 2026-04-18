"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Legal Navigator — helps users understand their situation, find lawyers,
// and prepare effectively. NOT legal advice.
// ─────────────────────────────────────────────────────────────────────────────

const CASE_TYPES = [
  { id: "family",     label: "Family Law",          icon: "👨‍👩‍👧", examples: "Divorce, custody, child support, adoption" },
  { id: "criminal",   label: "Criminal Defense",    icon: "⚖️",  examples: "Charges, arrests, DUI, probation" },
  { id: "housing",    label: "Housing / Tenant",    icon: "🏠",  examples: "Eviction, landlord disputes, repairs" },
  { id: "employment", label: "Employment",          icon: "💼",  examples: "Wrongful termination, discrimination, wages" },
  { id: "immigration",label: "Immigration",         icon: "🌍",  examples: "Visas, asylum, deportation defense" },
  { id: "personal",   label: "Personal Injury",     icon: "🏥",  examples: "Car accidents, medical malpractice, slip & fall" },
  { id: "consumer",   label: "Consumer / Debt",     icon: "💳",  examples: "Debt collection, fraud, bankruptcy" },
  { id: "civil",      label: "Civil Rights",        icon: "✊",  examples: "Discrimination, police misconduct, voting rights" },
  { id: "business",   label: "Business / Contract", icon: "📊",  examples: "Contracts, LLC, partnerships, disputes" },
  { id: "other",      label: "Other / Not Sure",    icon: "❓",  examples: "I need help figuring out my situation" },
];

const BUDGET_OPTIONS = [
  { id: "free",    label: "Free / Pro Bono",     desc: "Legal aid, nonprofits, pro bono attorneys" },
  { id: "low",     label: "Low Cost",            desc: "Sliding scale, payment plans, legal clinics" },
  { id: "moderate",label: "Moderate",            desc: "Standard rates, flat fees available" },
  { id: "any",     label: "Any Budget",          desc: "Show all options" },
];

type NavTab = "find" | "understand" | "prepare" | "rights";

function buildSearchLinks(caseType: string, location: string, budget: string) {
  const q = encodeURIComponent(`${CASE_TYPES.find((c) => c.id === caseType)?.label ?? "lawyer"} lawyer`);
  const loc = encodeURIComponent(location);
  const links = [
    { label: "Avvo — Lawyer Directory", url: `https://www.avvo.com/find-a-lawyer?q=${q}&loc=${loc}`, desc: "Ratings, reviews, and free Q&A", color: "#00d4ff" },
    { label: "FindLaw — Attorney Search", url: `https://lawyers.findlaw.com/lawyer/practice/${caseType === "criminal" ? "criminal-law" : caseType === "family" ? "family-law" : caseType === "housing" ? "landlord-tenant" : caseType === "employment" ? "employment-law" : "general-practice"}/${loc}`, desc: "Comprehensive lawyer profiles", color: "#34d399" },
    { label: "Justia — Legal Help", url: `https://www.justia.com/lawyers/${caseType === "criminal" ? "criminal-law" : caseType === "family" ? "family-law" : ""}/${loc}`, desc: "Free legal information + directory", color: "#C9A227" },
    { label: "State Bar — Lawyer Lookup", url: `https://www.google.com/search?q=${encodeURIComponent(location + " state bar attorney search")}`, desc: "Official state bar referral service", color: "#a855f7" },
  ];
  if (budget === "free" || budget === "low") {
    links.unshift({
      label: "LegalAid.org — Free Help", url: `https://www.legalaid.org/find-legal-aid?q=${loc}`, desc: "Free legal services for qualifying individuals", color: "#ef4444",
    });
    links.unshift({
      label: "LawHelp.org — Local Resources", url: `https://www.lawhelp.org/find-help/`, desc: "State-by-state free legal help finder", color: "#f59e0b",
    });
  }
  return links;
}

const DISCLAIMER = "This is informational guidance, not legal advice. Always consult a licensed attorney for advice specific to your situation.";

export default function LegalNavigatorPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<NavTab>("find");

  // Find a Lawyer state
  const [caseType, setCaseType] = useState<string>("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [searchResults, setSearchResults] = useState<ReturnType<typeof buildSearchLinks> | null>(null);

  const handleSearch = () => {
    if (!caseType || !location.trim()) return;
    setSearchResults(buildSearchLinks(caseType, location.trim(), budget || "any"));
  };

  const TABS: { key: NavTab; label: string; icon: string }[] = [
    { key: "find",       label: "Find",    icon: "🔍" },
    { key: "understand", label: "Case",    icon: "📋" },
    { key: "prepare",    label: "Prepare", icon: "✅" },
    { key: "rights",     label: "Rights",  icon: "⚖️" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "rgba(4,4,12,0.98)",
      backdropFilter: "blur(20px)",
      fontFamily: "monospace",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(96,165,250,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#60a5fa", marginBottom: 3 }}>NAVI Legal</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>⚖️ Legal Navigator</div>
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
              background: active ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)",
              border: active ? "1px solid rgba(96,165,250,0.35)" : "1px solid rgba(255,255,255,0.06)",
              color: active ? "#60a5fa" : "#64748b", fontWeight: active ? 700 : 400,
            }}>
              <span style={{ fontSize: 12 }}>{icon}</span> {label}
            </button>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── FIND A LAWYER ─────────────────────────────────────────────── */}
        {activeTab === "find" && (
          <>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                <span style={{ color: "#60a5fa", fontWeight: 700 }}>NAVI:</span> Tell me what kind of help you need, where you{"'"}re located, and your budget. I{"'"}ll point you to the right resources.
              </div>
            </div>

            {/* Case type */}
            <div>
              <div style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>What type of case?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {CASE_TYPES.map((ct) => {
                  const active = caseType === ct.id;
                  return (
                    <button key={ct.id} onClick={() => setCaseType(ct.id)} style={{
                      padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                      background: active ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.03)",
                      border: active ? "1px solid rgba(96,165,250,0.40)" : "1px solid rgba(255,255,255,0.06)",
                      color: active ? "#60a5fa" : "#94a3b8",
                      fontFamily: "monospace", fontSize: 10, fontWeight: active ? 700 : 400,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{ fontSize: 14 }}>{ct.icon}</span>
                      <div style={{ textAlign: "left" }}>
                        <div>{ct.label}</div>
                        {active && <div style={{ fontSize: 8, color: "#64748b", marginTop: 1 }}>{ct.examples}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location */}
            <div>
              <div style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>Your location</div>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State (e.g. Wilmington, NC)"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none",
                }}
              />
            </div>

            {/* Budget */}
            <div>
              <div style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>Budget</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {BUDGET_OPTIONS.map((b) => {
                  const active = budget === b.id;
                  return (
                    <button key={b.id} onClick={() => setBudget(b.id)} style={{
                      padding: "10px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                      background: active ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)",
                      border: active ? "1px solid rgba(96,165,250,0.35)" : "1px solid rgba(255,255,255,0.06)",
                      fontFamily: "monospace",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? "#60a5fa" : "#e2e8f0" }}>{b.label}</div>
                      <div style={{ fontSize: 8, color: "#64748b", marginTop: 1 }}>{b.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search button */}
            <button onClick={handleSearch} disabled={!caseType || !location.trim()}
              style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: caseType && location.trim() ? "linear-gradient(135deg, #60a5fa, #3b82f6)" : "rgba(255,255,255,0.04)",
                border: "none",
                color: caseType && location.trim() ? "#08080f" : "#475569",
                fontSize: 13, fontWeight: 700, fontFamily: "monospace",
                cursor: caseType && location.trim() ? "pointer" : "default",
                letterSpacing: "0.04em",
              }}>
              🔍 Find Lawyers
            </button>

            {/* Results */}
            {searchResults && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
                  Results for {CASE_TYPES.find((c) => c.id === caseType)?.label} in {location}
                </div>
                {searchResults.map((r) => (
                  <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{
                      padding: "12px 14px", borderRadius: 12,
                      background: `${r.color}08`, border: `1px solid ${r.color}20`,
                      display: "flex", alignItems: "flex-start", gap: 10,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.label}</div>
                        <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{r.desc}</div>
                      </div>
                      <span style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>↗</span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.6, padding: "8px 0" }}>
              ⚖️ {DISCLAIMER}
            </div>
          </>
        )}

        {/* Placeholder for other tabs — will be added in parts 2-4 */}
        {activeTab === "understand" && (
          <div style={{ textAlign: "center", padding: "40px 0", fontSize: 11, color: "#64748b" }}>Case Understanding — coming next</div>
        )}
        {activeTab === "prepare" && (
          <div style={{ textAlign: "center", padding: "40px 0", fontSize: 11, color: "#64748b" }}>Preparation Tools — coming next</div>
        )}
        {activeTab === "rights" && (
          <div style={{ textAlign: "center", padding: "40px 0", fontSize: 11, color: "#64748b" }}>Know Your Rights — coming next</div>
        )}
      </div>
    </div>
  );
}
