"use client";

import { forwardRef } from "react";

/**
 * WorldMap — the visual playfield container that NAVI lives inside.
 *
 * Props:
 *   bg          — background CSS value (gradient or color); defaults to a
 *                 dark map-grid pattern so it works standalone too
 *   onClick     — forwarded to the root div (click-to-move)
 *   className   — extra Tailwind classes
 *   children    — all world elements: stars, decorations, NAVI, overlays…
 *
 * The component is a `position: relative` container that:
 *   • fills all available space (flex-1, min-h-0)
 *   • clips overflow so NAVI never escapes
 *   • draws a subtle grid over the background to reinforce the "map" feel
 *   • exposes a forwarded ref so the parent can measure its dimensions
 *     with ResizeObserver
 */
const WorldMap = forwardRef(function WorldMap(
  { bg, onClick, className = "", children },
  ref
) {
  const defaultBg =
    "radial-gradient(ellipse at 50% 40%, #1a1030 0%, #0d0818 55%, #060410 100%)";

  return (
    <div
      ref={ref}
      className={`relative flex-1 min-h-0 overflow-hidden cursor-crosshair select-none ${className}`}
      style={{
        minHeight: 240,
        background: bg ?? defaultBg,
        transition: "background 0.5s ease",
      }}
      onClick={onClick}
    >
      {/* ── Map grid overlay ────────────────────────────────────────────────
          A very subtle dot/line grid that makes the space feel like a real
          world map without competing with the area backgrounds.          */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "48px 48px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Corner coordinate labels ────────────────────────────────────────
          Faint map coordinates in each corner to reinforce the "world" feel */}
      {[
        { style: { top: 6, left: 8 },  label: "0,0"   },
        { style: { top: 6, right: 8 }, label: "1,0"   },
        { style: { bottom: 58, left: 8 },  label: "0,1" },
        { style: { bottom: 58, right: 8 }, label: "1,1" },
      ].map(({ style, label }) => (
        <span
          key={label}
          aria-hidden="true"
          style={{
            position: "absolute",
            ...style,
            fontFamily: "monospace",
            fontSize: 8,
            color: "rgba(255,255,255,0.08)",
            letterSpacing: "0.06em",
            pointerEvents: "none",
            zIndex: 0,
            userSelect: "none",
          }}
        >
          {label}
        </span>
      ))}

      {/* ── World contents (stars, decorations, NAVI, bubbles…) ─────────── */}
      {children}
    </div>
  );
});

export default WorldMap;
