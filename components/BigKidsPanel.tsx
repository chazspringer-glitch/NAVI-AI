"use client";

import { useState, useCallback, useRef } from "react";

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

// ── Reading quest content ───────────────────────────────────────────────────
const READING_PASSAGES = [
  {
    title: "The Clever Fox",
    text: "A fox saw grapes hanging high on a vine. She jumped and jumped but couldn't reach them. Finally, she walked away saying, \"Those grapes are probably sour anyway.\" Sometimes when we can't get what we want, we pretend we didn't want it.",
    question: "Why did the fox say the grapes were sour?",
    choices: ["She tasted them", "She couldn't reach them", "Someone told her", "They were green"],
    answer: 1,
    difficulty: 1,
  },
  {
    title: "Water Cycle",
    text: "Water moves in a cycle. The sun heats water in oceans and lakes, turning it into vapor that rises into the sky. Up high, the vapor cools and forms clouds. When clouds get heavy with water, it falls back down as rain or snow. Then the cycle starts again.",
    question: "What makes water turn into vapor?",
    choices: ["The moon", "The wind", "The sun's heat", "The clouds"],
    answer: 2,
    difficulty: 1,
  },
  {
    title: "Ruby Bridges",
    text: "In 1960, six-year-old Ruby Bridges became the first Black child to attend an all-white elementary school in the South. Federal marshals walked her to school every day because angry crowds gathered outside. Ruby was brave and never missed a day of school that year.",
    question: "Why did federal marshals walk Ruby to school?",
    choices: ["She was late", "The school was far away", "Angry crowds gathered outside", "Her parents asked them to"],
    answer: 2,
    difficulty: 2,
  },
  {
    title: "Saving Money",
    text: "Marcus gets $5 allowance every week. He wants to buy a basketball that costs $25. If he saves his entire allowance, he'll have enough in 5 weeks. But Marcus also wants snacks. He decides to save $3 each week and spend $2 on snacks. Now it will take longer, but he's learning to balance wants and needs.",
    question: "How many weeks will it take Marcus to buy the basketball if he saves $3 per week?",
    choices: ["5 weeks", "7 weeks", "9 weeks", "10 weeks"],
    answer: 2,
    difficulty: 2,
  },
  {
    title: "Photosynthesis",
    text: "Plants make their own food through a process called photosynthesis. They use sunlight, water from the soil, and carbon dioxide from the air. Inside their leaves, these ingredients combine to create glucose — a type of sugar that gives the plant energy. Oxygen is released as a byproduct, which is what we breathe.",
    question: "What do plants produce that humans need to breathe?",
    choices: ["Carbon dioxide", "Glucose", "Water", "Oxygen"],
    answer: 3,
    difficulty: 3,
  },
  {
    title: "The Underground Railroad",
    text: "The Underground Railroad wasn't a real railroad — it was a secret network of safe houses and routes that helped enslaved people escape to freedom before the Civil War. Brave people called \"conductors\" guided travelers at night, using the North Star for direction. Harriet Tubman was the most famous conductor, making 13 trips and freeing about 70 people.",
    question: "What did conductors on the Underground Railroad use for direction at night?",
    choices: ["A compass", "A map", "The North Star", "Lanterns"],
    answer: 2,
    difficulty: 3,
  },
];

// ── Daily missions ──────────────────────────────────────────────────────────
const ALL_MISSIONS = [
  { id: "math3",    label: "Solve 3 math problems",         icon: "🔢", xp: 20, subject: "math",    target: 3 },
  { id: "math5",    label: "Solve 5 math problems",         icon: "🔢", xp: 35, subject: "math",    target: 5 },
  { id: "read2",    label: "Read 2 stories",                icon: "📖", xp: 25, subject: "reading", target: 2 },
  { id: "read3",    label: "Read 3 stories",                icon: "📖", xp: 40, subject: "reading", target: 3 },
  { id: "streak3",  label: "Get a 3-problem math streak",   icon: "🔥", xp: 30, subject: "math",    target: 3 },
  { id: "xp50",     label: "Earn 50 XP today",              icon: "⭐", xp: 15, subject: "any",     target: 50 },
  { id: "xp100",    label: "Earn 100 XP today",             icon: "💪", xp: 25, subject: "any",     target: 100 },
  { id: "try2",     label: "Try 2 different subjects",       icon: "🎯", xp: 20, subject: "any",     target: 2 },
];

function getDailyMissions(): typeof ALL_MISSIONS {
  // Pick 3 missions deterministically based on the date so they're the same all day
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const shuffled = [...ALL_MISSIONS].sort((a, b) => {
    const ha = ((seed * 31 + a.id.charCodeAt(0)) % 1000) / 1000;
    const hb = ((seed * 31 + b.id.charCodeAt(0)) % 1000) / 1000;
    return ha - hb;
  });
  return shuffled.slice(0, 3);
}

const LS_KEY_MISSIONS = "navi-bigkids-missions";

interface MissionProgress {
  date: string; // YYYY-MM-DD
  completed: string[]; // mission ids
  mathCount: number;
  readCount: number;
  xpToday: number;
  subjectsUsed: string[];
}

function loadMissionProgress(): MissionProgress {
  const today = new Date().toISOString().slice(0, 10);
  if (typeof window === "undefined") return { date: today, completed: [], mathCount: 0, readCount: 0, xpToday: 0, subjectsUsed: [] };
  try {
    const raw = localStorage.getItem(LS_KEY_MISSIONS);
    if (raw) {
      const parsed = JSON.parse(raw) as MissionProgress;
      if (parsed.date === today) return parsed;
    }
  } catch { /* ignore */ }
  return { date: today, completed: [], mathCount: 0, readCount: 0, xpToday: 0, subjectsUsed: [] };
}

function saveMissionProgress(p: MissionProgress) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_KEY_MISSIONS, JSON.stringify(p)); } catch { /* ignore */ }
}

// ── XP + Level system ───────────────────────────────────────────────────────
const LEVELS = [
  { level: 1,  title: "Beginner",    xpNeeded: 0,    icon: "🌱" },
  { level: 2,  title: "Explorer",    xpNeeded: 50,   icon: "🔍" },
  { level: 3,  title: "Adventurer",  xpNeeded: 150,  icon: "🗺️" },
  { level: 4,  title: "Scholar",     xpNeeded: 300,  icon: "📚" },
  { level: 5,  title: "Hero",        xpNeeded: 500,  icon: "🦸" },
  { level: 6,  title: "Champion",    xpNeeded: 800,  icon: "🏆" },
  { level: 7,  title: "Master",      xpNeeded: 1200, icon: "👑" },
  { level: 8,  title: "Legend",      xpNeeded: 1800, icon: "⭐" },
];

function getLevelInfo(totalXP: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpNeeded) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? LEVELS[i];
      break;
    }
  }
  const xpInLevel = totalXP - current.xpNeeded;
  const xpForNext = next.xpNeeded - current.xpNeeded;
  const progress = xpForNext > 0 ? Math.min(100, Math.round((xpInLevel / xpForNext) * 100)) : 100;
  return { current, next, progress, xpInLevel, xpForNext };
}

const LS_KEY_XP = "navi-bigkids-xp";
function loadSavedXP(): number {
  if (typeof window === "undefined") return 0;
  try { return parseInt(localStorage.getItem(LS_KEY_XP) ?? "0", 10) || 0; } catch { return 0; }
}
function saveXP(xp: number) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_KEY_XP, String(xp)); } catch { /* ignore */ }
}

export default function BigKidsPanel({ onClose }: { onClose: () => void }) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [totalXP, setTotalXP] = useState(() => loadSavedXP());
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null);
  const prevLevelRef = useRef(getLevelInfo(loadSavedXP()).current.level);
  const [missionProgress, setMissionProgress] = useState(() => loadMissionProgress());
  const dailyMissions = getDailyMissions();

  // Centralized XP adder — checks for level-up + updates mission progress
  const addXP = useCallback((pts: number, subject?: string) => {
    setTotalXP((prev) => {
      const next = prev + pts;
      saveXP(next);
      const newLevel = getLevelInfo(next).current.level;
      if (newLevel > prevLevelRef.current) {
        const info = getLevelInfo(next);
        setLevelUpMsg(`🎉 Level ${newLevel} — ${info.current.title}! ${info.current.icon}`);
        setTimeout(() => setLevelUpMsg(null), 3000);
        prevLevelRef.current = newLevel;
      }
      return next;
    });
    // Update mission tracking
    setMissionProgress((prev) => {
      const updated = { ...prev, xpToday: prev.xpToday + pts };
      if (subject === "math") updated.mathCount = prev.mathCount + 1;
      if (subject === "reading") updated.readCount = prev.readCount + 1;
      if (subject && !prev.subjectsUsed.includes(subject)) {
        updated.subjectsUsed = [...prev.subjectsUsed, subject];
      }
      // Check mission completions
      for (const m of getDailyMissions()) {
        if (updated.completed.includes(m.id)) continue;
        let done = false;
        if (m.id.startsWith("math") && m.subject === "math") done = updated.mathCount >= m.target;
        else if (m.id.startsWith("read") && m.subject === "reading") done = updated.readCount >= m.target;
        else if (m.id === "streak3") done = false; // handled separately
        else if (m.id === "xp50") done = updated.xpToday >= 50;
        else if (m.id === "xp100") done = updated.xpToday >= 100;
        else if (m.id === "try2") done = updated.subjectsUsed.length >= 2;
        if (done) {
          updated.completed = [...updated.completed, m.id];
          // Bonus XP for completing mission
          setTotalXP((p) => { const n = p + m.xp; saveXP(n); return n; });
        }
      }
      saveMissionProgress(updated);
      return updated;
    });
  }, []);

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

  // Reading quest state
  const [readingIdx, setReadingIdx] = useState(0);
  const [readingFeedback, setReadingFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [readingScore, setReadingScore] = useState(0);
  const [readingTotal, setReadingTotal] = useState(0);
  const [readingStarted, setReadingStarted] = useState(false);

  const currentPassage = READING_PASSAGES[readingIdx % READING_PASSAGES.length];

  const checkReadingAnswer = (choiceIdx: number) => {
    if (readingFeedback) return;
    const correct = choiceIdx === currentPassage.answer;
    if (correct) {
      const pts = currentPassage.difficulty * 15;
      setReadingScore((s) => s + pts);
      addXP(pts, "reading");
      setReadingFeedback({ correct: true, message: ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)] + ` +${pts} XP` });
    } else {
      setReadingFeedback({ correct: false, message: TRYAGAINS[Math.floor(Math.random() * TRYAGAINS.length)] });
    }
    setReadingTotal((t) => t + 1);
  };

  const nextPassage = () => {
    setReadingIdx((i) => i + 1);
    setReadingFeedback(null);
  };

  const checkMathAnswer = (choice: number) => {
    if (!mathProblem || mathFeedback) return;
    const correct = choice === mathProblem.answer;
    if (correct) {
      const pts = mathDifficulty * 10;
      setMathScore((s) => s + pts);
      addXP(pts, "math");
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

        {/* Level-up celebration */}
        {levelUpMsg && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
            padding: "14px 16px", textAlign: "center",
            background: "linear-gradient(135deg, rgba(0,212,255,0.20), rgba(168,85,247,0.15))",
            borderBottom: "1px solid rgba(0,212,255,0.30)",
            fontSize: 16, fontWeight: 800, color: "#f1f5f9",
            animation: "overlayIn 0.3s ease",
          }}>
            {levelUpMsg}
          </div>
        )}

        {/* Welcome */}
        {!selectedSubject && (() => {
          const lvl = getLevelInfo(totalXP);
          return (
          <>
            {/* XP + Level card */}
            <div style={{
              padding: "16px", borderRadius: 18,
              background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(168,85,247,0.05))",
              border: "1px solid rgba(0,212,255,0.15)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 28 }}>{lvl.current.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9" }}>Level {lvl.current.level} — {lvl.current.title}</div>
                    <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>Total: {totalXP} XP</div>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 8, color: "#64748b" }}>Lv {lvl.current.level}</span>
                  <span style={{ fontSize: 8, color: "#64748b" }}>Lv {lvl.next.level}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{
                    width: `${lvl.progress}%`, height: "100%", borderRadius: 4,
                    background: "linear-gradient(90deg, #00d4ff, #a855f7)",
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <div style={{ fontSize: 8, color: "#475569", textAlign: "center", marginTop: 4 }}>
                  {lvl.xpForNext - lvl.xpInLevel > 0 ? `${lvl.xpForNext - lvl.xpInLevel} XP to next level` : "Max level!"}
                </div>
              </div>
              {/* Welcome message */}
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
                  {totalXP === 0 ? "Hey there, explorer! 👋" : `Welcome back, ${lvl.current.title}! 👋`}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  Pick a subject to start your quest.
                </div>
              </div>
            </div>

            {/* Daily Missions */}
            <div style={{
              padding: "14px 16px", borderRadius: 16,
              background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(201,162,39,0.03))",
              border: "1px solid rgba(245,158,11,0.15)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>🎯 Daily Missions</div>
                <div style={{ fontSize: 8, color: "#64748b" }}>{missionProgress.completed.length}/{dailyMissions.length} done</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dailyMissions.map((m) => {
                  const done = missionProgress.completed.includes(m.id);
                  return (
                    <div key={m.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 10px", borderRadius: 10,
                      background: done ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.02)",
                      border: done ? "1px solid rgba(52,211,153,0.20)" : "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{done ? "✅" : m.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 10, fontWeight: 600,
                          color: done ? "#34d399" : "#e2e8f0",
                          textDecoration: done ? "line-through" : "none",
                        }}>{m.label}</div>
                      </div>
                      <span style={{
                        fontSize: 9, fontWeight: 700,
                        color: done ? "#34d399" : "#f59e0b",
                      }}>+{m.xp} XP</span>
                    </div>
                  );
                })}
              </div>
              {missionProgress.completed.length === dailyMissions.length && (
                <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, fontWeight: 700, color: "#34d399" }}>
                  🎉 All missions complete! Come back tomorrow!
                </div>
              )}
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
          );
        })()}

        {/* Subject selected */}
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

              {/* ── Reading Quests ────────────────────────────────────────── */}
              {selectedSubject === "reading" && (
                <>
                  {/* Score bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.10)" }}>
                    <div style={{ fontSize: 9, color: "#64748b" }}>Story {(readingIdx % READING_PASSAGES.length) + 1} of {READING_PASSAGES.length}</div>
                    <div style={{ fontSize: 10, color: "#34d399", fontWeight: 700 }}>⭐ {readingScore} XP</div>
                  </div>

                  {!readingStarted ? (
                    <button onClick={() => setReadingStarted(true)} style={{
                      width: "100%", padding: "20px", borderRadius: 16, cursor: "pointer",
                      background: "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(168,85,247,0.06))",
                      border: "2px solid rgba(52,211,153,0.25)",
                      fontFamily: "monospace", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📖</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>Start Reading Quest!</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Read stories and answer questions</div>
                    </button>
                  ) : (
                    <div style={{
                      padding: "18px 16px", borderRadius: 18,
                      background: "linear-gradient(160deg, rgba(16,16,28,0.95) 0%, rgba(10,10,20,0.95) 100%)",
                      border: `2px solid ${readingFeedback ? (readingFeedback.correct ? "#34d39960" : "#f8717160") : "#34d39930"}`,
                    }}>
                      {/* Story title */}
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#34d399", marginBottom: 10 }}>
                        📖 {currentPassage.title}
                      </div>

                      {/* Passage text */}
                      <div style={{
                        fontSize: 12, color: "#e2e8f0", lineHeight: 1.8, marginBottom: 16,
                        padding: "12px 14px", borderRadius: 12,
                        background: "rgba(52,211,153,0.04)",
                        border: "1px solid rgba(52,211,153,0.10)",
                      }}>
                        {currentPassage.text}
                      </div>

                      {/* Question */}
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>
                        {currentPassage.question}
                      </div>

                      {/* Choices */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                        {currentPassage.choices.map((c, i) => {
                          let bg = "rgba(255,255,255,0.04)";
                          let border = "1px solid rgba(255,255,255,0.10)";
                          let color = "#f1f5f9";
                          if (readingFeedback) {
                            if (i === currentPassage.answer) { bg = "rgba(52,211,153,0.15)"; border = "1px solid #34d399"; color = "#34d399"; }
                            else if (!readingFeedback.correct) { bg = "rgba(248,113,113,0.06)"; color = "#64748b"; }
                          }
                          return (
                            <button key={i} onClick={() => checkReadingAnswer(i)} disabled={!!readingFeedback}
                              style={{
                                width: "100%", padding: "12px 14px", borderRadius: 12, cursor: readingFeedback ? "default" : "pointer",
                                background: bg, border, fontFamily: "monospace",
                                fontSize: 11, fontWeight: 500, color, textAlign: "left",
                                display: "flex", alignItems: "center", gap: 8,
                              }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", flexShrink: 0 }}>{String.fromCharCode(65 + i)}.</span>
                              {c}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback */}
                      {readingFeedback && (
                        <div style={{ textAlign: "center", marginBottom: 12 }}>
                          <div style={{
                            fontSize: 14, fontWeight: 700,
                            color: readingFeedback.correct ? "#34d399" : "#f87171",
                          }}>
                            {readingFeedback.message}
                          </div>
                        </div>
                      )}

                      {/* Next */}
                      {readingFeedback && (
                        <div style={{ textAlign: "center" }}>
                          <button onClick={nextPassage} style={{
                            padding: "12px 28px", borderRadius: 12,
                            background: "linear-gradient(135deg, #34d399, #10b981)",
                            border: "none", color: "#08080f",
                            fontSize: 13, fontWeight: 700, fontFamily: "monospace", cursor: "pointer",
                          }}>
                            Next Story →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {readingTotal > 0 && (
                    <div style={{ textAlign: "center", fontSize: 9, color: "#64748b" }}>
                      {readingTotal} questions answered
                    </div>
                  )}
                </>
              )}

              {/* Placeholder for other subjects (Parts 4+) */}
              {selectedSubject !== "math" && selectedSubject !== "reading" && (
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
