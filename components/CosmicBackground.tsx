"use client";

import { useEffect, useRef } from "react";

interface Props {
  isSpeaking: boolean;
  isLoading: boolean;
}

/**
 * Canvas-based parallax cosmic background.
 * Layers (back → front):
 *   1. Nebula clouds        — very slow drift, elliptical radial gradients
 *   2. Glow particles       — mid-speed, radial bloom, swirl when thinking
 *   3. Stars                — parallax by depth (z), twinkle, halo on bright ones
 *   4. Streaks              — foreground, give "forward movement" illusion
 *   5. Shooting star        — occasional, rare
 *
 * NAVI reactivity via a stateRef so the rAF loop never restarts on prop change:
 *   idle     → normal speed, dim glow
 *   speaking → faster drift, brightened glow
 *   thinking → slow swirl of particles, faint energy ripple
 */
export default function CosmicBackground({ isSpeaking, isLoading }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({ isSpeaking, isLoading });

  // Keep the ref in sync without recreating the animation loop
  useEffect(() => {
    stateRef.current = { isSpeaking, isLoading };
  }, [isSpeaking, isLoading]);

  // One-time setup — animation lives here for its full lifetime
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const mobile = window.innerWidth < 768;

    let W = 0, H = 0;
    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    /* ── particle budgets ─────────────────────────────────────────────────── */
    const STAR_COUNT     = mobile ? 100 : 210;
    const PARTICLE_COUNT = mobile ? 10  : 20;
    const NEBULA_COUNT   = mobile ? 2   : 5;
    const STREAK_COUNT   = mobile ? 7   : 13;
    const DRIFT_ANGLE    = 0.14; // radians — slight diagonal gives depth

    const rnd  = Math.random;
    const rng  = (lo: number, hi: number) => lo + rnd() * (hi - lo);
    const TAU  = Math.PI * 2;

    /* ── nebulae (layer 1) ────────────────────────────────────────────────── */
    interface Nebula { x:number; y:number; vx:number; vy:number; rw:number; rh:number; hue:number; opacity:number; phase:number; phaseSpd:number; }
    const nebulae: Nebula[] = Array.from({ length: NEBULA_COUNT }, () => ({
      x: rnd(), y: rnd(),
      vx: (rnd() - 0.5) * 3.5e-5,
      vy: (rnd() - 0.5) * 3.5e-5,
      rw: rng(0.2, 0.5),   // normalized horizontal radius
      rh: rng(0.12, 0.28), // normalized vertical radius
      hue: rng(220, 280),  // blue → violet
      opacity: rng(0.012, 0.048),
      phase: rnd() * TAU,
      phaseSpd: rng(4e-4, 9e-4),
    }));

    /* ── glow particles (layer 2) ─────────────────────────────────────────── */
    interface Particle { x:number; y:number; vx:number; vy:number; size:number; opacity:number; hue:number; phase:number; }
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: rnd(), y: rnd(),
      vx: (rnd() - 0.5) * 2.5e-4,
      vy: (rnd() - 0.5) * 2.5e-4,
      size: rng(45, 130),
      opacity: rng(0.02, 0.09),
      hue: rng(210, 285),
      phase: rnd() * TAU,
    }));

    /* ── stars (layer 3) ──────────────────────────────────────────────────── */
    interface Star { x:number; y:number; z:number; radius:number; opacity:number; twinkle:number; twinkleSpd:number; }
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: rnd(), y: rnd(),
      z: rnd(),                       // depth 0=far, 1=near — drives parallax speed
      radius: rng(0.28, 1.5),
      opacity: rng(0.35, 1.0),
      twinkle: rnd() * TAU,
      twinkleSpd: rng(0.008, 0.032),
    }));

    /* ── streaks (layer 4) ────────────────────────────────────────────────── */
    interface Streak { x:number; y:number; speed:number; length:number; opacity:number; }
    const streaks: Streak[] = Array.from({ length: STREAK_COUNT }, () => ({
      x: rnd(), y: rnd(),
      speed: rng(3e-4, 9e-4),
      length: rng(0.01, 0.042),  // fraction of screen width
      opacity: rng(0.04, 0.15),
    }));

    /* ── shooting star ────────────────────────────────────────────────────── */
    const ss = { active: false, x: 0, y: 0, vx: 0, vy: 0, tailLen: 0, life: 0, maxLife: 0 };
    let nextSSIn = rng(10000, 28000);
    let ssSince  = 0;

    /* ── reactive smooth values ───────────────────────────────────────────── */
    let speedCur = 1.0, speedTgt = 1.0;
    let glowCur  = 0.42, glowTgt  = 0.42;
    let swirlCur = 0.0,  swirlTgt = 0.0;

    let lastT  = performance.now();
    let animId = 0;

    /* ─────────────────────────────────────────────── animation loop ─── */
    const tick = (now: number) => {
      const dt = Math.min(now - lastT, 50); // cap so tab-hidden jumps don't spike
      lastT = now;

      /* ── update reactive targets ── */
      const { isSpeaking: sp, isLoading: ld } = stateRef.current;
      speedTgt = sp ? 1.75 : ld ? 0.55 : 1.0;
      glowTgt  = sp ? 0.95 : ld ? 0.68 : 0.42;
      swirlTgt = ld ? 1.0  : 0.0;

      const lr = dt * 3.5e-3; // lerp rate — smooth transitions ~1 second
      speedCur += (speedTgt - speedCur) * lr;
      glowCur  += (glowTgt  - glowCur)  * lr;
      swirlCur += (swirlTgt - swirlCur) * lr;

      const spd = speedCur;

      /* ── clear with deep space base color ── */
      ctx.fillStyle = "#050816";
      ctx.fillRect(0, 0, W, H);

      /* ══ LAYER 1: Nebulae ════════════════════════════════════════════════ */
      for (const nb of nebulae) {
        nb.phase += dt * nb.phaseSpd;
        nb.x += nb.vx * dt * spd;
        nb.y += nb.vy * dt * spd;
        // seamless wrap with per-nebula padding
        const padX = nb.rw + 0.04;
        const padY = nb.rh + 0.04;
        if (nb.x >  1 + padX) nb.x -= 1 + padX * 2;
        if (nb.x < -padX)     nb.x += 1 + padX * 2;
        if (nb.y >  1 + padY) nb.y -= 1 + padY * 2;
        if (nb.y < -padY)     nb.y += 1 + padY * 2;

        const cx    = nb.x * W;
        const cy    = nb.y * H;
        const rw    = nb.rw * W;
        const rh    = nb.rh * H;
        const pulse = 1 + Math.sin(nb.phase) * 0.11;
        const al    = nb.opacity * glowCur * pulse;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, rh / rw);          // flatten circle to ellipse on screen
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rw * pulse);
        g.addColorStop(0,    `hsla(${nb.hue},75%,65%,${al})`);
        g.addColorStop(0.42, `hsla(${nb.hue},60%,45%,${(al * 0.3).toFixed(4)})`);
        g.addColorStop(1,    `hsla(${nb.hue},50%,25%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, rw * pulse, 0, TAU);
        ctx.fill();
        ctx.restore();
      }

      /* ══ LAYER 2: Glow Particles ═════════════════════════════════════════ */
      for (const p of particles) {
        p.phase += dt * 1.2e-3;

        // swirl toward center when NAVI is thinking
        if (swirlCur > 0.02) {
          const dx = p.x - 0.5;
          const dy = p.y - 0.5;
          if (Math.abs(dx) + Math.abs(dy) > 0.005) {
            const ang = swirlCur * 8.5e-4 * dt * spd;
            const cos = Math.cos(ang), sin = Math.sin(ang);
            p.x = 0.5 + dx * cos - dy * sin;
            p.y = 0.5 + dx * sin + dy * cos;
          }
        }

        p.x += p.vx * dt * spd;
        p.y += p.vy * dt * spd;
        if (p.x >  1.25) p.x -= 1.5; if (p.x < -0.25) p.x += 1.5;
        if (p.y >  1.25) p.y -= 1.5; if (p.y < -0.25) p.y += 1.5;

        const px = p.x * W;
        const py = p.y * H;
        const sz = p.size * (1 + swirlCur * 0.3);
        const al = p.opacity * glowCur * (0.82 + Math.sin(p.phase) * 0.18);
        const g  = ctx.createRadialGradient(px, py, 0, px, py, sz);
        g.addColorStop(0, `hsla(${p.hue},80%,72%,${al.toFixed(4)})`);
        g.addColorStop(1, `hsla(${p.hue},60%,40%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, TAU);
        ctx.fill();
      }

      /* ══ LAYER 3: Stars ══════════════════════════════════════════════════ */
      for (const st of stars) {
        st.twinkle += dt * st.twinkleSpd;
        // near stars drift faster (parallax)
        const driftSpd = (4e-5 + st.z * 9e-5) * spd;
        st.x += driftSpd * dt * Math.cos(DRIFT_ANGLE);
        st.y += driftSpd * dt * Math.sin(DRIFT_ANGLE);
        if (st.x >  1.05) st.x -= 1.1; if (st.x < -0.05) st.x += 1.1;
        if (st.y >  1.05) st.y -= 1.1; if (st.y < -0.05) st.y += 1.1;

        const sx   = st.x * W;
        const sy   = st.y * H;
        const twAl = st.opacity * (0.7 + Math.sin(st.twinkle) * 0.3);
        // speaking: stars glow slightly larger
        const rr   = st.radius * (1 + (sp ? 0.38 * glowCur : 0));

        // soft halo for brighter stars
        if (st.radius > 0.9) {
          const hg = ctx.createRadialGradient(sx, sy, 0, sx, sy, rr * 5);
          hg.addColorStop(0, `rgba(180,215,255,${(twAl * 0.22).toFixed(4)})`);
          hg.addColorStop(1, "rgba(180,215,255,0)");
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(sx, sy, rr * 5, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(220,235,255,${twAl.toFixed(4)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, rr, 0, TAU);
        ctx.fill();
      }

      /* ══ LAYER 4: Streaks (forward-motion illusion) ══════════════════════ */
      for (const sk of streaks) {
        sk.x += sk.speed * dt * spd * Math.cos(DRIFT_ANGLE);
        sk.y += sk.speed * dt * spd * Math.sin(DRIFT_ANGLE);
        if (sk.x >  1.05) sk.x -= 1.1; if (sk.x < -0.05) sk.x += 1.1;
        if (sk.y >  1.05) sk.y -= 1.1; if (sk.y < -0.05) sk.y += 1.1;

        const sx  = sk.x * W;
        const sy  = sk.y * H;
        const ex  = sx - Math.cos(DRIFT_ANGLE) * sk.length * W;
        const ey  = sy - Math.sin(DRIFT_ANGLE) * sk.length * H;
        const al  = sk.opacity * Math.min(spd * 0.85, 1.6);
        const g   = ctx.createLinearGradient(sx, sy, ex, ey);
        g.addColorStop(0, `rgba(200,220,255,${al.toFixed(4)})`);
        g.addColorStop(1, "rgba(200,220,255,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth   = 0.7;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      /* ══ LAYER 5: Shooting Star ══════════════════════════════════════════ */
      ssSince += dt;
      if (!ss.active && ssSince > nextSSIn) {
        ss.active  = true;
        ss.x       = rng(0.05, 0.55);
        ss.y       = rng(0.0, 0.3);
        const ang  = Math.PI * rng(0.18, 0.32);
        const vel  = rng(0.003, 0.005);
        ss.vx      = Math.cos(ang) * vel;
        ss.vy      = Math.sin(ang) * vel;
        ss.tailLen = rng(0.08, 0.16);
        ss.life    = 0;
        ss.maxLife = rng(800, 1900);
        ssSince    = 0;
        nextSSIn   = rng(10000, 28000);
      }

      if (ss.active) {
        ss.life += dt;
        ss.x    += ss.vx * dt;
        ss.y    += ss.vy * dt;
        const prog = ss.life / ss.maxLife;
        const fade = prog < 0.12 ? prog / 0.12
                   : prog > 0.65 ? (1 - prog) / 0.35
                   : 1;
        const al   = fade * 0.95;

        if (ss.life >= ss.maxLife || ss.x > 1.15 || ss.y > 1.1) {
          ss.active = false;
        } else {
          const hx = ss.x * W;
          const hy = ss.y * H;
          const ta = Math.atan2(ss.vy, ss.vx);
          const tx = hx - Math.cos(ta) * ss.tailLen * W;
          const ty = hy - Math.sin(ta) * ss.tailLen * H;

          const g = ctx.createLinearGradient(hx, hy, tx, ty);
          g.addColorStop(0,    `rgba(255,255,255,${al.toFixed(4)})`);
          g.addColorStop(0.25, `rgba(185,215,255,${(al * 0.55).toFixed(4)})`);
          g.addColorStop(1,    "rgba(120,170,255,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth   = 1.8;
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          // head glow
          const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 5);
          hg.addColorStop(0, `rgba(255,255,255,${al.toFixed(4)})`);
          hg.addColorStop(1, "rgba(180,205,255,0)");
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(hx, hy, 5, 0, TAU);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []); // intentionally no deps — stateRef carries live values

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        display: "block",
        background: "#050816", // shown immediately before JS initializes
      }}
    />
  );
}
