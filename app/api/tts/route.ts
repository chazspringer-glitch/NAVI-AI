import { NextRequest, NextResponse } from "next/server";

export const runtime    = "nodejs";
export const maxDuration = 25;

const VOICE_ID = "OOk3INdXVLRmSaQoAX9D";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
  }

  let text: string;
  try {
    ({ text } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const snippet = text.trim().slice(0, 60);
  console.log(`[TTS] Requesting voice for: "${snippet}${text.length > 60 ? "…" : ""}" (voice: ${VOICE_ID})`);

  const elevenRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_22050_32`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
        },
      }),
    }
  );

  if (!elevenRes.ok) {
    const msg = await elevenRes.text().catch(() => "");
    console.error("[TTS] ElevenLabs error:", elevenRes.status, msg.slice(0, 200));
    return NextResponse.json({ error: "TTS service error" }, { status: elevenRes.status });
  }

  const audioBuffer = await elevenRes.arrayBuffer();
  console.log(`[TTS] Returning ${audioBuffer.byteLength} bytes`);

  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
