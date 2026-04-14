import { NextRequest, NextResponse } from "next/server";
import { fetchLeaderboard, getUserRank } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    const top = await fetchLeaderboard();

    let userRank = null;
    if (userId) {
      userRank = await getUserRank(userId);
    }

    return NextResponse.json({ top, userRank });
  } catch (err) {
    console.error("[api/leaderboard] Error:", err);
    return NextResponse.json({ top: [], userRank: null, error: "Failed to fetch" }, { status: 500 });
  }
}
