"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Mood } from "@/components/Pet";
import NaviFace from "@/components/NaviFace";
import NaviOrb from "@/components/NaviOrb";
import { EVOLUTION_STAGES } from "@/components/Pet";
import NameSetup from "@/components/NameSetup";
import ActionCard, { ReminderAlert } from "@/components/ActionCard";
// Heavy tool-panel components — lazy-loaded so they don't bloat the initial bundle.
// Each is only mounted when the user actually opens it, so ssr: false is correct.
const ResumeBuilder        = dynamic(() => import("@/components/ResumeBuilder"),        { ssr: false });
const BusinessPlanBuilder  = dynamic(() => import("@/components/BusinessPlanBuilder"),  { ssr: false });
const LocalResourceFinder  = dynamic(() => import("@/components/LocalResourceFinder"),  { ssr: false });
const HomeworkHelper       = dynamic(() => import("@/components/HomeworkHelper"),        { ssr: false });
const CosmicBackground     = dynamic(() => import("@/components/CosmicBackground"),     { ssr: false });
const HousingPanel         = dynamic(() => import("@/components/HousingPanel"),         { ssr: false });
const HousingHubPanel      = dynamic(() => import("@/components/HousingHubPanel"),      { ssr: false });
const StemPanel            = dynamic(() => import("@/components/StemPanel"),            { ssr: false });
const AiSkillsPanel        = dynamic(() => import("@/components/AiSkillsPanel"),        { ssr: false });
const ProgramIntroOverlay  = dynamic(() => import("@/components/ProgramIntroOverlay"),  { ssr: false });
const SubscriptionPanel    = dynamic(() => import("@/components/SubscriptionPanel"),    { ssr: false });
const ProGateOverlay       = dynamic(() => import("@/components/ProGateOverlay"),       { ssr: false });
const SpringerIntroOverlay    = dynamic(() => import("@/components/SpringerIntroOverlay"),    { ssr: false });
const ClientOnboardingPanel   = dynamic(() => import("@/components/ClientOnboardingPanel"),   { ssr: false });
const FamilySupportFinder     = dynamic(() => import("@/components/FamilySupportFinder"),     { ssr: false });
const LegalRightsPanel        = dynamic(() => import("@/components/LegalRightsPanel"),        { ssr: false });
const LogoGeneratorPanel      = dynamic(() => import("@/components/LogoGeneratorPanel"),      { ssr: false });
const SystemHealthPanel       = dynamic(() => import("@/components/SystemHealthPanel"),       { ssr: false });
const PodcastPanel            = dynamic(() => import("@/components/PodcastPanel"),            { ssr: false });
const LuckyModePanel          = dynamic(() => import("@/components/LuckyModePanel"),          { ssr: false });
const HandsFreeBar            = dynamic(() => import("@/components/HandsFreeBar"),            { ssr: false });
const AdminDashboardPanel     = dynamic(() => import("@/components/AdminDashboardPanel"),     { ssr: false });
const MyBusinessIntro         = dynamic(() => import("@/components/MyBusinessIntro"),         { ssr: false });
const AutoFinderPanel         = dynamic(() => import("@/components/AutoFinderPanel"),         { ssr: false });
const JobFinderPanel          = dynamic(() => import("@/components/JobFinderPanel"),          { ssr: false });
const BlackHistoryPanel       = dynamic(() => import("@/components/BlackHistoryPanel"),       { ssr: false });
import AchievementDock from "@/components/AchievementDock";
import NaviIntro from "@/components/NaviIntro";
import ServiceErrorBoundary from "@/components/ServiceErrorBoundary";
import DiagnosticProvider from "@/components/DiagnosticProvider";
import type { AgentAction, NavigateDestination } from "@/lib/actions";
import { matchServiceRoute } from "@/lib/voiceNav";
import { playTabSwitch, playConfirm, playNaviResponse } from "@/lib/sounds";
import { EMAIL_RECEIVER } from "@/lib/emailConfig";
import { supabase } from "@/lib/supabase";
import { track } from "@vercel/analytics";
import {
  Message,
  Reminder,
  ProgressEntry,
  MentorMode,
  AppMode,
  loadState,
  saveState,
  getBondLevel,
  getBondProgress,
  BOND_NAMES,
  BOND_THRESHOLDS,
  getXPForMessage,
} from "@/lib/storage";
import {
  DailyMission,
  GamifState,
  LEVEL_REWARDS,
  LevelReward,
  XP_EARN_METHODS,
  generateDailyMissions,
  advanceMissions,
  completeMission,
  getXpLevel,
  getXpLevelThreshold,
  getXpLevelProgress,
  getXpLevelTitle,
  getRewardForLevel,
} from "@/lib/gamification";

const CHECK_IN_THRESHOLD_MS = 8 * 60 * 60 * 1000; // 8 hours between check-ins
const ADMIN_PASSCODE = "chaz_admin"; // Founder passcode — grants full voice access

// ── NAVI purpose trigger ──────────────────────────────────────────────────────
const PURPOSE_RE = /\b(why\s+(were?|are)\s+(you|navi)\s*(created|made|built|designed)|(what('?s|\s+is)\s+)?(your|navi'?s?)\s+purpose|why\s+(do\s+you|does\s+navi)\s+exist)\b/i;

const NAVI_PURPOSE_RESPONSE = `I was created to uplift underserved communities by providing real guidance, real tools, and real opportunities through one conversation.

I combine practical support with edutaining content that shares real stories and connects people to resources that can help them move forward.

Through my partnerships with Springer Industries and the Cherry Tree Foundation network, I'm designed to bridge the gap between technology and real-world access.

And I'm just the beginning — one of many systems being developed to empower people, streamline opportunity, and build a smarter, more connected future.`;

// ── Greeting helpers ──────────────────────────────────────────────────────────
function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildGreeting(userName: string): string {
  const hour = new Date().getHours();
  const name = userName ? `, ${userName}` : "";

  let salutation: string;
  if (hour >= 5 && hour < 12) {
    salutation = "Good morning";
  } else if (hour >= 12 && hour < 17) {
    salutation = "Good afternoon";
  } else if (hour >= 17 && hour < 22) {
    salutation = "Good evening";
  } else {
    salutation = pickRandom(["Hey, you're up late", "Still awake", "Burning the midnight oil"]);
  }

  const prompts = [
    "What can I help you with today?",
    "What are we working on?",
    "How can I assist you?",
    "Ready to get something done?",
    "What's on your mind?",
    "I'm here whenever you're ready.",
  ] as const;

  return `${salutation}${name}! ${pickRandom(prompts)}`;
}

function buildCheckInMessage(userName: string, petName: string, absenceMs: number): string {
  const name = userName ? `, ${userName}` : "";
  const hours = Math.floor(absenceMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days >= 7) {
    return `${petName} here! It's been ${days} whole days... I kept checking the door for you. So glad you're back${name}! How have you been?`;
  }
  if (days >= 3) {
    return `Hey${name}! ${days} days is a long time — I missed you! What have you been up to? Ready to pick up where we left off?`;
  }
  if (days >= 1) {
    const label = days === 1 ? "a day" : `${days} days`;
    return `Welcome back${name}! It's been about ${label} since we last talked. I'm happy you're here — what's on your mind?`;
  }
  return `Hey${name}! It's been ${hours} hour${hours !== 1 ? "s" : ""} since we last chatted. Good to see you again!`;
}

const APP_MODES: { id: AppMode; label: string; icon: string }[] = [
  { id: "companion", label: "Companion",     icon: "🤝" },
  { id: "lawyer",    label: "Lawyer",        icon: "⚖️" },
  { id: "job",       label: "Job Finder",    icon: "💼" },
  { id: "history",   label: "Black History", icon: "✊" },
  { id: "housing",   label: "Housing",       icon: "🏠" },
  { id: "stem",      label: "STEM Explorer", icon: "🔬" },
  { id: "ai_skills", label: "AI Skills",     icon: "⚡" },
];

// Area → suggested appMode (Home=0, School=1, Playground=2)
const AREA_MODE_SUGGESTION: Record<number, AppMode> = {
  0: "companion",
  1: "history",
  2: "job",
};

// ── CherryTree Network partners ───────────────────────────────────────────────
const PARTNERS = [
  {
    name: "PNC Bank",
    desc: "Supporting financial growth and access to banking resources for the community.",
    icon: "🏦",
    color: "#f59e0b",
    url: "https://www.pnc.com",
  },
  {
    name: "Excite Credit Union",
    desc: "Providing community-focused financial services and opportunities for economic empowerment.",
    icon: "💳",
    color: "#00d4ff",
  },
  {
    name: "Askarii Shop",
    desc: "A community-driven brand focused on culture, creativity, and local entrepreneurship.",
    icon: "🛍",
    color: "#f472b6",
  },
  {
    name: "Smoke Life Smoke Shop",
    desc: "A lifestyle brand supporting community engagement, culture, and everyday needs.",
    icon: "🌿",
    color: "#4ade80",
  },
  {
    name: "Kairos Empowerment Center",
    desc: "A community-focused organization dedicated to empowerment, personal development, and providing resources that uplift individuals and families.",
    icon: "🌟",
    color: "#a855f7",
    url: "https://kairosempowermentcenter.com/",
  },
];

// ── Live opportunity banner messages ─────────────────────────────────────────
const BANNER_MESSAGES = [
  { icon: "🚀", text: "New Job Opportunities Available Near You" },
  { icon: "💼", text: "Local Businesses Hiring This Week" },
  { icon: "🏠", text: "Affordable Housing Resources Updated" },
  { icon: "📈", text: "Build Your Resume with NAVI Today" },
  { icon: "🔥", text: "New Features Being Added Daily — Stay Tuned" },
  { icon: "⚖️", text: "Free Legal Help Available in Your Area" },
  { icon: "✊", text: "Community Programs & Events Near You" },
  { icon: "💡", text: "Ask NAVI Anything — Real Help, Real Fast" },
];

const MODES: { id: MentorMode; label: string; icon: string; placeholder: string; emptyHint: string }[] = [
  {
    id: "chat",
    label: "Chat",
    icon: "💬",
    placeholder: "Say something to NAVI...",
    emptyHint: "Say something to start a conversation.\nBond grows with every exchange.",
  },
  {
    id: "learning",
    label: "Learn",
    icon: "📚",
    placeholder: "Ask me anything — math, science, reading...",
    emptyHint: "Ask me a school question!\nI'll walk you through it step by step.",
  },
  {
    id: "mentor",
    label: "Mentor",
    icon: "⭐",
    placeholder: "What's on your mind?",
    emptyHint: "Tell me what's going on.\nI'm here to listen and help.",
  },
];

const RECENT_WINDOW_MS = 90_000; // 90 seconds for "excited"
const BORED_THRESHOLD_MS = 8 * 60 * 1000; // 8 minutes idle → bored
const HISTORY_WINDOW = 20; // last 10 exchanges sent as context

// ── Wake word + voice commands ────────────────────────────────────────────────
type VoiceCommand =
  | { action: "mode"; value: AppMode }
  | { action: "tab";  value: string  };

const VOICE_COMMANDS: { patterns: string[]; value: AppMode }[] = [
  { patterns: ["job mode", "job finder", "find a job", "help me find a job", "looking for a job", "job search", "job"], value: "job" },
  { patterns: ["lawyer mode", "lawyer", "legal mode", "legal help", "legal advice", "legal"], value: "lawyer" },
  { patterns: ["black history", "history mode", "history", "learn history"], value: "history" },
  { patterns: ["companion mode", "companion", "chat mode", "just chat", "hang out", "friend"], value: "companion" },
  { patterns: ["housing mode", "affordable housing", "find housing", "find an apartment", "rent help", "rental help", "housing"], value: "housing" },
  { patterns: ["stem mode", "stem", "science", "technology mode", "engineering", "coding mode", "learn ai", "learn coding", "learn tech"], value: "stem" },
  { patterns: ["ai skills", "ai skills mode", "adult stem", "skills mode", "skill mode", "learn ai skills", "ai coaching"], value: "ai_skills" },
];

// Tab-level voice commands — open specific tools directly (checked before mode commands)
const TAB_VOICE_COMMANDS: { patterns: string[]; value: string }[] = [
  { patterns: ["housing finder", "affordable home finder", "open housing finder", "open affordable housing finder", "home finder"], value: "housingFinder" },
  { patterns: ["stem lab", "open stem lab", "stem lesson", "open stem lesson"], value: "stemLesson" },
  { patterns: ["ai skills lab", "open ai skills lab", "skills lab", "open skills lab"], value: "aiSkillsLesson" },
];

function parseVoiceCommand(text: string): VoiceCommand | null {
  const lower = text.toLowerCase().trim();
  // Tab commands are more specific — check first to avoid false mode matches
  for (const { patterns, value } of TAB_VOICE_COMMANDS) {
    if (patterns.some((p) => lower.includes(p))) {
      return { action: "tab", value };
    }
  }
  for (const { patterns, value } of VOICE_COMMANDS) {
    if (patterns.some((p) => lower.includes(p))) {
      return { action: "mode", value };
    }
  }
  return null;
}

function computeMood(
  lastInteractionTime: number,
  recentMessageTimes: number[]
): Mood {
  if (!lastInteractionTime) return "bored";
  const now = Date.now();
  const idle = now - lastInteractionTime;
  if (idle > BORED_THRESHOLD_MS) return "bored";
  const recentCount = recentMessageTimes.filter(
    (t) => now - t < RECENT_WINDOW_MS
  ).length;
  if (recentCount >= 4) return "excited";
  return "happy";
}

// ── Speech Recognition hook ──────────────────────────────────────────────────
type SpeechStatus = "idle" | "listening";
type MicPhase = "dormant" | "activating" | "ready" | "active" | "denied";

// Continuous voice listening: auto-starts, restarts after each utterance,
// pauses while NAVI is speaking/loading to avoid capturing its output.
function useContinuousSpeech(
  onResult: (text: string) => void,
  blocked: boolean,   // true while NAVI is loading or speaking
  onDenied?: () => void,  // called when mic permission is denied
) {
  const SpeechRecognitionClass = useMemo(() => {
    if (typeof window === "undefined") return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }, []);

  const supported    = !!SpeechRecognitionClass;
  // Start off — only auto-enable if browser has already granted permission.
  // Never request mic on page load; user must tap the mic button first.
  const [micEnabled, setMicEnabled] = useState(false);
  const [status,     setStatus]     = useState<SpeechStatus>("idle");

  // Mutable refs — read inside async callbacks without stale closures
  const micEnabledRef = useRef(false);
  const blockedRef    = useRef(blocked);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef      = useRef<any>(null);
  const runningRef    = useRef(false);
  const restartTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onResultRef   = useRef(onResult);
  const onDeniedRef   = useRef(onDenied);
  // Forward-ref so onend/onerror callbacks always see the latest startSession
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startRef      = useRef<() => void>(() => {});

  // Keep onResultRef / onDeniedRef current every render
  useEffect(() => { onResultRef.current = onResult; });
  useEffect(() => { onDeniedRef.current = onDenied; });

  // Core: start one recognition session (restarts itself via onend)
  const startSession = useCallback(() => {
    if (!SpeechRecognitionClass) return;
    if (runningRef.current)        return; // already active
    if (!micEnabledRef.current)    return; // user disabled mic
    if (blockedRef.current)        return; // NAVI is speaking/loading

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new (SpeechRecognitionClass as any)();
    rec.lang            = navigator.language || "en-US";
    rec.interimResults  = false;
    rec.maxAlternatives = 1;
    rec.continuous      = false; // fire onend after each natural pause → we restart

    rec.onstart = () => {
      runningRef.current = true;
      setStatus("listening");
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const text = (e.results[0]?.[0]?.transcript ?? "").trim();
      if (text) onResultRef.current(text);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      runningRef.current = false;
      recogRef.current   = null;
      setStatus("idle");
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        // Permission denied — disable permanently and notify parent
        micEnabledRef.current = false;
        setMicEnabled(false);
        onDeniedRef.current?.();
      } else if (micEnabledRef.current && !blockedRef.current) {
        // Recoverable (no-speech, audio-capture, etc.) — retry after brief pause
        restartTimer.current = setTimeout(() => startRef.current(), 500);
      }
    };

    rec.onend = () => {
      runningRef.current = false;
      recogRef.current   = null;
      setStatus("idle");
      // Auto-restart only when user hasn't disabled and NAVI isn't active
      if (micEnabledRef.current && !blockedRef.current) {
        restartTimer.current = setTimeout(() => startRef.current(), 180);
      }
    };

    recogRef.current = rec;
    try {
      rec.start();
    } catch {
      runningRef.current = false;
      recogRef.current   = null;
    }
  }, [SpeechRecognitionClass]); // SpeechRecognitionClass is stable

  // Always expose the latest startSession via ref (avoids stale callbacks in onend/onerror)
  useEffect(() => { startRef.current = startSession; });

  // ── Mount: auto-enable only if permission is already granted ────────────
  // Never triggers a browser popup — that only happens when the user taps
  // the mic button (toggleMic → startSession → new SpeechRecognition().start()).
  useEffect(() => {
    if (!SpeechRecognitionClass) return;
    // Mic stays OFF by default — user must tap the mic button to start listening.
    // We no longer auto-enable even if permission was previously granted.
    return () => {
      clearTimeout(restartTimer.current!);
      try { recogRef.current?.stop(); } catch { /* ignore */ }
      runningRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── React to blocked state changes ───────────────────────────────────────
  useEffect(() => {
    blockedRef.current = blocked;
    if (blocked) {
      // Stop listening while NAVI speaks / API is loading
      clearTimeout(restartTimer.current!);
      if (runningRef.current) {
        try { recogRef.current?.stop(); } catch { /* ignore */ }
        // onend fires → blockedRef.current is already true → no restart
      }
    } else if (micEnabledRef.current && !runningRef.current) {
      // Unblocked — resume listening after short grace period
      restartTimer.current = setTimeout(() => startRef.current(), 280);
    }
  }, [blocked]);

  // ── Toggle mic on/off ────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    setMicEnabled((prev) => {
      const next = !prev;
      micEnabledRef.current = next;
      if (!next) {
        clearTimeout(restartTimer.current!);
        try { recogRef.current?.stop(); } catch { /* ignore */ }
        recogRef.current   = null;
        runningRef.current = false;
        setStatus("idle");
      } else if (!blockedRef.current) {
        restartTimer.current = setTimeout(() => startRef.current(), 150);
      }
      return next;
    });
  }, []);

  return { status, supported, micEnabled, toggleMic };
}

// ── Audio autoplay unlock ────────────────────────────────────────────────────
// Browsers (especially Safari/iOS) block programmatic audio.play() unless the
// AudioContext has been resumed inside a synchronous user-gesture callback.
// Call unlockAudio() at the very start of any user-initiated action (send,
// keydown, voice result) BEFORE the first await so the context is warm by the
// time we try to play audio after an API round-trip.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _audioCtx: any = null;
function unlockAudio(): void {
  if (typeof window === "undefined") return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return;
    if (!_audioCtx) _audioCtx = new Ctor();
    const ctx = _audioCtx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    // Play a 1-sample silent buffer — this is the "user-gesture touch"
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch { /* some devices don't support AudioContext */ }
}

// ── Text-to-Speech hook (ElevenLabs via /api/tts) ────────────────────────────
// Queue-based: speak() enqueues if audio is already playing.
// Prefetch: while item N plays, item N+1 is fetched concurrently.
// cancel() stops playback, clears queue, aborts any prefetch.
type TTSItem = { text: string; onStart?: () => void; onEnd?: () => void };
type PrefetchState = { text: string; blobUrl: string | null; done: boolean; cancelled: boolean };

function useTTS() {
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const queueRef    = useRef<TTSItem[]>([]);
  const busyRef     = useRef(false);
  const prefetchRef = useRef<PrefetchState | null>(null);
  // Forward ref so playItem can call playNext without a circular dep
  const playNextRef = useRef<() => void>(() => {});

  // Unlock audio on first user interaction — covers passive-scroll contexts
  // where sendMessage may not have fired yet (e.g., greeting autoplay).
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      document.removeEventListener("click",      unlock);
      document.removeEventListener("keydown",    unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click",      unlock, { once: true, passive: true });
    document.addEventListener("keydown",    unlock, { once: true, passive: true });
    document.addEventListener("touchstart", unlock, { once: true, passive: true });
    return () => {
      document.removeEventListener("click",      unlock);
      document.removeEventListener("keydown",    unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, []);

  const cancelPrefetch = useCallback(() => {
    if (prefetchRef.current) {
      prefetchRef.current.cancelled = true;
      if (prefetchRef.current.blobUrl) {
        try { URL.revokeObjectURL(prefetchRef.current.blobUrl); } catch { /* ignore */ }
      }
      prefetchRef.current = null;
    }
  }, []);

  const playItem = useCallback(async ({ text, onStart, onEnd }: TTSItem) => {
    const clean = text.replace(/[#*_`]/g, "").trim();
    if (!clean) { onEnd?.(); playNextRef.current(); return; }

    busyRef.current = true;

    // Use prefetched blob URL if it's ready for this exact text
    let blobUrl: string | null = null;
    const pref = prefetchRef.current;
    if (pref && pref.text === clean && pref.done && pref.blobUrl && !pref.cancelled) {
      console.log("[NAVI Voice] Using prefetched audio");
      blobUrl = pref.blobUrl;
      prefetchRef.current = null;
    } else if (pref && !pref.cancelled) {
      cancelPrefetch(); // stale / different text
    }

    try {
      if (!blobUrl) {
        console.log("[NAVI Voice] Generating speech:", clean.slice(0, 60) + (clean.length > 60 ? "…" : ""));
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean }),
        });
        if (!res.ok) {
          console.error("[NAVI Voice] TTS API error:", res.status);
          onEnd?.();
          busyRef.current = false;
          playNextRef.current();
          return;
        }
        const blob = await res.blob();
        console.log("[NAVI Voice] Audio received:", blob.size, "bytes");
        blobUrl = URL.createObjectURL(blob);
      }

      const audio  = new Audio(blobUrl);
      const savedUrl = blobUrl;
      audioRef.current = audio;

      audio.onplay = () => {
        console.log("[NAVI Voice] Playing audio");
        onStart?.();
        // Prefetch next queued item while this one plays
        if (queueRef.current.length > 0 && !prefetchRef.current) {
          const nextClean = queueRef.current[0].text.replace(/[#*_`]/g, "").trim();
          if (nextClean) {
            const p: PrefetchState = { text: nextClean, blobUrl: null, done: false, cancelled: false };
            prefetchRef.current = p;
            fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: nextClean }),
            })
              .then((r) => r.ok ? r.blob() : Promise.reject(new Error("tts")))
              .then((b) => { if (!p.cancelled) p.blobUrl = URL.createObjectURL(b); })
              .catch(() => { /* prefetch failed — playItem will fetch fresh */ })
              .finally(() => { if (!p.cancelled) p.done = true; });
          }
        }
      };

      const cleanup = () => {
        console.log("[NAVI Voice] Audio ended");
        onEnd?.();
        try { URL.revokeObjectURL(savedUrl); } catch { /* ignore */ }
        if (audioRef.current === audio) audioRef.current = null;
        busyRef.current = false;
        playNextRef.current();
      };
      audio.onended = cleanup;
      audio.onerror = (e) => {
        console.error("[NAVI Voice] Audio error event:", (audio.error?.message) ?? e);
        cleanup();
      };

      // ── Attempt playback with one retry for autoplay-policy rejections ─────
      try {
        await audio.play();
      } catch (playErr) {
        console.warn("[NAVI Voice] Voice failed — retrying", playErr);
        await new Promise((r) => setTimeout(r, 150));
        try {
          await audio.play();
        } catch (retryErr) {
          console.error("[NAVI Voice] Playback failed after retry:", retryErr);
          onEnd?.(); // ensure isSpeaking is reset even if audio never played
          try { URL.revokeObjectURL(savedUrl); } catch { /* ignore */ }
          if (audioRef.current === audio) audioRef.current = null;
          busyRef.current = false;
          playNextRef.current();
        }
      }
    } catch (err) {
      console.error("[NAVI Voice] TTS flow error:", err);
      if (blobUrl) { try { URL.revokeObjectURL(blobUrl); } catch { /* ignore */ } }
      onEnd?.(); // always reset isSpeaking
      busyRef.current = false;
      playNextRef.current();
    }
  }, [cancelPrefetch]);

  // Keep playNextRef always-current (playItem is stable so this runs once)
  playNextRef.current = useCallback(() => {
    const next = queueRef.current.shift();
    if (next) playItem(next);
  }, [playItem]);

  // Public: enqueue if busy, play immediately if idle
  const speak = useCallback((text: string, onStart?: () => void, onEnd?: () => void) => {
    if (busyRef.current) {
      queueRef.current.push({ text, onStart, onEnd });
      return;
    }
    playItem({ text, onStart, onEnd });
  }, [playItem]);

  // Public: interrupt current audio, clear queue, abort prefetch
  const cancel = useCallback(() => {
    queueRef.current = [];
    cancelPrefetch();
    if (audioRef.current) {
      audioRef.current.pause();
      try { URL.revokeObjectURL(audioRef.current.src); } catch { /* ignore */ }
      audioRef.current = null;
    }
    busyRef.current = false;
  }, [cancelPrefetch]);

  return { supported: true, speak, cancel };
}

// ── Nav confirmation patterns ─────────────────────────────────────────────────
const NAV_CONFIRM_RE = /^(yes|yeah|yep|yup|ok|okay|sure|go|go ahead|go now|take me there|take me|let's go|let's do it|do it|proceed|absolutely|definitely|of course|sounds good|perfect|alright)\b/i;
const NAV_REJECT_RE  = /^(no|nope|not yet|not now|cancel|stay|never mind|nevermind|nah|later|skip|don't|stop)\b/i;

// ── TTS helpers ───────────────────────────────────────────────────────────────

/**
 * Splits a long TTS string into sentence-sized chunks so the first chunk
 * (short) fetches quickly and plays while the rest are prefetched in parallel.
 * Texts ≤ 160 chars are returned as-is.
 */
function splitForTTS(text: string): string[] {
  const clean = text
    .replace(/[#*_`~]/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return [];
  if (clean.length <= 160) return [clean];

  // Match sentence-ending segments: everything up to .!? + optional trailing space
  const sentences = clean.match(/[^.!?]*[.!?]+["']?\s*/g);
  if (!sentences || sentences.length <= 1) return [clean];

  const chunks: string[] = [];
  let buf = "";
  for (const s of sentences) {
    buf += s;
    if (buf.trim().length >= 60) {
      chunks.push(buf.trim());
      buf = "";
    }
  }
  if (buf.trim()) {
    if (chunks.length > 0) chunks[chunks.length - 1] += " " + buf.trim();
    else chunks.push(buf.trim());
  }
  return chunks.length > 0 ? chunks : [clean];
}

/** Enqueues split TTS chunks; onStart fires on first, onEnd fires on last. */
function speakChunks(
  chunks: string[],
  speak: (t: string, s?: () => void, e?: () => void) => void,
  onStart?: () => void,
  onEnd?: () => void,
) {
  if (chunks.length === 0) { onEnd?.(); return; }
  if (chunks.length === 1) { speak(chunks[0], onStart, onEnd); return; }
  speak(chunks[0], onStart, undefined);
  for (let i = 1; i < chunks.length - 1; i++) speak(chunks[i]);
  speak(chunks[chunks.length - 1], undefined, onEnd);
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [showNameSetup, setShowNameSetup] = useState(false);
  const [userName, setUserName] = useState("");
  const [petName, setPetName] = useState("NAVI");
  const [bondXP, setBondXP] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mood, setMood] = useState<Mood>("bored");
  const [lastInteractionTime, setLastInteractionTime] = useState(0);
  const [recentTimes, setRecentTimes] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mentorMode, setMentorMode] = useState<MentorMode>("chat");
  const [appMode, setAppMode] = useState<AppMode>("companion");
  const [worldAreaIdx, setWorldAreaIdx] = useState(0);
  const [autoClear, setAutoClear] = useState(false);
  const [showResumeBuilder, setShowResumeBuilder] = useState(false);
  const [showBizPlanBuilder, setShowBizPlanBuilder] = useState(false);
  const [showLocalResources, setShowLocalResources]     = useState(false);
  const [showHomeworkHelper, setShowHomeworkHelper]     = useState(false);
  const [showFamilySupport,  setShowFamilySupport]      = useState(false);
  const [showLegalRights,   setShowLegalRights]         = useState(false);
  const [legalRightsSeenRef] = useState(() => ({ current: false }));
  const [showSystemHealth,  setShowSystemHealth]        = useState(false);
  const [showAdminDash,     setShowAdminDash]            = useState(false);
  const [showBusinessIntro, setShowBusinessIntro]       = useState(false);
  const [showAutoFinder,    setShowAutoFinder]          = useState(false);
  const [showMissionsOpen,  setShowMissionsOpen]        = useState(false);
  const [showJobFinder,     setShowJobFinder]           = useState(false);
  const [showBlackHistory,  setShowBlackHistory]        = useState(false);
  const [showLuckyMode,     setShowLuckyMode]           = useState(false);
  const [isLoggedIn,        setIsLoggedIn]              = useState(false);
  const [accessCode,        setAccessCode]              = useState("");
  const [codeStatus,        setCodeStatus]              = useState<"idle" | "loading" | "success" | "error">("idle");
  const [codeMessage,       setCodeMessage]             = useState("");
  const [authUserId,        setAuthUserId]              = useState<string | null>(null);
  const [showHousingPanel,  setShowHousingPanel]   = useState(false);
  const [showHousingHub,    setShowHousingHub]     = useState(false);
  const [showStemPanel,     setShowStemPanel]      = useState(false);
  const [showAiSkillsPanel, setShowAiSkillsPanel]  = useState(false);
  const [programIntro,      setProgramIntro]       = useState<"stem"|"ai_skills"|null>(null);
  const [micPhase, setMicPhase] = useState<MicPhase>("dormant");
  const micPhaseRef   = useRef<MicPhase>("dormant");
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAppModeRef = useRef<AppMode | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [progressLog, setProgressLog] = useState<ProgressEntry[]>([]);
  const [dueReminder, setDueReminder] = useState<Reminder | null>(null);
  const [lastCheckInAt, setLastCheckInAt] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFullChat, setShowFullChat] = useState(false);
  const [transcriptFading, setTranscriptFading] = useState(false);
  const transcriptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [hubTab, setHubTab] = useState<"home" | "settings" | "explore" | "partners" | "truth" | "rewards" | "subscription" | "programs" | "founders" | "podcast">("home");
  const [isPro, setIsPro] = useState(false);
  const [proGateFeature, setProGateFeature] = useState<string | null>(null);
  const [showFoundersIntro, setShowFoundersIntro] = useState(false);
  const [foundersIntroSeen, setFoundersIntroSeen] = useState(false);
  const [onboardingService, setOnboardingService] = useState<{ icon: string; title: string; desc: string; subject: string } | null>(null);
  const [wakeActive, setWakeActive] = useState(false);
  const wakeActiveRef  = useRef(false);
  const wakeTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakRef       = useRef<(t: string, s?: () => void, e?: () => void) => void>(() => {});
  const voiceEnabledRef = useRef(false); // kept in sync below for use in sendMessage closure
  const cancelTTSRef      = useRef<() => void>(() => {}); // forward ref — wired after useTTS()
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const handsFreeModeRef = useRef(false);
  const panelVoiceHandlerRef = useRef<((text: string) => void) | null>(null);
  const showNavToastRef    = useRef<(label: string) => void>(() => {});
  const switchModeRef         = useRef<(mode: AppMode) => void>(() => {});
  const switchTabRef          = useRef<(tab: string) => void>(() => {});
  const openProgramPanelRef   = useRef<(mode: AppMode) => void>(() => {});
  const openWithIntroRef      = useRef<(mode: AppMode) => void>(() => {});
  const sendMessageRef     = useRef<(voiceText?: string) => void>(() => {});
  const dismissIntroRef    = useRef<() => void>(() => {});
  const [showIntro, setShowIntro] = useState(false);
  const showIntroRef       = useRef(false);
  const pendingIntroActionRef = useRef<(() => void) | null>(null);
  const [streak, setStreak] = useState(0);
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const missionsRef  = useRef<DailyMission[]>([]);
  const fromVoiceRef = useRef(false);
  const appModeRef   = useRef<AppMode>("companion");
  const [xpGain, setXpGain] = useState<number | null>(null);
  const xpToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bigXp, setBigXp] = useState<{ amount: number; mode: AppMode } | null>(null);
  const bigXpRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [navToast, setNavToast] = useState<string | null>(null);
  const navToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [switchingLabel, setSwitchingLabel] = useState<string | null>(null);
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 2-phase hub tab transition
  const [displayedHubTab, setDisplayedHubTab] = useState<"home" | "settings" | "explore" | "partners" | "truth" | "rewards" | "subscription" | "programs" | "founders" | "podcast">("home");
  const [hubTabPhase, setHubTabPhase] = useState<"idle" | "out" | "in">("idle");
  const hubTabTransTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mode label + NaviFace dim transition
  const [displayedAppMode, setDisplayedAppMode] = useState<AppMode>("companion");
  const [appModePhase, setAppModePhase] = useState<"idle" | "in">("idle");
  const appModeTransTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [naviFaceDim, setNaviFaceDim] = useState(false);
  const [pendingNav, setPendingNav] = useState<{ destination: NavigateDestination; label: string } | null>(null);
  const pendingNavRef = useRef<{ destination: NavigateDestination; label: string } | null>(null);
  const pendingNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredPartner, setHoveredPartner] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(false);
  const [purposeGlow, setPurposeGlow] = useState(false);
  const purposeGlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // AbortController: cancel stale in-flight chat requests on reset
  const abortControllerRef = useRef<AbortController | null>(null);
  // Slow-response indicator: shown when a request takes longer than 2 s
  const [extendedLoading, setExtendedLoading] = useState(false);
  const extendedLoadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [levelUpPopup, setLevelUpPopup] = useState<{ level: number; reward: LevelReward | null } | null>(null);
  const levelUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [unlockedRewardIds, setUnlockedRewardIds] = useState<string[]>([]);
  const prevXpLevelRef = useRef<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const isAdminRef = useRef(false);
  const isProRef   = useRef(false);        // kept in sync with isPro state each render
  const canUseVoiceRef = useRef<() => boolean>(() => false); // single source of truth for voice access
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [founderTapCount, setFounderTapCount] = useState(0);
  const founderTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [founderOrbPulse, setFounderOrbPulse] = useState(false);
  const founderOrbPulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [voiceConsentGiven, setVoiceConsentGiven] = useState(false);
  const [showVoiceConsent, setShowVoiceConsent] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    mimeType: string;
    content: string | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [evolving, setEvolving] = useState(false);
  const [evolutionNewStage, setEvolutionNewStage] = useState(0);
  const prevBondLevelRef = useRef<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const moodTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const state = loadState();
    setUserName(state.userName);
    setPetName(state.petName);
    setBondXP(state.bondXP);
    setLastInteractionTime(state.lastInteractionTime);
    if (state.mentorMode) setMentorMode(state.mentorMode);
    setReminders(state.reminders ?? []);
    setProgressLog(state.progressLog ?? []);
    setLastCheckInAt(state.lastCheckInAt ?? 0);

    // ── Daily check-in ────────────────────────────────────────────────────────
    const now = Date.now();
    const absence = now - state.lastInteractionTime;
    const timeSinceCheckIn = now - (state.lastCheckInAt ?? 0);
    const shouldCheckIn =
      state.userName &&                          // not a first visit
      state.lastInteractionTime > 0 &&           // has interacted before
      absence >= CHECK_IN_THRESHOLD_MS &&        // been away long enough
      timeSinceCheckIn >= CHECK_IN_THRESHOLD_MS; // no recent check-in

    let msgs = state.messages;
    if (shouldCheckIn) {
      const checkInMsg: Message = {
        id: `ci-${now}`,
        role: "pet",
        content: buildCheckInMessage(state.userName, state.petName, absence),
        timestamp: now,
      };
      msgs = [...state.messages, checkInMsg];
      setLastCheckInAt(now);
    }

    // ── Session greeting (once per session, yields to check-in if it fired) ──
    let greetingForTTS: string | null = null;
    if (state.userName && !shouldCheckIn) {
      try {
        const alreadyGreeted = sessionStorage.getItem("ai-pet-greeted") === "1";
        if (!alreadyGreeted) {
          const text = buildGreeting(state.userName);
          msgs = [...msgs, {
            id: `greet-${now}`,
            role: "pet" as const,
            content: text,
            timestamp: now,
          }];
          greetingForTTS = text;
          sessionStorage.setItem("ai-pet-greeted", "1");
        }
      } catch { /* sessionStorage unavailable in some contexts */ }
    }

    setMessages(msgs);
    if (!state.userName) setShowNameSetup(true);
    // restore admin status
    try {
      const admin = localStorage.getItem("ai-pet-admin") === "1";
      setIsAdmin(admin);
      isAdminRef.current = admin;
    } catch { /* ignore */ }
    // restore voice preference (only effective if admin)
    try {
      const v = localStorage.getItem("ai-pet-voice") === "1";
      const admin = localStorage.getItem("ai-pet-admin") === "1";
      const effective = admin && v;
      setVoiceEnabled(effective);
      voiceEnabledRef.current = effective;
    } catch { /* ignore */ }
    // restore PRO subscription status
    try {
      if (localStorage.getItem("ai-pet-pro") === "1") setIsPro(true);
    } catch { /* ignore */ }
    // restore voice consent flag
    try {
      if (localStorage.getItem("ai-pet-voice-consent") === "1") setVoiceConsentGiven(true);
    } catch { /* ignore */ }
    // restore founders intro seen flag
    try {
      if (localStorage.getItem("workWithUsIntroSeen") === "1") setFoundersIntroSeen(true);
    } catch { /* ignore */ }
    // ── Stripe success redirect: ?pro=success ─────────────────────────────────
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("pro") === "success") {
        setIsPro(true);
        localStorage.setItem("ai-pet-pro", "1");
        // Clean the URL so refreshing doesn't re-trigger
        window.history.replaceState({}, "", window.location.pathname);
        // Open hub menu to the subscription tab so the user sees the PRO badge
        setMenuOpen(true);
        setHubTab("subscription");
      }
    } catch { /* ignore */ }
    // restore sound preference (default: on)
    try {
      const raw = localStorage.getItem("ai-pet-sound");
      const s = raw === null ? true : raw === "1";
      setSoundEnabled(s);
      soundEnabledRef.current = s;
    } catch { /* ignore */ }
    // restore unlocked rewards
    try {
      const raw = localStorage.getItem("ai-pet-lvl-rewards");
      if (raw) setUnlockedRewardIds(JSON.parse(raw) as string[]);
    } catch { /* ignore */ }
    // seed prevXpLevelRef so first render doesn't trigger a false level-up popup
    prevXpLevelRef.current = getXpLevel(state.bondXP);

    // ── Gamification init ─────────────────────────────────────────────────────
    try {
      const today     = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      const raw = localStorage.getItem("ai-pet-gamif");
      const saved = raw ? (JSON.parse(raw) as GamifState) : null;

      // Compute streak
      let newStreak = 1;
      if (saved) {
        if (saved.lastActiveDate === today)      newStreak = saved.streak;
        else if (saved.lastActiveDate === yesterday) newStreak = saved.streak + 1;
        else                                     newStreak = 1;
      }

      // Load or generate today's missions
      let newMissions: DailyMission[] =
        saved?.missionDate === today ? saved.missions : generateDailyMissions(today);

      // Auto-complete streak mission on open (they showed up = streak maintained)
      newMissions = completeMission(newMissions, "streak");

      setStreak(newStreak);
      setMissions(newMissions);
      missionsRef.current = newMissions;

      localStorage.setItem("ai-pet-gamif", JSON.stringify({
        streak: newStreak,
        lastActiveDate: today,
        missions: newMissions,
        missionDate: today,
      } satisfies GamifState));
    } catch { /* ignore */ }

    // ── Greeting / intro ─────────────────────────────────────────────────────
    // Store greeting speech as a pending action; fire it after the cinematic
    // intro completes (or immediately if the intro is already used this session).
    if (greetingForTTS) {
      const textForTTS = greetingForTTS;
      pendingIntroActionRef.current = () => {
        setTimeout(() => {
          setMood("excited");
          if (canUseVoiceRef.current() && voiceEnabledRef.current) {
            speakRef.current(textForTTS, () => setIsSpeaking(true), () => setIsSpeaking(false));
          }
        }, 500);
      };
    }

    if (state.userName) {
      // Returning user — show cinematic intro once per browser session
      try {
        if (sessionStorage.getItem("ai-pet-intro-shown") !== "1") {
          sessionStorage.setItem("ai-pet-intro-shown", "1");
          showIntroRef.current = true;
          setShowIntro(true);
        } else {
          // Already shown this session — fire greeting immediately
          pendingIntroActionRef.current?.();
          pendingIntroActionRef.current = null;
        }
      } catch {
        // sessionStorage unavailable — fall back to immediate greeting
        pendingIntroActionRef.current?.();
        pendingIntroActionRef.current = null;
      }
    }

    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check Supabase auth for "My Business" tab visibility
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("[NAVI] Auth check:", session ? `logged in (${session.user.id})` : "not logged in", error?.message ?? "");
      setIsLoggedIn(!!session);
      setAuthUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[NAVI] Auth change:", event, session ? "logged in" : "logged out");
      setIsLoggedIn(!!session);
      setAuthUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Restore pending service after login redirect
  useEffect(() => {
    if (!isLoggedIn) return;
    try {
      const pending = localStorage.getItem("navi-pending-service");
      if (pending) {
        localStorage.removeItem("navi-pending-service");
        const svc = JSON.parse(pending);
        if (svc?.title) {
          setMenuOpen(true);
          setHubTab("founders");
          setTimeout(() => setOnboardingService(svc), 400);
        }
      }
    } catch { /* ignore */ }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auth-gated service selection — redirects to /login if not logged in
  const openServiceWithAuth = useCallback((svc: { icon: string; title: string; desc: string; subject: string }) => {
    if (isLoggedIn) {
      setOnboardingService(svc);
    } else {
      try { localStorage.setItem("navi-pending-service", JSON.stringify(svc)); } catch { /* ignore */ }
      window.location.href = "/login?redirect=onboarding";
    }
  }, [isLoggedIn]);

  // Redeem one-time access code
  const handleRedeemCode = useCallback(async () => {
    if (!accessCode.trim() || !authUserId) return;
    setCodeStatus("loading");
    setCodeMessage("");
    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode.trim(), user_id: authUserId }),
      });
      const json = await res.json();
      if (json.success) {
        setCodeStatus("success");
        setCodeMessage("Access unlocked \uD83C\uDF89");
        setAccessCode("");
      } else {
        setCodeStatus("error");
        setCodeMessage(json.error || "Invalid or already used code");
      }
    } catch {
      setCodeStatus("error");
      setCodeMessage("Something went wrong. Try again.");
    }
  }, [accessCode, authUserId]);

  // Persist to localStorage whenever key state changes
  useEffect(() => {
    if (!mounted) return;
    saveState({
      userName, petName, bondXP,
      messageCount: messages.length,
      lastInteractionTime, messages, mentorMode,
      reminders, progressLog, lastCheckInAt,
    });
  }, [mounted, userName, petName, bondXP, messages, lastInteractionTime, mentorMode, reminders, progressLog, lastCheckInAt]);

  // Keep refs in sync so sendMessage never reads stale missions/appMode
  useEffect(() => { missionsRef.current = missions; }, [missions]);
  useEffect(() => { appModeRef.current = appMode; }, [appMode]);

  // 2-phase hub tab transition: exit old → enter new
  useEffect(() => {
    if (!mounted || hubTab === displayedHubTab) return;
    if (soundEnabledRef.current) playTabSwitch();
    clearTimeout(hubTabTransTimerRef.current!);
    setHubTabPhase("out");
    hubTabTransTimerRef.current = setTimeout(() => {
      setDisplayedHubTab(hubTab);
      setHubTabPhase("in");
      hubTabTransTimerRef.current = setTimeout(() => setHubTabPhase("idle"), 380);
    }, 160);
  }, [hubTab, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset onboarding panel when hub closes
  useEffect(() => {
    if (!menuOpen) setOnboardingService(null);
  }, [menuOpen]);

  // Mode label slide-in + NaviFace scale-dim on mode change
  useEffect(() => {
    if (!mounted || appMode === displayedAppMode) return;
    if (soundEnabledRef.current) playTabSwitch();
    setNaviFaceDim(true);
    setDisplayedAppMode(appMode);
    setAppModePhase("in");
    clearTimeout(appModeTransTimerRef.current!);
    appModeTransTimerRef.current = setTimeout(() => {
      setNaviFaceDim(false);
      setAppModePhase("idle");
    }, 300);
    // Auto-open Legal Rights Guide the first time lawyer mode is entered per session
    if (appMode === "lawyer" && !legalRightsSeenRef.current) {
      legalRightsSeenRef.current = true;
      setTimeout(() => setShowLegalRights(true), 400);
    }
  }, [appMode, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist gamification state whenever it changes
  useEffect(() => {
    if (!mounted || missions.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      localStorage.setItem("ai-pet-gamif", JSON.stringify({
        streak,
        lastActiveDate: today,
        missions,
        missionDate: today,
      } satisfies GamifState));
    } catch { /* ignore */ }
  }, [mounted, streak, missions]);

  // ── Check for due reminders every 30 s ───────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const check = () => {
      const now = Date.now();
      const due = reminders.find((r) => r.scheduledAt <= now);
      if (due) {
        setDueReminder(due);
        setReminders((prev) => prev.filter((r) => r.id !== due.id));
      }
    };
    check(); // run immediately on mount
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [mounted, reminders]);

  // Recompute mood every 30 seconds and on interaction
  const refreshMood = useCallback(() => {
    setMood(computeMood(lastInteractionTime, recentTimes));
  }, [lastInteractionTime, recentTimes]);

  useEffect(() => {
    refreshMood();
    moodTimerRef.current = setInterval(refreshMood, 30_000);
    return () => {
      if (moodTimerRef.current) clearInterval(moodTimerRef.current);
    };
  }, [refreshMood]);

  // ── Evolution level-up detection ─────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const current = getBondLevel(bondXP);
    if (prevBondLevelRef.current !== null && current > prevBondLevelRef.current) {
      setEvolutionNewStage(current);
      setEvolving(true);
      setTimeout(() => setEvolving(false), 3200);
    }
    prevBondLevelRef.current = current;
  }, [bondXP, mounted]);

  // ── XP level-up detection (infinite level system, separate from bond bar) ──
  useEffect(() => {
    if (!mounted) return;
    const current = getXpLevel(bondXP);
    if (prevXpLevelRef.current !== null && current > prevXpLevelRef.current) {
      const reward = getRewardForLevel(current);
      setLevelUpPopup({ level: current, reward });
      clearTimeout(levelUpTimerRef.current!);
      levelUpTimerRef.current = setTimeout(() => setLevelUpPopup(null), 4800);
      if (reward) {
        setUnlockedRewardIds((prev) => {
          const next = Array.from(new Set([...prev, reward.id]));
          try { localStorage.setItem("ai-pet-lvl-rewards", JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      }
      if (soundEnabledRef.current) playConfirm();
    }
    prevXpLevelRef.current = current;
  }, [bondXP, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-clear on mode switch ─────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    if (prevAppModeRef.current === null) {
      prevAppModeRef.current = appMode;
      return;
    }
    if (autoClear && prevAppModeRef.current !== appMode) {
      setMessages([]);
      setErrorMsg(null);
    }
    prevAppModeRef.current = appMode;
  }, [appMode, autoClear, mounted]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Pre-load lazy tool panels as soon as the Hub menu opens so they render
  // instantly when the user taps a specific tool button.
  useEffect(() => {
    if (!menuOpen) return;
    import("@/components/ResumeBuilder");
    import("@/components/BusinessPlanBuilder");
    import("@/components/LocalResourceFinder");
    import("@/components/HomeworkHelper");
    import("@/components/FamilySupportFinder");
    import("@/components/LegalRightsPanel");
    import("@/components/LogoGeneratorPanel");
    import("@/components/LuckyModePanel");
  }, [menuOpen]);

  // Auto-fade transcript after 4 s of no new messages
  useEffect(() => {
    if (messages.length === 0) return;
    setTranscriptFading(false);
    if (transcriptTimerRef.current) clearTimeout(transcriptTimerRef.current);
    transcriptTimerRef.current = setTimeout(() => setTranscriptFading(true), 4000);
    return () => { if (transcriptTimerRef.current) clearTimeout(transcriptTimerRef.current); };
  }, [messages]);

  // Rotate opportunity banner every 5 s with a 0.5 s fade-out/in
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerVisible(false);
      setTimeout(() => {
        setBannerIdx((prev) => (prev + 1) % BANNER_MESSAGES.length);
        setBannerVisible(true);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleNameComplete = (name: string) => {
    setUserName(name);
    setShowNameSetup(false);

    // ── First-time onboarding — runs once, guarded by localStorage ────────────
    try {
      if (localStorage.getItem("ai-pet-onboarded")) return;
      localStorage.setItem("ai-pet-onboarded", "1");
    } catch { /* storage unavailable — still show onboarding */ }

    const now  = Date.now();
    const hi   = name ? `, ${name}` : "";

    const ob1: Message = {
      id: `ob-1-${now}`,
      role: "pet",
      content: `Hey${hi}! I'm NAVI — your AI assistant designed to help you navigate real-life situations.`,
      timestamp: now,
    };
    const ob2: Message = {
      id: `ob-2-${now + 1}`,
      role: "pet",
      content: `I can help you with things like:\n\n• Finding jobs and building resumes\n• Understanding legal situations\n• Learning Black history\n• Connecting you to real resources and opportunities`,
      timestamp: now + 1,
    };
    const ob3: Message = {
      id: `ob-3-${now + 2}`,
      role: "pet",
      content: `This system was designed by the founder of Springer Industries to help bring real access and tools to our communities. I'm always learning and improving — stay tuned for new updates! 🙌`,
      timestamp: now + 2,
    };

    // Store onboarding as a pending action; fired after the cinematic intro
    pendingIntroActionRef.current = () => {
      setMood("happy");
      setLastInteractionTime(now);

      // Message 1 — immediate
      setMessages([ob1]);
      speakRef.current(ob1.content, () => setIsSpeaking(true), () => setIsSpeaking(false));

      // Message 2 — after ~5 s
      setTimeout(() => {
        setMessages((prev) => [...prev, ob2]);
        speakRef.current(ob2.content, () => setIsSpeaking(true), () => setIsSpeaking(false));
      }, 5200);

      // Message 3 — after ~12 s
      setTimeout(() => {
        setMessages((prev) => [...prev, ob3]);
        speakRef.current(ob3.content, () => setIsSpeaking(true), () => setIsSpeaking(false));
      }, 12500);
    };

    // Show cinematic intro, then fire the onboarding when it completes
    try { sessionStorage.setItem("ai-pet-intro-shown", "1"); } catch { /* ignore */ }
    showIntroRef.current = true;
    setShowIntro(true);
  };

  const handleIntroDismiss = useCallback(() => {
    showIntroRef.current = false;
    setShowIntro(false);
    const action = pendingIntroActionRef.current;
    pendingIntroActionRef.current = null;
    if (action) action();
  }, []);

  const sendMessage = useCallback(async (voiceText?: string) => {
    const text = (voiceText !== undefined ? voiceText : input).trim();

    // ── Pending navigation confirmation intercept ─────────────────────────────
    // Check BEFORE the isLoading guard so "yes"/"no" work even while NAVI loads.
    if (pendingNavRef.current && text) {
      const lower = text.toLowerCase().trim();
      const nav = pendingNavRef.current;
      if (NAV_CONFIRM_RE.test(lower)) {
        clearTimeout(pendingNavTimerRef.current!);
        pendingNavRef.current = null;
        setPendingNav(null);
        setInput("");
        showNavToastRef.current(nav.label);
        const modeDests: string[] = ["job", "lawyer", "history", "companion", "housing", "stem", "ai_skills"];
        setTimeout(() => {
          if (modeDests.includes(nav.destination)) switchModeRef.current(nav.destination as AppMode);
          else switchTabRef.current(nav.destination);
        }, 800);
        return;
      }
      if (NAV_REJECT_RE.test(lower)) {
        clearTimeout(pendingNavTimerRef.current!);
        pendingNavRef.current = null;
        setPendingNav(null);
        setInput("");
        return;
      }
      // Unrelated message → implicit cancel, then process normally
      clearTimeout(pendingNavTimerRef.current!);
      pendingNavRef.current = null;
      setPendingNav(null);
    }

    if ((!text && !attachedFile) || isLoading) return;

    // Warm up the AudioContext NOW, while we're still inside the user-gesture
    // callstack — Safari/iOS requires this before any async audio.play() call.
    unlockAudio();

    // User speaking again — interrupt NAVI, clear queued speech, reset state
    cancelTTSRef.current();
    setIsSpeaking(false);

    // Capture attachment before clearing state
    const currentAttachment = attachedFile;
    setInput("");
    setAttachedFile(null);
    setErrorMsg(null);

    // What the user sees in the chat bubble
    const displayContent = text || `📎 ${currentAttachment?.name ?? "file"}`;

    // What gets sent to the AI (text files include their content; images/PDFs include a label)
    let apiText = text;
    if (currentAttachment) {
      if (currentAttachment.mimeType === "text/plain" && currentAttachment.content) {
        const snippet = currentAttachment.content.slice(0, 4000);
        apiText = `[File attached: ${currentAttachment.name}]\n---\n${snippet}\n---\n${text}`.trim();
      } else if (currentAttachment.mimeType.startsWith("image/")) {
        apiText = `[Image attached: ${currentAttachment.name}]${text ? `\n${text}` : ""}`.trim();
      } else {
        apiText = `[PDF document attached: ${currentAttachment.name}]${text ? `\n${text}` : ""}`.trim();
      }
    }

    const now = Date.now();
    const userMsg: Message = {
      id: `u-${now}`,
      role: "user",
      content: displayContent,
      timestamp: now,
      ...(currentAttachment && {
        attachment: {
          name: currentAttachment.name,
          mimeType: currentAttachment.mimeType,
          ...(currentAttachment.mimeType.startsWith("image/") && currentAttachment.content
            ? { dataUrl: currentAttachment.content }
            : {}),
        },
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLastInteractionTime(now);
    setRecentTimes((prev) => [...prev.filter((t) => now - t < RECENT_WINDOW_MS), now]);

    const baseXp = getXPForMessage(text);
    // Learning/engagement modes award more XP — history = ×2, lawyer/job = ×1.5
    const modeMulti = appMode === "history" ? 2 : (appMode === "lawyer" || appMode === "job") ? 1.5 : 1;
    const xp = Math.round(baseXp * modeMulti);
    setBondXP((prev) => prev + xp);
    showXpToast(xp, appMode);

    // ── Mission advancement ──────────────────────────────────────────────────
    const isVoiceMsg = fromVoiceRef.current;
    fromVoiceRef.current = false;
    let curMissions = missionsRef.current;
    const missionCompleted: DailyMission[] = [];

    const adv1 = advanceMissions(curMissions, "messages");
    curMissions = adv1.missions;
    missionCompleted.push(...adv1.completed);

    if (isVoiceMsg) {
      const adv2 = advanceMissions(curMissions, "voice");
      curMissions = adv2.missions;
      missionCompleted.push(...adv2.completed);
    }

    const adv3 = advanceMissions(curMissions, "mode", appModeRef.current);
    curMissions = adv3.missions;
    missionCompleted.push(...adv3.completed);

    setMissions(curMissions);

    if (missionCompleted.length > 0) {
      const missionXP = missionCompleted.reduce((s, m) => s + m.xpReward, 0);
      setBondXP((prev) => prev + missionXP);
      showXpToast(missionXP, appModeRef.current);
    }

    // ── Purpose intercept — hardcoded mission-statement response ─────────────
    if (PURPOSE_RE.test(text)) {
      const purposeMsg: Message = {
        id: `purpose-${Date.now()}`,
        role: "pet",
        content: NAVI_PURPOSE_RESPONSE,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, purposeMsg]);
      setMood("excited");
      if (soundEnabledRef.current) playNaviResponse();

      // Amplified NAVI glow for the duration of the response
      clearTimeout(purposeGlowTimerRef.current!);
      setPurposeGlow(true);
      purposeGlowTimerRef.current = setTimeout(() => setPurposeGlow(false), 14000);

      // Speak after a natural half-beat pause — split into chunks for faster start
      setTimeout(() => {
        if (canUseVoiceRef.current() && voiceEnabledRef.current) {
          speakChunks(
            splitForTTS(NAVI_PURPOSE_RESPONSE),
            speakRef.current,
            () => setIsSpeaking(true),
            () => { setIsSpeaking(false); setPurposeGlow(false); },
          );
        }
      }, 400);

      track("purpose_response_triggered");
      return; // skip the API call entirely
    }

    setIsLoading(true);

    // Last HISTORY_WINDOW messages become conversation context for OpenAI.
    // The new user message is passed separately so it always lands last.
    const history = messages
      .slice(-HISTORY_WINDOW)
      .map((m) => ({ role: m.role === "user" ? "user" : "assistant" as const, content: m.content }));

    const currentBondXP = bondXP + xp;
    const bondLevel = getBondLevel(currentBondXP);
    const bondName = BOND_NAMES[bondLevel];
    const currentMood = computeMood(now, [...recentTimes.filter((t) => now - t < RECENT_WINDOW_MS), now]);

    // ── Abort previous in-flight request, create new signal ──────────────────
    abortControllerRef.current?.abort();
    const ac = new AbortController();
    abortControllerRef.current = ac;

    // Show "Still thinking…" after 2 s of waiting
    clearTimeout(extendedLoadingTimerRef.current!);
    extendedLoadingTimerRef.current = setTimeout(() => setExtendedLoading(true), 2000);

    const chatPayload = JSON.stringify({
      message: apiText, appMode, userName, petName,
      mood: currentMood, bondLevel, bondName, mentorMode, history,
    });

    try {
      // Attempt up to 2 times on transient network errors (not on AbortError)
      let res: Response | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          res = await fetch("/api/chat", {
            method: "POST",
            signal: ac.signal,
            headers: { "Content-Type": "application/json" },
            body: chatPayload,
          });
          break; // success — stop retrying
        } catch (fetchErr) {
          if (fetchErr instanceof Error && fetchErr.name === "AbortError") throw fetchErr;
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 1500)); // brief pause before retry
          } else {
            throw fetchErr; // second failure → propagate
          }
        }
      }
      if (!res) throw new Error("No response");

      const data = (await res.json()) as { reply?: string; action?: AgentAction; error?: string };

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "Something went wrong.");
        clearTimeout(extendedLoadingTimerRef.current!);
        setExtendedLoading(false);
        setIsLoading(false);
        return;
      }

      const reply = data.reply ?? "...";
      const action = data.action ?? null;

      // ── Dispatch action side-effects ────────────────────────────────────────
      if (action?.type === "remind_later") {
        const reminder: Reminder = {
          id: `r-${Date.now()}`,
          message: action.message,
          scheduledAt: Date.now() + action.delayMinutes * 60_000,
        };
        setReminders((prev) => [...prev, reminder]);
      }

      if (action?.type === "track_progress") {
        setBondXP((prev) => prev + action.bonusXP);
        showXpToast(action.bonusXP, appMode);
        const entry: ProgressEntry = {
          id: `pe-${Date.now()}`,
          topic: action.topic,
          achievement: action.achievement,
          bonusXP: action.bonusXP,
          timestamp: Date.now(),
        };
        setProgressLog((prev) => [...prev, entry]);
      }

      // ask_followup: schedule a timed pet message ~10 s later (no API call)
      if (action?.type === "ask_followup") {
        const question = action.question;
        setTimeout(() => {
          const followupMsg: Message = {
            id: `p-fu-${Date.now()}`,
            role: "pet",
            content: question,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, followupMsg]);
          if (canUseVoiceRef.current() && voiceEnabledRef.current) speak(question);
        }, 10_000);
      }

      // navigate: show confirmation card instead of switching immediately
      if (action?.type === "navigate") {
        const newNav = { destination: action.destination, label: action.label };
        clearTimeout(pendingNavTimerRef.current!);
        pendingNavRef.current = newNav;
        setPendingNav(newNav);
        // Auto-dismiss after 6 s if user doesn't respond
        pendingNavTimerRef.current = setTimeout(() => {
          pendingNavRef.current = null;
          setPendingNav(null);
        }, 6000);
      }

      // Build pet message — attach action so ActionCard can render inline
      const petMsg: Message = {
        id: `p-${Date.now()}`,
        role: "pet",
        content: reply,
        timestamp: Date.now(),
        // attach for suggest_activity / remind_later / track_progress cards;
        // ask_followup is already dispatched above and returns null from ActionCard
        action: action ?? undefined,
      };

      setMessages((prev) => [...prev, petMsg]);
      if (soundEnabledRef.current) playNaviResponse();
      setMood(currentMood);

      // Mission completion praise (queued after AI reply)
      if (missionCompleted.length > 0) {
        const label = missionCompleted[0].label;
        const totalMXP = missionCompleted.reduce((s, m) => s + m.xpReward, 0);
        const praiseContent = `🎯 Mission complete: "${label}"! +${totalMXP} bonus XP — keep it up!`;
        const praiseMsg: Message = {
          id: `praise-${Date.now()}`,
          role: "pet",
          content: praiseContent,
          timestamp: Date.now() + 1,
        };
        setTimeout(() => setMessages((prev) => [...prev, praiseMsg]), 1800);
      }

      if (canUseVoiceRef.current() && voiceEnabledRef.current) {
        // Split into sentences so first chunk plays faster; prefetch handles the rest
        speakChunks(splitForTTS(reply), speak, () => setIsSpeaking(true), () => setIsSpeaking(false));
      } else {
        // No audio — use estimated duration for visual-only animation
        setIsSpeaking(true);
        setTimeout(() => setIsSpeaking(false), Math.min(reply.length * 50, 3000));
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request aborted (e.g., reset triggered) — no error to surface
      } else {
        setErrorMsg("Network error. Check your connection.");
      }
    } finally {
      clearTimeout(extendedLoadingTimerRef.current!);
      setExtendedLoading(false);
      setIsLoading(false);
    }
  }, [input, isLoading, messages, userName, petName, bondXP, recentTimes, attachedFile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSpeechResultStable = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();

    // ── Skip intro via voice ──────────────────────────────────────────────────
    if (showIntroRef.current) {
      if (/\bskip\b/i.test(lower)) dismissIntroRef.current();
      return; // don't process speech as commands while intro is showing
    }

    // ── Stop command — interrupt NAVI immediately ─────────────────────────────
    // Matches: "stop", "navi stop", "stop talking", "navi stop talking", etc.
    if (/^(navi[,\s]+)?stop(\s+(talking|now|please))?$/.test(lower)) {
      cancelTTSRef.current();
      setIsSpeaking(false);
      return;
    }

    // ── Pending navigation confirmation (voice) ───────────────────────────────
    if (pendingNavRef.current) {
      const nav = pendingNavRef.current;
      if (NAV_CONFIRM_RE.test(lower)) {
        clearTimeout(pendingNavTimerRef.current!);
        pendingNavRef.current = null;
        setPendingNav(null);
        showNavToastRef.current(nav.label);
        const modeDests: string[] = ["job", "lawyer", "history", "companion", "housing", "stem", "ai_skills"];
        setTimeout(() => {
          if (modeDests.includes(nav.destination)) switchModeRef.current(nav.destination as AppMode);
          else switchTabRef.current(nav.destination);
        }, 800);
        return;
      }
      if (NAV_REJECT_RE.test(lower)) {
        clearTimeout(pendingNavTimerRef.current!);
        pendingNavRef.current = null;
        setPendingNav(null);
        return;
      }
      // Unrelated speech → implicit cancel, fall through to regular processing
      clearTimeout(pendingNavTimerRef.current!);
      pendingNavRef.current = null;
      setPendingNav(null);
    }

    // ── Wake word detection ──────────────────────────────────────────────────
    // Matches: "hey navi", "hey, navi", "hey navi switch to job mode" etc.
    const wakeMatch = lower.match(/hey,?\s*navi\b(.*)?/i);
    if (wakeMatch) {
      const afterWake = (wakeMatch[1] ?? "").trim();
      cancelTTSRef.current(); // interrupt any ongoing speech

      // Inline command: "hey navi, switch to lawyer mode" / "hey navi, open housing finder"
      const inlineCmd = afterWake ? parseVoiceCommand(afterWake) : null;
      if (inlineCmd) {
        if (inlineCmd.action === "tab") {
          switchTabRef.current(inlineCmd.value);
          track("tab_open", { tab: inlineCmd.value, via: "voice" });
        } else {
          const label = APP_MODES.find((m) => m.id === inlineCmd.value)?.label ?? inlineCmd.value;
          switchModeRef.current(inlineCmd.value);
          openProgramPanelRef.current(inlineCmd.value);
          track("mode_switch", { mode: inlineCmd.value, via: "voice" });
          if (canUseVoiceRef.current() && voiceEnabledRef.current) {
            speakRef.current(`Switching to ${label} mode!`, () => setIsSpeaking(true), () => setIsSpeaking(false));
          }
        }
        return;
      }

      // Service intent inline: "Hey NAVI, create a logo"
      if (afterWake && canUseVoiceRef.current()) {
        const svcRoute = matchServiceRoute(afterWake);
        if (svcRoute) {
          setMenuOpen(true);
          setOnboardingService({ icon: svcRoute.icon, title: svcRoute.title, desc: svcRoute.desc, subject: svcRoute.subject });
          track("service_open", { service: svcRoute.title, via: "voice" });
          if (voiceEnabledRef.current) {
            speakRef.current(`Opening ${svcRoute.title}! Let me guide you through it.`, () => setIsSpeaking(true), () => setIsSpeaking(false));
          }
          return;
        }
      }

      // Just the wake word — activate listening mode with 5 s failsafe
      wakeActiveRef.current = true;
      setWakeActive(true);
      clearTimeout(wakeTimerRef.current!);
      wakeTimerRef.current = setTimeout(() => {
        wakeActiveRef.current = false;
        setWakeActive(false);
      }, 5000);
      if (canUseVoiceRef.current() && voiceEnabledRef.current) {
        speakRef.current("Yes?", () => setIsSpeaking(true), () => setIsSpeaking(false));
      }
      return;
    }

    // ── Post-wake command processing ─────────────────────────────────────────
    if (wakeActiveRef.current) {
      clearTimeout(wakeTimerRef.current!);
      wakeActiveRef.current = false;
      setWakeActive(false);

      const cmd = parseVoiceCommand(lower);
      if (cmd) {
        if (cmd.action === "tab") {
          switchTabRef.current(cmd.value);
          track("tab_open", { tab: cmd.value, via: "voice" });
        } else {
          const label = APP_MODES.find((m) => m.id === cmd.value)?.label ?? cmd.value;
          switchModeRef.current(cmd.value);
          openProgramPanelRef.current(cmd.value);
          track("mode_switch", { mode: cmd.value, via: "voice" });
          if (canUseVoiceRef.current() && voiceEnabledRef.current) {
            speakRef.current(`Switching to ${label} mode!`, () => setIsSpeaking(true), () => setIsSpeaking(false));
          }
        }
        return;
      }
      // Service intent after wake: "Hey NAVI" → "create a logo"
      if (canUseVoiceRef.current()) {
        const svcRoute = matchServiceRoute(lower);
        if (svcRoute) {
          setMenuOpen(true);
          setOnboardingService({ icon: svcRoute.icon, title: svcRoute.title, desc: svcRoute.desc, subject: svcRoute.subject });
          track("service_open", { service: svcRoute.title, via: "voice" });
          if (voiceEnabledRef.current) {
            speakRef.current(`Opening ${svcRoute.title}! Let me guide you through it.`, () => setIsSpeaking(true), () => setIsSpeaking(false));
          }
          return;
        }
      }
      // Unrecognized command → fall through to regular chat
    }

    // ── Panel voice handler (hands-free mode) ────────────────────────────────
    if (panelVoiceHandlerRef.current) {
      panelVoiceHandlerRef.current(text);
      return;
    }

    // ── Regular speech → send directly (bypasses input-state closure) ──────
    fromVoiceRef.current = true;
    sendMessageRef.current(text);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showXpToast = useCallback((amount: number, mode: AppMode = "companion") => {
    setXpGain(amount);
    if (xpToastRef.current) clearTimeout(xpToastRef.current);
    xpToastRef.current = setTimeout(() => setXpGain(null), 1500);
    if (amount >= 5) {
      setBigXp({ amount, mode });
      if (bigXpRef.current) clearTimeout(bigXpRef.current);
      bigXpRef.current = setTimeout(() => setBigXp(null), 1700);
    }
  }, []);

  const showNavToast = useCallback((label: string) => {
    setNavToast(label);
    if (navToastRef.current) clearTimeout(navToastRef.current);
    navToastRef.current = setTimeout(() => setNavToast(null), 2400);
  }, []);

  const showSwitching = useCallback((label: string) => {
    setSwitchingLabel(label);
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    switchTimerRef.current = setTimeout(() => setSwitchingLabel(null), 650);
  }, []);

  // ── Diagnostic recovery callback — passed to DiagnosticProvider ─────────────
  // Called when NAVI auto-recovers a service; speaks the announcement if voice on.
  const handleDiagnosticRecovery = useCallback((message: string) => {
    if (!voiceEnabledRef.current || !canUseVoiceRef.current()) return;
    speakRef.current(message, () => setIsSpeaking(true), () => setIsSpeaking(false));
  }, []);

  // ── Voice panel helpers ─────────────────────────────────────────────────────
  // Speak aloud inside a panel (noop if voice unavailable)
  const panelSpeakFn = useCallback((t: string) => {
    if (!canUseVoiceRef.current() || !voiceEnabledRef.current) return;
    speakRef.current(t, () => setIsSpeaking(true), () => setIsSpeaking(false));
  }, []);

  // Panels call this to register/unregister a voice-input handler
  const onRegisterVoiceHandler = useCallback((fn: ((text: string) => void) | null) => {
    panelVoiceHandlerRef.current = fn;
  }, []);

  // Toggle hands-free mode (PRO / Founder only)
  const toggleHandsFree = useCallback(() => {
    if (!canUseVoiceRef.current()) {
      setHubTab("subscription");
      return;
    }
    const next = !handsFreeModeRef.current;
    handsFreeModeRef.current = next;
    setHandsFreeMode(next);
    if (!next) panelVoiceHandlerRef.current = null;
    if (voiceEnabledRef.current) {
      speakRef.current(
        next
          ? "Hands-Free Mode activated. I'm listening for your commands."
          : "Hands-Free Mode off.",
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
      );
    }
  }, []);

  const handleReset = useCallback(() => {
    setResetConfirmOpen(false);
    // Cancel any in-flight API request and clear transient UI states
    abortControllerRef.current?.abort();
    clearTimeout(extendedLoadingTimerRef.current!);
    setExtendedLoading(false);
    // Clear every localStorage key the app writes
    const lsKeys = ["ai-pet-state", "ai-pet-gamif", "ai-pet-lvl-rewards", "ai-pet-voice", "ai-pet-sound", "ai-pet-admin", "ai-pet-pro"];
    lsKeys.forEach((k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
    // Clear session flags too
    try { sessionStorage.removeItem("ai-pet-greeted"); } catch { /* ignore */ }
    // Show brief feedback, then full page reload for clean new-user experience
    setResetFeedback(true);
    setTimeout(() => { window.location.reload(); }, 1200);
  }, []);

  const switchMode = useCallback((mode: AppMode) => {
    console.log(`[NAVI] Switching to ${mode} mode`);
    setAppMode(mode);
    appModeRef.current = mode;
    panelVoiceHandlerRef.current = null; // unregister any active panel handler
    // Close any open overlays when switching modes
    setShowResumeBuilder(false);
    setShowBizPlanBuilder(false);
    setShowLocalResources(false);
    setShowHomeworkHelper(false);
    setShowFamilySupport(false);
    setShowLegalRights(false);
    setShowLuckyMode(false);
    setShowHousingPanel(false);
    setShowHousingHub(false);
    setShowStemPanel(false);
    setShowAiSkillsPanel(false);
  }, []);

  const switchTab = useCallback((tab: string) => {
    track("feature_open", { feature: tab });
    switch (tab) {
      case "resumeBuilder":
        setAppMode("job"); appModeRef.current = "job";
        setShowResumeBuilder(true);
        setMenuOpen(false);
        break;
      case "bizPlanBuilder":
        setAppMode("job"); appModeRef.current = "job";
        setShowBizPlanBuilder(true);
        setMenuOpen(false);
        break;
      case "localResources":
        setAppMode("job"); appModeRef.current = "job";
        setShowLocalResources(true);
        setMenuOpen(false);
        break;
      case "homeworkHelper":
        setAppMode("companion"); appModeRef.current = "companion";
        setMentorMode("learning");
        setShowHomeworkHelper(true);
        setMenuOpen(false);
        break;
      case "housingFinder":
        setAppMode("housing"); appModeRef.current = "housing";
        setShowHousingHub(true);
        setShowHousingPanel(true);
        setMenuOpen(false);
        break;
      case "stemLesson":
        setAppMode("stem"); appModeRef.current = "stem";
        setShowStemPanel(true);
        setMenuOpen(false);
        break;
      case "aiSkillsLesson":
        setAppMode("ai_skills"); appModeRef.current = "ai_skills";
        setShowAiSkillsPanel(true);
        setMenuOpen(false);
        break;
      case "truthRoom":
        setAppMode("history"); appModeRef.current = "history";
        setHubTab("truth");
        setMenuOpen(true);
        break;
      case "partners":
        setHubTab("partners");
        setMenuOpen(true);
        break;
      case "rewards":
        setHubTab("rewards");
        setMenuOpen(true);
        break;
      default:
        break;
    }
  }, []);

  const handleMicDenied = useCallback(() => {
    clearTimeout(readyTimerRef.current!);
    setMicPhase("denied");
    micPhaseRef.current = "denied";
  }, []);

  const { status: micStatus, supported: micSupported, micEnabled, toggleMic } =
    useContinuousSpeech(handleSpeechResultStable, isLoading || isSpeaking, handleMicDenied);
  const { supported: ttsSupported, speak, cancel } = useTTS();
  cancelTTSRef.current = cancel; // wire forward ref so sendMessage can interrupt
  speakRef.current = speak;         // wire speak for wake word responses
  showNavToastRef.current  = showNavToast;
  switchModeRef.current    = switchMode;
  // ── Access control: re-derived every render so closures always see latest state ──
  isProRef.current = isPro;
  canUseVoiceRef.current = () => isProRef.current || isAdminRef.current;
  switchTabRef.current     = switchTab;
  sendMessageRef.current   = sendMessage;
  dismissIntroRef.current  = handleIntroDismiss;
  const PRO_GATE_MODES: Partial<Record<AppMode, string>> = {
    stem: "STEM Explorer", ai_skills: "AI Skills", housing: "Housing",
  };
  openProgramPanelRef.current = (mode: AppMode) => {
    if (PRO_GATE_MODES[mode] && !isPro && !isAdmin) {
      setProGateFeature(PRO_GATE_MODES[mode]!);
      return;
    }
    if (mode === "stem")           { setShowStemPanel(true);     setShowAiSkillsPanel(false); setShowHousingHub(false); }
    else if (mode === "ai_skills") { setShowAiSkillsPanel(true); setShowStemPanel(false);     setShowHousingHub(false); }
    else if (mode === "housing")   { setShowHousingHub(true);    setShowStemPanel(false);     setShowAiSkillsPanel(false); }
  };
  // Click-based entry: show cinematic intro for STEM / AI Skills; direct open for others
  openWithIntroRef.current = (mode: AppMode) => {
    if (PRO_GATE_MODES[mode] && !isPro && !isAdmin) {
      setProGateFeature(PRO_GATE_MODES[mode]!);
      return;
    }
    if (mode === "stem" || mode === "ai_skills") {
      setShowStemPanel(false);
      setShowAiSkillsPanel(false);
      setShowHousingHub(false);
      setProgramIntro(mode as "stem" | "ai_skills");
    } else {
      openProgramPanelRef.current(mode);
    }
  };

  // ── MicPhase: track micEnabled changes to drive cinematic awakening states ──
  useEffect(() => {
    if (micEnabled) {
      if (micPhaseRef.current === "activating") {
        // User tapped → permission granted → show "I'm listening." for 2.5 s then settle to active
        setMicPhase("ready");
        micPhaseRef.current = "ready";
        readyTimerRef.current = setTimeout(() => {
          setMicPhase("active");
          micPhaseRef.current = "active";
        }, 2500);
      } else if (micPhaseRef.current === "dormant") {
        // Auto-granted on mount (already had permission) — jump straight to active
        setMicPhase("active");
        micPhaseRef.current = "active";
      }
    } else {
      clearTimeout(readyTimerRef.current!);
      if (micPhaseRef.current !== "denied") {
        setMicPhase("dormant");
        micPhaseRef.current = "dormant";
      }
    }
  }, [micEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cinematic mic tap: NAVI reacts first (650 ms), then permission popup fires
  const handleMicTap = useCallback(() => {
    const phase = micPhaseRef.current;
    if (phase === "dormant" || phase === "denied") {
      // Show one-time voice consent before activating mic for the first time
      if (!voiceConsentGiven) {
        setShowVoiceConsent(true);
        return;
      }
      setMicPhase("activating");
      micPhaseRef.current = "activating";
      setTimeout(() => toggleMic(), 650);
    } else if (phase === "active" || phase === "ready") {
      // Turn off
      clearTimeout(readyTimerRef.current!);
      toggleMic();
      setMicPhase("dormant");
      micPhaseRef.current = "dormant";
    }
    // "activating" — tap ignored (in-flight)
  }, [toggleMic]);

  const toggleVoice = useCallback(() => {
    if (!canUseVoiceRef.current()) return; // voice unavailable unless PRO or Founder
    setVoiceEnabled((prev) => {
      const next = !prev;
      voiceEnabledRef.current = next;
      try { localStorage.setItem("ai-pet-voice", next ? "1" : "0"); } catch { /* ignore */ }
      if (!next) cancel();
      return next;
    });
  }, [cancel]);

  const handleAdminUnlock = useCallback(() => {
    if (adminInput.trim() === ADMIN_PASSCODE) {
      setIsAdmin(true);
      isAdminRef.current = true;
      try { localStorage.setItem("ai-pet-admin", "1"); } catch { /* ignore */ }
      // Auto-enable voice for the admin
      setVoiceEnabled(true);
      voiceEnabledRef.current = true;
      try { localStorage.setItem("ai-pet-voice", "1"); } catch { /* ignore */ }
      setShowAdminInput(false);
      setAdminInput("");
      setAdminError(false);
    } else {
      setAdminError(true);
      setAdminInput("");
    }
  }, [adminInput]);

  const handleNaviOrbTap = useCallback(() => {
    if (isAdmin) return; // already unlocked
    clearTimeout(founderTapTimerRef.current!);
    setFounderTapCount((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        // Triple tap — open founder modal + brief orb glow
        setShowAdminInput(true);
        setAdminInput("");
        setAdminError(false);
        clearTimeout(founderOrbPulseTimerRef.current!);
        setFounderOrbPulse(true);
        founderOrbPulseTimerRef.current = setTimeout(() => setFounderOrbPulse(false), 900);
        founderTapTimerRef.current = null;
        return 0;
      }
      founderTapTimerRef.current = setTimeout(() => setFounderTapCount(0), 800);
      return next;
    });
  }, [isAdmin]);

  const handleFounderDisable = useCallback(() => {
    setIsAdmin(false);
    isAdminRef.current = false;
    try { localStorage.removeItem("ai-pet-admin"); } catch { /* ignore */ }
    // Turn off voice (it was auto-enabled for admin; re-read from storage)
    setVoiceEnabled(false);
    voiceEnabledRef.current = false;
    try { localStorage.removeItem("ai-pet-voice"); } catch { /* ignore */ }
    setShowAdminInput(false);
    setAdminInput("");
    setAdminError(false);
  }, []);

  const handleProUnlock = useCallback(() => {
    setIsPro(true);
    try { localStorage.setItem("ai-pet-pro", "1"); } catch { /* ignore */ }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      unlockAudio(); // warm up audio context in this keyboard-gesture context
      sendMessage();
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-selecting the same file
    const isImage = file.type.startsWith("image/");
    const isText = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isImage && !isText && !isPDF) return;
    const mimeType = isText ? "text/plain" : isPDF ? "application/pdf" : file.type;
    if (isText || isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachedFile({
          name: file.name,
          mimeType: isText ? "text/plain" : file.type,
          content: (ev.target?.result as string) ?? null,
        });
        track("file_attached", { type: mimeType });
      };
      if (isImage) reader.readAsDataURL(file);
      else reader.readAsText(file);
    } else {
      setAttachedFile({ name: file.name, mimeType: "application/pdf", content: null });
      track("file_attached", { type: mimeType });
    }
  }, []);

  const bondLevel = getBondLevel(bondXP);
  const bondName = BOND_NAMES[bondLevel];
  const bondProgress = getBondProgress(bondXP);
  const isMaxLevel = bondLevel >= BOND_THRESHOLDS.length - 1;
  const xpToNext = isMaxLevel ? 0 : BOND_THRESHOLDS[bondLevel + 1] - bondXP;
  // Infinite XP level (separate from bond bar — does not modify bar)
  const xpLevel = getXpLevel(bondXP);
  const xpLevelProgress = getXpLevelProgress(bondXP);
  const xpLevelTitle = getXpLevelTitle(xpLevel);
  const xpToNextLevel = getXpLevelThreshold(xpLevel + 1) - bondXP;

  const lastUserMessage = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "user");
    return last?.content ?? "";
  }, [messages]);

  const lastNaviReply = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "pet");
    return last?.content ?? "";
  }, [messages]);

  if (!mounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#08080f" }}>
        <div className="font-mono text-slate-600 tracking-widest text-sm animate-pulse">
          BOOTING...
        </div>
      </div>
    );
  }

  return (
    <DiagnosticProvider onRecovery={handleDiagnosticRecovery}>
    <>
    <CosmicBackground isSpeaking={isSpeaking} isLoading={isLoading} />
    <div
      className="fixed inset-0 flex flex-col grid-bg overflow-hidden"
      style={{ background: "transparent" }}
    >
      {/* Cinematic intro */}
      {showIntro && (
        <NaviIntro
          petName={petName}
          userName={userName}
          onDismiss={handleIntroDismiss}
        />
      )}

      {/* Name setup modal */}
      {showNameSetup && (
        <NameSetup petName={petName} onComplete={handleNameComplete} />
      )}

      {/* Resume Builder overlay — Job Finder mode */}
      {showResumeBuilder && (
        <ResumeBuilder
          petName={petName}
          onClose={() => setShowResumeBuilder(false)}
        />
      )}

      {/* Business Plan Builder overlay — Job Finder mode */}
      {showBizPlanBuilder && (
        <BusinessPlanBuilder
          petName={petName}
          onClose={() => setShowBizPlanBuilder(false)}
        />
      )}

      {/* Local Resource Finder overlay — Job Finder mode */}
      {showLocalResources && (
        <LocalResourceFinder onClose={() => setShowLocalResources(false)} />
      )}

      {/* Homework Helper overlay — Learn style */}
      {showHomeworkHelper && (
        <HomeworkHelper petName={petName} onClose={() => setShowHomeworkHelper(false)} />
      )}

      {/* Family Support Finder overlay — Community section */}
      {showFamilySupport && (
        <FamilySupportFinder onClose={() => setShowFamilySupport(false)} />
      )}

      {/* Legal Rights Guide overlay */}
      {showLegalRights && (
        <LegalRightsPanel onClose={() => setShowLegalRights(false)} />
      )}

      {/* Auto Finder Panel */}
      {showAutoFinder && (
        <AutoFinderPanel onClose={() => setShowAutoFinder(false)} />
      )}

      {/* Job Finder Panel */}
      {showJobFinder && (
        <JobFinderPanel onClose={() => setShowJobFinder(false)} />
      )}

      {/* Black History Panel */}
      {showBlackHistory && (
        <BlackHistoryPanel onClose={() => setShowBlackHistory(false)} />
      )}

      {/* Lucky Mode Panel */}
      {showLuckyMode && (
        <LuckyModePanel
          onClose={() => setShowLuckyMode(false)}
          onXpEarned={(xp: number) => {
            setBondXP((prev) => prev + xp);
            showXpToast(xp, "companion");
          }}
        />
      )}

      {/* System Health Panel — Founder/admin only */}
      {showSystemHealth && isAdmin && (
        <SystemHealthPanel
          onClose={() => setShowSystemHealth(false)}
          isPro={isPro}
          isAdmin={isAdmin}
          voiceEnabled={voiceEnabled}
          soundEnabled={soundEnabled}
        />
      )}

      {/* Admin Dashboard — Founder/admin only */}
      {showAdminDash && isAdmin && (
        <AdminDashboardPanel
          onClose={() => setShowAdminDash(false)}
        />
      )}

      {/* Housing Mode hub — shown when housing mode is active */}
      {showHousingHub && (
        <HousingHubPanel
          onClose={() => setShowHousingHub(false)}
          onOpenFinder={() => setShowHousingPanel(true)}
        />
      )}

      {/* Affordable Home Finder — full search overlay (z-60, above hub) */}
      {showHousingPanel && (
        <HousingPanel onClose={() => setShowHousingPanel(false)} />
      )}

      {/* STEM Lab overlay — STEM Explorer mode */}
      {showStemPanel && (
        <StemPanel
          studentName={userName}
          onClose={() => setShowStemPanel(false)}
          onLevelComplete={(xp: number, levelTitle: string) => {
            setBondXP((prev) => prev + xp);
            showXpToast(xp, "stem");
            const entry: ProgressEntry = {
              id: `pe-stem-${Date.now()}`,
              topic: "STEM Explorer",
              achievement: `Completed Level: ${levelTitle}`,
              bonusXP: xp,
              timestamp: Date.now(),
            };
            setProgressLog((prev) => [...prev, entry]);
          }}
        />
      )}

      {/* AI Skills Lab overlay — AI Skills mode */}
      {showAiSkillsPanel && (
        <AiSkillsPanel
          studentName={userName}
          onClose={() => setShowAiSkillsPanel(false)}
          onLevelComplete={(xp: number, levelTitle: string) => {
            setBondXP((prev) => prev + xp);
            showXpToast(xp, "ai_skills");
            const entry: ProgressEntry = {
              id: `pe-ai-${Date.now()}`,
              topic: "AI Skills",
              achievement: `Completed: ${levelTitle}`,
              bonusXP: xp,
              timestamp: Date.now(),
            };
            setProgressLog((prev) => [...prev, entry]);
          }}
        />
      )}

      {/* ── Program Cinematic Intro Overlay ── */}
      {programIntro && (
        <ProgramIntroOverlay
          program={programIntro}
          onContinue={() => {
            const mode = programIntro;
            setProgramIntro(null);
            openProgramPanelRef.current(mode);
          }}
          onExit={() => setProgramIntro(null)}
        />
      )}

      {/* ── PRO Gate Overlay ── */}
      {proGateFeature && (
        <ProGateOverlay
          feature={proGateFeature}
          onClose={() => setProGateFeature(null)}
        />
      )}

      {/* ── Client Onboarding Panel (NAVI-guided service intake) ── */}
      {onboardingService && menuOpen && (
        <ServiceErrorBoundary onClose={() => { setOnboardingService(null); panelVoiceHandlerRef.current = null; }}>
          {onboardingService.title === "Logo Generator" ? (
            <LogoGeneratorPanel
              service={onboardingService}
              onClose={() => { setOnboardingService(null); panelVoiceHandlerRef.current = null; }}
              speakFn={panelSpeakFn}
              handsFree={handsFreeMode}
              onRegisterVoiceHandler={onRegisterVoiceHandler}
            />
          ) : (
            <ClientOnboardingPanel
              service={onboardingService}
              onClose={() => { setOnboardingService(null); panelVoiceHandlerRef.current = null; }}
            />
          )}
        </ServiceErrorBoundary>
      )}

      {/* ── Hands-Free Mode indicator bar ── */}
      {handsFreeMode && (
        <HandsFreeBar onStop={toggleHandsFree} />
      )}

      {/* ── My Business — Coming Soon overlay ── */}
      {showBusinessIntro && (
        <div
          onClick={() => setShowBusinessIntro(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(2,2,10,0.95)",
            backdropFilter: "blur(16px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", maxWidth: 380 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <div style={{ fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "#C9A227", marginBottom: 8 }}>
              Springer Industries
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, textShadow: "0 0 20px rgba(201,162,39,0.20)" }}>
              My Business
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#C9A227", marginBottom: 16 }}>
              Coming Soon
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7, marginBottom: 24 }}>
              Your personal dashboard is being built — real-time analytics, content scheduling, AI tools, and a direct line to your strategy team.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
              {[
                { icon: "📊", label: "Analytics" },
                { icon: "📅", label: "Content Calendar" },
                { icon: "✨", label: "AI Generator" },
                { icon: "📋", label: "Work Orders" },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  padding: "10px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(201,162,39,0.10)",
                }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 9, color: "#64748b" }}>{label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowBusinessIntro(false)}
              style={{
                padding: "10px 28px", borderRadius: 10,
                background: "linear-gradient(135deg, #C9A227, #a07818)",
                border: "none", color: "#08080f",
                fontSize: 12, fontFamily: "monospace", fontWeight: 700,
                cursor: "pointer", letterSpacing: "0.04em",
                boxShadow: "0 0 14px rgba(201,162,39,0.20)",
              }}
            >
              Got It
            </button>
            <div style={{ marginTop: 12, fontSize: 9, color: "#334155" }}>
              tap anywhere to close
            </div>
          </div>
        </div>
      )}

      {/* ── Springer Industries cinematic intro (Founders / Work With Us tab) ── */}
      {showFoundersIntro && (
        <SpringerIntroOverlay
          onComplete={() => {
            try { localStorage.setItem("workWithUsIntroSeen", "1"); } catch { /* ignore */ }
            setFoundersIntroSeen(true);
            setShowFoundersIntro(false);
            showSwitching("Founders");
            track("hub_tab_switch", { tab: "founders" });
            setHubTab("founders");
          }}
        />
      )}

      {/* ── Voice Consent Modal ── */}
      {showVoiceConsent && (
        <div
          onClick={() => setShowVoiceConsent(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(2,2,12,0.82)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 20px", animation: "overlayIn 0.25s ease forwards",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 320, borderRadius: 20,
              background: "linear-gradient(160deg, rgba(18,14,32,0.98) 0%, rgba(24,18,44,0.98) 100%)",
              border: "1px solid rgba(0,212,255,0.25)",
              boxShadow: "0 0 36px rgba(0,212,255,0.12), 0 24px 48px rgba(0,0,0,0.6)",
              padding: "24px 20px 20px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "radial-gradient(circle at 38% 32%, rgba(0,212,255,0.18) 0%, rgba(0,212,255,0.04) 60%, transparent 80%)",
              border: "1px solid rgba(0,212,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 0 22px rgba(0,212,255,0.2)",
            }}>🎤</div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 14, fontFamily: "monospace", fontWeight: "bold",
                color: "#f1f5f9", letterSpacing: "0.04em", marginBottom: 8,
              }}>
                Enable Voice
              </div>
              <div style={{
                fontSize: 11, fontFamily: "monospace", color: "#64748b", lineHeight: 1.65,
              }}>
                By using voice, you agree to audio being processed to provide responses.
                Your audio is not stored.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              <button
                onClick={() => {
                  try { localStorage.setItem("ai-pet-voice-consent", "1"); } catch { /* ignore */ }
                  setVoiceConsentGiven(true);
                  setShowVoiceConsent(false);
                  // Now proceed with normal mic activation
                  setMicPhase("activating");
                  micPhaseRef.current = "activating";
                  setTimeout(() => toggleMic(), 650);
                }}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12, cursor: "pointer",
                  background: "linear-gradient(135deg, rgba(0,212,255,0.18), rgba(168,85,247,0.18))",
                  border: "1px solid rgba(0,212,255,0.35)",
                  color: "#00d4ff", fontFamily: "monospace", fontSize: 13,
                  fontWeight: "bold", letterSpacing: "0.05em",
                }}
              >
                ✓ Agree &amp; Enable Voice
              </button>
              <button
                onClick={() => setShowVoiceConsent(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 11, fontFamily: "monospace", color: "#334155", padding: "4px 0",
                }}
              >
                Not now
              </button>
            </div>

            <div style={{
              display: "flex", gap: 12, paddingTop: 4,
              borderTop: "1px solid rgba(255,255,255,0.05)", width: "100%",
              justifyContent: "center",
            }}>
              <a href="/privacy" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", textDecoration: "underline" }}>
                Privacy Policy
              </a>
              <a href="/terms" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", textDecoration: "underline" }}>
                Terms of Use
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Live Opportunity Banner ── */}
      <div
        className="relative z-10 flex-shrink-0 overflow-hidden"
        style={{
          height: 32,
          background: "rgba(6,6,14,0.94)",
          borderBottom: "1px solid rgba(201,162,39,0.18)",
        }}
      >
        {/* Accent side bars */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: "linear-gradient(180deg, transparent, #C9A227, transparent)" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 3,
          background: "linear-gradient(180deg, transparent, #C9A227, transparent)" }} />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: 14,
            paddingRight: 14,
            opacity: bannerVisible ? 1 : 0,
            transition: "opacity 0.5s ease",
            pointerEvents: "none",
          }}
        >
          <span style={{
            fontSize: 10,
            fontFamily: "monospace",
            letterSpacing: "0.07em",
            color: "rgba(255,255,255,0.88)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            <span style={{ color: "#C9A227" }}>{BANNER_MESSAGES[bannerIdx].icon}</span>
            <span style={{ color: "rgba(201,162,39,0.55)", margin: "0 6px" }}>›</span>
            {BANNER_MESSAGES[bannerIdx].text}
          </span>
        </div>
      </div>

      {/* ── Greeting + mode bar ── */}
      <div
        className="relative z-10 flex-shrink-0 flex items-center justify-between px-4 py-1.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        {/* Greeting */}
        <span style={{ fontSize: 13, fontFamily: "monospace", color: "rgba(255,255,255,0.92)", letterSpacing: "0.03em" }}>
          Hey
          {userName && (
            <span style={{ color: "#00d4ff" }}>, {userName}</span>
          )}
        </span>

        {/* Active mode — remounts on mode change to replay the label-in animation */}
        <span
          key={displayedAppMode}
          className={appModePhase === "in" ? "animate-mode-label-in" : ""}
          style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em", display: "inline-block" }}
        >
          {APP_MODES.find((m) => m.id === displayedAppMode)?.icon}{" "}
          <span style={{ color: "rgba(255,255,255,0.75)" }}>
            {APP_MODES.find((m) => m.id === displayedAppMode)?.label}
          </span>
        </span>
      </div>

      {/* ── Programs tab bar — STEM Explorer & AI Skills ── */}
      <div
        style={{
          position: "relative", zIndex: 10, flexShrink: 0,
          display: "flex", alignItems: "center",
          padding: "5px 12px",
          background: "rgba(0,0,0,0.4)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          gap: 8,
        }}
      >
        {/* Label */}
        <span style={{
          fontSize: 9, fontFamily: "monospace", letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.2)", textTransform: "uppercase",
          flexShrink: 0, paddingRight: 4,
        }}>
          Programs
        </span>

        {/* Divider */}
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

        {/* STEM Explorer tab */}
        {(() => {
          const active = appMode === "stem";
          const locked = !isPro && !isAdmin;
          return (
            <button
              onClick={() => {
                switchMode("stem");
                openWithIntroRef.current("stem");
              }}
              aria-label="Open STEM Explorer"
              style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                padding: "5px 10px", borderRadius: 18,
                background: active ? "rgba(99,102,241,0.16)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${active ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"}`,
                color: active ? "#818cf8" : (locked ? "#3d4a5c" : "#64748b"),
                fontSize: 11, fontFamily: "monospace",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: active ? "0 0 14px rgba(99,102,241,0.22)" : "none",
                opacity: locked ? 0.65 : 1,
              }}
            >
              <span style={{ fontSize: 12 }}>{locked ? "🔒" : "🔬"}</span>
              <span style={{ fontWeight: active ? 600 : 400 }}>STEM Explorer</span>
              {active && !locked && (
                <span style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: "#818cf8", display: "inline-block",
                  boxShadow: "0 0 5px rgba(129,140,248,0.9)",
                  animation: "pulse 1.4s ease-in-out infinite",
                }} />
              )}
            </button>
          );
        })()}

        {/* AI Skills tab */}
        {(() => {
          const active = appMode === "ai_skills";
          const locked = !isPro && !isAdmin;
          return (
            <button
              onClick={() => {
                switchMode("ai_skills");
                openWithIntroRef.current("ai_skills");
              }}
              aria-label="Open AI Skills"
              style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                padding: "5px 10px", borderRadius: 18,
                background: active ? "rgba(139,92,246,0.16)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${active ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.07)"}`,
                color: active ? "#a78bfa" : (locked ? "#3d4a5c" : "#64748b"),
                fontSize: 11, fontFamily: "monospace",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: active ? "0 0 14px rgba(139,92,246,0.22)" : "none",
                opacity: locked ? 0.65 : 1,
              }}
            >
              <span style={{ fontSize: 12 }}>{locked ? "🔒" : "⚡"}</span>
              <span style={{ fontWeight: active ? 600 : 400 }}>AI Skills</span>
              {active && !locked && (
                <span style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: "#a78bfa", display: "inline-block",
                  boxShadow: "0 0 5px rgba(167,139,250,0.9)",
                  animation: "pulse 1.4s ease-in-out infinite",
                }} />
              )}
            </button>
          );
        })()}
      </div>

      {/* ── Reminder alert ── */}
      {dueReminder && (
        <ReminderAlert
          message={dueReminder.message}
          petName={petName}
          onDismiss={() => setDueReminder(null)}
        />
      )}

      {/* ── NAVI Face — flex-1 so it claims 70-80% of vertical space ── */}
      <div style={{
        flex: "1 1 0%", minHeight: 0, display: "flex", flexDirection: "column", position: "relative",
        opacity: naviFaceDim ? 0.6 : 1,
        transform: naviFaceDim ? "scale(0.982)" : "scale(1)",
        transition: naviFaceDim
          ? "opacity 0.15s cubic-bezier(0.4,0,1,1), transform 0.15s cubic-bezier(0.4,0,1,1)"
          : "opacity 0.3s cubic-bezier(0.34,1.56,0.64,1), transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        willChange: "opacity, transform",
      }}>
        {/* XP Level aura — subtle radial glow behind NAVI that grows with level */}
        {xpLevel >= 2 && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
              background: `radial-gradient(ellipse 70% 55% at 50% 42%,
                rgba(0,212,255,${Math.min(0.03 + xpLevel * 0.004, 0.16)}) 0%,
                rgba(168,85,247,${Math.min(0.02 + xpLevel * 0.003, 0.10)}) 40%,
                transparent 70%)`,
              transition: "opacity 1s ease",
            }}
          />
        )}

        {/* Purpose-response glow — amplified pulse when NAVI states its mission */}
        {purposeGlow && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute", inset: "-12%", pointerEvents: "none", zIndex: 0,
              background: "radial-gradient(ellipse 75% 60% at 50% 44%, rgba(0,212,255,0.22) 0%, rgba(168,85,247,0.16) 38%, rgba(244,114,182,0.06) 65%, transparent 75%)",
              animation: "purposePulse 1.8s ease-in-out infinite",
              borderRadius: "50%",
            }}
          />
        )}
        <NaviFace
          mood={mood}
          isSpeaking={isSpeaking}
          isLoading={isLoading}
          petName={petName}
          bondXP={bondXP}
          mentorMode={mentorMode}
          onModeChange={setMentorMode}
          onAreaChange={setWorldAreaIdx}
          lastUserMessage={lastUserMessage}
          wakeActive={wakeActive}
          onTap={handleNaviOrbTap}
        />

        {/* Triple-tap founder glow pulse — brief radial bloom on the orb */}
        {founderOrbPulse && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, pointerEvents: "none", zIndex: 30,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div style={{
              width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,212,255,0.28) 0%, rgba(168,85,247,0.18) 40%, transparent 70%)",
              animation: "introRing 0.9s ease-out forwards",
            }} />
          </div>
        )}

        {/* Live transcript — voice mode only, auto-fades after 4 s */}
        {!showFullChat && (lastUserMessage || lastNaviReply) && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 20,
              padding: "0 20px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              opacity: transcriptFading ? 0 : 1,
              transition: "opacity 1.4s ease",
              pointerEvents: "none",
            }}
          >
            {lastUserMessage && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span style={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: "rgba(0,212,255,0.85)",
                  background: "rgba(0,212,255,0.08)",
                  border: "1px solid rgba(0,212,255,0.15)",
                  borderRadius: "14px 14px 4px 14px",
                  padding: "6px 12px",
                  maxWidth: "72%",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {lastUserMessage.length > 72 ? lastUserMessage.slice(0, 72) + "…" : lastUserMessage}
                </span>
              </div>
            )}
            {lastNaviReply && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <span style={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: "rgba(226,232,240,0.75)",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px 14px 14px 4px",
                  padding: "6px 12px",
                  maxWidth: "80%",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {lastNaviReply.length > 90 ? lastNaviReply.slice(0, 90) + "…" : lastNaviReply}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Evolution overlay ── */}
      {evolving && (() => {
        const s = EVOLUTION_STAGES[Math.min(evolutionNewStage, EVOLUTION_STAGES.length - 1)];
        return (
          <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
            style={{ animation: "evoFadeInOut 3.2s ease-in-out forwards" }}
          >
            {/* Flash backdrop */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center, ${s.glowBase}55 0%, ${s.glowBase}11 50%, transparent 80%)`,
                animation: "evoFlash 3.2s ease-in-out forwards",
              }}
            />
            {/* Rings */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{
                  width: 80 + i * 70,
                  height: 80 + i * 70,
                  borderColor: `${s.glowBase}${["66", "44", "22"][i - 1]}`,
                  animation: `evoRing 1.2s ease-out ${i * 0.15}s forwards`,
                  opacity: 0,
                }}
              />
            ))}
            {/* Text */}
            <div
              className="relative flex flex-col items-center gap-2"
              style={{ animation: "evoText 3.2s ease-in-out forwards" }}
            >
              <span className="text-5xl" style={{ filter: `drop-shadow(0 0 16px ${s.glowBase})` }}>
                {s.emoji}
              </span>
              <span
                className="text-lg font-mono font-bold tracking-[0.3em] uppercase"
                style={{ color: s.glowBase, textShadow: `0 0 20px ${s.glowBase}` }}
              >
                Evolution!
              </span>
              <span
                className="text-sm font-mono tracking-widest"
                style={{ color: s.glowBase, opacity: 0.8 }}
              >
                {petName} is now a {s.name}
              </span>
            </div>
          </div>
        );
      })()}

      {/* ── Level-Up popup ── */}
      {levelUpPopup && (() => {
        const lvl = levelUpPopup.level;
        const rew = levelUpPopup.reward;
        return (
          <div
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center pointer-events-none"
            style={{ animation: "evoFadeInOut 4.8s ease-in-out forwards" }}
          >
            {/* Radial glow backdrop */}
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse at center, rgba(0,212,255,0.18) 0%, rgba(168,85,247,0.08) 45%, transparent 70%)",
                animation: "evoFlash 4.8s ease-in-out forwards",
              }}
            />
            {/* Pulse rings */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{
                  width: 80 + i * 64,
                  height: 80 + i * 64,
                  borderColor: `rgba(0,212,255,${["0.45", "0.3", "0.15"][i - 1]})`,
                  animation: `evoRing 1.4s ease-out ${i * 0.18}s forwards`,
                  opacity: 0,
                }}
              />
            ))}
            {/* Content card */}
            <div
              className="relative flex flex-col items-center gap-3"
              style={{ animation: "evoText 4.8s ease-in-out forwards" }}
            >
              <div style={{
                padding: "22px 32px", borderRadius: 22,
                background: "rgba(8,8,15,0.88)",
                border: "1px solid rgba(0,212,255,0.35)",
                boxShadow: "0 0 40px rgba(0,212,255,0.25), 0 0 80px rgba(168,85,247,0.12)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                backdropFilter: "blur(12px)",
              }}>
                <span style={{ fontSize: 38, filter: "drop-shadow(0 0 14px rgba(0,212,255,0.8))" }}>
                  ⬆️
                </span>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 11, fontFamily: "monospace", letterSpacing: "0.22em",
                    textTransform: "uppercase", color: "#475569", marginBottom: 4,
                  }}>
                    Level Up
                  </div>
                  <div style={{
                    fontSize: 28, fontFamily: "monospace", fontWeight: "bold",
                    color: "#00d4ff", letterSpacing: "0.08em",
                    textShadow: "0 0 24px rgba(0,212,255,0.9)",
                  }}>
                    Level {lvl}
                  </div>
                  <div style={{
                    fontSize: 12, fontFamily: "monospace", color: "#64748b",
                    letterSpacing: "0.12em", marginTop: 2,
                  }}>
                    {getXpLevelTitle(lvl)}
                  </div>
                </div>
                {rew && (
                  <div style={{
                    marginTop: 4, padding: "10px 16px", borderRadius: 12,
                    background: "rgba(168,85,247,0.1)",
                    border: "1px solid rgba(168,85,247,0.3)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}>
                    <div style={{
                      fontSize: 9, fontFamily: "monospace", letterSpacing: "0.2em",
                      textTransform: "uppercase", color: "rgba(168,85,247,0.6)",
                    }}>
                      Reward Unlocked
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 18 }}>{rew.icon}</span>
                      <span style={{
                        fontSize: 13, fontFamily: "monospace", fontWeight: "bold",
                        color: "#c084fc",
                      }}>
                        {rew.name}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 10, fontFamily: "monospace", color: "#64748b",
                      textAlign: "center", lineHeight: 1.5, margin: 0, maxWidth: 200,
                    }}>
                      {rew.desc}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── XP gain float toast ── */}
      {xpGain !== null && (
        <div
          className="fixed pointer-events-none animate-xp-float"
          style={{
            top: "2.6rem",
            right: "1rem",
            zIndex: 60,
            fontSize: 12,
            fontFamily: "monospace",
            fontWeight: "bold",
            color: "#00d4ff",
            textShadow: "0 0 8px rgba(0,212,255,0.8)",
          }}
        >
          +{xpGain} XP
        </div>
      )}

      {/* ── Big XP burst toast (gains ≥ 5 XP) ── */}
      {bigXp !== null && (() => {
        const modeIcon: Record<AppMode, string> = {
          companion: "🤝",
          lawyer:    "⚖️",
          job:       "💼",
          history:   "✊",
          housing:   "🏠",
          stem:      "🔬",
          ai_skills: "⚡",
        };
        return (
          <div className="fixed inset-0 z-[55] pointer-events-none flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 animate-xp-burst">
              <span style={{ fontSize: 40, filter: "drop-shadow(0 0 12px rgba(0,212,255,0.7))" }}>
                {modeIcon[bigXp.mode]}
              </span>
              <span
                className="text-4xl font-mono font-bold tracking-wide"
                style={{
                  color: "#00d4ff",
                  textShadow: "0 0 28px rgba(0,212,255,0.95), 0 0 56px rgba(0,212,255,0.4)",
                }}
              >
                +{bigXp.amount} XP
              </span>
            </div>
          </div>
        );
      })()}

      {/* ── Nav toast — "Taking you to X…" ── */}
      {navToast && (
        <div
          className="fixed pointer-events-none animate-xp-float"
          style={{
            bottom: "5.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 65,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 24,
            background: "rgba(10,10,22,0.92)",
            border: "1px solid rgba(0,212,255,0.35)",
            boxShadow: "0 0 18px rgba(0,212,255,0.2)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 14 }}>🚀</span>
          <span style={{
            fontSize: 12,
            fontFamily: "monospace",
            fontWeight: "bold",
            color: "#00d4ff",
            letterSpacing: "0.05em",
          }}>
            Taking you to {navToast}…
          </span>
        </div>
      )}

      {/* ── Navigation confirmation card ── */}
      {pendingNav && (
        <div
          className="fixed animate-mode-in"
          style={{
            bottom: 80,
            left: 12,
            right: 12,
            zIndex: 64,
            borderRadius: 18,
            overflow: "hidden",
            background: "rgba(10,10,22,0.97)",
            border: "1px solid rgba(0,212,255,0.25)",
            boxShadow: "0 -4px 28px rgba(0,212,255,0.1), 0 0 48px rgba(0,212,255,0.05)",
            backdropFilter: "blur(14px)",
          }}
        >
          {/* Countdown bar — depletes in 6 s */}
          <div style={{ height: 2, background: "rgba(255,255,255,0.06)", position: "relative" }}>
            <div
              key={pendingNav.destination}
              style={{
                position: "absolute",
                left: 0, top: 0, bottom: 0,
                background: "linear-gradient(90deg, #00d4ff, #a855f7)",
                animation: "countdownBar 6s linear forwards",
              }}
            />
          </div>

          {/* Body */}
          <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>🚀</span>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontFamily: "monospace", fontWeight: "bold", color: "#e2e8f0", letterSpacing: "0.02em" }}>
                  Take you to{" "}
                  <span style={{ color: "#00d4ff" }}>{pendingNav.label}</span>?
                </p>
                <p style={{ margin: "3px 0 0", fontSize: 10, fontFamily: "monospace", color: "#475569", letterSpacing: "0.05em" }}>
                  say "yes" or tap Go Now · dismisses in 6 s
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  const { destination, label } = pendingNav;
                  clearTimeout(pendingNavTimerRef.current!);
                  pendingNavRef.current = null;
                  setPendingNav(null);
                  if (soundEnabledRef.current) playConfirm();
                  showNavToast(label);
                  track("navigation_confirmed", { destination, label });
                  const modeDests = ["job", "lawyer", "history", "companion", "housing", "stem", "ai_skills"];
                  setTimeout(() => {
                    if (modeDests.includes(destination)) switchModeRef.current(destination as AppMode);
                    else switchTabRef.current(destination);
                  }, 800);
                }}
                style={{
                  flex: 2, padding: "11px", borderRadius: 12, cursor: "pointer",
                  background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(168,85,247,0.2))",
                  border: "1px solid rgba(0,212,255,0.4)",
                  color: "#00d4ff", fontSize: 13,
                  fontFamily: "monospace", fontWeight: "bold", letterSpacing: "0.06em",
                  transition: "all 0.2s ease",
                }}
              >
                Go Now 🚀
              </button>
              <button
                onClick={() => {
                  clearTimeout(pendingNavTimerRef.current!);
                  pendingNavRef.current = null;
                  setPendingNav(null);
                }}
                style={{
                  flex: 1, padding: "11px", borderRadius: 12, cursor: "pointer",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#64748b", fontSize: 12,
                  fontFamily: "monospace",
                  transition: "all 0.2s ease",
                }}
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Switching badge — brief "Switching…" pulse on manual mode/tab change ── */}
      {switchingLabel && (
        <div
          className="fixed pointer-events-none animate-switch-badge"
          style={{
            bottom: "5.5rem",
            left: "50%",
            zIndex: 67,
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 16px",
            borderRadius: 20,
            background: "rgba(10,10,22,0.92)",
            border: "1px solid rgba(168,85,247,0.35)",
            boxShadow: "0 0 14px rgba(168,85,247,0.18)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: "bold", color: "#a855f7", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            ⟳ Switching to {switchingLabel}…
          </span>
        </div>
      )}

      {/* ── Hidden file input — shared between voice bar and full chat ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.txt,image/jpeg,image/png,application/pdf,text/plain"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ── Voice bar — always visible ── */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-center gap-5 mb-[64px] py-4 px-6">
          {/* Attachment badge — floats above voice bar when file is staged */}
          {attachedFile && (
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 4px)",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px 6px 8px",
                borderRadius: 10,
                background: "rgba(10,10,22,0.95)",
                border: "1px solid rgba(0,212,255,0.25)",
                backdropFilter: "blur(8px)",
                zIndex: 10,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 14 }}>
                {attachedFile.mimeType.startsWith("image/") ? "🖼" : attachedFile.mimeType === "application/pdf" ? "📄" : "📝"}
              </span>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                {attachedFile.name}
              </span>
              <button
                onClick={() => setAttachedFile(null)}
                style={{ fontSize: 11, color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                aria-label="Remove attachment"
              >
                ✕
              </button>
            </div>
          )}

          {/* Upload button — small, left of mic */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            aria-label="Attach a file"
            title="Attach PDF, image, or text file"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: attachedFile ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)",
              border: attachedFile ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              opacity: isLoading ? 0.4 : 1,
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ fontSize: 17 }}>📎</span>
          </button>

          {/* Locked mic — shown to non-PRO, non-admin users */}
          {micSupported && !isPro && !isAdmin && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => { setMenuOpen(true); setHubTab("subscription"); }}
                aria-label="Unlock NAVI PRO for voice"
                style={{
                  width: 68, height: 68, borderRadius: "50%", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(245,200,66,0.05)",
                  border: "2px solid rgba(245,200,66,0.25)",
                  boxShadow: "0 0 18px rgba(245,200,66,0.08)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,200,66,0.10)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,200,66,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,200,66,0.05)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,200,66,0.25)";
                }}
              >
                <span style={{ fontSize: 26 }}>🔒</span>
              </button>
              <span style={{
                fontSize: 10, fontFamily: "monospace", color: "#64748b",
                textAlign: "center", maxWidth: 120, lineHeight: 1.45,
              }}>
                Unlock NAVI PRO to use voice features
              </span>
            </div>
          )}

          {/* Mic / Stop button — cinematic awakening experience */}
          {micSupported && (isPro || isAdmin) && (
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>

              {/* Status badge — phase-aware, floats above the button */}
              <div style={{
                position: "absolute",
                bottom: "calc(100% + 10px)",
                left: "50%",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}>
                {isLoading ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontFamily: "monospace", letterSpacing: "0.12em",
                    color: "#a855f7", padding: "3px 10px", borderRadius: 12,
                    background: "rgba(168,85,247,0.12)",
                    border: "1px solid rgba(168,85,247,0.3)",
                  }}>
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                    Processing…
                  </span>
                ) : micPhase === "dormant" ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontFamily: "monospace", letterSpacing: "0.12em",
                    color: "rgba(0,212,255,0.55)", padding: "3px 10px", borderRadius: 12,
                    background: "rgba(0,212,255,0.06)",
                    border: "1px solid rgba(0,212,255,0.15)",
                    animation: "micDormantBadge 3s ease-in-out infinite",
                  }}>
                    Tap to awaken NAVI
                  </span>
                ) : micPhase === "activating" ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontFamily: "monospace", letterSpacing: "0.12em",
                    color: "#00d4ff", padding: "3px 10px", borderRadius: 12,
                    background: "rgba(0,212,255,0.12)",
                    border: "1px solid rgba(0,212,255,0.4)",
                    animation: "micReadyPulse 0.7s ease-in-out infinite",
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#00d4ff", display: "inline-block",
                      animation: "pulse 0.7s ease-in-out infinite",
                    }} />
                    Awakening…
                  </span>
                ) : micPhase === "ready" ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontFamily: "monospace", letterSpacing: "0.12em",
                    color: "#4ade80", padding: "3px 10px", borderRadius: 12,
                    background: "rgba(74,222,128,0.12)",
                    border: "1px solid rgba(74,222,128,0.4)",
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#4ade80", display: "inline-block",
                      animation: "pulse 1.2s ease-in-out infinite",
                    }} />
                    I&apos;m listening.
                  </span>
                ) : micPhase === "denied" ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontFamily: "monospace", letterSpacing: "0.12em",
                    color: "#fb923c", padding: "3px 10px", borderRadius: 12,
                    background: "rgba(251,146,60,0.10)",
                    border: "1px solid rgba(251,146,60,0.3)",
                  }}>
                    Voice access needed to speak with me
                  </span>
                ) : micPhase === "active" && micStatus === "listening" ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontFamily: "monospace", letterSpacing: "0.12em",
                    color: "#4ade80", padding: "3px 10px", borderRadius: 12,
                    background: "rgba(74,222,128,0.1)",
                    border: "1px solid rgba(74,222,128,0.3)",
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#4ade80", display: "inline-block",
                      animation: "pulse 1s ease-in-out infinite",
                    }} />
                    Listening…
                  </span>
                ) : null}
              </div>

              {/* Pulsing rings — rendered behind the button */}
              <div style={{ position: "relative", width: 68, height: 68 }}>
                {/* Dormant ring — one slow gentle bloom */}
                {micPhase === "dormant" && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    border: "1.5px solid rgba(0,212,255,0.28)",
                    animation: "micDormantRing 2.8s ease-out infinite",
                    pointerEvents: "none",
                  }} />
                )}
                {/* Activating rings — two fast expanding bursts */}
                {micPhase === "activating" && (<>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    border: "2px solid rgba(0,212,255,0.55)",
                    animation: "micActivatingRing 0.8s ease-out infinite",
                    pointerEvents: "none",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    border: "2px solid rgba(0,212,255,0.35)",
                    animation: "micActivatingRing 0.8s ease-out 0.4s infinite",
                    pointerEvents: "none",
                  }} />
                </>)}
                {/* Ready ring — gentle green confirmation pulse */}
                {micPhase === "ready" && (
                  <div style={{
                    position: "absolute", inset: -4, borderRadius: "50%",
                    border: "2px solid rgba(74,222,128,0.45)",
                    animation: "micActivatingRing 1.4s ease-out infinite",
                    pointerEvents: "none",
                  }} />
                )}

              <button
                onClick={isSpeaking
                  ? () => { cancelTTSRef.current(); setIsSpeaking(false); }
                  : handleMicTap}
                aria-label={
                  isSpeaking ? "Stop NAVI speaking"
                  : micPhase === "active" || micPhase === "ready" ? "Turn off voice"
                  : micPhase === "activating" ? "Awakening…"
                  : micPhase === "denied" ? "Microphone access denied"
                  : "Tap to awaken NAVI"
                }
                style={{
                  width: 68, height: 68,
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isSpeaking
                    ? "rgba(239,68,68,0.18)"
                    : micPhase === "activating"
                      ? "rgba(0,212,255,0.15)"
                      : micPhase === "ready"
                        ? "rgba(74,222,128,0.18)"
                        : micPhase === "active" && micStatus === "listening"
                          ? "rgba(74,222,128,0.18)"
                          : micPhase === "active"
                            ? "rgba(74,222,128,0.09)"
                            : micPhase === "denied"
                              ? "rgba(251,146,60,0.10)"
                              : "rgba(0,212,255,0.04)",  // dormant
                  border: isSpeaking
                    ? "2px solid rgba(239,68,68,0.65)"
                    : micPhase === "activating"
                      ? "2px solid rgba(0,212,255,0.75)"
                      : micPhase === "ready"
                        ? "2px solid rgba(74,222,128,0.75)"
                        : micPhase === "active" && micStatus === "listening"
                          ? "2px solid rgba(74,222,128,0.65)"
                          : micPhase === "active"
                            ? "2px solid rgba(74,222,128,0.3)"
                            : micPhase === "denied"
                              ? "2px solid rgba(251,146,60,0.45)"
                              : "2px solid rgba(0,212,255,0.22)",  // dormant
                  boxShadow: isSpeaking
                    ? "0 0 24px rgba(239,68,68,0.35), 0 0 48px rgba(239,68,68,0.12)"
                    : micPhase === "activating"
                      ? "0 0 28px rgba(0,212,255,0.45), 0 0 56px rgba(0,212,255,0.18)"
                      : micPhase === "ready"
                        ? "0 0 24px rgba(74,222,128,0.4), 0 0 48px rgba(74,222,128,0.15)"
                        : micPhase === "active" && micStatus === "listening"
                          ? "0 0 24px rgba(74,222,128,0.3), 0 0 48px rgba(74,222,128,0.12)"
                          : micPhase === "active"
                            ? "0 0 10px rgba(74,222,128,0.12)"
                            : micPhase === "denied"
                              ? "0 0 14px rgba(251,146,60,0.22)"
                              : "0 0 18px rgba(0,212,255,0.12), 0 0 36px rgba(0,212,255,0.06)",  // dormant
                  cursor: micPhase === "activating" ? "default" : "pointer",
                  transition: "all 0.3s ease",
                  animation: micPhase === "dormant" ? "micDormantGlow 3s ease-in-out infinite" : undefined,
                }}
              >
                {isSpeaking ? (
                  /* Stop icon */
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 26, height: 26, color: "#f87171" }} className="animate-pulse">
                    <rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor" />
                  </svg>
                ) : micPhase === "activating" ? (
                  /* Spinning energy burst during awakening */
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 26, height: 26, color: "#00d4ff" }} className="animate-spin">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28 14" strokeLinecap="round" />
                  </svg>
                ) : micPhase === "ready" || (micPhase === "active" && micStatus === "listening") ? (
                  /* Sound wave bars — listening */
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 28, height: 28, color: "#4ade80" }} className="animate-pulse">
                    <rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" />
                    <rect x="6" y="6" width="2" height="12" rx="1" fill="currentColor" />
                    <rect x="10" y="3" width="2" height="18" rx="1" fill="currentColor" />
                    <rect x="14" y="6" width="2" height="12" rx="1" fill="currentColor" />
                    <rect x="18" y="9" width="2" height="6" rx="1" fill="currentColor" />
                  </svg>
                ) : micPhase === "active" ? (
                  /* Mic icon — ready but quiet */
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 26, height: 26, color: "#4ade80", opacity: 0.75 }}>
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : micPhase === "denied" ? (
                  /* Mic-off icon in amber */
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 26, height: 26, color: "#fb923c" }}>
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  /* Dormant — soft cyan mic with glow */
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 26, height: 26, color: "rgba(0,212,255,0.5)" }}>
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </button>
              </div>
            </div>
          )}

          {/* Chat toggle button — small, right of mic */}
          <button
            onClick={() => setShowFullChat((v) => !v)}
            aria-label={showFullChat ? "Close chat" : "Show chat"}
            title={showFullChat ? "Close chat" : "Show chat history"}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: showFullChat ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)",
              border: showFullChat ? "1px solid rgba(0,212,255,0.35)" : "1px solid rgba(255,255,255,0.1)",
              boxShadow: showFullChat ? "0 0 10px rgba(0,212,255,0.18)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 17, height: 17, color: showFullChat ? "#00d4ff" : "#64748b" }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
      </div>

      {/* ── Floating chat panel ── */}
      {showFullChat && (
        <div
          style={{
            position: "fixed",
            bottom: "5.5rem",
            right: "1rem",
            width: "min(380px, calc(100vw - 2rem))",
            height: 300,
            zIndex: 40,
            display: "flex",
            flexDirection: "column",
            borderRadius: 16,
            overflow: "hidden",
            background: "rgba(10,10,22,0.90)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(22px)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,212,255,0.04)",
            animation: "overlayIn 0.3s ease forwards",
          }}
        >
          {/* Chat header with voice mode toggle */}
          <div
            className="flex items-center justify-between px-3 py-2 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", color: "#475569", textTransform: "uppercase" }}>
              Chat
            </span>
            <button
              onClick={() => setShowFullChat(false)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 10, fontFamily: "monospace", color: "#64748b",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "3px 8px", cursor: "pointer",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 11, height: 11, color: "#4ade80" }}>
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Voice mode
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs font-mono text-slate-600 text-center leading-relaxed whitespace-pre-line">
                  {MODES.find((m) => m.id === mentorMode)?.emptyHint ?? ""}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="space-y-1.5">
                <div
                  className={`flex gap-2 msg-enter ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  {msg.role === "pet" && <NaviOrb size={28} />}

                  {/* Bubble */}
                  <div
                    className="max-w-[75%] px-3 py-2 rounded-2xl text-sm font-mono leading-relaxed"
                    style={
                      msg.role === "user"
                        ? {
                            background: "rgba(0,212,255,0.1)",
                            border: "1px solid rgba(0,212,255,0.2)",
                            color: "#e2e8f0",
                            borderRadius: "18px 18px 4px 18px",
                          }
                        : {
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "#cbd5e1",
                            borderRadius: "18px 18px 18px 4px",
                            whiteSpace: "pre-wrap",
                          }
                    }
                  >
                    {msg.attachment
                      ? msg.content !== `📎 ${msg.attachment.name}` && msg.content
                      : msg.content}
                    {msg.attachment && (
                      <div className="mt-1.5">
                        {msg.attachment.dataUrl ? (
                          <img
                            src={msg.attachment.dataUrl}
                            alt={msg.attachment.name}
                            className="rounded-xl max-w-[200px] max-h-[160px] object-cover"
                            style={{ border: "1px solid rgba(0,212,255,0.25)", display: "block" }}
                          />
                        ) : (
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              color: "#94a3b8",
                            }}
                          >
                            <span>{msg.attachment.mimeType === "application/pdf" ? "📄" : "📝"}</span>
                            <span className="max-w-[180px] truncate">{msg.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {msg.role === "pet" && msg.action && (
                  <div className="pl-9">
                    <ActionCard
                      action={msg.action}
                      onDismiss={
                        msg.action.type === "suggest_activity"
                          ? () =>
                              setMessages((prev) =>
                                prev.map((m) =>
                                  m.id === msg.id ? { ...m, action: undefined } : m
                                )
                              )
                          : undefined
                      }
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Typing / thinking indicator */}
            {isLoading && (
              <div className="flex gap-2 items-center msg-enter">
                <NaviOrb size={28} />
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "18px 18px 18px 4px",
                  }}
                >
                  {extendedLoading ? (
                    <span
                      className="font-mono text-xs"
                      style={{ color: "rgba(0,212,255,0.6)", letterSpacing: "0.05em" }}
                    >
                      Still thinking…
                    </span>
                  ) : (
                    <div className="flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error message */}
            {errorMsg && (
              <div
                className="px-3 py-2 rounded-xl text-xs font-mono msg-enter"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#fca5a5",
                }}
              >
                ⚠ {errorMsg}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <div
            className="flex flex-col flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            {/* Attachment preview */}
            {attachedFile && (
              <div
                className="flex items-center gap-2 px-3 pt-2 pb-1.5 mx-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                {attachedFile.mimeType.startsWith("image/") && attachedFile.content ? (
                  <img
                    src={attachedFile.content}
                    alt={attachedFile.name}
                    className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                    style={{ border: "1px solid rgba(0,212,255,0.3)" }}
                  />
                ) : (
                  <span className="text-base flex-shrink-0">
                    {attachedFile.mimeType === "application/pdf" ? "📄" : "📝"}
                  </span>
                )}
                <span
                  className="flex-1 min-w-0 text-xs font-mono truncate"
                  style={{ color: "#94a3b8" }}
                >
                  {attachedFile.name}
                </span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors"
                  style={{ color: "#64748b" }}
                  aria-label="Remove attachment"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Textarea row */}
            <div className="flex items-end gap-2 pl-3 pr-3 py-3">
            {/* 📎 Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              aria-label="Attach a file"
              title="Attach PDF, image, or text file"
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30"
              style={{
                background: attachedFile ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)",
                border: attachedFile ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: attachedFile ? "0 0 8px rgba(0,212,255,0.15)" : "none",
              }}
            >
              <span style={{ fontSize: 16 }}>📎</span>
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={MODES.find((m) => m.id === mentorMode)?.placeholder.replace("NAVI", petName) ?? `Message ${petName}...`}
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none font-mono text-sm text-slate-200 placeholder-slate-600 focus:outline-none disabled:opacity-50"
              style={{
                background: "transparent",
                maxHeight: 80,
                lineHeight: "1.5",
                caretColor: "#00d4ff",
              }}
            />
            {/* Mic toggle */}
            {micSupported && (
              <button
                onClick={() => { toggleMic(); track("mic_toggled", { enabled: !micEnabled }); }}
                aria-label={micEnabled ? "Turn off continuous listening" : "Tap to enable voice"}
                title={micEnabled ? (micStatus === "listening" ? "Listening…" : "Mic on") : "Tap to enable voice"}
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                style={{
                  background: !micEnabled
                    ? "rgba(255,255,255,0.03)"
                    : micStatus === "listening"
                      ? "rgba(74,222,128,0.15)"
                      : "rgba(74,222,128,0.07)",
                  border: !micEnabled
                    ? "1px solid rgba(255,255,255,0.07)"
                    : micStatus === "listening"
                      ? "1px solid rgba(74,222,128,0.55)"
                      : "1px solid rgba(74,222,128,0.25)",
                  boxShadow: micEnabled && micStatus === "listening"
                    ? "0 0 10px rgba(74,222,128,0.25)"
                    : "none",
                }}
              >
                {micEnabled && micStatus === "listening" ? (
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 animate-pulse" style={{ color: "#4ade80" }}>
                    <rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" />
                    <rect x="6" y="6" width="2" height="12" rx="1" fill="currentColor" />
                    <rect x="10" y="3" width="2" height="18" rx="1" fill="currentColor" />
                    <rect x="14" y="6" width="2" height="12" rx="1" fill="currentColor" />
                    <rect x="18" y="9" width="2" height="6" rx="1" fill="currentColor" />
                  </svg>
                ) : micEnabled ? (
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" style={{ color: "#4ade80", opacity: 0.7 }}>
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" style={{ color: "#475569" }}>
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            )}

            <button
              onClick={() => { unlockAudio(); sendMessage(); }}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: input.trim() && !isLoading
                  ? "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(168,85,247,0.2))"
                  : "rgba(255,255,255,0.04)",
                border: input.trim() && !isLoading
                  ? "1px solid rgba(0,212,255,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
                boxShadow: input.trim() && !isLoading ? "0 0 12px rgba(0,212,255,0.15)" : "none",
              }}
              aria-label="Send message"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4"
                style={{ color: input.trim() && !isLoading ? "#00d4ff" : "#475569" }}
              >
                <path
                  d="M22 2L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Stop NAVI — appears in chat panel while speaking */}
            {isSpeaking && (
              <button
                onClick={() => { cancelTTSRef.current(); setIsSpeaking(false); }}
                aria-label="Stop NAVI speaking"
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 animate-pulse"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.45)",
                  boxShadow: "0 0 10px rgba(239,68,68,0.2)",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14, color: "#f87171" }}>
                  <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
                </svg>
              </button>
            )}
            </div>{/* end textarea row */}
          </div>{/* end input bar */}
        </div>
      )}

      {/* Safe area bottom padding */}
      <div className="safe-bottom flex-shrink-0" />

      {/* ── Floating hub button ── */}
      <button
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        style={{
          position: "fixed",
          bottom: "1.25rem",
          right: "1rem",
          zIndex: 50,
          width: 48,
          height: 48,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: menuOpen
            ? "rgba(0,212,255,0.15)"
            : "rgba(20,20,36,0.92)",
          border: menuOpen
            ? "1px solid rgba(0,212,255,0.45)"
            : "1px solid rgba(255,255,255,0.13)",
          boxShadow: menuOpen
            ? "0 0 20px rgba(0,212,255,0.25), 0 4px 16px rgba(0,0,0,0.5)"
            : "0 4px 20px rgba(0,0,0,0.5)",
          backdropFilter: "blur(14px)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        {menuOpen ? (
          /* X icon */
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" style={{ color: "#00d4ff" }}>
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          /* Hamburger / hub icon */
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" style={{ color: "#94a3b8" }}>
            <line x1="3" y1="7" x2="21" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* ── Springer Industries branding ── */}
      <div
        aria-label="Powered by Springer Industries"
        style={{
          position: "fixed",
          bottom: "0.9rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 46,
          display: "flex",
          alignItems: "baseline",
          gap: "0.32em",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          animation: "brandFadeIn 1.4s cubic-bezier(0.22,1,0.36,1) 0.6s both",
        }}
      >
        <span style={{
          fontSize: 9,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 400,
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.45)",
          textTransform: "uppercase",
        }}>
          Powered by
        </span>
        <span style={{
          fontSize: 11,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.82)",
          textShadow: "0 0 12px rgba(255,255,255,0.12)",
          textTransform: "uppercase",
        }}>
          Springer
        </span>
        <span style={{
          fontSize: 11,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "#C9A227",
          textShadow: "0 0 14px rgba(201,162,39,0.45), 0 0 28px rgba(201,162,39,0.18)",
          textTransform: "uppercase",
        }}>
          Industries
        </span>
      </div>

      {/* ── Hub panel backdrop ── */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 47,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* ── Hub panel (slides up from bottom) ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 48,
          background: "rgba(10,10,22,0.97)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          borderRadius: "22px 22px 0 0",
          backdropFilter: "blur(22px)",
          padding: "16px 20px 80px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxHeight: "85vh",
          overflowY: "auto",
          transform: menuOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.32s cubic-bezier(0.32,0.72,0,1)",
          pointerEvents: menuOpen ? "auto" : "none",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.14)", margin: "0 auto 2px" }} />

        {/* ── Main navigation — 4 tabs ── */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => { if (hubTab !== "home") { showSwitching("Home"); track("hub_tab_switch", { tab: "home" }); } setHubTab("home"); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 10,
              fontFamily: "monospace", letterSpacing: "0.03em", cursor: "pointer",
              background: hubTab === "home" ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.03)",
              border: hubTab === "home" ? "1px solid rgba(0,212,255,0.35)" : "1px solid rgba(255,255,255,0.07)",
              color: hubTab === "home" ? "#00d4ff" : "#64748b",
              fontWeight: hubTab === "home" ? 700 : 400,
            }}
          >
            🏠 Home
          </button>
          <button
            onClick={() => { if (hubTab !== "explore") { showSwitching("Explore"); track("hub_tab_switch", { tab: "explore" }); } setHubTab("explore"); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 10,
              fontFamily: "monospace", letterSpacing: "0.03em", cursor: "pointer",
              background: hubTab === "explore" ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.03)",
              border: hubTab === "explore" ? "1px solid rgba(168,85,247,0.35)" : "1px solid rgba(255,255,255,0.07)",
              color: hubTab === "explore" ? "#a855f7" : "#64748b",
              fontWeight: hubTab === "explore" ? 700 : 400,
            }}
          >
            🧭 Explore
          </button>
          <button
            onClick={() => { if (hubTab !== "settings") { showSwitching("Settings"); track("hub_tab_switch", { tab: "settings" }); } setHubTab("settings"); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 10,
              fontFamily: "monospace", letterSpacing: "0.03em", cursor: "pointer",
              background: hubTab === "settings" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
              border: hubTab === "settings" ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.07)",
              color: hubTab === "settings" ? "#e2e8f0" : "#64748b",
              fontWeight: hubTab === "settings" ? 700 : 400,
            }}
          >
            ⚙️ Settings
          </button>
          {/* My Business — auth gated */}
          <button
            onClick={() => {
              if (!isLoggedIn) {
                window.location.href = "/login?redirect=onboarding";
                return;
              }
              setShowBusinessIntro(true);
              setMenuOpen(false);
            }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 10,
              fontFamily: "monospace", letterSpacing: "0.03em", cursor: "pointer",
              background: isLoggedIn ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)",
              border: isLoggedIn ? "1px solid rgba(52,211,153,0.30)" : "1px solid rgba(255,255,255,0.07)",
              color: isLoggedIn ? "#34d399" : "#475569",
              fontWeight: 400,
              opacity: isLoggedIn ? 1 : 0.55,
              transition: "all 0.18s ease",
            }}
          >
            {isLoggedIn ? "💼" : "🔒"} Biz
          </button>
        </div>

        {/* ── Tab content — 2-phase transition (tabOut → tabIn), no remount ── */}
        <div
          className={
            hubTabPhase === "out" ? "animate-tab-out" :
            hubTabPhase === "in"  ? "animate-tab-in"  : ""
          }
          style={{
            willChange: "transform, opacity",
            ...(hubTabPhase === "in" && {
              filter: "drop-shadow(0 6px 18px rgba(0,212,255,0.05))",
            }),
          }}
        >

        {/* ── Home tab (settings / modes) ── */}
        {displayedHubTab === "home" && <>

        {/* ── 1. What do you need help with? ────────────────────────────── */}
        <div>
          <p style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>
            What do you need help with?
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {APP_MODES.filter(({ id }) => !PRO_GATE_MODES[id]).map(({ id, label, icon }) => {
              const active = appMode === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    showSwitching(label);
                    switchMode(id);
                    openWithIntroRef.current(id);
                    track("mode_switch", { mode: id });
                    setMenuOpen(false);
                    if (id === "job") setShowJobFinder(true);
                    if (id === "history") setShowBlackHistory(true);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 12px", borderRadius: 12,
                    background: active ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
                    border: active ? "1px solid rgba(168,85,247,0.45)" : "1px solid rgba(255,255,255,0.08)",
                    color: active ? "#c084fc" : "#94a3b8",
                    fontSize: 13, fontFamily: "monospace", cursor: "pointer",
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. Programs ───────────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>
            Programs
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {APP_MODES.filter(({ id }) => !!PRO_GATE_MODES[id]).map(({ id, label, icon }) => {
              const locked = !isPro && !isAdmin;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (locked) { setProGateFeature(PRO_GATE_MODES[id]!); return; }
                    showSwitching(label);
                    switchMode(id);
                    openWithIntroRef.current(id);
                    track("mode_switch", { mode: id });
                    setMenuOpen(false);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                    background: locked ? "rgba(245,200,66,0.04)" : "rgba(168,85,247,0.06)",
                    border: locked ? "1px solid rgba(245,200,66,0.15)" : "1px solid rgba(168,85,247,0.22)",
                    color: locked ? "rgba(245,200,66,0.5)" : "#a78bfa",
                    fontSize: 12, fontFamily: "monospace",
                    opacity: locked ? 0.65 : 1,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{locked ? "🔒" : icon}</span>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  {locked && <span style={{ marginLeft: "auto", fontSize: 7, color: "rgba(245,200,66,0.5)", letterSpacing: "0.1em" }}>PRO</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. Quick Tools ────────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>
            Quick Tools
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { icon: "📄", label: "Resume", color: "#4ade80", onClick: () => { if (!isPro && !isAdmin) { setProGateFeature("Resume Builder"); return; } setShowResumeBuilder(true); setMenuOpen(false); }, locked: !isPro && !isAdmin },
              { icon: "🚀", label: "Biz Plan", color: "#f59e0b", onClick: () => { if (!isPro && !isAdmin) { setProGateFeature("Business Plan Builder"); return; } setShowBizPlanBuilder(true); setMenuOpen(false); }, locked: !isPro && !isAdmin },
              { icon: "📍", label: "Local Help", color: "#86efac", onClick: () => { if (!isPro && !isAdmin) { setProGateFeature("Local Help"); return; } setShowLocalResources(true); setMenuOpen(false); }, locked: !isPro && !isAdmin },
              { icon: "🚗", label: "Auto Finder", color: "#4ade80", onClick: () => { setShowAutoFinder(true); setMenuOpen(false); }, locked: false },
            ].map(({ icon, label, color, onClick, locked }) => (
              <button key={label} onClick={onClick} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 4px", borderRadius: 10, cursor: "pointer",
                fontSize: 11, fontFamily: "monospace",
                background: locked ? "rgba(245,200,66,0.04)" : `${color}0a`,
                border: locked ? "1px solid rgba(245,200,66,0.15)" : `1px solid ${color}30`,
                color: locked ? "rgba(245,200,66,0.5)" : color,
                opacity: locked ? 0.65 : 1,
              }}>
                <span>{locked ? "🔒" : icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => { showSwitching("Explore"); track("hub_tab_switch", { tab: "explore" }); setHubTab("explore"); }}
            style={{
              width: "100%", marginTop: 8, padding: "8px", borderRadius: 8,
              background: "rgba(168,85,247,0.04)",
              border: "1px solid rgba(168,85,247,0.15)",
              color: "#a855f7", fontSize: 10, fontFamily: "monospace",
              fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            🧭 View All Tools
          </button>
        </div>

        {/* ── 4. Daily Missions (collapsible) ───────────────────────────── */}
        {missions.length > 0 && (() => {
          const [missionsOpen, setMissionsOpen] = [showMissionsOpen, setShowMissionsOpen];
          return (
            <div>
              <button
                onClick={() => setMissionsOpen(!missionsOpen)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: 0, marginBottom: missionsOpen ? 8 : 0,
                  background: "none", border: "none", cursor: "pointer",
                }}
              >
                <p style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", color: "#475569", textTransform: "uppercase", margin: 0 }}>
                  Daily Missions
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {streak >= 2 && (
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "#f97316" }}>🔥 {streak}</span>
                  )}
                  <span style={{ fontSize: 10, color: "#475569", transition: "transform 0.2s", transform: missionsOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                </div>
              </button>
              {missionsOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {missions.map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 10,
                      background: m.completed ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.03)",
                      border: m.completed ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{m.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: m.completed ? 0 : 3 }}>
                          <span style={{ fontSize: 11, fontFamily: "monospace", color: m.completed ? "#4ade80" : "#94a3b8",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.label}
                          </span>
                          {m.completed && <span style={{ fontSize: 10, color: "#4ade80", flexShrink: 0 }}>✓</span>}
                        </div>
                        {!m.completed && (
                          <div style={{ width: "100%", height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)" }}>
                            <div style={{ width: `${Math.min(100, Math.round((m.progress / m.target) * 100))}%`,
                              height: "100%", borderRadius: 2,
                              background: "linear-gradient(90deg, #00d4ff80, #a855f780)",
                              transition: "width 0.4s ease" }} />
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 9, fontFamily: "monospace", color: m.completed ? "#4ade80" : "#334155",
                        flexShrink: 0 }}>
                        +{m.xpReward}xp
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── 5. How NAVI responds ──────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>
            How NAVI responds
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {MODES.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => { setMentorMode(id); }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "8px 4px", borderRadius: 10,
                  background: mentorMode === id ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.03)",
                  border: mentorMode === id ? "1px solid rgba(0,212,255,0.35)" : "1px solid rgba(255,255,255,0.07)",
                  color: mentorMode === id ? "#00d4ff" : "#64748b",
                  fontSize: 11, fontFamily: "monospace", cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        </>}{/* end home tab */}

        {/* ── Settings tab ── */}
        {displayedHubTab === "settings" && <>

        {/* Settings row: sound + voice + auto-clear + chat toggle */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundEnabledRef.current = next;
              try { localStorage.setItem("ai-pet-sound", next ? "1" : "0"); } catch { /* ignore */ }
              if (next) playTabSwitch();
            }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "9px", borderRadius: 10, fontSize: 12, fontFamily: "monospace", cursor: "pointer",
              background: soundEnabled ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)",
              border: soundEnabled ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.08)",
              color: soundEnabled ? "#4ade80" : "#64748b",
            }}
          >
            <span style={{ fontSize: 16 }}>{soundEnabled ? "🔔" : "🔕"}</span>
            <span>Sound {soundEnabled ? "On" : "Off"}</span>
          </button>
          {ttsSupported && isAdmin && (
            <button
              onClick={toggleVoice}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "9px", borderRadius: 10, fontSize: 12, fontFamily: "monospace", cursor: "pointer",
                background: voiceEnabled ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.04)",
                border: voiceEnabled ? "1px solid rgba(0,212,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
                color: voiceEnabled ? "#00d4ff" : "#64748b",
              }}
            >
              <span style={{ fontSize: 16 }}>{voiceEnabled ? "🔊" : "🔇"}</span>
              <span>Voice {voiceEnabled ? "On" : "Off"}</span>
            </button>
          )}
          {ttsSupported && !isAdmin && !isPro && (
            <button
              onClick={() => setHubTab("subscription")}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "9px", borderRadius: 10, fontSize: 12, fontFamily: "monospace", cursor: "pointer",
                background: "rgba(245,200,66,0.06)",
                border: "1px solid rgba(245,200,66,0.22)",
                color: "rgba(245,200,66,0.75)",
              }}
            >
              <span style={{ fontSize: 16 }}>⭐</span>
              <span>Voice — PRO</span>
            </button>
          )}
          <button
            onClick={() => setAutoClear((prev) => !prev)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "9px", borderRadius: 10, fontSize: 12, fontFamily: "monospace", cursor: "pointer",
              background: autoClear ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.04)",
              border: autoClear ? "1px solid rgba(168,85,247,0.35)" : "1px solid rgba(255,255,255,0.08)",
              color: autoClear ? "#c084fc" : "#64748b",
            }}
          >
            <span style={{ fontSize: 16 }}>🗑</span>
            <span>Auto-clear {autoClear ? "On" : "Off"}</span>
          </button>
          <button
            onClick={() => { setShowFullChat((prev) => !prev); setMenuOpen(false); }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "9px", borderRadius: 10, fontSize: 12, fontFamily: "monospace", cursor: "pointer",
              background: showFullChat ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)",
              border: showFullChat ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.08)",
              color: showFullChat ? "#4ade80" : "#64748b",
            }}
          >
            <span style={{ fontSize: 16 }}>{showFullChat ? "🎙" : "💬"}</span>
            <span>{showFullChat ? "Voice" : "Chat"}</span>
          </button>
        </div>

        {/* Reset NAVI */}
        <button
          onClick={() => setResetConfirmOpen(true)}
          style={{
            width: "100%", padding: "9px", borderRadius: 10, cursor: "pointer",
            fontSize: 12, fontFamily: "monospace", letterSpacing: "0.05em",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.22)",
            color: "#f87171",
            transition: "background 0.2s ease, border-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.22)";
          }}
        >
          🔄 Reset NAVI
        </button>

        {/* ── Founder Mode badge ─────────────────────────────────────────────── */}
        {isAdmin && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            borderRadius: 12,
            background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(168,85,247,0.08) 100%)",
            border: "1px solid rgba(0,212,255,0.3)",
            boxShadow: "0 0 14px rgba(0,212,255,0.1)",
          }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontFamily: "monospace", fontWeight: "bold",
                color: "#00d4ff", letterSpacing: "0.06em",
              }}>
                Founder Mode Active
              </div>
              <div style={{
                fontSize: 9, fontFamily: "monospace", color: "rgba(0,212,255,0.55)",
                letterSpacing: "0.05em", marginTop: 1,
              }}>
                Full Access — Voice Enabled
              </div>
            </div>
            <button
              onClick={handleFounderDisable}
              style={{
                padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)",
                color: "rgba(239,68,68,0.6)", fontSize: 9, fontFamily: "monospace",
                letterSpacing: "0.05em", flexShrink: 0,
              }}
            >
              Disable
            </button>
          </div>
        )}

        {/* ── System Health button — founder only ───────────────────────────── */}
        {isAdmin && (
          <button
            onClick={() => { setShowSystemHealth(true); setMenuOpen(false); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10, cursor: "pointer",
              background: "rgba(0,212,255,0.05)",
              border: "1px solid rgba(0,212,255,0.18)",
              color: "#00d4ff", fontSize: 11, fontFamily: "monospace",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,212,255,0.10)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,212,255,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,212,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,212,255,0.18)";
            }}
          >
            <span style={{ fontSize: 14 }}>🛡</span>
            <span style={{ fontWeight: "bold", letterSpacing: "0.04em" }}>System Health</span>
            <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.5 }}>→</span>
          </button>
        )}

        {/* ── Admin Dashboard button — founder only ─────────────────────────── */}
        {isAdmin && (
          <button
            onClick={() => { setShowAdminDash(true); setMenuOpen(false); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10, cursor: "pointer",
              background: "rgba(201,162,39,0.05)",
              border: "1px solid rgba(201,162,39,0.18)",
              color: "#C9A227", fontSize: 11, fontFamily: "monospace",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,162,39,0.10)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,162,39,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,162,39,0.05)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,162,39,0.18)";
            }}
          >
            <span style={{ fontSize: 14 }}>📊</span>
            <span style={{ fontWeight: "bold", letterSpacing: "0.04em" }}>Admin Dashboard</span>
            <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.5 }}>→</span>
          </button>
        )}

        {/* ── Admin passcode input (non-admin only) ─────────────────────────── */}
        {!isAdmin && showAdminInput && (
          <div style={{
            display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(168,85,247,0.06)",
            border: "1px solid rgba(168,85,247,0.2)",
          }}>
            <div style={{
              fontSize: 10, fontFamily: "monospace", color: "rgba(168,85,247,0.7)",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              Founder Access
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="password"
                value={adminInput}
                onChange={(e) => { setAdminInput(e.target.value); setAdminError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdminUnlock(); }}
                placeholder="passcode"
                style={{
                  flex: 1, padding: "7px 10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  border: adminError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(168,85,247,0.25)",
                  color: "#e2e8f0", fontSize: 12, fontFamily: "monospace",
                  outline: "none",
                }}
              />
              <button
                onClick={handleAdminUnlock}
                style={{
                  padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                  background: "rgba(168,85,247,0.15)",
                  border: "1px solid rgba(168,85,247,0.35)",
                  color: "#c084fc", fontSize: 12, fontFamily: "monospace",
                }}
              >
                Unlock
              </button>
            </div>
            {adminError && (
              <div style={{
                fontSize: 10, fontFamily: "monospace", color: "#f87171",
                letterSpacing: "0.04em",
              }}>
                Incorrect passcode.
              </div>
            )}
          </div>
        )}

        {/* Legal footer links */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/privacy" target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 10, fontFamily: "monospace", color: "#3d4a5c",
                textDecoration: "none", letterSpacing: "0.06em",
                padding: "6px 8px",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#64748b"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#3d4a5c"; }}
            >
              Privacy Policy
            </a>
            <span style={{ fontSize: 8, color: "#1e293b" }}>·</span>
            <a href="/terms" target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 10, fontFamily: "monospace", color: "#3d4a5c",
                textDecoration: "none", letterSpacing: "0.06em",
                padding: "6px 8px",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#64748b"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#3d4a5c"; }}
            >
              Terms of Use
            </a>
          </div>
          <div style={{
            fontSize: 9, fontFamily: "monospace", color: "#1e293b",
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            Powered by Springer Industries
          </div>
        </div>

        </>}{/* end settings tab */}

        {/* ── Explore tab ── */}
        {displayedHubTab === "explore" && (() => {
          const toolBtn = (icon: string, label: string, color: string, onClick: () => void, locked: boolean) => (
            <button key={label} onClick={onClick} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 12, cursor: "pointer",
              background: locked ? "rgba(245,200,66,0.04)" : `${color}0a`,
              border: locked ? "1px solid rgba(245,200,66,0.15)" : `1px solid ${color}30`,
              color: locked ? "rgba(245,200,66,0.5)" : color,
              fontSize: 12, fontFamily: "monospace", opacity: locked ? 0.65 : 1,
            }}>
              <span style={{ fontSize: 16 }}>{locked ? "🔒" : icon}</span>
              <span style={{ fontWeight: 600, letterSpacing: "0.03em" }}>{label}</span>
              {locked ? <span style={{ marginLeft: "auto", fontSize: 7, color: "rgba(245,200,66,0.5)", letterSpacing: "0.1em" }}>PRO</span>
                      : <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.4 }}>→</span>}
            </button>
          );
          const proLocked = !isPro && !isAdmin;
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingBottom: 8 }}>

              {/* Business */}
              <div>
                <p style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.22em", color: "#C9A227", textTransform: "uppercase", marginBottom: 10 }}>Business</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {toolBtn("📄", "Resume Builder", "#4ade80", () => { if (proLocked) { setProGateFeature("Resume Builder"); return; } setShowResumeBuilder(true); setMenuOpen(false); }, proLocked)}
                  {toolBtn("🚀", "Business Plan Builder", "#f59e0b", () => { if (proLocked) { setProGateFeature("Business Plan Builder"); return; } setShowBizPlanBuilder(true); setMenuOpen(false); }, proLocked)}
                  <button onClick={() => { if (!foundersIntroSeen) { setShowFoundersIntro(true); } else { showSwitching("Founders"); track("hub_tab_switch", { tab: "founders" }); setHubTab("founders"); } }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, cursor: "pointer", background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.22)", color: "#C9A227", fontSize: 12, fontFamily: "monospace" }}>
                    <span style={{ fontSize: 16 }}>💼</span><span style={{ fontWeight: 600 }}>Founders — Work With Us</span><span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.4 }}>→</span>
                  </button>
                  <button onClick={() => { showSwitching("Podcast"); track("hub_tab_switch", { tab: "podcast" }); setHubTab("podcast"); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, cursor: "pointer", background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.18)", color: "#a855f7", fontSize: 12, fontFamily: "monospace" }}>
                    <span style={{ fontSize: 16 }}>🎙️</span><span style={{ fontWeight: 600 }}>Podcast Partnership</span><span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.4 }}>→</span>
                  </button>
                  <button onClick={() => { showSwitching("Partners"); track("hub_tab_switch", { tab: "partners" }); setHubTab("partners"); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, cursor: "pointer", background: "rgba(201,162,39,0.03)", border: "1px solid rgba(201,162,39,0.12)", color: "#C9A227", fontSize: 12, fontFamily: "monospace" }}>
                    <span style={{ fontSize: 16 }}>🤝</span><span style={{ fontWeight: 600 }}>Partners</span><span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.4 }}>→</span>
                  </button>
                </div>
              </div>

              {/* Life */}
              <div>
                <p style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.22em", color: "#34d399", textTransform: "uppercase", marginBottom: 10 }}>Life</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {toolBtn("📍", "Local Help", "#86efac", () => { if (proLocked) { setProGateFeature("Local Help"); return; } setShowLocalResources(true); setMenuOpen(false); }, proLocked)}
                  {toolBtn("⚖️", "Legal Rights Guide", "#60a5fa", () => { setShowLegalRights(true); setMenuOpen(false); }, false)}
                  {toolBtn("💛", "Family Support Finder", "#f59e0b", () => { setShowFamilySupport(true); setMenuOpen(false); }, false)}
                  <button onClick={() => { showSwitching("Truth Room"); track("hub_tab_switch", { tab: "truth" }); setHubTab("truth"); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, cursor: "pointer", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171", fontSize: 12, fontFamily: "monospace" }}>
                    <span style={{ fontSize: 16 }}>🎥</span><span style={{ fontWeight: 600 }}>Truth Room</span><span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.4 }}>→</span>
                  </button>
                </div>
              </div>

              {/* Financial */}
              <div>
                <p style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.22em", color: "#f59e0b", textTransform: "uppercase", marginBottom: 10 }}>Financial</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {toolBtn("🚗", "Affordable Auto Finder", "#4ade80", () => { setShowAutoFinder(true); setMenuOpen(false); }, false)}
                  <button onClick={() => { setShowLuckyMode(true); setMenuOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, cursor: "pointer", background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(124,58,237,0.04))", border: "1px solid rgba(245,158,11,0.22)", color: "#f59e0b", fontSize: 12, fontFamily: "monospace" }}>
                    <span style={{ fontSize: 16, filter: "drop-shadow(0 0 4px rgba(245,158,11,0.5))" }}>✦</span><span style={{ fontWeight: 600 }}>Lucky Mode</span><span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.4 }}>→</span>
                  </button>
                </div>
              </div>

              {/* Learning */}
              <div>
                <p style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.22em", color: "#00d4ff", textTransform: "uppercase", marginBottom: 10 }}>Learning</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {toolBtn("📚", "Homework Helper", "#00d4ff", () => { if (proLocked) { setProGateFeature("Homework Helper"); return; } setShowHomeworkHelper(true); setMenuOpen(false); }, proLocked)}
                  <button onClick={() => { showSwitching("NAVI Academy"); track("hub_tab_switch", { tab: "programs" }); setHubTab("programs"); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, cursor: "pointer", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", color: "#00d4ff", fontSize: 12, fontFamily: "monospace" }}>
                    <span style={{ fontSize: 16 }}>🎓</span><span style={{ fontWeight: 600 }}>Academy (STEM · AI Skills)</span><span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.4 }}>→</span>
                  </button>
                  <button onClick={() => { showSwitching("XP & Rewards"); track("hub_tab_switch", { tab: "rewards" }); setHubTab("rewards"); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, cursor: "pointer", background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.15)", color: "#c084fc", fontSize: 12, fontFamily: "monospace" }}>
                    <span style={{ fontSize: 16 }}>🎮</span><span style={{ fontWeight: 600 }}>Rewards &amp; XP</span><span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.4 }}>→</span>
                  </button>
                </div>
              </div>

              {/* PRO + Hands-Free */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={() => { showSwitching("NAVI PRO"); track("hub_tab_switch", { tab: "subscription" }); setHubTab("subscription"); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, cursor: "pointer", background: isPro ? "rgba(245,200,66,0.06)" : "rgba(255,255,255,0.03)", border: isPro ? "1px solid rgba(245,200,66,0.25)" : "1px solid rgba(245,200,66,0.15)", color: isPro ? "#f5c842" : "rgba(245,200,66,0.6)", fontSize: 12, fontFamily: "monospace" }}>
                  <span style={{ fontSize: 16 }}>⭐</span><span style={{ fontWeight: 600 }}>{isPro ? "NAVI PRO (Active)" : "Upgrade to PRO"}</span><span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.4 }}>→</span>
                </button>
                {(isPro || isAdmin) && voiceEnabled && (
                  <button onClick={toggleHandsFree}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, cursor: "pointer", background: handsFreeMode ? "rgba(0,212,255,0.10)" : "rgba(255,255,255,0.04)", border: handsFreeMode ? "1px solid rgba(0,212,255,0.35)" : "1px solid rgba(255,255,255,0.08)", color: handsFreeMode ? "#00d4ff" : "#64748b", fontSize: 12, fontFamily: "monospace" }}>
                    <span style={{ fontSize: 16 }}>🎤</span><span style={{ fontWeight: 600 }}>Hands-Free Mode</span><span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700 }}>{handsFreeMode ? "ON" : "OFF"}</span>
                  </button>
                )}
              </div>

              <div className="safe-bottom" style={{ minHeight: 8 }} />
            </div>
          );
        })()}

        {/* ── Partners tab ── */}
        {displayedHubTab === "partners" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* CherryTree header */}
            <div style={{
              padding: "20px 18px 18px",
              borderRadius: 18,
              background: "linear-gradient(135deg, rgba(201,162,39,0.08) 0%, rgba(168,85,247,0.06) 100%)",
              border: "1px solid rgba(201,162,39,0.25)",
              boxShadow: "0 4px 24px rgba(201,162,39,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Subtle radial glow behind the icon */}
              <div style={{
                position: "absolute", top: -24, right: -24,
                width: 120, height: 120, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(201,162,39,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              {/* Icon + title */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                  background: "rgba(201,162,39,0.12)",
                  border: "1px solid rgba(201,162,39,0.3)",
                  boxShadow: "0 0 12px rgba(201,162,39,0.15)",
                }}>
                  🌳
                </div>
                <div>
                  <div style={{
                    fontSize: 15, fontFamily: "monospace", fontWeight: "bold",
                    color: "#C9A227", letterSpacing: "0.04em", lineHeight: 1.2,
                  }}>
                    CherryTree Network 🤝
                  </div>
                  <div style={{
                    fontSize: 9, fontFamily: "monospace", color: "rgba(201,162,39,0.55)",
                    letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2,
                  }}>
                    Unified Partner Ecosystem
                  </div>
                </div>
              </div>

              {/* Subtitle */}
              <p style={{
                fontSize: 11, fontFamily: "monospace", color: "#94a3b8",
                lineHeight: 1.7, margin: "0 0 14px 0",
              }}>
                A growing network of organizations working together to connect underserved communities with real opportunities, resources, and support.
              </p>

              {/* Website link */}
              <a
                href="https://www.cherry-tree-foundation.org"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 8,
                  fontSize: 10, fontFamily: "monospace", fontWeight: "bold",
                  letterSpacing: "0.04em",
                  background: "rgba(0,212,255,0.07)",
                  border: "1px solid rgba(0,212,255,0.22)",
                  color: "#00d4ff",
                }}>
                  cherry-tree-foundation.org ↗
                </div>
              </a>
            </div>

            {/* Divider with label */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 2px" }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(201,162,39,0.25), rgba(255,255,255,0.04))" }} />
              <span style={{
                fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em",
                textTransform: "uppercase", color: "rgba(201,162,39,0.45)",
                flexShrink: 0,
              }}>
                Partner Organizations
              </span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(201,162,39,0.25))" }} />
            </div>

            {/* Partner cards */}
            {PARTNERS.map((p) => {
              const hovered = hoveredPartner === p.name;
              const color = p.color ?? "#94a3b8";
              return (
                <div
                  key={p.name}
                  onMouseEnter={() => setHoveredPartner(p.name)}
                  onMouseLeave={() => setHoveredPartner(null)}
                  style={{
                    borderRadius: 16,
                    padding: "16px",
                    background: hovered
                      ? `linear-gradient(135deg, rgba(255,255,255,0.05), ${color}0d)`
                      : "rgba(255,255,255,0.025)",
                    border: `1px solid ${hovered ? color + "45" : "rgba(255,255,255,0.07)"}`,
                    boxShadow: hovered
                      ? `0 8px 32px ${color}22, 0 2px 8px rgba(0,0,0,0.3)`
                      : "0 2px 8px rgba(0,0,0,0.2)",
                    transform: hovered ? "scale(1.02)" : "scale(1)",
                    transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease, background 0.18s ease, border-color 0.18s ease",
                    cursor: "default",
                    willChange: "transform",
                  }}
                >
                  {/* Icon + name row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20,
                      background: `${color}14`,
                      border: `1px solid ${color}28`,
                      boxShadow: hovered ? `0 0 12px ${color}30` : "none",
                      transition: "box-shadow 0.22s ease",
                    }}>
                      {p.icon}
                    </div>
                    <div style={{
                      fontSize: 13, fontFamily: "monospace", fontWeight: "bold",
                      color: hovered ? "#f1f5f9" : "#e2e8f0",
                      letterSpacing: "0.02em",
                      transition: "color 0.18s ease",
                    }}>
                      {p.name}
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: 11, fontFamily: "monospace", color: "#64748b",
                    lineHeight: 1.65, margin: "0 0 14px 0",
                  }}>
                    {p.desc}
                  </p>

                  {/* Visit Website button */}
                  {"url" in p && p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", borderRadius: 10,
                        fontSize: 11, fontFamily: "monospace", fontWeight: "bold",
                        letterSpacing: "0.04em",
                        background: hovered ? `${color}18` : `${color}0c`,
                        border: `1px solid ${hovered ? color + "55" : color + "30"}`,
                        color: color,
                        boxShadow: hovered ? `0 0 10px ${color}25` : "none",
                        transition: "all 0.18s ease",
                        cursor: "pointer",
                      }}>
                        Visit Website ↗
                      </div>
                    </a>
                  ) : (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", borderRadius: 10,
                      fontSize: 11, fontFamily: "monospace",
                      letterSpacing: "0.04em",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "#334155",
                    }}>
                      Website Coming Soon
                    </div>
                  )}
                </div>
              );
            })}

            {/* Safe area spacer — partners tab */}
            <div className="safe-bottom" style={{ minHeight: 8 }} />
          </div>
        )}

        {/* ── Truth Room tab ── */}
        {displayedHubTab === "truth" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Section header */}
            <div style={{
              padding: "14px 16px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(168,85,247,0.08))",
              border: "1px solid rgba(239,68,68,0.2)",
            }}>
              <div style={{
                fontSize: 16, fontFamily: "monospace", fontWeight: "bold",
                color: "#f87171", letterSpacing: "0.04em", marginBottom: 6,
              }}>
                The Truth Room 🎥
              </div>
              <p style={{
                fontSize: 11, fontFamily: "monospace", color: "#94a3b8",
                lineHeight: 1.65, margin: 0,
              }}>
                Learn the truth. Understand the history. Elevate your mind.
              </p>
            </div>

            {/* Featured video */}
            <div>
              <p style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em",
                color: "#475569", textTransform: "uppercase", margin: "0 0 8px 0" }}>
                Featured
              </p>
              <div style={{
                borderRadius: 12, overflow: "hidden",
                border: "1px solid rgba(239,68,68,0.2)",
                background: "#000",
              }}>
                <iframe
                  width="100%"
                  height="300"
                  src="https://www.youtube.com/embed/Q8mE1aq4GMo"
                  title="The Truth Room — Featured Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ display: "block" }}
                />
              </div>
            </div>

            {/* More from QuantumPen */}
            <div>
              <p style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em",
                color: "#475569", textTransform: "uppercase", margin: "0 0 8px 0" }}>
                More from QuantumPen
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "QuantumPen — Latest Drop", note: "New content added regularly" },
                  { label: "Deep History Series",       note: "Truth-based education series" },
                ].map((v) => (
                  <a
                    key={v.label}
                    href="https://youtube.com/@thequantumpen"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 14px", borderRadius: 10,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      {/* Thumbnail placeholder */}
                      <div style={{
                        width: 52, height: 38, borderRadius: 6, flexShrink: 0,
                        background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(168,85,247,0.2))",
                        border: "1px solid rgba(239,68,68,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                          <circle cx="12" cy="12" r="10" fill="rgba(239,68,68,0.3)" />
                          <polygon points="10,8 16,12 10,16" fill="#f87171" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontFamily: "monospace", color: "#e2e8f0", marginBottom: 2 }}>
                          {v.label}
                        </div>
                        <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569" }}>
                          {v.note}
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto", fontSize: 11, color: "#475569" }}>↗</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Visit Full Channel button */}
            <a
              href="https://youtube.com/@thequantumpen"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px", borderRadius: 12,
                background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(168,85,247,0.15))",
                border: "1px solid rgba(239,68,68,0.35)",
                color: "#f87171", fontSize: 12, fontFamily: "monospace", fontWeight: "bold",
                letterSpacing: "0.06em",
              }}>
                <span style={{ fontSize: 16 }}>▶</span>
                Visit Full Channel
              </div>
            </a>

            {/* Safe area spacer — truth tab */}
            <div className="safe-bottom" style={{ minHeight: 8 }} />
          </div>
        )}

        {/* ── XP & Rewards tab ── */}
        {displayedHubTab === "rewards" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Current Level card */}
            <div style={{
              padding: "18px", borderRadius: 18,
              background: "linear-gradient(135deg, rgba(168,85,247,0.10) 0%, rgba(0,212,255,0.06) 100%)",
              border: "1px solid rgba(168,85,247,0.28)",
              boxShadow: "0 4px 24px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
              position: "relative", overflow: "hidden",
            }}>
              {/* Background glow orb */}
              <div style={{
                position: "absolute", top: -30, right: -30,
                width: 120, height: 120, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(168,85,247,0.6)", marginBottom: 3 }}>
                    Your XP Level
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 32, fontFamily: "monospace", fontWeight: "bold", color: "#c084fc", textShadow: "0 0 16px rgba(168,85,247,0.7)" }}>
                      {xpLevel}
                    </span>
                    <span style={{ fontSize: 13, fontFamily: "monospace", color: "#a855f7" }}>
                      {xpLevelTitle}
                    </span>
                  </div>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24,
                  background: "rgba(168,85,247,0.12)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  boxShadow: "0 0 14px rgba(168,85,247,0.2)",
                }}>
                  🎮
                </div>
              </div>

              {/* Level progress bar */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    width: `${xpLevelProgress}%`,
                    background: "linear-gradient(90deg, #a855f7, #00d4ff)",
                    boxShadow: "0 0 8px rgba(168,85,247,0.6)",
                    transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                  }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: "monospace", color: "#475569" }}>
                <span>{bondXP} / {getXpLevelThreshold(xpLevel + 1)} XP</span>
                <span>{xpLevelProgress}%</span>
              </div>
            </div>

            {/* How you earn XP */}
            <div>
              <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#475569", marginBottom: 8 }}>
                How You Earn XP
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {XP_EARN_METHODS.map((m) => (
                  <div key={m.label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "7px 10px", borderRadius: 10,
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{m.icon}</span>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>{m.label}</span>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "#4ade80", fontWeight: "bold" }}>{m.xp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rewards divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(168,85,247,0.3), rgba(255,255,255,0.04))" }} />
              <span style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(168,85,247,0.5)", flexShrink: 0 }}>
                Reward Milestones
              </span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(168,85,247,0.3))" }} />
            </div>

            {/* PRO gate banner for rewards */}
            {!isPro && !isAdmin && (
              <button
                onClick={() => { setHubTab("subscription"); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                  background: "linear-gradient(135deg, rgba(245,200,66,0.10) 0%, rgba(245,200,66,0.04) 100%)",
                  border: "1px solid rgba(245,200,66,0.3)",
                  boxShadow: "0 0 18px rgba(245,200,66,0.10)",
                  animation: "stemFadeUp 0.4s ease forwards",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>⭐</span>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: "bold", color: "#f5c842", letterSpacing: "0.04em" }}>
                    Unlock NAVI PRO to earn rewards
                  </div>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: "#64748b", marginTop: 2, lineHeight: 1.5 }}>
                    XP and level milestones require an active subscription.
                  </div>
                </div>
                <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(245,200,66,0.6)", letterSpacing: "0.12em", flexShrink: 0 }}>
                  UPGRADE →
                </span>
              </button>
            )}

            {/* Rewards list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {LEVEL_REWARDS.map((r) => {
                const unlocked = (isPro || isAdmin) && (unlockedRewardIds.includes(r.id) || xpLevel >= r.level);
                const isCurrent = r.level === xpLevel;
                return (
                  <div
                    key={r.id}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "12px 14px", borderRadius: 14,
                      background: unlocked
                        ? "rgba(168,85,247,0.07)"
                        : "rgba(255,255,255,0.02)",
                      border: isCurrent
                        ? "1px solid rgba(168,85,247,0.5)"
                        : unlocked
                          ? "1px solid rgba(168,85,247,0.22)"
                          : "1px solid rgba(255,255,255,0.05)",
                      opacity: unlocked ? 1 : 0.55,
                      boxShadow: isCurrent ? "0 0 12px rgba(168,85,247,0.15)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18,
                      background: unlocked ? "rgba(168,85,247,0.14)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${unlocked ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.07)"}`,
                      filter: unlocked ? "none" : "grayscale(1)",
                    }}>
                      {unlocked ? r.icon : "🔒"}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: "bold", color: unlocked ? "#c084fc" : "#475569" }}>
                          {r.name}
                        </span>
                        {isCurrent && (
                          <span style={{
                            fontSize: 8, fontFamily: "monospace", letterSpacing: "0.12em",
                            textTransform: "uppercase", padding: "2px 6px", borderRadius: 4,
                            background: "rgba(168,85,247,0.2)", color: "#c084fc",
                            border: "1px solid rgba(168,85,247,0.4)",
                          }}>NEW</span>
                        )}
                      </div>
                      <p style={{ fontSize: 10, fontFamily: "monospace", color: "#475569", lineHeight: 1.5, margin: "0 0 4px 0" }}>
                        {r.desc}
                      </p>
                      <span style={{
                        fontSize: 9, fontFamily: "monospace",
                        color: unlocked ? "rgba(168,85,247,0.6)" : "#334155",
                      }}>
                        {unlocked ? "✓ Unlocked" : `Unlocks at Level ${r.level}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Safe area spacer */}
            <div className="safe-bottom" style={{ minHeight: 8 }} />
          </div>
        )}

        {/* ── Subscription tab ── */}
        {displayedHubTab === "subscription" && (
          <div style={{ padding: "10px 0 40px" }}>
            <SubscriptionPanel isPro={isPro} onActivate={handleProUnlock} />
          </div>
        )}

        {/* ── Programs / NAVI Academy tab ── */}
        {displayedHubTab === "programs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 8 }}>

            {/* Hero header */}
            <div style={{
              position: "relative", overflow: "hidden",
              textAlign: "center", padding: "20px 16px 18px",
              borderRadius: 18,
              background: "linear-gradient(160deg, rgba(0,212,255,0.07) 0%, rgba(168,85,247,0.07) 100%)",
              border: "1px solid rgba(0,212,255,0.18)",
            }}>
              {/* Ambient glow */}
              <div style={{
                position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)",
                width: 200, height: 200, borderRadius: "50%", pointerEvents: "none",
                background: "radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)",
              }} />
              <div style={{
                fontSize: 9, fontFamily: "monospace", fontWeight: "bold",
                letterSpacing: "0.28em", textTransform: "uppercase",
                color: "rgba(0,212,255,0.55)", marginBottom: 8,
              }}>
                NAVI
              </div>
              <div style={{
                fontSize: 20, fontFamily: "monospace", fontWeight: "bold",
                color: "#f1f5f9", letterSpacing: "0.06em",
                textShadow: "0 0 24px rgba(0,212,255,0.35)",
                marginBottom: 8,
              }}>
                Academy
              </div>
              <div style={{
                fontSize: 11, fontFamily: "monospace", color: "#64748b",
                lineHeight: 1.65, maxWidth: 260, margin: "0 auto",
              }}>
                Learn real-world skills. Grow with NAVI. Unlock your next level.
              </div>
              {(isPro || isAdmin) && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  marginTop: 10, padding: "3px 10px", borderRadius: 99,
                  background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.28)",
                }}>
                  <span style={{ fontSize: 8, color: "#00d4ff", fontFamily: "monospace", letterSpacing: "0.14em" }}>
                    ✓ FULL ACCESS
                  </span>
                </div>
              )}
            </div>

            {/* STEM Explorer card */}
            {(() => {
              const locked = !isPro && !isAdmin;
              return (
                <div
                  onClick={() => {
                    if (locked) { setProGateFeature("STEM Explorer"); return; }
                    openWithIntroRef.current("stem");
                    setMenuOpen(false);
                  }}
                  style={{
                    position: "relative", overflow: "hidden",
                    borderRadius: 18, cursor: "pointer",
                    background: "linear-gradient(160deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.05) 100%)",
                    border: `1px solid ${locked ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.4)"}`,
                    boxShadow: locked ? "none" : "0 0 24px rgba(99,102,241,0.18)",
                    padding: "20px 18px",
                    opacity: locked ? 0.72 : 1,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!locked) (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 36px rgba(99,102,241,0.28)";
                  }}
                  onMouseLeave={(e) => {
                    if (!locked) (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 24px rgba(99,102,241,0.18)";
                  }}
                >
                  {/* Background radial */}
                  <div style={{
                    position: "absolute", top: -20, right: -20, width: 130, height: 130,
                    borderRadius: "50%", pointerEvents: "none",
                    background: "radial-gradient(circle, rgba(99,102,241,0.16) 0%, transparent 70%)",
                  }} />

                  {/* Lock overlay */}
                  {locked && (
                    <div style={{
                      position: "absolute", top: 12, right: 12,
                      fontSize: 12, color: "rgba(99,102,241,0.55)",
                    }}>🔒</div>
                  )}

                  {/* PRO badge */}
                  {!locked && (
                    <div style={{
                      position: "absolute", top: 12, right: 12,
                      padding: "2px 8px", borderRadius: 99, fontSize: 8,
                      fontFamily: "monospace", letterSpacing: "0.14em",
                      background: "rgba(99,102,241,0.18)",
                      border: "1px solid rgba(99,102,241,0.35)",
                      color: "#818cf8",
                    }}>PRO</div>
                  )}

                  {/* Icon + title */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22,
                      background: "rgba(99,102,241,0.14)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      boxShadow: locked ? "none" : "0 0 18px rgba(99,102,241,0.28)",
                      filter: locked ? "grayscale(0.5)" : "none",
                    }}>
                      {locked ? "🔒" : "🔬"}
                    </div>
                    <div>
                      <div style={{
                        fontSize: 15, fontFamily: "monospace", fontWeight: "bold",
                        color: locked ? "#475569" : "#818cf8", letterSpacing: "0.04em",
                      }}>
                        STEM Explorer
                      </div>
                      <div style={{
                        fontSize: 9, fontFamily: "monospace", letterSpacing: "0.14em",
                        textTransform: "uppercase", color: "#334155", marginTop: 2,
                      }}>
                        Ages 8–18 · Kids Program
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: 11, fontFamily: "monospace", color: "#475569",
                    lineHeight: 1.65, margin: "0 0 14px",
                  }}>
                    Math, science, and critical thinking missions powered by AI.
                    Build real problem-solving skills through interactive, level-based lessons.
                  </p>

                  {/* CTA row */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["Math", "Science", "Logic"].map((tag) => (
                        <span key={tag} style={{
                          fontSize: 8, fontFamily: "monospace", letterSpacing: "0.1em",
                          padding: "3px 7px", borderRadius: 4,
                          background: "rgba(99,102,241,0.1)",
                          border: "1px solid rgba(99,102,241,0.22)",
                          color: locked ? "#334155" : "#6366f1",
                        }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{
                      fontSize: 10, fontFamily: "monospace", fontWeight: "bold",
                      color: locked ? "#334155" : "#818cf8",
                      letterSpacing: "0.08em",
                    }}>
                      {locked ? "🔒 PRO Only" : "Launch →"}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* AI Skills card */}
            {(() => {
              const locked = !isPro && !isAdmin;
              return (
                <div
                  onClick={() => {
                    if (locked) { setProGateFeature("AI Skills"); return; }
                    openWithIntroRef.current("ai_skills");
                    setMenuOpen(false);
                  }}
                  style={{
                    position: "relative", overflow: "hidden",
                    borderRadius: 18, cursor: "pointer",
                    background: "linear-gradient(160deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.05) 100%)",
                    border: `1px solid ${locked ? "rgba(139,92,246,0.18)" : "rgba(139,92,246,0.4)"}`,
                    boxShadow: locked ? "none" : "0 0 24px rgba(139,92,246,0.18)",
                    padding: "20px 18px",
                    opacity: locked ? 0.72 : 1,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!locked) (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 36px rgba(139,92,246,0.28)";
                  }}
                  onMouseLeave={(e) => {
                    if (!locked) (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 24px rgba(139,92,246,0.18)";
                  }}
                >
                  {/* Background radial */}
                  <div style={{
                    position: "absolute", top: -20, right: -20, width: 130, height: 130,
                    borderRadius: "50%", pointerEvents: "none",
                    background: "radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%)",
                  }} />

                  {/* Lock overlay */}
                  {locked && (
                    <div style={{
                      position: "absolute", top: 12, right: 12,
                      fontSize: 12, color: "rgba(139,92,246,0.55)",
                    }}>🔒</div>
                  )}

                  {/* PRO badge */}
                  {!locked && (
                    <div style={{
                      position: "absolute", top: 12, right: 12,
                      padding: "2px 8px", borderRadius: 99, fontSize: 8,
                      fontFamily: "monospace", letterSpacing: "0.14em",
                      background: "rgba(139,92,246,0.18)",
                      border: "1px solid rgba(139,92,246,0.35)",
                      color: "#a78bfa",
                    }}>PRO</div>
                  )}

                  {/* Icon + title */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22,
                      background: "rgba(139,92,246,0.14)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      boxShadow: locked ? "none" : "0 0 18px rgba(139,92,246,0.28)",
                      filter: locked ? "grayscale(0.5)" : "none",
                    }}>
                      {locked ? "🔒" : "⚡"}
                    </div>
                    <div>
                      <div style={{
                        fontSize: 15, fontFamily: "monospace", fontWeight: "bold",
                        color: locked ? "#475569" : "#a78bfa", letterSpacing: "0.04em",
                      }}>
                        AI Skills
                      </div>
                      <div style={{
                        fontSize: 9, fontFamily: "monospace", letterSpacing: "0.14em",
                        textTransform: "uppercase", color: "#334155", marginTop: 2,
                      }}>
                        Adults · Career Program
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: 11, fontFamily: "monospace", color: "#475569",
                    lineHeight: 1.65, margin: "0 0 14px",
                  }}>
                    Master AI tools, prompting, and digital skills to stay ahead in
                    today&apos;s economy. Real lessons built for real life and career growth.
                  </p>

                  {/* CTA row */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["Prompting", "AI Tools", "Career"].map((tag) => (
                        <span key={tag} style={{
                          fontSize: 8, fontFamily: "monospace", letterSpacing: "0.1em",
                          padding: "3px 7px", borderRadius: 4,
                          background: "rgba(139,92,246,0.1)",
                          border: "1px solid rgba(139,92,246,0.22)",
                          color: locked ? "#334155" : "#8b5cf6",
                        }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{
                      fontSize: 10, fontFamily: "monospace", fontWeight: "bold",
                      color: locked ? "#334155" : "#a78bfa",
                      letterSpacing: "0.08em",
                    }}>
                      {locked ? "🔒 PRO Only" : "Launch →"}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Unlock Adult STEM Program — Pay or Enter Code */}
            {codeStatus !== "success" && (
              <div style={{
                borderRadius: 18, overflow: "hidden",
                background: "linear-gradient(160deg, rgba(201,162,39,0.06) 0%, rgba(16,12,6,0.95) 100%)",
                border: "1px solid rgba(201,162,39,0.25)",
              }}>
                {/* Header */}
                <div style={{ padding: "16px 18px 12px" }}>
                  <div style={{ fontSize: 15, fontFamily: "monospace", fontWeight: "bold", color: "#f1f5f9", marginBottom: 4 }}>
                    ⚡ Unlock Adult STEM Program
                  </div>
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", lineHeight: 1.5 }}>
                    Choose how to get access:
                  </div>
                </div>

                {/* Option 1: Pay */}
                <div style={{ padding: "0 18px 12px" }}>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        console.log("[Stripe] Starting checkout...");
                        const res = await fetch("/api/create-checkout-session", { method: "POST" });
                        const data = await res.json();
                        console.log("[Stripe] Response:", data);
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          alert(data.error || "Could not start checkout. Please try again.");
                        }
                      } catch (err) {
                        console.error("[Stripe] Checkout error:", err);
                        alert("Could not connect to payment. Please try again.");
                      }
                    }}
                    style={{
                      width: "100%", padding: "14px 18px", borderRadius: 12, cursor: "pointer",
                      background: "linear-gradient(135deg, #C9A227, #a07818)",
                      border: "none",
                      color: "#08080f", fontFamily: "monospace", fontSize: 13,
                      fontWeight: "bold", letterSpacing: "0.06em",
                      boxShadow: "0 0 16px rgba(201,162,39,0.20)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      position: "relative", zIndex: 10,
                    }}
                  >
                    💳 One-Time Payment
                  </button>
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 18px 12px" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                  <span style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", letterSpacing: "0.12em" }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                </div>

                {/* Option 2: Access Code */}
                <div style={{ padding: "0 18px 16px" }}>
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", marginBottom: 8 }}>
                    Have an access code? Enter it below:
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={accessCode}
                      onChange={(e) => { setAccessCode(e.target.value); if (codeStatus === "error") setCodeStatus("idle"); }}
                      placeholder="Enter code..."
                      onKeyDown={(e) => { if (e.key === "Enter") handleRedeemCode(); }}
                      style={{
                        flex: 1, padding: "10px 12px", borderRadius: 10,
                        background: "rgba(255,255,255,0.04)",
                        border: codeStatus === "error"
                          ? "1px solid rgba(239,68,68,0.30)"
                          : "1px solid rgba(255,255,255,0.08)",
                        color: "#e2e8f0", fontSize: 13, fontFamily: "monospace",
                        outline: "none", letterSpacing: "0.08em",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRedeemCode}
                      disabled={codeStatus === "loading" || !accessCode.trim() || !isLoggedIn}
                      style={{
                        padding: "10px 18px", borderRadius: 10,
                        background: codeStatus === "loading"
                          ? "rgba(52,211,153,0.06)"
                          : "rgba(52,211,153,0.12)",
                        border: "1px solid rgba(52,211,153,0.30)",
                        color: "#34d399", fontSize: 12, fontFamily: "monospace",
                        fontWeight: 700, cursor: (codeStatus === "loading" || !accessCode.trim()) ? "default" : "pointer",
                        opacity: !accessCode.trim() ? 0.4 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {codeStatus === "loading" ? "..." : "Redeem"}
                    </button>
                  </div>
                  {!isLoggedIn && (
                    <div style={{ marginTop: 6, fontSize: 9, fontFamily: "monospace", color: "#64748b" }}>
                      You must be <a href="/login" style={{ color: "#C9A227", textDecoration: "none" }}>signed in</a> to use a code.
                    </div>
                  )}
                  {codeStatus === "error" && codeMessage && (
                    <div style={{ marginTop: 6, fontSize: 10, fontFamily: "monospace", color: "#f87171" }}>
                      {codeMessage}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Access unlocked success */}
            {codeStatus === "success" && (
              <div style={{
                borderRadius: 18, padding: "24px 18px",
                background: "linear-gradient(160deg, rgba(52,211,153,0.08) 0%, rgba(52,211,153,0.03) 100%)",
                border: "1px solid rgba(52,211,153,0.25)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 16, fontFamily: "monospace", fontWeight: "bold", color: "#34d399", marginBottom: 4 }}>
                  {codeMessage}
                </div>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: "#475569" }}>
                  Premium content is now available on your account.
                </div>
              </div>
            )}

            {/* Upgrade nudge for free users */}
            {!isPro && !isAdmin && (
              <button
                onClick={() => setHubTab("subscription")}
                style={{
                  width: "100%", padding: "13px", borderRadius: 14, cursor: "pointer",
                  background: "linear-gradient(135deg, rgba(245,200,66,0.12), rgba(245,200,66,0.06))",
                  border: "1px solid rgba(245,200,66,0.3)",
                  color: "#f5c842", fontFamily: "monospace", fontSize: 12,
                  fontWeight: "bold", letterSpacing: "0.06em",
                  boxShadow: "0 0 18px rgba(245,200,66,0.12)",
                  animation: "stemFadeUp 0.4s ease forwards",
                }}
              >
                ⭐ Unlock NAVI PRO to access all programs
              </button>
            )}

            {/* Safe area spacer */}
            <div className="safe-bottom" style={{ minHeight: 8 }} />
          </div>
        )}

        {/* ── Founders tab ── */}
        {displayedHubTab === "founders" && (() => {
          const GOLD = "#C9A227";
          const GOLD_DIM = "rgba(201,162,39,0.18)";
          const GOLD_GLOW = "rgba(201,162,39,0.30)";

          const SERVICES: { icon: string; title: string; desc: string; subject: string }[] = [
            { icon: "🎨", title: "Logo Generator", desc: "Create high-quality logos for your business instantly.", subject: "Logo Generator" },
            { icon: "📱", title: "Social Media", desc: "Daily content, scheduling & community management across all platforms.", subject: "Social Media Management" },
            { icon: "🎯", title: "Targeted Ads", desc: "Data-driven campaigns that reach the right audience at the right time.", subject: "Targeted Ads" },
            { icon: "🎬", title: "AI Content", desc: "AI-powered video, audio & visuals that stop the scroll and convert.", subject: "AI Commercials / Content" },
            { icon: "✍️", title: "Copywriting", desc: "Persuasive copy for ads, emails, websites, and sales funnels.", subject: "Copywriting" },
            { icon: "🌐", title: "Websites", desc: "High-converting landing pages and sites built fast with modern tools.", subject: "Websites & Landing Pages" },
            { icon: "⚙️", title: "Automation", desc: "Custom workflows and automations that save you time and money.", subject: "Automated Systems" },
            { icon: "🤖", title: "AI Agents", desc: "Intelligent agents working for your business 24/7 without breaks.", subject: "AI Agents" },
            { icon: "💎", title: "Brand Package", desc: "Identity, logos, color systems — a complete brand built for impact.", subject: "Brand Package" },
            { icon: "📊", title: "Consulting", desc: "Strategy sessions to grow your revenue and digital presence.", subject: "Marketing Consulting" },
            { icon: "🚀", title: "Startup Launch Package", desc: "We help you launch your business the right way — brand setup, content & marketing — all done for you. $600/mo.", subject: "Startup Launch Package" },
          ];

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 8 }}>

              {/* ── Hero ── */}
              <div style={{
                position: "relative", overflow: "hidden",
                padding: "22px 18px 20px", borderRadius: 20,
                background: "linear-gradient(160deg, rgba(18,14,10,0.98) 0%, rgba(28,22,8,0.98) 100%)",
                border: "1px solid rgba(201,162,39,0.35)",
                boxShadow: `0 0 36px ${GOLD_GLOW}, 0 12px 40px rgba(0,0,0,0.5)`,
              }}>
                {/* Background radial */}
                <div style={{
                  position: "absolute", top: -40, right: -40, width: 200, height: 200,
                  borderRadius: "50%", pointerEvents: "none",
                  background: `radial-gradient(circle, rgba(201,162,39,0.14) 0%, transparent 70%)`,
                }} />
                <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>
                  Springer Industries
                </div>
                <div style={{
                  fontSize: 17, fontFamily: "monospace", fontWeight: "bold",
                  color: "#f1f5f9", letterSpacing: "0.04em", marginBottom: 6,
                  textShadow: `0 0 20px ${GOLD_GLOW}`,
                }}>
                  Work With Chaz
                </div>
                <p style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b", lineHeight: 1.65, margin: 0 }}>
                  AI-powered marketing, automation, and strategy for founders who are ready to scale.
                </p>
              </div>

              {/* ── Services ── */}
              <div>
                <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.26em", textTransform: "uppercase", color: "#475569", marginBottom: 12 }}>
                  Services
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {SERVICES.map(({ icon, title, desc, subject }) => (
                    <div
                      key={title}
                      style={{
                        position: "relative", overflow: "hidden",
                        padding: "14px 12px 12px",
                        borderRadius: 14,
                        background: "linear-gradient(160deg, rgba(28,22,8,0.95) 0%, rgba(18,14,10,0.95) 100%)",
                        border: "1px solid rgba(201,162,39,0.18)",
                        display: "flex", flexDirection: "column", gap: 6,
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        cursor: "pointer",
                      }}
                      onClick={() => openServiceWithAuth({ icon, title, desc, subject })}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = "rgba(201,162,39,0.45)";
                        el.style.boxShadow = `0 0 16px ${GOLD_GLOW}`;
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = "rgba(201,162,39,0.18)";
                        el.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ fontSize: 20 }}>{icon}</div>
                      <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: "bold", color: GOLD, letterSpacing: "0.04em" }}>
                        {title}
                      </div>
                      <p style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", lineHeight: 1.6, margin: 0, flexGrow: 1 }}>
                        {desc}
                      </p>
                      <div style={{
                        fontSize: 8, fontFamily: "monospace", color: "rgba(201,162,39,0.6)",
                        letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2,
                      }}>
                        Get Started →
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Public Speaking ── */}
              <div>
                <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.26em", textTransform: "uppercase", color: "#475569", marginBottom: 12 }}>
                  Public Speaking
                </div>
                <div style={{
                  position: "relative", overflow: "hidden",
                  padding: "20px 18px", borderRadius: 18,
                  background: "linear-gradient(160deg, rgba(28,22,8,0.98) 0%, rgba(18,14,10,0.98) 100%)",
                  border: "1px solid rgba(201,162,39,0.32)",
                  boxShadow: `0 0 28px ${GOLD_GLOW}`,
                }}>
                  {/* Glow */}
                  <div style={{
                    position: "absolute", bottom: -30, left: -30, width: 180, height: 180,
                    borderRadius: "50%", pointerEvents: "none",
                    background: `radial-gradient(circle, rgba(201,162,39,0.10) 0%, transparent 70%)`,
                  }} />

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, background: GOLD_DIM,
                      border: `1px solid rgba(201,162,39,0.35)`,
                      boxShadow: `0 0 14px ${GOLD_GLOW}`,
                    }}>🎤</div>
                    <div>
                      <div style={{ fontSize: 14, fontFamily: "monospace", fontWeight: "bold", color: GOLD, letterSpacing: "0.04em" }}>
                        Book Chaz Springer
                      </div>
                      <div style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
                        Keynote · Workshop · Panel
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b", lineHeight: 1.7, margin: "0 0 14px" }}>
                    Chaz Springer is the founder of Springer Industries and creator of NAVI — an AI companion built to bridge the technology gap in underserved communities. He speaks on AI literacy, entrepreneurship, and building technology for social impact.
                  </p>

                  {/* Divider */}
                  <div style={{ height: 1, background: "rgba(201,162,39,0.12)", marginBottom: 14 }} />

                  {/* Topics */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, marginBottom: 8, opacity: 0.7 }}>
                      Speaking Topics
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {[
                        "AI & the Future of Work",
                        "Building with AI Tools",
                        "Technology for Underserved Communities",
                        "Entrepreneurship in the Digital Age",
                        "Digital Literacy & Economic Opportunity",
                      ].map((topic) => (
                        <div key={topic} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD, flexShrink: 0, opacity: 0.6 }} />
                          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#94a3b8" }}>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing tiers */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    {[
                      { tier: "Keynote", detail: "60–90 min" },
                      { tier: "Workshop", detail: "Half / Full day" },
                      { tier: "Panel", detail: "Custom" },
                    ].map(({ tier, detail }) => (
                      <div key={tier} style={{
                        flex: 1, padding: "8px 6px", borderRadius: 10, textAlign: "center",
                        background: GOLD_DIM, border: "1px solid rgba(201,162,39,0.25)",
                      }}>
                        <div style={{ fontSize: 10, fontFamily: "monospace", fontWeight: "bold", color: GOLD }}>{tier}</div>
                        <div style={{ fontSize: 8, fontFamily: "monospace", color: "#475569", marginTop: 2 }}>{detail}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing note */}
                  <div style={{
                    fontSize: 9, fontFamily: "monospace", color: "#334155",
                    textAlign: "center", marginBottom: 14, letterSpacing: "0.04em",
                  }}>
                    Contact for pricing · Virtual &amp; in-person available
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => openServiceWithAuth({ icon: "🎤", title: "Speaking Engagement", desc: "Book Chaz Springer for keynotes, workshops, and panels.", subject: "Speaking Engagement" })}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 12, cursor: "pointer",
                      background: `linear-gradient(135deg, ${GOLD}, #d4a017)`,
                      border: "none",
                      color: "#0a0a18", fontFamily: "monospace", fontSize: 12,
                      fontWeight: "bold", letterSpacing: "0.06em",
                      boxShadow: `0 4px 20px ${GOLD_GLOW}`,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                  >
                    🎙️ Start Booking Inquiry
                  </button>
                </div>
              </div>

              {/* ── General CTA ── */}
              <button
                onClick={() => window.open(`mailto:${EMAIL_RECEIVER}?subject=General%20Inquiry%3A%20Springer%20Industries`, "_blank")}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12, cursor: "pointer",
                  background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.25)",
                  color: "rgba(201,162,39,0.75)", fontFamily: "monospace", fontSize: 11,
                  letterSpacing: "0.06em", transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,162,39,0.12)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,162,39,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,162,39,0.06)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,162,39,0.25)";
                }}
              >
                📬 Contact Springer Industries
              </button>

              {/* Safe area spacer */}
              <div className="safe-bottom" style={{ minHeight: 8 }} />
            </div>
          );
        })()}

        {/* ── Podcast tab ── */}
        {displayedHubTab === "podcast" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Section label */}
            <div style={{
              fontSize: 9, fontFamily: "monospace", letterSpacing: "0.26em",
              textTransform: "uppercase", color: "#475569", marginBottom: 14,
            }}>
              Podcast
            </div>
            <PodcastPanel />
          </div>
        )}

        </div>{/* end tab content — 2-phase transition */}

      </div>

      {/* ── Achievement Dock (fixed, bottom-left) ── */}
      <AchievementDock
        bondXP={bondXP}
        newestId={levelUpPopup?.reward?.id ?? null}
      />

      {/* ── Reset Confirmation Modal ── */}
      {resetConfirmOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={() => setResetConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(320px, calc(100vw - 32px))",
              background: "rgba(8,8,18,0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 16,
              padding: "22px 20px 18px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 24px rgba(239,68,68,0.12)",
              animation: "overlayIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
              <div style={{
                fontSize: 14, fontFamily: "monospace", fontWeight: "bold",
                color: "#f87171", letterSpacing: "0.05em", marginBottom: 8,
              }}>
                Reset NAVI?
              </div>
              <div style={{
                fontSize: 11, fontFamily: "monospace", color: "#64748b", lineHeight: 1.65,
              }}>
                This will erase all XP, rewards, unlocked icons, and chat history.
                You'll start fresh as a new user.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setResetConfirmOpen(false)}
                style={{
                  flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer",
                  fontFamily: "monospace", fontSize: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748b",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                style={{
                  flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer",
                  fontFamily: "monospace", fontSize: 12, fontWeight: "bold",
                  letterSpacing: "0.05em",
                  background: "rgba(239,68,68,0.18)",
                  border: "1px solid rgba(239,68,68,0.5)",
                  color: "#f87171",
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset feedback toast ── */}
      {resetFeedback && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none">
          <div style={{
            padding: "12px 28px",
            background: "rgba(8,8,18,0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: 12,
            boxShadow: "0 4px 28px rgba(0,0,0,0.5), 0 0 20px rgba(239,68,68,0.18)",
            fontFamily: "monospace", fontSize: 13, letterSpacing: "0.06em",
            color: "#f87171",
            animation: "modeIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            🔄 NAVI has been reset
          </div>
        </div>
      )}
    </div>
    </>
    </DiagnosticProvider>
  );
}
