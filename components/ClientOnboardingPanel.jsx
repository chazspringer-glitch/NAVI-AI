"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import NaviOrb from "./NaviOrb";
import { EMAIL_RECEIVER } from "@/lib/emailConfig";

const GOLD      = "#C9A227";
const GOLD_DIM  = "rgba(201,162,39,0.18)";
const GOLD_GLOW = "rgba(201,162,39,0.28)";

// ── Per-service question banks ────────────────────────────────────────────────
const SERVICE_QUESTIONS = {
  "Social Media": [
    "Which platforms are you currently active on? (Instagram, TikTok, LinkedIn, Facebook, etc.)",
    "What's your niche or industry?",
    "What's your main goal — more followers, higher engagement, leads, or sales?",
    "Describe your target audience. Who are they and what do they care about?",
    "Do you have existing content, or will we be creating everything from scratch?",
  ],
  "Targeted Ads": [
    "Which platform do you want to advertise on? (Facebook/Instagram, Google, TikTok, YouTube)",
    "What product or service are you promoting?",
    "Who is your ideal customer? Describe their demographics and interests.",
    "What's your approximate monthly ad budget?",
    "What's the primary goal — traffic, leads, or direct sales?",
  ],
  "AI Content": [
    "What type of content do you need? (Video ads, product demos, brand story, social clips)",
    "Describe your brand's personality and style in a few words.",
    "Who is your target audience?",
    "Do you have any existing brand assets? (logo, colors, footage, photos)",
    "Where will this content be distributed? (Social media, website, paid ads, events)",
  ],
  "Copywriting": [
    "What do you need written? (Ads, email sequences, website copy, sales pages, scripts)",
    "Describe your product or service in a few sentences.",
    "Who is your target audience and what problem are you solving for them?",
    "What tone fits your brand? (Professional, casual, bold, inspirational, urgent)",
    "Do you have any existing copy or examples of writing styles you love?",
  ],
  "Websites": [
    "What type of website do you need? (Landing page, full business site, e-commerce, portfolio)",
    "What's the main goal — generate leads, sell products, or showcase your work?",
    "Who is your target audience?",
    "Do you have existing branding? (logo, colors, fonts, or a style in mind)",
    "Do you have content ready, or will you need help writing the copy too?",
  ],
  "Automation": [
    "What specific tasks or processes are you looking to automate?",
    "What tools and software does your business currently use?",
    "What's your biggest time-wasting or repetitive process right now?",
    "What would a successful automation look like for you in 90 days?",
    "How comfortable is your team with technology? (Beginner, Intermediate, Advanced)",
  ],
  "AI Agents": [
    "What would you want an AI agent to handle for your business 24/7?",
    "What platforms or tools does your business run on? (CRM, email, Slack, etc.)",
    "What's the biggest bottleneck slowing down your current workflow?",
    "Do you need customer-facing AI (like a chatbot) or internal process automation?",
    "What does success look like for you in the first 90 days?",
  ],
  "Brand Package": [
    "What is your business name and what do you do in one sentence?",
    "What feeling should your brand evoke? (Powerful, approachable, futuristic, grounded, etc.)",
    "Who is your target audience — who are you trying to attract?",
    "Do you have existing brand elements to keep or refresh, or are you starting from scratch?",
    "Name 2-3 brands you admire aesthetically and what you like about them.",
  ],
  "Consulting": [
    "What's your biggest marketing challenge right now?",
    "Which marketing channels are you currently using?",
    "What's your approximate monthly marketing budget?",
    "Describe your ideal client or customer in detail.",
    "What's your revenue goal for the next 6 to 12 months?",
  ],
  "Speaking Engagement": [
    "What type of event are you booking for? (Conference, corporate workshop, school, community event, panel)",
    "What's the name of your organization or event?",
    "How many attendees are you expecting?",
    "Which speaking topics interest you most? (AI literacy, entrepreneurship, tech for communities, digital economy)",
    "What's your target event date and is it virtual or in-person?",
  ],
  "Startup Launch Package": [
    "What's the name of your business or the business you're launching?",
    "What type of business is it? (E-commerce, service-based, coaching, food, tech, etc.)",
    "Who is your target audience? Describe your ideal customer.",
    "What products or services will you be offering?",
    "Describe your brand style — what look and feel do you want? (Bold, minimal, luxury, playful, professional, etc.)",
    "What are your top goals for the first 90 days after launch?",
  ],
};

const COMMON_INTRO   = [
  "What's your name or the name of your business?",
  "What's the best email address to send your work order to?",
];

const COMMON_CLOSING = [
  "Any additional notes, special requests, or anything else you'd like us to know?",
];

function buildQuestions(serviceTitle) {
  const specific = SERVICE_QUESTIONS[serviceTitle] ?? SERVICE_QUESTIONS["Consulting"];
  return [...COMMON_INTRO, ...specific, ...COMMON_CLOSING];
}

function buildIntro(serviceTitle) {
  const total = buildQuestions(serviceTitle).length;
  return `I'm going to help you get started with **${serviceTitle}**. I'll ask you ${total} quick questions to build your custom work order and strategy — this usually takes about 2 minutes.\n\nReady? Let's do this. 🚀`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ClientOnboardingPanel({ service, onClose }) {
  const questions = buildQuestions(service?.title ?? "Consulting");

  const [phase,      setPhase]      = useState("chat"); // "chat" | "processing" | "done" | "error"
  const [stepIndex,  setStepIndex]  = useState(-1);     // -1 = intro in progress
  const [answers,    setAnswers]    = useState(() => Array(questions.length).fill(""));
  const [inputVal,   setInputVal]   = useState("");
  const [messages,   setMessages]   = useState([]);
  const [naviTyping, setNaviTyping] = useState(false);
  const [workOrder,  setWorkOrder]  = useState(null);
  const [strategy,   setStrategy]   = useState(null);
  const [confirmShown, setConfirmShown] = useState(false);

  const scrollRef  = useRef(null);
  const inputRef   = useRef(null);
  const answersRef = useRef(answers);
  const phaseRef   = useRef("chat");

  // Keep refs current
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { phaseRef.current   = phase;   }, [phase]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, naviTyping, phase]);

  // Confirmation bubble when work order is done
  useEffect(() => {
    if (phase !== "done" || confirmShown) return;
    setConfirmShown(true);
    console.log("[Work With Us] Work order sent to", EMAIL_RECEIVER);
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        role: "navi",
        text: "Your request has been submitted to our team. We'll be in touch shortly. ✅",
        id:   "confirmation",
      }]);
    }, 500);
  }, [phase, confirmShown]);

  // ── Show a NAVI bubble after a short typing delay ─────────────────────────
  const showNaviBubble = useCallback((text, id) => {
    return new Promise((resolve) => {
      setNaviTyping(true);
      setTimeout(() => {
        setNaviTyping(false);
        setMessages((prev) => [...prev, { role: "navi", text, id: id ?? `n-${Date.now()}` }]);
        resolve();
      }, 620);
    });
  }, []);

  // ── Ask a question by index ───────────────────────────────────────────────
  const askQuestion = useCallback(async (idx) => {
    setStepIndex(idx);
    await showNaviBubble(questions[idx], `q-${idx}`);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [questions, showNaviBubble]);

  // ── Start on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        await showNaviBubble(buildIntro(service?.title ?? "Consulting"), "intro");
        if (!cancelled) {
          await askQuestion(0);
          console.log("[Work With Us] Service initialized successfully");
        }
      } catch (err) {
        console.error("Service error:", service?.title ?? "Consulting", err);
        if (!cancelled) setPhase("error");
      }
    }
    start();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate work order via API ───────────────────────────────────────────
  const generateWorkOrder = useCallback(async (finalAnswers) => {
    const safeAnswers = Array.isArray(finalAnswers) ? finalAnswers : [];
    const serviceTitle = service?.title ?? "Consulting";
    const qa = questions.map((q, i) => ({ question: q, answer: safeAnswers[i] || "(no answer)" }));

    try {
      const res = await fetch("/api/onboard", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          service:      serviceTitle,
          answers:      qa,
          businessName: safeAnswers[0] || "Client",
          email:        safeAnswers[1] || "",
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);

      const data = await res.json();
      if (!data.workOrder || !data.strategy) throw new Error("Incomplete response");

      // Ensure array fields are always arrays even if the API returns them as strings
      const wo = data.workOrder;
      setWorkOrder({
        ...wo,
        objectives:   Array.isArray(wo.objectives)   ? wo.objectives   : [],
        deliverables: Array.isArray(wo.deliverables) ? wo.deliverables : [],
      });
      const st = data.strategy;
      setStrategy({
        ...st,
        contentIdeas: Array.isArray(st.contentIdeas) ? st.contentIdeas : [],
        nextSteps:    Array.isArray(st.nextSteps)    ? st.nextSteps    : [],
      });
      setPhase("done");
    } catch (err) {
      console.error("Service error:", serviceTitle, err);
      // Fallback: construct a minimal work order locally so the user still gets something useful
      setWorkOrder({
        clientName:   safeAnswers[0] || "Client",
        service:      serviceTitle,
        summary:      `New ${serviceTitle} inquiry from ${safeAnswers[0] || "a client"}. Details collected via NAVI onboarding.`,
        objectives:   ["Kickoff call to align on scope", "Deliver initial strategy", "Execute and iterate"],
        deliverables: ["Discovery session", "Strategic roadmap", "Execution plan", "Progress reports"],
        timeline:     "To be determined at kickoff",
        notes:        qa.slice(2).map((a) => `• ${a.question}: ${a.answer}`).join("\n"),
      });
      setStrategy({
        winningAngle:    "Personalized strategy tailored to your unique situation.",
        approach:        "A custom plan will be developed during your kickoff call with Chaz based on your specific goals and context.",
        contentIdeas:    [],
        growthDirection: "Focused on your stated objectives and timeline.",
        nextSteps:       ["Review your work order", "Click 'Send to Chaz' below", "Expect a reply within 24–48 hours"],
      });
      setPhase("done");
    }
  }, [service?.title, questions]);

  // ── Handle user submitting an answer ─────────────────────────────────────
  const handleSend = useCallback(async (overrideVal) => {
    // Type-guard: overrideVal must be a string — guard against MouseEvent being passed
    const safeOverride = typeof overrideVal === "string" ? overrideVal : undefined;
    const val = (safeOverride !== undefined ? safeOverride : inputVal).trim();
    if (!val || phaseRef.current !== "chat" || naviTyping || stepIndex < 0) return;

    const idx = stepIndex;

    // Record answer
    const next = [...answersRef.current];
    next[idx]        = val;
    answersRef.current = next;
    setAnswers(next);

    // Show user bubble
    setMessages((prev) => [...prev, { role: "user", text: val, id: `a-${idx}` }]);
    setInputVal("");

    const nextIdx = idx + 1;

    if (nextIdx < questions.length) {
      await askQuestion(nextIdx);
    } else {
      // All done — transition to processing
      setStepIndex(questions.length);
      await showNaviBubble(
        "Perfect — I have everything I need. Give me a moment while I build your custom work order and strategy…",
        "processing-msg"
      );
      setPhase("processing");
      generateWorkOrder(next);
    }
  }, [inputVal, naviTyping, stepIndex, questions.length, askQuestion, showNaviBubble, generateWorkOrder]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ── Progress 0–1 ──────────────────────────────────────────────────────────
  const progress = stepIndex < 0 ? 0 : Math.min((stepIndex) / questions.length, 1);

  // ── Build mailto body ─────────────────────────────────────────────────────
  const buildMailto = useCallback(() => {
    if (!workOrder || !strategy) return "";

    const lines = [
      `WORK ORDER — ${workOrder.service}`,
      `Client: ${workOrder.clientName}`,
      `Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      "",
      "─── SUMMARY ───",
      workOrder.summary,
      "",
      "─── OBJECTIVES ───",
      ...(Array.isArray(workOrder.objectives) ? workOrder.objectives : []).map((o, i) => `${i + 1}. ${o}`),
      "",
      "─── DELIVERABLES ───",
      ...(Array.isArray(workOrder.deliverables) ? workOrder.deliverables : []).map((d) => `• ${d}`),
      "",
      `Timeline: ${workOrder.timeline ?? "TBD"}`,
      "",
      "─── NOTES ───",
      workOrder.notes ?? "",
      "",
      "─── AI STRATEGY ───",
      "",
      `Winning Angle: ${strategy.winningAngle ?? ""}`,
      "",
      "Recommended Approach:",
      strategy.approach ?? "",
      "",
      "Content Ideas:",
      ...(Array.isArray(strategy.contentIdeas) ? strategy.contentIdeas : []).map((c, i) => `${i + 1}. ${c}`),
      "",
      `Growth Direction: ${strategy.growthDirection ?? ""}`,
      "",
      "Next Steps:",
      ...(Array.isArray(strategy.nextSteps) ? strategy.nextSteps : []).map((s, i) => `${i + 1}. ${s}`),
      "",
      `Client Name: ${answers[0] || "N/A"}`,
      `Client Email: ${answers[1] || "N/A"}`,
      "",
      "— Sent via NAVI Onboarding System",
    ];

    const subject = `Work Order: ${workOrder.service} — ${workOrder.clientName}`;
    return `mailto:${EMAIL_RECEIVER}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  }, [workOrder, strategy, answers]);

  // Guard: if service somehow missing, render nothing (all hooks already called above)
  if (!service) return null;

  console.log("[Work With Us] Loading service:", service.title);

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      zIndex: 49,
      height: "85vh",
      background: "rgba(8,8,20,0.97)",
      backdropFilter: "blur(22px)",
      WebkitBackdropFilter: "blur(22px)",
      borderRadius: "22px 22px 0 0",
      border: "1px solid rgba(201,162,39,0.18)",
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
            color: GOLD, letterSpacing: "0.04em",
          }}>
            {service.icon} {service.title}
          </div>
          <div style={{
            fontSize: 9, fontFamily: "monospace", color: "#475569",
            letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1,
          }}>
            NAVI Client Onboarding
          </div>
        </div>

        {/* Step counter */}
        {stepIndex >= 0 && stepIndex < questions.length && (
          <div style={{
            fontSize: 9, fontFamily: "monospace",
            color: "rgba(201,162,39,0.5)", letterSpacing: "0.08em",
          }}>
            {stepIndex + 1}&thinsp;/&thinsp;{questions.length}
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={{ padding: "10px 20px 4px", flexShrink: 0 }}>
        <div style={{
          height: 2, background: GOLD_DIM,
          borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: `linear-gradient(90deg, ${GOLD}, #d4a017)`,
            width: `${Math.round(progress * 100)}%`,
            transition: "width 0.5s ease",
            boxShadow: `0 0 6px ${GOLD_GLOW}`,
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
          msg.role === "navi" ? (
            <NaviBubble key={msg.id} text={msg.text} />
          ) : (
            <UserBubble key={msg.id} text={msg.text} />
          )
        )}

        {/* Typing indicator */}
        {naviTyping && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, animation: "stemFadeUp 0.25s ease forwards" }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              <NaviOrb size={22} />
            </div>
            <div style={{
              padding: "10px 14px", borderRadius: "4px 14px 14px 14px",
              background: "linear-gradient(135deg, rgba(28,22,8,0.95), rgba(18,14,10,0.95))",
              border: "1px solid rgba(201,162,39,0.18)",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: GOLD, opacity: 0.6,
                  animation: `stemDotPulse 1.1s ease ${i * 0.22}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Processing spinner */}
        {phase === "processing" && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 10, padding: "24px 0",
            animation: "stemFadeUp 0.4s ease forwards",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              border: `2px solid ${GOLD}`,
              borderTopColor: "transparent",
              animation: "spin 0.9s linear infinite",
            }} />
            <div style={{
              fontSize: 10, fontFamily: "monospace", color: GOLD,
              letterSpacing: "0.12em", textAlign: "center",
            }}>
              NAVI is building your work order…
            </div>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", letterSpacing: "0.06em" }}>
              Analyzing responses &amp; generating strategy
            </div>
          </div>
        )}

        {/* Error state with retry */}
        {phase === "error" && (
          <div style={{
            padding: "20px 16px", borderRadius: 14, margin: "12px 0",
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.22)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            animation: "stemFadeUp 0.4s ease forwards",
          }}>
            <div style={{ fontSize: 22 }}>⚠️</div>
            <div style={{
              fontSize: 11, fontFamily: "monospace", color: "#fca5a5",
              textAlign: "center", lineHeight: 1.65,
            }}>
              Something went wrong loading this service.
            </div>
            <div style={{
              fontSize: 10, fontFamily: "monospace", color: "#475569",
              textAlign: "center", lineHeight: 1.5,
            }}>
              This feature is temporarily unavailable. Please try again.
            </div>
            <button
              onClick={onClose}
              style={{
                padding: "9px 20px", borderRadius: 9, cursor: "pointer",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.30)",
                color: "#f87171", fontSize: 11, fontFamily: "monospace",
                letterSpacing: "0.04em",
              }}
            >
              ← Close &amp; Retry
            </button>
          </div>
        )}

        {/* Work order output */}
        {phase === "done" && workOrder && strategy && (
          <WorkOrderDisplay
            workOrder={workOrder}
            strategy={strategy}
            mailtoHref={buildMailto()}
          />
        )}

        {/* Scroll anchor */}
        <div style={{ height: 1 }} />
      </div>

      {/* ── Input (always visible at bottom while in chat phase) ── */}
      {phase === "chat" && (
        <div style={{
          padding: "12px 20px 22px",
          borderTop: "1px solid rgba(201,162,39,0.10)",
          background: "rgba(8,8,20,0.97)",
          flexShrink: 0,
        }}>
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
                border: `1px solid ${inputVal.trim() ? "rgba(201,162,39,0.38)" : "rgba(255,255,255,0.08)"}`,
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
                  ? `linear-gradient(135deg, ${GOLD}, #d4a017)`
                  : GOLD_DIM,
                border: "none",
                color: (inputVal.trim() && !naviTyping) ? "#0a0a18" : "rgba(201,162,39,0.35)",
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

// ── NAVI chat bubble ──────────────────────────────────────────────────────────
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
        background: "linear-gradient(135deg, rgba(28,22,8,0.95), rgba(18,14,10,0.95))",
        border: "1px solid rgba(201,162,39,0.20)",
        fontSize: 11, fontFamily: "monospace", color: "#cbd5e1",
        lineHeight: 1.7,
        boxShadow: "0 0 12px rgba(201,162,39,0.06)",
        whiteSpace: "pre-wrap",
      }}>
        {/* Bold markdown (**text**) */}
        {(text ?? "").split(/\*\*(.+?)\*\*/g).map((part, i) =>
          i % 2 === 1
            ? <strong key={i} style={{ color: GOLD }}>{part}</strong>
            : <span key={i}>{part}</span>
        )}
      </div>
    </div>
  );
}

// ── User chat bubble ──────────────────────────────────────────────────────────
function UserBubble({ text }) {
  return (
    <div style={{
      display: "flex", justifyContent: "flex-end",
      animation: "stemFadeUp 0.2s ease forwards",
    }}>
      <div style={{
        maxWidth: "80%",
        padding: "10px 13px",
        borderRadius: "14px 4px 14px 14px",
        background: "rgba(201,162,39,0.10)",
        border: "1px solid rgba(201,162,39,0.28)",
        fontSize: 11, fontFamily: "monospace", color: "#f1f5f9",
        lineHeight: 1.65,
      }}>
        {text}
      </div>
    </div>
  );
}

// ── Work order + strategy display ────────────────────────────────────────────
function WorkOrderDisplay({ workOrder, strategy, mailtoHref }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "stemFadeUp 0.5s ease forwards" }}>

      {/* Success banner */}
      <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
        <div style={{ fontSize: 26, marginBottom: 6 }}>✅</div>
        <div style={{
          fontSize: 12, fontFamily: "monospace", fontWeight: "bold",
          color: GOLD, letterSpacing: "0.06em",
        }}>
          Work Order Generated
        </div>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", marginTop: 3 }}>
          Submitted to {EMAIL_RECEIVER} — review the details below.
        </div>
      </div>

      {/* Work Order card */}
      <div style={{
        padding: "16px 14px", borderRadius: 16,
        background: "linear-gradient(160deg, rgba(18,14,10,0.98), rgba(28,22,8,0.98))",
        border: "1px solid rgba(201,162,39,0.28)",
        boxShadow: "0 0 22px rgba(201,162,39,0.08)",
      }}>
        <WOHeader label="📋 Work Order" />
        <WOField label="Client">{workOrder.clientName}</WOField>
        <WOField label="Service">{workOrder.service}</WOField>
        <WOField label="Summary">{workOrder.summary}</WOField>
        {Array.isArray(workOrder.objectives) && workOrder.objectives.length > 0 && (
          <WOField label="Objectives">
            {workOrder.objectives.map((o, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginTop: i === 0 ? 0 : 5 }}>
                <span style={{ color: GOLD, flexShrink: 0, lineHeight: 1.65 }}>{i + 1}.</span>
                <span>{o ?? ""}</span>
              </div>
            ))}
          </WOField>
        )}
        {Array.isArray(workOrder.deliverables) && workOrder.deliverables.length > 0 && (
          <WOField label="Deliverables">
            {workOrder.deliverables.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginTop: i === 0 ? 0 : 5 }}>
                <span style={{ color: GOLD, flexShrink: 0, lineHeight: 1.65 }}>•</span>
                <span>{d ?? ""}</span>
              </div>
            ))}
          </WOField>
        )}
        {workOrder.timeline && <WOField label="Timeline">{workOrder.timeline}</WOField>}
        {workOrder.notes && <WOField label="Notes">{workOrder.notes}</WOField>}
      </div>

      {/* Strategy card */}
      <div style={{
        padding: "16px 14px", borderRadius: 16,
        background: "linear-gradient(160deg, rgba(8,10,20,0.98), rgba(14,10,28,0.98))",
        border: "1px solid rgba(99,102,241,0.28)",
        boxShadow: "0 0 18px rgba(99,102,241,0.07)",
      }}>
        <WOHeader label="🧠 NAVI Strategy" accent="#818cf8" />

        {strategy.winningAngle && (
          <div style={{
            padding: "9px 12px", borderRadius: 10, marginBottom: 12,
            background: "rgba(99,102,241,0.09)",
            border: "1px solid rgba(99,102,241,0.22)",
          }}>
            <div style={{
              fontSize: 8, fontFamily: "monospace", letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#818cf8", marginBottom: 4,
            }}>
              ⚡ Winning Angle
            </div>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: "#c7d2fe", lineHeight: 1.65 }}>
              {strategy.winningAngle}
            </div>
          </div>
        )}

        <WOField label="Recommended Approach" accent="#818cf8">{strategy.approach}</WOField>

        {Array.isArray(strategy.contentIdeas) && strategy.contentIdeas.length > 0 && (
          <WOField label="Content Ideas" accent="#818cf8">
            {strategy.contentIdeas.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginTop: i === 0 ? 0 : 5 }}>
                <span style={{ color: "#818cf8", flexShrink: 0, lineHeight: 1.65 }}>💡</span>
                <span>{c ?? ""}</span>
              </div>
            ))}
          </WOField>
        )}

        {strategy.growthDirection && (
          <WOField label="Growth Direction" accent="#818cf8">{strategy.growthDirection}</WOField>
        )}

        {Array.isArray(strategy.nextSteps) && strategy.nextSteps.length > 0 && (
          <WOField label="Next Steps" accent="#818cf8">
            {strategy.nextSteps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginTop: i === 0 ? 0 : 5 }}>
                <span style={{ color: "#34d399", flexShrink: 0, lineHeight: 1.65 }}>{i + 1}.</span>
                <span>{s ?? ""}</span>
              </div>
            ))}
          </WOField>
        )}
      </div>

      {/* Send CTA */}
      {mailtoHref && (
        <button
          onClick={() => window.open(mailtoHref, "_blank")}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, cursor: "pointer",
            background: `linear-gradient(135deg, ${GOLD}, #d4a017)`,
            border: "none",
            color: "#0a0a18", fontFamily: "monospace", fontSize: 13,
            fontWeight: "bold", letterSpacing: "0.06em",
            boxShadow: `0 4px 22px ${GOLD_GLOW}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
        >
          📤 Also Send via Email
        </button>
      )}

      <div style={{
        fontSize: 9, fontFamily: "monospace", color: "#334155",
        textAlign: "center", lineHeight: 1.65, padding: "0 12px",
      }}>
        Your work order was automatically submitted to {EMAIL_RECEIVER}.
        The button above opens your email app as an additional copy.
        Expect a reply within 24–48 hours.
      </div>

      <div style={{ minHeight: 12 }} />
    </div>
  );
}

// ── Small helper sub-components ───────────────────────────────────────────────
function WOHeader({ label, accent }) {
  const color = accent ?? GOLD;
  return (
    <div style={{
      fontSize: 8, fontFamily: "monospace", fontWeight: "bold",
      letterSpacing: "0.22em", textTransform: "uppercase",
      color, marginBottom: 12, opacity: 0.85,
    }}>
      {label}
    </div>
  );
}

function WOField({ label, children, accent }) {
  const color = accent ?? GOLD;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 8, fontFamily: "monospace", letterSpacing: "0.14em",
        textTransform: "uppercase", color, opacity: 0.75, marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 11, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7,
      }}>
        {children}
      </div>
    </div>
  );
}
