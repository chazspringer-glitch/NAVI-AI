"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NaviOrb from "./NaviOrb";

// ── Color palette ─────────────────────────────────────────────────────────────
const AMBER      = "#f59e0b";
const AMBER_DIM  = "rgba(245,158,11,0.15)";
const AMBER_GLOW = "rgba(245,158,11,0.28)";

// ── Program type metadata ─────────────────────────────────────────────────────
const PROGRAM_META = {
  sports:     { label: "Youth Sports",     icon: "⚽", color: "#34d399" },
  arts:       { label: "Arts & Creativity", icon: "🎨", color: "#f472b6" },
  stem:       { label: "STEM & Tech",       icon: "🔬", color: "#60a5fa" },
  tutoring:   { label: "Tutoring & Edu",    icon: "📚", color: "#a78bfa" },
  community:  { label: "Community Center",  icon: "🏡", color: "#fb923c" },
  outdoor:    { label: "Outdoor & Nature",  icon: "🌿", color: "#4ade80" },
  free_meals: { label: "Free Meals",        icon: "🍽️",  color: "#fbbf24" },
};

// ── Question definitions ──────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id:          "location",
    text:        "What's your ZIP code or city?",
    placeholder: "e.g. Atlanta, GA or 30301",
    hint:        "📍 I'll find programs near you",
  },
  {
    id:          "age",
    text:        "How old is your child?",
    placeholder: "e.g. 8, or 10–13",
    hint:        "I'll match programs to their age group",
  },
  {
    id:          "interests",
    text:        "What are they into? Sports, arts, STEM, music, coding, dance…?",
    placeholder: "e.g. soccer and art",
    hint:        "You can list more than one!",
  },
  {
    id:          "budget",
    text:        "What's your budget for programs?",
    placeholder: "Free only, low-cost, or flexible",
    hint:        null,
    quickPicks:  ["Free only", "Low-cost is OK", "Flexible"],
  },
];

// ── Quick-reverse-geocode via Nominatim (no API key needed) ───────────────────
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const city  = data.address?.city  || data.address?.town  || data.address?.village || "";
    const state = data.address?.state || "";
    const zip   = data.address?.postcode || "";
    return zip ? `${zip}` : city && state ? `${city}, ${state}` : "your area";
  } catch {
    return "your area";
  }
}

// ── Program card ──────────────────────────────────────────────────────────────
function ProgramCard({ program }) {
  const meta = PROGRAM_META[program.type] ?? { label: program.type ?? "Program", icon: "🌟", color: "#94a3b8" };

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      background: "rgba(255,255,255,0.025)",
      border: `1px solid ${meta.color}30`,
      animation: "stemFadeUp 0.35s ease forwards",
    }}>
      {/* Color accent bar */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${meta.color}, transparent)` }} />

      <div style={{ padding: "13px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: "bold", color: "#f1f5f9", lineHeight: 1.4 }}>
              {program.name}
            </div>
            {program.organization && program.organization !== program.name && (
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", marginTop: 2 }}>
                {program.organization}
              </div>
            )}
          </div>
          {/* Type badge */}
          <span style={{
            flexShrink: 0,
            fontSize: 9, fontFamily: "monospace", padding: "3px 8px",
            borderRadius: 99,
            background: `${meta.color}15`,
            border: `1px solid ${meta.color}38`,
            color: meta.color, letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}>
            {meta.icon} {meta.label}
          </span>
        </div>

        {/* Meta row: location + age + cost */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {program.location && (
            <MetaPill icon="📍" text={program.location} />
          )}
          {program.ageRange && (
            <MetaPill icon="👧" text={program.ageRange} />
          )}
          {program.cost && (
            <MetaPill
              icon={program.cost.toLowerCase().startsWith("free") ? "💚" : "💛"}
              text={program.cost}
              highlight={program.cost.toLowerCase().startsWith("free")}
            />
          )}
        </div>

        {/* Description */}
        <p style={{
          fontSize: 11, fontFamily: "monospace", color: "#94a3b8",
          lineHeight: 1.65, margin: 0,
        }}>
          {program.description}
        </p>

        {/* Contact / link */}
        {(program.contact || program.url) && (
          <div style={{
            padding: "8px 10px", borderRadius: 10,
            background: `${meta.color}0c`,
            border: `1px solid ${meta.color}22`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          }}>
            {program.contact && (
              <span style={{ fontSize: 10, fontFamily: "monospace", color: meta.color, flex: 1 }}>
                📞 {program.contact}
              </span>
            )}
            {program.url && (
              <a
                href={program.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 10, fontFamily: "monospace", color: meta.color,
                  textDecoration: "none", letterSpacing: "0.04em",
                  flexShrink: 0,
                }}
              >
                Visit site →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaPill({ icon, text, highlight }) {
  return (
    <span style={{
      fontSize: 9, fontFamily: "monospace",
      padding: "3px 7px", borderRadius: 99,
      background: highlight ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${highlight ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}`,
      color: highlight ? "#34d399" : "#64748b",
    }}>
      {icon} {text}
    </span>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 16, padding: "14px",
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", gap: 10,
      animation: "pulse 1.5s ease infinite",
    }}>
      <div style={{ height: 12, width: "60%", borderRadius: 6, background: "rgba(255,255,255,0.07)" }} />
      <div style={{ height: 10, width: "80%", borderRadius: 6, background: "rgba(255,255,255,0.05)" }} />
      <div style={{ height: 10, width: "70%", borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
      <div style={{ height: 32, width: "100%", borderRadius: 10, background: "rgba(255,255,255,0.04)" }} />
    </div>
  );
}

// ── NAVI chat bubble ──────────────────────────────────────────────────────────
function NaviBubble({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, animation: "stemFadeUp 0.3s ease forwards" }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <NaviOrb size={22} />
      </div>
      <div style={{
        maxWidth: "86%", padding: "10px 13px",
        borderRadius: "4px 14px 14px 14px",
        background: "linear-gradient(135deg, rgba(20,16,10,0.95), rgba(12,10,6,0.95))",
        border: "1px solid rgba(245,158,11,0.18)",
        fontSize: 11, fontFamily: "monospace", color: "#cbd5e1",
        lineHeight: 1.7, whiteSpace: "pre-wrap",
        boxShadow: "0 0 10px rgba(245,158,11,0.06)",
      }}>
        {text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
          i % 2 === 1
            ? <strong key={i} style={{ color: AMBER }}>{part}</strong>
            : <span key={i}>{part}</span>
        )}
      </div>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", animation: "stemFadeUp 0.2s ease forwards" }}>
      <div style={{
        maxWidth: "80%", padding: "10px 13px",
        borderRadius: "14px 4px 14px 14px",
        background: "rgba(245,158,11,0.10)",
        border: "1px solid rgba(245,158,11,0.26)",
        fontSize: 11, fontFamily: "monospace", color: "#f1f5f9", lineHeight: 1.65,
      }}>
        {text}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FamilySupportFinder({ onClose }) {
  // "welcome" | "locating" | "questions" | "loading" | "results" | "error"
  const [phase,       setPhase]       = useState("welcome");
  const [messages,    setMessages]    = useState([]);
  const [naviTyping,  setNaviTyping]  = useState(false);
  const [stepIndex,   setStepIndex]   = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [inputVal,    setInputVal]    = useState("");
  const [programs,    setPrograms]    = useState([]);
  const [searchLabel, setSearchLabel] = useState("");
  const [error,       setError]       = useState("");
  const [locating,    setLocating]    = useState(false);

  const scrollRef    = useRef(null);
  const inputRef     = useRef(null);
  const phaseRef     = useRef("welcome");
  const answersRef   = useRef({});

  useEffect(() => { phaseRef.current  = phase;   }, [phase]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, naviTyping, phase, programs]);

  // ── Show a NAVI bubble with typing delay ──────────────────────────────────
  const showNaviBubble = useCallback((text, id) => {
    return new Promise((resolve) => {
      setNaviTyping(true);
      setTimeout(() => {
        setNaviTyping(false);
        setMessages((prev) => [...prev, { role: "navi", text, id: id ?? `n-${Date.now()}` }]);
        resolve();
      }, 580);
    });
  }, []);

  // ── Ask a question ────────────────────────────────────────────────────────
  const askQuestion = useCallback(async (idx) => {
    setStepIndex(idx);
    await showNaviBubble(QUESTIONS[idx].text, `q-${idx}`);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [showNaviBubble]);

  // ── Start question flow ───────────────────────────────────────────────────
  const startQuestions = useCallback(async () => {
    setPhase("questions");
    await showNaviBubble(
      "Great! I'll ask you a few quick questions to find the best match for your child. 💛",
      "questions-intro"
    );
    await askQuestion(0);
  }, [showNaviBubble, askQuestion]);

  // ── Welcome message on mount ──────────────────────────────────────────────
  useEffect(() => {
    showNaviBubble(
      "Let's find opportunities for your child! 💛\n\nI can help you discover free and low-cost programs right in your community — sports, arts, STEM, tutoring, and more.",
      "welcome"
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch programs ────────────────────────────────────────────────────────
  const fetchPrograms = useCallback(async (location, opts = {}) => {
    setPhase("loading");
    setError("");

    try {
      const res = await fetch("/api/family-programs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          location,
          childAge:  opts.age      || undefined,
          interests: opts.interests || undefined,
          budget:    opts.budget    || undefined,
          quickMode: opts.quickMode || false,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to load programs.");

      setPrograms(data.programs ?? []);
      setSearchLabel(location);
      setPhase("results");

      // NAVI result message
      const count = (data.programs ?? []).length;
      setMessages((prev) => [...prev, {
        role: "navi",
        text: count > 0
          ? `I found **${count} programs** near ${location}! 🌟 Scroll down to explore them.`
          : `I didn't find specific programs for that area, but try searching online for "${location} youth programs" — there's often more than you'd expect!`,
        id: "results-msg",
      }]);
    } catch (err) {
      setError(err?.message ?? "Something went wrong.");
      setPhase("error");
    }
  }, []);

  // ── Quick Find via GPS ────────────────────────────────────────────────────
  const handleQuickFind = useCallback(() => {
    if (!navigator.geolocation) {
      startQuestions();
      return;
    }

    setLocating(true);
    setMessages((prev) => [...prev, {
      role: "navi",
      text: "📍 One moment — finding your location…",
      id: "locating",
    }]);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const location = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
        setMessages((prev) => [...prev, {
          role: "navi",
          text: `Got it — searching near **${location}** now! 🔍`,
          id: "location-found",
        }]);
        await fetchPrograms(location, { quickMode: true });
      },
      () => {
        // Permission denied or error — fall back to questions
        setLocating(false);
        setMessages((prev) => [...prev, {
          role: "navi",
          text: "No worries — I'll ask for your ZIP code instead.",
          id: "location-denied",
        }]);
        setTimeout(() => startQuestions(), 600);
      },
      { timeout: 8000 }
    );
  }, [fetchPrograms, startQuestions]);

  // ── Handle answer submission ──────────────────────────────────────────────
  const handleSend = useCallback(async (overrideVal) => {
    const val = (overrideVal ?? inputVal).trim();
    if (!val || phaseRef.current !== "questions" || naviTyping) return;

    const idx      = stepIndex;
    const question = QUESTIONS[idx];

    // Record answer
    const newAnswers = { ...answersRef.current, [question.id]: val };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);

    // Show user bubble
    setMessages((prev) => [...prev, { role: "user", text: val, id: `a-${idx}` }]);
    setInputVal("");

    const nextIdx = idx + 1;

    if (nextIdx < QUESTIONS.length) {
      await askQuestion(nextIdx);
    } else {
      // All questions answered
      await showNaviBubble(
        "Perfect! Let me find programs that match. This will just take a moment… 🔍",
        "searching-msg"
      );
      await fetchPrograms(newAnswers.location, {
        age:       newAnswers.age,
        interests: newAnswers.interests,
        budget:    newAnswers.budget,
      });
    }
  }, [inputVal, stepIndex, naviTyping, askQuestion, showNaviBubble, fetchPrograms]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const currentQuestion = QUESTIONS[stepIndex];
  const showInput = phase === "questions" && !naviTyping;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{
        background: "rgba(8,8,15,0.97)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        animation: "overlayIn 0.3s ease forwards",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px 12px",
        borderBottom: "1px solid rgba(245,158,11,0.12)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 22,
            filter: "drop-shadow(0 0 8px rgba(245,158,11,0.4))",
          }}>💛</span>
          <div>
            <div style={{
              fontSize: 12, fontFamily: "monospace", fontWeight: "bold",
              color: AMBER, letterSpacing: "0.06em",
            }}>
              Family Support Finder
            </div>
            <div style={{
              fontSize: 9, fontFamily: "monospace", color: "#475569",
              letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1,
            }}>
              NAVI · Free &amp; Low-Cost Programs for Kids
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: 8, cursor: "pointer",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#64748b", fontSize: 14, fontFamily: "monospace",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: "auto",
          padding: "16px 18px",
          display: "flex", flexDirection: "column", gap: 12,
          scrollbarWidth: "none",
        }}
      >
        {/* Conversation messages */}
        {messages.map((msg) =>
          msg.role === "navi"
            ? <NaviBubble key={msg.id} text={msg.text} />
            : <UserBubble key={msg.id} text={msg.text} />
        )}

        {/* Typing indicator */}
        {naviTyping && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, animation: "stemFadeUp 0.25s ease forwards" }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              <NaviOrb size={22} />
            </div>
            <div style={{
              padding: "10px 14px", borderRadius: "4px 14px 14px 14px",
              background: "linear-gradient(135deg, rgba(20,16,10,0.95), rgba(12,10,6,0.95))",
              border: "1px solid rgba(245,158,11,0.15)",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: AMBER, opacity: 0.6,
                  animation: `stemDotPulse 1.1s ease ${i * 0.22}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Welcome action buttons */}
        {phase === "welcome" && !naviTyping && messages.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4, animation: "stemFadeUp 0.4s ease 0.2s forwards", opacity: 0 }}>
            {/* Quick Find */}
            <button
              onClick={handleQuickFind}
              disabled={locating}
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 14, cursor: "pointer",
                background: `linear-gradient(135deg, ${AMBER}, #d97706)`,
                border: "none",
                color: "#0a0608", fontFamily: "monospace", fontSize: 13,
                fontWeight: "bold", letterSpacing: "0.05em",
                boxShadow: `0 4px 20px ${AMBER_GLOW}`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s ease",
                opacity: locating ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!locating) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
            >
              {locating ? (
                <>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #0a0608", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                  Locating you…
                </>
              ) : (
                <>⚡ Quick Find Near Me</>
              )}
            </button>

            {/* Manual flow */}
            <button
              onClick={startQuestions}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 14, cursor: "pointer",
                background: AMBER_DIM,
                border: `1px solid rgba(245,158,11,0.3)`,
                color: AMBER, fontFamily: "monospace", fontSize: 12,
                letterSpacing: "0.04em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.22)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = AMBER_DIM; }}
            >
              🔍 Help me find the right fit
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {phase === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "stemFadeUp 0.3s ease forwards" }}>
            <div style={{
              fontSize: 9, fontFamily: "monospace", color: "#475569",
              letterSpacing: "0.18em", textTransform: "uppercase",
              animation: "pulse 1.5s ease infinite",
            }}>
              Searching for programs…
            </div>
            {[0, 1, 2, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error state */}
        {phase === "error" && (
          <div style={{
            padding: "12px 14px", borderRadius: 12,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.22)",
            fontSize: 11, fontFamily: "monospace", color: "#fca5a5",
            lineHeight: 1.6,
            animation: "stemFadeUp 0.3s ease forwards",
          }}>
            ⚠️ {error || "Something went wrong."}<br />
            <button
              onClick={() => {
                setPhase("welcome");
                setMessages([]);
                setAnswers({});
                setStepIndex(0);
                setTimeout(() => showNaviBubble("Let's try again! 💛\n\nWhat area should I search in?", "retry"), 200);
              }}
              style={{
                marginTop: 8, fontSize: 11, fontFamily: "monospace",
                color: "#f87171", cursor: "pointer", background: "none",
                border: "none", padding: 0, textDecoration: "underline",
              }}
            >
              Try again →
            </button>
          </div>
        )}

        {/* Results */}
        {phase === "results" && programs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "stemFadeUp 0.4s ease forwards" }}>
            {/* Count header */}
            <div style={{
              fontSize: 9, fontFamily: "monospace", color: "#475569",
              letterSpacing: "0.18em", textTransform: "uppercase",
            }}>
              {programs.length} programs found near {searchLabel}
            </div>

            {/* Program cards */}
            {programs.map((p, i) => (
              <ProgramCard key={i} program={p} />
            ))}

            {/* Safety note */}
            <div style={{
              padding: "12px 14px", borderRadius: 12,
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.18)",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", lineHeight: 1.65 }}>
                <strong style={{ color: AMBER, display: "block", marginBottom: 2 }}>
                  Always verify program details before enrolling.
                </strong>
                These results are AI-generated suggestions based on programs commonly found in your area. Contact each program directly to confirm availability, costs, schedules, and eligibility.
              </div>
            </div>

            {/* Search again */}
            <button
              onClick={() => {
                setPhase("welcome");
                setMessages([]);
                setAnswers({});
                setStepIndex(0);
                setTimeout(() => showNaviBubble("Let's do another search! 💛\n\nWhere would you like to look?", "restart"), 200);
              }}
              style={{
                width: "100%", padding: "11px", borderRadius: 12, cursor: "pointer",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#64748b", fontFamily: "monospace", fontSize: 11,
                letterSpacing: "0.04em", transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.25)"; e.currentTarget.style.color = AMBER; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#64748b"; }}
            >
              🔄 Search Again
            </button>

            <div style={{ minHeight: 16 }} />
          </div>
        )}

        {/* Empty results */}
        {phase === "results" && programs.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", animation: "stemFadeUp 0.4s ease forwards" }}>
            <span style={{ fontSize: 32 }}>🔍</span>
            <p style={{ fontSize: 11, fontFamily: "monospace", color: "#475569", marginTop: 12, lineHeight: 1.65 }}>
              No programs found for that search. Try a different area or broader interests.
            </p>
          </div>
        )}

        <div style={{ height: 1 }} />
      </div>

      {/* ── Input area (only during questions phase) ── */}
      {(phase === "questions") && (
        <div style={{
          padding: "12px 18px 22px",
          borderTop: "1px solid rgba(245,158,11,0.10)",
          background: "rgba(8,8,15,0.97)",
          flexShrink: 0,
        }}>
          {/* Quick picks for budget question */}
          {currentQuestion?.quickPicks && !naviTyping && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {currentQuestion.quickPicks.map((pick) => (
                <button
                  key={pick}
                  onClick={() => handleSend(pick)}
                  style={{
                    padding: "6px 12px", borderRadius: 99, cursor: "pointer",
                    background: AMBER_DIM,
                    border: `1px solid rgba(245,158,11,0.28)`,
                    color: AMBER, fontSize: 10, fontFamily: "monospace",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.22)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = AMBER_DIM; }}
                >
                  {pick}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <input
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={(!naviTyping && currentQuestion?.placeholder) ? currentQuestion.placeholder : ""}
              disabled={naviTyping}
              style={{
                flex: 1, padding: "10px 12px",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${inputVal.trim() ? "rgba(245,158,11,0.38)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10,
                color: "#e2e8f0", fontSize: 12, fontFamily: "monospace",
                outline: "none", transition: "border-color 0.2s",
                opacity: naviTyping ? 0.45 : 1,
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputVal.trim() || naviTyping}
              style={{
                width: 42, height: 42, borderRadius: 10, cursor: "pointer",
                background: (inputVal.trim() && !naviTyping)
                  ? `linear-gradient(135deg, ${AMBER}, #d97706)`
                  : AMBER_DIM,
                border: "none",
                color: (inputVal.trim() && !naviTyping) ? "#0a0608" : "rgba(245,158,11,0.35)",
                fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease", flexShrink: 0,
              }}
            >
              →
            </button>
          </div>

          {/* Hint text */}
          {!naviTyping && currentQuestion?.hint && (
            <div style={{
              fontSize: 8, fontFamily: "monospace", color: "#334155",
              marginTop: 6, letterSpacing: "0.06em",
            }}>
              {currentQuestion.hint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
