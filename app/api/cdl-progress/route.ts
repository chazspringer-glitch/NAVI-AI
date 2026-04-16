import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    if (!userId) return NextResponse.json({ progress: null });

    const { data, error } = await supabase
      .from("cdl_progress")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[cdl-progress] GET error:", error.message);
    }

    return NextResponse.json({ progress: data || null });
  } catch (err) {
    console.error("[cdl-progress] GET error:", err);
    return NextResponse.json({ progress: null, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, state, current_step, completed_steps } = await req.json();
    if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

    // Upsert — update if exists, insert if not
    const { data: existing } = await supabase
      .from("cdl_progress")
      .select("id")
      .eq("user_id", user_id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("cdl_progress")
        .update({ state, current_step, completed_steps })
        .eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase
        .from("cdl_progress")
        .insert({ user_id, state: state || "", current_step: current_step || 0, completed_steps: completed_steps || [] });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cdl-progress] POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
