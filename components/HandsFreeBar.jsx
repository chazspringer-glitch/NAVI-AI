"use client";

import { useEffect, useState } from "react";

/**
 * HandsFreeBar — floating indicator shown while Hands-Free Mode is active.
 * Displays a pulsing mic icon, "Hands-Free Active" label, and a Stop button.
 */
export default function HandsFreeBar({ onStop }) {
  const [ring, setRing] = useState(false);

  // Pulse the ring every ~900 ms
  useEffect(() => {
    const t = setInterval(() => setRing((r) => !r), 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      position: "fixed",
      bottom: 88,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 200,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 14px 8px 10px",
      borderRadius: 40,
      background: "linear-gradient(135deg, rgba(0,212,255,0.14), rgba(0,212,255,0.07))",
      border: "1px solid rgba(0,212,255,0.45)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      boxShadow: "0 0 22px rgba(0,212,255,0.16), 0 4px 16px rgba(0,0,0,0.45)",
      animation: "handsFreeFadeIn 0.35s cubic-bezier(0.32,0.72,0,1) forwards",
      pointerEvents: "auto",
      whiteSpace: "nowrap",
    }}>
      {/* Mic icon with expanding pulse ring */}
      <div style={{ position: "relative", width: 26, height: 26, flexShrink: 0 }}>
        {/* Pulse ring */}
        <div style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          border: "1px solid rgba(0,212,255,0.45)",
          transform: ring ? "scale(1.55)" : "scale(1.0)",
          opacity: ring ? 0 : 0.6,
          transition: "transform 0.9s ease, opacity 0.9s ease",
          pointerEvents: "none",
        }} />
        {/* Mic circle */}
        <div style={{
          width: 26, height: 26,
          borderRadius: "50%",
          background: "rgba(0,212,255,0.16)",
          border: "1px solid rgba(0,212,255,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12,
        }}>
          🎤
        </div>
      </div>

      {/* Label */}
      <span style={{
        fontSize: 11,
        fontFamily: "monospace",
        color: "#00d4ff",
        letterSpacing: "0.06em",
        fontWeight: "bold",
      }}>
        Hands-Free Active
      </span>

      {/* Stop button */}
      <button
        onClick={onStop}
        style={{
          padding: "3px 10px",
          borderRadius: 20,
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.42)",
          color: "#f87171",
          fontSize: 10,
          fontFamily: "monospace",
          cursor: "pointer",
          letterSpacing: "0.04em",
        }}
      >
        Stop
      </button>
    </div>
  );
}
