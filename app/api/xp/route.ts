import { NextRequest, NextResponse } from "next/server";
import { addXP, XP_REWARDS } from "@/lib/leaderboard";

export async function POST(req: NextRequest) {
  try {
    const { user_id, display_name, action } = await req.json();

    if (!user_id || !action) {
      return NextResponse.json({ error: "user_id and action required" }, { status: 400 });
    }

    const amount = XP_REWARDS[action as keyof typeof XP_REWARDS];
    if (!amount) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    console.log("[api/xp] Adding", amount, "XP for", user_id, display_name || "NAVI User", action);
    const result = await addXP(user_id, display_name || "NAVI User", amount);
    if (!result) {
      console.error("[api/xp] addXP returned null for", user_id);
      return NextResponse.json({ error: "Failed to add XP" }, { status: 500 });
    }

    console.log("[api/xp] Success:", result);
    return NextResponse.json({ ...result, added: amount });
  } catch (err) {
    console.error("[api/xp] Error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
