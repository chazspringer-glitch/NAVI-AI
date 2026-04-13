"use client";

import { useEffect, useRef, useState } from "react";

export type Mood = "happy" | "bored" | "excited";

// ── Evolution stages (0 = Strangers → 5 = Soulmates) ─────────────────────────
export interface EvolutionStage {
  name: string;         // e.g. "Seedling", "Sprite"
  emoji: string;        // decorative badge
  scale: number;        // body scale multiplier (1 = default 176 px)
  bodyBase: string;     // Tailwind gradient classes for body
  glowBase: string;     // default glow color (hex)
  glowAlpha: string;    // rgba form for shadows
  antennaExtra: string; // extra Tailwind class on antenna tip (e.g. size)
  accessories: AccessoryId[];
}

type AccessoryId = "stars" | "crown" | "wings" | "halo" | "sparkle-ring";

export const EVOLUTION_STAGES: EvolutionStage[] = [
  {
    name: "Seedling",
    emoji: "🌱",
    scale: 0.72,
    bodyBase: "from-teal-400 via-emerald-400 to-green-500",
    glowBase: "#4ade80",
    glowAlpha: "rgba(74,222,128,0.45)",
    antennaExtra: "w-3 h-3",
    accessories: [],
  },
  {
    name: "Sprite",
    emoji: "✨",
    scale: 0.84,
    bodyBase: "from-cyan-400 via-sky-400 to-blue-500",
    glowBase: "#00d4ff",
    glowAlpha: "rgba(0,212,255,0.5)",
    antennaExtra: "w-4 h-4",
    accessories: ["stars"],
  },
  {
    name: "Guardian",
    emoji: "🛡️",
    scale: 0.94,
    bodyBase: "from-violet-400 via-purple-400 to-fuchsia-500",
    glowBase: "#a855f7",
    glowAlpha: "rgba(168,85,247,0.55)",
    antennaExtra: "w-4 h-4",
    accessories: ["stars", "wings"],
  },
  {
    name: "Champion",
    emoji: "🏆",
    scale: 1.0,
    bodyBase: "from-amber-400 via-orange-400 to-rose-500",
    glowBase: "#f59e0b",
    glowAlpha: "rgba(245,158,11,0.55)",
    antennaExtra: "w-5 h-5",
    accessories: ["crown"],
  },
  {
    name: "Legend",
    emoji: "🌟",
    scale: 1.08,
    bodyBase: "from-pink-400 via-fuchsia-400 to-purple-500",
    glowBase: "#f472b6",
    glowAlpha: "rgba(244,114,182,0.6)",
    antennaExtra: "w-5 h-5",
    accessories: ["crown", "wings"],
  },
  {
    name: "Soulmate",
    emoji: "💎",
    scale: 1.16,
    bodyBase: "from-sky-300 via-white to-fuchsia-300",
    glowBase: "#e0f2fe",
    glowAlpha: "rgba(224,242,254,0.7)",
    antennaExtra: "w-6 h-6",
    accessories: ["halo", "sparkle-ring"],
  },
];

interface PetProps {
  mood: Mood;
  isSpeaking: boolean;
  petName: string;
  // Provided by Room — Pet is purely visual
  isWalking: boolean;
  facingRight: boolean;
  isJumping: boolean;
  evolutionStage: number; // 0–5
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

const MOOD_CONFIG = {
  happy: {
    glow: "animate-glow-pulse-cyan",
    anim: "animate-float",
    ringOpacity: "border-white/20",
    label: "HAPPY",
    labelColor: "text-cyan-400",
    eyeColor: "#08080f",
    shine: "rgba(255,255,255,0.3)",
  },
  bored: {
    glow: "animate-glow-pulse-gray",
    anim: "animate-breathe",
    ringOpacity: "border-white/10",
    label: "BORED",
    labelColor: "text-slate-400",
    eyeColor: "#1e1e30",
    shine: "rgba(255,255,255,0.15)",
  },
  excited: {
    glow: "animate-glow-pulse-pink",
    anim: "animate-wiggle",
    ringOpacity: "border-white/30",
    label: "EXCITED",
    labelColor: "text-pink-400",
    eyeColor: "#08080f",
    shine: "rgba(255,255,255,0.35)",
  },
};

export default function Pet({
  mood, isSpeaking, petName, isWalking, facingRight, isJumping, evolutionStage,
}: PetProps) {
  const [blink, setBlink] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [prevMood, setPrevMood] = useState<Mood>(mood);
  const [leftFootUp, setLeftFootUp] = useState(false);
  const footIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stage = EVOLUTION_STAGES[Math.min(evolutionStage, EVOLUTION_STAGES.length - 1)];
  const bodySize = Math.round(176 * stage.scale);

  // ── Random blink ──────────────────────────────────────────────────────────
  useEffect(() => {
    const schedule = (): ReturnType<typeof setTimeout> =>
      setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        schedule();
      }, 2500 + Math.random() * 3000);
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  // ── Particle burst when mood flips to excited ─────────────────────────────
  useEffect(() => {
    if (mood === "excited" && prevMood !== "excited") {
      const colors = ["#f472b6", "#a855f7", "#00d4ff", "#fbbf24"];
      setParticles(
        Array.from({ length: 8 }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * 160 - 80,
          y: Math.random() * 80 - 120,
          color: colors[i % colors.length],
        }))
      );
      setTimeout(() => setParticles([]), 2000);
    }
    setPrevMood(mood);
  }, [mood, prevMood]);

  // ── Foot alternation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isWalking) {
      footIntervalRef.current = setInterval(() => setLeftFootUp((p) => !p), 255);
    } else {
      if (footIntervalRef.current) clearInterval(footIntervalRef.current);
      setLeftFootUp(false);
    }
    return () => { if (footIntervalRef.current) clearInterval(footIntervalRef.current); };
  }, [isWalking]);

  const cfg = MOOD_CONFIG[mood];
  const bodyAnim = isJumping ? "animate-excited-jump" : isWalking ? "animate-walk-bob" : cfg.anim;

  // ── Face helpers ──────────────────────────────────────────────────────────
  const renderEyes = () => {
    const blinkG = (cx: number) => ({
      transform: blink ? "scaleY(0.08)" : "scaleY(1)",
      transformOrigin: `${cx}px 44px`,
      transition: "transform 0.08s",
    });

    if (mood === "bored") {
      return (
        <>
          <g style={blinkG(33)}>
            <ellipse cx="33" cy="44" rx="7" ry="5" fill={cfg.eyeColor} />
            <rect x="26" y="39" width="14" height="5" rx="1" fill={stage.glowBase} opacity="0.5" />
          </g>
          <g style={blinkG(67)}>
            <ellipse cx="67" cy="44" rx="7" ry="5" fill={cfg.eyeColor} />
            <rect x="60" y="39" width="14" height="5" rx="1" fill={stage.glowBase} opacity="0.5" />
          </g>
        </>
      );
    }

    if (mood === "excited" || isJumping) {
      return (
        <>
          <g style={blinkG(33)}>
            <circle cx="33" cy="44" r="9" fill={cfg.eyeColor} />
            <circle cx="29" cy="40" r="3" fill="white" opacity="0.9" />
            <circle cx="36" cy="47" r="1.5" fill="white" opacity="0.6" />
          </g>
          <g style={blinkG(67)}>
            <circle cx="67" cy="44" r="9" fill={cfg.eyeColor} />
            <circle cx="63" cy="40" r="3" fill="white" opacity="0.9" />
            <circle cx="70" cy="47" r="1.5" fill="white" opacity="0.6" />
          </g>
        </>
      );
    }

    return (
      <>
        <g style={blinkG(33)}>
          <circle cx="33" cy="44" r="7" fill={cfg.eyeColor} />
          <circle cx="30" cy="41" r="2.5" fill="white" opacity="0.8" />
        </g>
        <g style={blinkG(67)}>
          <circle cx="67" cy="44" r="7" fill={cfg.eyeColor} />
          <circle cx="64" cy="41" r="2.5" fill="white" opacity="0.8" />
        </g>
      </>
    );
  };

  const renderMouth = () => {
    if (isSpeaking || isJumping) {
      return (
        <ellipse
          cx="50" cy="65" rx="10" ry={5} fill={cfg.eyeColor}
          style={{ animation: "mouthSpeak 0.3s ease-in-out infinite alternate" }}
        />
      );
    }
    if (mood === "bored") {
      return <line x1="38" y1="65" x2="62" y2="65" stroke={cfg.eyeColor} strokeWidth="3" strokeLinecap="round" />;
    }
    if (mood === "excited") {
      return (
        <>
          <path d="M 30 62 Q 50 80 70 62" stroke={cfg.eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="50" cy="70" rx="12" ry="6" fill={cfg.eyeColor} opacity="0.15" />
        </>
      );
    }
    return <path d="M 36 62 Q 50 76 64 62" stroke={cfg.eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />;
  };

  // ── Accessories ───────────────────────────────────────────────────────────
  const renderAccessories = () => {
    const acc = stage.accessories;
    const half = bodySize / 2;
    return (
      <>
        {/* Wings — behind body */}
        {acc.includes("wings") && (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
            {/* left wing */}
            <div
              className="absolute"
              style={{
                width: Math.round(bodySize * 0.55),
                height: Math.round(bodySize * 0.45),
                top: "30%",
                left: -Math.round(bodySize * 0.38),
                borderRadius: "60% 0 60% 40%",
                background: `linear-gradient(135deg, ${stage.glowBase}55, ${stage.glowBase}22)`,
                border: `1px solid ${stage.glowBase}44`,
                transform: "rotate(-20deg)",
                animation: "wingFlap 2s ease-in-out infinite",
              }}
            />
            {/* right wing */}
            <div
              className="absolute"
              style={{
                width: Math.round(bodySize * 0.55),
                height: Math.round(bodySize * 0.45),
                top: "30%",
                right: -Math.round(bodySize * 0.38),
                borderRadius: "0 60% 40% 60%",
                background: `linear-gradient(225deg, ${stage.glowBase}55, ${stage.glowBase}22)`,
                border: `1px solid ${stage.glowBase}44`,
                transform: "rotate(20deg)",
                animation: "wingFlap 2s ease-in-out infinite reverse",
              }}
            />
          </div>
        )}

        {/* Halo */}
        {acc.includes("halo") && (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: -Math.round(bodySize * 0.22),
              width: Math.round(bodySize * 0.62),
              height: Math.round(bodySize * 0.18),
              borderRadius: "50%",
              border: `3px solid ${stage.glowBase}`,
              boxShadow: `0 0 12px ${stage.glowBase}, 0 0 24px ${stage.glowBase}66`,
              background: `${stage.glowBase}18`,
              zIndex: 10,
            }}
          />
        )}

        {/* Crown */}
        {acc.includes("crown") && (
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-end justify-center gap-0.5"
            style={{ top: -Math.round(bodySize * 0.24), zIndex: 10 }}
          >
            {[10, 16, 10].map((h, i) => (
              <div
                key={i}
                style={{
                  width: Math.round(bodySize * 0.1),
                  height: h * (stage.scale),
                  background: `linear-gradient(180deg, ${stage.glowBase}, ${stage.glowBase}99)`,
                  borderRadius: "3px 3px 0 0",
                  boxShadow: `0 0 6px ${stage.glowBase}`,
                }}
              />
            ))}
          </div>
        )}

        {/* Floating stars */}
        {acc.includes("stars") && (
          <>
            {[
              { angle: -40, dist: half + 14, delay: "0s" },
              { angle: 40, dist: half + 14, delay: "0.6s" },
              { angle: 180, dist: half + 10, delay: "1.2s" },
            ].map(({ angle, dist, delay }, i) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <div
                  key={i}
                  className="absolute text-[10px] pointer-events-none"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `translate(calc(${Math.cos(rad) * dist}px - 50%), calc(${Math.sin(rad) * dist}px - 50%))`,
                    animation: `starFloat 2s ease-in-out ${delay} infinite alternate`,
                    filter: `drop-shadow(0 0 4px ${stage.glowBase})`,
                  }}
                >
                  ✦
                </div>
              );
            })}
          </>
        )}

        {/* Sparkle ring */}
        {acc.includes("sparkle-ring") && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              width: bodySize + 28,
              height: bodySize + 28,
              border: `2px dashed ${stage.glowBase}66`,
              animation: "sparkleRing 6s linear infinite",
              boxShadow: `0 0 16px ${stage.glowBase}33`,
            }}
          />
        )}
      </>
    );
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Direction flip */}
      <div style={{ transform: `scaleX(${facingRight ? 1 : -1})` }}>
        {/* Outer glow ring */}
        <div
          className={`absolute rounded-full border-2 ${cfg.ringOpacity} ${cfg.glow}`}
          style={{
            width: bodySize + 8, height: bodySize + 8,
            top: 4, left: "50%", transform: "translateX(-50%)",
          }}
        />

        {/* Particle burst */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle-burst absolute animate-particle"
            style={{
              backgroundColor: p.color,
              top: "50%", left: "50%",
              transform: `translate(${p.x}px, ${p.y}px)`,
              boxShadow: `0 0 6px ${p.color}`,
            }}
          />
        ))}

        {/* Animated body wrapper */}
        <div
          className={`relative ${bodyAnim}`}
          style={{ width: bodySize, height: bodySize }}
        >
          {/* Accessories (wings behind, others above) */}
          {renderAccessories()}

          {/* Antenna */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: -28 }}>
            <div
              className={`rounded-full ${stage.antennaExtra}`}
              style={{
                background: stage.glowBase,
                boxShadow: `0 0 10px ${stage.glowAlpha}, 0 0 20px ${stage.glowAlpha}`,
              }}
            />
            <div className="w-0.5 h-6 bg-slate-600" />
          </div>

          {/* Body */}
          <div
            className={`w-full h-full rounded-full bg-gradient-to-br ${stage.bodyBase} relative overflow-hidden`}
            style={{ boxShadow: `0 0 30px ${stage.glowAlpha}, 0 0 60px ${stage.glowAlpha}40` }}
          >
            {/* Shine */}
            <div className="absolute rounded-full" style={{
              width: "45%", height: "35%", top: "12%", left: "15%",
              background: `radial-gradient(ellipse, ${cfg.shine} 0%, transparent 70%)`,
            }} />

            {/* Face */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
              style={{ padding: "10%", transform: `scaleX(${facingRight ? 1 : -1})` }}
            >
              {renderEyes()}
              {renderMouth()}
              {mood !== "bored" && (
                <>
                  <ellipse cx="20" cy="58" rx="7" ry="4" fill="white" opacity="0.12" />
                  <ellipse cx="80" cy="58" rx="7" ry="4" fill="white" opacity="0.12" />
                </>
              )}
            </svg>

            <div className="absolute inset-0 rounded-full scan-overlay opacity-20" />
          </div>

          {/* Ear buds */}
          <div
            className={`absolute w-6 h-6 rounded-full bg-gradient-to-br ${stage.bodyBase} border border-white/10`}
            style={{ left: -6, top: "50%", transform: "translateY(-50%)", boxShadow: `0 0 8px ${stage.glowAlpha}` }}
          />
          <div
            className={`absolute w-6 h-6 rounded-full bg-gradient-to-br ${stage.bodyBase} border border-white/10`}
            style={{ right: -6, top: "50%", transform: "translateY(-50%)", boxShadow: `0 0 8px ${stage.glowAlpha}` }}
          />
        </div>

        {/* Feet */}
        <div className="flex justify-center gap-10 mt-1">
          {[true, false].map((isLeft) => (
            <div
              key={isLeft ? "l" : "r"}
              style={{
                width: 10, height: 10, borderRadius: "50%",
                backgroundColor: stage.glowBase,
                boxShadow: `0 0 6px ${stage.glowAlpha}`,
                opacity: isWalking ? 1 : 0.45,
                transform: isWalking && (isLeft ? leftFootUp : !leftFootUp)
                  ? "translateY(-8px)" : "translateY(0px)",
                transition: "transform 0.22s ease, opacity 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Name + status label */}
      <div className="mt-5 flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">{stage.emoji}</span>
          <span className="text-xs font-mono tracking-[0.3em] text-slate-400 uppercase">{petName}</span>
        </div>
        <span className={`text-xs font-mono tracking-widest font-bold ${cfg.labelColor}`}>
          {isJumping ? "WHEEE!" : isWalking ? "WALKING" : stage.name.toUpperCase()}
        </span>
      </div>

      <style jsx>{`
        @keyframes mouthSpeak {
          from { ry: 3; }
          to   { ry: 7; }
        }
        @keyframes wingFlap {
          0%, 100% { transform: rotate(-20deg) scaleY(1); }
          50% { transform: rotate(-10deg) scaleY(0.85); }
        }
        @keyframes starFloat {
          0% { transform: translate(calc(var(--sx, 0px) - 50%), calc(var(--sy, 0px) - 50%)) scale(0.8); opacity: 0.6; }
          100% { transform: translate(calc(var(--sx, 0px) - 50%), calc(var(--sy, 0px) - 50%)) scale(1.2); opacity: 1; }
        }
        @keyframes sparkleRing {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
