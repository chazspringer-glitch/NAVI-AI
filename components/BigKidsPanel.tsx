"use client";

import { useState } from "react";

const SUBJECTS = [
  { id: "math",     label: "Math",            icon: "🔢", color: "#00d4ff", desc: "Numbers, counting, and puzzles" },
  { id: "reading",  label: "Reading",         icon: "📖", color: "#34d399", desc: "Stories, words, and comprehension" },
  { id: "life",     label: "Life Skills",     icon: "🌟", color: "#f59e0b", desc: "Money, time, and everyday smarts" },
  { id: "problem",  label: "Problem Solving", icon: "🧩", color: "#a855f7", desc: "Logic, patterns, and critical thinking" },
];

export default function BigKidsPanel({ onClose }: { onClose: () => void }) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "linear-gradient(180deg, #0a0a1a 0%, #12122a 100%)",
      fontFamily: "monospace",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(0,212,255,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#00d4ff", marginBottom: 3 }}>Ages 7–12</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>🎮 NAVI Big Kids</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Welcome */}
        {!selectedSubject && (
          <>
            <div style={{
              textAlign: "center", padding: "24px 16px",
              borderRadius: 18,
              background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(168,85,247,0.05))",
              border: "1px solid rgba(0,212,255,0.15)",
            }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>👋</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 }}>
                Hey there, explorer!
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
                Pick a subject to start your quest. Complete challenges to earn XP and level up!
              </div>
            </div>

            {/* Subject cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubject(s.id)}
                  style={{
                    width: "100%", padding: "18px 16px", borderRadius: 16, cursor: "pointer",
                    background: `${s.color}0a`,
                    border: `2px solid ${s.color}30`,
                    display: "flex", alignItems: "center", gap: 14,
                    textAlign: "left", fontFamily: "monospace",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: 14,
                    background: `${s.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, flexShrink: 0,
                  }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{s.desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 16, color: s.color, flexShrink: 0 }}>→</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Subject selected — quest placeholder (Part 2+) */}
        {selectedSubject && (() => {
          const subj = SUBJECTS.find((s) => s.id === selectedSubject)!;
          return (
            <>
              <button onClick={() => setSelectedSubject(null)} style={{
                alignSelf: "flex-start", padding: "6px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#64748b", fontSize: 10, fontFamily: "monospace", cursor: "pointer",
              }}>
                ← Back to subjects
              </button>

              <div style={{
                textAlign: "center", padding: "24px 16px",
                borderRadius: 18,
                background: `${subj.color}08`,
                border: `1px solid ${subj.color}20`,
              }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>{subj.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 }}>
                  {subj.label} Quests
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
                  Ready to learn? Pick a challenge below!
                </div>
              </div>

              {/* Quest cards — will be populated in Parts 2-3 */}
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🚀</div>
                <div style={{ fontSize: 12, color: subj.color, fontWeight: 700 }}>Quests loading soon!</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Interactive {subj.label.toLowerCase()} challenges are on the way.</div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
