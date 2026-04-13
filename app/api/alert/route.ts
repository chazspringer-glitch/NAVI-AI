import { NextRequest, NextResponse } from "next/server";
import { EMAIL_RECEIVER } from "@/lib/emailConfig";

export const runtime     = "nodejs";
export const maxDuration = 15;

/**
 * POST /api/alert
 *
 * Called by the NAVI Self-Diagnostic Engine when a service failure is detected
 * and cannot be auto-recovered. Sends an alert email to the owner via EmailJS.
 *
 * Body: { service: string; errorDetails: string; timestamp: string }
 *
 * Uses the same EmailJS credentials as /api/onboard so no extra config is needed.
 * If EmailJS is not configured the alert is logged to the server console instead.
 */
export async function POST(req: NextRequest) {
  let body: { service?: string; errorDetails?: string; timestamp?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const service      = body.service      ?? "unknown";
  const errorDetails = body.errorDetails ?? "No details provided";
  const timestamp    = body.timestamp    ?? new Date().toISOString();

  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;

  // ── Fallback: log to console if EmailJS is not configured ─────────────────
  if (!serviceId || !templateId || !publicKey) {
    console.warn("[NAVI Alert] EmailJS not configured — alert logged to console:");
    console.warn(`  Service:   ${service}`);
    console.warn(`  Error:     ${errorDetails}`);
    console.warn(`  Timestamp: ${timestamp}`);
    return NextResponse.json({ sent: false, reason: "EmailJS not configured" });
  }

  // ── Build human-readable alert body ──────────────────────────────────────
  const alertMessage = [
    "NAVI SELF-DIAGNOSTIC ALERT",
    "──────────────────────────",
    `Service:     ${service}`,
    `Error:       ${errorDetails}`,
    `Timestamp:   ${timestamp}`,
    "",
    "This alert was generated automatically by NAVI's self-diagnostic engine.",
    "The system attempted auto-recovery. Please review if the issue persists.",
    "",
    "— NAVI Diagnostic Engine v1",
  ].join("\n");

  // ── Send via EmailJS REST API (same template as work order delivery) ──────
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:  serviceId,
        template_id: templateId,
        user_id:     publicKey,
        template_params: {
          // ── Routing ──
          to_email:        EMAIL_RECEIVER,
          reply_to:        EMAIL_RECEIVER,

          // ── Mapped to common work-order template fields ──
          client_name:         "NAVI Diagnostic Engine",
          business_name:       "NAVI System Alert",
          client_email:        EMAIL_RECEIVER,
          service:             `⚠️ Alert — ${service} service issue`,
          submission_date:     timestamp,

          // ── Alert body mapped to summary fields ──
          work_order_summary:  alertMessage,
          full_intake:         alertMessage,
          notes:               errorDetails,

          // ── Empty required template fields ──
          objectives:      "",
          deliverables:    "",
          timeline:        "",
          winning_angle:   "",
          approach:        "",
          content_ideas:   "",
          growth_direction: "",
          next_steps:      "",
          service_qa:      "",
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[NAVI Alert] EmailJS error ${res.status}: ${text.slice(0, 200)}`);
      return NextResponse.json({ sent: false, reason: `EmailJS HTTP ${res.status}` });
    }

    console.log(`[NAVI Alert] Diagnostic alert sent to ${EMAIL_RECEIVER} for service: ${service}`);
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[NAVI Alert] Failed to dispatch alert:", err);
    return NextResponse.json({ sent: false, reason: String(err) });
  }
}
