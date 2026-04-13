import { NextRequest, NextResponse } from "next/server";
import { EMAIL_RECEIVER } from "@/lib/emailConfig";

export const runtime     = "nodejs";
export const maxDuration = 30;

interface RequestBody {
  podcastName:    string;
  niche:          string;
  targetAudience: string;
  platformLinks:  string;
  audienceSize:   string;
  goals:          string;
  whyPartner:     string;
}

// ── EmailJS send ──────────────────────────────────────────────────────────────

async function sendViaEmailJS(params: Record<string, string>): Promise<boolean> {
  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn("[podcast] EmailJS credentials not configured — skipping email send.");
    return false;
  }

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:      serviceId,
        template_id:     templateId,
        user_id:         publicKey,
        template_params: params,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[podcast] EmailJS failed (${res.status}): ${body}`);
      return false;
    }

    console.log(`[podcast] Podcast partnership application sent to ${EMAIL_RECEIVER}`);
    return true;
  } catch (err) {
    console.error("[podcast] EmailJS network error:", err);
    return false;
  }
}

// ── POST /api/podcast-application ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    podcastName, niche, targetAudience,
    platformLinks, audienceSize, goals, whyPartner,
  } = body;

  if (!podcastName?.trim()) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const submissionDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const fullIntake = [
    "PODCAST PARTNERSHIP APPLICATION",
    `Submitted: ${submissionDate}`,
    "",
    "1. PODCAST NAME",
    podcastName,
    "",
    "2. NICHE / TOPIC",
    niche || "(not provided)",
    "",
    "3. TARGET AUDIENCE",
    targetAudience || "(not provided)",
    "",
    "4. PLATFORM LINKS",
    platformLinks || "(not provided)",
    "",
    "5. AUDIENCE SIZE",
    audienceSize || "(not provided)",
    "",
    "6. GOALS",
    goals || "(not provided)",
    "",
    "7. WHY PARTNER WITH NAVI",
    whyPartner || "(not provided)",
  ].join("\n");

  const templateParams = {
    to_email:        EMAIL_RECEIVER,
    reply_to:        EMAIL_RECEIVER,
    client_name:     podcastName,
    business_name:   podcastName,
    client_email:    "Not provided",
    service:         `Podcast Partnership Application – ${podcastName}`,
    submission_date: submissionDate,

    // Map to existing work-order template fields
    work_order_summary: `Podcast partnership application from "${podcastName}". Niche: ${niche}. Audience size: ${audienceSize}.`,
    objectives:         goals          || "Not provided",
    deliverables:       `Review and respond to partnership application for "${podcastName}"`,
    timeline:           "Review within 5–7 business days",
    notes:              `Why partner with NAVI: ${whyPartner}\n\nPlatform links: ${platformLinks}`,
    winning_angle:      `Target audience: ${targetAudience}`,
    approach:           goals          || "Not provided",
    content_ideas:      niche          || "Not provided",
    growth_direction:   goals          || "Not provided",
    next_steps:         `Review application from "${podcastName}" and schedule a partnership call`,
    service_qa:         `Audience size: ${audienceSize}\nNiche: ${niche}\nPlatforms: ${platformLinks}`,
    full_intake:        fullIntake,
  };

  try {
    const emailSent = await sendViaEmailJS(templateParams);

    if (!emailSent) {
      console.log(
        `[podcast] Application not sent via EmailJS. Destination would be: ${EMAIL_RECEIVER}`,
      );
      console.log(
        "[podcast] Configure EMAILJS_SERVICE_ID / EMAILJS_TEMPLATE_ID / EMAILJS_PUBLIC_KEY to enable auto-send.",
      );
    }

    // Always return success — the application data was received
    return NextResponse.json({ success: true, emailSent });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Submission failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
