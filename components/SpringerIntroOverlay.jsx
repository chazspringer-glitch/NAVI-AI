"use client";

import { useEffect, useState } from "react";

const GOLD       = "#C9A227";
const GOLD_GLOW  = "rgba(201,162,39,0.45)";
const GOLD_DIM   = "rgba(201,162,39,0.18)";

// Timeline (ms)
const T_LINE1  = 350;   // "Welcome to"
const T_LINE2  = 900;   // "Springer Industries"
const T_LINE3  = 1650;  // tagline
const T_CTA    = 2500;  // enter button appears
const T_AUTO   = 4000;  // auto-advance if user doesn't interact

export default function SpringerIntroOverlay({ onComplete }) {
  const [line1, setLine1]     = useState(false);
  const [line2, setLine2]     = useState(false);
  const [line3, setLine3]     = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handleComplete = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => onComplete(), 520);
  };

  useEffect(() => {
    const timers = [
      setTimeout(() => setLine1(true),    T_LINE1),
      setTimeout(() => setLine2(true),    T_LINE2),
      setTimeout(() => setLine3(true),    T_LINE3),
      setTimeout(() => setShowCta(true),  T_CTA),
      setTimeout(() => handleComplete(),  T_AUTO),
    ];
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      onClick={handleComplete}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "#02020a",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        opacity: exiting ? 0 : 1,
        transition: exiting ? "opacity 0.5s ease" : "none",
        animation: "overlayIn 0.4s ease forwards",
      }}
    >

      {/* ── Ambient light streaks ── */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* Top-left streak */}
        <div style={{
          position: "absolute", top: "-10%", left: "-15%",
          width: "55%", height: "55%",
          background: `radial-gradient(ellipse at 30% 30%, rgba(201,162,39,0.10) 0%, transparent 65%)`,
          animation: "introGlow 4s ease forwards",
        }} />
        {/* Bottom-right streak */}
        <div style={{
          position: "absolute", bottom: "-10%", right: "-15%",
          width: "55%", height: "55%",
          background: `radial-gradient(ellipse at 70% 70%, rgba(201,162,39,0.08) 0%, transparent 65%)`,
          animation: "introGlow 4s ease 0.3s forwards",
        }} />
        {/* Center glow bloom */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 440, height: 440, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(201,162,39,0.12) 0%, transparent 60%)`,
          animation: "introCameraZoom 4s ease forwards",
        }} />
        {/* Horizontal light line */}
        <div style={{
          position: "absolute", top: "50%", left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, rgba(201,162,39,0.18), transparent)`,
          opacity: line2 ? 1 : 0,
          transition: "opacity 0.8s ease",
        }} />
        {/* Particle dots */}
        {[
          { top: "22%", left: "14%", size: 3, delay: "0.6s" },
          { top: "68%", left: "82%", size: 2, delay: "1.0s" },
          { top: "34%", left: "76%", size: 4, delay: "0.3s" },
          { top: "78%", left: "22%", size: 2, delay: "1.3s" },
          { top: "15%", left: "60%", size: 3, delay: "0.8s" },
          { top: "55%", left: "8%",  size: 2, delay: "1.6s" },
        ].map(({ top, left, size, delay }, i) => (
          <div key={i} style={{
            position: "absolute", top, left,
            width: size, height: size, borderRadius: "50%",
            background: GOLD,
            opacity: 0,
            animation: `stemBubblePop 0.5s ease ${delay} forwards`,
            boxShadow: `0 0 ${size * 3}px ${GOLD_GLOW}`,
          }} />
        ))}
      </div>

      {/* ── Content block ── */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 14, padding: "0 28px", zIndex: 1, textAlign: "center",
        maxWidth: 380,
      }}>

        {/* "Welcome to" */}
        <div style={{
          fontSize: 12, fontFamily: "monospace", letterSpacing: "0.32em",
          textTransform: "uppercase", color: "rgba(201,162,39,0.55)",
          opacity: line1 ? 1 : 0,
          transform: line1 ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}>
          Welcome to
        </div>

        {/* "Springer Industries" */}
        <div style={{
          fontSize: 30, fontFamily: "monospace", fontWeight: "bold",
          letterSpacing: "0.06em", color: GOLD,
          textShadow: `0 0 32px ${GOLD_GLOW}, 0 0 64px rgba(201,162,39,0.22)`,
          opacity: line2 ? 1 : 0,
          transform: line2 ? "scale(1) translateY(0)" : "scale(0.88) translateY(8px)",
          transition: "opacity 0.65s cubic-bezier(0.34,1.56,0.64,1), transform 0.65s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          Springer Industries
        </div>

        {/* Divider line */}
        <div style={{
          width: line2 ? 120 : 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          transition: "width 0.8s ease 0.2s",
          boxShadow: `0 0 8px ${GOLD_GLOW}`,
        }} />

        {/* Tagline */}
        <div style={{
          fontSize: 13, fontFamily: "monospace", color: "#64748b",
          lineHeight: 1.7, letterSpacing: "0.02em",
          opacity: line3 ? 1 : 0,
          transform: line3 ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          Where ideas become systems…<br />
          and systems create income.
        </div>

        {/* Enter button */}
        {showCta && (
          <button
            onClick={(e) => { e.stopPropagation(); handleComplete(); }}
            style={{
              marginTop: 8,
              padding: "11px 32px", borderRadius: 12, cursor: "pointer",
              background: `linear-gradient(135deg, rgba(201,162,39,0.20), rgba(201,162,39,0.10))`,
              border: `1px solid rgba(201,162,39,0.45)`,
              color: GOLD, fontFamily: "monospace", fontSize: 12,
              fontWeight: "bold", letterSpacing: "0.1em",
              boxShadow: `0 0 20px rgba(201,162,39,0.20)`,
              animation: "stemFadeUp 0.4s ease forwards",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget).style.background = "rgba(201,162,39,0.28)";
              (e.currentTarget).style.boxShadow = `0 0 28px rgba(201,162,39,0.35)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.background = "linear-gradient(135deg, rgba(201,162,39,0.20), rgba(201,162,39,0.10))";
              (e.currentTarget).style.boxShadow = `0 0 20px rgba(201,162,39,0.20)`;
            }}
          >
            Enter →
          </button>
        )}
      </div>

      {/* Skip hint */}
      <div style={{
        position: "absolute", bottom: "2rem",
        fontSize: 9, fontFamily: "monospace",
        letterSpacing: "0.14em", color: "rgba(255,255,255,0.18)",
        animation: "introSkipHint 4s ease forwards",
        pointerEvents: "none",
      }}>
        tap anywhere to skip
      </div>
    </div>
  );
}
