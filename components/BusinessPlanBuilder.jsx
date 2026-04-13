"use client";

import { useState, useEffect } from "react";
import BusinessPlanCard from "./BusinessPlanCard";
import NaviOrb from "./NaviOrb";

// ── Questions ─────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    field: "businessName",
    label: "Business Name",
    naviPrompt:
      "Let's build your professional business plan!\n\nFirst — what is the name of your business?\nA working title is fine if you haven't settled on one yet.",
    placeholder: "e.g. Apex Lawn Services, Glow Skin Studio, CloudPeak Analytics",
  },
  {
    field: "businessType",
    label: "Business Type",
    naviPrompt:
      "What type of business is this?\n\nDescribe the industry and structure — service-based, product-based, SaaS, local, e-commerce, etc.",
    placeholder: "e.g. Local service business, E-commerce store, SaaS software, Consulting firm",
  },
  {
    field: "targetAudience",
    label: "Target Audience",
    naviPrompt:
      "Got it. Now — who is your ideal customer?\n\nBe specific: demographics, profession, location, and what they care about most.",
    placeholder: "e.g. Small business owners aged 30–55 in the Southeast who need affordable marketing",
  },
  {
    field: "problemSolved",
    label: "Problem Solved",
    naviPrompt:
      "Every great business solves a real problem.\n\nWhat specific pain point or gap does your business address for customers?",
    placeholder:
      "e.g. Most local businesses can't afford agency marketing, so they miss out on online growth",
  },
  {
    field: "servicesProducts",
    label: "Products & Services",
    naviPrompt:
      "Good. Tell me about what you offer.\n\nWhat are your main products or services? List your core offerings and what makes them valuable.",
    placeholder:
      "e.g. Social media management, paid ad campaigns, email automation, monthly analytics reports",
  },
  {
    field: "revenueModel",
    label: "Revenue Model",
    naviPrompt:
      "Let's talk about the money.\n\nHow does your business generate revenue? Describe your pricing model and income streams.",
    placeholder:
      "e.g. Monthly retainer $1,500–$5,000, one-time project fees, 10% commission on ad spend",
  },
  {
    field: "startupBudget",
    label: "Startup Budget",
    naviPrompt:
      "What is your estimated startup budget or current capital?\n\nInclude what you have now and what you'll need to launch.",
    placeholder:
      "e.g. $5,000 saved, need $15,000 total for tools, marketing, and first 3 months of operations",
  },
  {
    field: "growthGoals",
    label: "Growth Goals",
    naviPrompt:
      "Last business question — what are your growth goals for the next 1–3 years?\n\nThink revenue targets, team size, market reach, or key milestones.",
    placeholder: "e.g. $100K in year 1, expand to 3 employees by year 2, $500K ARR by year 3",
  },
  {
    field: "userEmail",
    label: "Your Email",
    inputType: "email",
    naviPrompt:
      "I have everything I need.\n\nWhere should I send your completed business plan? I'll email you the full copy once it's generated.",
    placeholder: "your@email.com",
  },
];

// Section names for the generating animation
const SECTION_NAMES = [
  "Company Overview",
  "Founder Advantage",
  "Company Advantages",
  "Industry Overview",
  "Market Research",
  "Market Gap & Opportunity",
  "Target Customers",
  "Products and Services",
  "Operating Model",
  "Strategic Positioning",
  "Data Infrastructure Advantage",
  "Growth Strategy",
  "Three-Year Growth Vision",
  "Financial Overview & Budget",
  "Revenue Model",
  "Funding Request & Use of Capital",
  "Vision",
  "Summary",
];

// ── Generating phase ──────────────────────────────────────────────────────────

function GeneratingPhase() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible((v) => (v < SECTION_NAMES.length ? v + 1 : v));
    }, 220);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 py-6 px-2">
      {/* Pulsing orb */}
      <div className="relative">
        <NaviOrb size={48} />
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: "rgba(245,158,11,0.12)", animationDuration: "1.4s" }}
        />
      </div>

      {/* NAVI message */}
      <p className="text-sm font-mono text-slate-300 text-center leading-relaxed max-w-xs px-2">
        I'm building your business plan using a professional framework. This will be ready shortly.
      </p>

      {/* Animated section checklist */}
      <div className="w-full flex flex-col gap-2 pt-1">
        {SECTION_NAMES.map((name, i) => {
          const done    = i < visible;
          const active  = i === visible;
          if (!done && !active) return null;
          return (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="flex-shrink-0 w-3 h-3 rounded-full flex items-center justify-center"
                style={{
                  background: done ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.1)",
                  border:     done ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(245,158,11,0.25)",
                }}
              >
                {done && (
                  <span style={{ fontSize: 7, color: "#f59e0b", lineHeight: 1 }}>✓</span>
                )}
              </div>
              <span
                className="text-[10px] font-mono tracking-wider uppercase flex-1"
                style={{
                  color: done ? "rgba(148,163,184,0.55)" : "rgba(245,158,11,0.75)",
                }}
              >
                {name}
              </span>
              {active && (
                <span
                  className="text-[9px] font-mono animate-pulse"
                  style={{ color: "rgba(245,158,11,0.5)" }}
                >
                  writing…
                </span>
              )}
            </div>
          );
        })}
        {visible >= SECTION_NAMES.length && (
          <div
            className="text-[10px] font-mono text-center pt-1 animate-pulse"
            style={{ color: "rgba(245,158,11,0.7)" }}
          >
            Finalizing your plan…
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BusinessPlanBuilder({ petName = "NAVI", onClose }) {
  const [step,        setStep]        = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [input,       setInput]       = useState("");
  const [phase,       setPhase]       = useState("chat"); // "chat"|"generating"|"done"|"error"
  const [plan,        setPlan]        = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [emailSent,   setEmailSent]   = useState(false);

  const current        = QUESTIONS[step];
  const isLastQuestion = step === QUESTIONS.length - 1;
  const progressPct    = `${((step + 1) / QUESTIONS.length) * 100}%`;

  // ── Step navigation ─────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (!input.trim()) return;

    const updated = { ...answers, [current.field]: input.trim() };
    setAnswers(updated);
    setInput("");

    if (!isLastQuestion) {
      setStep(step + 1);
      return;
    }

    // Last question — trigger generation
    setPhase("generating");
    try {
      const res = await fetch("/api/business-plan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data.plan);
      setCompanyName(data.companyName || updated.businessName || "");
      setEmailSent(data.emailSent || false);
      setPhase("done");
    } catch (err) {
      console.error("[BusinessPlanBuilder] Generation error:", err);
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

  const handleRestart = () => {
    setStep(0);
    setAnswers({});
    setInput("");
    setPhase("chat");
    setPlan(null);
    setCompanyName("");
    setEmailSent(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-overlay-in"
      style={{ background: "rgba(6,6,14,0.97)", backdropFilter: "blur(12px)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex flex-col">
          <span className="text-xs font-mono tracking-[0.3em] text-slate-500 uppercase">
            Business Plan Builder
          </span>
          {phase === "chat" && (
            <span className="text-[10px] font-mono text-slate-600">
              Question {step + 1} of {QUESTIONS.length}
            </span>
          )}
          {phase === "generating" && (
            <span className="text-[10px] font-mono text-slate-600 animate-pulse">
              Generating your plan…
            </span>
          )}
          {phase === "done" && (
            <span className="text-[10px] font-mono text-slate-600">Plan complete</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.05)",
            border:     "1px solid rgba(255,255,255,0.08)",
            color:      "#94a3b8",
          }}
          aria-label="Close business plan builder"
        >
          ✕
        </button>
      </div>

      {/* ── Progress bar (chat only) ── */}
      {phase === "chat" && (
        <div className="flex-shrink-0 h-1" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width:      progressPct,
              background: "linear-gradient(90deg, #f59e0b, #f472b6)",
              boxShadow:  "0 0 8px rgba(245,158,11,0.5)",
            }}
          />
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">

        {/* Chat phase */}
        {phase === "chat" && (
          <>
            {/* NAVI speech bubble */}
            <div className="flex gap-3 items-start">
              <NaviOrb size={32} />
              <div
                className="flex-1 px-4 py-3 text-sm font-mono leading-relaxed"
                style={{
                  background:   "rgba(255,255,255,0.04)",
                  border:       "1px solid rgba(255,255,255,0.08)",
                  color:        "#cbd5e1",
                  borderRadius: "18px 18px 18px 4px",
                  whiteSpace:   "pre-wrap",
                }}
              >
                {current.naviPrompt.replace(/NAVI/g, petName)}
              </div>
            </div>

            {/* Field label badge */}
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-md"
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border:     "1px solid rgba(245,158,11,0.3)",
                  color:      "#f59e0b",
                }}
              >
                {current.label}
              </span>
            </div>

            {/* Input — email vs textarea */}
            {current.inputType === "email" ? (
              <input
                key={`input-${step}`}
                type="email"
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (input.trim()) handleNext();
                  }
                }}
                placeholder={current.placeholder}
                className="w-full font-mono text-sm text-slate-200 placeholder-slate-600 focus:outline-none rounded-xl px-4 py-3"
                style={{
                  background:  "rgba(255,255,255,0.04)",
                  border:      "1px solid rgba(255,255,255,0.1)",
                  caretColor:  "#f59e0b",
                  lineHeight:  "1.6",
                }}
              />
            ) : (
              <textarea
                key={`textarea-${step}`}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={current.placeholder}
                rows={3}
                className="w-full resize-none font-mono text-sm text-slate-200 placeholder-slate-600 focus:outline-none rounded-xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border:     "1px solid rgba(255,255,255,0.1)",
                  caretColor: "#f59e0b",
                  lineHeight: "1.6",
                }}
              />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              {step > 0 ? (
                <button
                  onClick={handleBack}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{
                    color:  "rgba(100,116,139,0.8)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={handleNext}
                disabled={!input.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: input.trim()
                    ? "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(244,114,182,0.2))"
                    : "rgba(255,255,255,0.04)",
                  border: input.trim()
                    ? "1px solid rgba(245,158,11,0.45)"
                    : "1px solid rgba(255,255,255,0.08)",
                  color:     input.trim() ? "#f59e0b" : "#475569",
                  boxShadow: input.trim() ? "0 0 12px rgba(245,158,11,0.15)" : "none",
                }}
              >
                {isLastQuestion ? "Generate Plan 🚀" : "Next →"}
              </button>
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-1.5 pt-1">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width:      i === step ? 14 : 5,
                    height:     5,
                    background:
                      i < step
                        ? "#f59e0b"
                        : i === step
                        ? "linear-gradient(90deg,#f59e0b,#f472b6)"
                        : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Generating phase */}
        {phase === "generating" && <GeneratingPhase />}

        {/* Done phase */}
        {phase === "done" && plan && (
          <BusinessPlanCard
            plan={plan}
            companyName={companyName}
            emailSent={emailSent}
            userEmail={answers.userEmail || ""}
            onRestart={handleRestart}
            onClose={onClose}
          />
        )}

        {/* Error phase */}
        {phase === "error" && (
          <div className="flex flex-col items-center gap-5 py-8 px-4 text-center">
            <span style={{ fontSize: 32 }}>⚠️</span>
            <div>
              <div className="text-sm font-mono font-bold text-white mb-1">
                Generation Failed
              </div>
              <div className="text-xs font-mono text-slate-500 leading-relaxed">
                I wasn't able to generate your business plan. Please check your connection and try
                again.
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 rounded-xl font-mono text-sm font-bold transition-all duration-200"
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border:     "1px solid rgba(245,158,11,0.35)",
                  color:      "#f59e0b",
                }}
              >
                ↺ Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-mono text-sm transition-all duration-200"
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  color:  "rgba(100,116,139,0.8)",
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
