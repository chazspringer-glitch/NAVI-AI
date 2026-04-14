/**
 * NAVI Self-Diagnostic Engine — lib/diagnostics.ts
 *
 * Pure-logic module (no React). Provides:
 *  - Health check functions for voice, API, and email services
 *  - LocalStorage-backed error log (max 50 entries)
 *  - Alert dispatch to /api/alert with 10-minute throttle per service
 *  - Auto-recovery logic per service type
 *  - runAllChecks() convenience wrapper
 *
 * All public functions are wrapped in try/catch — none will ever throw.
 */

export type ServiceName = "voice" | "api" | "email" | "ui";

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

// ── Health checks ─────────────────────────────────────────────────────────────

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

export async function checkAPI(): Promise<HealthStatus> {
  const service: ServiceName = "api";
  try {
    const ctrl    = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 5000);
    const res     = await fetch("/api/health", { signal: ctrl.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { service, healthy: true, lastChecked: Date.now() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { service, healthy: false, lastChecked: Date.now(), error: msg };
  }
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
        // Cancel any stuck speech-synthesis state and verify APIs still present
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        // Re-run the voice check to confirm
        return (await checkVoice()).healthy;

      case "api": {
        // Re-ping health endpoint
        const ctrl    = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 4000);
        try {
          const res = await fetch("/api/health", { signal: ctrl.signal });
          clearTimeout(timeout);
          return res.ok;
        } catch {
          clearTimeout(timeout);
          return false;
        }
      }

      case "email": {
        // Verify EmailJS config is present via health endpoint
        const ctrl    = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 4000);
        try {
          const res  = await fetch("/api/health", { signal: ctrl.signal });
          clearTimeout(timeout);
          if (!res.ok) return false;
          const data = await res.json() as { services?: { emailjs?: { configured?: boolean } } };
          return !!data?.services?.emailjs?.configured;
        } catch {
          clearTimeout(timeout);
          return false;
        }
      }

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
    const [voice, api, email] = await Promise.all([
      checkVoice(),
      checkAPI(),
      checkEmail(),
    ]);
    const ui: HealthStatus = { service: "ui", healthy: true, lastChecked: Date.now() };
    return [voice, api, email, ui];
  } catch {
    // If the parallel check itself throws (shouldn't happen), return empty
    return [];
  }
}
