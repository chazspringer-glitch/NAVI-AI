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
