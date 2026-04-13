import { NextRequest, NextResponse } from "next/server";
import { fetchUploads } from "@/lib/uploads";

export const dynamic = "force-dynamic";

/**
 * GET /api/uploads?user_id=xxx — return uploads for a user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }
    const uploads = await fetchUploads(userId);
    return NextResponse.json({ uploads });
  } catch (err) {
    console.error("[api/uploads] GET error:", err);
    return NextResponse.json({ uploads: [], error: "Failed to fetch uploads" }, { status: 500 });
  }
}
