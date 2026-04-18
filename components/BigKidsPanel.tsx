"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import NaviOrb from "./NaviOrb";

type KidsView = "home" | "play" | "learn" | "missions" | "rewards" | "parent";

const NAVI_GREETINGS = [
  "Hey explorer! Ready to learn something awesome? 🚀",
  "Welcome back! Let's crush some quests today! 💪",
  "I missed you! Pick something fun to do! ✨",
  "You're getting smarter every day. Let's go! 🧠",
  "Another day, another adventure. What's first? 🎯",
];

const NAVI_REACTIONS: Record<string, string[]> = {
  correct: ["You're amazing! 🎉", "Boom! Nailed it! 💥", "That brain is ON FIRE! 🔥", "Too easy for you! 😎"],
  wrong: ["So close! Try again! 💪", "Almost! You got this! 🌟", "Don't give up! 🚀"],
  levelUp: ["LEVEL UP! You're unstoppable! 🏆", "New level unlocked! Keep going! ⭐"],
  streak: ["Streak mode! You're on a roll! 🔥🔥🔥"],
};

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

// ── Life Skills quest content ───────────────────────────────────────────────
const LIFE_SKILLS_QUESTS = [
  {
    title: "Making Change",
    text: "You buy a snack that costs $3.25 and you pay with a $5 bill.",
    question: "How much change should you get back?",
    choices: ["$1.25", "$1.75", "$2.75", "$2.25"],
    answer: 1,
    difficulty: 1,
  },
  {
    title: "Telling Time",
    text: "Your soccer practice starts at 4:30 PM. It takes 20 minutes to walk there and 10 minutes to get ready.",
    question: "What time should you start getting ready?",
    choices: ["4:00 PM", "4:10 PM", "3:50 PM", "4:00 PM"],
    answer: 0,
    difficulty: 1,
  },
  {
    title: "Grocery Budget",
    text: "You have $10 to buy lunch supplies for the week. Bread costs $2.50, peanut butter costs $3.00, and jelly costs $2.00. You also want chips for $2.50.",
    question: "Can you buy everything?",
    choices: ["Yes, with money left over", "Yes, exactly $10", "No, you're $0.50 short", "No, you're $1.00 short"],
    answer: 2,
    difficulty: 2,
  },
  {
    title: "Emergency Numbers",
    text: "Knowing who to call in an emergency can save a life. The most important number to remember is 911 — it connects you to police, fire, and ambulance services anywhere in the United States.",
    question: "When should you call 911?",
    choices: ["When you're bored", "When someone is in danger or seriously hurt", "When you need homework help", "When your friend is late"],
    answer: 1,
    difficulty: 1,
  },
  {
    title: "Saving vs Spending",
    text: "Jaylen earns $20 mowing lawns. He wants a video game that costs $40. His mom says if he saves half his earnings each time, she'll match what he saves.",
    question: "How many times does Jaylen need to mow lawns to afford the game with his mom's match?",
    choices: ["4 times", "2 times", "3 times", "5 times"],
    answer: 1,
    difficulty: 2,
  },
  {
    title: "Reading a Recipe",
    text: "A recipe for 4 servings of pasta needs 2 cups of noodles, 1 cup of sauce, and half a cup of cheese. You're cooking for 8 people.",
    question: "How much sauce do you need?",
    choices: ["1 cup", "1.5 cups", "2 cups", "3 cups"],
    answer: 2,
    difficulty: 3,
  },
];

// ── Problem Solving quest content ───────────────────────────────────────────
const PROBLEM_SOLVING_QUESTS = [
  {
    title: "Pattern Finder",
    text: "Look at this pattern: 2, 4, 8, 16, ___",
    question: "What number comes next?",
    choices: ["18", "24", "32", "20"],
    answer: 2,
    difficulty: 1,
  },
  {
    title: "Shape Logic",
    text: "A square has 4 sides. A triangle has 3 sides. A pentagon has 5 sides.",
    question: "How many sides does a hexagon have?",
    choices: ["4", "5", "6", "7"],
    answer: 2,
    difficulty: 1,
  },
  {
    title: "Code Breaker",
    text: "In a secret code, A=1, B=2, C=3, and so on. Your friend sends you the message: 8-9.",
    question: "What does 8-9 spell?",
    choices: ["GO", "HI", "NO", "IT"],
    answer: 1,
    difficulty: 2,
  },
  {
    title: "Logic Puzzle",
    text: "Three friends — Mia, Noah, and Ava — each have a different pet: a cat, a dog, and a fish. Mia doesn't like dogs. Noah is allergic to cats. Ava has the fish.",
    question: "What pet does Mia have?",
    choices: ["Dog", "Fish", "Cat", "Bird"],
    answer: 2,
    difficulty: 2,
  },
  {
    title: "Number Sequence",
    text: "Look at this pattern: 1, 1, 2, 3, 5, 8, ___. Each number is the sum of the two before it.",
    question: "What comes next?",
    choices: ["10", "11", "13", "15"],
    answer: 2,
    difficulty: 3,
  },
  {
    title: "The Bridge Problem",
    text: "Four people need to cross a bridge at night with one flashlight. The bridge holds only 2 people at a time. Person A crosses in 1 minute, B in 2 minutes, C in 5 minutes, and D in 10 minutes. When two cross, they go at the slower person's speed.",
    question: "What is the fastest everyone can cross?",
    choices: ["17 minutes", "19 minutes", "15 minutes", "21 minutes"],
    answer: 0,
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
  const [kidsView, setKidsView] = useState<KidsView>("home");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [totalXP, setTotalXP] = useState(() => loadSavedXP());
  const [naviMessage, setNaviMessage] = useState(() => NAVI_GREETINGS[Math.floor(Math.random() * NAVI_GREETINGS.length)]);
  const [naviAnimating, setNaviAnimating] = useState(false);

  // Animated stars
  const [stars] = useState(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 3,
    }))
  );

  const naviSpeak = useCallback((msg: string) => {
    setNaviMessage(msg);
    setNaviAnimating(true);
    setTimeout(() => setNaviAnimating(false), 600);
  }, []);
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

  // Life Skills quest state
  const [lifeIdx, setLifeIdx] = useState(0);
  const [lifeFeedback, setLifeFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [lifeScore, setLifeScore] = useState(0);
  const [lifeTotal, setLifeTotal] = useState(0);
  const [lifeStarted, setLifeStarted] = useState(false);
  const currentLife = LIFE_SKILLS_QUESTS[lifeIdx % LIFE_SKILLS_QUESTS.length];

  // Problem Solving quest state
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [puzzleFeedback, setPuzzleFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [puzzleScore, setPuzzleScore] = useState(0);
  const [puzzleTotal, setPuzzleTotal] = useState(0);
  const [puzzleStarted, setPuzzleStarted] = useState(false);
  const currentPuzzle = PROBLEM_SOLVING_QUESTS[puzzleIdx % PROBLEM_SOLVING_QUESTS.length];

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

  const checkLifeAnswer = (choiceIdx: number) => {
    if (lifeFeedback) return;
    const correct = choiceIdx === currentLife.answer;
    if (correct) {
      const pts = currentLife.difficulty * 15;
      setLifeScore((s) => s + pts);
      addXP(pts, "life");
      setLifeFeedback({ correct: true, message: ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)] + ` +${pts} XP` });
    } else {
      setLifeFeedback({ correct: false, message: TRYAGAINS[Math.floor(Math.random() * TRYAGAINS.length)] });
    }
    setLifeTotal((t) => t + 1);
  };

  const checkPuzzleAnswer = (choiceIdx: number) => {
    if (puzzleFeedback) return;
    const correct = choiceIdx === currentPuzzle.answer;
    if (correct) {
      const pts = currentPuzzle.difficulty * 15;
      setPuzzleScore((s) => s + pts);
      addXP(pts, "problem");
      setPuzzleFeedback({ correct: true, message: ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)] + ` +${pts} XP` });
    } else {
      setPuzzleFeedback({ correct: false, message: TRYAGAINS[Math.floor(Math.random() * TRYAGAINS.length)] });
    }
    setPuzzleTotal((t) => t + 1);
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

  // Update NAVI reactions based on actions
  const origAddXP = addXP;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "linear-gradient(180deg, #0a0a1a 0%, #0d0d2b 50%, #12122a 100%)",
      fontFamily: "monospace",
    }}>
      {/* Animated star background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {stars.map((s) => (
          <div key={s.id} style={{
            position: "absolute",
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            borderRadius: "50%",
            background: "#fff",
            opacity: 0.4,
            animation: `twinkle ${2 + s.delay}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }} />
        ))}
        <style jsx>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.3); }
          }
        `}</style>
      </div>

      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(0,212,255,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", zIndex: 2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {kidsView !== "home" && (
            <button onClick={() => { setKidsView("home"); setSelectedSubject(null); }} style={{
              width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.20)",
              color: "#00d4ff", cursor: "pointer", fontSize: 12,
            }}>←</button>
          )}
          <div>
            <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#00d4ff", marginBottom: 3 }}>Ages 7–12</div>
            <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>🎮 NAVI Big Kids</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Parent dashboard button */}
          <button onClick={() => setKidsView("parent")} style={{
            padding: "4px 8px", borderRadius: 6,
            background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.20)",
            color: "#a855f7", fontSize: 8, fontWeight: 700, fontFamily: "monospace", cursor: "pointer",
          }}>👨‍👩‍👧 Parent</button>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 2 }}>

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

        {/* ── HOME VIEW — Character hub ────────────────────────────────── */}
        {kidsView === "home" && (() => {
          const lvl = getLevelInfo(totalXP);
          return (
          <>
            {/* NAVI Character */}
            <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
              <div style={{
                display: "inline-block",
                transform: naviAnimating ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.3s ease",
              }}>
                <NaviOrb size={80} />
              </div>
              {/* Speech bubble */}
              <div style={{
                margin: "12px auto 0", maxWidth: 280,
                padding: "10px 14px", borderRadius: 14,
                background: "rgba(0,212,255,0.08)",
                border: "1px solid rgba(0,212,255,0.20)",
                position: "relative",
              }}>
                <div style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.6, textAlign: "center" }}>
                  {naviMessage}
                </div>
              </div>
            </div>

            {/* Level badge */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "10px 16px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(168,85,247,0.04))",
              border: "1px solid rgba(0,212,255,0.12)",
            }}>
              <span style={{ fontSize: 24 }}>{lvl.current.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#f1f5f9" }}>Level {lvl.current.level} — {lvl.current.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${lvl.progress}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #00d4ff, #a855f7)", transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: 9, color: "#00d4ff", fontWeight: 700 }}>{totalXP} XP</span>
                </div>
              </div>
            </div>

            {/* Navigation buttons — Play / Learn / Missions / Rewards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { view: "play" as KidsView,     icon: "🎮", label: "Play",     desc: "Jump into quests", color: "#00d4ff" },
                { view: "learn" as KidsView,    icon: "📚", label: "Learn",    desc: "Pick a subject",   color: "#34d399" },
                { view: "missions" as KidsView, icon: "🎯", label: "Missions", desc: `${missionProgress.completed.length}/${dailyMissions.length} done`, color: "#f59e0b" },
                { view: "rewards" as KidsView,  icon: "🏆", label: "Rewards",  desc: `Level ${lvl.current.level}`, color: "#a855f7" },
              ].map(({ view, icon, label, desc, color }) => (
                <button key={view} onClick={() => { setKidsView(view); naviSpeak(view === "play" ? "Let's play! Pick a quest! 🎮" : view === "learn" ? "Smart choice! What subject? 📚" : view === "missions" ? "Check your daily goals! 🎯" : "Look at all you've earned! 🏆"); }}
                  style={{
                    padding: "18px 12px", borderRadius: 16, cursor: "pointer",
                    background: `${color}0c`,
                    border: `2px solid ${color}28`,
                    textAlign: "center", fontFamily: "monospace",
                  }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{label}</div>
                  <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{desc}</div>
                </button>
              ))}
            </div>
          </>
          );
        })()}

        {/* ── PLAY VIEW — Quick subject picker ─────────────────────────── */}
        {kidsView === "play" && !selectedSubject && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Pick a Quest!</div>
            </div>
            {SUBJECTS.map((s) => (
              <button key={s.id} onClick={() => setSelectedSubject(s.id)}
                style={{
                  width: "100%", padding: "18px 16px", borderRadius: 16, cursor: "pointer",
                  background: `${s.color}0a`, border: `2px solid ${s.color}30`,
                  display: "flex", alignItems: "center", gap: 14,
                  textAlign: "left", fontFamily: "monospace",
                }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{s.desc}</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 16, color: s.color, flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* ── LEARN VIEW — Subject picker (same as Play) ───────────────── */}
        {kidsView === "learn" && !selectedSubject && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Choose a Subject</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Learn at your own pace!</div>
            </div>
            {SUBJECTS.map((s) => (
              <button key={s.id} onClick={() => setSelectedSubject(s.id)}
                style={{
                  width: "100%", padding: "18px 16px", borderRadius: 16, cursor: "pointer",
                  background: `${s.color}0a`, border: `2px solid ${s.color}30`,
                  display: "flex", alignItems: "center", gap: 14,
                  textAlign: "left", fontFamily: "monospace",
                }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{s.desc}</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 16, color: s.color, flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* ── MISSIONS VIEW ─────────────────────────────────────────────── */}
        {kidsView === "missions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>🎯 Today's Missions</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Complete all 3 for bonus XP!</div>
            </div>
            {dailyMissions.map((m) => {
              const done = missionProgress.completed.includes(m.id);
              return (
                <div key={m.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 14px", borderRadius: 14,
                  background: done ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)",
                  border: done ? "2px solid rgba(52,211,153,0.25)" : "2px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{done ? "✅" : m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: done ? "#34d399" : "#f1f5f9", textDecoration: done ? "line-through" : "none" }}>{m.label}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: done ? "#34d399" : "#f59e0b" }}>+{m.xp}</span>
                </div>
              );
            })}
            {missionProgress.completed.length === dailyMissions.length && (
              <div style={{ textAlign: "center", padding: "16px 0", fontSize: 14, fontWeight: 700, color: "#34d399" }}>🎉 All done! Amazing work!</div>
            )}
            <button onClick={() => { setKidsView("play"); naviSpeak("Let's complete those missions! 💪"); }} style={{
              width: "100%", padding: "14px", borderRadius: 14, cursor: "pointer",
              background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none",
              color: "#08080f", fontSize: 13, fontWeight: 700, fontFamily: "monospace",
            }}>
              Go Play →
            </button>
          </div>
        )}

        {/* ── REWARDS VIEW ──────────────────────────────────────────────── */}
        {kidsView === "rewards" && (() => {
          const lvl = getLevelInfo(totalXP);
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>🏆 Your Rewards</div>
              </div>
              {LEVELS.map((lv) => {
                const unlocked = totalXP >= lv.xpNeeded;
                return (
                  <div key={lv.level} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 14,
                    background: unlocked ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)",
                    border: unlocked ? "2px solid rgba(168,85,247,0.25)" : "2px solid rgba(255,255,255,0.05)",
                    opacity: unlocked ? 1 : 0.5,
                  }}>
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{unlocked ? lv.icon : "🔒"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: unlocked ? "#f1f5f9" : "#64748b" }}>Level {lv.level} — {lv.title}</div>
                      <div style={{ fontSize: 9, color: "#64748b" }}>{lv.xpNeeded} XP needed</div>
                    </div>
                    {unlocked && <span style={{ fontSize: 10, color: "#a855f7", fontWeight: 700 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── PARENT DASHBOARD ──────────────────────────────────────────── */}
        {kidsView === "parent" && (() => {
          const lvl = getLevelInfo(totalXP);
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.15)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#a855f7", marginBottom: 8 }}>👨‍👩‍👧 Parent Dashboard</div>
                <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.6 }}>Track your child{"'"}s learning progress, subjects studied, and skill development.</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ padding: "14px 12px", borderRadius: 12, background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.12)", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#00d4ff" }}>{totalXP}</div>
                  <div style={{ fontSize: 8, color: "#94a3b8", marginTop: 2 }}>Total XP Earned</div>
                </div>
                <div style={{ padding: "14px 12px", borderRadius: 12, background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.12)", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#a855f7" }}>{lvl.current.icon} Lv{lvl.current.level}</div>
                  <div style={{ fontSize: 8, color: "#94a3b8", marginTop: 2 }}>{lvl.current.title}</div>
                </div>
                <div style={{ padding: "14px 12px", borderRadius: 12, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.12)", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399" }}>{mathTotal + readingTotal + lifeTotal + puzzleTotal}</div>
                  <div style={{ fontSize: 8, color: "#94a3b8", marginTop: 2 }}>Questions Answered</div>
                </div>
                <div style={{ padding: "14px 12px", borderRadius: 12, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>{missionProgress.completed.length}</div>
                  <div style={{ fontSize: 8, color: "#94a3b8", marginTop: 2 }}>Missions Today</div>
                </div>
              </div>
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Subjects Practiced</div>
                {[
                  { label: "Math", score: mathScore, total: mathTotal, color: "#00d4ff" },
                  { label: "Reading", score: readingScore, total: readingTotal, color: "#34d399" },
                  { label: "Life Skills", score: lifeScore, total: lifeTotal, color: "#f59e0b" },
                  { label: "Problem Solving", score: puzzleScore, total: puzzleTotal, color: "#a855f7" },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ fontSize: 10, color: s.color, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontSize: 9, color: "#94a3b8" }}>{s.total} questions · {s.score} XP</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── QUEST VIEWS (Play/Learn with subject selected) ────────────── */}
        {(kidsView === "play" || kidsView === "learn") && selectedSubject && (() => {
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

              {/* ── Life Skills Quests ─────────────────────────────────────── */}
              {selectedSubject === "life" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.10)" }}>
                    <div style={{ fontSize: 9, color: "#64748b" }}>Challenge {(lifeIdx % LIFE_SKILLS_QUESTS.length) + 1} of {LIFE_SKILLS_QUESTS.length}</div>
                    <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>⭐ {lifeScore} XP</div>
                  </div>
                  {!lifeStarted ? (
                    <button onClick={() => setLifeStarted(true)} style={{
                      width: "100%", padding: "20px", borderRadius: 16, cursor: "pointer",
                      background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(201,162,39,0.06))",
                      border: "2px solid rgba(245,158,11,0.25)", fontFamily: "monospace", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🌟</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>Start Life Skills Quest!</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Money, time, and everyday smarts</div>
                    </button>
                  ) : (
                    <div style={{ padding: "18px 16px", borderRadius: 18, background: "linear-gradient(160deg, rgba(16,16,28,0.95) 0%, rgba(10,10,20,0.95) 100%)", border: `2px solid ${lifeFeedback ? (lifeFeedback.correct ? "#34d39960" : "#f8717160") : "#f59e0b30"}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 10 }}>🌟 {currentLife.title}</div>
                      <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.8, marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.10)" }}>
                        {currentLife.text}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>{currentLife.question}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                        {currentLife.choices.map((c, i) => {
                          let bg = "rgba(255,255,255,0.04)"; let border = "1px solid rgba(255,255,255,0.10)"; let color = "#f1f5f9";
                          if (lifeFeedback) {
                            if (i === currentLife.answer) { bg = "rgba(52,211,153,0.15)"; border = "1px solid #34d399"; color = "#34d399"; }
                            else if (!lifeFeedback.correct) { color = "#64748b"; }
                          }
                          return (<button key={i} onClick={() => checkLifeAnswer(i)} disabled={!!lifeFeedback} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, cursor: lifeFeedback ? "default" : "pointer", background: bg, border, fontFamily: "monospace", fontSize: 11, color, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", flexShrink: 0 }}>{String.fromCharCode(65 + i)}.</span>{c}
                          </button>);
                        })}
                      </div>
                      {lifeFeedback && <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: lifeFeedback.correct ? "#34d399" : "#f87171", marginBottom: 12 }}>{lifeFeedback.message}</div>}
                      {lifeFeedback && <div style={{ textAlign: "center" }}><button onClick={() => { setLifeIdx((i) => i + 1); setLifeFeedback(null); }} style={{ padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", color: "#08080f", fontSize: 13, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}>Next Challenge →</button></div>}
                    </div>
                  )}
                  {lifeTotal > 0 && <div style={{ textAlign: "center", fontSize: 9, color: "#64748b" }}>{lifeTotal} challenges answered</div>}
                </>
              )}

              {/* ── Problem Solving Quests ──────────────────────────────────── */}
              {selectedSubject === "problem" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.10)" }}>
                    <div style={{ fontSize: 9, color: "#64748b" }}>Puzzle {(puzzleIdx % PROBLEM_SOLVING_QUESTS.length) + 1} of {PROBLEM_SOLVING_QUESTS.length}</div>
                    <div style={{ fontSize: 10, color: "#a855f7", fontWeight: 700 }}>⭐ {puzzleScore} XP</div>
                  </div>
                  {!puzzleStarted ? (
                    <button onClick={() => setPuzzleStarted(true)} style={{
                      width: "100%", padding: "20px", borderRadius: 16, cursor: "pointer",
                      background: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(96,165,250,0.06))",
                      border: "2px solid rgba(168,85,247,0.25)", fontFamily: "monospace", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🧩</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#a855f7" }}>Start Puzzle Quest!</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Logic, patterns, and critical thinking</div>
                    </button>
                  ) : (
                    <div style={{ padding: "18px 16px", borderRadius: 18, background: "linear-gradient(160deg, rgba(16,16,28,0.95) 0%, rgba(10,10,20,0.95) 100%)", border: `2px solid ${puzzleFeedback ? (puzzleFeedback.correct ? "#34d39960" : "#f8717160") : "#a855f730"}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#a855f7", marginBottom: 10 }}>🧩 {currentPuzzle.title}</div>
                      <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.8, marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.10)" }}>
                        {currentPuzzle.text}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>{currentPuzzle.question}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                        {currentPuzzle.choices.map((c, i) => {
                          let bg = "rgba(255,255,255,0.04)"; let border = "1px solid rgba(255,255,255,0.10)"; let color = "#f1f5f9";
                          if (puzzleFeedback) {
                            if (i === currentPuzzle.answer) { bg = "rgba(52,211,153,0.15)"; border = "1px solid #34d399"; color = "#34d399"; }
                            else if (!puzzleFeedback.correct) { color = "#64748b"; }
                          }
                          return (<button key={i} onClick={() => checkPuzzleAnswer(i)} disabled={!!puzzleFeedback} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, cursor: puzzleFeedback ? "default" : "pointer", background: bg, border, fontFamily: "monospace", fontSize: 11, color, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", flexShrink: 0 }}>{String.fromCharCode(65 + i)}.</span>{c}
                          </button>);
                        })}
                      </div>
                      {puzzleFeedback && <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: puzzleFeedback.correct ? "#34d399" : "#f87171", marginBottom: 12 }}>{puzzleFeedback.message}</div>}
                      {puzzleFeedback && <div style={{ textAlign: "center" }}><button onClick={() => { setPuzzleIdx((i) => i + 1); setPuzzleFeedback(null); }} style={{ padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg, #a855f7, #7c3aed)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}>Next Puzzle →</button></div>}
                    </div>
                  )}
                  {puzzleTotal > 0 && <div style={{ textAlign: "center", fontSize: 9, color: "#64748b" }}>{puzzleTotal} puzzles attempted</div>}
                </>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
