"use client";

import NaviOrb from "./NaviOrb";

const ACCENT       = "#10b981";
const ACCENT_DIM   = "rgba(16,185,129,0.18)";
const ACCENT_GLOW  = "rgba(16,185,129,0.22)";
const ACCENT_BORDER = "rgba(16,185,129,0.45)";

const RESOURCE_TYPES = [
  { icon: "🔑", label: "Private Owner Rentals",   color: "#10b981", desc: "Individual landlords — more flexible on credit, deposits, and move-in dates." },
  { icon: "🏛️",  label: "Section 8 / Voucher",    color: "#8b5cf6", desc: "Government pays most of your rent — you pay roughly 30% of your income." },
  { icon: "🤝", label: "Nonprofit Housing",        color: "#06b6d4", desc: "Mission-driven orgs with below-market rent, often no credit checks required." },
  { icon: "⚡",  label: "Emergency Resources",      color: "#f59e0b", desc: "Urgent help — call or text 211 to reach shelter and rental assistance now." },
];

export default function HousingHubPanel({ onClose, onOpenFinder }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(4,8,18,0.97)", backdropFilter: "blur(14px)" }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", flexShrink: 0,
          borderBottom: `1px solid ${ACCENT}28`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT}30, ${ACCENT}10)`,
            border: `1px solid ${ACCENT_BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, boxShadow: `0 0 16px ${ACCENT_GLOW}`,
          }}>🏠</div>
          <div>
            <div style={{
              fontSize: 11, fontFamily: "monospace", fontWeight: "bold",
              color: "#f1f5f9", letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              Housing Mode
            </div>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#475569", letterSpacing: "0.04em" }}>
              Affordable rentals · Section 8 · Nonprofits · Emergency help
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close housing panel"
          style={{
            width: 32, height: 32, borderRadius: 12, flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#64748b", cursor: "pointer", fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✕</button>
      </div>

      {/* ── Top accent line ── */}
      <div style={{ height: 2, flexShrink: 0,
        background: `linear-gradient(90deg, transparent, ${ACCENT}88, transparent)` }} />

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>

        {/* NAVI welcome */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20 }}>
          <NaviOrb size={32} />
          <div style={{
            flex: 1, padding: "12px 14px",
            background: `${ACCENT}08`,
            border: `1px solid ${ACCENT}20`,
            borderRadius: "18px 18px 18px 4px",
            fontSize: 13, fontFamily: "monospace", color: "#cbd5e1", lineHeight: 1.65,
            whiteSpace: "pre-wrap",
          }}>
            {"Let's find something in your price range.\n\nTell me your city or ZIP, your monthly budget, and how many bedrooms you need — or go straight to the search tool below."}
          </div>
        </div>

        {/* ── Primary tool card — Affordable Home Finder ── */}
        <button
          onClick={onOpenFinder}
          style={{
            width: "100%", textAlign: "left",
            background: `linear-gradient(135deg, ${ACCENT}14, ${ACCENT}06)`,
            border: `1px solid ${ACCENT_BORDER}`,
            borderRadius: 18, padding: "18px 18px 16px",
            cursor: "pointer",
            boxShadow: `0 0 24px ${ACCENT_GLOW}, inset 0 0 0 1px ${ACCENT}10`,
            transition: "all 0.22s ease",
            marginBottom: 16,
          }}
        >
          {/* Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{
              fontSize: 10, fontFamily: "monospace", letterSpacing: "0.14em",
              textTransform: "uppercase", padding: "2px 8px", borderRadius: 99,
              background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`, color: ACCENT,
            }}>Available Tool</span>
          </div>

          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: `${ACCENT}18`, border: `1px solid ${ACCENT}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, boxShadow: `0 0 14px ${ACCENT_GLOW}`,
            }}>🏠</div>
            <div>
              <div style={{ fontSize: 15, fontFamily: "monospace", fontWeight: "bold", color: "#f1f5f9", marginBottom: 3 }}>
                Affordable Home Finder
              </div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: ACCENT, opacity: 0.8 }}>
                Search · Browse · Connect
              </div>
            </div>
          </div>

          {/* Description */}
          <p style={{
            margin: "0 0 14px", fontSize: 12, fontFamily: "monospace",
            color: "#94a3b8", lineHeight: 1.65,
          }}>
            Enter your city or ZIP, set your max monthly budget, and choose how many bedrooms you need. See private owner rentals, Section 8 contacts, nonprofits, and emergency resources near you.
          </p>

          {/* Input hints */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {["📍 Location", "💰 Max Budget", "🛏 Bedrooms"].map((hint) => (
              <span key={hint} style={{
                fontSize: 10, fontFamily: "monospace", padding: "3px 9px",
                borderRadius: 99, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", color: "#64748b",
              }}>{hint}</span>
            ))}
          </div>

          {/* CTA */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, padding: "9px 0",
            background: `${ACCENT}20`, border: `1px solid ${ACCENT}50`,
            borderRadius: 12,
            fontSize: 12, fontFamily: "monospace", fontWeight: "bold",
            color: ACCENT, letterSpacing: "0.07em",
            boxShadow: `0 0 12px ${ACCENT_GLOW}`,
          }}>
            <span>🔍</span>
            <span>Open Affordable Home Finder</span>
            <span style={{ opacity: 0.7 }}>→</span>
          </div>
        </button>

        {/* ── Resource type grid ── */}
        <div style={{ marginBottom: 16 }}>
          <p style={{
            margin: "0 0 10px", fontSize: 10, fontFamily: "monospace",
            color: "#334155", letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            What I can help you find
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {RESOURCE_TYPES.map(({ icon, label, color, desc }) => (
              <div key={label} style={{
                background: `${color}08`,
                border: `1px solid ${color}20`,
                borderRadius: 14, padding: "11px 13px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: "bold", color, lineHeight: 1.3 }}>
                    {label}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 10, fontFamily: "monospace", color: "#64748b", lineHeight: 1.55 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 211 callout ── */}
        <div style={{
          background: "rgba(245,158,11,0.07)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 14, padding: "13px 15px",
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>⚡</span>
          <div>
            <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: "bold", color: "#fbbf24", marginBottom: 4 }}>
              Need help now? Call or text 211
            </div>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: "#d97706", lineHeight: 1.6 }}>
              Free national helpline — immediate connections to local emergency housing, shelter, and rental assistance.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
