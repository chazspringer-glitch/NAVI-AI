"use client";

import { useState } from "react";
import NaviOrb from "./NaviOrb";

// ── Brand tokens ──────────────────────────────────────────────────────────────

const VIOLET      = "#a855f7";
const VIOLET_DIM  = "rgba(168,85,247,0.09)";
const VIOLET_GLOW = "rgba(168,85,247,0.22)";
const PINK        = "#f472b6";
const PINK_GLOW   = "rgba(244,114,182,0.14)";

// ── Static content ────────────────────────────────────────────────────────────

const BENEFITS = [
  "Podcast featured inside the NAVI app",
  "Increased exposure to NAVI's growing community",
  "AI-powered promotion and content support",
  "Creator growth resources and strategy support",
  "Full access to the NAVI creator ecosystem",
];

const QUESTIONS = [
  {
    field:       "podcastName",
    label:       "Podcast Name",
    naviPrompt:  "Let's start your application.\n\nWhat is the name of your podcast?",
    placeholder: "e.g. The Tech Unfiltered Podcast, Real Talk with Rosa",
  },
  {
    field:       "niche",
    label:       "Niche / Topic",
    naviPrompt:  "Every great podcast has a clear lane.\n\nWhat niche or topic does your podcast cover?",
    placeholder: "e.g. AI & technology, entrepreneurship, Black culture, mental health, finance",
  },
  {
    field:       "targetAudience",
    label:       "Target Audience",
    naviPrompt:  "Who do you make this podcast for?\n\nDescribe your target audience — who they are and what they care about.",
    placeholder: "e.g. Young Black professionals aged 25–40 interested in tech and building wealth",
  },
  {
    field:       "platformLinks",
    label:       "Platform Links",
    naviPrompt:  "Where can we find your podcast?\n\nShare your links — Spotify, Apple Podcasts, YouTube, or anywhere you're live.",
    placeholder: "e.g. spotify.com/show/..., youtube.com/@..., apple.co/...",
  },
  {
    field:       "audienceSize",
    label:       "Audience Size",
    naviPrompt:  "Let's talk numbers.\n\nWhat is your current audience size? Include monthly listeners, subscribers, or followers across platforms.",
    placeholder: "e.g. 2,000 monthly listeners on Spotify, 5,000 YouTube subscribers",
  },
  {
    field:       "goals",
    label:       "Your Goals",
    naviPrompt:  "Tell me where you're headed.\n\nWhat are your goals for your podcast this year?",
    placeholder: "e.g. Reach 10K monthly listeners, land brand deals, grow my email list to 5K",
  },
  {
    field:       "whyPartner",
    label:       "Why NAVI",
    naviPrompt:  "Last question — and it matters.\n\nWhy do you want to partner with NAVI? What do you bring to this ecosystem, and what do you hope to gain?",
    placeholder: "e.g. I want to reach NAVI's community of creators and entrepreneurs...",
  },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function PodcastPanel() {
  const [phase,   setPhase]   = useState("intro"); // "intro"|"form"|"sending"|"done"|"error"
  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState({});
  const [input,   setInput]   = useState("");

  const current        = QUESTIONS[step];
  const isLastQuestion = step === QUESTIONS.length - 1;

  // ── Form navigation ─────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (!input.trim()) return;

    const updated = { ...answers, [current.field]: input.trim() };
    setAnswers(updated);
    setInput("");

    if (!isLastQuestion) {
      setStep(step + 1);
      return;
    }

    // All questions answered — submit
    setPhase("sending");
    try {
      const res = await fetch("/api/podcast-application", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPhase("done");
    } catch (err) {
      console.error("[PodcastPanel] Submission error:", err);
      setPhase("error");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) handleNext();
    }
  };

  const handleBack = () => {
    const prev = step - 1;
    setStep(prev);
    setInput(answers[QUESTIONS[prev].field] || "");
  };

  const resetToIntro = () => {
    setPhase("intro");
    setStep(0);
    setAnswers({});
    setInput("");
  };

  // ── INTRO PHASE ─────────────────────────────────────────────────────────────

  if (phase === "intro") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 16 }}>

        {/* ── Cinematic header card ── */}
        <div style={{
          position: "relative", overflow: "hidden",
          padding: "22px 18px", borderRadius: 18,
          background: "linear-gradient(160deg, rgba(30,14,40,0.98) 0%, rgba(15,10,22,0.98) 100%)",
          border: "1px solid rgba(168,85,247,0.32)",
          boxShadow: `0 0 32px ${VIOLET_GLOW}`,
        }}>
          {/* Glow orbs */}
          <div style={{
            position: "absolute", top: -50, right: -50, width: 220, height: 220,
            borderRadius: "50%", pointerEvents: "none",
            background: "radial-gradient(circle, rgba(168,85,247,0.11) 0%, transparent 70%)",
          }} />
          <div style={{
            position: "absolute", bottom: -40, left: -40, width: 180, height: 180,
            borderRadius: "50%", pointerEvents: "none",
            background: "radial-gradient(circle, rgba(244,114,182,0.07) 0%, transparent 70%)",
          }} />

          {/* Icon + title */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            marginBottom: 16, position: "relative",
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, background: VIOLET_DIM,
              border: "1px solid rgba(168,85,247,0.35)",
              boxShadow: `0 0 18px ${VIOLET_GLOW}`,
            }}>🎙️</div>
            <div>
              <div style={{
                fontSize: 14, fontFamily: "monospace", fontWeight: "bold",
                color: VIOLET, letterSpacing: "0.04em",
              }}>
                NAVI Podcast Network
              </div>
              <div style={{
                fontSize: 9, fontFamily: "monospace", color: "#475569",
                letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2,
              }}>
                Creator Partnership Program
              </div>
            </div>
          </div>

          {/* NAVI bubble 1 */}
          <div style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            marginBottom: 8, position: "relative",
          }}>
            <NaviOrb size={28} />
            <div style={{
              flex: 1, padding: "10px 14px",
              borderRadius: "14px 14px 14px 4px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              fontSize: 11, fontFamily: "monospace",
              color: "#cbd5e1", lineHeight: 1.65,
            }}>
              Welcome to the NAVI Podcast Network.
            </div>
          </div>

          {/* NAVI bubble 2 */}
          <div style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            position: "relative",
          }}>
            <div style={{ width: 28, flexShrink: 0 }} />{/* align with bubble 1 */}
            <div style={{
              flex: 1, padding: "10px 14px",
              borderRadius: "14px 14px 14px 4px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              fontSize: 11, fontFamily: "monospace",
              color: "#cbd5e1", lineHeight: 1.65,
            }}>
              We're offering creators the opportunity to become official partners and have
              their podcast featured inside the NAVI platform.
            </div>
          </div>
        </div>

        {/* ── Benefits card ── */}
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(168,85,247,0.18)",
        }}>
          {/* Card header */}
          <div style={{
            padding: "13px 16px",
            borderBottom: "1px solid rgba(168,85,247,0.1)",
            background: "rgba(168,85,247,0.06)",
          }}>
            <div style={{
              fontSize: 10, fontFamily: "monospace", fontWeight: "bold",
              color: VIOLET, letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              NAVI Podcast Partner Package
            </div>
          </div>

          {/* Benefits list */}
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 11 }}>
            {BENEFITS.map((benefit, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: VIOLET_DIM,
                  border: "1px solid rgba(168,85,247,0.28)",
                }}>
                  <span style={{ fontSize: 9, color: VIOLET, lineHeight: 1 }}>✓</span>
                </div>
                <span style={{
                  fontSize: 11, fontFamily: "monospace",
                  color: "#94a3b8", lineHeight: 1.55,
                }}>
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          {/* Agreement note */}
          <div style={{
            padding: "10px 16px 14px",
            borderTop: "1px solid rgba(168,85,247,0.07)",
          }}>
            <div style={{
              fontSize: 9, fontFamily: "monospace", color: "#334155",
              textAlign: "center", letterSpacing: "0.04em",
            }}>
              Simple month-to-month agreement · No long-term commitment
            </div>
          </div>
        </div>

        {/* ── Apply CTA ── */}
        <button
          onClick={() => setPhase("form")}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, cursor: "pointer",
            background: `linear-gradient(135deg, ${VIOLET}, #9333ea)`,
            border: "none",
            color: "#fff", fontFamily: "monospace", fontSize: 12,
            fontWeight: "bold", letterSpacing: "0.06em",
            boxShadow: `0 4px 22px ${VIOLET_GLOW}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
        >
          🎙️ Apply for Partnership
        </button>

        <div style={{ minHeight: 8 }} />
      </div>
    );
  }

  // ── FORM PHASE ───────────────────────────────────────────────────────────────

  if (phase === "form") {
    const progressPct = `${((step + 1) / QUESTIONS.length) * 100}%`;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 16 }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: 9, fontFamily: "monospace",
            letterSpacing: "0.24em", textTransform: "uppercase", color: "#475569",
          }}>
            Partnership Application
          </span>
          <span style={{ fontSize: 9, fontFamily: "monospace", color: "#334155" }}>
            {step + 1} / {QUESTIONS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 3, borderRadius: 2,
          background: "rgba(255,255,255,0.05)", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 2,
            width: progressPct,
            background: `linear-gradient(90deg, ${VIOLET}, ${PINK})`,
            boxShadow: `0 0 8px ${VIOLET_GLOW}`,
            transition: "width 0.5s ease",
          }} />
        </div>

        {/* NAVI question bubble */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <NaviOrb size={30} />
          <div style={{
            flex: 1, padding: "12px 14px",
            borderRadius: "16px 16px 16px 4px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 12, fontFamily: "monospace",
            color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap",
          }}>
            {current.naviPrompt}
          </div>
        </div>

        {/* Field label badge */}
        <div>
          <span style={{
            fontSize: 9, fontFamily: "monospace",
            letterSpacing: "0.2em", textTransform: "uppercase",
            padding: "3px 8px", borderRadius: 6,
            background: VIOLET_DIM,
            border: "1px solid rgba(168,85,247,0.3)",
            color: VIOLET,
          }}>
            {current.label}
          </span>
        </div>

        {/* Textarea input */}
        <textarea
          key={`podcast-q-${step}`}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={current.placeholder}
          rows={3}
          style={{
            width: "100%", resize: "none",
            fontFamily: "monospace", fontSize: 12,
            color: "#e2e8f0",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: "12px 14px",
            caretColor: VIOLET, lineHeight: 1.6, outline: "none",
          }}
        />

        {/* Navigation row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step > 0 ? (
            <button
              onClick={handleBack}
              style={{
                padding: "7px 12px", borderRadius: 8, cursor: "pointer",
                fontSize: 11, fontFamily: "monospace",
                color: "rgba(100,116,139,0.8)",
                background: "none",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              ← Back
            </button>
          ) : (
            <button
              onClick={resetToIntro}
              style={{
                padding: "7px 12px", borderRadius: 8, cursor: "pointer",
                fontSize: 11, fontFamily: "monospace",
                color: "rgba(100,116,139,0.6)",
                background: "none",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              ← Info
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!input.trim()}
            style={{
              padding: "9px 18px", borderRadius: 10,
              cursor: input.trim() ? "pointer" : "not-allowed",
              fontSize: 12, fontFamily: "monospace", fontWeight: "bold",
              background: input.trim()
                ? "linear-gradient(135deg, rgba(168,85,247,0.22), rgba(244,114,182,0.15))"
                : "rgba(255,255,255,0.04)",
              border: input.trim()
                ? "1px solid rgba(168,85,247,0.5)"
                : "1px solid rgba(255,255,255,0.08)",
              color:     input.trim() ? VIOLET : "#475569",
              boxShadow: input.trim() ? `0 0 14px ${VIOLET_GLOW}` : "none",
              opacity:   input.trim() ? 1 : 0.4,
              transition: "all 0.2s",
            }}
          >
            {isLastQuestion ? "Submit Application 🚀" : "Next →"}
          </button>
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 5, paddingTop: 2 }}>
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              style={{
                height: 5, borderRadius: 3,
                width: i === step ? 14 : 5,
                background:
                  i < step
                    ? VIOLET
                    : i === step
                    ? `linear-gradient(90deg,${VIOLET},${PINK})`
                    : "rgba(255,255,255,0.1)",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

      </div>
    );
  }

  // ── SENDING PHASE ────────────────────────────────────────────────────────────

  if (phase === "sending") {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 18,
        padding: "48px 16px", textAlign: "center",
      }}>
        <div style={{ position: "relative" }}>
          <NaviOrb size={48} />
          <div
            className="animate-ping"
            style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(168,85,247,0.14)",
              animationDuration: "1.4s",
            }}
          />
        </div>
        <div>
          <div style={{
            fontSize: 13, fontFamily: "monospace", fontWeight: "bold",
            color: "#e2e8f0", marginBottom: 6,
          }}>
            Submitting your application…
          </div>
          <div style={{ fontSize: 10, fontFamily: "monospace", color: "#475569" }}>
            Hold tight while I send this over.
          </div>
        </div>
      </div>
    );
  }

  // ── DONE PHASE ───────────────────────────────────────────────────────────────

  if (phase === "done") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 16 }}>

        {/* Success card */}
        <div style={{
          padding: "24px 18px", borderRadius: 18,
          background: "rgba(168,85,247,0.06)",
          border: "1px solid rgba(168,85,247,0.24)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 32 }}>🎙️</span>
          <div style={{
            fontSize: 14, fontFamily: "monospace", fontWeight: "bold",
            color: VIOLET, letterSpacing: "0.04em",
          }}>
            Application Submitted
          </div>

          {/* NAVI confirmation bubble */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", width: "100%" }}>
            <NaviOrb size={28} />
            <div style={{
              flex: 1, padding: "10px 14px",
              borderRadius: "14px 14px 14px 4px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              fontSize: 11, fontFamily: "monospace",
              color: "#cbd5e1", lineHeight: 1.65,
            }}>
              Your application has been submitted. We'll review and reach out shortly.
            </div>
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={resetToIntro}
          style={{
            width: "100%", padding: "12px", borderRadius: 10, cursor: "pointer",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#64748b", fontFamily: "monospace", fontSize: 11,
            letterSpacing: "0.04em",
          }}
        >
          ← Back to Podcast Network
        </button>

        <div style={{ minHeight: 8 }} />
      </div>
    );
  }

  // ── ERROR PHASE ──────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 16,
      padding: "48px 16px", textAlign: "center",
    }}>
      <span style={{ fontSize: 32 }}>⚠️</span>
      <div>
        <div style={{
          fontSize: 13, fontFamily: "monospace", fontWeight: "bold",
          color: "#e2e8f0", marginBottom: 6,
        }}>
          Submission Failed
        </div>
        <div style={{
          fontSize: 11, fontFamily: "monospace", color: "#475569", lineHeight: 1.6,
        }}>
          Something went wrong. Please check your connection and try again.
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        <button
          onClick={() => setPhase("form")}
          style={{
            flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer",
            background: VIOLET_DIM,
            border: "1px solid rgba(168,85,247,0.35)",
            color: VIOLET, fontFamily: "monospace", fontSize: 12, fontWeight: "bold",
          }}
        >
          ↺ Try Again
        </button>
        <button
          onClick={resetToIntro}
          style={{
            flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "#475569", fontFamily: "monospace", fontSize: 12,
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
