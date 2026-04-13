"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BondDisplay from "./BondDisplay";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

// ── Static data (mirrors World.jsx) ──────────────────────────────────────────
const AREAS = [
  {
    id: "home", label: "Home", emoji: "🏠", modeHint: "🤝 companion",
    bg: "radial-gradient(ellipse at 35% 30%, #0d1e3a 0%, #070e1e 45%, #040810 100%)",
    accent: "#60a5fa",
    hint: "Home sweet home… try Companion mode to chat 🤝",
  },
  {
    id: "school", label: "School", emoji: "📚", modeHint: "✊ history",
    bg: "radial-gradient(ellipse at 50% 20%, #0b2848 0%, #071a30 50%, #030d1c 100%)",
    accent: "#00d4ff",
    hint: "Ready to learn? Try Black History mode here ✊",
  },
  {
    id: "playground", label: "Playground", emoji: "🎮", modeHint: "💼 jobs",
    bg: "radial-gradient(ellipse at 60% 50%, #0b2e18 0%, #071c0d 50%, #030e06 100%)",
    accent: "#4ade80",
    hint: "Let's hustle! Job Finder mode is great here 💼",
  },
];

const MODES = [
  { id: "chat",     label: "Chat",   icon: "💬" },
  { id: "learning", label: "Learn",  icon: "📚" },
  { id: "mentor",   label: "Mentor", icon: "⭐" },
];

const TIME_CONFIG = {
  morning:   { overlay: "rgba(255,200,80,0.05)",  starAlpha: 0.25, label: "☀️ Morning"  },
  afternoon: { overlay: "transparent",             starAlpha: 0.18, label: "🌤 Afternoon" },
  evening:   { overlay: "rgba(255,110,40,0.07)",  starAlpha: 0.55, label: "🌅 Evening"  },
  night:     { overlay: "rgba(5,8,35,0.40)",       starAlpha: 1.00, label: "🌙 Night"    },
};

const STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  x: `${((i * 137.508) % 100).toFixed(2)}%`,
  y: `${((i * 97.3)   % 100).toFixed(2)}%`,
  r: i % 5 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1,
}));

// ── Emotion configs ───────────────────────────────────────────────────────────
// eyeScaleY : vertical squish of the eye (1=normal, <1=squint, >1=wide)
// pupilScale: pupil diameter as fraction of eye width
// blinkMs   : base interval between blinks
// glowMult  : 0-1 multiplier on glow radius
// floatMs   : CSS float animation period
// gazeMs    : base interval for random gaze shifts
const EMOTIONS = {
  idle:      { eyeScaleY: 1.00, pupilScale: 0.38, blinkMs: 5000, glowMult: 0.38, floatMs: 4800, gazeMs: 4000 },
  thinking:  { eyeScaleY: 0.85, pupilScale: 0.33, blinkMs: 7500, glowMult: 0.52, floatMs: 4000, gazeMs: 1800 },
  talking:   { eyeScaleY: 1.08, pupilScale: 0.44, blinkMs: 3000, glowMult: 0.68, floatMs: 3200, gazeMs:  900 },
  happy:     { eyeScaleY: 0.75, pupilScale: 0.42, blinkMs: 3800, glowMult: 0.60, floatMs: 3600, gazeMs: 3200 },
  focused:   { eyeScaleY: 0.82, pupilScale: 0.30, blinkMs: 9000, glowMult: 0.46, floatMs: 5400, gazeMs: 5500 },
  sleepy:    { eyeScaleY: 0.32, pupilScale: 0.18, blinkMs: 2000, glowMult: 0.22, floatMs: 7200, gazeMs: 8000 },
  excited:   { eyeScaleY: 1.18, pupilScale: 0.50, blinkMs: 1900, glowMult: 0.72, floatMs: 2200, gazeMs:  700 },
  listening: { eyeScaleY: 0.90, pupilScale: 0.36, blinkMs: 8000, glowMult: 0.48, floatMs: 4400, gazeMs: 6000 },
};

function moodToEmotion(mood) {
  if (mood === "excited") return "excited";
  if (mood === "bored")   return "sleepy";
  return "idle";
}


// ── (NaviEye removed — replaced by energy orb visual) ────────────────────────

// ── Soft breathing glow layer ─────────────────────────────────────────────────
// Replaces the full shapeshifting BackgroundLayer — one calm ambient glow.
function AmbientGlow({ accent }) {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      <style>{`
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.06; transform: scale(1); }
          50%       { opacity: 0.13; transform: scale(1.08); }
        }
      `}</style>
      <div style={{
        position:"absolute", top:"8%", left:"12%", width:"76%", height:"84%",
        borderRadius:"50%",
        background:`radial-gradient(circle, ${accent}28 0%, ${accent}10 45%, transparent 70%)`,
        animation:"ambientPulse 6s ease-in-out infinite",
      }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NaviFace({
  mood,
  isSpeaking,
  isLoading = false,
  petName,
  bondXP,
  mentorMode,
  onModeChange,
  onAreaChange,
  lastUserMessage = "",
  wakeActive = false,
  onTap,
}) {
  const containerRef = useRef(null);

  const [areaIdx,       setAreaIdx]       = useState(0);
  const [timeOfDay,     setTimeOfDay]     = useState(getTimeOfDay);
  const [emotion,       setEmotion]       = useState("idle");
  const [blinking,      setBlinking]      = useState(false);
  const [gazeX,         setGazeX]         = useState(0);   // -1 … 1
  const [gazeY,         setGazeY]         = useState(0);   // -1 … 1
  const [showHint,      setShowHint]      = useState(false);
  const [hintText,      setHintText]      = useState("");
  const [transitioning, setTransitioning] = useState(false);

  const [userAmplitude, setUserAmplitude] = useState(0);  // 0-1
  const [naviAmplitude, setNaviAmplitude] = useState(0);  // 0-1
  const [micActive,     setMicActive]     = useState(false);
  const [naviPos,       setNaviPos]       = useState({ x: 0, y: 0 }); // px offset from center
  const [naviTransMs,   setNaviTransMs]   = useState(0);               // transition duration
  const [sparkBurst,    setSparkBurst]    = useState(false);  // emotion reaction particles
  const [pokeBounce,    setPokeBounce]    = useState(false);  // click squish reaction
  const [thoughtDots,   setThoughtDots]   = useState(false);  // idle thought bubbles

  const emotionRef      = useRef("idle");
  const blinkRef        = useRef(null);
  const gazeRef         = useRef(null);
  const hintRef         = useRef(null);
  const speakRef        = useRef(isSpeaking);
  const loadRef         = useRef(isLoading);
  const baseEmoRef      = useRef("idle");
  const audioCtxRef     = useRef(null);
  const streamRef       = useRef(null);
  const micRafRef       = useRef(null);
  const naviRafRef      = useRef(null);
  const moveTimerRef    = useRef(null);
  const movePausedRef   = useRef(false);
  const movePauseTimer  = useRef(null);
  const containerDimRef = useRef({ w: 400, h: 300 });
  const sparkTimerRef   = useRef(null);
  const thoughtTimerRef = useRef(null);
  const proactiveRef    = useRef(null);
  const prevEmoRef      = useRef("idle");

  const area    = AREAS[areaIdx];
  const accent  = area.accent;
  const emoCfg  = EMOTIONS[emotion] ?? EMOTIONS.idle;

  // ── Emotion helper ────────────────────────────────────────────────────────
  const setEmo = useCallback((e) => {
    setEmotion(e);
    emotionRef.current = e;
  }, []);

  const baseEmo = moodToEmotion(mood);

  // Keep baseEmoRef in sync for use inside async mic loop
  useEffect(() => { baseEmoRef.current = baseEmo; }, [baseEmo]);

  // ── Sync loading / speaking → emotion ────────────────────────────────────
  useEffect(() => {
    speakRef.current = isSpeaking;
    loadRef.current  = isLoading;
    let timer = null;

    if (isLoading) {
      setEmo("thinking");
    } else if (isSpeaking) {
      setEmo("talking");
    } else {
      const prev = emotionRef.current;
      if (prev === "talking" || prev === "thinking") {
        setEmo("happy");
        timer = setTimeout(() => {
          if (!speakRef.current && !loadRef.current) setEmo(baseEmo);
        }, 1600);
      } else {
        setEmo(baseEmo);
      }
    }

    return () => { if (timer) clearTimeout(timer); };
  }, [isSpeaking, isLoading, baseEmo, setEmo]);

  // ── Mic amplitude detection (Web Audio API) ───────────────────────────────
  // Never requests permission itself — only starts after it has been granted
  // (either already granted, or the user tapped the speech mic button first).
  useEffect(() => {
    let silenceTimer = null;
    let isListening  = false;
    let perm         = null;   // PermissionStatus reference for cleanup
    let started      = false;  // guard so we only call getUserMedia once

    async function startAudioCapture() {
      if (started) return;
      started = true;
      // Remove change listener now that we're starting
      if (perm) perm.removeEventListener("change", onPermChange);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.75;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        setMicActive(true);

        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((s, v) => s + v, 0) / data.length;
          const amp = Math.min(1, avg / 38);
          setUserAmplitude(amp);

          if (amp > 0.08 && !speakRef.current && !loadRef.current) {
            // User is speaking
            clearTimeout(silenceTimer);
            if (!isListening) {
              isListening = true;
              setEmo("listening");
            }
          } else if (amp < 0.04 && isListening) {
            // User went quiet — wait before transitioning
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
              if (!speakRef.current && !loadRef.current) {
                isListening = false;
                setEmo("thinking");
                setTimeout(() => {
                  if (!speakRef.current && !loadRef.current) setEmo(baseEmoRef.current);
                }, 1000);
              }
            }, 450);
          }

          micRafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // getUserMedia failed — graceful degradation, amplitude stays 0
      }
    }

    // Fires when the user grants mic permission (e.g. via the speech button)
    function onPermChange() {
      if (perm?.state === "granted") startAudioCapture();
    }

    async function initMic() {
      try {
        perm = await navigator.permissions?.query({ name: "microphone" });
        if (!perm) return; // Permissions API unavailable — skip amplitude detection

        if (perm.state === "granted") {
          // Already granted — start immediately without any popup
          await startAudioCapture();
        } else if (perm.state === "prompt") {
          // Not yet decided — watch for the grant triggered by the speech button
          perm.addEventListener("change", onPermChange);
        }
        // "denied" → silently skip amplitude detection
      } catch {
        // Permissions API threw — skip amplitude detection
      }
    }

    initMic();

    return () => {
      clearTimeout(silenceTimer);
      cancelAnimationFrame(micRafRef.current);
      if (perm) perm.removeEventListener("change", onPermChange);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      setMicActive(false);
      setUserAmplitude(0);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── NAVI speech amplitude simulation ─────────────────────────────────────
  useEffect(() => {
    if (isSpeaking) {
      let t = 0;
      const tick = () => {
        t += 0.055;
        // Layered sines + noise mimicking natural speech rhythm
        const raw = 0.28 + Math.sin(t * 3.1) * 0.22 + Math.sin(t * 7.4) * 0.14 + (Math.random() - 0.5) * 0.18;
        setNaviAmplitude(Math.max(0, Math.min(1, raw)));
        naviRafRef.current = requestAnimationFrame(tick);
      };
      naviRafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(naviRafRef.current);
      naviRafRef.current = null;
      setNaviAmplitude(0);
    }
    return () => cancelAnimationFrame(naviRafRef.current);
  }, [isSpeaking]);

  // ── Blink ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const schedule = () => {
      const base = EMOTIONS[emotionRef.current]?.blinkMs ?? 4500;
      blinkRef.current = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => { setBlinking(false); schedule(); }, 130);
      }, base * (0.6 + Math.random() * 0.8));
    };
    schedule();
    return () => clearTimeout(blinkRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Random gaze ───────────────────────────────────────────────────────────
  useEffect(() => {
    const schedule = () => {
      const base = EMOTIONS[emotionRef.current]?.gazeMs ?? 3500;
      gazeRef.current = setTimeout(() => {
        const em = emotionRef.current;
        if (em === "thinking") {
          setGazeX(-0.55 + Math.random() * 0.3);
          setGazeY(-0.50 + Math.random() * 0.2);
        } else if (em === "talking") {
          setGazeX((Math.random() - 0.5) * 0.5);
          setGazeY((Math.random() - 0.5) * 0.3);
        } else if (em === "sleepy") {
          setGazeX((Math.random() - 0.5) * 0.7);
          setGazeY(0.12 + Math.random() * 0.25);
        } else if (em === "listening") {
          // Eyes focused nearly forward, slight attention upward
          setGazeX((Math.random() - 0.5) * 0.25);
          setGazeY(-0.08 + (Math.random() - 0.5) * 0.18);
        } else {
          setGazeX((Math.random() - 0.5) * 1.4);
          setGazeY((Math.random() - 0.5) * 0.9);
        }
        schedule();
      }, base * (0.4 + Math.random() * 1.2));
    };
    schedule();
    return () => clearTimeout(gazeRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pointer tracking (eyes follow cursor / touch) ─────────────────────────
  const onPointerMove = useCallback((e) => {
    // Pause free roaming while user is interacting; resume 3s after they stop
    movePausedRef.current = true;
    clearTimeout(movePauseTimer.current);
    movePauseTimer.current = setTimeout(() => { movePausedRef.current = false; }, 3000);

    if (!containerRef.current) return;
    const r  = containerRef.current.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height * 0.40;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setGazeX(Math.max(-1, Math.min(1, ((clientX - cx) / (r.width  / 2)) * 0.85)));
    setGazeY(Math.max(-1, Math.min(1, ((clientY - cy) / (r.height / 2)) * 0.65)));
  }, []);

  const onPointerLeave = useCallback(() => {
    setGazeX(0); setGazeY(0);
  }, []);

  // Poke / tap reaction — squish + happy burst
  const onOrbClick = useCallback(() => {
    setPokeBounce(true);
    setTimeout(() => setPokeBounce(false), 460);
    if (emotionRef.current !== "talking" && emotionRef.current !== "thinking") {
      setEmo("happy");
      setTimeout(() => {
        if (!speakRef.current && !loadRef.current) setEmo(baseEmoRef.current);
      }, 1400);
    }
    onTap?.();
  }, [setEmo, onTap]);

  // ── Area switching ────────────────────────────────────────────────────────
  const switchArea = useCallback((idx) => {
    if (idx === areaIdx || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setAreaIdx(idx);
      setHintText(AREAS[idx].hint);
      setShowHint(true);
      clearTimeout(hintRef.current);
      hintRef.current = setTimeout(() => setShowHint(false), 3200);
      setTransitioning(false);
      onAreaChange?.(idx);
    }, 280);
  }, [areaIdx, transitioning, onAreaChange]);

  // ── Clock ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setTimeOfDay(getTimeOfDay()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Free roam movement ────────────────────────────────────────────────────
  useEffect(() => {
    const FACE_W = 220;  // float wrapper width
    const FACE_H = 295;  // approx total face block height (name + float + label)
    const NAV_H  = 24;   // bottom clearance (bond bar only, no nav)
    const PAD    = 20;   // minimum edge clearance

    // Track container dimensions via ResizeObserver
    const obs = new ResizeObserver(([entry]) => {
      containerDimRef.current = {
        w: entry.contentRect.width,
        h: entry.contentRect.height,
      };
    });
    if (containerRef.current) {
      containerDimRef.current = {
        w: containerRef.current.offsetWidth,
        h: containerRef.current.offsetHeight,
      };
      obs.observe(containerRef.current);
    }

    const scheduleMove = () => {
      const em = emotionRef.current;
      // Wait duration varies by emotion character
      const baseMs =
        em === "sleepy"   ? 6800 :
        em === "excited"  ? 2000 :
        em === "thinking" ? 5200 :
        em === "talking"  ? 4800 : 3600;
      const waitMs = baseMs + Math.random() * 2800;

      moveTimerRef.current = setTimeout(() => {
        // Skip the move if user is actively interacting
        if (movePausedRef.current) { scheduleMove(); return; }

        const { w, h } = containerDimRef.current;
        const em2     = emotionRef.current;
        const speaking = speakRef.current;
        const loading  = loadRef.current;

        // Available travel range from container center (px)
        const maxX = Math.max(0, w / 2 - FACE_W / 2 - PAD);
        // Account for nav bar: shift the vertical center upward by half nav height
        const yBias = -(NAV_H / 2);
        const maxY  = Math.max(0, (h - NAV_H) / 2 - FACE_H / 2 - PAD);

        // Reduce range while busy (speaking/loading) or in focused states
        const busy  = speaking || loading;
        const scaleX = busy ? 0.28 : em2 === "thinking" ? 0.22 : 1.0;
        const scaleY = busy ? 0.28 : em2 === "thinking" ? 0.22 : 1.0;

        // 55% small nudge, 45% bigger wander
        const isNudge  = Math.random() < 0.55;
        const moveMult = isNudge ? 0.18 + Math.random() * 0.22 : 0.50 + Math.random() * 0.50;
        const transDur = isNudge ? 1000 + Math.random() * 400 : 1400 + Math.random() * 400;

        const nx = (Math.random() * 2 - 1) * maxX * scaleX * moveMult;
        const ny = yBias + (Math.random() * 2 - 1) * maxY * scaleY * moveMult;

        setNaviTransMs(Math.round(transDur));
        setNaviPos({ x: nx, y: ny });
        scheduleMove();
      }, waitMs);
    };

    // Enable transition after mount then start roaming
    setNaviTransMs(1500);
    scheduleMove();

    return () => {
      clearTimeout(moveTimerRef.current);
      obs.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Spark burst on positive emotion transitions ───────────────────────────
  useEffect(() => {
    const prev = prevEmoRef.current;
    if (emotion !== prev) {
      if (
        emotion === "excited" ||
        (emotion === "happy" && (prev === "talking" || prev === "thinking"))
      ) {
        clearTimeout(sparkTimerRef.current);
        setSparkBurst(true);
        sparkTimerRef.current = setTimeout(() => setSparkBurst(false), 900);
      }
      prevEmoRef.current = emotion;
    }
  }, [emotion]);

  // ── Thought dots: appear after prolonged idle ─────────────────────────────
  useEffect(() => {
    clearTimeout(thoughtTimerRef.current);
    setThoughtDots(false);
    if (emotion === "idle" || emotion === "sleepy") {
      thoughtTimerRef.current = setTimeout(() => setThoughtDots(true), 14000);
    }
    return () => clearTimeout(thoughtTimerRef.current);
  }, [emotion]);

  // ── Proactive engagement: hint after 30 s since last user message ─────────
  useEffect(() => {
    clearTimeout(proactiveRef.current);
    proactiveRef.current = setTimeout(() => {
      if (emotionRef.current === "idle" || emotionRef.current === "sleepy") {
        setHintText("Hey… anything on your mind? 👋");
        setShowHint(true);
        clearTimeout(hintRef.current);
        hintRef.current = setTimeout(() => setShowHint(false), 3500);
      }
    }, 30000);
    return () => clearTimeout(proactiveRef.current);
  }, [lastUserMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived glow + amplitude — softer, friendlier values ─────────────────
  // When wake word is active, visually override emotion to "listening"
  const effectiveEmotion  = wakeActive ? "listening" : emotion;
  const totalAmplitude    = Math.max(userAmplitude, naviAmplitude);
  const effectiveGlowMult = Math.min(1, emoCfg.glowMult + totalAmplitude * 0.28 + (wakeActive ? 0.38 : 0));
  const faceScale         = 1 + totalAmplitude * 0.045;
  const naviWave          = isSpeaking && naviAmplitude > 0.12;
  const headTiltDeg       = (gazeX * 2.8).toFixed(1);

  // ── Eye + orbit derived values ─────────────────────────────────────────────
  const isEyeActive    = effectiveEmotion === "talking" || effectiveEmotion === "listening" || effectiveEmotion === "excited" || wakeActive;
  const eyeOpacity     = isEyeActive ? 0.84 : effectiveEmotion === "thinking" ? 0.38 : effectiveEmotion === "happy" ? 0.24 : 0;
  const orbitIntensity = Math.min(1, effectiveGlowMult * 0.9 + (wakeActive ? 0.26 : 0));
  const g1 = Math.round(28  * effectiveGlowMult);
  const g2 = Math.round(60  * effectiveGlowMult);
  const g3 = Math.round(100 * effectiveGlowMult);
  const faceGlow = `0 0 ${g1}px ${accent}44, 0 0 ${g2}px ${accent}22, 0 0 ${g3}px ${accent}10, inset 0 0 24px rgba(0,0,0,0.55)`;
  const floatDur  = `${emoCfg.floatMs}ms`;
  const breathDur = `${Math.round(emoCfg.floatMs * 0.72)}ms`;

  const emoLabel = wakeActive
    ? "● wake — listening"
    : ({
        thinking: "● processing", talking: "● speaking", happy: "● happy",
        sleepy: "● sleepy", excited: "● excited", focused: "● focused",
        listening: "● listening", idle: "● idle",
      }[emotion] ?? "● idle");

  const baseMouthWidth = { excited: 50, happy: 44, talking: 36, listening: 38, thinking: 24, sleepy: 28, focused: 22, idle: 26 }[effectiveEmotion] ?? 26;
  const mouthWidth   = baseMouthWidth + Math.round(totalAmplitude * 22);
  const mouthOpacity = { excited: 0.80, happy: 0.75, talking: 0.70, listening: 0.68, thinking: 0.55, sleepy: 0.40, focused: 0.38, idle: 0.33 }[effectiveEmotion] ?? 0.33;
  // scaleY: 0.18 = thin resting line; rises toward 1.0 while speaking/listening
  const mouthScaleY  = (isSpeaking || effectiveEmotion === "talking" || effectiveEmotion === "listening")
    ? Math.max(0.22, 0.18 + naviAmplitude * 0.82)
    : 0.18;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-0 overflow-hidden select-none"
      style={{
        minHeight: 240,
        background: area.bg,
        transition: "background 1.2s ease",
      }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {/* Transition flash */}
      {transitioning && (
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: 0.4, zIndex: 50, pointerEvents: "none" }} />
      )}

      {/* Time-of-day tint */}
      {TIME_CONFIG[timeOfDay].overlay !== "transparent" && (
        <div style={{ position: "absolute", inset: 0, background: TIME_CONFIG[timeOfDay].overlay, zIndex: 1, pointerEvents: "none", transition: "background 3s ease" }} />
      )}

      {/* Star field — every 3rd star twinkles */}
      {STARS.map((s) => (
        <div key={s.id} style={{
          position: "absolute", left: s.x, top: s.y,
          width: s.r, height: s.r, borderRadius: "50%",
          background: `rgba(200,220,255,${TIME_CONFIG[timeOfDay].starAlpha})`,
          pointerEvents: "none", transition: "background 3s ease",
          ...(s.id % 3 === 0 && {
            animation: `starTwinkle ${5 + (s.id % 9) * 0.6}s ease-in-out ${(s.id * 1.3) % 7}s infinite`,
          }),
        }} />
      ))}

      {/* ── Ambient breathing glow ───────────────────────────────────────── */}
      <div style={{ position:"absolute", inset:0, zIndex:2, pointerEvents:"none" }}>
        <AmbientGlow accent={accent} />
      </div>

      {/* ── Animated face ────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: `translate(calc(-50% + ${naviPos.x}px), calc(-50% + ${naviPos.y}px)) rotate(${headTiltDeg}deg)`,
        transition: naviTransMs > 0 ? `transform ${naviTransMs}ms ease-in-out` : "none",
        zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>

        {/* Name tag */}
        <div style={{
          fontFamily: "monospace", fontSize: 10, letterSpacing: "0.22em",
          color: `${accent}88`, marginBottom: 14,
          textTransform: "uppercase", pointerEvents: "none",
          transition: "color 0.8s ease",
        }}>
          {petName || "NAVI"}
        </div>

        {/* Amplitude scale wrapper — separate from float so animations don't conflict */}
        <div style={{
          transform: pokeBounce ? undefined : `scale(${faceScale})`,
          transition: pokeBounce ? undefined : (totalAmplitude > 0.05 ? "transform 0.08s ease" : "transform 0.35s ease"),
          animation: pokeBounce ? "orbPoke 0.46s cubic-bezier(0.36,0.07,0.19,0.97) forwards" : undefined,
        }}>

        {/* Float wrapper */}
        <div style={{
          position: "relative", width: 220, height: 220,
          display: "flex", alignItems: "center", justifyContent: "center",
          animationName: "navifaceFloat",
          animationDuration: floatDur,
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
        }}>

          {/* Soft decorative rings — gentle breathing, reduced opacity */}
          {[
            { scale: 1.00, opacity: "22", dur: 4200, rev: false },
            { scale: 0.87, opacity: "14", dur: 5800, rev: true  },
          ].map(({ scale, opacity, dur, rev }, i) => (
            <div key={i} style={{
              position: "absolute",
              width: `${scale * 100}%`, height: `${scale * 100}%`,
              borderRadius: "50%",
              border: `1px solid ${accent}${opacity}`,
              animationName: "navifaceRing",
              animationDuration: `${dur}ms`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDirection: rev ? "reverse" : "normal",
              pointerEvents: "none",
            }} />
          ))}

          {/* ── Outer aura halo — soft radial ring behind the orb ── */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 232, height: 232,
            marginTop: -116, marginLeft: -116,
            borderRadius: "50%",
            background: `radial-gradient(circle, transparent 36%, ${accent}${Math.round(orbitIntensity * 22).toString(16).padStart(2, "0")} 56%, transparent 76%)`,
            animationName: "orbitHaloPulse",
            animationDuration: "4.2s",
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            pointerEvents: "none",
            zIndex: 3,
            opacity: 0.5 + orbitIntensity * 0.45,
            transition: "opacity 1.6s ease",
          }} />

          {/* ── Orbit ring — conic-gradient masked to a thin glowing line ── */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 212, height: 212,
            marginTop: -106, marginLeft: -106,
            borderRadius: "50%",
            animationName: "orbitRingRotate",
            animationDuration: "18s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            pointerEvents: "none",
            zIndex: 4,
          }}>
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              background: `conic-gradient(from 0deg, transparent 0%, ${accent}52 22%, ${accent}28 46%, transparent 62%)`,
              maskImage: "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))",
              WebkitMaskImage: "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))",
              opacity: 0.45 + orbitIntensity * 0.48,
              transition: "opacity 1.2s ease",
            }} />
          </div>

          {/* ── Orbit particles — 3 glowing dots flowing along the ring ── */}
          {[
            { dur: 18, offset: 0      },
            { dur: 18, offset: -6     },
            { dur: 18, offset: -12    },
          ].map(({ dur, offset }, i) => (
            <div key={`op-${i}`} style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: 212, height: 212,
              marginTop: -106, marginLeft: -106,
              animationName: "orbitRingRotate",
              animationDuration: `${dur}s`,
              animationDelay: `${offset}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              pointerEvents: "none",
              zIndex: 5,
            }}>
              <div style={{
                position: "absolute",
                top: 0, left: "50%",
                transform: "translate(-50%, -50%)",
                width: i === 0 ? 5 : 4,
                height: i === 0 ? 5 : 4,
                borderRadius: "50%",
                background: i % 2 === 0 ? accent : "rgba(190,130,255,1)",
                boxShadow: `0 0 5px ${i % 2 === 0 ? accent : "#be82ff"}, 0 0 9px ${i % 2 === 0 ? accent : "#be82ff"}66`,
                opacity: (0.42 + orbitIntensity * 0.52) * (i === 0 ? 1.0 : 0.65),
                transition: "opacity 1.2s ease",
              }} />
            </div>
          ))}

          {/* ── Listening ripple — faint expanding ring when mic is active ── */}
          {effectiveEmotion === "listening" && !naviWave && (
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: 200, height: 200,
              marginTop: -100, marginLeft: -100,
              borderRadius: "50%",
              border: `1px solid ${accent}3a`,
              animation: "listenRipple 2.2s ease-out infinite",
              pointerEvents: "none",
              zIndex: 5,
            }} />
          )}

          {/* Voice wave rings — expand outward while NAVI speaks */}
          {naviWave && [0, 1, 2].map((i) => {
            const sz = 186 + (i + 1) * 26;
            return (
              <div key={i} style={{
                position: "absolute",
                top: "50%", left: "50%",
                width: sz, height: sz,
                marginTop: -sz / 2, marginLeft: -sz / 2,
                borderRadius: "50%",
                border: `1.5px solid ${accent}${["3a", "22", "12"][i]}`,
                animation: `waveExpand 1.4s ease-out ${i * 0.24}s infinite`,
                pointerEvents: "none",
                zIndex: 5,
              }} />
            );
          })}

          {/* Thought dots — float above orb during prolonged idle */}
          {thoughtDots && (
            <div style={{
              position: "absolute",
              top: 8, left: "50%",
              transform: "translateX(-50%)",
              display: "flex", gap: 5, alignItems: "flex-end",
              animation: "thoughtFloat 2.2s ease-in-out infinite",
              pointerEvents: "none",
              zIndex: 20,
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 4 + i * 2, height: 4 + i * 2,
                  borderRadius: "50%",
                  background: `${accent}55`,
                  border: `1px solid ${accent}99`,
                  animation: `thoughtBubble 1.6s ease-in-out ${i * 0.3}s infinite`,
                }} />
              ))}
            </div>
          )}

          {/* Wake word active — dual pulsing rings + inner highlight */}
          {wakeActive && (
            <>
              <div style={{
                position: "absolute",
                top: "50%", left: "50%",
                marginTop: -112, marginLeft: -112,
                width: 224, height: 224,
                borderRadius: "50%",
                border: `2px solid ${accent}cc`,
                animation: "wakeRingPulse 0.85s ease-in-out infinite",
                pointerEvents: "none",
                zIndex: 26,
              }} />
              <div style={{
                position: "absolute",
                top: "50%", left: "50%",
                marginTop: -126, marginLeft: -126,
                width: 252, height: 252,
                borderRadius: "50%",
                border: `1px solid ${accent}55`,
                animation: "wakeRingPulse 0.85s ease-in-out 0.22s infinite",
                pointerEvents: "none",
                zIndex: 26,
              }} />
            </>
          )}

          {/* Spark burst — 8 particles fly outward on emotion reaction */}
          {sparkBurst && Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: 0, height: 0,
              transform: `rotate(${i * 45}deg)`,
              pointerEvents: "none",
              zIndex: 22,
            }}>
              <div style={{
                position: "absolute",
                width: i % 2 === 0 ? 7 : 5,
                height: i % 2 === 0 ? 7 : 5,
                borderRadius: "50%",
                background: i % 3 === 0 ? accent : `${accent}cc`,
                boxShadow: `0 0 8px ${accent}`,
                animation: "sparkShoot 0.68s ease-out forwards",
              }} />
            </div>
          ))}

          {/* Orb wrapper — energy sphere */}
          <div
            style={{
              width: 186, height: 186,
              borderRadius: "50%",
              boxShadow: faceGlow,
              transition: "box-shadow 1.1s ease",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              background: "#020208",
            }}
            onClick={onOrbClick}
          >

            {/* Base energy mist — breathing center bloom */}
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(ellipse at 50% 50%, ${accent}16 0%, ${accent}08 48%, transparent 72%)`,
              animationName: "navifaceGlowPulse",
              animationDuration: breathDur,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              pointerEvents: "none",
            }} />

            {/* Energy cloud A — slow drift, accent tinted, full-coverage */}
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(ellipse at 38% 44%, ${accent}18 0%, ${accent}08 42%, transparent 72%)`,
              animationName: "orbCloudA",
              animationDuration: breathDur,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              pointerEvents: "none",
            }} />

            {/* Energy cloud B — counter-drift, purple tint */}
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(ellipse at 62% 55%, rgba(160,80,255,0.11) 0%, rgba(100,40,200,0.04) 48%, transparent 72%)`,
              animationName: "orbCloudB",
              animationDuration: `${Math.round(emoCfg.floatMs * 1.35)}ms`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              pointerEvents: "none",
            }} />

            {/* Energy cloud C — faster reverse swirl, teal tint */}
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(ellipse at 55% 35%, ${accent}10 0%, rgba(60,180,255,0.04) 45%, transparent 70%)`,
              animationName: "orbCloudA",
              animationDuration: `${Math.round(emoCfg.floatMs * 0.55)}ms`,
              animationDirection: "reverse",
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              pointerEvents: "none",
            }} />

            {/* Energy cloud D — slow diagonal, warm amber tint */}
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(ellipse at 45% 65%, rgba(255,180,80,0.07) 0%, transparent 60%)`,
              animationName: "orbCloudB",
              animationDuration: `${Math.round(emoCfg.floatMs * 0.82)}ms`,
              animationDirection: "reverse",
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              pointerEvents: "none",
            }} />

            {/* Thinking ripple — faint ring, only in thinking state */}
            {effectiveEmotion === "thinking" && (
              <div style={{
                position: "absolute", inset: "16%",
                borderRadius: "50%",
                border: `1px solid ${accent}28`,
                animationName: "orbRipple",
                animationDuration: "1.8s",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                pointerEvents: "none",
              }} />
            )}

            {/* Core bloom — diffuse, gaze-responsive, no hard edges */}
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: `translate(calc(-50% + ${(gazeX * 8).toFixed(1)}px), calc(-50% + ${(gazeY * 8).toFixed(1)}px))`,
              transition: "transform 0.7s ease",
              width: 100, height: 100,
              pointerEvents: "none",
            }}>
              <div style={{
                width: "100%", height: "100%",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${accent}50 0%, ${accent}28 30%, ${accent}0e 58%, transparent 82%)`,
                animationName: "orbPulseCore",
                animationDuration: breathDur,
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                filter: "blur(4px)",
              }} />
            </div>

            {/* Amplitude pulse — softly brightens center with voice */}
            {totalAmplitude > 0.07 && (
              <div style={{
                position: "absolute", inset: 0,
                background: `radial-gradient(ellipse at 50% 50%, ${accent}${Math.round(totalAmplitude * 24).toString(16).padStart(2, "0")} 0%, transparent 65%)`,
                pointerEvents: "none",
                transition: "opacity 0.08s ease",
              }} />
            )}

            {/* ── Inner pin-light — bright white center, voice reactive ── */}
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              width: 30, height: 30,
              marginTop: -15, marginLeft: -15,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,255,255,0.60) 0%, ${accent}cc 28%, transparent 80%)`,
              filter: "blur(3px)",
              opacity: 0.36 + effectiveGlowMult * 0.56,
              transition: "opacity 0.35s ease",
              pointerEvents: "none",
              zIndex: 14,
              transform: `translate(${(gazeX * 6).toFixed(1)}px, ${(gazeY * 4).toFixed(1)}px)`,
            }} />

            {/* ── Subtle energy eyes — fade in when NAVI is active ── */}
            <div style={{
              position: "absolute", inset: 0,
              pointerEvents: "none",
              opacity: eyeOpacity,
              transition: "opacity 0.75s ease",
              zIndex: 15,
            }}>
              {/* Left eye */}
              <div style={{
                position: "absolute",
                left: "26%", top: "36%",
                width: 28, height: 13,
                borderRadius: "50%",
                background: `radial-gradient(ellipse at 50% 40%, ${accent}dd 0%, ${accent}88 32%, ${accent}28 65%, transparent 100%)`,
                transform: `scaleY(${blinking ? 0.04 : emoCfg.eyeScaleY}) translateX(${(gazeX * 6).toFixed(1)}px) translateY(${(gazeY * 3).toFixed(1)}px)`,
                transition: blinking ? "transform 0.06s ease" : "transform 0.38s ease",
                filter: "blur(1.5px)",
              }} />
              {/* Right eye */}
              <div style={{
                position: "absolute",
                right: "26%", top: "36%",
                width: 28, height: 13,
                borderRadius: "50%",
                background: `radial-gradient(ellipse at 50% 40%, ${accent}dd 0%, ${accent}88 32%, ${accent}28 65%, transparent 100%)`,
                transform: `scaleY(${blinking ? 0.04 : emoCfg.eyeScaleY}) translateX(${(gazeX * 6).toFixed(1)}px) translateY(${(gazeY * 3).toFixed(1)}px)`,
                transition: blinking ? "transform 0.06s ease" : "transform 0.38s ease",
                filter: "blur(1.5px)",
              }} />
            </div>

            {/* Particle motes — soft glows, no solid dots */}
            {[
              { angle:  20, r: 62, size: 8,  dur: 5200, delay: 0    },
              { angle:  80, r: 54, size: 6,  dur: 7100, delay: 900  },
              { angle: 145, r: 66, size: 9,  dur: 6300, delay: 1800 },
              { angle: 200, r: 52, size: 6,  dur: 4900, delay: 400  },
              { angle: 265, r: 68, size: 10, dur: 8200, delay: 2200 },
              { angle: 320, r: 56, size: 7,  dur: 5800, delay: 1100 },
            ].map(({ angle, r, size, dur, delay }, i) => {
              const rad = (angle * Math.PI) / 180;
              const px  = 93 + Math.cos(rad) * r;
              const py  = 93 + Math.sin(rad) * r;
              return (
                <div key={i} style={{
                  position: "absolute",
                  left: px - size / 2, top: py - size / 2,
                  width: size, height: size,
                  borderRadius: "50%",
                  background: i % 2 === 0
                    ? `radial-gradient(circle, ${accent}88 0%, transparent 80%)`
                    : `radial-gradient(circle, rgba(180,120,255,0.55) 0%, transparent 80%)`,
                  opacity: effectiveGlowMult * 0.70,
                  animationName: "orbParticleDrift",
                  animationDuration: `${dur}ms`,
                  animationDelay: `${delay}ms`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  pointerEvents: "none",
                  transition: "opacity 0.8s ease",
                  filter: "blur(1px)",
                }} />
              );
            })}

          </div>
          {/* /orb wrapper */}
        </div>
        {/* /amplitude scale wrapper */}
        </div>

        {/* Emotion label */}
        <div style={{
          fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em",
          color: `${accent}66`, marginTop: 16,
          textTransform: "uppercase", pointerEvents: "none",
          transition: "color 0.6s ease",
        }}>
          {emoLabel}
        </div>
      </div>

      {/* Wake word active badge */}
      {wakeActive && (
        <div style={{
          position: "absolute", top: 14, left: "50%",
          transform: "translateX(-50%)",
          zIndex: 32,
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 12px",
          borderRadius: 20,
          background: `rgba(0,0,0,0.7)`,
          border: `1px solid ${accent}`,
          backdropFilter: "blur(8px)",
          fontFamily: "monospace", fontSize: 10,
          letterSpacing: "0.18em",
          color: accent,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          animation: "wakeTextPulse 0.9s ease-in-out infinite",
        }}>
          <span style={{ fontSize: 7, lineHeight: 1 }}>●</span>
          Wake — listening
        </div>
      )}

      {/* Time badge */}
      <div style={{
        position: "absolute", top: 10, right: 10, zIndex: 32,
        fontFamily: "monospace", fontSize: 10,
        color: "rgba(200,210,255,0.5)", letterSpacing: "0.08em",
        background: "rgba(0,0,0,0.2)", padding: "2px 6px", borderRadius: 6,
        pointerEvents: "none",
      }}>
        {TIME_CONFIG[timeOfDay].label}
      </div>

      {/* Area hint bubble */}
      {showHint && (
        <div style={{
          position: "absolute", top: "11%", left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          background: "rgba(8,8,15,0.9)",
          border: `1px solid ${accent}55`,
          borderRadius: 10, padding: "5px 10px",
          fontFamily: "monospace", fontSize: 11,
          color: accent,
          animation: "navifaceHint 3.2s ease-in-out forwards",
          pointerEvents: "none", zIndex: 25,
        }}>
          {hintText}
        </div>
      )}

      {/* Bond bar — flush to bottom now that nav bar is removed */}
      <div data-noclick="true" style={{
        position: "absolute", bottom: 4, left: 0, right: 0, zIndex: 30,
        background: "linear-gradient(to top,rgba(8,8,15,0.6) 0%,transparent 100%)",
        padding: "4px 12px 3px", pointerEvents: "none",
      }}>
        <div style={{ maxWidth: 384, margin: "0 auto", pointerEvents: "auto" }}>
          <BondDisplay bondXP={bondXP} />
        </div>
      </div>

      {/* ── CSS keyframe animations ── */}
      <style>{`
        @keyframes navifaceFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes navifaceBreathe {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.012); }
        }
        @keyframes navifaceGlowPulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 0.85; }
        }
        @keyframes navifaceRing {
          0%, 100% { transform: scale(1) rotate(0deg);   opacity: 0.50; }
          50%       { transform: scale(1.03) rotate(1deg); opacity: 0.75; }
        }
        @keyframes navifaceHint {
          0%   { opacity: 0; transform: translateX(-50%) translateY(5px); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(0px); }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
        /* ── New engagement animations ── */
        @keyframes sparkShoot {
          0%   { opacity: 1;   transform: translate(-50%, -90px)  scale(1.3); }
          65%  { opacity: 0.6; }
          100% { opacity: 0;   transform: translate(-50%, -148px) scale(0);   }
        }
        @keyframes waveExpand {
          0%   { opacity: 0.7; transform: scale(0.94); }
          100% { opacity: 0;   transform: scale(1.12); }
        }
        @keyframes starTwinkle {
          0%, 87%, 100% { opacity: 1;    }
          92%           { opacity: 0.04; }
        }
        @keyframes thoughtFloat {
          0%, 100% { transform: translateX(-50%) translateY(0px);  }
          50%      { transform: translateX(-50%) translateY(-5px);  }
        }
        @keyframes thoughtBubble {
          0%, 100% { opacity: 0.22; transform: scale(1);    }
          50%      { opacity: 0.90; transform: scale(1.28); }
        }
        @keyframes orbPoke {
          0%   { transform: scale(1);    }
          22%  { transform: scale(0.90); }
          62%  { transform: scale(1.06); }
          100% { transform: scale(1);    }
        }
        @keyframes wakeRingPulse {
          0%, 100% { opacity: 0.9; transform: scale(1);    }
          50%      { opacity: 0.2; transform: scale(1.05); }
        }
        @keyframes wakeTextPulse {
          0%, 100% { opacity: 1;   }
          50%      { opacity: 0.4; }
        }
        /* ── Energy orb animations ── */
        @keyframes orbCloudA {
          0%   { transform: translate(0%,0%)   rotate(0deg);   }
          33%  { transform: translate(-8%,6%)  rotate(120deg); }
          66%  { transform: translate(6%,-5%)  rotate(240deg); }
          100% { transform: translate(0%,0%)   rotate(360deg); }
        }
        @keyframes orbCloudB {
          0%   { transform: translate(0%,0%)   rotate(0deg);    }
          50%  { transform: translate(10%,-8%) rotate(-180deg); }
          100% { transform: translate(0%,0%)   rotate(-360deg); }
        }
        @keyframes orbPulseCore {
          0%,100% { opacity: 0.75; transform: scale(0.92); }
          50%     { opacity: 1.00; transform: scale(1.08); }
        }
        @keyframes orbRipple {
          0%,100% { opacity: 0.4; transform: scale(1);    }
          50%     { opacity: 0.8; transform: scale(1.12); }
        }
        @keyframes orbParticleDrift {
          0%   { transform: translate(0px,0px)   scale(1);   }
          25%  { transform: translate(7px,-10px) scale(1.3); }
          50%  { transform: translate(-5px,8px)  scale(0.7); }
          75%  { transform: translate(10px,5px)  scale(1.1); }
          100% { transform: translate(0px,0px)   scale(1);   }
        }
        /* ── Orbit ring & aura animations ── */
        @keyframes orbitRingRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbitHaloPulse {
          0%, 100% { opacity: 0.55; transform: scale(1);    }
          50%      { opacity: 0.88; transform: scale(1.04); }
        }
        @keyframes listenRipple {
          0%   { opacity: 0.7;  transform: scale(0.92); }
          70%  { opacity: 0.15; transform: scale(1.14); }
          100% { opacity: 0;    transform: scale(1.18); }
        }
      `}</style>
    </div>
  );
}
