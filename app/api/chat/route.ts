import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { parseAction, type AgentAction } from "@/lib/actions";
import { routeToAgent } from "@/lib/agents/router";
import type { AgentParams, MentorMode } from "@/lib/agents/types";

export const runtime     = "nodejs";
export const maxDuration = 30;

// Module-level singleton — reused across warm invocations on Vercel
let _openai: import("openai").default | null = null;
function getOpenAIClient(apiKey: string) {
  if (!_openai) _openai = new OpenAI({ apiKey });
  return _openai;
}

interface ChatRequestBody {
  message: string;
  userName: string;
  petName: string;
  mood: string;
  bondLevel: number;
  bondName: string;
  mentorMode: MentorMode;
  appMode?: string;
  history: { role: "user" | "assistant"; content: string }[];
}

interface ThinkingOutput {
  memory: string;
  goals: string;
  plan: string;
  response: string;
  action?: unknown;
}

// ── Parse model output ────────────────────────────────────────────────────────
function extractReply(raw: string): {
  reply: string;
  action: AgentAction | null;
  thinking: Omit<ThinkingOutput, "response" | "action"> | null;
} {
  try {
    const parsed = JSON.parse(raw) as Partial<ThinkingOutput>;
    const reply = parsed.response?.trim();
    if (!reply) throw new Error("Empty response field");
    return {
      reply,
      action: parseAction(parsed.action ?? null),
      thinking: {
        memory: parsed.memory ?? "",
        goals:  parsed.goals  ?? "",
        plan:   parsed.plan   ?? "",
      },
    };
  } catch {
    return { reply: raw.trim() || "...", action: null, thinking: null };
  }
}

// ── POST /api/chat ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured. Add it to your environment variables." },
      { status: 500 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    message, userName, petName, mood,
    bondLevel, bondName, mentorMode = "chat", appMode = "companion", history,
  } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  // Route to the correct agent based on appMode
  const agent = routeToAgent(appMode);

  const params: AgentParams = {
    petName, userName, mood, bondLevel, bondName, mentorMode,
  };

  const client = getOpenAIClient(apiKey);

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens:      agent.getMaxTokens(params),
      temperature:     agent.getTemperature(params),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: agent.getSystemPrompt(params) },
        ...history,
        { role: "user", content: message },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const { reply, action, thinking } = extractReply(raw);

    return NextResponse.json({ reply, action, thinking });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "OpenAI request failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
