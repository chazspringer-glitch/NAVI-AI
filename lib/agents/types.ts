import type { AppMode, MentorMode } from "@/lib/storage";

export type { AppMode, MentorMode };

/** Parameters passed to every agent when building its system prompt. */
export interface AgentParams {
  petName?: string;
  userName?: string;
  mood?: string;
  bondLevel?: number;
  bondName?: string;
  mentorMode?: MentorMode;
}

/** Contract every NAVI agent must satisfy. */
export interface Agent {
  /** Matches the AppMode that routes to this agent. */
  readonly id: AppMode;
  /** Human-readable display name. */
  readonly name: string;
  /** One-line description of the agent's role. */
  readonly description: string;
  /** Build the full system prompt for this agent. */
  getSystemPrompt(params: AgentParams): string;
  /** Max output tokens for this agent (may vary by sub-mode). */
  getMaxTokens(params?: AgentParams): number;
  /** Sampling temperature (may vary by mood / sub-mode). */
  getTemperature(params?: AgentParams): number;
}
