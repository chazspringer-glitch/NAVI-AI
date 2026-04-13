"use client";

const PAYMENT_LINK = "https://buy.stripe.com/test_cNi00cbVQ56L1LNaFGfUQ00";
const GOLD         = "#f5c842";
const GOLD_GLOW    = "rgba(245,200,66,0.35)";

export default function ProGateOverlay({ feature, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(2,2,12,0.82)",
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 20px",
        animation: "overlayIn 0.25s ease forwards",
      }}
    >
      {/* Card — stop click-through */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 340,
          borderRadius: 22,
          background: "linear-gradient(160deg, rgba(18,14,32,0.98) 0%, rgba(28,20,50,0.98) 100%)",
          border: "1px solid rgba(245,200,66,0.3)",
          boxShadow: `0 0 40px ${GOLD_GLOW}, 0 24px 48px rgba(0,0,0,0.6)`,
          padding: "28px 22px 22px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#475569", borderRadius: 8, width: 28, height: 28,
            cursor: "pointer", fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ✕
        </button>

        {/* Lock icon */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "radial-gradient(circle at 38% 32%, rgba(245,200,66,0.20) 0%, rgba(245,200,66,0.04) 60%, transparent 80%)",
          border: "1px solid rgba(245,200,66,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28,
          boxShadow: `0 0 28px ${GOLD_GLOW}`,
        }}>
          🔒
        </div>

        {/* Headline */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 15, fontFamily: "monospace", fontWeight: "bold",
            color: "#f1f5f9", letterSpacing: "0.04em", marginBottom: 6,
          }}>
            {feature} is a PRO feature
          </div>
          <div style={{
            fontSize: 11, fontFamily: "monospace", color: "#64748b",
            lineHeight: 1.6,
          }}>
            Unlock NAVI PRO to access this program and all premium features.
          </div>
        </div>

        {/* PRO badge */}
        <div style={{
          padding: "3px 14px", borderRadius: 99,
          background: `linear-gradient(90deg, ${GOLD}, #f9a825)`,
          fontSize: 9, fontFamily: "monospace", fontWeight: "bold",
          color: "#0a0a18", letterSpacing: "0.2em",
          boxShadow: `0 0 10px ${GOLD_GLOW}`,
        }}>
          NAVI PRO — $50 / month
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => { window.location.href = PAYMENT_LINK; }}
          style={{
            width: "100%", padding: "13px", borderRadius: 14, cursor: "pointer",
            background: `linear-gradient(135deg, ${GOLD}, #f9a825)`,
            border: "none",
            color: "#0a0a18", fontFamily: "monospace", fontSize: 13,
            fontWeight: "bold", letterSpacing: "0.06em",
            boxShadow: `0 4px 22px ${GOLD_GLOW}`,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
        >
          ⚡ Unlock NAVI PRO
        </button>

        {/* Dismiss */}
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 11, fontFamily: "monospace", color: "#334155",
            padding: "2px 0",
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
