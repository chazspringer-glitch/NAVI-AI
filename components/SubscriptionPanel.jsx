"use client";

import { useState } from "react";
import NaviOrb from "./NaviOrb";

const PAYMENT_LINK = "https://buy.stripe.com/test_cNi00cbVQ56L1LNaFGfUQ00";

const BENEFITS = [
  { icon: "🎤", text: "Activate NAVI's voice to talk back and guide you" },
  { icon: "🧭", text: "Get step-by-step help with real-life situations" },
  { icon: "🏠", text: "Access powerful tools (housing, business, AI skills)" },
  { icon: "⚡", text: "Faster, smoother experience" },
  { icon: "⭐", text: "Earn more XP and unlock premium rewards" },
  { icon: "💡", text: "Learn how to use AI to improve your life and make money" },
];

const GOLD      = "#f5c842";
const GOLD_DIM  = "rgba(245,200,66,0.18)";
const GOLD_GLOW = "rgba(245,200,66,0.35)";

export default function SubscriptionPanel({ isPro, onActivate }) {
  // true right after user activates PRO manually (drives "welcome back" message)
  const [justActivated, setJustActivated] = useState(false);

  const handleActivate = () => {
    setJustActivated(true);
    onActivate();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>

      {/* ── Welcome-back banner — shown right after activation ── */}
      {justActivated && isPro && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "12px 14px", borderRadius: 14,
          background: "linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(52,211,153,0.03) 100%)",
          border: "1px solid rgba(52,211,153,0.35)",
          boxShadow: "0 0 20px rgba(52,211,153,0.12)",
          animation: "stemFadeUp 0.4s ease forwards",
        }}>
          <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>👋</span>
          <div>
            <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: "bold", color: "#34d399", letterSpacing: "0.04em" }}>
              Welcome back — your NAVI PRO access is ready
            </div>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", marginTop: 3, lineHeight: 1.5 }}>
              Voice and all premium features are now unlocked.
            </div>
          </div>
        </div>
      )}

      {/* ── PRO active banner — shown when already subscribed (not first activation) ── */}
      {isPro && !justActivated && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", borderRadius: 14,
          background: "linear-gradient(135deg, rgba(245,200,66,0.12) 0%, rgba(245,200,66,0.04) 100%)",
          border: "1px solid rgba(245,200,66,0.4)",
          boxShadow: "0 0 22px rgba(245,200,66,0.15)",
          animation: "stemFadeUp 0.4s ease forwards",
        }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: "bold", color: GOLD, letterSpacing: "0.06em" }}>
              NAVI PRO — Active
            </div>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#94a3b8", marginTop: 2 }}>
              All premium features unlocked. Enjoy!
            </div>
          </div>
        </div>
      )}

      {/* ── Plan card ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        padding: "20px 16px 18px",
        borderRadius: 18,
        background: "linear-gradient(160deg, rgba(18,14,32,0.95) 0%, rgba(30,22,52,0.95) 100%)",
        border: `1px solid ${isPro ? "rgba(245,200,66,0.5)" : "rgba(245,200,66,0.28)"}`,
        boxShadow: isPro
          ? `0 0 36px ${GOLD_GLOW}, 0 0 72px rgba(245,200,66,0.10)`
          : `0 0 22px rgba(245,200,66,0.10)`,
      }}>
        {/* Background radial glow */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 160, height: 160, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,200,66,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* PRO badge */}
        <div style={{
          position: "absolute", top: 14, right: 14,
          padding: "3px 10px", borderRadius: 99,
          background: `linear-gradient(90deg, ${GOLD}, #f9a825)`,
          fontSize: 9, fontFamily: "monospace", fontWeight: "bold",
          color: "#0a0a18", letterSpacing: "0.18em",
          boxShadow: `0 0 12px ${GOLD_GLOW}`,
        }}>
          PRO
        </div>

        {/* Plan name + orb */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <NaviOrb size={28} />
          <div>
            <div style={{
              fontSize: 18, fontFamily: "monospace", fontWeight: "bold",
              color: GOLD, letterSpacing: "0.08em",
              textShadow: `0 0 20px ${GOLD_GLOW}`,
            }}>
              NAVI PRO
            </div>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "#64748b", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Premium AI Companion
            </div>
          </div>
        </div>

        {/* Price */}
        <div style={{ margin: "14px 0 4px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 34, fontFamily: "monospace", fontWeight: "bold", color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              $50
            </span>
            <span style={{ fontSize: 13, fontFamily: "monospace", color: "#475569" }}>
              / month
            </span>
          </div>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", letterSpacing: "0.06em", marginTop: 3 }}>
            Billed monthly · Cancel anytime · Recurring charge
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(245,200,66,0.12)", marginBottom: 16 }} />

        {/* Benefits list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{
                flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                background: GOLD_DIM,
                border: "1px solid rgba(245,200,66,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>
                {b.icon}
              </span>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "#cbd5e1", lineHeight: 1.55, paddingTop: 5 }}>
                {b.text}
              </span>
            </div>
          ))}
        </div>

        {/* ── CTA area ── */}
        {!isPro ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Primary — redirect to Stripe payment link */}
            <button
              onClick={() => { window.location.href = PAYMENT_LINK; }}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, cursor: "pointer",
                background: `linear-gradient(135deg, ${GOLD}, #f9a825)`,
                border: "none",
                color: "#0a0a18", fontFamily: "monospace", fontSize: 14,
                fontWeight: "bold", letterSpacing: "0.06em",
                boxShadow: `0 4px 24px ${GOLD_GLOW}, 0 0 48px rgba(245,200,66,0.10)`,
                transition: "all 0.2s ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 6px 30px ${GOLD_GLOW}, 0 0 60px rgba(245,200,66,0.15)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = `0 4px 24px ${GOLD_GLOW}, 0 0 48px rgba(245,200,66,0.10)`;
              }}
            >
              ⚡ Unlock NAVI PRO
            </button>

            {/* Secondary — manual activation after returning from payment */}
            <div style={{
              padding: "10px 12px", borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <p style={{
                margin: "0 0 8px", fontSize: 10, fontFamily: "monospace",
                color: "#475569", lineHeight: 1.5, textAlign: "center",
              }}>
                Already subscribed? Tap below to activate your access.
              </p>
              <button
                onClick={handleActivate}
                style={{
                  width: "100%", padding: "10px", borderRadius: 10, cursor: "pointer",
                  background: "rgba(52,211,153,0.07)",
                  border: "1px solid rgba(52,211,153,0.28)",
                  color: "#34d399", fontFamily: "monospace", fontSize: 12,
                  fontWeight: "bold", letterSpacing: "0.04em",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(52,211,153,0.13)";
                  e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(52,211,153,0.07)";
                  e.currentTarget.style.borderColor = "rgba(52,211,153,0.28)";
                }}
              >
                ✓ I've already subscribed — Activate PRO
              </button>
            </div>

          </div>
        ) : (
          <div style={{
            width: "100%", padding: "13px", borderRadius: 14, textAlign: "center",
            background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)",
            color: "#34d399", fontFamily: "monospace", fontSize: 13, fontWeight: "bold",
            letterSpacing: "0.05em",
          }}>
            ✓ Subscribed — NAVI PRO Active
          </div>
        )}
      </div>

      {/* ── Stripe trust badge ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "8px", borderRadius: 10,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}>
        <svg viewBox="0 0 32 32" style={{ width: 18, height: 18, flexShrink: 0 }}>
          <path d="M0 8C0 3.582 3.582 0 8 0h16c4.418 0 8 3.582 8 8v16c0 4.418-3.582 8-8 8H8c-4.418 0-8-3.582-8-8V8z" fill="#6772E5" />
          <path d="M14.02 13.12c0-.576.473-.8 1.252-.8.848 0 1.92.256 2.768.713v-2.624c-.927-.368-1.84-.512-2.768-.512-2.272 0-3.776 1.184-3.776 3.168 0 3.088 4.256 2.592 4.256 3.92 0 .688-.592.896-1.424.896-1.232 0-2.8-.512-4.032-1.2v2.656c1.376.592 2.752.832 4.032.832 2.336 0 3.936-1.152 3.936-3.168-.016-3.344-4.256-2.736-4.256-3.888h.012z" fill="#fff" />
        </svg>
        <span style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", letterSpacing: "0.08em" }}>
          Secured by Stripe · Cancel anytime · Powered by Springer Industries
        </span>
      </div>

      {/* Legal links */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <a href="/privacy" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", textDecoration: "none", letterSpacing: "0.06em" }}>
          Privacy Policy
        </a>
        <span style={{ fontSize: 9, color: "#1e293b" }}>·</span>
        <a href="/terms" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", textDecoration: "none", letterSpacing: "0.06em" }}>
          Terms of Use
        </a>
      </div>

    </div>
  );
}
