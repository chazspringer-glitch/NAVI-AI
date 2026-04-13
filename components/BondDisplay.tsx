"use client";

import {
  getXpLevel,
  getXpLevelProgress,
  getXpLevelThreshold,
  getXpLevelTitle,
} from "@/lib/gamification";

interface BondDisplayProps {
  bondXP: number;
}

export default function BondDisplay({ bondXP }: BondDisplayProps) {
  const level = getXpLevel(bondXP);
  const progress = getXpLevelProgress(bondXP);
  const title = getXpLevelTitle(level);
  const nextThreshold = getXpLevelThreshold(level + 1);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 tracking-widest uppercase">XP Level</span>
        <span className="text-slate-300 tracking-wide">
          <span className="text-white font-bold">Lv.{level}</span>
          <span className="text-slate-500 mx-1">·</span>
          <span className="text-slate-400">{title}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(30,30,48,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full bond-fill"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #a855f7, #00d4ff)",
            boxShadow: "0 0 8px rgba(168,85,247,0.6)",
          }}
        />
        {/* Shimmer */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
          }}
        />
      </div>

      <div className="flex justify-between text-xs font-mono text-slate-600">
        <span>{bondXP} / {nextThreshold} XP</span>
        <span>{progress}%</span>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
