"use client";

import { useState, useEffect } from "react";
import NaviOrb from "./NaviOrb";

const PROGRAMS = {
  stem: {
    icon: "🔬",
    title: "STEM Explorer",
    subtitle: "Science · Technology · Engineering · Math",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.5)",
    lines: [
      "Hey! I'm NAVI, your guide through science and technology! 🌟",
      "You'll discover how AI thinks, create things with AI, and even write your first code.",
      "Every lesson you complete unlocks the next — earn XP and build real skills that last!",
    ],
    learn: [
      "How AI works & thinks",
      "Create with AI tools",
      "Intro to coding",
      "Real-world STEM skills",
    ],
    gain: [
      "XP + completion certificate",
      "Future-ready skills",
      "Creative confidence",
    ],
    progression:
      "Complete lessons in order. Finish every module for bonus XP. One step at a time!",
    cta: "Ready to explore? 🚀",
    btn: "Let's go!",
    kids: true,
  },
  ai_skills: {
    icon: "⚡",
    title: "AI Skills Lab",
    subtitle: "Practical · Professional · Profitable",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.5)",
    lines: [
      "Welcome. I'm NAVI — your AI skills coach.",
      "This lab covers prompt engineering, automation, and AI monetization. Skills that pay in the real world.",
      "Every lesson requires a real response from your actual work — not theory. Application.",
    ],
    learn: [
      "AI fundamentals & strategy",
      "Advanced prompt engineering",
      "Automation workflows",
      "AI revenue strategies",
    ],
    gain: [
      "Verified completion certificate",
      "Immediate career advantage",
      "Revenue-ready skills",
    ],
    progression:
      "Work through modules sequentially. Real-world responses unlock each lesson.",
    cta: "Ready to build your AI advantage?",
    btn: "Begin training",
    kids: false,
  },
};

// Line timings (ms)
const LINE_TIMES  = [300, 950, 1600];
const OVERVIEW_AT = 2250;
const CTA_AT      = 2700;

export default function ProgramIntroOverlay({ program, onContinue, onExit }) {
  const d = PROGRAMS[program];
  if (!d) return null;

  const [visibleLines, setVisibleLines] = useState(0);
  const [showOverview, setShowOverview]  = useState(false);
  const [showCta,      setShowCta]       = useState(false);

  useEffect(() => {
    const timers = [
      ...LINE_TIMES.map((t, i) => setTimeout(() => setVisibleLines((v) => Math.max(v, i + 1)), t)),
      setTimeout(() => setShowOverview(true), OVERVIEW_AT),
      setTimeout(() => setShowCta(true),      CTA_AT),
    ];
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", flexDirection: "column",
        background: "rgba(2,2,12,0.97)",
        backdropFilter: "blur(22px)",
        animation: "overlayIn 0.35s ease forwards",
        overflow: "hidden",
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute", top: "5%", left: "50%",
          transform: "translateX(-50%)",
          width: 340, height: 340, borderRadius: "50%",
          background: `radial-gradient(circle, ${d.color}14 0%, transparent 68%)`,
          pointerEvents: "none",
        }}
      />

      {/* Skip button */}
      <button
        onClick={onExit}
        style={{
          position: "absolute", top: 14, right: 14, zIndex: 10,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#475569", fontSize: 10, fontFamily: "monospace",
          padding: "5px 14px", borderRadius: 99, cursor: "pointer",
          letterSpacing: "0.1em",
        }}
      >
        skip →
      </button>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1, overflowY: "auto",
          padding: "48px 20px 24px",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}
      >
        {/* ── Program icon + title ── */}
        <div
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 10, marginBottom: 24,
            animation: "stemZoomIn 0.55s ease forwards",
          }}
        >
          <div style={{ position: "relative", width: 76, height: 76 }}>
            {/* Outer pulse ring */}
            <div
              style={{
                position: "absolute", inset: -14, borderRadius: "50%",
                border: `1px solid ${d.color}28`,
                animation: "micDormantRing 2.8s ease-in-out infinite",
              }}
            />
            {/* Inner pulse ring */}
            <div
              style={{
                position: "absolute", inset: -5, borderRadius: "50%",
                border: `1px solid ${d.color}45`,
                animation: "micDormantRing 2.8s ease-in-out 0.9s infinite",
              }}
            />
            {/* Icon */}
            <div
              style={{
                width: 76, height: 76, borderRadius: "50%",
                background: `radial-gradient(circle at 38% 32%, ${d.color}38 0%, ${d.color}0e 55%, transparent 78%)`,
                border: `2px solid ${d.color}60`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36,
                boxShadow: `0 0 44px ${d.glow}, 0 0 88px ${d.color}18`,
              }}
            >
              {d.icon}
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 20, fontFamily: "monospace", fontWeight: "bold",
                color: d.color, letterSpacing: "0.07em",
                textShadow: `0 0 28px ${d.glow}`,
              }}
            >
              {d.title}
            </div>
            <div
              style={{
                fontSize: 9, fontFamily: "monospace", color: "#334155",
                letterSpacing: "0.22em", marginTop: 3, textTransform: "uppercase",
              }}
            >
              {d.subtitle}
            </div>
          </div>
        </div>

        {/* ── NAVI speech lines ── */}
        <div
          style={{
            width: "100%", maxWidth: 340,
            display: "flex", flexDirection: "column", gap: 8,
            marginBottom: showOverview ? 16 : 0,
          }}
        >
          {d.lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex", gap: 8, alignItems: "flex-start",
                opacity:    i < visibleLines ? 1 : 0,
                transform:  i < visibleLines ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.35s ease, transform 0.35s ease",
              }}
            >
              {/* Show live orb only on the most recent line */}
              {i === visibleLines - 1 ? (
                <div style={{ flexShrink: 0, marginTop: 1 }}>
                  <NaviOrb size={22} />
                </div>
              ) : (
                <div style={{ width: 22, height: 22, flexShrink: 0 }} />
              )}
              <div
                style={{
                  flex: 1, padding: "9px 12px",
                  borderRadius: "12px 12px 12px 3px",
                  background:
                    i === visibleLines - 1 ? `${d.color}10` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${
                    i === visibleLines - 1
                      ? d.color + "28"
                      : "rgba(255,255,255,0.05)"
                  }`,
                  fontSize: 12, fontFamily: "monospace",
                  color: i === visibleLines - 1 ? "#cbd5e1" : "#475569",
                  lineHeight: 1.6,
                  transition: "all 0.4s ease",
                }}
              >
                {line}
              </div>
            </div>
          ))}

          {/* Typing indicator — show while waiting for next line */}
          {visibleLines < d.lines.length && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", paddingLeft: 2 }}>
              <div style={{ flexShrink: 0 }}>
                <NaviOrb size={20} />
              </div>
              <div
                style={{
                  display: "flex", gap: 4, alignItems: "center",
                  padding: "9px 14px", borderRadius: "12px 12px 12px 3px",
                  background: `${d.color}08`,
                  border: `1px solid ${d.color}1e`,
                }}
              >
                <div
                  className="typing-dot"
                  style={{ width: 6, height: 6, borderRadius: "50%", background: d.color }}
                />
                <div
                  className="typing-dot"
                  style={{ width: 6, height: 6, borderRadius: "50%", background: d.color }}
                />
                <div
                  className="typing-dot"
                  style={{ width: 6, height: 6, borderRadius: "50%", background: d.color }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Overview cards ── */}
        {showOverview && (
          <div
            style={{
              width: "100%", maxWidth: 340,
              display: "flex", flexDirection: "column", gap: 8,
              marginBottom: 14,
              animation: "stemFadeUp 0.4s ease forwards",
            }}
          >
            {/* What you'll learn */}
            <div
              style={{
                padding: "10px 12px", borderRadius: 12,
                background: `${d.color}08`, border: `1px solid ${d.color}1e`,
              }}
            >
              <div
                style={{
                  fontSize: 9, fontFamily: "monospace", color: d.color,
                  letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 7,
                }}
              >
                What you'll learn
              </div>
              <div
                style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px",
                }}
              >
                {d.learn.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
                    <span style={{ color: d.color, fontSize: 10, flexShrink: 0, marginTop: 1 }}>
                      ▸
                    </span>
                    <span
                      style={{
                        fontSize: 10, fontFamily: "monospace",
                        color: "#94a3b8", lineHeight: 1.4,
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* What you gain + Progression */}
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  flex: 1, padding: "9px 10px", borderRadius: 12,
                  background: "rgba(52,211,153,0.05)",
                  border: "1px solid rgba(52,211,153,0.15)",
                }}
              >
                <div
                  style={{
                    fontSize: 9, fontFamily: "monospace", color: "#34d399",
                    letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 5,
                  }}
                >
                  You'll gain
                </div>
                {d.gain.map((g, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", gap: 4, alignItems: "flex-start",
                      marginBottom: i < d.gain.length - 1 ? 3 : 0,
                    }}
                  >
                    <span style={{ color: "#34d399", fontSize: 9, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span
                      style={{
                        fontSize: 10, fontFamily: "monospace",
                        color: "#34d399", opacity: 0.85, lineHeight: 1.4,
                      }}
                    >
                      {g}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  flex: 1, padding: "9px 10px", borderRadius: 12,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: 9, fontFamily: "monospace", color: "#475569",
                    letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 5,
                  }}
                >
                  How it works
                </div>
                <div
                  style={{
                    fontSize: 10, fontFamily: "monospace",
                    color: "#64748b", lineHeight: 1.45,
                  }}
                >
                  {d.progression}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Ready? CTA ── */}
        {showCta && (
          <div
            style={{
              width: "100%", maxWidth: 340,
              animation: "stemFadeUp 0.4s ease forwards",
              paddingBottom: 8,
            }}
          >
            {/* NAVI question bubble */}
            <div
              style={{
                display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12,
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <NaviOrb size={22} />
              </div>
              <div
                style={{
                  flex: 1, padding: "9px 12px",
                  borderRadius: "12px 12px 12px 3px",
                  background: `${d.color}12`,
                  border: `1px solid ${d.color}38`,
                  fontSize: 12, fontFamily: "monospace",
                  color: "#f1f5f9", fontWeight: "bold", lineHeight: 1.5,
                }}
              >
                {d.cta}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onExit}
                style={{
                  flex: 1, padding: "11px", borderRadius: 12, cursor: "pointer",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#475569", fontFamily: "monospace", fontSize: 12,
                }}
              >
                Not now
              </button>
              <button
                onClick={onContinue}
                style={{
                  flex: 2, padding: "11px", borderRadius: 12, cursor: "pointer",
                  background: `linear-gradient(135deg, ${d.color}22, ${d.color}0e)`,
                  border: `1px solid ${d.color}55`,
                  color: d.color, fontFamily: "monospace",
                  fontSize: 12, fontWeight: "bold",
                  boxShadow: `0 0 20px ${d.glow}`,
                  letterSpacing: "0.05em",
                }}
              >
                {d.btn} →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
