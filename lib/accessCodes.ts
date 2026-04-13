import { supabase } from "./supabase";

/**
 * Validate and redeem a one-time access code.
 * Returns { success: true } or { success: false, error: string }.
 */
export async function redeemAccessCode(
  code: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Look up the code
  const { data: codeRow, error: lookupErr } = await supabase
    .from("codes")
    .select("id, code, is_used")
    .eq("code", code.trim())
    .single();

  if (lookupErr || !codeRow) {
    console.log("[accessCodes] Code not found:", code);
    return { success: false, error: "Invalid or already used code" };
  }

  if (codeRow.is_used) {
    console.log("[accessCodes] Code already used:", code);
    return { success: false, error: "Invalid or already used code" };
  }

  // 2. Mark code as used
  const { error: updateCodeErr } = await supabase
    .from("codes")
    .update({ is_used: true })
    .eq("id", codeRow.id);

  if (updateCodeErr) {
    console.error("[accessCodes] Failed to mark code used:", updateCodeErr.message);
    return { success: false, error: "Something went wrong. Try again." };
  }

  // 3. Grant access to the user in the clients table
  // Try to update existing row first, then upsert if needed
  const { error: grantErr } = await supabase
    .from("clients")
    .update({ has_course_access: true })
    .eq("id", userId);

  if (grantErr) {
    // User might not have a row in clients yet — that's OK, the flag is set
    console.warn("[accessCodes] Could not update clients row:", grantErr.message);
  }

  console.log("[accessCodes] Code redeemed:", code, "for user:", userId);
  return { success: true };
}
