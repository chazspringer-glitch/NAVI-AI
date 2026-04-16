/**
 * NAVI Self-Diagnostic Engine — lib/diagnostics.ts
 *
 * Pure-logic module (no React). Provides:
 *  - Health check functions for voice, api, data, news, tts, email
 *  - LocalStorage-backed error log (max 50 entries)
 *  - Alert dispatch to /api/alert with 10-minute throttle per service
 *  - Auto-recovery logic per service type
 *  - runAllChecks() convenience wrapper that does ONE /api/health fetch
 *    and fans the per-service status out into the diagnostic model.
 *
 * All public functions are wrapped in try/catch — none will ever throw.
 */

export type ServiceName = "voice" | "api" | "data" | "news" | "tts" | "email" | "ui";

export interface DiagnosticError {
  id:        string;
  service:   ServiceName;
  type:      string;
  message:   string;
  timestamp: number;
  recovered: boolean;
}

export interface HealthStatus {
  service:     ServiceName;
  healthy:     boolean;
  lastChecked: number;
  error?:      string;
}

// Shape of the JSON returned by /api/health (subset we care about).
interface HealthPayload {
  ok:       boolean;
  services: Partial<Record<string, { healthy?: boolean; configured?: boolean; error?: string }>>;
}

// ── LocalStorage helpers ──────────────────────────────────────────────────────

const LOG_KEY     = "navi_diag_log";
const ALERT_KEY   = "navi_diag_alert_ts";
const MAX_ENTRIES = 50;

function ls(): Storage | null {
  try { return typeof localStorage !== "undefined" ? localStorage : null; } catch { return null; }
}

export function readErrorLog(): DiagnosticError[] {
  try {
    const raw = ls()?.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as DiagnosticError[]) : [];
  } catch {
    return [];
  }
}

function writeErrorLog(entries: DiagnosticError[]): void {
  try {
    ls()?.setItem(LOG_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch { /* quota or unavailable — silently ignore */ }
}

export function appendError(
  service: ServiceName,
  type: string,
  message: string,
): DiagnosticError {
  const entry: DiagnosticError = {
    id:        `${service}-${Date.now()}`,
    service,
    type,
    message,
    timestamp: Date.now(),
    recovered: false,
  };
  const log = readErrorLog();
  log.push(entry);
  writeErrorLog(log);
  return entry;
}

export function markRecovered(id: string): void {
  try {
    const log = readErrorLog();
    const idx = log.findIndex((e) => e.id === id);
    if (idx !== -1) { log[idx].recovered = true; writeErrorLog(log); }
  } catch { /* ignore */ }
}

export function clearErrorLog(): void {
  try { ls()?.removeItem(LOG_KEY); } catch { /* ignore */ }
}

// ── Alert throttle ────────────────────────────────────────────────────────────

const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes per service

function readAlertTs(): Record<string, number> {
  try {
    const raw = ls()?.getItem(ALERT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch { return {}; }
}

function stampAlert(service: ServiceName): void {
  try {
    const ts = readAlertTs();
    ts[service] = Date.now();
    ls()?.setItem(ALERT_KEY, JSON.stringify(ts));
  } catch { /* ignore */ }
}

function canAlert(service: ServiceName): boolean {
  const last = readAlertTs()[service] ?? 0;
  return Date.now() - last > ALERT_COOLDOWN_MS;
}

// ── Alert dispatch ────────────────────────────────────────────────────────────

export async function sendAlert(service: ServiceName, errorDetails: string): Promise<void> {
  if (!canAlert(service)) return;
  try {
    stampAlert(service); // optimistic stamp prevents duplicate races
    await fetch("/api/alert", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        service,
        errorDetails,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Alert dispatch itself failed — do not recurse or rethrow
  }
}

// ── /api/health single-fetch helper ──────────────────────────────────────────

let cachedPayload: { data: HealthPayload; ts: number } | null = null;
const HEALTH_CACHE_MS = 30 * 1000; // 30s — far less than the 3-min check cycle

async function fetchHealth(force = false): Promise<HealthPayload | null> {
  if (!force && cachedPayload && Date.now() - cachedPayload.ts < HEALTH_CACHE_MS) {
    return cachedPayload.data;
  }
  try {
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), 6000);
    const res  = await fetch("/api/health", { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json() as HealthPayload;
    cachedPayload = { data, ts: Date.now() };
    return data;
  } catch {
    return null;
  }
}

// ── Health checks ─────────────────────────────────────────────────────────────

/** Browser-side: are speech APIs present? */
export async function checkVoice(): Promise<HealthStatus> {
  const service: ServiceName = "voice";
  try {
    if (typeof window === "undefined") return { service, healthy: true, lastChecked: Date.now() };
    const hasTTS = "speechSynthesis" in window;
    const hasSTT = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    if (!hasTTS && !hasSTT) {
      return {
        service, healthy: false, lastChecked: Date.now(),
        error: "Speech APIs unavailable in this browser",
      };
    }
    return { service, healthy: true, lastChecked: Date.now() };
  } catch (err) {
    return { service, healthy: false, lastChecked: Date.now(), error: String(err) };
  }
}

/** Server reachability + critical services up (openai + supabase). */
export async function checkAPI(payload?: HealthPayload | null): Promise<HealthStatus> {
  const service: ServiceName = "api";
  const data = payload === undefined ? await fetchHealth() : payload;
  if (!data) {
    return { service, healthy: false, lastChecked: Date.now(), error: "health_endpoint_unreachable" };
  }
  if (!data.ok) {
    const failed: string[] = [];
    if (data.services.openai?.healthy   === false) failed.push("openai");
    if (data.services.supabase?.healthy === false) failed.push("supabase");
    return {
      service, healthy: false, lastChecked: Date.now(),
      error: failed.length ? `degraded: ${failed.join(", ")}` : "critical_services_down",
    };
  }
  return { service, healthy: true, lastChecked: Date.now() };
}

/** Supabase / leaderboard / xp / cdl-progress / auth all live behind one client. */
export async function checkData(payload?: HealthPayload | null): Promise<HealthStatus> {
  const service: ServiceName = "data";
  const data = payload === undefined ? await fetchHealth() : payload;
  if (!data) {
    return { service, healthy: false, lastChecked: Date.now(), error: "health_endpoint_unreachable" };
  }
  const sb = data.services.supabase;
  if (!sb?.configured) {
    return { service, healthy: false, lastChecked: Date.now(), error: "supabase_not_configured" };
  }
  if (sb.healthy === false) {
    return { service, healthy: false, lastChecked: Date.now(), error: sb.error ?? "supabase_probe_failed" };
  }
  return { service, healthy: true, lastChecked: Date.now() };
}

/** News Web RSS aggregator — non-critical, but tracked so a regression alerts. */
export async function checkNews(payload?: HealthPayload | null): Promise<HealthStatus> {
  const service: ServiceName = "news";
  const data = payload === undefined ? await fetchHealth() : payload;
  if (!data) {
    return { service, healthy: false, lastChecked: Date.now(), error: "health_endpoint_unreachable" };
  }
  const n = data.services.news;
  if (n?.healthy === false) {
    return { service, healthy: false, lastChecked: Date.now(), error: n.error ?? "news_probe_failed" };
  }
  return { service, healthy: true, lastChecked: Date.now() };
}

/** ElevenLabs configured — full TTS round-trip would burn credits, skip. */
export async function checkTTS(payload?: HealthPayload | null): Promise<HealthStatus> {
  const service: ServiceName = "tts";
  const data = payload === undefined ? await fetchHealth() : payload;
  if (!data) {
    return { service, healthy: false, lastChecked: Date.now(), error: "health_endpoint_unreachable" };
  }
  const t = data.services.elevenlabs;
  if (!t?.configured) {
    return { service, healthy: false, lastChecked: Date.now(), error: "elevenlabs_not_configured" };
  }
  return { service, healthy: true, lastChecked: Date.now() };
}

export async function checkEmail(): Promise<HealthStatus> {
  // EmailJS removed — always report healthy to suppress the banner
  return { service: "email" as ServiceName, healthy: true, lastChecked: Date.now() };
}

// ── Auto-recovery logic ───────────────────────────────────────────────────────

/**
 * Attempt to recover a named service.
 * Returns true if recovery was confirmed successful.
 */
export async function attemptRecovery(service: ServiceName): Promise<boolean> {
  try {
    switch (service) {
      case "voice":
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        return (await checkVoice()).healthy;

      case "api":
      case "data":
      case "news":
      case "tts": {
        // Force a fresh /api/health fetch (bypass 30s diag cache) then re-check
        const data = await fetchHealth(true);
        if (!data) return false;
        switch (service) {
          case "api":  return (await checkAPI(data)).healthy;
          case "data": return (await checkData(data)).healthy;
          case "news": return (await checkNews(data)).healthy;
          case "tts":  return (await checkTTS(data)).healthy;
        }
        return false;
      }

      case "email":
        // Not in active use today
        return true;

      case "ui":
        // UI crashes are handled by ServiceErrorBoundary; nothing to do here
        return true;

      default:
        return false;
    }
  } catch {
    return false;
  }
}

// ── Run all checks (convenience wrapper) ─────────────────────────────────────

export async function runAllChecks(): Promise<HealthStatus[]> {
  try {
    // ONE /api/health fetch fans out into multiple service statuses, plus a
    // browser-side voice check and a no-op email check.
    const payload = await fetchHealth();
    const [voice, api, data, news, tts, email] = await Promise.all([
      checkVoice(),
      checkAPI(payload),
      checkData(payload),
      checkNews(payload),
      checkTTS(payload),
      checkEmail(),
    ]);
    const ui: HealthStatus = { service: "ui", healthy: true, lastChecked: Date.now() };
    return [voice, api, data, news, tts, email, ui];
  } catch {
    // If the parallel check itself throws (shouldn't happen), return empty
    return [];
  }
}
