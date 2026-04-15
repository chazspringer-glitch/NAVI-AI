import { supabase } from "./supabase";

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  display_name: string;
  xp: number;
  level: number;
  streak: number;
  achievements: number;
  updated_at: string;
}

/** XP thresholds per level */
function levelFromXP(xp: number): number {
  if (xp < 50) return 1;
  if (xp < 150) return 2;
  if (xp < 300) return 3;
  if (xp < 500) return 4;
  if (xp < 800) return 5;
  if (xp < 1200) return 6;
  if (xp < 1800) return 7;
  if (xp < 2500) return 8;
  if (xp < 3500) return 9;
  return 10;
}

export function xpForNextLevel(currentXP: number): { current: number; next: number; progress: number } {
  const thresholds = [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500, 5000];
  const level = levelFromXP(currentXP);
  const current = thresholds[level - 1] || 0;
  const next = thresholds[level] || 5000;
  const progress = Math.min(100, Math.round(((currentXP - current) / (next - current)) * 100));
  return { current, next, progress };
}

/**
 * Add XP to a user. Creates their leaderboard entry if it doesn't exist.
 */
export async function addXP(userId: string, displayName: string, amount: number): Promise<{ xp: number; level: number } | null> {
  try {
    // Try to get existing entry
    const { data: existing, error: fetchErr } = await supabase
      .from("leaderboard")
      .select("id, xp")
      .eq("user_id", userId)
      .single();

    if (fetchErr && fetchErr.code !== "PGRST116") {
      console.error("[leaderboard] fetch error:", fetchErr.message);
    }

    if (existing) {
      const newXP = (existing.xp || 0) + amount;
      const newLevel = levelFromXP(newXP);
      const { error } = await supabase
        .from("leaderboard")
        .update({ xp: newXP, level: newLevel, display_name: displayName, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) { console.error("[leaderboard] update error:", error.message); return null; }
      console.log("[leaderboard] Updated:", displayName, "+", amount, "→", newXP, "XP");
      return { xp: newXP, level: newLevel };
    } else {
      const newXP = amount;
      const newLevel = levelFromXP(newXP);
      const { error } = await supabase
        .from("leaderboard")
        .insert({ user_id: userId, display_name: displayName, xp: newXP, level: newLevel, streak: 0, achievements: 0 });
      if (error) { console.error("[leaderboard] insert error:", error.message); return null; }
      console.log("[leaderboard] Created:", displayName, "with", newXP, "XP");
      return { xp: newXP, level: newLevel };
    }
  } catch (err) {
    console.error("[leaderboard] addXP error:", err);
    return null;
  }
}

/**
 * Fetch top 10 users by XP.
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("xp", { ascending: false })
    .limit(10);

  if (error) { console.error("[leaderboard] fetch error:", error.message); return []; }
  return data ?? [];
}

/**
 * Get a specific user's leaderboard entry.
 */
export async function getUserRank(userId: string): Promise<{ entry: LeaderboardEntry | null; rank: number }> {
  const { data: all } = await supabase
    .from("leaderboard")
    .select("*")
    .order("xp", { ascending: false });

  if (!all) return { entry: null, rank: 0 };
  const idx = all.findIndex((e) => e.user_id === userId);
  return { entry: idx >= 0 ? all[idx] : null, rank: idx >= 0 ? idx + 1 : 0 };
}

/** XP reward amounts */
export const XP_REWARDS = {
  chat_message: 5,
  voice_used: 10,
  tool_used: 20,
  onboarding_complete: 50,
};
