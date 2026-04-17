import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/community — fetch live posts (not expired, newest first)
 * GET /api/community?parent_id=xxx — fetch replies to a post
 * POST /api/community — create a new post
 * PATCH /api/community — like a post { id, action: "like" }
 * DELETE /api/community — cleanup expired posts (called internally)
 */

export async function GET(req: NextRequest) {
  try {
    // Auto-cleanup expired posts on every read
    await supabase.from("community_posts").delete().lt("expires_at", new Date().toISOString());

    const parentId = req.nextUrl.searchParams.get("parent_id");

    let query = supabase
      .from("community_posts")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (parentId) {
      query = query.eq("parent_id", parentId);
    } else {
      query = query.is("parent_id", null); // top-level posts only
    }

    const { data, error } = await query.limit(50);
    if (error) {
      console.error("[community] GET error:", error.message);
      return NextResponse.json({ posts: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts: data ?? [] });
  } catch (err) {
    console.error("[community] GET error:", err);
    return NextResponse.json({ posts: [], error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, display_name, content, parent_id } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (content.trim().length > 500) {
      return NextResponse.json({ error: "Max 500 characters" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: user_id || null,
        display_name: (display_name || "").trim() || "NAVI User",
        content: content.trim(),
        label: "community_report",
        parent_id: parent_id || null,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error("[community] POST error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update reply count on parent if this is a reply
    if (parent_id) {
      try {
        const { data: p } = await supabase
          .from("community_posts")
          .select("reply_count")
          .eq("id", parent_id)
          .single();
        if (p) {
          await supabase.from("community_posts")
            .update({ reply_count: (p.reply_count || 0) + 1 })
            .eq("id", parent_id);
        }
      } catch { /* silent */ }
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    console.error("[community] POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, action } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    if (action === "like") {
      const { data: post } = await supabase
        .from("community_posts")
        .select("likes")
        .eq("id", id)
        .single();

      if (post) {
        const { error } = await supabase
          .from("community_posts")
          .update({ likes: (post.likes || 0) + 1 })
          .eq("id", id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[community] PATCH error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
