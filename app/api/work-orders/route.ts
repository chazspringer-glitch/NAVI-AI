import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("work_orders")
      .select("*")
      .order("created_at", { ascending: false });

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
