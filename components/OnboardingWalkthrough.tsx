"use client";

import { useState, useEffect, useCallback } from "react";
import NaviOrb from "./NaviOrb";

// ─────────────────────────────────────────────────────────────────────────────
// 9-step first-time user walkthrough. Renders as a full-screen overlay with
// a spotlight cutout, tooltip card, progress dots, Next / Skip controls.
//
// localStorage key "navi-walkthrough-done" gates whether it shows at all.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = "navi-walkthrough-done";

export function hasCompletedWalkthrough(): boolean {
  if (typeof window === "undefined") return true;
  try { return localStorage.getItem(LS_KEY) === "1"; } catch { return true; }
}

export function markWalkthroughDone(): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_KEY, "1"); } catch { /* ignore */ }
}

export function resetWalkthrough(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

// ── Step definitions ────────────────────────────────────────────────────────

interface Step {
  icon:      string;
  title:     string;
  body:      string;
  accent:    string;
  /** Visual position hint for the spotlight circle — percentage from top. */
  spotY:     number;
  /** Spotlight radius (px). 0 = no cutout (full overlay). */
  spotR:     number;
}

const STEPS: Step[] = [
  {
    icon: "👋",
    title: "Welcome to NAVI",
    body: "Your AI-powered life navigator. Jobs, housing, legal help, career training — all from your phone, for free. Let's take a quick tour.",
    accent: "#00d4ff",
    spotY: 50,
    spotR: 0,
  },
  {
    icon: "💬",
    title: "Chat with NAVI",
    body: "The chat bar at the bottom is your starting point. Type or tap the mic to talk. NAVI listens, understands, and takes action.",
    accent: "#00d4ff",
    spotY: 92,
    spotR: 60,
  },
  {
    icon: "📂",
    title: "The Hub Menu",
    body: "Tap the menu icon to open the Hub. Inside you'll find every tool NAVI offers — organized by Business, Life, Learning, and Financial.",
    accent: "#C9A227",
    spotY: 8,
    spotR: 50,
  },
  {
    icon: "🚛",
    title: "Trades Mode",
    body: "Step-by-step career paths for skilled trades — CDL, Electrician, HVAC, and more. Training programs, prep tests, job links, and earnings data.",
    accent: "#f59e0b",
    spotY: 50,
    spotR: 0,
  },
  {
    icon: "🏠",
    title: "Housing Finder",
    body: "Search affordable rentals, Section 8, and homeownership resources by city. NAVI walks you through the application process.",
    accent: "#34d399",
    spotY: 50,
    spotR: 0,
  },
  {
    icon: "📡",
    title: "NAVI Pulse — News Web",
    body: "Real-time news as an interactive web. AI clusters related stories, highlights opportunities in green, and flags safety concerns in red.",
    accent: "#a855f7",
    spotY: 50,
    spotR: 0,
  },
  {
    icon: "🛡️",
    title: "Safety Awareness",
    body: "Inside Pulse, NAVI detects safety-related stories and shows a location-based awareness banner — so you know what's happening near you.",
    accent: "#ef4444",
    spotY: 50,
    spotR: 0,
  },
  {
    icon: "📤",
    title: "Upload & Tools",
    body: "Need a resume? A business plan? A logo? Open the Hub and tap any tool. NAVI's AI builds it with you, step by step.",
    accent: "#00d4ff",
    spotY: 50,
    spotR: 0,
  },
  {
    icon: "🚀",
    title: "You're Ready",
    body: "Start by typing a question in the chat. Or open the Hub and explore. NAVI is here 24/7 — no appointments, no judgment, no cost.",
    accent: "#C9A227",
    spotY: 50,
    spotR: 0,
  },
];

// ── Component ───────────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
}

export default function OnboardingWalkthrough({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const total = STEPS.length;
  const current = STEPS[step];

  // Fade-in on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const finish = useCallback(() => {
    markWalkthroughDone();
    onComplete();
  }, [onComplete]);

  const goNext = useCallback(() => {
    if (step >= total - 1) { finish(); return; }
    setAnimating(true);
    setTimeout(() => { setStep((s) => s + 1); setAnimating(false); }, 200);
  }, [step, total, finish]);

  const goBack = useCallback(() => {
    if (step <= 0) return;
    setAnimating(true);
    setTimeout(() => { setStep((s) => s - 1); setAnimating(false); }, 200);
  }, [step]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.35s ease",
      }}
    >
      {/* Dark overlay with optional spotlight cutout */}
      <svg
        width="100%" height="100%"
        style={{ position: "absolute", inset: 0 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <mask id="spot-mask">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            {current.spotR > 0 && (
              <circle
                cx="50"
                cy={current.spotY}
                r={current.spotR / 6}
                fill="black"
                style={{ transition: "all 0.4s ease" }}
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100" height="100"
          fill="rgba(2,2,10,0.88)"
          mask="url(#spot-mask)"
        />
      </svg>

      {/* Spotlight glow ring */}
      {current.spotR > 0 && (
        <div style={{
          position: "absolute",
          left: "50%", top: `${current.spotY}%`,
          transform: "translate(-50%, -50%)",
          width: current.spotR * 2 + 8,
          height: current.spotR * 2 + 8,
          borderRadius: "50%",
          border: `2px solid ${current.accent}55`,
          boxShadow: `0 0 24px ${current.accent}33`,
          pointerEvents: "none",
          transition: "all 0.4s ease",
        }} />
      )}

      {/* Tooltip card */}
      <div
        style={{
          position: "absolute",
          left: 16, right: 16,
          top: current.spotR > 0 && current.spotY > 60 ? "20%" : "auto",
          bottom: current.spotR > 0 && current.spotY <= 60 ? 80 : current.spotR > 0 ? "auto" : "50%",
          transform: current.spotR === 0 ? "translateY(50%)" : "none",
          opacity: animating ? 0 : 1,
          transition: "opacity 0.2s ease",
          zIndex: 2,
        }}
      >
        <div style={{
          maxWidth: 400, margin: "0 auto",
          padding: "24px 20px 20px",
          borderRadius: 20,
          background: "linear-gradient(160deg, rgba(16,16,28,0.98) 0%, rgba(10,10,20,0.98) 100%)",
          border: `1px solid ${current.accent}35`,
          boxShadow: `0 0 40px ${current.accent}18, 0 12px 40px rgba(0,0,0,0.5)`,
          fontFamily: "monospace",
          textAlign: "center",
        }}>
          {/* Icon / Orb */}
          {step === 0 || step === total - 1 ? (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <NaviOrb size={48} />
            </div>
          ) : (
            <div style={{
              fontSize: 36, marginBottom: 12,
              filter: `drop-shadow(0 0 12px ${current.accent}55)`,
            }}>
              {current.icon}
            </div>
          )}

          {/* Title */}
          <div style={{
            fontSize: 18, fontWeight: 800, color: "#f1f5f9",
            marginBottom: 8, lineHeight: 1.25,
            textShadow: `0 0 16px ${current.accent}22`,
          }}>
            {current.title}
          </div>

          {/* Body */}
          <div style={{
            fontSize: 12, color: "#94a3b8",
            lineHeight: 1.7, marginBottom: 20,
            maxWidth: 320, margin: "0 auto 20px",
          }}>
            {current.body}
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 16 }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? current.accent : "rgba(255,255,255,0.12)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Step counter */}
          <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.14em", marginBottom: 14 }}>
            {step + 1} / {total}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {step > 0 && (
              <button
                onClick={goBack}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#94a3b8", fontSize: 12, fontWeight: 600,
                  fontFamily: "monospace", cursor: "pointer",
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={goNext}
              style={{
                flex: 2, padding: "12px", borderRadius: 10,
                background: `linear-gradient(135deg, ${current.accent}, ${current.accent}cc)`,
                border: "none",
                color: "#08080f", fontSize: 13, fontWeight: 700,
                fontFamily: "monospace", cursor: "pointer",
                boxShadow: `0 0 16px ${current.accent}40`,
                letterSpacing: "0.04em",
              }}
            >
              {step === total - 1 ? "Let's Go →" : "Next"}
            </button>
          </div>

          {/* Skip */}
          {step < total - 1 && (
            <button
              onClick={finish}
              style={{
                marginTop: 12, background: "none", border: "none",
                color: "#475569", fontSize: 10, fontFamily: "monospace",
                cursor: "pointer", letterSpacing: "0.06em",
              }}
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
