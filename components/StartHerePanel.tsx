"use client";

import { useState, useEffect } from "react";
import NaviOrb from "./NaviOrb";

export type StartHereAction =
  | "chat"
  | "trades"
  | "pulse"
  | "housing"
  | "jobs"
  | "library"
  | "legal"
  | "leaderboard";

const CAPABILITIES = [
  { icon: "💬", title: "AI Conversations", desc: "Ask NAVI anything — jobs, housing, legal help, finances, or just talk.", color: "#00d4ff" },
  { icon: "📡", title: "News Pulse", desc: "Real-time news visualized as nodes. AI clusters, safety awareness, opportunity detection.", color: "#a855f7" },
  { icon: "🚛", title: "Trades Mode", desc: "Step-by-step career paths — CDL, Electrician, HVAC, and more. Training, prep tests, and job links.", color: "#f59e0b" },
  { icon: "🏠", title: "Housing Finder", desc: "Search affordable rentals, Section 8, and homeownership resources by city.", color: "#34d399" },
  { icon: "💼", title: "Job & Resume Tools", desc: "Find jobs on Indeed, LinkedIn, ZipRecruiter. Build a resume. Write a business plan.", color: "#00d4ff" },
  { icon: "⚖️", title: "Legal Rights Guide", desc: "Plain-language legal guidance — know your rights without the jargon.", color: "#60a5fa" },
  { icon: "📚", title: "NAVI Library", desc: "Books by the founder — blueprints for growth, family, and freedom.", color: "#C9A227" },
  { icon: "🏆", title: "XP & Leaderboard", desc: "Earn XP by chatting, using tools, and completing missions. See where you rank.", color: "#f472b6" },
];

const HOW_TO_STEPS = [
  { num: "1", text: "Tap the chat bar at the bottom to talk to NAVI.", color: "#00d4ff" },
  { num: "2", text: "Open the menu to explore tools — Trades, Housing, Jobs, Pulse, and more.", color: "#34d399" },
  { num: "3", text: "Tap any tool or node for NAVI's AI-powered breakdown and guidance.", color: "#C9A227" },
  { num: "4", text: "Earn XP for every action — chat, voice, tools. Climb the leaderboard.", color: "#a855f7" },
];

const DIFFERENTIATORS = [
  { icon: "🎯", text: "Built for underserved communities — not Silicon Valley" },
  { icon: "🆓", text: "Free to use — no paywall on the things that matter" },
  { icon: "🧠", text: "AI that explains, guides, and takes action with you" },
  { icon: "📍", text: "Location-aware — safety alerts and opportunities near you" },
  { icon: "🤝", text: "Community-backed by real local partners" },
];

interface StartHerePanelProps {
  onClose:  () => void;
  onAction: (action: StartHereAction) => void;
}

export default function StartHerePanel({ onClose, onAction }: StartHerePanelProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);

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
        borderBottom: "1px solid rgba(0,212,255,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NaviOrb size={24} />
          <div>
            <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#00d4ff", marginBottom: 2 }}>NAVI</div>
            <div style={{ fontSize: 14, fontWeight: "bold", color: "#f1f5f9" }}>Start Here</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* ── 1. Quick Intro ─────────────────────────────────────────────── */}
        <div style={{
          textAlign: "center", padding: "24px 16px",
          borderRadius: 18,
          background: "linear-gradient(160deg, rgba(16,16,26,0.98) 0%, rgba(10,10,20,0.98) 100%)",
          border: "1px solid rgba(0,212,255,0.15)",
          boxShadow: "0 0 48px rgba(0,212,255,0.06), 0 12px 40px rgba(0,0,0,0.5)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 700ms ease, transform 700ms ease",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <NaviOrb size={56} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, lineHeight: 1.3, textShadow: "0 0 20px rgba(0,212,255,0.15)" }}>
            Meet NAVI
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, maxWidth: 320, margin: "0 auto" }}>
            Your AI-powered life navigator. NAVI helps you find jobs, housing, legal help, career training, and community resources — all from your phone, for free.
          </div>
        </div>

        {/* ── 2. What NAVI Can Do ─────────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "#00d4ff", fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
            What NAVI Can Do
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CAPABILITIES.map((cap, i) => (
              <div
                key={cap.title}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 14px", borderRadius: 14,
                  background: `${cap.color}06`,
                  border: `1px solid ${cap.color}18`,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(10px)",
                  transition: `opacity 500ms ease ${100 + i * 60}ms, transform 500ms ease ${100 + i * 60}ms`,
                }}
              >
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{cap.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>{cap.title}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.55 }}>{cap.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. How To Use NAVI ──────────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "#34d399", fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
            How To Use NAVI
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {HOW_TO_STEPS.map((step) => (
              <div key={step.num} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: `${step.color}15`, border: `1px solid ${step.color}35`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: step.color,
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.55, paddingTop: 4 }}>
                  {step.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. Interactive Buttons ──────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "#C9A227", fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
            Jump In
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "chat" as const, label: "Talk to NAVI",      icon: "💬", color: "#00d4ff", desc: "Start a conversation" },
              { id: "trades" as const, label: "Explore Trades",  icon: "🚛", color: "#f59e0b", desc: "CDL, Electrician, HVAC & more" },
              { id: "pulse" as const, label: "Open the Pulse",   icon: "📡", color: "#a855f7", desc: "Live news intelligence" },
              { id: "housing" as const, label: "Find Housing",   icon: "🏠", color: "#34d399", desc: "Affordable rentals & programs" },
              { id: "jobs" as const, label: "Find a Job",        icon: "💼", color: "#00d4ff", desc: "Indeed, LinkedIn & more" },
            ].map(({ id, label, icon, color, desc }) => (
              <button
                key={id}
                onClick={() => onAction(id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                  background: `${color}0a`,
                  border: `1px solid ${color}30`,
                  fontFamily: "monospace", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{label}</div>
                  <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{desc}</div>
                </div>
                <span style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 5. What Makes NAVI Different ────────────────────────────────── */}
        <div style={{
          padding: "18px 16px", borderRadius: 16,
          background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(10,10,18,0.95) 100%)",
          border: "1px solid rgba(201,162,39,0.12)",
        }}>
          <div style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "#C9A227", fontWeight: 700, marginBottom: 14, textAlign: "center" }}>
            What Makes NAVI Different
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DIFFERENTIATORS.map((d) => (
              <div key={d.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{d.icon}</span>
                <span style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.45 }}>{d.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Final CTA ──────────────────────────────────────────────────── */}
        <button
          onClick={() => onAction("chat")}
          style={{
            width: "100%", padding: "16px", borderRadius: 14,
            background: "linear-gradient(135deg, #00d4ff, #0891b2)",
            border: "none", color: "#02020a",
            fontSize: 14, fontFamily: "monospace", fontWeight: 700,
            cursor: "pointer", letterSpacing: "0.04em",
            boxShadow: "0 0 24px rgba(0,212,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <NaviOrb size={20} /> Start Using NAVI →
        </button>
      </div>
    </div>
  );
}
