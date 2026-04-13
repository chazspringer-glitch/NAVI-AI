"use client";

/**
 * NaviOrb — NAVI's canonical visual identity.
 *
 * A self-contained animated energy orb that replaces every 🤖 emoji
 * placeholder across the app. Reuses the introOrbCloud / introOrbCore
 * keyframes already defined in globals.css so there is no extra CSS
 * bundle cost.
 *
 * Props
 *   size      — diameter in px (default 28)
 *   className — extra Tailwind / CSS classes for the wrapper
 *   style     — extra inline styles merged onto the wrapper (e.g. animation)
 */

import React from "react";

interface NaviOrbProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function NaviOrb({ size = 28, className = "", style }: NaviOrbProps) {
  const coreSize = Math.round(size * 0.46);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#020208",
        border: "1.5px solid rgba(0,212,255,0.55)",
        boxShadow: "0 0 10px rgba(0,212,255,0.48), 0 0 24px rgba(0,212,255,0.22), 0 0 44px rgba(0,212,255,0.09), inset 0 0 10px rgba(0,212,255,0.06)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Cloud A — cyan drift */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 32% 38%, rgba(0,212,255,0.52) 0%, rgba(60,160,255,0.18) 45%, transparent 68%)",
          animation: "introOrbCloudA 5.6s ease-in-out infinite",
        }}
      />
      {/* Cloud B — purple counter-drift */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 68% 62%, rgba(168,85,247,0.38) 0%, rgba(120,60,220,0.12) 45%, transparent 65%)",
          animation: "introOrbCloudB 7.2s ease-in-out infinite",
        }}
      />
      {/* Cloud C — teal reverse */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 76%, rgba(0,212,255,0.18) 0%, transparent 58%)",
          animation: "introOrbCloudA 4.1s ease-in-out infinite reverse",
        }}
      />
      {/* Core bloom */}
      <div
        style={{
          position: "absolute",
          width: coreSize,
          height: coreSize,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.62) 0%, rgba(0,212,255,0.82) 18%, rgba(100,80,255,0.38) 48%, rgba(0,212,255,0.08) 70%, transparent 100%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(2px)",
          animation: "introOrbCore 2.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}
