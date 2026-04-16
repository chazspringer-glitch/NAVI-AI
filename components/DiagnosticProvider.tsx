"use client";

/**
 * DiagnosticProvider — NAVI Self-Diagnostic and Auto-Recovery System
 *
 * Wraps the entire app. Responsibilities:
 *  - Runs health checks on mount (2 s delay) and every 3 minutes
 *  - Logs failures to localStorage via lib/diagnostics
 *  - Attempts auto-recovery on first failure per service
 *  - Enters safe-mode for a service after 3 consecutive failures
 *  - Sends a throttled alert email via /api/alert on persistent failures
 *  - Calls onRecovery(message) so NAVI can speak an awareness announcement
 *  - Renders a self-contained safe-mode banner when a service is disabled
 *
 * Usage in page.tsx:
 *   <DiagnosticProvider onRecovery={(msg) => speakRef.current(msg)}>
 *     {children}
 *   </DiagnosticProvider>
 *
 * Child components can call useDiagnostics() to read health/safeMode state.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ServiceName,
  DiagnosticError,
  HealthStatus,
  readErrorLog,
  clearErrorLog,
  appendError,
  markRecovered,
  runAllChecks,
  attemptRecovery,
  sendAlert,
} from "@/lib/diagnostics";

// ── Context shape ─────────────────────────────────────────────────────────────

export type SafeMode = Partial<Record<ServiceName, boolean>>;

interface DiagnosticsCtx {
  /** Latest health status per service. */
  health: Partial<Record<ServiceName, HealthStatus>>;
  /** Whether a service has been placed in safe mode (3+ consecutive failures). */
  safeMode: SafeMode;
  /** All errors currently in localStorage. */
  loggedErrors: DiagnosticError[];
  /** Manually place a service into safe mode (e.g. from an error boundary). */
  disableFeature: (service: ServiceName) => void;
  /** Clear the localStorage error log. */
  clearLog: () => void;
  /** Trigger a diagnostic pass immediately. */
  runCheck: () => Promise<void>;
}

const defaultCtx: DiagnosticsCtx = {
  health:         {},
  safeMode:       {},
  loggedErrors:   [],
  disableFeature: () => {},
  clearLog:       () => {},
  runCheck:       async () => {},
};

const DiagnosticsContext = createContext<DiagnosticsCtx>(defaultCtx);

export function useDiagnostics(): DiagnosticsCtx {
  return useContext(DiagnosticsContext);
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** How often to run background health checks (milliseconds). */
const INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

/** How many consecutive failures before entering safe mode. */
const SAFE_MODE_THRESHOLD = 3;

// ── Safe-mode banner UI ───────────────────────────────────────────────────────

const SERVICE_LABELS: Record<ServiceName, string> = {
  voice: "Voice System",
  api:   "AI Services",
  data:  "Database (Auth · Leaderboard · XP)",
  news:  "News Web",
  tts:   "Voice Output (TTS)",
  email: "Email Delivery",
  ui:    "UI Components",
};

function SafeModeBanner({ services }: { services: ServiceName[] }) {
  const [visible, setVisible] = useState(true);
  if (!visible || services.length === 0) return null;

  const label = services.map((s) => SERVICE_LABELS[s]).join(", ");

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(239,68,68,0.10)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(239,68,68,0.30)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "8px 16px",
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>⚠️</span>
      <span style={{
        fontSize: 10,
        fontFamily: "monospace",
        color: "#fca5a5",
        letterSpacing: "0.04em",
      }}>
        {label}{" "}
        {services.length === 1 ? "is" : "are"} temporarily unavailable. Other features remain active.
      </span>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        style={{
          marginLeft: 8,
          background: "none",
          border: "none",
          color: "rgba(252,165,165,0.6)",
          fontSize: 14,
          cursor: "pointer",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface DiagnosticProviderProps {
  children: React.ReactNode;
  /**
   * Called when NAVI auto-recovers a service.
   * Pass speakRef.current so NAVI speaks the announcement.
   */
  onRecovery?: (message: string) => void;
}

export default function DiagnosticProvider({
  children,
  onRecovery,
}: DiagnosticProviderProps) {
  const [health,       setHealth]       = useState<Partial<Record<ServiceName, HealthStatus>>>({});
  const [safeMode,     setSafeMode]     = useState<SafeMode>({});
  const [loggedErrors, setLoggedErrors] = useState<DiagnosticError[]>(() => readErrorLog());

  // Track consecutive failure counts per service (reset to 0 on success)
  const failCountRef = useRef<Partial<Record<ServiceName, number>>>({});

  // Stable ref so the interval callback always sees the latest safeMode without
  // causing the interval to be re-registered on every render.
  const safeModeRef  = useRef<SafeMode>({});
  const onRecoveryRef = useRef<((msg: string) => void) | undefined>(onRecovery);

  useEffect(() => { safeModeRef.current  = safeMode;    }, [safeMode]);
  useEffect(() => { onRecoveryRef.current = onRecovery; }, [onRecovery]);

  const refreshLog = useCallback(() => {
    setLoggedErrors(readErrorLog());
  }, []);

  const disableFeature = useCallback((service: ServiceName) => {
    setSafeMode((prev) => ({ ...prev, [service]: true }));
  }, []);

  const clearLog = useCallback(() => {
    clearErrorLog();
    setLoggedErrors([]);
  }, []);

  // ── Core check cycle ──────────────────────────────────────────────────────

  const runCheck = useCallback(async () => {
    let results: HealthStatus[];
    try {
      results = await runAllChecks();
    } catch {
      // Diagnostic framework itself failed — never crash the app
      return;
    }

    const newHealth: Partial<Record<ServiceName, HealthStatus>> = {};

    for (const status of results) {
      const { service, healthy, error } = status;
      newHealth[service] = status;

      if (healthy) {
        const prevFails = failCountRef.current[service] ?? 0;
        failCountRef.current[service] = 0;

        if (prevFails > 0) {
          // Service recovered on its own — log + announce
          const entry = appendError(
            service,
            "auto_recovered",
            `${SERVICE_LABELS[service]} restored after ${prevFails} failed check(s)`,
          );
          markRecovered(entry.id);
          refreshLog();

          // Clear safe mode if recovery is confirmed
          setSafeMode((prev) => ({ ...prev, [service]: false }));

          // NAVI awareness announcement
          onRecoveryRef.current?.(
            `I detected an issue with the ${SERVICE_LABELS[service]} and corrected it.`,
          );
        }
      } else {
        const count = (failCountRef.current[service] ?? 0) + 1;
        failCountRef.current[service] = count;

        // Log the failure
        const errorEntry = appendError(
          service,
          "health_check_failure",
          error ?? `${SERVICE_LABELS[service]} health check failed`,
        );
        refreshLog();

        // Attempt auto-recovery on the FIRST failure
        if (count === 1) {
          try {
            const recovered = await attemptRecovery(service);
            if (recovered) {
              markRecovered(errorEntry.id);
              failCountRef.current[service] = 0;
              refreshLog();
              onRecoveryRef.current?.("I detected an issue and corrected it.");
              // Don't enter safe mode — recovery succeeded
              continue;
            }
          } catch {
            // Recovery attempt itself threw — continue to safe mode logic
          }
        }

        // Enter safe mode after SAFE_MODE_THRESHOLD consecutive failures
        if (count >= SAFE_MODE_THRESHOLD && !safeModeRef.current[service]) {
          setSafeMode((prev) => ({ ...prev, [service]: true }));
          console.warn(`[NAVI Diagnostics] ${SERVICE_LABELS[service]} entering safe mode after ${count} failures.`);
          // Send throttled alert email
          sendAlert(
            service,
            `${SERVICE_LABELS[service]} failed ${count} consecutive health checks. Last error: ${error ?? "unknown"}`,
          );
        }
      }
    }

    setHealth(newHealth);
  }, [refreshLog]);

  // ── Schedule checks ───────────────────────────────────────────────────────

  useEffect(() => {
    // Brief delay on mount so the app finishes hydrating before first check
    const initTimer = setTimeout(() => { runCheck(); }, 2000);
    const interval  = setInterval(() => { runCheck(); }, INTERVAL_MS);
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derive which services are in safe mode (for banner) ───────────────────

  const safeModeServices = (Object.keys(safeMode) as ServiceName[]).filter(
    (k) => safeMode[k] === true,
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DiagnosticsContext.Provider
      value={{ health, safeMode, loggedErrors, disableFeature, clearLog, runCheck }}
    >
      {children}
      {safeModeServices.length > 0 && (
        <SafeModeBanner services={safeModeServices} />
      )}
    </DiagnosticsContext.Provider>
  );
}
