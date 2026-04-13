import { NextResponse } from "next/server";
import { EMAIL_RECEIVER } from "@/lib/emailConfig";

export const runtime = "nodejs";

/**
 * GET /api/health
 * Returns which backend services have credentials configured.
 * Does NOT expose the actual key values — only booleans.
 * Admin-accessible for system diagnostics.
 */
export async function GET() {
  const emailjsConfigured = !!(
    process.env.EMAILJS_SERVICE_ID &&
    process.env.EMAILJS_TEMPLATE_ID &&
    process.env.EMAILJS_PUBLIC_KEY
  );

  return NextResponse.json({
    ok:          true,
    timestamp:   Date.now(),
    services: {
      openai:     { configured: !!process.env.OPENAI_API_KEY,      label: "OpenAI (Chat + Logo)" },
      elevenlabs: { configured: !!process.env.ELEVENLABS_API_KEY,  label: "ElevenLabs (Voice TTS)" },
      emailjs:    { configured: emailjsConfigured,                  label: "EmailJS (Work Order Delivery)" },
    },
    ownerEmail: EMAIL_RECEIVER,
    version:    "1.0.0",
  });
}
