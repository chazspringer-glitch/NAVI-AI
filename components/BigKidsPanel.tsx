"use client";

import { useState, useCallback } from "react";

const SUBJECTS = [
  { id: "math",     label: "Math",            icon: "🔢", color: "#00d4ff", desc: "Numbers, counting, and puzzles" },
  { id: "reading",  label: "Reading",         icon: "📖", color: "#34d399", desc: "Stories, words, and comprehension" },
  { id: "life",     label: "Life Skills",     icon: "🌟", color: "#f59e0b", desc: "Money, time, and everyday smarts" },
  { id: "problem",  label: "Problem Solving", icon: "🧩", color: "#a855f7", desc: "Logic, patterns, and critical thinking" },
];

// ── Math quest generator ────────────────────────────────────────────────────
type MathOp = "+" | "−" | "×";

function generateMathProblem(difficulty: number): { question: string; answer: number; choices: number[] } {
  const ops: MathOp[] = difficulty <= 1 ? ["+", "−"] : ["+", "−", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;

  if (difficulty <= 1) {
    a = Math.floor(Math.random() * 10) + 1;
    b = Math.floor(Math.random() * 10) + 1;
  } else if (difficulty <= 2) {
    a = Math.floor(Math.random() * 20) + 5;
    b = Math.floor(Math.random() * 15) + 1;
  } else {
    a = Math.floor(Math.random() * 50) + 10;
    b = Math.floor(Math.random() * 20) + 2;
  }

  if (op === "+") answer = a + b;
  else if (op === "−") { if (b > a) { const t = a; a = b; b = t; } answer = a - b; }
  else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; answer = a * b; }

  // Generate 3 wrong choices close to the answer
  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrong = answer + (offset === 0 ? 1 : offset);
    if (wrong !== answer && wrong >= 0) wrongSet.add(wrong);
  }
  const choices = [...Array.from(wrongSet), answer].sort(() => Math.random() - 0.5);

  return { question: `${a} ${op} ${b} = ?`, answer, choices };
}

const ENCOURAGEMENTS = [
  "🎉 Awesome job!", "⭐ You got it!", "🔥 On fire!", "💪 Nice work!",
  "🚀 Brilliant!", "✨ Perfect!", "🏆 Champion!", "👏 Way to go!",
];
const TRYAGAINS = [
  "Almost! Try again 💪", "So close! One more shot 🎯", "Not quite — you got this! 🌟", "Keep going! 🚀",
];

export default function BigKidsPanel({ onClose }: { onClose: () => void }) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Math quest state
  const [mathDifficulty, setMathDifficulty] = useState(1);
  const [mathProblem, setMathProblem] = useState<ReturnType<typeof generateMathProblem> | null>(null);
  const [mathFeedback, setMathFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [mathScore, setMathScore] = useState(0);
  const [mathStreak, setMathStreak] = useState(0);
  const [mathTotal, setMathTotal] = useState(0);

  const startMath = useCallback(() => {
    setMathProblem(generateMathProblem(mathDifficulty));
    setMathFeedback(null);
  }, [mathDifficulty]);

  const checkMathAnswer = (choice: number) => {
    if (!mathProblem || mathFeedback) return;
    const correct = choice === mathProblem.answer;
    if (correct) {
      const pts = mathDifficulty * 10;
      setMathScore((s) => s + pts);
      setMathStreak((s) => s + 1);
      setMathFeedback({ correct: true, message: ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)] + ` +${pts} XP` });
      // Auto-level up after 3 streak
      if (mathStreak + 1 >= 3 && mathDifficulty < 3) {
        setMathDifficulty((d) => d + 1);
        setMathStreak(0);
      }
    } else {
      setMathStreak(0);
      setMathFeedback({ correct: false, message: TRYAGAINS[Math.floor(Math.random() * TRYAGAINS.length)] });
    }
    setMathTotal((t) => t + 1);
  };

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

              {/* ── Math Quests ─────────────────────────────────────────── */}
              {selectedSubject === "math" && (
                <>
                  {/* Difficulty + score bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.10)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 9, color: "#64748b" }}>Level</div>
                      <div style={{ display: "flex", gap: 3 }}>
                        {[1, 2, 3].map((lv) => (
                          <div key={lv} style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: lv <= mathDifficulty ? "#00d4ff" : "rgba(255,255,255,0.08)",
                          }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#00d4ff", fontWeight: 700 }}>⭐ {mathScore} XP</div>
                    {mathStreak > 0 && (
                      <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700 }}>🔥 {mathStreak} streak</div>
                    )}
                  </div>

                  {!mathProblem ? (
                    <button onClick={startMath} style={{
                      width: "100%", padding: "20px", borderRadius: 16, cursor: "pointer",
                      background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(168,85,247,0.06))",
                      border: "2px solid rgba(0,212,255,0.25)",
                      fontFamily: "monospace", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🔢</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#00d4ff" }}>Start Math Quest!</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
                        Level {mathDifficulty} · {mathDifficulty === 1 ? "Easy" : mathDifficulty === 2 ? "Medium" : "Hard"}
                      </div>
                    </button>
                  ) : (
                    <div style={{
                      padding: "24px 16px", borderRadius: 18, textAlign: "center",
                      background: "linear-gradient(160deg, rgba(16,16,28,0.95) 0%, rgba(10,10,20,0.95) 100%)",
                      border: `2px solid ${mathFeedback ? (mathFeedback.correct ? "#34d39960" : "#f8717160") : "#00d4ff30"}`,
                    }}>
                      {/* Problem */}
                      <div style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", marginBottom: 20, letterSpacing: "0.05em" }}>
                        {mathProblem.question}
                      </div>

                      {/* Choice buttons */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                        {mathProblem.choices.map((c) => {
                          let bg = "rgba(255,255,255,0.04)";
                          let border = "1px solid rgba(255,255,255,0.10)";
                          let color = "#f1f5f9";
                          if (mathFeedback) {
                            if (c === mathProblem!.answer) { bg = "rgba(52,211,153,0.15)"; border = "1px solid #34d399"; color = "#34d399"; }
                            else if (!mathFeedback.correct) { bg = "rgba(248,113,113,0.08)"; border = "1px solid rgba(248,113,113,0.20)"; color = "#64748b"; }
                          }
                          return (
                            <button key={c} onClick={() => checkMathAnswer(c)} disabled={!!mathFeedback}
                              style={{
                                padding: "16px", borderRadius: 14, cursor: mathFeedback ? "default" : "pointer",
                                background: bg, border, fontFamily: "monospace",
                                fontSize: 20, fontWeight: 700, color,
                              }}>
                              {c}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback */}
                      {mathFeedback && (
                        <div style={{
                          fontSize: 14, fontWeight: 700, marginBottom: 14,
                          color: mathFeedback.correct ? "#34d399" : "#f87171",
                        }}>
                          {mathFeedback.message}
                        </div>
                      )}

                      {/* Next button */}
                      {mathFeedback && (
                        <button onClick={startMath} style={{
                          padding: "12px 28px", borderRadius: 12,
                          background: "linear-gradient(135deg, #00d4ff, #0891b2)",
                          border: "none", color: "#08080f",
                          fontSize: 13, fontWeight: 700, fontFamily: "monospace", cursor: "pointer",
                        }}>
                          Next Problem →
                        </button>
                      )}
                    </div>
                  )}

                  {mathTotal > 0 && (
                    <div style={{ textAlign: "center", fontSize: 9, color: "#64748b" }}>
                      {mathTotal} problems attempted · Level {mathDifficulty}
                    </div>
                  )}
                </>
              )}

              {/* Placeholder for other subjects (Parts 3+) */}
              {selectedSubject !== "math" && (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🚀</div>
                  <div style={{ fontSize: 12, color: subj.color, fontWeight: 700 }}>Quests loading soon!</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Interactive {subj.label.toLowerCase()} challenges are on the way.</div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
