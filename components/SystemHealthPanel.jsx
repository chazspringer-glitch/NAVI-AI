"use client";

import { useState, useEffect } from "react";
import {
  FEATURE_MANIFEST,
  GATE_LABELS,
  GATE_COLORS,
  ENV_VARS,
  OWNER_EMAIL,
  STORAGE_KEYS,
  RESET_CLEARS,
} from "@/lib/systemHealth";

const CYAN  = "#00d4ff";
const GREEN = "#4ade80";
const RED   = "#ef4444";
const AMBER = "#f59e0b";

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ ok, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          background: ok ? GREEN : RED,
          boxShadow: ok ? `0 0 5px ${GREEN}88` : `0 0 5px ${RED}88`,
        }}
      />
      <span className="text-[11px] font-mono" style={{ color: ok ? GREEN : RED }}>
        {label}
      </span>
    </div>
  );
}

function SectionHeader({ label }) {
  return (
    <p className="text-[9px] font-mono tracking-widest uppercase mb-2"
       style={{ color: "#475569" }}>
      {label}
    </p>
  );
}

function Card({ children, accent = "rgba(255,255,255,0.05)", border = "rgba(255,255,255,0.07)" }) {
  return (
    <div
      className="rounded-2xl p-3.5 flex flex-col gap-2"
      style={{ background: accent, border: `1px solid ${border}` }}
    >
      {children}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export default function SystemHealthPanel({ onClose, isPro, isAdmin, voiceEnabled, soundEnabled }) {
  const [health,        setHealth]        = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [healthError,   setHealthError]   = useState(null);
  const [activeTab,     setActiveTab]     = useState("overview"); // overview | features | storage | env

  // Fetch service health on mount
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/api/health");
        const data = await res.json();
        setHealth(data);
      } catch (err) {
        setHealthError("Could not reach /api/health");
        console.error("[SystemHealth] fetch error:", err);
      } finally {
        setLoadingHealth(false);
      }
    })();
  }, []);

  const tabs = [
    { id: "overview",  label: "Overview"  },
    { id: "features",  label: "Features"  },
    { id: "storage",   label: "Storage"   },
    { id: "env",       label: "Services"  },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col overflow-hidden"
      style={{ background: "rgba(4,4,12,0.98)", backdropFilter: "blur(20px)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(0,212,255,0.10)" }}
      >
        <div>
          <span className="text-xs font-mono font-bold tracking-widest uppercase"
                style={{ color: CYAN }}>
            🛡 NAVI System Health
          </span>
          <div className="text-[9px] font-mono mt-0.5 tracking-wide" style={{ color: "#334155" }}>
            Founder diagnostic — admin only
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* ── Tabs ── */}
      <div
        className="flex gap-1 px-4 py-2 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all duration-150"
            style={{
              background: activeTab === t.id ? `${CYAN}15` : "transparent",
              border:     activeTab === t.id ? `1px solid ${CYAN}38` : "1px solid transparent",
              color:      activeTab === t.id ? CYAN : "#475569",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
           style={{ scrollbarWidth: "none" }}>

        {/* ══════════════════════════════════════════════════ OVERVIEW */}
        {activeTab === "overview" && (
          <>
            {/* Session state */}
            <div>
              <SectionHeader label="Session State" />
              <Card accent="rgba(0,212,255,0.04)" border="rgba(0,212,255,0.12)">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Founder Mode",    ok: isAdmin,      trueLabel: "Active",   falseLabel: "Inactive" },
                    { label: "PRO Subscription", ok: isPro,        trueLabel: "Unlocked", falseLabel: "Locked"   },
                    { label: "Voice (TTS)",      ok: voiceEnabled, trueLabel: "Enabled",  falseLabel: "Disabled" },
                    { label: "Sound Effects",    ok: soundEnabled, trueLabel: "On",       falseLabel: "Off"      },
                  ].map(({ label, ok, trueLabel, falseLabel }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{label}</span>
                      <StatusDot ok={ok} label={ok ? trueLabel : falseLabel} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Backend services */}
            <div>
              <SectionHeader label="Backend Services" />
              {loadingHealth ? (
                <Card>
                  <p className="text-[10px] font-mono animate-pulse" style={{ color: "#475569" }}>
                    Checking services…
                  </p>
                </Card>
              ) : healthError ? (
                <Card accent="rgba(239,68,68,0.05)" border="rgba(239,68,68,0.15)">
                  <p className="text-[10px] font-mono" style={{ color: "#fca5a5" }}>
                    ⚠ {healthError}
                  </p>
                </Card>
              ) : (
                <Card accent="rgba(0,212,255,0.03)" border="rgba(0,212,255,0.10)">
                  <div className="flex flex-col gap-2.5">
                    {health?.services && Object.entries(health.services).map(([, svc]) => (
                      <div key={svc.label} className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400">{svc.label}</span>
                        <StatusDot ok={svc.configured} label={svc.configured ? "Configured" : "Missing"} />
                      </div>
                    ))}
                    {health?.timestamp && (
                      <p className="text-[9px] font-mono mt-1" style={{ color: "#1e293b" }}>
                        Checked at {new Date(health.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Email routing */}
            <div>
              <SectionHeader label="Email Routing" />
              <Card accent="rgba(74,222,128,0.03)" border="rgba(74,222,128,0.12)">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 16 }}>📧</span>
                  <div>
                    <div className="text-[10px] font-mono font-bold" style={{ color: GREEN }}>
                      All work orders → {OWNER_EMAIL}
                    </div>
                    <div className="text-[9px] font-mono mt-0.5" style={{ color: "#475569" }}>
                      Routes: /api/onboard · /api/generate-logo
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-lg px-2.5 py-1.5 mt-1"
                  style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}
                >
                  <p className="text-[10px] font-mono leading-relaxed" style={{ color: "#86efac" }}>
                    Hardcoded in server-side routes. Client never sees the address.
                    EmailJS failures are non-fatal — generation always succeeds.
                  </p>
                </div>
              </Card>
            </div>

            {/* Voice gate */}
            <div>
              <SectionHeader label="Voice Gate" />
              <Card accent="rgba(167,139,250,0.03)" border="rgba(167,139,250,0.12)">
                <div className="flex items-start gap-2">
                  <span style={{ fontSize: 16 }}>🎤</span>
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-mono font-bold" style={{ color: "#a78bfa" }}>
                      Voice requires: PRO or Founder
                    </div>
                    <p className="text-[9px] font-mono leading-relaxed" style={{ color: "#475569" }}>
                      Checked via canUseVoiceRef before every speak() call.
                      Toggle button hidden if neither condition is met.
                    </p>
                    <StatusDot ok={isPro || isAdmin} label={(isPro || isAdmin) ? "You have access" : "Access locked"} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Reset behavior */}
            <div>
              <SectionHeader label="Reset Behavior" />
              <Card accent="rgba(239,68,68,0.03)" border="rgba(239,68,68,0.10)">
                <p className="text-[10px] font-mono font-bold mb-1" style={{ color: "#f87171" }}>
                  Reset NAVI clears all of:
                </p>
                <div className="flex flex-col gap-1">
                  {RESET_CLEARS.map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-[9px]" style={{ color: "#ef4444" }}>✕</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        localStorage: <span style={{ color: "#94a3b8" }}>{STORAGE_KEYS[key]}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════ FEATURES */}
        {activeTab === "features" && (
          <div className="flex flex-col gap-2.5">
            <SectionHeader label={`${FEATURE_MANIFEST.length} Protected Features`} />
            {FEATURE_MANIFEST.map((f) => {
              const gateColor = GATE_COLORS[f.accessGate];
              return (
                <div
                  key={f.id}
                  className="rounded-2xl p-3.5 flex flex-col gap-1.5"
                  style={{
                    background: `${gateColor}06`,
                    border: `1px solid ${gateColor}1e`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-white">{f.name}</span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2"
                      style={{
                        background: `${gateColor}12`,
                        border: `1px solid ${gateColor}30`,
                        color: gateColor,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {GATE_LABELS[f.accessGate]}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono leading-relaxed" style={{ color: "#64748b" }}>
                    {f.description}
                  </p>
                  {f.apiRoutes && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {f.apiRoutes.map((r) => (
                        <span
                          key={r}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            color: "#475569",
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════ STORAGE */}
        {activeTab === "storage" && (
          <div className="flex flex-col gap-3">
            <SectionHeader label="localStorage Keys" />
            {Object.entries(STORAGE_KEYS).map(([name, key]) => {
              let value = "—";
              try { value = localStorage.getItem(key) ?? "—"; } catch { /* SSR */ }
              const present = value !== "—" && value !== null;
              return (
                <div
                  key={name}
                  className="rounded-xl px-3.5 py-3 flex items-center justify-between"
                  style={{
                    background: present ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.02)",
                    border: present ? "1px solid rgba(74,222,128,0.14)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div>
                    <div className="text-[11px] font-mono font-bold text-white">{key}</div>
                    <div className="text-[9px] font-mono mt-0.5 uppercase tracking-widest" style={{ color: "#334155" }}>
                      {name}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: present ? GREEN : "#1e293b" }}
                    />
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: present ? "#86efac" : "#334155" }}
                    >
                      {present ? `"${value}"` : "not set"}
                    </span>
                  </div>
                </div>
              );
            })}
            <p className="text-[9px] font-mono text-center leading-relaxed pt-1 pb-4"
               style={{ color: "#1e293b" }}>
              Values shown reflect the current tab session only.
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ ENV / SERVICES */}
        {activeTab === "env" && (
          <div className="flex flex-col gap-3">
            <SectionHeader label="Required Environment Variables" />
            <Card accent="rgba(245,158,11,0.03)" border="rgba(245,158,11,0.10)">
              <p className="text-[10px] font-mono leading-relaxed" style={{ color: AMBER }}>
                ⚠ These values are server-side only. This panel shows which are configured,
                not their actual values.
              </p>
            </Card>
            {ENV_VARS.map((e) => {
              const configured = health?.services
                ? // Heuristic: OpenAI = openai, ElevenLabs = elevenlabs, any EMAILJS = emailjs
                  e.key.startsWith("OPENAI")       ? health.services.openai?.configured
                : e.key.startsWith("ELEVENLABS")   ? health.services.elevenlabs?.configured
                : e.key.startsWith("EMAILJS")      ? health.services.emailjs?.configured
                : null
                : null;

              return (
                <div
                  key={e.key}
                  className="rounded-2xl p-3.5 flex flex-col gap-1.5"
                  style={{
                    background: configured === true  ? "rgba(74,222,128,0.04)"
                               : configured === false ? "rgba(239,68,68,0.04)"
                               : "rgba(255,255,255,0.02)",
                    border: configured === true  ? "1px solid rgba(74,222,128,0.15)"
                           : configured === false ? "1px solid rgba(239,68,68,0.14)"
                           : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-white">{e.key}</span>
                    {configured !== null && (
                      <StatusDot ok={configured} label={configured ? "Set" : "Missing"} />
                    )}
                    {e.required && (
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded-full ml-2"
                        style={{
                          background: "rgba(239,68,68,0.10)",
                          border: "1px solid rgba(239,68,68,0.22)",
                          color: "#fca5a5",
                        }}
                      >
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono" style={{ color: "#475569" }}>
                    {e.label}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {e.usedBy.map((u) => (
                      <span
                        key={u}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          color: "#334155",
                        }}
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                  {e.note && (
                    <p className="text-[9px] font-mono leading-relaxed mt-0.5" style={{ color: "#334155" }}>
                      ↳ {e.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ minHeight: 16 }} />
      </div>

      {/* ── Footer ── */}
      <div
        className="flex-shrink-0 px-4 py-2.5 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(4,4,12,0.90)" }}
      >
        <p className="text-[9px] font-mono" style={{ color: "#1e293b" }}>
          🛡 NAVI Stability Mode · Founder access only · {FEATURE_MANIFEST.length} protected features
        </p>
      </div>
    </div>
  );
}
