import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("food_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/food-orders] GET error:", error.message);
      return NextResponse.json({ orders: [], error: error.message }, { status: 500 });
    }
    return NextResponse.json({ orders: data ?? [] });
  } catch (err) {
    console.error("[api/food-orders] GET error:", err);
    return NextResponse.json({ orders: [], error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, name, phone, bundle_name, quantity, notes } = body;

    if (!name || !phone || !bundle_name) {
      return NextResponse.json({ error: "Name, phone, and bundle are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("food_orders")
      .insert({
        user_id: user_id || null,
        name,
        phone,
        bundle_name,
        quantity: quantity || 1,
        notes: notes || "",
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("[api/food-orders] POST error:", error.message);
      return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
    }

    console.log("[food-orders] New order:", data.id, bundle_name);
    return NextResponse.json({ order: data }, { status: 201 });
  } catch (err) {
    console.error("[api/food-orders] POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json() as { id?: string; status?: string };
    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }
    const { error } = await supabase
      .from("food_orders")
      .update({ status })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/food-orders] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
