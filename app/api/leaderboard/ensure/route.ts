import { NextRequest, NextResponse } from "next/server";
import { ensureLeaderboardEntry } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { user_id, display_name } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }
    const entry = await ensureLeaderboardEntry(user_id, display_name || "NAVI User");
    if (!entry) {
      return NextResponse.json({ error: "Failed to ensure entry" }, { status: 500 });
    }
    return NextResponse.json({ entry });
  } catch (err) {
    console.error("[api/leaderboard/ensure] Error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
