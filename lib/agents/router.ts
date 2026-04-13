/**
 * NAVI Agent Router
 *
 * Maps each AppMode to its dedicated agent and exposes a single
 * `routeToAgent` function that the chat API calls to get the
 * right system prompt, token budget, and temperature.
 */

import { CompanionAgent }  from "./CompanionAgent";
import { LawyerAgent }     from "./LawyerAgent";
import { JobAgent }        from "./JobAgent";
import { HistoryAgent }    from "./HistoryAgent";
import { HousingAgent }    from "./HousingAgent";
import { StemAgent }       from "./StemAgent";
import { AISkillsAgent }   from "./AISkillsAgent";
import type { Agent, AppMode } from "./types";

/** Registry of all NAVI agents, keyed by AppMode. */
const AGENTS: Record<AppMode, Agent> = {
  companion: CompanionAgent,
  lawyer:    LawyerAgent,
  job:       JobAgent,
  history:   HistoryAgent,
  housing:   HousingAgent,
  stem:      StemAgent,
  ai_skills: AISkillsAgent,
};

/**
 * Return the agent responsible for the given AppMode.
 * Falls back to CompanionAgent for unknown values.
 */
export function routeToAgent(appMode: string = "companion"): Agent {
  return AGENTS[appMode as AppMode] ?? CompanionAgent;
}

/** Convenience re-export so callers can enumerate all agents. */
export { AGENTS };
export type { Agent, AppMode };
