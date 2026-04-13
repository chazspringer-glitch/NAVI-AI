"use client";

import { useState } from "react";
import { LEVEL_REWARDS, getXpLevel } from "@/lib/gamification";

interface AchievementDockProps {
  bondXP: number;
  /** ID of the most-recently-unlocked reward — drives the bounce-in animation. */
  newestId?: string | null;
}

function rarityFor(level: number) {
  if (level >= 40) return { border: "#ff6edf", glow: "rgba(255,110,223,0.75)", glowDim: "rgba(255,110,223,0.22)", pulse: true  };
  if (level >= 25) return { border: "#f59e0b", glow: "rgba(245,158,11,0.70)",  glowDim: "rgba(245,158,11,0.20)",  pulse: true  };
  if (level >= 15) return { border: "#a855f7", glow: "rgba(168,85,247,0.65)",  glowDim: "rgba(168,85,247,0.18)",  pulse: true  };
  if (level >= 8)  return { border: "#00d4ff", glow: "rgba(0,212,255,0.60)",   glowDim: "rgba(0,212,255,0.16)",   pulse: false };
  return             { border: "#60a5fa", glow: "rgba(96,165,250,0.55)",   glowDim: "rgba(96,165,250,0.14)",   pulse: false };
}

export default function AchievementDock({ bondXP, newestId }: AchievementDockProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  const xpLevel = getXpLevel(bondXP);
  const earned  = LEVEL_REWARDS.filter((r) => xpLevel >= r.level);

  if (earned.length === 0) return null;

  return (
    <div
      aria-label="Achievements"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 5,
        pointerEvents: "auto",
      }}
    >
      {/* ── "Achievement Unlocked" banner ── */}
      {newestId && (
        <div
          aria-live="polite"
          style={{
            padding: "3px 11px",
            background: "rgba(8,8,18,0.82)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: 20,
            border: "1px solid rgba(168,85,247,0.45)",
            boxShadow: "0 0 16px rgba(168,85,247,0.3)",
            fontSize: 9,
            fontFamily: "monospace",
            letterSpacing: "0.22em",
            textTransform: "uppercase" as const,
            color: "#c084fc",
            whiteSpace: "nowrap" as const,
            animation: "dockBannerIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          ✨ Achievement Unlocked
        </div>
      )}

      {/* ── Frosted-glass dock pill ── */}
      <div
        className="dock-scroll"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 9px",
          background: "rgba(8,8,18,0.70)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
          maxWidth: "calc(100vw - 32px)",
          overflowX: "auto",
          msOverflowStyle: "none",
          scrollbarWidth: "none" as const,
        }}
      >
        {earned.map((r) => {
          const rarity  = rarityFor(r.level);
          const isNew   = r.id === newestId;
          const showTip = tooltip === r.id;

          // CSS custom properties drive the dockPulse @keyframes glow colors
          const cssVars = {
            "--badge-glow":   rarity.glow,
            "--badge-border": rarity.border,
          } as React.CSSProperties;

          return (
            <div
              key={r.id}
              style={{ position: "relative", flexShrink: 0 }}
              onMouseEnter={() => setTooltip(r.id)}
              onMouseLeave={() => setTooltip(null)}
              onTouchEnd={(e) => {
                e.preventDefault(); // suppress ghost mouse events
                setTooltip(tooltip === r.id ? null : r.id);
              }}
            >
              {/* Badge circle */}
              <div
                style={{
                  ...cssVars,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  lineHeight: 1,
                  background:
                    "radial-gradient(circle at 38% 32%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 55%, transparent 100%)",
                  border: `1.5px solid ${rarity.border}`,
                  boxShadow: `0 0 8px ${rarity.glow}, 0 0 2px ${rarity.border}`,
                  cursor: "pointer",
                  userSelect: "none" as const,
                  WebkitUserSelect: "none" as const,
                  transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
                  transform: showTip ? "scale(1.1)" : "scale(1)",
                  animation: isNew
                    ? "dockBounceIn 0.65s cubic-bezier(0.34,1.56,0.64,1) both"
                    : rarity.pulse
                    ? "dockPulse 2.8s ease-in-out infinite"
                    : "none",
                }}
              >
                {r.icon}
              </div>

              {/* Tooltip card */}
              {showTip && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 10px)",
                    left: 0,
                    width: 158,
                    background: "rgba(8,8,18,0.96)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: `1px solid ${rarity.border}40`,
                    borderRadius: 10,
                    padding: "7px 10px",
                    zIndex: 50,
                    pointerEvents: "none" as const,
                    boxShadow: `0 4px 24px rgba(0,0,0,0.55), 0 0 16px ${rarity.glowDim}`,
                    animation: "dockTipIn 0.16s ease-out both",
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      fontFamily: "monospace",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase" as const,
                      color: "#475569",
                      marginBottom: 2,
                    }}
                  >
                    Level {r.level} Reward
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      fontWeight: "bold",
                      color: "#e2e8f0",
                      marginBottom: 3,
                    }}
                  >
                    {r.icon} {r.name}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontFamily: "monospace",
                      color: "#64748b",
                      lineHeight: 1.5,
                    }}
                  >
                    {r.desc}
                  </div>
                  {/* Downward arrow */}
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 14,
                      width: 0,
                      height: 0,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderTop: `5px solid ${rarity.border}40`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
