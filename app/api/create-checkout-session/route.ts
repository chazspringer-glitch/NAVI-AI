import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: "price_1TLtQu2VWyIMcPTNkv7Q3Dyz",
          quantity: 1,
        },
      ],
      success_url: `${origin}/course-access?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
    });

    console.log("[Stripe] Checkout session created:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[Stripe] Error:", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
