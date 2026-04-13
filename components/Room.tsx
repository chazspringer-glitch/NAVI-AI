"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Pet, { Mood } from "./Pet";
import BondDisplay from "./BondDisplay";
import { MentorMode } from "@/lib/storage";

// ── Layout constants ──────────────────────────────────────────────────────────
// How far from each room edge the pet center is allowed to travel
const PAD_X = 100;      // left / right
const PAD_Y_TOP = 115;  // top (antenna clears)
const PAD_Y_BOT = 95;   // bottom (label clears)

// Random-walk stays in the lower visual "floor" band
const FLOOR_Y_MIN = 0.50;
const FLOOR_Y_MAX = 0.80;

// Pixels-per-second for walk speed
const WALK_SPEED = 190;

interface RoomProps {
  mood: Mood;
  isSpeaking: boolean;
  petName: string;
  bondXP: number;
  evolutionStage: number;
  mentorMode: MentorMode;
  onModeChange: (mode: MentorMode) => void;
}

interface ClickMarker {
  x: number;
  y: number;
  id: number;
}

const MODES = [
  { id: "chat" as MentorMode, label: "Chat", icon: "💬" },
  { id: "learning" as MentorMode, label: "Learn", icon: "📚" },
  { id: "mentor" as MentorMode, label: "Mentor", icon: "⭐" },
];

export default function Room({
  mood, isSpeaking, petName, bondXP, evolutionStage, mentorMode, onModeChange,
}: RoomProps) {
  const roomRef = useRef<HTMLDivElement>(null);
  const [roomW, setRoomW] = useState(375);
  const [roomH, setRoomH] = useState(300);

  // Pet position (center point)
  const [petX, setPetX] = useState(187);
  const [petY, setPetY] = useState(200);
  const [isWalking, setIsWalking] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isJumping, setIsJumping] = useState(false);
  const [walkDuration, setWalkDuration] = useState(1.5);

  const [clickMarker, setClickMarker] = useState<ClickMarker | null>(null);

  // Refs to avoid stale closures inside timers
  const petXRef = useRef(187);
  const petYRef = useRef(200);
  const walkEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkScheduleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomWRef = useRef(375);
  const roomHRef = useRef(300);

  // ── Track room size ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = roomRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setRoomW(width);
      setRoomH(height);
      roomWRef.current = width;
      roomHRef.current = height;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Initialize pet at center-floor once real size is known
  useEffect(() => {
    if (roomW > 200 && petXRef.current === 187) {
      const x = roomW / 2;
      const y = roomH * 0.65;
      setPetX(x); setPetY(y);
      petXRef.current = x; petYRef.current = y;
    }
  }, [roomW, roomH]);

  // ── Core move function ──────────────────────────────────────────────────────
  const movePetTo = useCallback((rawX: number, rawY: number) => {
    const w = roomWRef.current;
    const h = roomHRef.current;
    const x = Math.max(PAD_X, Math.min(w - PAD_X, rawX));
    const y = Math.max(PAD_Y_TOP, Math.min(h - PAD_Y_BOT, rawY));

    const dx = x - petXRef.current;
    const dy = y - petYRef.current;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 12) return;

    const dur = Math.max(0.4, Math.min(2.8, dist / WALK_SPEED));

    setFacingRight(dx >= 0);
    setWalkDuration(dur);
    setIsWalking(true);
    setPetX(x); setPetY(y);
    petXRef.current = x; petYRef.current = y;

    if (walkEndRef.current) clearTimeout(walkEndRef.current);
    walkEndRef.current = setTimeout(() => setIsWalking(false), dur * 1000 + 80);
  }, []);

  // ── Random walk scheduler ───────────────────────────────────────────────────
  useEffect(() => {
    if (roomW < 150) return;

    const schedule = () => {
      const delay = 3000 + Math.random() * 4500;
      walkScheduleRef.current = setTimeout(() => {
        if (Math.random() > 0.38) {
          const w = roomWRef.current;
          const h = roomHRef.current;
          const x = PAD_X + Math.random() * (w - PAD_X * 2);
          const y = h * FLOOR_Y_MIN + Math.random() * h * (FLOOR_Y_MAX - FLOOR_Y_MIN);
          movePetTo(x, y);
        }
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      if (walkScheduleRef.current) clearTimeout(walkScheduleRef.current);
    };
  }, [roomW, movePetTo]);

  // ── Excited jump when pet replies ───────────────────────────────────────────
  useEffect(() => {
    if (!isSpeaking) return;
    if (walkEndRef.current) clearTimeout(walkEndRef.current);
    setIsWalking(false);
    setIsJumping(true);
    const t = setTimeout(() => setIsJumping(false), 700);
    return () => clearTimeout(t);
  }, [isSpeaking]);

  // ── Click / tap to move ─────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = roomRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setClickMarker({ x, y, id: Date.now() });
    setTimeout(() => setClickMarker(null), 650);
    movePetTo(x, y);
  }, [movePetTo]);

  // Shadow opacity deepens as pet moves lower (nearer the floor)
  const shadowOpacity = Math.min(0.45, (petY / roomH) * 0.7);

  return (
    <div
      ref={roomRef}
      className="relative flex-1 min-h-0 overflow-hidden cursor-crosshair select-none"
      style={{ minHeight: 240 }}
      onClick={handleClick}
    >

      {/* ── Wall (top 62%) ──────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-0" style={{ height: "62%", background: "#0c0c1c" }}>

        {/* Subtle wall grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }} />

        {/* Ambient wall glow (top-center) */}
        <div className="absolute pointer-events-none" style={{
          top: 0, left: "50%", transform: "translateX(-50%)",
          width: "60%", height: 80,
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 70%)",
        }} />

        {/* ── Space window (top-right) ─────────────────────────────────── */}
        <div className="absolute pointer-events-none" style={{ top: "14%", right: "7%", width: 76, height: 58 }}>
          <div style={{
            width: "100%", height: "100%",
            border: "1px solid rgba(0,212,255,0.35)",
            borderRadius: 4,
            background: "linear-gradient(160deg, #000818 0%, #000510 100%)",
            boxShadow: "0 0 16px rgba(0,212,255,0.12), inset 0 0 24px rgba(0,212,255,0.04)",
            overflow: "hidden",
            position: "relative",
          }}>
            {/* Stars */}
            {[
              { x: "18%", y: "22%", r: 1.5 }, { x: "60%", y: "12%", r: 1 },
              { x: "44%", y: "58%", r: 2 },   { x: "82%", y: "35%", r: 1 },
              { x: "12%", y: "72%", r: 1.5 }, { x: "72%", y: "70%", r: 1 },
              { x: "35%", y: "88%", r: 1 },   { x: "90%", y: "55%", r: 1.5 },
            ].map((s, i) => (
              <div key={i} style={{
                position: "absolute", left: s.x, top: s.y,
                width: s.r * 2, height: s.r * 2, borderRadius: "50%",
                background: "rgba(210,225,255,0.85)",
              }} />
            ))}
            {/* Planet */}
            <div style={{
              position: "absolute", right: "14%", bottom: "16%",
              width: 15, height: 15, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, rgba(200,160,255,0.9) 0%, rgba(120,60,200,0.6) 60%, transparent 100%)",
            }} />
          </div>
          {/* Windowsill */}
          <div style={{
            width: "112%", height: 3, marginLeft: "-6%", marginTop: 1,
            background: "rgba(0,212,255,0.3)", borderRadius: 2,
            boxShadow: "0 0 8px rgba(0,212,255,0.25)",
          }} />
        </div>

        {/* ── Digital display (top-left) ──────────────────────────────── */}
        <div className="absolute pointer-events-none" style={{ top: "16%", left: "7%" }}>
          <div style={{
            padding: "5px 10px",
            border: "1px solid rgba(0,212,255,0.2)",
            borderRadius: 4,
            background: "rgba(0,212,255,0.04)",
            boxShadow: "0 0 10px rgba(0,212,255,0.07)",
          }}>
            <div style={{
              fontFamily: "monospace", fontSize: 10,
              color: "rgba(0,212,255,0.55)", letterSpacing: 3,
            }}>
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>

        {/* ── Wall banner / poster (center-left) ─────────────────────── */}
        <div className="absolute pointer-events-none" style={{ top: "45%", left: "18%", width: 44, height: 32 }}>
          <div style={{
            width: "100%", height: "100%",
            border: "1px solid rgba(168,85,247,0.25)",
            borderRadius: 3,
            background: "rgba(168,85,247,0.05)",
            padding: "4px 5px",
          }}>
            <div style={{ height: 2, background: "rgba(168,85,247,0.4)", borderRadius: 1, marginBottom: 3 }} />
            <div style={{ height: 2, background: "rgba(168,85,247,0.25)", borderRadius: 1, marginBottom: 3 }} />
            <div style={{ height: 2, background: "rgba(168,85,247,0.35)", borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* ── Baseboard glow line ──────────────────────────────────────────── */}
      <div className="absolute inset-x-0 pointer-events-none" style={{
        top: "62%", height: 2,
        background: "rgba(0,212,255,0.3)",
        boxShadow: "0 0 10px rgba(0,212,255,0.35), 0 -6px 20px rgba(0,212,255,0.06)",
      }} />

      {/* ── Floor (bottom 38%) ──────────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ top: "62%", background: "#09090f" }}>

        {/* Horizontal floor lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(0,212,255,0.045) 1px, transparent 1px)",
          backgroundSize: "100% 22px",
        }} />

        {/* Vertical floor lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(90deg, rgba(0,212,255,0.022) 1px, transparent 1px)",
          backgroundSize: "44px 100%",
        }} />

        {/* Terminal on floor — left */}
        <div className="absolute" style={{ bottom: "7%", left: "6%", width: 32, height: 26 }}>
          <div style={{
            width: "100%", height: "100%",
            border: "1px solid rgba(0,212,255,0.25)",
            borderRadius: 3,
            background: "rgba(0,212,255,0.04)",
            padding: "4px 5px",
          }}>
            <div style={{ height: 2, background: "rgba(0,212,255,0.45)", borderRadius: 1, marginBottom: 3 }} />
            <div style={{ height: 2, background: "rgba(0,212,255,0.2)", borderRadius: 1, marginBottom: 3 }} />
            <div style={{ height: 2, background: "rgba(0,212,255,0.35)", borderRadius: 1 }} />
          </div>
        </div>

        {/* Charging pad — right */}
        <div className="absolute" style={{ bottom: "6%", right: "7%", width: 42, height: 8 }}>
          <div style={{
            width: "100%", height: "100%", borderRadius: 4,
            background: "rgba(168,85,247,0.12)",
            border: "1px solid rgba(168,85,247,0.35)",
            boxShadow: "0 0 10px rgba(168,85,247,0.18)",
          }} />
        </div>
      </div>

      {/* ── Click ripple marker ──────────────────────────────────────────── */}
      {clickMarker && (
        <div
          key={clickMarker.id}
          className="absolute pointer-events-none animate-ping"
          style={{
            left: clickMarker.x, top: clickMarker.y,
            width: 22, height: 22,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            border: "2px solid rgba(0,212,255,0.75)",
          }}
        />
      )}

      {/* ── Pet shadow ──────────────────────────────────────────────────── */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: petX, top: petY + 86,
          width: 90, height: 18,
          transform: "translate(-50%, 0)",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)",
          opacity: shadowOpacity,
          transition: isWalking
            ? `left ${walkDuration}s cubic-bezier(0.4,0,0.2,1), top ${walkDuration}s cubic-bezier(0.4,0,0.2,1)`
            : "left 0.25s ease, top 0.25s ease",
          filter: "blur(4px)",
        }}
      />

      {/* ── Pet ─────────────────────────────────────────────────────────── */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: petX, top: petY,
          transform: "translate(-50%, -50%)",
          transition: isWalking
            ? `left ${walkDuration}s cubic-bezier(0.4, 0, 0.2, 1), top ${walkDuration}s cubic-bezier(0.4, 0, 0.2, 1)`
            : "left 0.25s ease, top 0.25s ease",
          zIndex: 20,
          willChange: "left, top",
        }}
      >
        <Pet
          mood={mood}
          isSpeaking={isSpeaking}
          petName={petName}
          isWalking={isWalking}
          facingRight={facingRight}
          isJumping={isJumping}
          evolutionStage={evolutionStage}
        />
      </div>

      {/* ── Bond bar overlay (bottom of room) ───────────────────────────── */}
      <div
        className="absolute bottom-0 inset-x-0 px-3 py-2 pointer-events-none"
        style={{
          zIndex: 30,
          background: "linear-gradient(to top, rgba(8,8,15,0.85) 0%, transparent 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-auto max-w-sm mx-auto">
          <BondDisplay bondXP={bondXP} />
        </div>
      </div>

      {/* ── Mode toggle (bottom-right corner) ───────────────────────────── */}
      <div
        className="absolute bottom-2 right-3 pointer-events-auto"
        style={{ zIndex: 31 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{
            background: "rgba(8,8,15,0.85)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(8px)",
          }}
        >
          {MODES.map(({ id, label, icon }) => {
            const active = mentorMode === id;
            return (
              <button
                key={id}
                onClick={() => onModeChange(id)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-200"
                style={active ? {
                  background:
                    id === "learning" ? "rgba(74,222,128,0.15)" :
                    id === "mentor" ? "rgba(251,191,36,0.15)" :
                    "rgba(0,212,255,0.15)",
                  border:
                    id === "learning" ? "1px solid rgba(74,222,128,0.4)" :
                    id === "mentor" ? "1px solid rgba(251,191,36,0.4)" :
                    "1px solid rgba(0,212,255,0.4)",
                  color:
                    id === "learning" ? "#4ade80" :
                    id === "mentor" ? "#fbbf24" :
                    "#00d4ff",
                } : {
                  color: "#475569",
                  border: "1px solid transparent",
                }}
              >
                <span>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
