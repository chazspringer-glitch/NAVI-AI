"use client";

import { useState } from "react";

const STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];

const CDL_STEPS = [
  { num: "1", title: "Get Your CDL Learner's Permit", desc: "Study the CDL manual for your state. Pass the written knowledge test at your local DMV. You'll need your regular driver's license, medical card (DOT physical), and ID.", color: "#00d4ff" },
  { num: "2", title: "Enroll in CDL Training", desc: "Find a certified CDL school (many offer free or sponsored programs). Training typically takes 3–8 weeks and covers classroom + behind-the-wheel hours.", color: "#34d399" },
  { num: "3", title: "Complete Required Training Hours", desc: "Federal ELDT (Entry Level Driver Training) requires theory + range + road training from a registered provider. Log all hours.", color: "#C9A227" },
  { num: "4", title: "Pass the CDL Skills Test", desc: "Three parts: pre-trip vehicle inspection, basic vehicle control (backing, parking), and road driving test. Practice each section.", color: "#a855f7" },
  { num: "5", title: "Get Your CDL & Start Working", desc: "Once you pass, your CDL is issued. Apply to trucking companies — many hire immediately and offer sign-on bonuses.", color: "#f59e0b" },
];

const PRACTICE_QUESTIONS = [
  { q: "What is the minimum age to obtain an interstate CDL?", options: ["18", "19", "21", "25"], answer: 2 },
  { q: "During a pre-trip inspection, you should check:", options: ["Only tires", "Only brakes", "All major systems", "Just the engine"], answer: 2 },
  { q: "The safe following distance for a loaded truck at highway speed is:", options: ["1 second", "3 seconds", "7+ seconds", "Same as a car"], answer: 2 },
  { q: "What does 'GVWR' stand for?", options: ["Gross Vehicle Weight Rating", "General Vehicle Width Ratio", "Gross Velocity Weight Requirement", "None of the above"], answer: 0 },
  { q: "When backing a tractor-trailer, you should:", options: ["Back quickly", "Use a spotter when possible", "Never check mirrors", "Ignore the trailer"], answer: 1 },
  { q: "Air brakes must be drained of moisture because:", options: ["It improves fuel economy", "Water can freeze and cause brake failure", "It reduces noise", "It's optional"], answer: 1 },
  { q: "A CDL is required for vehicles over:", options: ["10,000 lbs GVWR", "16,001 lbs GVWR", "26,001 lbs GVWR", "30,000 lbs GVWR"], answer: 2 },
];

const EARNINGS = [
  { role: "Entry-Level (Year 1)", range: "$45K–$55K", note: "OTR long-haul, most companies" },
  { role: "Experienced (2–5 yrs)", range: "$60K–$80K", note: "Regional or dedicated routes" },
  { role: "Specialized (Hazmat/Tanker)", range: "$70K–$95K", note: "Extra endorsements = extra pay" },
  { role: "Owner-Operator", range: "$100K–$200K+", note: "Higher earning, higher responsibility" },
  { role: "Local Delivery", range: "$50K–$70K", note: "Home every night" },
];

function buildSearchUrl(type: string, state: string) {
  const st = encodeURIComponent(state);
  switch (type) {
    case "schools": return `https://www.google.com/search?q=CDL+training+schools+near+${st}+free`;
    case "free": return `https://www.google.com/search?q=free+CDL+training+programs+${st}+2026`;
    case "sponsored": return `https://www.google.com/search?q=company+sponsored+CDL+training+${st}`;
    case "indeed": return `https://www.indeed.com/jobs?q=CDL+driver&l=${st}`;
    case "jobs": return `https://www.google.com/search?q=CDL+truck+driver+jobs+${st}`;
    default: return "#";
  }
}

export default function TradesModePanel({ onClose }: { onClose: () => void }) {
  const [userState, setUserState] = useState("");
  const [activeSection, setActiveSection] = useState<"guide" | "test" | "programs" | "jobs" | "earnings">("guide");
  const [testIdx, setTestIdx] = useState(0);
  const [testAnswer, setTestAnswer] = useState<number | null>(null);
  const [testScore, setTestScore] = useState(0);
  const [testDone, setTestDone] = useState(false);

  const handleAnswer = (idx: number) => {
    if (testAnswer !== null) return;
    setTestAnswer(idx);
    if (idx === PRACTICE_QUESTIONS[testIdx].answer) setTestScore((s) => s + 1);
  };

  const nextQuestion = () => {
    if (testIdx < PRACTICE_QUESTIONS.length - 1) {
      setTestIdx((i) => i + 1);
      setTestAnswer(null);
    } else {
      setTestDone(true);
    }
  };

  const resetTest = () => {
    setTestIdx(0); setTestAnswer(null); setTestScore(0); setTestDone(false);
  };

  const TABS = [
    { key: "guide" as const, label: "Guide", icon: "📋" },
    { key: "test" as const, label: "Practice", icon: "✏️" },
    { key: "programs" as const, label: "Training", icon: "🎓" },
    { key: "jobs" as const, label: "Jobs", icon: "💼" },
    { key: "earnings" as const, label: "Earnings", icon: "💰" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "rgba(4,4,12,0.98)",
      backdropFilter: "blur(20px)",
      fontFamily: "monospace",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid rgba(245,158,11,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#f59e0b", marginBottom: 3 }}>NAVI Trades</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>🚛 CDL Training</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* State selector */}
      {!userState && (
        <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6, marginBottom: 10 }}>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>NAVI:</span> Let{"'"}s get you on the road. First — what state are you in? CDL requirements vary by state.
            </div>
            <select value={userState} onChange={(e) => setUserState(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }}>
              <option value="">Select your state...</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Section tabs */}
      {userState && (
        <div style={{ display: "flex", gap: 4, padding: "8px 16px", overflowX: "auto", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setActiveSection(key)} style={{
              padding: "6px 10px", borderRadius: 8, fontSize: 9, fontFamily: "monospace", cursor: "pointer", whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 4,
              background: activeSection === key ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.03)",
              border: activeSection === key ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(255,255,255,0.06)",
              color: activeSection === key ? "#f59e0b" : "#64748b",
              fontWeight: activeSection === key ? 700 : 400,
            }}>
              <span style={{ fontSize: 12 }}>{icon}</span> {label}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Guide ──────────────────────────────────────────────────────── */}
        {userState && activeSection === "guide" && (
          <>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>NAVI:</span> Here{"'"}s your complete CDL roadmap for <span style={{ color: "#f59e0b" }}>{userState}</span>. Follow these 5 steps and you{"'"}ll be behind the wheel earning real money.
              </div>
            </div>
            {CDL_STEPS.map(({ num, title, desc, color }) => (
              <div key={num} style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${color}18`, border: `1px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{num}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
            <button onClick={() => window.open(`https://www.dmv.org/${userState.toLowerCase().replace(/\s+/g, "-")}/cdl-license.php`, "_blank")}
              style={{ width: "100%", padding: "12px", borderRadius: 10, background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.28)", color: "#f59e0b", fontSize: 11, fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}>
              📋 View {userState} CDL Requirements ↗
            </button>
          </>
        )}

        {/* ── Practice Test ──────────────────────────────────────────────── */}
        {userState && activeSection === "test" && (
          <div style={{ padding: "16px", borderRadius: 14, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(168,85,247,0.12)" }}>
            {!testDone ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#a855f7" }}>Question {testIdx + 1} of {PRACTICE_QUESTIONS.length}</div>
                  <div style={{ fontSize: 10, color: "#34d399" }}>Score: {testScore}/{testIdx + (testAnswer !== null ? 1 : 0)}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.5, marginBottom: 14 }}>
                  {PRACTICE_QUESTIONS[testIdx].q}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {PRACTICE_QUESTIONS[testIdx].options.map((opt, i) => {
                    const correct = i === PRACTICE_QUESTIONS[testIdx].answer;
                    const selected = testAnswer === i;
                    const revealed = testAnswer !== null;
                    return (
                      <button key={i} onClick={() => handleAnswer(i)} disabled={revealed} style={{
                        width: "100%", padding: "10px 12px", borderRadius: 10, textAlign: "left",
                        fontSize: 11, fontFamily: "monospace", cursor: revealed ? "default" : "pointer",
                        background: revealed ? (correct ? "rgba(52,211,153,0.10)" : selected ? "rgba(239,68,68,0.10)" : "rgba(255,255,255,0.02)") : "rgba(255,255,255,0.03)",
                        border: revealed ? (correct ? "1px solid rgba(52,211,153,0.35)" : selected ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(255,255,255,0.06)") : "1px solid rgba(255,255,255,0.08)",
                        color: revealed ? (correct ? "#34d399" : selected ? "#f87171" : "#64748b") : "#e2e8f0",
                      }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {testAnswer !== null && (
                  <button onClick={nextQuestion} style={{ width: "100%", marginTop: 12, padding: "10px", borderRadius: 10, background: "rgba(168,85,247,0.10)", border: "1px solid rgba(168,85,247,0.28)", color: "#a855f7", fontSize: 11, fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}>
                    {testIdx < PRACTICE_QUESTIONS.length - 1 ? "Next Question →" : "See Results"}
                  </button>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{testScore >= 5 ? "🎉" : testScore >= 3 ? "👍" : "📚"}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: testScore >= 5 ? "#34d399" : "#f59e0b", marginBottom: 4 }}>{testScore}/{PRACTICE_QUESTIONS.length}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>
                  {testScore >= 5 ? "Great job! You're on track for the CDL test." : testScore >= 3 ? "Good start. Keep studying the CDL manual." : "Keep practicing — review the CDL manual and try again."}
                </div>
                <button onClick={resetTest} style={{ padding: "10px 24px", borderRadius: 10, background: "rgba(168,85,247,0.10)", border: "1px solid rgba(168,85,247,0.28)", color: "#a855f7", fontSize: 11, fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}>
                  Retake Test
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Training Programs ──────────────────────────────────────────── */}
        {userState && activeSection === "programs" && (
          <>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                <span style={{ color: "#34d399", fontWeight: 700 }}>NAVI:</span> Here are ways to find CDL training in <span style={{ color: "#34d399" }}>{userState}</span>. Many programs are free or company-sponsored.
              </div>
            </div>
            {[
              { icon: "🎓", label: "CDL Schools Near You", desc: "Find accredited CDL training schools in your area", type: "schools", color: "#34d399" },
              { icon: "🆓", label: "Free Training Programs", desc: "Government and nonprofit-funded CDL programs", type: "free", color: "#00d4ff" },
              { icon: "🏢", label: "Company-Sponsored Training", desc: "Trucking companies that pay for your CDL training", type: "sponsored", color: "#C9A227" },
            ].map(({ icon, label, desc, type, color }) => (
              <button key={type} onClick={() => window.open(buildSearchUrl(type, userState), "_blank")} style={{
                width: "100%", display: "flex", alignItems: "flex-start", gap: 12, padding: "14px", borderRadius: 14, cursor: "pointer",
                background: `${color}06`, border: `1px solid ${color}18`, textAlign: "left",
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.4 }}>{desc}</div>
                </div>
                <span style={{ fontSize: 10, color: "#475569", flexShrink: 0 }}>↗</span>
              </button>
            ))}
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.10)", fontSize: 9, color: "#475569", lineHeight: 1.5 }}>
              💡 Many companies like CRST, Swift, Werner, and Schneider offer free CDL training in exchange for a 1-year driving commitment.
            </div>
          </>
        )}

        {/* ── Job Opportunities ──────────────────────────────────────────── */}
        {userState && activeSection === "jobs" && (
          <>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                <span style={{ color: "#00d4ff", fontWeight: 700 }}>NAVI:</span> CDL drivers are in massive demand. Here{"'"}s where to find jobs in <span style={{ color: "#00d4ff" }}>{userState}</span>.
              </div>
            </div>
            {[
              { label: "Indeed — CDL Driver Jobs", url: buildSearchUrl("indeed", userState), color: "#00d4ff" },
              { label: "Google — CDL Jobs Near You", url: buildSearchUrl("jobs", userState), color: "#34d399" },
              { label: "FMCSA Job Board", url: "https://ai.fmcsa.dot.gov/", color: "#C9A227" },
              { label: "TruckersReport Job Board", url: "https://www.thetruckersreport.com/truckingindustryforum/forums/truck-driving-jobs.33/", color: "#a855f7" },
            ].map(({ label, url, color }) => (
              <button key={label} onClick={() => window.open(url, "_blank")} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                background: `${color}06`, border: `1px solid ${color}18`, color, fontSize: 11, fontFamily: "monospace",
              }}>
                <span style={{ fontWeight: 600 }}>{label}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>↗</span>
              </button>
            ))}
            <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.5, padding: "8px 0" }}>
              🔥 The trucking industry needs 80,000+ new drivers per year. Many companies offer sign-on bonuses of $5,000–$15,000.
            </div>
          </>
        )}

        {/* ── Earnings Overview ──────────────────────────────────────────── */}
        {userState && activeSection === "earnings" && (
          <>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(201,162,39,0.04)", border: "1px solid rgba(201,162,39,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                <span style={{ color: "#C9A227", fontWeight: 700 }}>NAVI:</span> Here{"'"}s what CDL drivers actually earn. Your income grows fast with experience and endorsements.
              </div>
            </div>
            <div style={{ borderRadius: 14, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(201,162,39,0.10)", overflow: "hidden" }}>
              {EARNINGS.map((e, i) => (
                <div key={e.role} style={{ padding: "12px 16px", borderBottom: i < EARNINGS.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9" }}>{e.role}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#34d399" }}>{e.range}</div>
                  </div>
                  <div style={{ fontSize: 9, color: "#475569" }}>{e.note}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)", fontSize: 10, color: "#94a3b8", lineHeight: 1.6 }}>
              <span style={{ fontWeight: 700, color: "#34d399" }}>Pro tip:</span> Adding Hazmat, Tanker, or Doubles/Triples endorsements can increase your pay by $10K–$20K per year.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
