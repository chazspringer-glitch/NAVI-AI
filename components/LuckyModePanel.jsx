"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Theme ─────────────────────────────────────────────────────────────────────
const GOLD    = "#f59e0b";
const PURPLE  = "#7c3aed";
const PURPLE2 = "#a78bfa";
const STAR    = "#ffd700";
const DAILY_XP = 25;

// ── Lottery helpers ───────────────────────────────────────────────────────────
function pickUnique(count, max, min = 1) {
  const pool = new Set();
  while (pool.size < count) pool.add(Math.floor(Math.random() * (max - min + 1)) + min);
  return [...pool].sort((a, b) => a - b);
}
function generateSet() {
  return { main: pickUnique(5, 69), power: Math.floor(Math.random() * 26) + 1 };
}
function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ── Particle data (generated once per panel open) ─────────────────────────────
function makeParticles(count = 30) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x:  (Math.random() - 0.5) * 240,
    y:  (Math.random() - 0.5) * 240,
    size: Math.random() * 5 + 3,
    delay: Math.random() * 1.4,
    duration: Math.random() * 1.8 + 1.6,
    color: [GOLD, PURPLE2, STAR, "#f472b6", "#60a5fa"][i % 5],
    char: ["★", "✦", "◆", "✧", "·"][i % 5],
  }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LotteryBall({ num, color = "white", revealed = true, delay = 0, size = 48 }) {
  const isWhite  = color === "white";
  const isPower  = color === "power";
  const bg       = isPower ? "linear-gradient(135deg, #ef4444, #dc2626)"
                            : "linear-gradient(145deg, #f8fafc, #e2e8f0)";
  const textCol  = isPower ? "#fff" : "#1e293b";
  const shadowCol= isPower ? "rgba(239,68,68,0.7)" : "rgba(245,158,11,0.55)";

  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%,",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: bg,
        border: isPower ? "2px solid rgba(239,68,68,0.6)" : "2px solid rgba(245,158,11,0.45)",
        boxShadow: revealed ? `0 0 14px ${shadowCol}, inset 0 2px 4px rgba(255,255,255,0.35)` : "none",
        fontSize: num > 9 ? size * 0.28 : size * 0.32,
        fontFamily: "monospace",
        fontWeight: "bold",
        color: textCol,
        flexShrink: 0,
        opacity: revealed ? 1 : 0,
        animation: revealed ? `luckyBallReveal 0.55s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both` : "none",
        borderRadius: "50%",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.3s ease",
      }}
    >
      {/* Shine */}
      <div style={{
        position: "absolute", top: "12%", left: "15%",
        width: "35%", height: "25%", borderRadius: "50%",
        background: "rgba(255,255,255,0.50)",
        transform: "rotate(-30deg)",
        pointerEvents: "none",
      }} />
      {num || "?"}
    </div>
  );
}

function SectionHeader({ label, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{
        fontSize: 10, fontFamily: "monospace", fontWeight: "bold",
        letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD,
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Cinematic intro ───────────────────────────────────────────────────────────
function CinematicIntro({ onDone, particles }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      onClick={onDone}
      style={{
        position: "absolute", inset: 0, zIndex: 10,
        background: "radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.28) 0%, rgba(8,6,20,0.98) 65%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: "50%", top: "50%",
            width: p.size, height: p.size,
            fontSize: p.size + 2,
            color: p.color,
            fontFamily: "monospace",
            "--lx": `${p.x}px`,
            "--ly": `${p.y}px`,
            animation: `luckyParticle ${p.duration}s ease ${p.delay}s both`,
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          {p.char}
        </div>
      ))}

      {/* Radial glow ring */}
      <div style={{
        position: "absolute", left: "50%", top: "44%",
        transform: "translate(-50%, -50%)",
        width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)",
        animation: "luckyHeroPulse 1.8s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Title */}
      <div style={{
        fontSize: 26, fontFamily: "monospace", fontWeight: "bold",
        textAlign: "center", letterSpacing: "0.05em",
        background: `linear-gradient(135deg, ${STAR}, ${GOLD}, ${PURPLE2})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "luckyIntroIn 2.6s ease forwards",
        lineHeight: 1.2, padding: "0 24px",
        textShadow: "none",
        filter: "drop-shadow(0 0 18px rgba(245,158,11,0.55))",
      }}>
        ✦ Welcome to Lucky Mode ✦
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: 13, fontFamily: "monospace",
        color: PURPLE2, letterSpacing: "0.14em",
        marginTop: 10, textAlign: "center",
        animation: "luckySubtitleIn 2.6s ease forwards",
      }}>
        Where chance meets destiny
      </div>

      {/* Tap hint */}
      <div style={{
        position: "absolute", bottom: 32,
        fontSize: 9, fontFamily: "monospace",
        color: "rgba(167,139,250,0.4)", letterSpacing: "0.14em",
        animation: "luckySubtitleIn 2.6s ease forwards",
      }}>
        tap to skip
      </div>
    </div>
  );
}

// ── Daily Luck section ────────────────────────────────────────────────────────
function DailyLuck({ onXpEarned }) {
  const [numbers, setNumbers] = useState(null); // { main, power, date }
  const [justTapped, setJustTapped] = useState(false);
  const [alreadyToday, setAlreadyToday] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("lucky-daily") || "null");
      if (saved?.date === todayKey()) {
        setNumbers(saved);
        setAlreadyToday(true);
      }
    } catch { /* ignore */ }
  }, []);

  const handleTap = useCallback(() => {
    if (alreadyToday || justTapped) return;
    const fresh = { ...generateSet(), date: todayKey() };
    try { localStorage.setItem("lucky-daily", JSON.stringify(fresh)); } catch { /* ignore */ }
    setNumbers(fresh);
    setAlreadyToday(true);
    setJustTapped(true);
    onXpEarned?.(DAILY_XP);
    console.log(`[LuckyMode] Daily luck revealed — +${DAILY_XP} XP`);
  }, [alreadyToday, justTapped, onXpEarned]);

  return (
    <div style={{
      borderRadius: 20,
      background: "linear-gradient(160deg, rgba(28,18,50,0.97), rgba(18,10,35,0.97))",
      border: `1px solid rgba(124,58,237,0.35)`,
      padding: "18px 16px",
      animation: "luckyHeroPulse 3s ease-in-out infinite",
    }}>
      <SectionHeader label="Daily Luck" icon="🌟" />

      {!numbers ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{
            fontSize: 9, fontFamily: "monospace", color: PURPLE2,
            letterSpacing: "0.10em", textAlign: "center", lineHeight: 1.65,
          }}>
            Tap once per day to reveal your lucky numbers and earn {DAILY_XP} XP.
          </div>
          <button
            onClick={handleTap}
            style={{
              padding: "13px 32px", borderRadius: 14, cursor: "pointer",
              background: `linear-gradient(135deg, ${GOLD}, #d97706)`,
              border: "none", color: "#1a0a00",
              fontFamily: "monospace", fontWeight: "bold",
              fontSize: 13, letterSpacing: "0.06em",
              animation: "luckyTapPulse 2.2s ease-in-out infinite",
              boxShadow: `0 4px 24px rgba(245,158,11,0.35)`,
            }}
          >
            ✦ Reveal Today's Numbers
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          {justTapped && (
            <div style={{
              fontSize: 11, fontFamily: "monospace", fontWeight: "bold",
              color: "#4ade80", letterSpacing: "0.08em",
              animation: "luckySubtitleIn 0.6s ease forwards",
            }}>
              +{DAILY_XP} XP earned! ✦
            </div>
          )}

          {/* Ball row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {numbers.main.map((n, i) => (
              <LotteryBall key={i} num={n} color="white" delay={i * 0.14} size={44} />
            ))}
            <div style={{ width: 2, background: `rgba(245,158,11,0.3)`, borderRadius: 1, alignSelf: "stretch" }} />
            <LotteryBall num={numbers.power} color="power" delay={numbers.main.length * 0.14} size={44} />
          </div>

          <div style={{
            fontSize: 9, fontFamily: "monospace", textAlign: "center", lineHeight: 1.65,
            color: "rgba(167,139,250,0.45)",
          }}>
            {alreadyToday && !justTapped
              ? "You've already revealed today's numbers. Come back tomorrow!"
              : "White balls = Main · Red ball = Power"}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reveal My Numbers section ─────────────────────────────────────────────────
function RevealNumbers() {
  const [phase,   setPhase]   = useState("idle"); // idle | revealing | done
  const [numbers, setNumbers] = useState(null);
  const [revealed, setRevealed] = useState(0);
  const timerRef = useRef(null);

  const handleReveal = useCallback(() => {
    if (phase === "revealing") return;
    const fresh = generateSet();
    setNumbers(fresh);
    setRevealed(0);
    setPhase("revealing");

    // Reveal one by one
    const total = fresh.main.length + 1; // 5 + powerball
    for (let i = 1; i <= total; i++) {
      timerRef.current = setTimeout(() => {
        setRevealed(i);
        if (i === total) setPhase("done");
      }, i * 350);
    }
  }, [phase]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div style={{
      borderRadius: 18,
      background: "linear-gradient(160deg, rgba(18,10,28,0.97), rgba(10,6,20,0.97))",
      border: `1px solid rgba(245,158,11,0.20)`,
      padding: "16px",
    }}>
      <SectionHeader label="Reveal My Numbers" icon="🎯" />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        {/* Ball slots */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", minHeight: 52 }}>
          {numbers ? (
            <>
              {numbers.main.map((n, i) => (
                <LotteryBall
                  key={i} num={n} color="white"
                  revealed={revealed > i}
                  delay={0}
                  size={46}
                />
              ))}
              <div style={{ width: 2, background: `rgba(245,158,11,0.25)`, borderRadius: 1, alignSelf: "stretch" }} />
              <LotteryBall
                num={numbers.power} color="power"
                revealed={revealed > numbers.main.length}
                delay={0}
                size={46}
              />
            </>
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                width: 46, height: 46, borderRadius: "50%",
                border: "2px dashed rgba(245,158,11,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, color: "rgba(245,158,11,0.18)",
              }}>?</div>
            ))
          )}
        </div>

        {phase === "done" && (
          <div style={{
            fontSize: 9, fontFamily: "monospace", color: PURPLE2,
            letterSpacing: "0.08em", textAlign: "center",
          }}>
            5 main · 1 power · Good luck! ✦
          </div>
        )}

        <button
          onClick={handleReveal}
          disabled={phase === "revealing"}
          style={{
            padding: "10px 24px", borderRadius: 12, cursor: phase === "revealing" ? "not-allowed" : "pointer",
            background: phase === "revealing"
              ? "rgba(245,158,11,0.12)"
              : `linear-gradient(135deg, rgba(245,158,11,0.18), rgba(124,58,237,0.15))`,
            border: `1px solid rgba(245,158,11,${phase === "revealing" ? "0.15" : "0.40"})`,
            color: phase === "revealing" ? "rgba(245,158,11,0.4)" : GOLD,
            fontFamily: "monospace", fontSize: 11, fontWeight: "bold",
            letterSpacing: "0.08em", transition: "all 0.2s ease",
          }}
        >
          {phase === "idle" ? "✦ Generate New Set" : phase === "revealing" ? "Revealing…" : "↺ Generate Again"}
        </button>
      </div>
    </div>
  );
}

// ── Check My Numbers section ──────────────────────────────────────────────────
function CheckNumbers() {
  const EMPTY = ["", "", "", "", "", ""];
  const [inputs, setInputs] = useState(EMPTY);
  const [saved, setSaved]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("lucky-saved-numbers") || "null"); } catch { return null; }
  });
  const [saveMsg, setSaveMsg] = useState("");

  const handleChange = (i, val) => {
    const digits = val.replace(/\D/g, "").slice(0, 2);
    setInputs((prev) => { const next = [...prev]; next[i] = digits; return next; });
  };

  const handleSave = () => {
    const nums = inputs.map((v) => parseInt(v, 10)).filter((n) => !isNaN(n));
    if (nums.length < 6) { setSaveMsg("Enter all 6 numbers first."); return; }
    const entry = { main: nums.slice(0, 5), power: nums[5], savedAt: new Date().toLocaleDateString() };
    try { localStorage.setItem("lucky-saved-numbers", JSON.stringify(entry)); } catch { /* ignore */ }
    setSaved(entry);
    setSaveMsg("Numbers saved! ✓");
    setTimeout(() => setSaveMsg(""), 2500);
  };

  const handleClear = () => {
    setInputs(EMPTY);
    setSaved(null);
    setSaveMsg("");
    try { localStorage.removeItem("lucky-saved-numbers"); } catch { /* ignore */ }
  };

  return (
    <div style={{
      borderRadius: 18,
      background: "linear-gradient(160deg, rgba(18,10,28,0.97), rgba(10,6,20,0.97))",
      border: "1px solid rgba(167,139,250,0.18)",
      padding: "16px",
    }}>
      <SectionHeader label="Check My Numbers" icon="🎫" />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ fontSize: 9, fontFamily: "monospace", color: "#475569", lineHeight: 1.65, margin: 0 }}>
          Save your lottery numbers here. 5 main + 1 power ball.
        </p>

        {/* Inputs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
          {inputs.slice(0, 5).map((v, i) => (
            <input
              key={i}
              value={v}
              onChange={(e) => handleChange(i, e.target.value)}
              placeholder="—"
              maxLength={2}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                textAlign: "center",
                background: "linear-gradient(145deg, #f8fafc, #e2e8f0)",
                border: "2px solid rgba(245,158,11,0.35)",
                color: "#1e293b",
                fontFamily: "monospace", fontWeight: "bold", fontSize: 14,
                outline: "none",
                boxShadow: v ? `0 0 10px rgba(245,158,11,0.35)` : "none",
              }}
            />
          ))}
          <div style={{
            width: 2, background: "rgba(245,158,11,0.25)", borderRadius: 1, alignSelf: "stretch",
          }} />
          <input
            value={inputs[5]}
            onChange={(e) => handleChange(5, e.target.value)}
            placeholder="—"
            maxLength={2}
            style={{
              width: 44, height: 44, borderRadius: "50%",
              textAlign: "center",
              background: "linear-gradient(135deg, #fecaca, #fca5a5)",
              border: "2px solid rgba(239,68,68,0.45)",
              color: "#7f1d1d",
              fontFamily: "monospace", fontWeight: "bold", fontSize: 14,
              outline: "none",
              boxShadow: inputs[5] ? "0 0 10px rgba(239,68,68,0.30)" : "none",
            }}
          />
        </div>

        {/* Saved set display */}
        {saved && (
          <div style={{
            padding: "10px 12px", borderRadius: 10,
            background: "rgba(167,139,250,0.07)",
            border: "1px solid rgba(167,139,250,0.18)",
          }}>
            <div style={{ fontSize: 9, fontFamily: "monospace", color: PURPLE2, marginBottom: 6, letterSpacing: "0.10em" }}>
              SAVED — {saved.savedAt}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {saved.main.map((n, i) => (
                <LotteryBall key={i} num={n} color="white" delay={i * 0.1} size={36} />
              ))}
              <div style={{ width: 2, background: "rgba(245,158,11,0.25)", borderRadius: 1, alignSelf: "stretch" }} />
              <LotteryBall num={saved.power} color="power" delay={0.5} size={36} />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer",
              background: "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(124,58,237,0.12))",
              border: "1px solid rgba(245,158,11,0.35)",
              color: GOLD, fontFamily: "monospace", fontSize: 11, fontWeight: "bold",
              letterSpacing: "0.06em",
            }}
          >
            💾 Save Numbers
          </button>
          {saved && (
            <button
              onClick={handleClear}
              style={{
                padding: "9px 14px", borderRadius: 10, cursor: "pointer",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#475569", fontFamily: "monospace", fontSize: 11,
              }}
            >
              Clear
            </button>
          )}
        </div>

        {saveMsg && (
          <div style={{
            fontSize: 10, fontFamily: "monospace", textAlign: "center",
            color: saveMsg.includes("Enter") ? "#fca5a5" : "#4ade80",
          }}>
            {saveMsg}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reminders section ─────────────────────────────────────────────────────────
const DRAW_DAYS = [
  { id: 2, label: "Tuesday",   draw: "Mega Millions" },
  { id: 3, label: "Wednesday", draw: "Powerball"     },
  { id: 5, label: "Friday",    draw: "Mega Millions" },
  { id: 6, label: "Saturday",  draw: "Powerball"     },
];

function Reminders() {
  const [active, setActive] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lucky-reminders") || "[3,6]"); } catch { return [3, 6]; }
  });

  const toggle = (id) => {
    setActive((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem("lucky-reminders", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const today = new Date().getDay();
  const todayDraws = DRAW_DAYS.filter((d) => d.id === today && active.includes(d.id));

  return (
    <div style={{
      borderRadius: 18,
      background: "linear-gradient(160deg, rgba(18,10,28,0.97), rgba(10,6,20,0.97))",
      border: "1px solid rgba(245,158,11,0.16)",
      padding: "16px",
    }}>
      <SectionHeader label="Draw Reminders" icon="🔔" />

      {todayDraws.length > 0 && (
        <div style={{
          marginBottom: 12, padding: "9px 12px", borderRadius: 10,
          background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(124,58,237,0.08))",
          border: `1px solid rgba(245,158,11,0.35)`,
          animation: "luckyTapPulse 2s ease-in-out infinite",
        }}>
          <p style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, margin: 0, lineHeight: 1.65 }}>
            🎫 {todayDraws.map((d) => d.draw).join(" & ")} draws today — good luck!
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DRAW_DAYS.map((d) => {
          const on = active.includes(d.id);
          return (
            <div
              key={d.id}
              onClick={() => toggle(d.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                background: on ? "rgba(245,158,11,0.07)" : "rgba(255,255,255,0.02)",
                border: on ? "1px solid rgba(245,158,11,0.30)" : "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.2s ease",
              }}
            >
              <div>
                <div style={{
                  fontSize: 11, fontFamily: "monospace", fontWeight: "bold",
                  color: on ? GOLD : "#64748b",
                }}>
                  {d.label}
                </div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: on ? PURPLE2 : "#334155", marginTop: 1 }}>
                  {d.draw}
                </div>
              </div>
              <div style={{
                width: 36, height: 20, borderRadius: 10,
                background: on ? `linear-gradient(90deg, ${GOLD}, #d97706)` : "rgba(255,255,255,0.06)",
                border: on ? "none" : "1px solid rgba(255,255,255,0.08)",
                position: "relative", transition: "all 0.25s ease",
              }}>
                <div style={{
                  position: "absolute", top: 2, borderRadius: "50%",
                  width: 16, height: 16,
                  background: on ? "#1a0a00" : "#334155",
                  left: on ? "calc(100% - 18px)" : 2,
                  transition: "left 0.25s ease, background 0.25s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <p style={{
        fontSize: 9, fontFamily: "monospace", color: "#334155",
        lineHeight: 1.65, marginTop: 10, marginBottom: 0,
      }}>
        Enabled days show a reminder banner when you open Lucky Mode.
      </p>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function LuckyModePanel({ onClose, onXpEarned }) {
  const [phase,     setPhase]     = useState("intro"); // intro | main
  const [particles] = useState(() => makeParticles(30));

  const handleIntroDone = useCallback(() => setPhase("main"), []);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ background: "rgba(8,6,20,0.98)" }}
    >
      {/* ── Cinematic intro (absolutely positioned over main) ── */}
      {phase === "intro" && (
        <CinematicIntro onDone={handleIntroDone} particles={particles} />
      )}

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(245,158,11,0.10)" }}
      >
        <div className="flex flex-col gap-0.5">
          <span
            className="text-xs font-mono font-bold tracking-widest uppercase"
            style={{
              background: `linear-gradient(135deg, ${STAR}, ${GOLD}, ${PURPLE2})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 8px rgba(245,158,11,0.35))",
            }}
          >
            ✦ Lucky Mode
          </span>
          <span className="text-[10px] font-mono tracking-wide" style={{ color: "#334155" }}>
            Premium · Your numbers · Your destiny
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* ── Scrollable main content ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
        style={{ scrollbarWidth: "none" }}
      >
        <DailyLuck onXpEarned={onXpEarned} />
        <RevealNumbers />
        <CheckNumbers />
        <Reminders />

        {/* ── Disclaimer ── */}
        <div
          className="rounded-2xl px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <p className="text-[9px] font-mono leading-relaxed text-center"
             style={{ color: "rgba(100,116,139,0.55)", margin: 0 }}>
            ⚠ Lucky Mode provides number suggestions for entertainment only.
            No guarantees of winnings. Play responsibly.
            Results are randomly generated and are not affiliated with any lottery organization.
          </p>
        </div>

        <div style={{ minHeight: 12 }} />
      </div>
    </div>
  );
}
