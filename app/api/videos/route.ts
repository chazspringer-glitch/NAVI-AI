import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");

    let query = supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[api/videos] Error:", error.message);
      return NextResponse.json({ videos: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ videos: data ?? [] });
  } catch (err) {
    console.error("[api/videos] Error:", err);
    return NextResponse.json({ videos: [], error: "Failed" }, { status: 500 });
  }
}
