import { NextRequest, NextResponse } from "next/server";
import { fetchScheduledPosts, createScheduledPost } from "@/lib/schedule";

/**
 * GET /api/schedule?user_id=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }
    const posts = await fetchScheduledPosts(userId);
    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[api/schedule] GET error:", err);
    return NextResponse.json({ posts: [], error: "Failed to fetch" }, { status: 500 });
  }
}

/**
 * POST /api/schedule
 * Body: { user_id, post_type, platform, caption, scheduled_at }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, post_type, platform, caption, scheduled_at } = body;

    if (!user_id || !post_type || !platform || !scheduled_at) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const post = await createScheduledPost({
      user_id,
      post_type,
      platform,
      caption: caption || "",
      scheduled_at,
    });

    if (!post) {
      return NextResponse.json({ error: "Failed to schedule" }, { status: 500 });
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error("[api/schedule] POST error:", err);
    return NextResponse.json({ error: "Failed to schedule" }, { status: 500 });
  }
}
