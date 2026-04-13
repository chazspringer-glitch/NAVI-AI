import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime     = "nodejs";
export const maxDuration = 30;

let _openai: OpenAI | null = null;
function getClient(key: string): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: key });
  return _openai;
}

interface LessonMessage {
  role: "navi" | "user";
  content: string;
}

interface LessonData {
  title: string;
  objectives: { id: string; text: string }[];
  concepts: string[];
  task: { instruction: string; hint: string };
}

interface LessonChatBody {
  messages: LessonMessage[];
  lesson: LessonData;
  courseType: string;  // "stem" | "ai_skills"
  studentName: string;
}

function buildSystemPrompt(lesson: LessonData, courseType: string, studentName: string): string {
  const name = studentName || "the student";
  const objectives = lesson.objectives.map((o, i) => `${i + 1}. ${o.text}`).join("\n");
  const concepts   = lesson.concepts.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const isKids     = courseType === "stem";

  if (isKids) {
    return `You are NAVI, a fun and encouraging AI guide teaching "${lesson.title}" to ${name} (ages 10–16).

LEARNING OBJECTIVES FOR THIS LESSON:
${objectives}

CONCEPTS TO TEACH (one at a time, in order):
${concepts}

TASK THE STUDENT MUST COMPLETE:
${lesson.task.instruction}
Hint for the student: ${lesson.task.hint}

YOUR TEACHING RULES:
- Keep every message SHORT — 2 to 4 sentences maximum. One idea at a time.
- Teach ONE concept, then ask ONE simple question before moving to the next.
- Use simple, clear language. No jargon. Fun real-world examples work great.
- Be warm and encouraging. Celebrate their thinking! Use occasional emojis 🌟
- Progress through ALL concepts before presenting the task.
- When you present the task, state it clearly and wait for their full response.
- Accept the task as complete when the student gives a genuine, specific answer that shows they engaged with the material — don't require perfection.
- When the lesson is complete, set complete to true.
- Always include a "suggestion" field: a short, realistic sample answer (1 sentence) the student could give to continue the conversation. This helps students who need guidance. Set suggestion to null only when complete is true.

RESPONSE FORMAT — always return valid JSON:
{ "message": "your short message to the student", "complete": false, "suggestion": "a short realistic sample answer the student could give" }
When task is done: { "message": "encouraging completion message", "complete": true, "suggestion": null }`;
  }

  return `You are NAVI, a direct and practical AI skills coach teaching "${lesson.title}" to ${name}.

LESSON OBJECTIVES:
${objectives}

CONCEPTS TO COVER (one at a time, in order):
${concepts}

TASK TO COMPLETE:
${lesson.task.instruction}
Hint: ${lesson.task.hint}

COACHING APPROACH:
- Be direct and concise. Professionals have limited time.
- Cover ONE concept at a time, then ask one sharp application question before proceeding.
- Focus on real-world outcomes, not theory. Connect everything to their actual work.
- Progress through ALL concepts before assigning the task.
- When you present the task, state it precisely. Wait for their full response.
- Accept the task as complete when the professional submits a genuine, specific, work-relevant answer that demonstrates real engagement — not a test answer, a real one.
- When complete, keep the acknowledgment brief and professional.
- Always include a "suggestion" field: a brief, realistic professional example response (1 sentence) the user could give to continue. Set suggestion to null only when complete is true.

RESPONSE FORMAT — always return valid JSON:
{ "message": "your response", "complete": false, "suggestion": "brief realistic professional example response" }
When task is done: { "message": "brief professional acknowledgment", "complete": true, "suggestion": null }`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  let body: LessonChatBody;
  try {
    body = (await req.json()) as LessonChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages, lesson, courseType, studentName } = body;

  if (!messages?.length || !lesson?.title) {
    return NextResponse.json({ error: "messages and lesson are required" }, { status: 400 });
  }

  // Map lesson messages → OpenAI format (navi = assistant, user = user)
  const openaiMessages = messages.map((m) => ({
    role: (m.role === "navi" ? "assistant" : "user") as "assistant" | "user",
    content: m.content,
  }));

  const client = getClient(apiKey);

  try {
    const completion = await client.chat.completions.create({
      model:           "gpt-4o-mini",
      max_tokens:      480,
      temperature:     0.68,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(lesson, courseType, studentName) },
        ...openaiMessages,
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let content    = "";
    let complete   = false;
    let suggestion: string | null = null;

    try {
      const parsed = JSON.parse(raw) as { message?: string; complete?: boolean; suggestion?: string | null };
      content    = (parsed.message ?? "").trim();
      complete   = !!parsed.complete;
      suggestion = (typeof parsed.suggestion === "string" && parsed.suggestion.trim())
        ? parsed.suggestion.trim()
        : null;
    } catch {
      content = raw.trim();
    }

    if (!content) content = "Let me rephrase — could you share a bit more about your thinking?";
    return NextResponse.json({ content, complete, suggestion });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
