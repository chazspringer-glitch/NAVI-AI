export interface DailyMission {
  id: string;
  label: string;
  emoji: string;
  progress: number;
  target: number;
  xpReward: number;
  completed: boolean;
  type: "messages" | "mode" | "voice" | "streak_check";
  mode?: string;
}

export interface GamifState {
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  missions: DailyMission[];
  missionDate: string; // YYYY-MM-DD
}

export const LEVEL_TITLES = [
  "Newcomer",
  "Explorer",
  "Regular",
  "Advocate",
  "Champion",
  "Legend",
  "Icon",
  "Veteran",
  "Elite",
  "Master",
  "Grand Master",
  "Mythic",
];

// ── Infinite XP level system ──────────────────────────────────────────────────
// Formula: cumulative XP for level n = 30n + 5n(n-1)
// Level 1: 30 XP | Level 5: 250 XP | Level 10: 750 XP | Level 20: 2500 XP | Level 30: 5250 XP | Level 50: 13750 XP
export function getXpLevelThreshold(level: number): number {
  if (level <= 0) return 0;
  return 30 * level + 5 * level * (level - 1);
}

export function getXpLevel(totalXP: number): number {
  let level = 0;
  while (getXpLevelThreshold(level + 1) <= totalXP) level++;
  return level;
}

export function getXpLevelProgress(totalXP: number): number {
  const level = getXpLevel(totalXP);
  const current = getXpLevelThreshold(level);
  const next    = getXpLevelThreshold(level + 1);
  return Math.round(((totalXP - current) / (next - current)) * 100);
}

export function getXpLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)] ?? `Master ${level}`;
}

// ── Rewards unlocked at specific levels ──────────────────────────────────────
export interface LevelReward {
  level: number;
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const LEVEL_REWARDS: LevelReward[] = [
  { level: 2,  id: "glow_up",     name: "Glow Up",        desc: "NAVI's aura shines brighter as your bond deepens.",           icon: "✨" },
  { level: 5,  id: "star_trail",  name: "Star Trail",     desc: "Star energy radiates from NAVI during conversations.",        icon: "⭐" },
  { level: 8,  id: "pulse_ring",  name: "Pulse Rings",    desc: "Extra energy rings pulse around NAVI when excited.",          icon: "🌀" },
  { level: 10, id: "deep_wisdom", name: "Deep Wisdom",    desc: "NAVI's guidance becomes richer and more insightful.",         icon: "🧠" },
  { level: 15, id: "holo_trail",  name: "Holo Trail",     desc: "NAVI leaves a holographic shimmer when switching modes.",     icon: "🌈" },
  { level: 20, id: "shadow_aura", name: "Shadow Aura",    desc: "A mysterious dark energy field surrounds NAVI.",              icon: "🌑" },
  { level: 25, id: "crystal",     name: "Crystal Form",   desc: "NAVI's surface shimmers with crystalline light.",             icon: "💠" },
  { level: 30, id: "elite",       name: "Elite Status",   desc: "Exclusive gold-tier status. You're a true NAVI champion.",   icon: "👑" },
  { level: 40, id: "phantom",     name: "Phantom Mode",   desc: "NAVI transcends normal form — ethereal presence unlocked.",  icon: "👻" },
  { level: 50, id: "ascended",    name: "NAVI Ascended",  desc: "Maximum evolution reached. You and NAVI are one.",           icon: "🔮" },
];

export function getRewardForLevel(level: number): LevelReward | null {
  return LEVEL_REWARDS.find((r) => r.level === level) ?? null;
}

// ── How XP is earned (for the info tab) ──────────────────────────────────────
export const XP_EARN_METHODS = [
  { icon: "💬", label: "Chat message",          xp: "1–3 XP" },
  { icon: "📚", label: "Homework Helper",       xp: "+2 XP" },
  { icon: "💼", label: "Job Finder tools",      xp: "+3 XP" },
  { icon: "⚖️", label: "Lawyer mode advice",    xp: "+2 XP" },
  { icon: "✊", label: "Black History learning", xp: "+2 XP" },
  { icon: "🎯", label: "Complete a mission",    xp: "8–15 XP" },
  { icon: "🔥", label: "Daily streak",          xp: "+15 XP" },
];

interface MissionTemplate {
  id: string;
  label: string;
  emoji: string;
  target: number;
  xpReward: number;
  type: DailyMission["type"];
  mode?: string;
}

const POOL: MissionTemplate[] = [
  { id: "msg5",   label: "Send 5 messages",       emoji: "💬", target: 5,  xpReward: 10, type: "messages"                },
  { id: "msg10",  label: "Send 10 messages",       emoji: "💬", target: 10, xpReward: 20, type: "messages"                },
  { id: "comp3",  label: "Chat in Companion mode", emoji: "🤝", target: 3,  xpReward: 8,  type: "mode", mode: "companion" },
  { id: "job2",   label: "Use Job Finder",         emoji: "💼", target: 2,  xpReward: 8,  type: "mode", mode: "job"       },
  { id: "law2",   label: "Try Lawyer mode",        emoji: "⚖️", target: 2,  xpReward: 8,  type: "mode", mode: "lawyer"    },
  { id: "hist2",  label: "Explore Black History",  emoji: "✊", target: 2,  xpReward: 10, type: "mode", mode: "history"   },
  { id: "voice3", label: "Use your voice 3 times", emoji: "🎙", target: 3,  xpReward: 12, type: "voice"                   },
  { id: "streak", label: "Maintain your streak",   emoji: "🔥", target: 1,  xpReward: 15, type: "streak_check"            },
];

function lcg(seed: number): number {
  return Math.abs(((seed * 1664525 + 1013904223) | 0));
}

// Date-seeded deterministic selection: same date → same 3 missions every time
export function generateDailyMissions(dateStr: string): DailyMission[] {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = lcg(seed + dateStr.charCodeAt(i));
  }

  const poolCopy = [...POOL];
  const picked: MissionTemplate[] = [];
  for (let i = 0; i < 3 && poolCopy.length > 0; i++) {
    seed = lcg(seed);
    const idx = seed % poolCopy.length;
    picked.push(poolCopy[idx]);
    poolCopy.splice(idx, 1);
  }

  return picked.map((t) => ({
    id: t.id,
    label: t.label,
    emoji: t.emoji,
    target: t.target,
    xpReward: t.xpReward,
    type: t.type,
    mode: t.mode,
    progress: 0,
    completed: false,
  }));
}

export function advanceMissions(
  missions: DailyMission[],
  type: DailyMission["type"],
  mode?: string
): { missions: DailyMission[]; completed: DailyMission[] } {
  const completed: DailyMission[] = [];
  const updated = missions.map((m) => {
    if (m.completed) return m;
    if (m.type !== type) return m;
    if (type === "mode" && m.mode !== mode) return m;
    const newProgress = m.progress + 1;
    const nowComplete = newProgress >= m.target;
    const next = { ...m, progress: newProgress, completed: nowComplete };
    if (nowComplete) completed.push(next);
    return next;
  });
  return { missions: updated, completed };
}

export function completeMission(missions: DailyMission[], id: string): DailyMission[] {
  return missions.map((m) =>
    m.id === id ? { ...m, progress: m.target, completed: true } : m
  );
}
