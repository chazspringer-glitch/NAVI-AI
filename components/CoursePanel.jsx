"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import NaviOrb from "./NaviOrb";
import {
  loadCourseProgress,
  saveCourseProgress,
  initCourseProgress,
  completeLesson,
  getPercentComplete,
  isModuleComplete,
  isCourseComplete,
  isLessonUnlocked,
  finalizeCourse,
  generateCertificateId,
} from "@/lib/courses/courseProgress";

// ── Certificate component ─────────────────────────────────────────────────────

function Certificate({ course, progress, onBack }) {
  const completionDate = progress.completedAt
    ? new Date(progress.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const copied = useCallback(() => {
    const text = [
      course.certTitle,
      "",
      "This certifies that",
      progress.studentName || "Student",
      course.certBody,
      "",
      `Completed: ${completionDate}`,
      `Certificate ID: ${progress.certificateId}`,
      `Total XP Earned: ${progress.totalXP}`,
    ].join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
  }, [course, progress, completionDate]);

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", padding: "20px 16px 40px" }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer",
          fontSize: 12, fontFamily: "monospace", color: "#64748b", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 4, padding: 0,
        }}
      >
        ← Back to course
      </button>

      {/* Certificate card */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        background: `linear-gradient(160deg, rgba(0,0,0,0.6) 0%, rgba(${course.color === "#6366f1" ? "99,102,241" : course.color === "#8b5cf6" ? "139,92,246" : "99,102,241"},0.12) 100%)`,
        border: `1px solid ${course.color}40`,
        borderRadius: 24, padding: "32px 24px",
        boxShadow: `0 0 40px ${course.glow}, inset 0 0 0 1px ${course.color}18`,
        position: "relative", overflow: "hidden",
        gap: 16,
      }}>
        {/* Decorative corner lines */}
        {["0,0", "0,auto", "auto,0", "auto,auto"].map((pos, i) => {
          const [t, b] = pos.split(",");
          return (
            <div key={i} style={{
              position: "absolute",
              top: t === "0" ? 16 : undefined,
              bottom: b === "auto" ? undefined : 16,
              left: i < 2 ? 16 : undefined,
              right: i >= 2 ? 16 : undefined,
              width: 20, height: 20,
              borderTop: (i === 0 || i === 2) ? `1.5px solid ${course.color}70` : undefined,
              borderBottom: (i === 1 || i === 3) ? `1.5px solid ${course.color}70` : undefined,
              borderLeft: (i === 0 || i === 1) ? `1.5px solid ${course.color}70` : undefined,
              borderRight: (i === 2 || i === 3) ? `1.5px solid ${course.color}70` : undefined,
            }} />
          );
        })}

        {/* Seal */}
        <div style={{
          width: 70, height: 70, borderRadius: "50%",
          background: `linear-gradient(135deg, ${course.color}30, ${course.color}10)`,
          border: `2px solid ${course.color}60`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 34, boxShadow: `0 0 28px ${course.glow}`,
        }}>
          {course.icon}
        </div>

        {/* Header text */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", color: course.color, textTransform: "uppercase", marginBottom: 8 }}>
            Certificate of Completion
          </div>
          <div style={{ fontSize: 10, fontFamily: "monospace", color: "#475569", letterSpacing: "0.08em" }}>
            This certifies that
          </div>
        </div>

        {/* Student name */}
        <div style={{
          fontSize: 22, fontFamily: "monospace", fontWeight: "bold",
          color: "#f1f5f9", textAlign: "center", letterSpacing: "0.04em",
          padding: "2px 16px",
          borderBottom: `1px solid ${course.color}40`,
          paddingBottom: 12,
        }}>
          {progress.studentName || "Student"}
        </div>

        {/* Body */}
        <div style={{ textAlign: "center", maxWidth: 280, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", letterSpacing: "0.04em" }}>
            has successfully completed
          </div>
          <div style={{ fontSize: 15, fontFamily: "monospace", fontWeight: "bold", color: course.color, letterSpacing: "0.05em" }}>
            {course.title}: {course.subtitle}
          </div>
          <div style={{ fontSize: 10, fontFamily: "monospace", color: "#475569", lineHeight: 1.65, marginTop: 4 }}>
            {course.certBody}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontFamily: "monospace", fontWeight: "bold", color: course.color }}>{progress.totalXP}</div>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>XP Earned</div>
          </div>
          <div style={{ width: 1, background: `${course.color}30` }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontFamily: "monospace", fontWeight: "bold", color: course.color }}>{course.modules.length}</div>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>Modules</div>
          </div>
          <div style={{ width: 1, background: `${course.color}30` }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontFamily: "monospace", fontWeight: "bold", color: course.color }}>
              {course.modules.reduce((s, m) => s + m.lessons.length, 0)}
            </div>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>Lessons</div>
          </div>
        </div>

        {/* Date + cert ID */}
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <div style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b" }}>{completionDate}</div>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", marginTop: 4, letterSpacing: "0.06em" }}>
            {progress.certificateId}
          </div>
        </div>

        {/* NAVI badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <NaviOrb size={18} />
          <span style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Issued by NAVI · Springer Industries
          </span>
        </div>
      </div>

      {/* Copy button */}
      <button
        onClick={copied}
        style={{
          marginTop: 16, padding: "11px", borderRadius: 14, cursor: "pointer",
          background: `${course.color}14`, border: `1px solid ${course.color}40`,
          color: course.color, fontFamily: "monospace", fontSize: 12, fontWeight: "bold",
          letterSpacing: "0.06em",
        }}
      >
        Copy Certificate Details
      </button>
    </div>
  );
}

// ── NAVI-guided lesson chat ───────────────────────────────────────────────────

const HFREE_COUNTDOWN_S = 5;

function GuidedLesson({ lesson, module: mod, course, progress, onComplete, onBack }) {
  const alreadyDone   = !!progress.lessons[lesson.id]?.completedAt;
  const priorResponse = progress.lessons[lesson.id]?.taskResponse ?? "";
  const isKids        = course.id === "stem";

  const buildIntro = () => {
    const bullets  = lesson.objectives.map((o) => `• ${o.text}`).join("\n");
    if (isKids) {
      return `🔬 Let's explore "${lesson.title}"!\n\nBy the end, you'll be able to:\n${bullets}\n\nLet's start — do you have any idea what this topic means?`;
    }
    const numbered = lesson.objectives.map((o, i) => `${i + 1}. ${o.text}`).join("\n");
    return `${lesson.title}\n\nIn this session:\n${numbered}\n\nGive me your baseline — have you worked with this concept in your current role?`;
  };

  // ── Core chat state ───────────────────────────────────────────────────────
  const [messages,    setMessages]    = useState(() => [{ role: "navi", content: buildIntro() }]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [lessonDone,  setLessonDone]  = useState(false);
  const endRef = useRef(null);

  // ── Assist / Hands-Free state ─────────────────────────────────────────────
  const [handsFree,       setHandsFree]       = useState(false);
  const [suggestion,      setSuggestion]      = useState(null); // string | null
  const [countdownActive, setCountdownActive] = useState(false);
  const timersRef = useRef([]);

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Send — accepts optional override text (used by auto-send) ────────────
  const send = async (overrideText) => {
    const text = (overrideText !== undefined ? overrideText : input).trim();
    if (!text || loading || lessonDone) return;

    setSuggestion(null);
    clearTimers();
    setCountdownActive(false);

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/lesson-chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          lesson:   { title: lesson.title, objectives: lesson.objectives, concepts: lesson.concepts, task: lesson.task },
          courseType:  course.id,
          studentName: progress.studentName,
        }),
      });
      const data = await res.json();
      if (data.content) {
        setMessages((prev) => [...prev, { role: "navi", content: data.content }]);
        if (!data.complete && data.suggestion) setSuggestion(data.suggestion);
        if (data.complete) {
          setLessonDone(true);
          setSuggestion(null);
          clearTimers();
          setTimeout(() => onComplete(lesson, text), 1500);
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "navi", content: "Connection issue — try sending again." }]);
    } finally {
      setLoading(false);
    }
  };

  // Stable ref so timer callbacks always call the latest send closure
  const sendRef = useRef(send);
  sendRef.current = send;

  // ── Hands-Free auto-send effect ───────────────────────────────────────────
  useEffect(() => {
    if (!suggestion || !handsFree || loading || lessonDone) {
      if (!suggestion) { clearTimers(); setCountdownActive(false); }
      return;
    }
    clearTimers();

    // 1. NAVI announces intent
    const t1 = setTimeout(() => {
      setMessages((prev) => [...prev, {
        role: "navi",
        content: isKids
          ? "🤖 I'll answer this for you! Tap Override anytime to take control."
          : "✨ I'll select a response for you — tap Override to take control.",
      }]);
    }, 600);

    // 2. Start visual countdown bar
    const t2 = setTimeout(() => setCountdownActive(true), 950);

    // 3. Auto-send after countdown
    const t3 = setTimeout(() => {
      setCountdownActive(false);
      sendRef.current(suggestion);
    }, 950 + HFREE_COUNTDOWN_S * 1000);

    timersRef.current = [t1, t2, t3];
    return () => clearTimers();
  }, [suggestion, handsFree]); // eslint-disable-line react-hooks/exhaustive-deps

  // Typing in the textarea cancels any active countdown
  const handleInput = (e) => {
    setInput(e.target.value);
    if (countdownActive) { clearTimers(); setCountdownActive(false); setSuggestion(null); }
  };

  // Toggle Hands-Free mode
  const toggleHandsFree = () => {
    const next = !handsFree;
    setHandsFree(next);
    if (!next) {
      clearTimers(); setCountdownActive(false); setSuggestion(null);
    } else {
      setMessages((prev) => [...prev, {
        role: "navi",
        content: isKids
          ? "🤖 Hands-Free Mode ON! I'll guide your answers — override anytime!"
          : "✓ Hands-Free Mode enabled. I'll progress the lesson for you. Override anytime.",
      }]);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ── Shared lesson header ──────────────────────────────────────────────────
  const lessonHeader = (
    <div style={{ padding: "0 16px", flexShrink: 0 }}>
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 4, padding: "12px 0",
          background: "none", border: "none", cursor: "pointer",
          fontSize: 11, fontFamily: "monospace", color: "#64748b",
        }}
      >
        ← Module {mod.number}: {mod.title}
      </button>
      <div style={{
        background: `${mod.color}0c`, border: `1px solid ${mod.color}25`,
        borderRadius: 16, padding: "14px", marginBottom: 12,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: `${mod.color}18`, border: `1px solid ${mod.color}35`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>
            {alreadyDone ? "✅" : mod.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 5 }}>
              <span style={{
                fontSize: 9, fontFamily: "monospace", letterSpacing: "0.14em",
                textTransform: "uppercase", padding: "2px 7px", borderRadius: 99,
                background: `${mod.color}18`, border: `1px solid ${mod.color}35`, color: mod.color,
              }}>
                Mod {mod.number} · Lesson {lesson.id.split("-")[1]}
              </span>
              <span style={{
                fontSize: 9, fontFamily: "monospace", padding: "2px 7px", borderRadius: 99,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569",
              }}>
                ⏱ {lesson.duration}
              </span>
              <span style={{
                fontSize: 9, fontFamily: "monospace", padding: "2px 7px", borderRadius: 99,
                background: `${mod.color}14`, border: `1px solid ${mod.color}30`, color: mod.color,
              }}>
                +{lesson.xp} XP
              </span>
              {alreadyDone && (
                <span style={{
                  fontSize: 9, fontFamily: "monospace", padding: "2px 7px", borderRadius: 99,
                  background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399",
                }}>Complete</span>
              )}
            </div>
            <div style={{ fontSize: 14, fontFamily: "monospace", fontWeight: "bold", color: "#f1f5f9" }}>
              {lesson.title}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Already completed — read-only view ────────────────────────────────────
  if (alreadyDone) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {lessonHeader}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 40px" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 14 }}>
            <NaviOrb size={26} />
            <div style={{
              flex: 1, padding: "10px 13px", borderRadius: "14px 14px 14px 4px",
              background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)",
              fontSize: 12, fontFamily: "monospace", color: "#34d399", lineHeight: 1.65,
            }}>
              ✅ You already completed this lesson — great work!
            </div>
          </div>
          {priorResponse && (
            <div style={{ marginLeft: 34 }}>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                Your submission
              </div>
              <div style={{
                padding: "10px 13px", borderRadius: 12,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                fontSize: 12, fontFamily: "monospace", color: "#64748b", lineHeight: 1.65, whiteSpace: "pre-wrap",
              }}>
                {priorResponse}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Active chat ───────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {lessonHeader}

      {/* Message list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((msg, i) =>
          msg.role === "navi" ? (
            <div key={i} className="msg-enter" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <NaviOrb size={26} />
              <div style={{
                maxWidth: "85%", padding: "10px 13px",
                borderRadius: "14px 14px 14px 4px",
                background: `${mod.color}09`, border: `1px solid ${mod.color}22`,
                fontSize: 12, fontFamily: "monospace", color: "#cbd5e1",
                lineHeight: 1.65, whiteSpace: "pre-wrap",
              }}>
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={i} className="msg-enter" style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{
                maxWidth: "80%", padding: "10px 13px",
                borderRadius: "14px 14px 4px 14px",
                background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.1)",
                fontSize: 12, fontFamily: "monospace", color: "#e2e8f0",
                lineHeight: 1.65, whiteSpace: "pre-wrap",
              }}>
                {msg.content}
              </div>
            </div>
          )
        )}

        {/* NAVI typing indicator */}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <NaviOrb size={26} />
            <div style={{
              padding: "12px 16px", borderRadius: "14px 14px 14px 4px",
              background: `${mod.color}09`, border: `1px solid ${mod.color}22`,
              display: "flex", gap: 5, alignItems: "center",
            }}>
              <div className="typing-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: mod.color }} />
              <div className="typing-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: mod.color }} />
              <div className="typing-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: mod.color }} />
            </div>
          </div>
        )}

        {/* Completion banner */}
        {lessonDone && (
          <div style={{
            padding: "10px 14px", borderRadius: 12, textAlign: "center",
            background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.25)",
            fontSize: 11, fontFamily: "monospace", color: "#34d399",
          }}>
            ✅ Lesson complete — saving progress...
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ── NAVI Suggestion bubble (pinned above input) ── */}
      {suggestion && !lessonDone && !loading && (
        <div style={{
          flexShrink: 0, padding: "6px 16px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          animation: "stemFadeUp 0.3s ease forwards",
        }}>
          <div style={{
            padding: "10px 12px", borderRadius: 12,
            background: `${mod.color}0a`,
            border: `1px solid ${countdownActive ? mod.color + "65" : mod.color + "28"}`,
            boxShadow: countdownActive ? `0 0 20px ${mod.glow}` : `0 0 8px ${mod.glow}25`,
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <NaviOrb size={16} />
                <span style={{
                  fontSize: 9, fontFamily: "monospace", color: mod.color,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                }}>
                  {countdownActive ? "Auto-selecting…" : "NAVI Suggestion"}
                </span>
              </div>
              <button
                onClick={() => { clearTimers(); setCountdownActive(false); setSuggestion(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#334155", padding: "2px 6px", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Suggestion text — highlighted */}
            <div style={{
              fontSize: 12, fontFamily: "monospace", color: "#94a3b8",
              lineHeight: 1.55, padding: "7px 9px", borderRadius: 8, fontStyle: "italic",
              background: `${mod.color}07`, border: `1px solid ${mod.color}16`,
              marginBottom: 8,
            }}>
              "{suggestion}"
            </div>

            {/* Countdown progress bar */}
            {countdownActive && (
              <div style={{ height: 2, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.06)", marginBottom: 8 }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: `linear-gradient(90deg, ${mod.color}, ${mod.color}88)`,
                  boxShadow: `0 0 6px ${mod.glow}`,
                  animation: `countdownBar ${HFREE_COUNTDOWN_S}s linear forwards`,
                }} />
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 7 }}>
              {countdownActive && (
                <button
                  onClick={() => { clearTimers(); setCountdownActive(false); setSuggestion(null); }}
                  style={{
                    flex: 1, padding: "7px 8px", borderRadius: 8, cursor: "pointer",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.28)",
                    color: "#f87171", fontFamily: "monospace", fontSize: 11, fontWeight: "bold",
                  }}
                >
                  Override ×
                </button>
              )}
              <button
                onClick={() => {
                  const t = suggestion;
                  clearTimers(); setCountdownActive(false); setSuggestion(null);
                  sendRef.current(t);
                }}
                style={{
                  flex: countdownActive ? 1 : 2,
                  padding: "7px 8px", borderRadius: 8, cursor: "pointer",
                  background: `${mod.color}18`, border: `1px solid ${mod.color}45`,
                  color: mod.color, fontFamily: "monospace", fontSize: 11, fontWeight: "bold",
                }}
              >
                Use this →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Input area ── */}
      {!lessonDone && (
        <div style={{ flexShrink: 0, padding: "8px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              placeholder={isKids ? "Type your answer... (Enter to send)" : "Your response... (Enter to send, Shift+Enter for new line)"}
              rows={2}
              disabled={loading}
              autoFocus
              style={{
                flex: 1, resize: "none", fontFamily: "monospace", fontSize: 12,
                color: "#e2e8f0", background: "rgba(255,255,255,0.03)",
                border: `1px solid ${input.trim() ? mod.color + "45" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 12, padding: "9px 12px", caretColor: mod.color,
                lineHeight: 1.6, outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s ease",
                opacity: loading ? 0.5 : 1,
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: input.trim() && !loading ? `${mod.color}20` : "rgba(255,255,255,0.03)",
                border: `1px solid ${input.trim() && !loading ? mod.color + "55" : "rgba(255,255,255,0.07)"}`,
                color: input.trim() && !loading ? mod.color : "#334155",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: input.trim() && !loading ? `0 0 10px ${mod.glow}` : "none",
                transition: "all 0.2s ease",
              }}
            >
              ↑
            </button>
          </div>

          {/* Footer: Hands-Free toggle + branding */}
          <div style={{ marginTop: 5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

            {/* Hands-Free Mode toggle */}
            <button
              onClick={toggleHandsFree}
              style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {/* Toggle pill */}
              <div style={{
                width: 28, height: 15, borderRadius: 99, position: "relative",
                background: handsFree ? `${mod.color}35` : "rgba(255,255,255,0.06)",
                border: `1px solid ${handsFree ? mod.color + "55" : "rgba(255,255,255,0.1)"}`,
                transition: "all 0.2s ease",
              }}>
                <div style={{
                  position: "absolute", top: 2, width: 9, height: 9, borderRadius: "50%",
                  background: handsFree ? mod.color : "#334155",
                  left: handsFree ? "calc(100% - 11px)" : 2,
                  transition: "left 0.2s ease, background 0.2s ease",
                  boxShadow: handsFree ? `0 0 5px ${mod.glow}` : "none",
                }} />
              </div>
              <span style={{
                fontSize: 9, fontFamily: "monospace",
                color: handsFree ? mod.color : "#334155",
                letterSpacing: "0.08em", transition: "color 0.2s ease",
              }}>
                Hands-Free
              </span>
            </button>

            <div style={{ fontSize: 9, fontFamily: "monospace", color: "#1e293b" }}>
              NAVI · AI-guided
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main CoursePanel ──────────────────────────────────────────────────────────

export default function CoursePanel({ course, studentName, onClose, onLessonComplete }) {
  const [progress, setProgress] = useState(null);
  const [view, setView] = useState("overview"); // "overview" | "lesson" | "cert"
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [justUnlocked, setJustUnlocked] = useState(null);

  // Load or init progress
  useEffect(() => {
    const saved = loadCourseProgress(course.id);
    if (saved) {
      setProgress(saved);
    } else {
      const fresh = initCourseProgress(course.id, studentName || "");
      setProgress(fresh);
      saveCourseProgress(fresh);
    }
  }, [course.id, studentName]);

  // Sync studentName if it updates after load
  useEffect(() => {
    if (progress && studentName && progress.studentName !== studentName) {
      const updated = { ...progress, studentName };
      setProgress(updated);
      saveCourseProgress(updated);
    }
  }, [studentName, progress]);

  const handleLessonClick = (lesson, mod) => {
    if (!progress) return;
    if (!isLessonUnlocked(course, lesson.id, progress)) return;
    setActiveLesson(lesson);
    setActiveModule(mod);
    setView("lesson");
  };

  const handleLessonComplete = (lesson, taskResponse) => {
    if (!progress) return;
    let updated = completeLesson(progress, lesson.id, taskResponse, lesson.xp);

    // Check module completion bonus
    const mod = course.modules.find((m) => m.lessons.some((l) => l.id === lesson.id));
    if (mod && mod.lessons.every((l) => !!updated.lessons[l.id]?.completedAt)) {
      updated = { ...updated, totalXP: updated.totalXP + mod.completionXP };
      onLessonComplete?.(mod.completionXP, `Module ${mod.number}: ${mod.title}`);
    }

    // Check course completion
    if (isCourseComplete(course, updated)) {
      updated = finalizeCourse(course, updated);
      onLessonComplete?.(course.completionXP, `${course.title} — Complete!`);
    }

    setProgress(updated);
    saveCourseProgress(updated);
    onLessonComplete?.(lesson.xp, lesson.title);
    setJustUnlocked(lesson.id);
    setView("overview");

    setTimeout(() => setJustUnlocked(null), 2000);
  };

  if (!progress) return null;

  const percent = getPercentComplete(course, progress);
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const completedCount = course.modules.reduce(
    (s, m) => s + m.lessons.filter((l) => !!progress.lessons[l.id]?.completedAt).length, 0
  );
  const courseComplete = isCourseComplete(course, progress);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(4,4,12,0.98)", backdropFilter: "blur(14px)" }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 16px", flexShrink: 0,
        borderBottom: `1px solid ${course.color}28`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: `${course.color}22`, border: `1px solid ${course.color}50`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: `0 0 14px ${course.glow}`,
          }}>
            {course.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: "bold", color: "#f1f5f9", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {course.title}
            </div>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#475569" }}>
              {completedCount}/{totalLessons} lessons · {progress.totalXP} XP · {percent}%
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close course"
          style={{
            width: 32, height: 32, borderRadius: 12, flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
            color: "#64748b", cursor: "pointer", fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✕</button>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ height: 2, flexShrink: 0, background: "rgba(255,255,255,0.05)" }}>
        <div style={{
          height: "100%", transition: "width 0.6s ease",
          width: `${percent}%`,
          background: `linear-gradient(90deg, ${course.color}, ${course.color}aa)`,
          boxShadow: `0 0 8px ${course.glow}`,
        }} />
      </div>

      {/* ── Views ── */}
      {view === "cert" && (
        <Certificate
          course={course}
          progress={progress}
          onBack={() => setView("overview")}
        />
      )}

      {view === "lesson" && activeLesson && activeModule && (
        <GuidedLesson
          lesson={activeLesson}
          module={activeModule}
          course={course}
          progress={progress}
          onComplete={handleLessonComplete}
          onBack={() => setView("overview")}
        />
      )}

      {view === "overview" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px" }}>

          {/* NAVI welcome */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 18 }}>
            <NaviOrb size={30} />
            <div style={{
              flex: 1, padding: "11px 13px", fontSize: 12, fontFamily: "monospace",
              color: "#cbd5e1", lineHeight: 1.65,
              background: `${course.color}07`, border: `1px solid ${course.color}1e`,
              borderRadius: "16px 16px 16px 4px",
            }}>
              {completedCount === 0
                ? `Welcome to ${course.title}! Complete each lesson in order — read the concepts, then submit your task response to earn XP and unlock the next lesson.`
                : courseComplete
                  ? `Course complete! You've earned ${progress.totalXP} XP. View your certificate below.`
                  : `${percent}% complete — ${totalLessons - completedCount} lesson${totalLessons - completedCount !== 1 ? "s" : ""} remaining. Keep going!`
              }
            </div>
          </div>

          {/* Certificate button — shown when course is done */}
          {courseComplete && (
            <button
              onClick={() => setView("cert")}
              style={{
                width: "100%", marginBottom: 18, padding: "14px",
                borderRadius: 16, cursor: "pointer",
                background: `linear-gradient(135deg, ${course.color}20, ${course.color}08)`,
                border: `1px solid ${course.color}55`,
                color: course.color, fontFamily: "monospace", fontSize: 13, fontWeight: "bold",
                letterSpacing: "0.07em",
                boxShadow: `0 0 24px ${course.glow}`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <span>🏆</span>
              <span>View Your Certificate</span>
              <span style={{ opacity: 0.7 }}>→</span>
            </button>
          )}

          {/* Module sections */}
          {course.modules.map((mod, modIdx) => {
            const modDone = isModuleComplete(mod, progress);
            const modLessonsDone = mod.lessons.filter((l) => !!progress.lessons[l.id]?.completedAt).length;
            const allPrevModsDone = modIdx === 0 || course.modules.slice(0, modIdx).every((m) => isModuleComplete(m, progress));

            return (
              <div key={mod.id} style={{ marginBottom: 20 }}>
                {/* Module header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
                  padding: "10px 12px", borderRadius: 12,
                  background: modDone
                    ? `${mod.color}0c`
                    : allPrevModsDone ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.01)",
                  border: `1px solid ${modDone ? mod.color + "30" : "rgba(255,255,255,0.06)"}`,
                  opacity: allPrevModsDone ? 1 : 0.4,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: modDone ? `${mod.color}22` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${modDone ? mod.color + "40" : "rgba(255,255,255,0.08)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>
                    {allPrevModsDone ? mod.icon : "🔒"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: mod.color, opacity: 0.75 }}>
                        Module {mod.number}
                      </span>
                      {modDone && (
                        <span style={{
                          fontSize: 9, fontFamily: "monospace", padding: "1px 6px", borderRadius: 99,
                          background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399",
                        }}>Complete</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontFamily: "monospace", fontWeight: "bold", color: allPrevModsDone ? "#e2e8f0" : "#475569" }}>
                      {mod.title}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: "#475569", flexShrink: 0 }}>
                    {modLessonsDone}/{mod.lessons.length}
                  </div>
                </div>

                {/* Lesson cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}>
                  {mod.lessons.map((lesson, lessonIdx) => {
                    const allLessons = course.modules.flatMap((m) => m.lessons);
                    const globalIdx = allLessons.findIndex((l) => l.id === lesson.id);
                    const unlocked = isLessonUnlocked(course, lesson.id, progress);
                    const done = !!progress.lessons[lesson.id]?.completedAt;
                    const fresh = justUnlocked === lesson.id;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => unlocked && handleLessonClick(lesson, mod)}
                        disabled={!unlocked}
                        style={{
                          textAlign: "left", cursor: unlocked ? "pointer" : "not-allowed",
                          padding: "10px 13px", borderRadius: 12,
                          background: done
                            ? `${mod.color}0a`
                            : unlocked ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.01)",
                          border: `1px solid ${done ? mod.color + "28" : unlocked ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)"}`,
                          opacity: unlocked ? 1 : 0.35,
                          transition: "all 0.2s ease",
                          boxShadow: fresh ? `0 0 18px ${mod.glow}` : "none",
                          display: "flex", alignItems: "center", gap: 10,
                        }}
                      >
                        {/* Status icon */}
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                          background: done ? `${mod.color}20` : unlocked ? "rgba(255,255,255,0.05)" : "transparent",
                          border: `1px solid ${done ? mod.color + "40" : unlocked ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: done ? 12 : 9,
                          color: done ? mod.color : "#475569",
                        }}>
                          {done ? "✓" : unlocked ? `${modIdx + 1}.${lessonIdx + 1}` : "🔒"}
                        </div>

                        {/* Lesson info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: done ? 400 : 500, color: unlocked ? "#cbd5e1" : "#334155", lineHeight: 1.3 }}>
                            {lesson.title}
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                            <span style={{ fontSize: 9, fontFamily: "monospace", color: "#334155" }}>⏱ {lesson.duration}</span>
                          </div>
                        </div>

                        {/* XP badge */}
                        <span style={{
                          fontSize: 10, fontFamily: "monospace", padding: "2px 7px", borderRadius: 99, flexShrink: 0,
                          background: done ? `${mod.color}18` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${done ? mod.color + "30" : "rgba(255,255,255,0.07)"}`,
                          color: done ? mod.color : "#334155",
                        }}>
                          +{lesson.xp} XP
                        </span>

                        {unlocked && !done && (
                          <span style={{ color: "#334155", fontSize: 12, flexShrink: 0 }}>›</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Course info footer */}
          <div style={{
            marginTop: 8, padding: "12px 14px", borderRadius: 14,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
            display: "flex", flexWrap: "wrap", gap: 16,
          }}>
            {[
              { label: "Audience", value: course.audience },
              { label: "Duration", value: course.duration },
              { label: "Total XP", value: `${course.modules.reduce((s, m) => s + m.lessons.reduce((ls, l) => ls + l.xp, 0) + m.completionXP, 0) + course.completionXP} XP available` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
