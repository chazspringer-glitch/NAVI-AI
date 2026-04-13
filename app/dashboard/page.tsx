"use client";

import { useState, useRef, useEffect } from "react";

/* ── Static data ──────────────────────────────────────────────────────────── */

const STATS = [
  { label: "Followers",  value: "2,847",  change: "+124 this week", icon: "👥", accent: "#C9A227" },
  { label: "Engagement",  value: "6.3%",   change: "+0.8% vs last week", icon: "💬", accent: "#00d4ff" },
  { label: "Reach",       value: "18.4K",  change: "+2.1K this month", icon: "📡", accent: "#34d399" },
];

const CALENDAR_ITEMS = [
  { day: "Mon", date: "Apr 14", items: [{ time: "10:00 AM", type: "Video Post", platform: "Instagram", color: "#C9A227" }] },
  { day: "Tue", date: "Apr 15", items: [{ time: "12:00 PM", type: "Image Post", platform: "Facebook", color: "#00d4ff" }, { time: "3:00 PM", type: "Story", platform: "Instagram", color: "#a855f7" }] },
  { day: "Wed", date: "Apr 16", items: [{ time: "11:00 AM", type: "Video Post", platform: "TikTok", color: "#f472b6" }] },
  { day: "Thu", date: "Apr 17", items: [] },
  { day: "Fri", date: "Apr 18", items: [{ time: "9:00 AM", type: "Image Post", platform: "Instagram", color: "#C9A227" }, { time: "2:00 PM", type: "Video Post", platform: "Facebook", color: "#00d4ff" }] },
  { day: "Sat", date: "Apr 19", items: [{ time: "11:00 AM", type: "Story", platform: "Instagram", color: "#a855f7" }] },
  { day: "Sun", date: "Apr 20", items: [] },
];

const NAVI_GREETING = [
  "Hey! I'm NAVI, your AI marketing assistant.",
  "I can help you plan content, review your stats, or brainstorm ideas.",
  "What would you like to work on today?",
];

/* ── Component ────────────────────────────────────────────────────────────── */

export default function ClientDashboard() {
  const [chatMessages, setChatMessages] = useState<{ role: "navi" | "user"; text: string }[]>(
    NAVI_GREETING.map((text) => ({ role: "navi" as const, text }))
  );
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: chatInput },
      { role: "navi", text: "Thanks for the message! Full AI responses coming soon. For now, check out your content calendar and stats above." },
    ]);
    setChatInput("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#08080f",
      color: "#e2e8f0",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      overflowY: "auto",
    }}>

      {/* ── Cinematic Welcome Header ───────────────────────────────────── */}
      <div style={{
        position: "relative", overflow: "hidden",
        padding: "48px 32px 40px",
        background: "linear-gradient(160deg, rgba(12,12,22,1) 0%, rgba(8,8,15,1) 50%, rgba(16,12,6,0.95) 100%)",
        borderBottom: "1px solid rgba(201,162,39,0.12)",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: -80, right: -60,
          width: 320, height: 320, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -40,
          width: 240, height: 240, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 65%)",
        }} />

        <div style={{ position: "relative", maxWidth: 900, margin: "0 auto" }}>
          <div style={{
            fontSize: 10, fontFamily: "monospace", letterSpacing: "0.32em",
            textTransform: "uppercase", color: "#C9A227", marginBottom: 10,
          }}>
            Springer Industries
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, color: "#f1f5f9", margin: "0 0 8px",
            letterSpacing: "-0.01em",
            textShadow: "0 0 30px rgba(201,162,39,0.15)",
          }}>
            Welcome back
          </h1>
          <p style={{
            fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.6,
            maxWidth: 480,
          }}>
            Your brand is growing. Here{"'"}s what{"'"}s happening across your channels.
          </p>

          {/* Status badges */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <div style={{
              padding: "5px 12px", borderRadius: 8,
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.20)",
              fontSize: 11, fontFamily: "monospace", color: "#34d399", fontWeight: 600,
            }}>
              Accounts Active
            </div>
            <div style={{
              padding: "5px 12px", borderRadius: 8,
              background: "rgba(201,162,39,0.08)",
              border: "1px solid rgba(201,162,39,0.20)",
              fontSize: 11, fontFamily: "monospace", color: "#C9A227", fontWeight: 600,
            }}>
              3 Posts Scheduled
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 32px 48px" }}>

        {/* ── Stats Cards ────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {STATS.map(({ label, value, change, icon, accent }) => (
            <div key={label} style={{
              padding: "20px 20px 18px",
              borderRadius: 14,
              background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
              border: `1px solid ${accent}22`,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -20, right: -20,
                width: 80, height: 80, borderRadius: "50%",
                background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b", letterSpacing: "0.04em" }}>{label}</span>
                <span style={{ fontSize: 20 }}>{icon}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: 5 }}>
                {value}
              </div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: accent, fontWeight: 500 }}>
                {change}
              </div>
            </div>
          ))}
        </div>

        {/* ── Two-column: Calendar + NAVI ─────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

          {/* ── Content Calendar ──────────────────────────────────────── */}
          <div style={{
            borderRadius: 14,
            background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
            border: "1px solid rgba(201,162,39,0.10)",
            overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "16px 20px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#C9A227", letterSpacing: "0.02em" }}>Content Calendar</div>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: "#475569", marginTop: 2 }}>Apr 14 – Apr 20, 2026</div>
              </div>
              {/* Upload button */}
              <button style={{
                padding: "6px 14px", borderRadius: 8,
                background: "linear-gradient(135deg, rgba(201,162,39,0.15), rgba(201,162,39,0.08))",
                border: "1px solid rgba(201,162,39,0.30)",
                color: "#C9A227", fontSize: 10, fontFamily: "monospace", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.18s ease",
              }}>
                <span style={{ fontSize: 13 }}>📤</span> Upload Content
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
              {CALENDAR_ITEMS.map(({ day, date, items }) => (
                <div key={day} style={{
                  display: "flex", gap: 12, padding: "10px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                }}>
                  <div style={{ width: 44, flexShrink: 0, textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "#64748b" }}>{day}</div>
                    <div style={{ fontSize: 9, fontFamily: "monospace", color: "#334155", marginTop: 1 }}>{date.split(" ")[1]}</div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    {items.length === 0 ? (
                      <div style={{ fontSize: 10, fontFamily: "monospace", color: "#1e293b", fontStyle: "italic", padding: "4px 0" }}>
                        No posts
                      </div>
                    ) : (
                      items.map((item, j) => (
                        <div key={j} style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "6px 10px", borderRadius: 8,
                          background: `${item.color}08`,
                          border: `1px solid ${item.color}18`,
                        }}>
                          <div style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: item.color, flexShrink: 0,
                            boxShadow: `0 0 6px ${item.color}55`,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#e2e8f0", fontWeight: 600 }}>
                              {item.type}
                            </div>
                            <div style={{ fontSize: 8, fontFamily: "monospace", color: "#475569" }}>
                              {item.platform} · {item.time}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── NAVI Assistant Panel ──────────────────────────────────── */}
          <div style={{
            borderRadius: 14,
            background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
            border: "1px solid rgba(0,212,255,0.12)",
            overflow: "hidden",
            display: "flex", flexDirection: "column",
            height: 460,
          }}>
            {/* Header */}
            <div style={{
              padding: "14px 20px 12px",
              borderBottom: "1px solid rgba(0,212,255,0.08)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(0,212,255,0.25) 0%, rgba(0,212,255,0.05) 70%)",
                border: "1px solid rgba(0,212,255,0.30)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13,
                boxShadow: "0 0 12px rgba(0,212,255,0.15)",
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#00d4ff", letterSpacing: "0.02em" }}>NAVI</div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "#334155" }}>AI Marketing Assistant</div>
              </div>
              <div style={{
                marginLeft: "auto", width: 7, height: 7, borderRadius: "50%",
                background: "#34d399", boxShadow: "0 0 8px rgba(52,211,153,0.5)",
              }} />
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "14px 16px",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}>
                  <div style={{
                    maxWidth: "85%",
                    padding: "8px 12px",
                    borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, rgba(201,162,39,0.15), rgba(201,162,39,0.08))"
                      : "rgba(0,212,255,0.06)",
                    border: msg.role === "user"
                      ? "1px solid rgba(201,162,39,0.20)"
                      : "1px solid rgba(0,212,255,0.10)",
                    fontSize: 11, fontFamily: "monospace",
                    color: msg.role === "user" ? "#e2e8f0" : "#94a3b8",
                    lineHeight: 1.55,
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: "10px 14px 12px",
              borderTop: "1px solid rgba(0,212,255,0.08)",
              display: "flex", gap: 8,
            }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleChatSend(); }}
                placeholder="Ask NAVI anything..."
                style={{
                  flex: 1, padding: "9px 12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(0,212,255,0.12)",
                  color: "#e2e8f0", fontSize: 11, fontFamily: "monospace",
                  outline: "none",
                }}
              />
              <button
                onClick={handleChatSend}
                disabled={!chatInput.trim()}
                style={{
                  padding: "9px 16px", borderRadius: 10,
                  background: chatInput.trim()
                    ? "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.08))"
                    : "rgba(255,255,255,0.03)",
                  border: chatInput.trim()
                    ? "1px solid rgba(0,212,255,0.30)"
                    : "1px solid rgba(255,255,255,0.06)",
                  color: chatInput.trim() ? "#00d4ff" : "#334155",
                  fontSize: 11, fontFamily: "monospace", fontWeight: 600,
                  cursor: chatInput.trim() ? "pointer" : "default",
                  transition: "all 0.18s ease",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div style={{
          marginTop: 32, paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.04)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#1e293b", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Powered by Springer Industries
          </div>
        </div>
      </div>
    </div>
  );
}
