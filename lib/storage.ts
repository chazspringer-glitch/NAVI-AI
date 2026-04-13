import type { AgentAction } from "./actions";

export interface Message {
  id: string;
  role: "user" | "pet";
  content: string;
  timestamp: number;
  action?: AgentAction; // attached by the AI agent; rendered as ActionCard
  attachment?: { name: string; mimeType: string; dataUrl?: string };
}

export interface Reminder {
  id: string;
  message: string;
  scheduledAt: number; // Unix ms when it should fire
}

export interface ProgressEntry {
  id: string;
  topic: string;
  achievement: string;
  bonusXP: number;
  timestamp: number;
}

export type MentorMode = "chat" | "learning" | "mentor";
export type AppMode = "companion" | "lawyer" | "job" | "history" | "housing" | "stem" | "ai_skills";

export interface PetState {
  userName: string;
  petName: string;
  bondXP: number;
  messageCount: number;
  lastInteractionTime: number;
  messages: Message[];
  mentorMode: MentorMode;
  reminders: Reminder[];
  progressLog: ProgressEntry[];
  lastCheckInAt: number; // Unix ms when the last check-in message was shown
}

const STORAGE_KEY = "ai-pet-state";
const MAX_STORED_MESSAGES = 50;
const MAX_PROGRESS_ENTRIES = 100;

export const BOND_THRESHOLDS = [0, 15, 40, 80, 150, 300];
export const BOND_NAMES = ["Strangers", "Acquaintances", "Friends", "Close Friends", "Best Friends", "Soulmates"];

export function getBondLevel(xp: number): number {
  for (let i = BOND_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= BOND_THRESHOLDS[i]) return i;
  }
  return 0;
}

export function getBondProgress(xp: number): number {
  const level = getBondLevel(xp);
  if (level >= BOND_THRESHOLDS.length - 1) return 100;
  const current = BOND_THRESHOLDS[level];
  const next = BOND_THRESHOLDS[level + 1];
  return Math.round(((xp - current) / (next - current)) * 100);
}

export function getXPForMessage(message: string): number {
  const len = message.trim().length;
  if (len > 100) return 3;
  if (len > 30) return 2;
  return 1;
}

const defaultState: PetState = {
  userName: "",
  petName: "NAVI",
  bondXP: 0,
  messageCount: 0,
  lastInteractionTime: 0,
  messages: [],
  mentorMode: "chat",
  reminders: [],
  progressLog: [],
  lastCheckInAt: 0,
};

export function loadState(): PetState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<PetState>;
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

export function saveState(state: PetState): void {
  if (typeof window === "undefined") return;
  try {
    const toSave: PetState = {
      ...state,
      messages: state.messages.slice(-MAX_STORED_MESSAGES),
      progressLog: state.progressLog.slice(-MAX_PROGRESS_ENTRIES),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Ignore storage errors
  }
}
