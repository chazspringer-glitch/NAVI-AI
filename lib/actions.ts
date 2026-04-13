// ── Action types returned by the AI agent ────────────────────────────────────
// The model decides which action (if any) to attach to a response.
// The frontend dispatches each action type differently.

export interface SuggestActivityAction {
  type: "suggest_activity";
  title: string;
  description: string;
  emoji: string;
}

export interface RemindLaterAction {
  type: "remind_later";
  message: string;
  delayMinutes: number; // model picks from 5 | 10 | 15 | 30 | 60 | 120
}

export interface AskFollowupAction {
  type: "ask_followup";
  question: string; // auto-sent as a new pet message after ~10 s
}

export interface TrackProgressAction {
  type: "track_progress";
  topic: string;
  achievement: string;
  bonusXP: number; // 5 | 10 | 15
}

export type NavigateDestination =
  | "job" | "lawyer" | "history" | "companion" | "housing" | "stem" | "ai_skills"
  | "resumeBuilder" | "bizPlanBuilder" | "localResources"
  | "homeworkHelper" | "truthRoom" | "partners" | "housingFinder" | "stemLesson" | "aiSkillsLesson";

export interface NavigateAction {
  type: "navigate";
  destination: NavigateDestination;
  label: string; // human-readable name shown in the toast, e.g. "Job Finder"
}

export type AgentAction =
  | SuggestActivityAction
  | RemindLaterAction
  | AskFollowupAction
  | TrackProgressAction
  | NavigateAction;

// ── Strict parser — validates model output before it touches the frontend ─────
export function parseAction(raw: unknown): AgentAction | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const t = a.type;

  if (t === "suggest_activity" && typeof a.title === "string" && typeof a.description === "string") {
    return {
      type: "suggest_activity",
      title: a.title.slice(0, 80),
      description: a.description.slice(0, 200),
      emoji: typeof a.emoji === "string" ? a.emoji.slice(0, 4) : "✨",
    };
  }

  if (t === "remind_later" && typeof a.message === "string" && typeof a.delayMinutes === "number") {
    const allowed = [5, 10, 15, 30, 60, 120];
    const delay = allowed.includes(a.delayMinutes) ? a.delayMinutes : 15;
    return { type: "remind_later", message: a.message.slice(0, 200), delayMinutes: delay };
  }

  if (t === "ask_followup" && typeof a.question === "string") {
    return { type: "ask_followup", question: a.question.slice(0, 200) };
  }

  if (t === "track_progress" && typeof a.topic === "string" && typeof a.achievement === "string") {
    const xp = typeof a.bonusXP === "number" ? Math.min(15, Math.max(5, a.bonusXP)) : 5;
    return { type: "track_progress", topic: a.topic.slice(0, 60), achievement: a.achievement.slice(0, 200), bonusXP: xp };
  }

  const VALID_DESTINATIONS: NavigateDestination[] = [
    "job", "lawyer", "history", "companion", "housing", "stem", "ai_skills",
    "resumeBuilder", "bizPlanBuilder", "localResources",
    "homeworkHelper", "truthRoom", "partners", "housingFinder", "stemLesson", "aiSkillsLesson",
  ];
  if (t === "navigate" && typeof a.destination === "string" && VALID_DESTINATIONS.includes(a.destination as NavigateDestination)) {
    return {
      type: "navigate",
      destination: a.destination as NavigateDestination,
      label: typeof a.label === "string" ? a.label.slice(0, 60) : a.destination,
    };
  }

  return null;
}
