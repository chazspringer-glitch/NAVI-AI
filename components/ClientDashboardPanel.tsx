"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { uploadContent, fetchUploads, type ContentUpload } from "@/lib/uploads";
import { fetchScheduledPosts, type ScheduledPost } from "@/lib/schedule";

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

export default function ClientDashboardPanel({ onClose, showLogout = false, asPage = false }: { onClose: () => void; showLogout?: boolean; asPage?: boolean }) {
  const [chatMessages, setChatMessages] = useState<{ role: "navi" | "user"; text: string }[]>(
    NAVI_GREETING.map((text) => ({ role: "navi" as const, text }))
  );
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [uploads, setUploads] = useState<ContentUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Enable natural scrolling when rendered as a page
  useEffect(() => {
    if (!asPage) return;
    document.documentElement.classList.add("dashboard-scroll");
    return () => { document.documentElement.classList.remove("dashboard-scroll"); };
  }, [asPage]);

  // Get current user + load uploads
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    });
  }, []);

  const loadUploads = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchUploads(userId);
      setUploads(data);
    } catch {
      // silent
    }
  }, [userId]);

  const loadSchedule = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchScheduledPosts(userId);
      setScheduledPosts(data);
    } catch {
      // silent
    }
  }, [userId]);

  useEffect(() => {
    loadUploads();
    loadSchedule();
  }, [loadUploads, loadSchedule]);

  const handleSchedulePost = async () => {
    if (!userId || !schedDate || !schedTime) return;
    setScheduling(true);
    try {
      const scheduledAt = new Date(`${schedDate}T${schedTime}:00`).toISOString();
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          post_type: schedType,
          platform: schedPlatform,
          caption: schedCaption,
          scheduled_at: scheduledAt,
        }),
      });
      if (res.ok) {
        setShowScheduleForm(false);
        setSchedCaption("");
        setSchedDate("");
        setSchedTime("12:00");
        await loadSchedule();
      }
    } catch {
      // silent
    } finally {
      setScheduling(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !userId) return;
    setUploading(true);
    setUploadError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const result = await uploadContent(files[i], userId);
        if (!result) {
          setUploadError(`Failed to upload ${files[i].name}`);
        }
      }
      await loadUploads();
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Schedule state
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedType, setSchedType] = useState("Image Post");
  const [schedPlatform, setSchedPlatform] = useState("Instagram");
  const [schedCaption, setSchedCaption] = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("12:00");
  const [scheduling, setScheduling] = useState(false);

  // AI content generator state
  const [genBusiness, setGenBusiness] = useState("");
  const [genGoal, setGenGoal] = useState("");
  const [genResult, setGenResult] = useState<{ postIdea: string; caption: string; hashtags: string[] } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!genBusiness.trim() || !genGoal.trim()) return;
    setGenerating(true);
    setGenError(null);
    setGenResult(null);
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType: genBusiness, goal: genGoal }),
      });
      const json = await res.json();
      if (json.result) {
        setGenResult(json.result);
      } else {
        setGenError(json.error || "Failed to generate");
      }
    } catch {
      setGenError("Could not connect. Try again.");
    } finally {
      setGenerating(false);
    }
  };

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
      ...(asPage
        ? { minHeight: "100vh", background: "#08080f" }
        : { position: "fixed" as const, inset: 0, zIndex: 70, display: "flex", flexDirection: "column" as const, overflow: "hidden", background: "rgba(4,4,12,0.98)", backdropFilter: "blur(20px)" }),
      fontFamily: "monospace",
    }}>

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <div style={{
        position: "relative", overflow: "hidden",
        padding: asPage ? "24px 20px 20px" : "16px 16px 14px",
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

        {/* Stats inside hero */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginTop: 16, position: "relative" }}>
          {STATS.map(({ label, value, change, icon, accent }) => (
            <div key={label} style={{
              padding: "14px 12px 12px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
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
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div style={{
        ...(asPage
          ? { padding: "20px 20px 140px", display: "flex", flexDirection: "column" as const, gap: 20, maxWidth: 600, margin: "0 auto", width: "100%" }
          : { flex: 1, overflowY: "auto" as const, padding: "16px 16px 24px", display: "flex", flexDirection: "column" as const, gap: 20 }),
      }}>

        {/* ── Your Growth ──────────────────────────────────────────────── */}
        <div style={{
          borderRadius: 14,
          padding: "16px 18px",
          background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
          border: "1px solid rgba(0,212,255,0.10)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#00d4ff", marginBottom: 14 }}>Your Growth</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "This Week", value: "+312", sub: "new impressions", color: "#34d399" },
              { label: "Top Platform", value: "Instagram", sub: "68% of traffic", color: "#C9A227" },
              { label: "Best Time", value: "12–2 PM", sub: "highest engagement", color: "#a855f7" },
              { label: "Content Score", value: "8.4/10", sub: "above average", color: "#00d4ff" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.04em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color, marginBottom: 2 }}>{value}</div>
                <div style={{ fontSize: 8, color: "#475569" }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Your Content (merged calendar + uploads) ──────────────────── */}
        {(() => {
          const PLAT_COLOR: Record<string, string> = { Instagram: "#C9A227", Facebook: "#00d4ff", TikTok: "#f472b6", LinkedIn: "#a855f7", Twitter: "#00d4ff" };

          // Build merged calendar: static items + scheduled posts grouped by date
          const calendarDays = CALENDAR_ITEMS.map(({ day, date, items }) => {
            // Match scheduled posts that fall on this calendar day
            const dateStr = `Apr ${date.split(" ")[1]}, 2026`;
            const matched = scheduledPosts.filter((p) => {
              const d = new Date(p.scheduled_at);
              const m = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              return m === dateStr;
            }).map((p) => {
              const d = new Date(p.scheduled_at);
              return {
                time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
                type: p.post_type,
                platform: p.platform,
                color: PLAT_COLOR[p.platform] || "#C9A227",
                isScheduled: true,
              };
            });
            const staticItems = items.map((it) => ({ ...it, isScheduled: false }));
            return { day, date, items: [...staticItems, ...matched] };
          });

          // Also show scheduled posts outside the static week
          const extraPosts = scheduledPosts.filter((p) => {
            const d = new Date(p.scheduled_at);
            const day = d.getDate();
            return day < 14 || day > 20;
          });

          return (
            <div style={{
              borderRadius: 14,
              background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
              border: "1px solid rgba(201,162,39,0.10)",
            }}>
              <div style={{
                padding: "16px 18px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#C9A227" }}>Your Content</div>
                  <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>
                    Calendar · Uploads · Schedule{scheduledPosts.length > 0 ? ` · ${scheduledPosts.length} queued` : ""}
                  </div>
                </div>
                <button
                  onClick={() => setShowScheduleForm(!showScheduleForm)}
                  style={{
                    padding: "5px 12px", borderRadius: 7,
                    background: showScheduleForm ? "rgba(52,211,153,0.10)" : "rgba(168,85,247,0.08)",
                    border: showScheduleForm ? "1px solid rgba(52,211,153,0.22)" : "1px solid rgba(168,85,247,0.22)",
                    color: showScheduleForm ? "#34d399" : "#a855f7", fontSize: 9, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <span style={{ fontSize: 11 }}>{showScheduleForm ? "✕" : "📅"}</span>
                  {showScheduleForm ? "Cancel" : "Schedule"}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: "5px 12px", borderRadius: 7,
                    background: "rgba(201,162,39,0.08)",
                    border: "1px solid rgba(201,162,39,0.22)",
                    color: "#C9A227", fontSize: 9, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  <span style={{ fontSize: 11 }}>📤</span> {uploading ? "..." : "Upload"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </div>

              {/* Schedule form */}
              {showScheduleForm && (
                <div style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: "rgba(168,85,247,0.03)",
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 7, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Date</div>
                      <input
                        type="date"
                        value={schedDate}
                        onChange={(e) => setSchedDate(e.target.value)}
                        style={{
                          width: "100%", padding: "7px 8px", borderRadius: 6,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#e2e8f0", fontSize: 10, fontFamily: "monospace",
                          outline: "none", colorScheme: "dark", position: "relative" as const, zIndex: 10,
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 7, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Time</div>
                      <input
                        type="time"
                        value={schedTime}
                        onChange={(e) => setSchedTime(e.target.value)}
                        style={{
                          width: "100%", padding: "7px 8px", borderRadius: 6,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#e2e8f0", fontSize: 10, fontFamily: "monospace",
                          outline: "none", colorScheme: "dark", position: "relative" as const, zIndex: 10,
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 7, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Post Type</div>
                      <select
                        value={schedType}
                        onChange={(e) => setSchedType(e.target.value)}
                        style={{
                          width: "100%", padding: "7px 8px", borderRadius: 6,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#e2e8f0", fontSize: 10, fontFamily: "monospace",
                          outline: "none", position: "relative" as const, zIndex: 10,
                        }}
                      >
                        {["Image Post", "Video Post", "Story", "Reel", "Carousel"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 7, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Platform</div>
                      <select
                        value={schedPlatform}
                        onChange={(e) => setSchedPlatform(e.target.value)}
                        style={{
                          width: "100%", padding: "7px 8px", borderRadius: 6,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#e2e8f0", fontSize: 10, fontFamily: "monospace",
                          outline: "none", position: "relative" as const, zIndex: 10,
                        }}
                      >
                        {["Instagram", "Facebook", "TikTok", "LinkedIn", "Twitter"].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 7, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Caption (optional)</div>
                    <input
                      value={schedCaption}
                      onChange={(e) => setSchedCaption(e.target.value)}
                      placeholder="Write your caption..."
                      style={{
                        width: "100%", padding: "7px 8px", borderRadius: 6,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#e2e8f0", fontSize: 10, fontFamily: "monospace",
                        outline: "none",
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSchedulePost}
                    disabled={scheduling || !schedDate}
                    style={{
                      width: "100%", padding: "9px", borderRadius: 7,
                      background: scheduling ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.12)",
                      border: "1px solid rgba(168,85,247,0.28)",
                      color: "#a855f7", fontSize: 10, fontFamily: "monospace",
                      fontWeight: 700, cursor: scheduling || !schedDate ? "default" : "pointer",
                      opacity: !schedDate ? 0.4 : 1,
                    }}
                  >
                    {scheduling ? "Scheduling..." : "Schedule Post"}
                  </button>
                </div>
              )}

              {/* Calendar rows */}
              {calendarDays.map(({ day, date, items }) => (
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
                          border: `1px solid ${item.color}${item.isScheduled ? "28" : "18"}`,
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
                          {item.isScheduled && (
                            <span style={{ fontSize: 7, color: "#a855f7", fontWeight: 600, flexShrink: 0 }}>SCHEDULED</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}

              {/* Extra scheduled posts outside the static week */}
              {extraPosts.length > 0 && (
                <>
                  <div style={{ padding: "8px 16px 4px", fontSize: 8, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    Other Scheduled
                  </div>
                  {extraPosts.map((p) => {
                    const d = new Date(p.scheduled_at);
                    const col = PLAT_COLOR[p.platform] || "#C9A227";
                    return (
                      <div key={p.id} style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: "6px 16px 6px 52px",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: col, flexShrink: 0, boxShadow: `0 0 6px ${col}55` }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 9, color: "#e2e8f0", fontWeight: 600 }}>{p.post_type}</div>
                          <div style={{ fontSize: 7, color: "#475569" }}>
                            {p.platform} · {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                          </div>
                        </div>
                        <span style={{ fontSize: 7, color: "#a855f7", fontWeight: 600, flexShrink: 0 }}>SCHEDULED</span>
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── Uploads (inside same card) ───────────────────────────── */}
              <div style={{ padding: "12px 16px 6px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
                    Uploads · {uploads.length} file{uploads.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {uploadError && (
                <div style={{ padding: "6px 16px", fontSize: 9, color: "#f87171", background: "rgba(239,68,68,0.06)" }}>
                  {uploadError}
                </div>
              )}

              {uploading && (
                <div style={{ padding: "10px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#C9A227" }}>Uploading...</div>
                </div>
              )}

              {!uploading && uploads.length === 0 && (
                <div style={{ padding: "14px 16px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#64748b" }}>No files yet — tap Upload above</div>
                </div>
              )}

              {uploads.length > 0 && (
                <div style={{ padding: "6px 12px 12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8 }}>
                  {uploads.map((u) => {
                    const isVideo = u.file_type.startsWith("video/");
                    return (
                      <div key={u.id} style={{
                        borderRadius: 8, overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(0,0,0,0.3)",
                        position: "relative",
                      }}>
                        {isVideo ? (
                          <video src={u.public_url} style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} muted />
                        ) : (
                          <img src={u.public_url} alt={u.file_name} style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
                        )}
                        <div style={{ position: "absolute", top: 4, right: 4, padding: "1px 5px", borderRadius: 4, background: "rgba(0,0,0,0.6)", fontSize: 7, color: "#94a3b8", fontWeight: 600 }}>
                          {isVideo ? "VIDEO" : "IMG"}
                        </div>
                        <div style={{ padding: "5px 6px" }}>
                          <div style={{ fontSize: 8, color: "#94a3b8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.file_name}</div>
                          <div style={{ fontSize: 7, color: "#334155", marginTop: 1 }}>{(u.file_size / 1024).toFixed(0)} KB</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── AI Content Generator ──────────────────────────────────────── */}
        <div style={{
          borderRadius: 14,
          background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
          border: "1px solid rgba(168,85,247,0.12)",
        }}>
          <div style={{
            padding: "16px 18px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a855f7" }}>AI Content Generator</div>
            <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>Generate captions, hashtags, and post ideas</div>
          </div>

          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Inputs */}
            <div>
              <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Business Type</div>
              <input
                value={genBusiness}
                onChange={(e) => setGenBusiness(e.target.value)}
                placeholder="e.g. Beauty salon, fitness coach, restaurant"
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0", fontSize: 10, fontFamily: "monospace",
                  outline: "none", position: "relative" as const, zIndex: 10,
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Goal</div>
              <input
                value={genGoal}
                onChange={(e) => setGenGoal(e.target.value)}
                placeholder="e.g. Get more followers, promote a sale, build trust"
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0", fontSize: 10, fontFamily: "monospace",
                  outline: "none", position: "relative" as const, zIndex: 10,
                }}
              />
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !genBusiness.trim() || !genGoal.trim()}
              style={{
                width: "100%", padding: "10px", borderRadius: 8,
                background: generating
                  ? "rgba(168,85,247,0.08)"
                  : "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(168,85,247,0.08))",
                border: "1px solid rgba(168,85,247,0.28)",
                color: "#a855f7", fontSize: 10, fontFamily: "monospace",
                fontWeight: 700, letterSpacing: "0.04em",
                cursor: (generating || !genBusiness.trim() || !genGoal.trim()) ? "default" : "pointer",
                opacity: (!genBusiness.trim() || !genGoal.trim()) ? 0.4 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 13 }}>✨</span>
              {generating ? "Generating..." : "Generate Post"}
            </button>

            {/* Error */}
            {genError && (
              <div style={{ fontSize: 9, color: "#f87171", padding: "6px 10px", borderRadius: 6, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                {genError}
              </div>
            )}

            {/* Result card */}
            {genResult && (
              <div style={{
                padding: "14px 14px 12px", borderRadius: 10,
                background: "rgba(168,85,247,0.04)",
                border: "1px solid rgba(168,85,247,0.15)",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                {/* Post Idea */}
                <div>
                  <div style={{ fontSize: 8, color: "#a855f7", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, fontWeight: 700 }}>
                    Post Idea
                  </div>
                  <div style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.55 }}>
                    {genResult.postIdea}
                  </div>
                </div>

                {/* Caption */}
                <div>
                  <div style={{ fontSize: 8, color: "#C9A227", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, fontWeight: 700 }}>
                    Caption
                  </div>
                  <div style={{
                    fontSize: 10, color: "#94a3b8", lineHeight: 1.6,
                    padding: "8px 10px", borderRadius: 6,
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    {genResult.caption}
                  </div>
                </div>

                {/* Hashtags */}
                <div>
                  <div style={{ fontSize: 8, color: "#00d4ff", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, fontWeight: 700 }}>
                    Hashtags
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {Array.isArray(genResult.hashtags) && genResult.hashtags.map((tag, i) => (
                      <span key={i} style={{
                        padding: "2px 8px", borderRadius: 5,
                        background: "rgba(0,212,255,0.06)",
                        border: "1px solid rgba(0,212,255,0.15)",
                        fontSize: 9, color: "#00d4ff", fontWeight: 500,
                      }}>
                        #{tag.replace(/^#/, "")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── NAVI Assistant (inline when overlay) ─────────────────────── */}
        {!asPage && (
          <div style={{
            borderRadius: 12,
            background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
            border: "1px solid rgba(0,212,255,0.12)",
            overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
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
                fontSize: 12, boxShadow: "0 0 10px rgba(0,212,255,0.15)",
              }}>🤖</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#00d4ff" }}>NAVI</div>
                <div style={{ fontSize: 8, color: "#334155" }}>AI Marketing Assistant</div>
              </div>
              <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px rgba(52,211,153,0.5)" }} />
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "85%", padding: "7px 10px",
                    borderRadius: msg.role === "user" ? "10px 10px 3px 10px" : "10px 10px 10px 3px",
                    background: msg.role === "user" ? "rgba(201,162,39,0.10)" : "rgba(0,212,255,0.06)",
                    border: msg.role === "user" ? "1px solid rgba(201,162,39,0.18)" : "1px solid rgba(0,212,255,0.10)",
                    fontSize: 10, color: msg.role === "user" ? "#e2e8f0" : "#94a3b8", lineHeight: 1.5,
                  }}>{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: "8px 12px 10px", borderTop: "1px solid rgba(0,212,255,0.08)", display: "flex", gap: 6 }}>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleChatSend(); }} placeholder="Ask NAVI anything..."
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,212,255,0.12)", color: "#e2e8f0", fontSize: 10, outline: "none", position: "relative", zIndex: 10 }} />
              <button onClick={handleChatSend} disabled={!chatInput.trim()}
                style={{ padding: "8px 14px", borderRadius: 8, background: chatInput.trim() ? "rgba(0,212,255,0.10)" : "rgba(255,255,255,0.03)", border: chatInput.trim() ? "1px solid rgba(0,212,255,0.25)" : "1px solid rgba(255,255,255,0.06)", color: chatInput.trim() ? "#00d4ff" : "#334155", fontSize: 10, fontWeight: 600, cursor: chatInput.trim() ? "pointer" : "default" }}>
                Send
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Floating NAVI (page mode only) ──────────────────────────── */}
      {asPage && (
        <div style={{
          position: "fixed",
          bottom: 20, left: "50%", transform: "translateX(-50%)",
          width: "90%", maxWidth: 500, zIndex: 50,
          borderRadius: 16,
          background: "rgba(10,10,18,0.95)",
          border: "1px solid rgba(0,212,255,0.18)",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,255,0.08)",
          backdropFilter: "blur(16px)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{
            padding: "10px 14px 8px",
            borderBottom: "1px solid rgba(0,212,255,0.08)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,212,255,0.25) 0%, rgba(0,212,255,0.05) 70%)",
              border: "1px solid rgba(0,212,255,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, boxShadow: "0 0 8px rgba(0,212,255,0.15)",
            }}>🤖</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#00d4ff" }}>NAVI</div>
            <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px rgba(52,211,153,0.5)" }} />
          </div>

          {/* Messages */}
          <div style={{
            maxHeight: 150, overflowY: "auto", padding: "8px 12px",
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "6px 10px",
                  borderRadius: msg.role === "user" ? "10px 10px 3px 10px" : "10px 10px 10px 3px",
                  background: msg.role === "user" ? "rgba(201,162,39,0.10)" : "rgba(0,212,255,0.06)",
                  border: msg.role === "user" ? "1px solid rgba(201,162,39,0.18)" : "1px solid rgba(0,212,255,0.10)",
                  fontSize: 10, color: msg.role === "user" ? "#e2e8f0" : "#94a3b8", lineHeight: 1.5,
                }}>{msg.text}</div>
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
                flex: 1, padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(0,212,255,0.15)",
                color: "#e2e8f0", fontSize: 12, fontFamily: "monospace",
                outline: "none", position: "relative", zIndex: 10,
              }}
            />
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim()}
              style={{
                padding: "10px 16px", borderRadius: 10,
                background: chatInput.trim() ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.03)",
                border: chatInput.trim() ? "1px solid rgba(0,212,255,0.28)" : "1px solid rgba(255,255,255,0.06)",
                color: chatInput.trim() ? "#00d4ff" : "#334155",
                fontSize: 11, fontWeight: 600,
                cursor: chatInput.trim() ? "pointer" : "default",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
