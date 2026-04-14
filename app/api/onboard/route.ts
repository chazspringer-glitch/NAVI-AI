import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export const runtime     = "nodejs";
export const maxDuration = 45;

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

  // ── Save work order to Supabase ──────────────────────────────────────────────
  let saved = false;
  try {
    const { error: dbError } = await supabase.from("work_orders").insert({
      user_id:       user_id || null,
      client_name:   businessName || workOrder.clientName || "Unknown",
      client_email:  email || "",
      business_name: businessName || "",
      service:       service,
      status:        "new",
      answers:       answers,
      work_order:    workOrder,
      strategy:      strategy,
    });

    if (dbError) {
      console.error("[onboard] Supabase save error:", dbError.message);
    } else {
      console.log("[onboard] Work order saved to Supabase for:", businessName);
      saved = true;
    }
  } catch (err) {
    console.error("[onboard] Supabase save failed:", err);
  }

  return NextResponse.json({ workOrder, strategy, saved });
}
