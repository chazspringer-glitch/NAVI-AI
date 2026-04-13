/**
 * Web Audio API sound effects — no external files, works offline.
 * All sounds are synthesized with oscillators.
 */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext ?? (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browser autoplay policy)
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

function ramp(
  gain: GainNode,
  ctx: AudioContext,
  pairs: [time: number, value: number][],
  now = ctx.currentTime,
) {
  gain.gain.setValueAtTime(pairs[0][1], now + pairs[0][0]);
  for (const [t, v] of pairs.slice(1)) {
    gain.gain.linearRampToValueAtTime(v, now + t);
  }
}

/** Subtle click + rising sweep — played on tab/mode switch */
export function playTabSwitch() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Short click transient
  const click = ctx.createOscillator();
  const clickGain = ctx.createGain();
  click.type = "sine";
  click.frequency.setValueAtTime(1200, now);
  click.frequency.linearRampToValueAtTime(400, now + 0.06);
  clickGain.gain.setValueAtTime(0, now);
  clickGain.gain.linearRampToValueAtTime(0.12, now + 0.005);
  clickGain.gain.linearRampToValueAtTime(0, now + 0.06);
  click.connect(clickGain);
  clickGain.connect(ctx.destination);
  click.start(now);
  click.stop(now + 0.08);

  // Gentle sweep tone
  const sweep = ctx.createOscillator();
  const sweepGain = ctx.createGain();
  sweep.type = "sine";
  sweep.frequency.setValueAtTime(320, now + 0.04);
  sweep.frequency.exponentialRampToValueAtTime(640, now + 0.22);
  ramp(sweepGain, ctx, [[0.04, 0], [0.08, 0.07], [0.22, 0]], now);
  sweep.connect(sweepGain);
  sweepGain.connect(ctx.destination);
  sweep.start(now + 0.04);
  sweep.stop(now + 0.24);
}

/** Two-tone rising chime — played when user taps "Go Now" */
export function playConfirm() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const freqs = [520, 780, 1040];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    const t0 = now + i * 0.1;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.14, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.35);
  });
}

/** Soft double-blip — played when NAVI finishes a response */
export function playNaviResponse() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  [0, 0.1].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(i === 0 ? 660 : 880, now + delay);
    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(0.09, now + delay + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.2);
  });
}
