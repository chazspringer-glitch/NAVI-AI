"use client";

import { useState } from "react";
import ResumeCard from "./ResumeCard";
import NaviOrb from "./NaviOrb";

const STEPS = [
  {
    field: "name",
    naviPrompt: "Let's build your resume! 📄\n\nFirst — what's your full name?",
    placeholder: "e.g. Jordan Smith",
    label: "Full Name",
  },
  {
    field: "contact",
    naviPrompt: "Nice to meet you! 👋\n\nWhat's your email address? Add your phone number too if you want.\n(These let employers reach you.)",
    placeholder: "e.g. jordan@email.com | 555-123-4567",
    label: "Contact Info",
  },
  {
    field: "skills",
    naviPrompt: "Great! Now let's talk about what you're good at. 💡\n\nList your skills — even everyday ones count!\nThings like: communication, drawing, organizing, fixing things, coding, cooking…",
    placeholder: "e.g. Communication, Microsoft Word, Art, Reliable",
    label: "Skills",
  },
  {
    field: "experience",
    naviPrompt: "Have you had any jobs, done volunteer work, helped with a family business, or completed any projects?\n\nIf not, that's totally okay — just write 'No experience yet' and I'll handle it! 🙌",
    placeholder: "e.g. Babysat for neighbors (2023) OR No experience yet",
    label: "Experience",
  },
  {
    field: "about",
    naviPrompt: "Almost done! One last thing — tell me a little about yourself. ✨\n\nWhat are you looking for? What makes you a hard worker? What do you care about?\n(Even 1–2 sentences is perfect!)",
    placeholder: "e.g. I'm a hard worker who loves helping people and is eager to learn new skills.",
    label: "About Me",
  },
];

export default function ResumeBuilder({ petName = "NAVI", onClose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ name: "", contact: "", skills: "", experience: "", about: "" });
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);

  const current = STEPS[step];
  const progress = ((step) / STEPS.length) * 100;

  const handleNext = () => {
    if (!input.trim()) return;
    const updated = { ...answers, [current.field]: input.trim() };
    setAnswers(updated);
    setInput("");
    if (step + 1 >= STEPS.length) {
      setDone(true);
    } else {
      setStep(step + 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleRestart = () => {
    setStep(0);
    setAnswers({ name: "", contact: "", skills: "", experience: "", about: "" });
    setInput("");
    setDone(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-overlay-in"
      style={{ background: "rgba(6,6,14,0.97)", backdropFilter: "blur(12px)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex flex-col">
          <span className="text-xs font-mono tracking-[0.3em] text-slate-500 uppercase">
            Resume Builder
          </span>
          {!done && (
            <span className="text-[10px] font-mono text-slate-600">
              Step {step + 1} of {STEPS.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}
          aria-label="Close resume builder"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      {!done && (
        <div className="flex-shrink-0 h-1" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progress + (100 / STEPS.length)}%`,
              background: "linear-gradient(90deg, #00d4ff, #a855f7)",
              boxShadow: "0 0 8px rgba(0,212,255,0.4)",
            }}
          />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">
        {!done ? (
          <>
            {/* NAVI speech bubble */}
            <div className="flex gap-3 items-start">
              <NaviOrb size={32} />
              <div
                className="flex-1 px-4 py-3 rounded-2xl text-sm font-mono leading-relaxed"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#cbd5e1",
                  borderRadius: "18px 18px 18px 4px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {current.naviPrompt.replace("NAVI", petName)}
              </div>
            </div>

            {/* Field label */}
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-md"
                style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}
              >
                {current.label}
              </span>
            </div>

            {/* Input */}
            <textarea
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={current.placeholder}
              rows={3}
              className="w-full resize-none font-mono text-sm text-slate-200 placeholder-slate-600 focus:outline-none rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                caretColor: "#00d4ff",
                lineHeight: "1.6",
              }}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between">
              {step > 0 ? (
                <button
                  onClick={() => { setStep(step - 1); setInput(answers[STEPS[step - 1].field]); }}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{ color: "rgba(100,116,139,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  ← Back
                </button>
              ) : <div />}
              <button
                onClick={handleNext}
                disabled={!input.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: input.trim() ? "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(168,85,247,0.2))" : "rgba(255,255,255,0.04)",
                  border: input.trim() ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  color: input.trim() ? "#00d4ff" : "#475569",
                  boxShadow: input.trim() ? "0 0 12px rgba(0,212,255,0.15)" : "none",
                }}
              >
                {step + 1 >= STEPS.length ? "Build Resume ✨" : "Next →"}
              </button>
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-2 pt-2">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 16 : 6,
                    height: 6,
                    background: i < step ? "#00d4ff" : i === step ? "linear-gradient(90deg,#00d4ff,#a855f7)" : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <ResumeCard
            data={answers}
            onRestart={handleRestart}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
