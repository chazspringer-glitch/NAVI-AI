import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/work-orders          — returns ALL work orders (founder view)
 * GET /api/work-orders?user_id= — returns only that user's orders (client view)
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");

    let query = supabase
      .from("work_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[api/work-orders] Error:", error.message);
      return NextResponse.json({ orders: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data ?? [] });
  } catch (err) {
    console.error("[api/work-orders] Error:", err);
    return NextResponse.json({ orders: [], error: "Failed to fetch" }, { status: 500 });
  }
}

/**
 * PATCH /api/work-orders — update status on a work order
 * Body: { id: string, status: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json() as { id?: string; status?: string };
    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }
    const { error } = await supabase
      .from("work_orders")
      .update({ status })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/work-orders] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
