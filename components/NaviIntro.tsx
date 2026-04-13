"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface NaviIntroProps {
  petName: string;
  userName?: string;
  onDismiss: () => void;
}

const AUTO_MS = 3600; // auto-advance after this many ms
const FADE_MS = 280;  // fade-out duration before calling onDismiss

// 8 particles radiating at 45° intervals
const DOT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function NaviIntro({ petName, userName, onDismiss }: NaviIntroProps) {
  const [leaving, setLeaving] = useState(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedRef = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    clearTimeout(timerRef.current!);
    setLeaving(true);
    setTimeout(onDismiss, FADE_MS);
  }, [onDismiss]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, AUTO_MS);
    return () => clearTimeout(timerRef.current!);
  }, [dismiss]);

  const duration = `${AUTO_MS}ms`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 65,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        background: "rgba(5,5,12,0.99)",
        opacity: leaving ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        // Subtle cinematic zoom-in (Part 5)
        animation: `introCameraZoom ${duration} cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
      }}
      onClick={dismiss}
      aria-label="NAVI intro – tap to skip"
      role="presentation"
    >
      {/* ── Ambient radial glow ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 62% 52% at 50% 48%, rgba(0,212,255,0.10) 0%, rgba(168,85,247,0.06) 42%, transparent 70%)",
          animation: `introGlow ${duration} ease-out forwards`,
        }}
      />

      {/* ── Expanding rings (3, staggered) ── */}
      {([0, 0.32, 0.64] as const).map((delay) => (
        <div
          key={delay}
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 190,
            height: 190,
            borderRadius: "50%",
            border: "1px solid rgba(0,212,255,0.22)",
            top: "50%",
            left: "50%",
            pointerEvents: "none",
            animation: `introRing ${duration} ${delay}s cubic-bezier(0.2,0.6,0.4,1) forwards`,
          }}
        />
      ))}

      {/* ── Radiating particle dots ── */}
      {DOT_ANGLES.map((angle, i) => (
        <div
          key={angle}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            // center via negative margin (keeps transform free for animation)
            marginLeft: i % 3 === 0 ? -2.5 : -1.5,
            marginTop:  i % 3 === 0 ? -2.5 : -1.5,
            width:  i % 3 === 0 ? 5 : 3,
            height: i % 3 === 0 ? 5 : 3,
            borderRadius: "50%",
            background: i % 2 === 0 ? "rgba(0,212,255,0.95)" : "rgba(168,85,247,0.85)",
            boxShadow: i % 2 === 0
              ? "0 0 6px rgba(0,212,255,0.8)"
              : "0 0 6px rgba(168,85,247,0.7)",
            pointerEvents: "none",
            // --dot-angle drives the introDot @keyframe rotation
            ["--dot-angle" as string]: `${angle}deg`,
            animation: `introDot 2.6s ${0.38 + i * 0.055}s ease-out both`,
          } as React.CSSProperties}
        />
      ))}

      {/* ── Main NAVI content ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          pointerEvents: "none",
          animation: `introContent ${duration} cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
        }}
      >
        {/* Orb — animated NAVI energy core */}
        <div
          style={{
            width: 102,
            height: 102,
            borderRadius: "50%",
            background: "#020208",
            border: "1.5px solid rgba(0,212,255,0.38)",
            boxShadow:
              "0 0 36px rgba(0,212,255,0.22), 0 0 72px rgba(168,85,247,0.10), inset 0 0 20px rgba(0,212,255,0.07)",
            position: "relative",
            overflow: "hidden",
            animation: "introFloat 2.6s ease-in-out infinite",
          }}
        >
          {/* Base mist — breathing center bloom */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0.06) 48%, transparent 72%)",
            animation: "introOrbBreathe 3.4s ease-in-out infinite",
          }} />

          {/* Cloud A — cyan drift */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 38% 44%, rgba(0,212,255,0.18) 0%, rgba(0,212,255,0.06) 44%, transparent 70%)",
            animation: "introOrbCloudA 5.6s ease-in-out infinite",
          }} />

          {/* Cloud B — purple counter-drift */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 62% 55%, rgba(168,85,247,0.14) 0%, rgba(100,40,200,0.04) 48%, transparent 72%)",
            animation: "introOrbCloudB 7.2s ease-in-out infinite",
          }} />

          {/* Cloud C — faster reverse, teal tint */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 52% 38%, rgba(0,212,255,0.10) 0%, rgba(60,180,255,0.04) 44%, transparent 68%)",
            animation: "introOrbCloudA 3.1s ease-in-out reverse infinite",
          }} />

          {/* Core bloom — diffuse, no hard edges, breathes */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 58, height: 58,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,212,255,0.52) 0%, rgba(0,212,255,0.20) 32%, rgba(0,212,255,0.06) 60%, transparent 82%)",
            filter: "blur(3px)",
            animation: "introOrbCore 2.4s ease-in-out infinite",
          }} />

          {/* Boot build-up — intensifies glow as AI initialises */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle, rgba(0,212,255,0.16) 0%, rgba(168,85,247,0.08) 55%, transparent 80%)",
            animation: `introOrbBuild ${duration} ease-out forwards`,
          }} />
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 34,
            fontFamily: "monospace",
            fontWeight: "bold",
            letterSpacing: "0.28em",
            background: "linear-gradient(135deg, #00d4ff, #a855f7, #f472b6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {petName}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#2d3f55",
          }}
        >
          {userName ? `Welcome back, ${userName}` : "Initializing…"}
        </div>
      </div>

      {/* ── Skip hint ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 36,
          fontSize: 10,
          fontFamily: "monospace",
          color: "#1e293b",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          pointerEvents: "none",
          animation: `introSkipHint ${duration} ease forwards`,
        }}
      >
        tap to skip
      </div>
    </div>
  );
}
