import { NextRequest, NextResponse } from "next/server";
import { fetchClients, createClient } from "@/lib/clients";

/**
 * GET /api/clients — return all clients
 */
export async function GET() {
  try {
    const clients = await fetchClients();
    return NextResponse.json({ clients });
  } catch (err) {
    console.error("[api/clients] GET error:", err);
    return NextResponse.json({ clients: [], error: "Failed to fetch clients" }, { status: 500 });
  }
}

/**
 * POST /api/clients — create a new client
 * Body: { name, email, business_name, service_type }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, business_name, service_type } = body;

    if (!name || !email || !business_name || !service_type) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, business_name, service_type" },
        { status: 400 },
      );
    }

    const client = await createClient({ name, email, business_name, service_type });

    if (!client) {
      return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }

    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    console.error("[api/clients] POST error:", err);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
