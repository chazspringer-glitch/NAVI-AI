import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { EMAIL_RECEIVER } from "@/lib/emailConfig";

export const runtime     = "nodejs";
export const maxDuration = 45;

// ── EmailJS recipient — single source of truth in lib/emailConfig.ts ─────────
const OWNER_EMAIL = EMAIL_RECEIVER;

let _openai: OpenAI | null = null;
function getClient(key: string): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: key });
  return _openai;
}

interface Answer {
  question: string;
  answer:   string;
}

interface RequestBody {
  service:      string;
  answers:      Answer[];
  businessName: string;
  email:        string;
  user_id?:     string;
}

interface WorkOrder {
  clientName:   string;
  service:      string;
  summary:      string;
  objectives:   string[];
  deliverables: string[];
  timeline:     string;
  notes:        string;
}

interface Strategy {
  winningAngle:    string;
  approach:        string;
  contentIdeas:    string[];
  growthDirection: string;
  nextSteps:       string[];
}

const SYSTEM_PROMPT = `You are a senior business strategist and creative director at Springer Industries — an AI-powered marketing and automation company. Generate a professional work order and strategic plan based on a client intake.

Return ONLY valid JSON with this exact structure, no markdown, no extra keys:
{
  "workOrder": {
    "clientName":    "string",
    "service":       "string",
    "summary":       "string — 2-3 sentences describing the client's situation and core need",
    "objectives":    ["string","string","string"],
    "deliverables":  ["string","string","string","string"],
    "timeline":      "string — realistic timeline estimate (e.g., '4–6 weeks')",
    "notes":         "string — key insights and important details from the intake"
  },
  "strategy": {
    "winningAngle":    "string — the unique competitive advantage or hook for this specific client",
    "approach":        "string — 2-3 sentences on the recommended strategic approach",
    "contentIdeas":    ["string","string","string"],
    "growthDirection": "string — 1-2 sentences on growth trajectory and opportunity",
    "nextSteps":       ["string","string","string"]
  }
}`;

// ── Send via EmailJS REST API ─────────────────────────────────────────────────
async function sendViaEmailJS(
  workOrder: WorkOrder,
  strategy:  Strategy,
  answers:   Answer[],
  email:     string,
  qaText:    string,
): Promise<boolean> {
  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn("[onboard] EmailJS credentials not configured — skipping email send.");
    return false;
  }

  const submissionDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  // Find specific answers by position in the standard question layout:
  // index 0 = business name, index 1 = client email, last = notes
  const businessName   = answers[0]?.answer  || workOrder.clientName;
  const clientEmail    = email               || answers[1]?.answer || "Not provided";
  const notesAnswer    = answers[answers.length - 1]?.answer || "";

  // Extract service-specific answers (indices 2 through second-to-last)
  const serviceQA = answers.slice(2, -1)
    .map((a) => `• ${a.question}\n  ${a.answer}`)
    .join("\n\n");

  const templateParams = {
    // ── Routing ──
    to_email:   OWNER_EMAIL,
    reply_to:   clientEmail,

    // ── Client info ──
    client_name:    businessName,
    business_name:  businessName,
    client_email:   clientEmail,
    service:        workOrder.service,
    submission_date: submissionDate,

    // ── Work order ──
    work_order_summary: workOrder.summary,
    objectives:  (workOrder.objectives  ?? []).map((o, i) => `${i + 1}. ${o}`).join("\n"),
    deliverables:(workOrder.deliverables ?? []).map((d) => `• ${d}`).join("\n"),
    timeline:    workOrder.timeline ?? "TBD",
    notes:       notesAnswer || workOrder.notes || "None",

    // ── AI Strategy ──
    winning_angle:    strategy.winningAngle    ?? "",
    approach:         strategy.approach        ?? "",
    content_ideas:    (strategy.contentIdeas  ?? []).map((c, i) => `${i + 1}. ${c}`).join("\n"),
    growth_direction: strategy.growthDirection ?? "",
    next_steps:       (strategy.nextSteps     ?? []).map((s, i) => `${i + 1}. ${s}`).join("\n"),

    // ── Full intake Q&A ──
    service_qa:  serviceQA,
    full_intake: qaText,
  };

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:      serviceId,
        template_id:     templateId,
        user_id:         publicKey,
        template_params: templateParams,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[onboard] EmailJS failed (${res.status}): ${body}`);
      return false;
    }

    console.log(`[onboard] Work order sent to ${OWNER_EMAIL}`);
    return true;
  } catch (err) {
    console.error("[onboard] EmailJS network error:", err);
    return false;
  }
}

// ── POST /api/onboard ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API not configured." }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { service, answers, businessName, email, user_id } = body;

  if (!service || !answers?.length) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (user_id) {
    console.log("[onboard] Authenticated user:", user_id, "| Service:", service);
  }

  const qaText = answers
    .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer || "(no answer)"}`)
    .join("\n\n");

  const userPrompt = `Service Requested: ${service}
Client / Business: ${businessName || "Unknown"}
Contact Email: ${email || "Not provided"}

INTAKE Q&A:
${qaText}

Generate a detailed work order and strategic plan tailored specifically to this client's situation.`;

  let workOrder: WorkOrder;
  let strategy:  Strategy;

  try {
    const openai     = getClient(apiKey);
    const completion = await openai.chat.completions.create({
      model:           "gpt-4o-mini",
      max_tokens:      1400,
      temperature:     0.72,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt    },
      ],
    });

    const raw    = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { workOrder?: WorkOrder; strategy?: Strategy };

    if (!parsed.workOrder || !parsed.strategy) {
      throw new Error("Incomplete response from model");
    }

    workOrder = parsed.workOrder;
    strategy  = parsed.strategy;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // ── Fire-and-await email (non-blocking for error purposes — always return 200) ──
  const emailSent = await sendViaEmailJS(workOrder, strategy, answers, email, qaText);

  // Service-specific log for public speaking inquiries
  if (service === "Speaking Engagement") {
    console.log(`[onboard] Public speaking inquiry sent to ${OWNER_EMAIL}`);
  }

  // Fallback log: always confirm the destination regardless of send result
  if (!emailSent) {
    console.log(`[onboard] Email not sent via EmailJS. Destination would be: ${OWNER_EMAIL}`);
    console.log(`[onboard] Configure EMAILJS_SERVICE_ID / EMAILJS_TEMPLATE_ID / EMAILJS_PUBLIC_KEY to enable auto-send.`);
  }

  return NextResponse.json({ workOrder, strategy, emailSent });
}
