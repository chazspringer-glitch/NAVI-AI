import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET — fetch current stream status + recent chat
export async function GET() {
  try {
    const { data: stream } = await supabase
      .from("streams")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: chat } = await supabase
      .from("stream_chat")
      .select("*")
      .eq("stream_id", stream?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      stream: stream ?? null,
      chat: (chat ?? []).reverse(),
    });
  } catch (err) {
    console.error("[streams] GET error:", err);
    return NextResponse.json({ stream: null, chat: [] });
  }
}

// POST — founder actions: go_live, end_stream, send_chat, update_topic
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "go_live") {
      const { title, stream_url, topic } = body;
      const { data: stream } = await supabase
        .from("streams")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (stream) {
        await supabase.from("streams").update({
          title: title || "NAVI Live Stream",
          status: "live",
          stream_url: stream_url || null,
          topic: topic || null,
          viewer_count: 0,
          updated_at: new Date().toISOString(),
        }).eq("id", stream.id);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "end_stream") {
      const { data: stream } = await supabase
        .from("streams")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (stream) {
        await supabase.from("streams").update({
          status: "offline",
          viewer_count: 0,
          updated_at: new Date().toISOString(),
        }).eq("id", stream.id);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "update_topic") {
      const { topic } = body;
      const { data: stream } = await supabase
        .from("streams")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (stream) {
        await supabase.from("streams").update({ topic, updated_at: new Date().toISOString() }).eq("id", stream.id);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "chat") {
      const { stream_id, user_id, display_name, content } = body;
      if (!content?.trim() || content.trim().length > 300) {
        return NextResponse.json({ error: "Invalid message" }, { status: 400 });
      }
      const { error } = await supabase.from("stream_chat").insert({
        stream_id,
        user_id: user_id || null,
        display_name: display_name || "NAVI User",
        content: content.trim(),
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Increment viewer count as a rough engagement metric
      await supabase.from("streams").update({
        viewer_count: Math.floor(Math.random() * 5) + 1, // placeholder
      }).eq("id", stream_id);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[streams] POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
