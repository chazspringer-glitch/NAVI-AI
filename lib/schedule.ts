import { supabase } from "./supabase";

export interface ScheduledPost {
  id: string;
  user_id: string;
  post_type: string;
  platform: string;
  caption: string;
  scheduled_at: string;
  created_at: string;
}

/**
 * Fetch scheduled posts for a user, ordered by scheduled date.
 */
export async function fetchScheduledPosts(userId: string): Promise<ScheduledPost[]> {
  const { data, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("[schedule] fetchScheduledPosts error:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Create a new scheduled post.
 */
export async function createScheduledPost(
  post: Omit<ScheduledPost, "id" | "created_at">,
): Promise<ScheduledPost | null> {
  const { data, error } = await supabase
    .from("scheduled_posts")
    .insert(post)
    .select()
    .single();

  if (error) {
    console.error("[schedule] createScheduledPost error:", error.message);
    return null;
  }

  console.log("[schedule] Post scheduled:", data.id, "for", data.scheduled_at);
  return data;
}
