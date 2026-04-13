"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

/* ── Static data ──────────────────────────────────────────────────────────── */

const STATS = [
  { label: "Followers",  value: "2,847",  change: "+124 this week",     icon: "👥", accent: "#C9A227" },
  { label: "Engagement", value: "6.3%",   change: "+0.8% vs last week", icon: "💬", accent: "#00d4ff" },
  { label: "Reach",      value: "18.4K",  change: "+2.1K this month",   icon: "📡", accent: "#34d399" },
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

export default function ClientDashboardPanel({ onClose, showLogout = false }: { onClose: () => void; showLogout?: boolean }) {
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
      position: "fixed", inset: 0, zIndex: 70,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "rgba(4,4,12,0.98)",
      backdropFilter: "blur(20px)",
      fontFamily: "monospace",
    }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        position: "relative", overflow: "hidden",
        padding: "16px 16px 14px",
        borderBottom: "1px solid rgba(201,162,39,0.12)",
        flexShrink: 0,
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: -40, right: -30,
          width: 160, height: 160, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(201,162,39,0.07) 0%, transparent 65%)",
        }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#C9A227", marginBottom: 4 }}>
              Springer Industries
            </div>
            <div style={{ fontSize: 16, fontWeight: "bold", color: "#f1f5f9", letterSpacing: "0.02em", marginBottom: 4 }}>
              Welcome back
            </div>
            <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.5 }}>
              Your brand is growing. Here{"'"}s what{"'"}s happening.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{
              padding: "3px 8px", borderRadius: 5,
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.18)",
              fontSize: 8, color: "#34d399", fontWeight: 600,
            }}>
              Active
            </div>
            {showLogout && (
              <button
                onClick={async () => { await supabase.auth.signOut(); }}
                style={{
                  padding: "4px 10px", borderRadius: 6,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  color: "#f87171", fontSize: 8, fontFamily: "monospace",
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                Logout
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent", color: "#64748b",
                cursor: "pointer", fontSize: 13,
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Stats Cards ──────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {STATS.map(({ label, value, change, icon, accent }) => (
            <div key={label} style={{
              padding: "14px 12px 12px",
              borderRadius: 12,
              background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
              border: `1px solid ${accent}22`,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -14, right: -14,
                width: 50, height: 50, borderRadius: "50%",
                background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 8, color: "#64748b", letterSpacing: "0.04em" }}>{label}</span>
                <span style={{ fontSize: 14 }}>{icon}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: 3 }}>
                {value}
              </div>
              <div style={{ fontSize: 8, color: accent, fontWeight: 500 }}>
                {change}
              </div>
            </div>
          ))}
        </div>

        {/* ── Content Calendar ──────────────────────────────────────────── */}
        <div style={{
          borderRadius: 12,
          background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
          border: "1px solid rgba(201,162,39,0.10)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 16px 10px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227" }}>Content Calendar</div>
              <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>Apr 14 – Apr 20, 2026</div>
            </div>
            <button style={{
              padding: "5px 12px", borderRadius: 7,
              background: "rgba(201,162,39,0.08)",
              border: "1px solid rgba(201,162,39,0.22)",
              color: "#C9A227", fontSize: 9, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 11 }}>📤</span> Upload
            </button>
          </div>

          {CALENDAR_ITEMS.map(({ day, date, items }) => (
            <div key={day} style={{
              display: "flex", gap: 10, padding: "9px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
            }}>
              <div style={{ width: 36, flexShrink: 0, textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b" }}>{day}</div>
                <div style={{ fontSize: 8, color: "#334155", marginTop: 1 }}>{date.split(" ")[1]}</div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                {items.length === 0 ? (
                  <div style={{ fontSize: 9, color: "#1e293b", fontStyle: "italic", padding: "3px 0" }}>No posts</div>
                ) : (
                  items.map((item, j) => (
                    <div key={j} style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "5px 8px", borderRadius: 7,
                      background: `${item.color}08`,
                      border: `1px solid ${item.color}18`,
                    }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: item.color, flexShrink: 0,
                        boxShadow: `0 0 6px ${item.color}55`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 9, color: "#e2e8f0", fontWeight: 600 }}>{item.type}</div>
                        <div style={{ fontSize: 7, color: "#475569" }}>{item.platform} · {item.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── NAVI Assistant ────────────────────────────────────────────── */}
        <div style={{
          borderRadius: 12,
          background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
          border: "1px solid rgba(0,212,255,0.12)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          {/* Chat header */}
          <div style={{
            padding: "12px 16px 10px",
            borderBottom: "1px solid rgba(0,212,255,0.08)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,212,255,0.25) 0%, rgba(0,212,255,0.05) 70%)",
              border: "1px solid rgba(0,212,255,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12,
              boxShadow: "0 0 10px rgba(0,212,255,0.15)",
            }}>
              🤖
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#00d4ff" }}>NAVI</div>
              <div style={{ fontSize: 8, color: "#334155" }}>AI Marketing Assistant</div>
            </div>
            <div style={{
              marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
              background: "#34d399", boxShadow: "0 0 8px rgba(52,211,153,0.5)",
            }} />
          </div>

          {/* Messages */}
          <div style={{
            maxHeight: 200, overflowY: "auto", padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "85%",
                  padding: "7px 10px",
                  borderRadius: msg.role === "user" ? "10px 10px 3px 10px" : "10px 10px 10px 3px",
                  background: msg.role === "user"
                    ? "rgba(201,162,39,0.10)"
                    : "rgba(0,212,255,0.06)",
                  border: msg.role === "user"
                    ? "1px solid rgba(201,162,39,0.18)"
                    : "1px solid rgba(0,212,255,0.10)",
                  fontSize: 10,
                  color: msg.role === "user" ? "#e2e8f0" : "#94a3b8",
                  lineHeight: 1.5,
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "8px 12px 10px",
            borderTop: "1px solid rgba(0,212,255,0.08)",
            display: "flex", gap: 6,
          }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleChatSend(); }}
              placeholder="Ask NAVI anything..."
              style={{
                flex: 1, padding: "8px 10px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(0,212,255,0.12)",
                color: "#e2e8f0", fontSize: 10,
                outline: "none",
              }}
            />
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim()}
              style={{
                padding: "8px 14px", borderRadius: 8,
                background: chatInput.trim()
                  ? "rgba(0,212,255,0.10)"
                  : "rgba(255,255,255,0.03)",
                border: chatInput.trim()
                  ? "1px solid rgba(0,212,255,0.25)"
                  : "1px solid rgba(255,255,255,0.06)",
                color: chatInput.trim() ? "#00d4ff" : "#334155",
                fontSize: 10, fontWeight: 600,
                cursor: chatInput.trim() ? "pointer" : "default",
              }}
            >
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
