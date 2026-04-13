"use client";

import type { AgentAction } from "@/lib/actions";

interface ActionCardProps {
  action: AgentAction;
  onDismiss?: () => void;
}

function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${minutes / 60}h`;
}

export default function ActionCard({ action, onDismiss }: ActionCardProps) {
  // ask_followup is dispatched as a timed message — no card rendered
  if (action.type === "ask_followup") return null;

  // ── suggest_activity ────────────────────────────────────────────────────────
  if (action.type === "suggest_activity") {
    return (
      <div
        className="msg-enter rounded-2xl px-3 py-3 text-xs font-mono"
        style={{
          background: "rgba(0,212,255,0.06)",
          border: "1px solid rgba(0,212,255,0.2)",
          boxShadow: "0 0 12px rgba(0,212,255,0.05)",
        }}
      >
        <div className="flex items-start gap-2">
          <span className="text-lg leading-none mt-0.5">{action.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-cyan-400 font-bold tracking-wide mb-0.5">{action.title}</div>
            <div className="text-slate-400 leading-relaxed">{action.description}</div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── remind_later ────────────────────────────────────────────────────────────
  if (action.type === "remind_later") {
    return (
      <div
        className="msg-enter rounded-2xl px-3 py-3 text-xs font-mono"
        style={{
          background: "rgba(251,191,36,0.06)",
          border: "1px solid rgba(251,191,36,0.2)",
          boxShadow: "0 0 12px rgba(251,191,36,0.04)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">⏰</span>
          <div className="flex-1 min-w-0">
            <span className="text-yellow-400 font-bold">Reminder set · </span>
            <span className="text-slate-400">
              I&apos;ll check in with you in {formatDelay(action.delayMinutes)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── track_progress ──────────────────────────────────────────────────────────
  if (action.type === "track_progress") {
    return (
      <div
        className="msg-enter rounded-2xl px-3 py-3 text-xs font-mono"
        style={{
          background: "rgba(74,222,128,0.06)",
          border: "1px solid rgba(74,222,128,0.22)",
          boxShadow: "0 0 12px rgba(74,222,128,0.05)",
        }}
      >
        <div className="flex items-start gap-2">
          <span className="text-base mt-0.5">⭐</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-emerald-400 font-bold tracking-wide">{action.topic}</span>
              <span
                className="px-1.5 py-0.5 rounded-full text-emerald-300 font-bold"
                style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)" }}
              >
                +{action.bonusXP} XP
              </span>
            </div>
            <div className="text-slate-400 leading-relaxed">{action.achievement}</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Reminder alert banner (shown at top of room when a reminder fires) ────────
interface ReminderAlertProps {
  message: string;
  petName: string;
  onDismiss: () => void;
}

export function ReminderAlert({ message, petName, onDismiss }: ReminderAlertProps) {
  return (
    <div
      className="absolute inset-x-3 top-3 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl msg-enter"
      style={{
        background: "rgba(8,8,15,0.95)",
        border: "1px solid rgba(251,191,36,0.4)",
        boxShadow: "0 0 20px rgba(251,191,36,0.15)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span className="text-lg flex-shrink-0">⏰</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono text-yellow-400 font-bold tracking-wide mb-0.5">
          {petName} reminder
        </div>
        <div className="text-xs font-mono text-slate-300 leading-relaxed truncate">{message}</div>
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 text-sm font-mono"
        aria-label="Dismiss reminder"
      >
        ✕
      </button>
    </div>
  );
}
