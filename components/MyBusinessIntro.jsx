"use client";

import { useEffect, useState } from "react";

const GREEN     = "#34d399";
const GREEN_GLOW = "rgba(52,211,153,0.45)";
const CYAN       = "#00d4ff";

const T_LINE1 = 300;
const T_LINE2 = 850;
const T_LINE3 = 1500;
const T_CTA   = 2200;
const T_AUTO  = 3800;

export default function MyBusinessIntro({ onComplete }) {
  const [line1, setLine1]     = useState(false);
  const [line2, setLine2]     = useState(false);
  const [line3, setLine3]     = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handleComplete = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => onComplete(), 480);
  };

  useEffect(() => {
    const timers = [
      setTimeout(() => setLine1(true),   T_LINE1),
      setTimeout(() => setLine2(true),   T_LINE2),
      setTimeout(() => setLine3(true),   T_LINE3),
      setTimeout(() => setShowCta(true), T_CTA),
      setTimeout(() => handleComplete(), T_AUTO),
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
        transition: exiting ? "opacity 0.48s ease" : "none",
        animation: "overlayIn 0.4s ease forwards",
      }}
    >
      {/* Ambient glow */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
          width: 320, height: 320, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 65%)`,
        }} />
        <div style={{
          position: "absolute", bottom: "20%", left: "50%", transform: "translateX(-50%)",
          width: 240, height: 240, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 65%)`,
        }} />
      </div>

      {/* Ring pulse */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 180, height: 180, borderRadius: "50%",
        border: `2px solid rgba(52,211,153,0.12)`,
        animation: line2 ? "evoRing 2.5s ease-out forwards" : "none",
        opacity: line2 ? 1 : 0,
      }} />

      {/* Content */}
      <div style={{ position: "relative", textAlign: "center", maxWidth: 300, padding: "0 20px" }}>
        {/* Icon */}
        <div style={{
          fontSize: 42, marginBottom: 16,
          opacity: line1 ? 1 : 0,
          transform: line1 ? "scale(1)" : "scale(0.5)",
          transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          filter: `drop-shadow(0 0 20px ${GREEN_GLOW})`,
        }}>
          💼
        </div>

        {/* Line 1 */}
        <div style={{
          fontSize: 9, fontFamily: "monospace", letterSpacing: "0.35em",
          textTransform: "uppercase", color: GREEN,
          opacity: line1 ? 1 : 0,
          transform: line1 ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.45s ease",
          marginBottom: 10,
        }}>
          Welcome to
        </div>

        {/* Line 2 */}
        <div style={{
          fontSize: 24, fontFamily: "monospace", fontWeight: 800,
          color: "#f1f5f9", letterSpacing: "0.04em",
          textShadow: `0 0 30px ${GREEN_GLOW}`,
          opacity: line2 ? 1 : 0,
          transform: line2 ? "scale(1) translateY(0)" : "scale(0.85) translateY(10px)",
          transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          marginBottom: 10,
        }}>
          My Business
        </div>

        {/* Line 3 */}
        <div style={{
          fontSize: 11, fontFamily: "monospace", color: "#64748b",
          lineHeight: 1.65,
          opacity: line3 ? 1 : 0,
          transform: line3 ? "translateY(0)" : "translateY(10px)",
          transition: "all 0.45s ease",
          marginBottom: 20,
        }}>
          Your dashboard, content, analytics, and AI tools — all in one place.
        </div>

        {/* CTA */}
        <div style={{
          opacity: showCta ? 1 : 0,
          transform: showCta ? "translateY(0)" : "translateY(8px)",
          transition: "all 0.4s ease",
        }}>
          <div style={{
            display: "inline-block",
            padding: "10px 28px", borderRadius: 12,
            background: `linear-gradient(135deg, ${GREEN}, ${CYAN})`,
            color: "#02020a", fontSize: 12,
            fontFamily: "monospace", fontWeight: 700,
            letterSpacing: "0.08em",
            boxShadow: `0 0 24px ${GREEN_GLOW}`,
          }}>
            Enter Dashboard →
          </div>
          <div style={{
            marginTop: 12, fontSize: 9,
            fontFamily: "monospace", color: "#334155",
            letterSpacing: "0.12em",
          }}>
            tap anywhere to continue
          </div>
        </div>
      </div>
    </div>
  );
}
