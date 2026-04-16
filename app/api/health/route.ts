import { NextResponse } from "next/server";
import { EMAIL_RECEIVER } from "@/lib/emailConfig";
import { supabase } from "@/lib/supabase";
import { readNewsCache, isNewsCacheFresh } from "@/lib/newsCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Returns:
 *  - Per-service "configured" booleans (env vars present)
 *  - Live probes for the dependencies the app actually needs to function
 *    today: Supabase (auth + leaderboard + xp), and News cache freshness.
 *  - A top-level `ok` boolean that is true only when every CRITICAL probe
 *    passes. Diagnostics consumers (lib/diagnostics.ts) flip into
 *    safe-mode based on this.
 *
 * Critical = openai (chat is core) and supabase (auth/leaderboard).
 * News + TTS are non-critical: degraded but app still works.
 *
 * Does NOT expose actual key values — only booleans + truncated prefixes.
 */
export async function GET() {
  const startedAt = Date.now();

  const openaiKey = process.env.OPENAI_API_KEY || "";
  const emailjsConfigured = !!(
    process.env.EMAILJS_SERVICE_ID &&
    process.env.EMAILJS_TEMPLATE_ID &&
    process.env.EMAILJS_PUBLIC_KEY
  );

  // ── Live probes ─────────────────────────────────────────────────────────
  const supabaseProbe = await probeSupabase();
  const newsProbe     = probeNews();

  const services = {
    openai: {
      configured: !!openaiKey,
      healthy:    !!openaiKey, // env-only check; calling OpenAI on every health probe would burn credits
      prefix:     openaiKey ? openaiKey.substring(0, 7) + "..." : "MISSING",
      label:      "OpenAI (Chat + Logo)",
    },
    supabase: {
      configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      healthy:    supabaseProbe.ok,
      error:      supabaseProbe.error,
      latencyMs:  supabaseProbe.latencyMs,
      label:      "Supabase (Auth + Database)",
    },
    stripe: {
      configured: !!process.env.STRIPE_SECRET_KEY,
      healthy:    !!process.env.STRIPE_SECRET_KEY,
      label:      "Stripe (Checkout)",
    },
    elevenlabs: {
      configured: !!process.env.ELEVENLABS_API_KEY,
      healthy:    !!process.env.ELEVENLABS_API_KEY, // env-only — calling TTS burns characters
      label:      "ElevenLabs (Voice TTS)",
    },
    news: {
      configured: true, // public RSS — no env needed
      healthy:    newsProbe.ok,
      cached:     newsProbe.cached,
      itemCount:  newsProbe.itemCount,
      ageMs:      newsProbe.ageMs,
      error:      newsProbe.error,
      label:      "News Web (RSS Aggregator)",
    },
    emailjs: {
      configured: emailjsConfigured,
      healthy:    true, // not in use today; never block on it
      label:      "EmailJS (legacy — unused)",
    },
  };

  // App is "ok" only when both critical services are healthy
  const criticalOk = services.openai.healthy && services.supabase.healthy;

  return NextResponse.json({
    ok:         criticalOk,
    timestamp:  Date.now(),
    durationMs: Date.now() - startedAt,
    services,
    ownerEmail: EMAIL_RECEIVER,
    version:    "1.1.0",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Probes
// ─────────────────────────────────────────────────────────────────────────────

async function probeSupabase(): Promise<{ ok: boolean; error?: string; latencyMs?: number }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false, error: "supabase_env_missing" };
  }
  const t0 = Date.now();
  try {
    // Lightweight head-count query against a known table. RLS is disabled
    // on leaderboard, so the anon key can read this without auth.
    const { error } = await supabase
      .from("leaderboard")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (error) return { ok: false, error: error.message, latencyMs: Date.now() - t0 };
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err), latencyMs: Date.now() - t0 };
  }
}

function probeNews(): { ok: boolean; cached?: boolean; itemCount?: number; ageMs?: number; error?: string } {
  // Read the in-memory news cache directly via the shared module — no internal
  // HTTP call, no relative-URL fetch issues. If the cache is empty, we treat
  // that as "warming up" rather than unhealthy: /api/news has just never been
  // hit yet on this server instance.
  const cache = readNewsCache();
  if (!cache) {
    return { ok: true, cached: false, itemCount: 0, error: "warming_up" };
  }
  const ageMs = Date.now() - cache.ts;
  const itemCount = cache.data.length;
  return {
    ok:        itemCount > 0,
    cached:    isNewsCacheFresh(),
    itemCount,
    ageMs,
    error:     itemCount === 0 ? "empty_feed" : undefined,
  };
}
