"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NaviOrb from "./NaviOrb";

// ── Theme ─────────────────────────────────────────────────────────────────────
const PRI      = "#a78bfa";           // violet
const PRI_DIM  = "rgba(167,139,250,0.16)";
const PRI_GLOW = "rgba(167,139,250,0.28)";
const SEC      = "#f472b6";           // pink accent

// ── Questions ─────────────────────────────────────────────────────────────────
const QUESTIONS = [
  "What's your business name?",
  "What's the best email address to send your logos to?",
  "Do you have a tagline or slogan? (Type 'skip' if not)",
  "What industry are you in? (e.g., fashion, tech, food, fitness, finance, real estate)",
  "What logo style do you prefer?\n\n  • Modern — clean geometry, sharp edges\n  • Luxury — elegant, premium, refined\n  • Bold — strong, high-contrast, impactful\n  • Minimal — simple, whitespace-focused",
  "What colors do you want in your logo? (e.g., navy and gold, black and white, earth tones, vibrant purple)",
  "Any specific symbols, icons, or imagery? (e.g., a crown, leaf, lightning bolt — or type 'none')",
  "Describe the overall vibe of your brand in a few words (e.g., sleek and powerful, fun and energetic, premium and exclusive)",
];

const STYLE_CHIPS = ["Modern", "Luxury", "Bold", "Minimal"];

// Indices at which to show quick-pick chips
const CHIP_QUESTIONS = {
  4: STYLE_CHIPS,
};

function buildIntro() {
  return `I'm going to help you create your custom logo! I'll ask you ${QUESTIONS.length} quick questions about your brand, then generate professional logo designs just for you.\n\nReady? Let's build something great. 🎨`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadImage(url, filename) {
  try {
    const res  = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href, download: filename });
    a.click();
    URL.revokeObjectURL(href);
  } catch {
    // CORS fallback — open in new tab so user can right-click → Save
    window.open(url, "_blank");
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NaviBubble({ text }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      animation: "stemFadeUp 0.3s ease forwards",
    }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <NaviOrb size={22} />
      </div>
      <div style={{
        maxWidth: "86%",
        padding: "10px 13px",
        borderRadius: "4px 14px 14px 14px",
        background: "linear-gradient(135deg, rgba(18,10,28,0.97), rgba(12,8,22,0.97))",
        border: "1px solid rgba(167,139,250,0.20)",
        fontSize: 11, fontFamily: "monospace", color: "#cbd5e1",
        lineHeight: 1.7, whiteSpace: "pre-wrap",
        boxShadow: "0 0 12px rgba(167,139,250,0.06)",
      }}>
        {text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
          i % 2 === 1
            ? <strong key={i} style={{ color: PRI }}>{part}</strong>
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
        maxWidth: "80%",
        padding: "10px 13px",
        borderRadius: "14px 4px 14px 14px",
        background: "rgba(167,139,250,0.10)",
        border: "1px solid rgba(167,139,250,0.28)",
        fontSize: 11, fontFamily: "monospace", color: "#f1f5f9", lineHeight: 1.65,
      }}>
        {text}
      </div>
    </div>
  );
}

function GeneratingState() {
  const STEPS = [
    { label: "Analyzing your brand...",         delay: 0    },
    { label: "Crafting design variations...",   delay: 3000 },
    { label: "Rendering your logos...",         delay: 8000 },
    { label: "Applying final polish...",        delay: 16000 },
  ];

  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const timers = STEPS.slice(1).map((s, i) =>
      setTimeout(() => setStepIdx(i + 1), s.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 16, padding: "32px 0",
      animation: "stemFadeUp 0.4s ease forwards",
    }}>
      {/* Animated orb */}
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `2px solid ${PRI}`,
          borderTopColor: "transparent",
          animation: "spin 1.0s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: 8, borderRadius: "50%",
          border: `1px solid ${SEC}`,
          borderBottomColor: "transparent",
          animation: "spin 1.6s linear infinite reverse",
        }} />
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>
          🎨
        </div>
      </div>

      {/* Step label */}
      <div style={{
        fontSize: 11, fontFamily: "monospace", color: PRI,
        letterSpacing: "0.10em", textAlign: "center",
        animation: "stemFadeUp 0.3s ease forwards",
        key: stepIdx,
      }}>
        {STEPS[stepIdx]?.label}
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: i <= stepIdx ? PRI : "rgba(167,139,250,0.18)",
            transition: "background 0.4s ease",
          }} />
        ))}
      </div>

      <div style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", letterSpacing: "0.06em" }}>
        This may take up to 30 seconds
      </div>
    </div>
  );
}

function LogoCard({ logo, businessName, index }) {
  const [downloading, setDownloading] = useState(false);
  const filename = `${businessName.replace(/\s+/g, "-").toLowerCase()}-logo-v${index + 1}.png`;

  const handleDownload = async () => {
    if (!logo?.url) return;
    setDownloading(true);
    await downloadImage(logo.url, filename);
    setDownloading(false);
  };

  return (
    <div style={{
      borderRadius: 18,
      background: "linear-gradient(160deg, rgba(18,10,28,0.98), rgba(10,8,20,0.98))",
      border: "1px solid rgba(167,139,250,0.22)",
      overflow: "hidden",
      animation: "stemFadeUp 0.5s ease forwards",
      boxShadow: "0 0 28px rgba(167,139,250,0.08)",
    }}>
      {/* Image */}
      <div style={{
        width: "100%", aspectRatio: "1 / 1",
        background: "#ffffff",
        position: "relative", overflow: "hidden",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo?.url ?? ""}
          alt={`Logo variation ${index + 1} for ${businessName}`}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>

      {/* Caption + actions */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{
          fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em",
          textTransform: "uppercase", color: PRI, opacity: 0.7, marginBottom: 4,
        }}>
          Variation {index + 1}
        </div>
        <div style={{
          fontSize: 11, fontFamily: "monospace", fontWeight: "bold",
          color: "#f1f5f9", marginBottom: 10,
        }}>
          {logo?.description ?? "Logo Design"}
        </div>

        {/* Buttons row */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              flex: 1, padding: "9px 4px", borderRadius: 9, cursor: "pointer",
              background: downloading ? PRI_DIM : `linear-gradient(135deg, ${PRI}, #7c3aed)`,
              border: "none",
              color: downloading ? PRI : "#0a0a18",
              fontSize: 11, fontFamily: "monospace", fontWeight: "bold",
              transition: "all 0.2s ease",
              opacity: downloading ? 0.7 : 1,
            }}
          >
            {downloading ? "Saving…" : "⬇ Download"}
          </button>
          <button
            onClick={() => logo?.url && window.open(logo.url, "_blank")}
            style={{
              padding: "9px 12px", borderRadius: 9, cursor: "pointer",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748b", fontSize: 11, fontFamily: "monospace",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(167,139,250,0.30)"; e.currentTarget.style.color = PRI; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#64748b"; }}
          >
            ↗ Open
          </button>
        </div>
      </div>
    </div>
  );
}

function LogoResults({ logos, businessName, emailSent, clientEmailSent, clientEmail, onRestart }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "stemFadeUp 0.5s ease forwards" }}>

      {/* Success banner */}
      <div style={{
        textAlign: "center", padding: "12px 0 6px",
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>🎨</div>
        <div style={{
          fontSize: 13, fontFamily: "monospace", fontWeight: "bold",
          color: PRI, letterSpacing: "0.05em",
        }}>
          Your Logos Are Ready!
        </div>
        <div style={{
          fontSize: 9, fontFamily: "monospace", color: "#475569",
          marginTop: 4, lineHeight: 1.65,
        }}>
          {logos.length} design{logos.length !== 1 ? "s" : ""} generated for {businessName}
        </div>
      </div>

      {/* Email status badges */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
        {emailSent && (
          <span style={{
            fontSize: 9, fontFamily: "monospace", padding: "3px 9px",
            borderRadius: 99,
            background: "rgba(74,222,128,0.10)",
            border: "1px solid rgba(74,222,128,0.28)",
            color: "#4ade80",
          }}>
            ✓ Sent to Springer Industries
          </span>
        )}
        {clientEmailSent && clientEmail && (
          <span style={{
            fontSize: 9, fontFamily: "monospace", padding: "3px 9px",
            borderRadius: 99,
            background: "rgba(167,139,250,0.10)",
            border: "1px solid rgba(167,139,250,0.28)",
            color: PRI,
          }}>
            ✓ Copy sent to {clientEmail}
          </span>
        )}
      </div>

      {/* Expiry warning */}
      <div style={{
        padding: "9px 12px", borderRadius: 10,
        background: "rgba(245,158,11,0.07)",
        border: "1px solid rgba(245,158,11,0.22)",
      }}>
        <p style={{ fontSize: 10, fontFamily: "monospace", color: "#fbbf24", lineHeight: 1.65, margin: 0 }}>
          ⚠ Download your logos now — these image links expire in approximately 1 hour.
        </p>
      </div>

      {/* Logo cards */}
      {Array.isArray(logos) && logos.map((logo, i) => (
        <LogoCard key={i} logo={logo} businessName={businessName} index={i} />
      ))}

      {/* Start over */}
      <button
        onClick={onRestart}
        style={{
          width: "100%", padding: "11px", borderRadius: 12, cursor: "pointer",
          background: "rgba(167,139,250,0.06)",
          border: "1px solid rgba(167,139,250,0.18)",
          color: "rgba(167,139,250,0.6)", fontFamily: "monospace", fontSize: 11,
          letterSpacing: "0.06em", transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(167,139,250,0.12)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.35)"; e.currentTarget.style.color = PRI; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(167,139,250,0.06)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.18)"; e.currentTarget.style.color = "rgba(167,139,250,0.6)"; }}
      >
        🔄 Generate New Logos
      </button>

      <div style={{ minHeight: 12 }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LogoGeneratorPanel({ service, onClose, speakFn, handsFree, onRegisterVoiceHandler }) {
  const [phase,      setPhase]      = useState("chat");  // chat | generating | done | error
  const [stepIndex,  setStepIndex]  = useState(-1);
  const [answers,    setAnswers]    = useState(() => Array(QUESTIONS.length).fill(""));
  const [inputVal,   setInputVal]   = useState("");
  const [messages,   setMessages]   = useState([]);
  const [naviTyping, setNaviTyping] = useState(false);
  const [logos,      setLogos]      = useState([]);
  const [emailSent,       setEmailSent]       = useState(false);
  const [clientEmailSent, setClientEmailSent] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState("");

  const scrollRef      = useRef(null);
  const inputRef       = useRef(null);
  const answersRef     = useRef(answers);
  const phaseRef       = useRef("chat");
  const handleSendRef  = useRef(null); // stable ref for voice handler
  const handsFreeRef   = useRef(handsFree);
  const speakFnRef     = useRef(speakFn);

  useEffect(() => { answersRef.current  = answers;    }, [answers]);
  useEffect(() => { phaseRef.current    = phase;      }, [phase]);
  useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);
  useEffect(() => { speakFnRef.current  = speakFn;    }, [speakFn]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, naviTyping, phase]);

  // Keep handleSendRef current; register voice handler for hands-free input
  useEffect(() => { handleSendRef.current = handleSend; }); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!onRegisterVoiceHandler) return;
    onRegisterVoiceHandler((text) => {
      if (handleSendRef.current) handleSendRef.current(text);
    });
    return () => { onRegisterVoiceHandler(null); };
  }, [onRegisterVoiceHandler]);

  // ── Show NAVI bubble with typing delay ────────────────────────────────────
  const showNaviBubble = useCallback((text, id) => {
    return new Promise((resolve) => {
      setNaviTyping(true);
      setTimeout(() => {
        setNaviTyping(false);
        setMessages((prev) => [...prev, { role: "navi", text, id: id ?? `n-${Date.now()}` }]);
        resolve(undefined);
      }, 600);
    });
  }, []);

  // ── Ask question by index ─────────────────────────────────────────────────
  const askQuestion = useCallback(async (idx) => {
    setStepIndex(idx);
    await showNaviBubble(QUESTIONS[idx], `q-${idx}`);
    if (handsFreeRef.current && speakFnRef.current) speakFnRef.current(QUESTIONS[idx]);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [showNaviBubble]);

  // ── Mount: show intro then Q1 ─────────────────────────────────────────────
  useEffect(() => {
    console.log("[Work With Us] Loading service: Logo Generator");
    let cancelled = false;
    (async () => {
      try {
        await showNaviBubble(buildIntro(), "intro");
        if (!cancelled) {
          await askQuestion(0);
          console.log("[Work With Us] Service initialized successfully");
        }
      } catch (err) {
        console.error("Service error: Logo Generator", err);
        if (!cancelled) setPhase("error");
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate logos via API ────────────────────────────────────────────────
  const generateLogos = useCallback(async (finalAnswers) => {
    setPhase("generating");

    const safeAnswers = Array.isArray(finalAnswers) ? finalAnswers : [];
    const [businessName, clientEmail, tagline, industry, style, colors, symbols, vibe] = safeAnswers;

    try {
      const res = await fetch("/api/generate-logo", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName || "My Business",
          clientEmail:  clientEmail  || "",
          tagline:      tagline      || "",
          industry:     industry     || "business",
          style:        style        || "modern",
          colors:       colors       || "black and white",
          symbols:      symbols      || "none",
          vibe:         vibe         || "professional",
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error ?? `API ${res.status}`);
      if (!Array.isArray(data.logos) || !data.logos.length) throw new Error("No logos were generated. Please try again.");

      setLogos(data.logos.filter(Boolean));
      setEmailSent(!!data.emailSent);
      setClientEmailSent(!!data.clientEmailSent);
      setPhase("done");
      if (handsFreeRef.current && speakFnRef.current) {
        speakFnRef.current("Your logos are ready! I've sent them to your email. You can download them below or open them in a new tab.");
      }
    } catch (err) {
      console.error("Service error: Logo Generator", err);
      setErrorMsg(err?.message ?? "Something went wrong generating your logos.");
      setPhase("error");
    }
  }, []);

  // ── Handle user sending an answer ─────────────────────────────────────────
  const handleSend = useCallback(async (overrideVal) => {
    // Type-guard: overrideVal must be a string — prevent MouseEvent or undefined being stringified
    const safeOverride = typeof overrideVal === "string" ? overrideVal : undefined;
    const val = (safeOverride ?? inputVal).trim();
    if (!val || phaseRef.current !== "chat" || naviTyping || stepIndex < 0) return;

    const idx = stepIndex;

    const next = [...answersRef.current];
    next[idx]          = val;
    answersRef.current = next;
    setAnswers(next);

    setMessages((prev) => [...prev, { role: "user", text: val, id: `a-${idx}` }]);
    setInputVal("");

    const nextIdx = idx + 1;

    if (nextIdx < QUESTIONS.length) {
      await askQuestion(nextIdx);
    } else {
      setStepIndex(QUESTIONS.length);
      await showNaviBubble(
        "Perfect — I have everything I need! Now sit tight while I create your custom logo designs… This usually takes about 20–30 seconds. 🎨",
        "generating-msg"
      );
      generateLogos(next);
    }
  }, [inputVal, naviTyping, stepIndex, askQuestion, showNaviBubble, generateLogos]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleRestart = useCallback(() => {
    setPhase("chat");
    setStepIndex(-1);
    setAnswers(Array(QUESTIONS.length).fill(""));
    setInputVal("");
    setMessages([]);
    setLogos([]);
    setEmailSent(false);
    setClientEmailSent(false);
    setErrorMsg("");

    let cancelled = false;
    (async () => {
      await showNaviBubble(buildIntro(), "intro-restart");
      if (!cancelled) await askQuestion(0);
    })();

    return () => { cancelled = true; };
  }, [askQuestion, showNaviBubble]);

  const progress = stepIndex < 0 ? 0 : Math.min(stepIndex / QUESTIONS.length, 1);
  const chips = CHIP_QUESTIONS[stepIndex] ?? [];

  const businessName = answers[0] || "Your Business";
  const clientEmail  = answers[1] || "";

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      zIndex: 49,
      height: "85vh",
      background: "rgba(8,6,20,0.97)",
      backdropFilter: "blur(22px)",
      WebkitBackdropFilter: "blur(22px)",
      borderRadius: "22px 22px 0 0",
      border: "1px solid rgba(167,139,250,0.18)",
      borderBottom: "none",
      display: "flex", flexDirection: "column",
      animation: "overlayIn 0.32s cubic-bezier(0.32,0.72,0,1) forwards",
    }}>
      {/* ── Drag handle ── */}
      <div style={{
        width: 36, height: 4, borderRadius: 2,
        background: "rgba(255,255,255,0.14)",
        margin: "12px auto 0", flexShrink: 0,
      }} />

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 20px 0", flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            width: 30, height: 30, borderRadius: 8, cursor: "pointer",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#64748b", fontSize: 14, fontFamily: "monospace",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >←</button>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 12, fontFamily: "monospace", fontWeight: "bold",
            color: PRI, letterSpacing: "0.04em",
          }}>
            🎨 Logo Generator
          </div>
          <div style={{
            fontSize: 9, fontFamily: "monospace", color: "#475569",
            letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1,
          }}>
            NAVI AI Design Studio
          </div>
        </div>

        {stepIndex >= 0 && stepIndex < QUESTIONS.length && (
          <div style={{
            fontSize: 9, fontFamily: "monospace",
            color: "rgba(167,139,250,0.5)", letterSpacing: "0.08em",
          }}>
            {stepIndex + 1}&thinsp;/&thinsp;{QUESTIONS.length}
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={{ padding: "10px 20px 4px", flexShrink: 0 }}>
        <div style={{ height: 2, background: PRI_DIM, borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: `linear-gradient(90deg, ${PRI}, ${SEC})`,
            width: `${Math.round(progress * 100)}%`,
            transition: "width 0.5s ease",
            boxShadow: `0 0 6px ${PRI_GLOW}`,
          }} />
        </div>
      </div>

      {/* ── Conversation (scrollable) ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: "auto",
          padding: "12px 20px",
          display: "flex", flexDirection: "column", gap: 10,
          scrollbarWidth: "none",
        }}
      >
        {messages.map((msg) =>
          msg.role === "navi"
            ? <NaviBubble key={msg.id} text={msg.text} />
            : <UserBubble key={msg.id} text={msg.text} />
        )}

        {/* Typing indicator */}
        {naviTyping && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, animation: "stemFadeUp 0.25s ease forwards" }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}><NaviOrb size={22} /></div>
            <div style={{
              padding: "10px 14px", borderRadius: "4px 14px 14px 14px",
              background: "linear-gradient(135deg, rgba(18,10,28,0.97), rgba(12,8,22,0.97))",
              border: "1px solid rgba(167,139,250,0.18)",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: PRI, opacity: 0.6,
                  animation: `stemDotPulse 1.1s ease ${i * 0.22}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Generating animation */}
        {phase === "generating" && <GeneratingState />}

        {/* Logo results */}
        {phase === "done" && logos.length > 0 && (
          <LogoResults
            logos={logos}
            businessName={businessName}
            emailSent={emailSent}
            clientEmailSent={clientEmailSent}
            clientEmail={clientEmail}
            onRestart={handleRestart}
          />
        )}

        {/* Error state */}
        {phase === "error" && (
          <div style={{
            padding: "20px 16px", borderRadius: 14,
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.22)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            animation: "stemFadeUp 0.4s ease forwards",
          }}>
            <div style={{ fontSize: 22 }}>⚠️</div>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: "#fca5a5", lineHeight: 1.65, textAlign: "center" }}>
              {errorMsg || "This feature is temporarily unavailable. Please try again."}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleRestart}
                style={{
                  padding: "9px 18px", borderRadius: 9, cursor: "pointer",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.30)",
                  color: "#f87171", fontSize: 11, fontFamily: "monospace",
                }}
              >
                🔄 Try Again
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: "9px 18px", borderRadius: 9, cursor: "pointer",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748b", fontSize: 11, fontFamily: "monospace",
                }}
              >
                ← Close
              </button>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div style={{ height: 1 }} />
      </div>

      {/* ── Input ── (only in chat phase) */}
      {phase === "chat" && (
        <div style={{
          padding: "10px 20px 22px",
          borderTop: "1px solid rgba(167,139,250,0.10)",
          background: "rgba(8,6,20,0.97)",
          flexShrink: 0,
        }}>
          {/* Quick-pick chips for style question */}
          {chips.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  disabled={naviTyping || stepIndex < 0}
                  style={{
                    padding: "5px 11px", borderRadius: 99, cursor: "pointer",
                    background: "rgba(167,139,250,0.10)",
                    border: "1px solid rgba(167,139,250,0.28)",
                    color: PRI, fontSize: 10, fontFamily: "monospace",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(167,139,250,0.22)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(167,139,250,0.10)"; }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={stepIndex >= 0 ? "Type your answer…" : ""}
              disabled={naviTyping || stepIndex < 0}
              rows={2}
              style={{
                flex: 1, padding: "10px 12px",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${inputVal.trim() ? "rgba(167,139,250,0.38)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10,
                color: "#e2e8f0", fontSize: 12, fontFamily: "monospace",
                resize: "none", outline: "none",
                transition: "border-color 0.2s",
                opacity: (naviTyping || stepIndex < 0) ? 0.45 : 1,
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputVal.trim() || naviTyping || stepIndex < 0}
              style={{
                width: 42, height: 42, borderRadius: 10, cursor: "pointer",
                background: (inputVal.trim() && !naviTyping)
                  ? `linear-gradient(135deg, ${PRI}, #7c3aed)`
                  : PRI_DIM,
                border: "none",
                color: (inputVal.trim() && !naviTyping) ? "#0a0a18" : "rgba(167,139,250,0.35)",
                fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease", flexShrink: 0,
              }}
            >
              →
            </button>
          </div>
          <div style={{
            fontSize: 8, fontFamily: "monospace", color: "#1e293b",
            textAlign: "center", marginTop: 6, letterSpacing: "0.06em",
          }}>
            Enter to send &nbsp;·&nbsp; Shift+Enter for new line
          </div>
        </div>
      )}
    </div>
  );
}
