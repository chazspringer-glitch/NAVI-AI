"use client";

import { useRef, useEffect, useCallback } from "react";

interface NaviParticleFaceProps {
  size?: number;
  state?: "idle" | "thinking" | "responding";
  style?: React.CSSProperties;
}

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  baseX: number;
  baseY: number;
  size: number;
  alpha: number;
  speed: number;
  hue: number;
  drift: number;
  driftSpeed: number;
  driftOffset: number;
}

// Generate face-shaped particle positions
function generateFaceParticles(cx: number, cy: number, radius: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];

  // Face outline (oval)
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    points.push({
      x: cx + Math.cos(angle) * radius * 0.85,
      y: cy + Math.sin(angle) * radius * 0.95 - radius * 0.05,
    });
  }

  // Left eye
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    points.push({
      x: cx - radius * 0.28 + Math.cos(angle) * radius * 0.13,
      y: cy - radius * 0.18 + Math.sin(angle) * radius * 0.08,
    });
  }

  // Right eye
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    points.push({
      x: cx + radius * 0.28 + Math.cos(angle) * radius * 0.13,
      y: cy - radius * 0.18 + Math.sin(angle) * radius * 0.08,
    });
  }

  // Left pupil
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    points.push({
      x: cx - radius * 0.28 + Math.cos(angle) * radius * 0.04,
      y: cy - radius * 0.18 + Math.sin(angle) * radius * 0.04,
    });
  }

  // Right pupil
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    points.push({
      x: cx + radius * 0.28 + Math.cos(angle) * radius * 0.04,
      y: cy - radius * 0.18 + Math.sin(angle) * radius * 0.04,
    });
  }

  // Nose bridge
  for (let i = 0; i < 5; i++) {
    points.push({
      x: cx + (Math.random() - 0.5) * radius * 0.06,
      y: cy - radius * 0.02 + i * radius * 0.06,
    });
  }

  // Mouth
  for (let i = 0; i < 14; i++) {
    const t = (i / 13) * Math.PI;
    points.push({
      x: cx + Math.cos(t + Math.PI) * radius * 0.28,
      y: cy + radius * 0.35 + Math.sin(t + Math.PI) * radius * 0.06,
    });
  }

  // Ambient fill particles
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius * 0.7;
    points.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist - radius * 0.05,
    });
  }

  return points;
}

export default function NaviParticleFace({ size = 200, state = "idle", style }: NaviParticleFaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const canvasSize = size * dpr;

  const initParticles = useCallback(() => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.38;
    const facePoints = generateFaceParticles(cx, cy, radius);

    particlesRef.current = facePoints.map((p) => ({
      x: cx + (Math.random() - 0.5) * size,
      y: cy + (Math.random() - 0.5) * size,
      targetX: p.x,
      targetY: p.y,
      baseX: p.x,
      baseY: p.y,
      size: 1 + Math.random() * 1.5,
      alpha: 0.4 + Math.random() * 0.6,
      speed: 0.02 + Math.random() * 0.03,
      hue: 190 + Math.random() * 40, // cyan to blue
      drift: 0,
      driftSpeed: 0.5 + Math.random() * 1.5,
      driftOffset: Math.random() * Math.PI * 2,
    }));
  }, [size]);

  useEffect(() => {
    initParticles();
  }, [initParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const animate = () => {
      if (!running) return;
      timeRef.current += 0.016;
      const t = timeRef.current;
      const s = stateRef.current;

      ctx.clearRect(0, 0, canvasSize, canvasSize);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Background glow
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.5);
      gradient.addColorStop(0, s === "thinking" ? "rgba(168,85,247,0.08)" : "rgba(0,212,255,0.06)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      const breathe = Math.sin(t * 1.2) * 2;
      const pulseAlpha = s === "responding" ? 0.15 + Math.sin(t * 4) * 0.1 : 0;

      for (const p of particlesRef.current) {
        // State-driven behavior
        if (s === "idle") {
          p.targetX = p.baseX + Math.sin(t * p.driftSpeed + p.driftOffset) * 3;
          p.targetY = p.baseY + Math.cos(t * p.driftSpeed * 0.7 + p.driftOffset) * 3 + breathe;
        } else if (s === "thinking") {
          // Swirl inward
          const angle = Math.atan2(p.baseY - size / 2, p.baseX - size / 2);
          const dist = Math.sqrt((p.baseX - size / 2) ** 2 + (p.baseY - size / 2) ** 2);
          const swirlAngle = angle + t * 2;
          const swirlDist = dist * (0.85 + Math.sin(t * 3) * 0.1);
          p.targetX = size / 2 + Math.cos(swirlAngle) * swirlDist;
          p.targetY = size / 2 + Math.sin(swirlAngle) * swirlDist;
        } else if (s === "responding") {
          p.targetX = p.baseX + Math.sin(t * 2 + p.driftOffset) * 4;
          p.targetY = p.baseY + Math.cos(t * 1.5 + p.driftOffset) * 4 + breathe;
        }

        // Smooth lerp
        p.x += (p.targetX - p.x) * (s === "thinking" ? 0.04 : 0.06);
        p.y += (p.targetY - p.y) * (s === "thinking" ? 0.04 : 0.06);

        // Draw particle
        const glowSize = p.size * (s === "thinking" ? 2.5 : s === "responding" ? 2 : 1.8);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        const hue = s === "thinking" ? p.hue + 80 : p.hue; // purple shift when thinking
        const alpha = p.alpha * (s === "responding" ? 0.8 + pulseAlpha : s === "thinking" ? 0.9 : 0.7);

        glow.addColorStop(0, `hsla(${hue}, 80%, 65%, ${alpha})`);
        glow.addColorStop(0.5, `hsla(${hue}, 70%, 55%, ${alpha * 0.4})`);
        glow.addColorStop(1, `hsla(${hue}, 60%, 45%, 0)`);

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `hsla(${hue}, 90%, 80%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { running = false; cancelAnimationFrame(frameRef.current); };
  }, [canvasSize, dpr, size]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      style={{
        width: size,
        height: size,
        ...style,
      }}
    />
  );
}
