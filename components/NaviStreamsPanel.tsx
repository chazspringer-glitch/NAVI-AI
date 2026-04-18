"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Stream {
  id: string;
  title: string;
  status: "live" | "offline";
  stream_url: string | null;
  viewer_count: number;
  topic: string | null;
  updated_at: string;
}

interface ChatMsg {
  id: string;
  display_name: string;
  content: string;
  created_at: string;
}

interface CoHostInsight {
  keyPoints: string[];
  resources: string[];
  actions: string[];
}

interface Props {
  onClose: () => void;
  isAdmin: boolean;
  onAction?: (feature: string) => void;
}

export default function NaviStreamsPanel({ onClose, isAdmin, onAction }: Props) {
  const [stream, setStream] = useState<Stream | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authName, setAuthName] = useState("NAVI User");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Founder controls
  const [showGoLive, setShowGoLive] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");
  const [liveTopic, setLiveTopic] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [goingLive, setGoingLive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Co-host insight
  const [coHost, setCoHost] = useState<CoHostInsight | null>(null);
  const [coHostLoading, setCoHostLoading] = useState(false);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUserId(session.user.id);
        const md = session.user.user_metadata ?? {};
        setAuthName(
          (md.display_name || md.full_name || "").trim() ||
          (session.user.email ? session.user.email.split("@")[0] : "") ||
          "NAVI User"
        );
      }
    });
  }, []);

  // Fetch stream + chat
  const loadStream = useCallback(async () => {
    try {
      const res = await fetch("/api/streams");
      const json = await res.json();
      if (json.stream) setStream(json.stream);
      if (Array.isArray(json.chat)) setChat(json.chat);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadStream();
    const interval = setInterval(loadStream, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [loadStream]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length]);

  // Send chat
  const handleChat = async () => {
    if (!chatInput.trim() || sending || !stream) return;
    setSending(true);
    try {
      await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          stream_id: stream.id,
          user_id: authUserId,
          display_name: authName,
          content: chatInput.trim(),
        }),
      });
      setChatInput("");
      await loadStream();
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  // Camera preview
  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraStreamRef.current = ms;
      setCameraActive(true);
      setTimeout(() => {
        if (cameraRef.current) cameraRef.current.srcObject = ms;
      }, 100);
    } catch { /* permission denied or no camera */ }
  };

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    setCameraActive(false);
  };

  // Go Live
  const handleGoLive = async () => {
    if (goingLive) return;
    setGoingLive(true);
    try {
      await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "go_live",
          title: liveTitle.trim() || "NAVI Live Stream",
          stream_url: liveUrl.trim() || null,
          topic: liveTopic.trim() || null,
        }),
      });
      setShowGoLive(false);
      await loadStream();
    } catch { /* silent */ }
    finally { setGoingLive(false); }
  };

  // End Stream
  const handleEndStream = async () => {
    stopCamera();
    await fetch("/api/streams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end_stream" }),
    });
    await loadStream();
  };

  // Co-host AI analysis
  useEffect(() => {
    if (!stream || stream.status !== "live" || !stream.topic) {
      setCoHost(null);
      return;
    }
    let cancelled = false;
    setCoHostLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `The founder is live streaming about "${stream.topic}". Generate a JSON object with these fields: keyPoints (array of 3-4 key takeaways viewers should know), resources (array of 3-4 actionable resources or links related to this topic), actions (array of 3-4 things viewers should do right now based on this topic). Keep each item to one concise sentence. Return ONLY the JSON object.`,
            userName: "System", petName: "NAVI", mood: "happy",
            bondLevel: 3, bondName: "Partner", mentorMode: "chat",
            appMode: "companion", history: [],
          }),
        });
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          try {
            const parsed = JSON.parse(json.reply);
            setCoHost({
              keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
              resources: Array.isArray(parsed.resources) ? parsed.resources : [],
              actions: Array.isArray(parsed.actions) ? parsed.actions : [],
            });
          } catch {
            setCoHost({ keyPoints: [json.reply], resources: [], actions: [] });
          }
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setCoHostLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [stream?.topic, stream?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const isLive = stream?.status === "live";

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
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: `1px solid ${isLive ? "rgba(239,68,68,0.20)" : "rgba(168,85,247,0.12)"}`,
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: isLive ? "#ef4444" : "#a855f7", marginBottom: 3 }}>
              {isLive ? "● LIVE NOW" : "NAVI Streams"}
            </div>
            <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>
              🎬 {stream?.title ?? "NAVI Streams"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isLive && (
            <div style={{
              padding: "3px 10px", borderRadius: 999,
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.30)",
              fontSize: 9, color: "#ef4444", fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
              LIVE
            </div>
          )}
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>

        {loading && <div style={{ textAlign: "center", padding: "40px 0", fontSize: 11, color: "#a855f7" }}>Loading stream…</div>}

        {/* ── Founder Controls ─────────────────────────────────────────── */}
        {isAdmin && !loading && (
          <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(201,162,39,0.04)", border: "1px solid rgba(201,162,39,0.15)" }}>
            <div style={{ fontSize: 9, color: "#C9A227", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
              👑 Founder Controls
            </div>
            {isLive ? (
              <button onClick={handleEndStream} style={{
                width: "100%", padding: "12px", borderRadius: 10,
                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.30)",
                color: "#ef4444", fontSize: 12, fontWeight: 700, fontFamily: "monospace", cursor: "pointer",
              }}>
                ⏹ End Stream
              </button>
            ) : !showGoLive ? (
              <button onClick={() => setShowGoLive(true)} style={{
                width: "100%", padding: "12px", borderRadius: 10,
                background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none",
                color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "monospace", cursor: "pointer",
                boxShadow: "0 0 16px rgba(239,68,68,0.30)",
              }}>
                🔴 Go Live
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Camera preview */}
                <div style={{ borderRadius: 10, overflow: "hidden", background: "#000", position: "relative" }}>
                  {cameraActive ? (
                    <video ref={cameraRef} autoPlay muted playsInline style={{ width: "100%", height: 160, objectFit: "cover", display: "block", transform: "scaleX(-1)" }} />
                  ) : (
                    <div style={{ height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <button onClick={startCamera} style={{
                        padding: "10px 20px", borderRadius: 10,
                        background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.30)",
                        color: "#a855f7", fontSize: 11, fontWeight: 700, fontFamily: "monospace", cursor: "pointer",
                      }}>
                        📷 Preview Camera
                      </button>
                      <div style={{ fontSize: 8, color: "#475569" }}>Check your camera before going live</div>
                    </div>
                  )}
                  {cameraActive && (
                    <button onClick={stopCamera} style={{
                      position: "absolute", top: 6, right: 6, padding: "3px 8px", borderRadius: 6,
                      background: "rgba(0,0,0,0.7)", border: "none", color: "#f87171", fontSize: 8,
                      fontFamily: "monospace", cursor: "pointer",
                    }}>
                      ✕ Close cam
                    </button>
                  )}
                </div>

                <input value={liveTitle} onChange={(e) => setLiveTitle(e.target.value)} placeholder="Stream title"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }} />
                <input value={liveTopic} onChange={(e) => setLiveTopic(e.target.value)} placeholder="Topic (e.g. Getting Clients, Building Credit)"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }} />
                <input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="Paste YouTube Live or Twitch embed URL"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }} />

                {/* Streaming quick-start guide */}
                <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>📡 How to stream from your camera:</div>

                  <div style={{ fontSize: 9, fontWeight: 600, color: "#a855f7", marginBottom: 3, marginTop: 6 }}>Option 1 — Facebook Live</div>
                  <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.6 }}>
                    1. Go to your <a href="https://www.facebook.com/live/producer" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "underline" }}>Facebook Page → Live Video</a>{"\n"}
                    2. Select "Use Camera" → add title → Go Live{"\n"}
                    3. Click ⋯ on the video → Embed → copy the URL{"\n"}
                    4. Paste above{"\n"}
                    <span style={{ color: "#64748b" }}>Format: facebook.com/plugins/video.php?href=...</span>
                  </div>

                  <div style={{ fontSize: 9, fontWeight: 600, color: "#ef4444", marginBottom: 3, marginTop: 8 }}>Option 2 — YouTube Live</div>
                  <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.6 }}>
                    1. Go to <a href="https://youtube.com/live" target="_blank" rel="noopener noreferrer" style={{ color: "#ef4444", textDecoration: "underline" }}>youtube.com/live</a> → "Go Live" → "Webcam"{"\n"}
                    2. Add title → Go Live{"\n"}
                    3. Copy video URL → replace "watch?v=" with "embed/"{"\n"}
                    4. Paste above{"\n"}
                    <span style={{ color: "#64748b" }}>Format: youtube.com/embed/abc123</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setShowGoLive(false); stopCamera(); }} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b", fontSize: 10, fontFamily: "monospace", cursor: "pointer" }}>Cancel</button>
                  <button onClick={handleGoLive} disabled={goingLive} style={{
                    flex: 2, padding: "10px", borderRadius: 8,
                    background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none",
                    color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "monospace", cursor: "pointer",
                  }}>
                    {goingLive ? "Starting…" : "🔴 Start Stream"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Stream Player ─────────────────────────────────────────────── */}
        {isLive && (
          <div style={{ borderRadius: 14, overflow: "hidden", background: "#000", border: "1px solid rgba(239,68,68,0.20)" }}>
            {stream.stream_url ? (
              <iframe
                width="100%" height="220"
                src={stream.stream_url}
                title={stream.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ display: "block" }}
              />
            ) : (
              <div style={{
                height: 220, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 8,
                background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(168,85,247,0.05))",
              }}>
                <div style={{ fontSize: 40 }}>🎬</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Hosted by NAVI</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{stream.title}</div>
                {stream.topic && <div style={{ fontSize: 9, color: "#a855f7", fontStyle: "italic" }}>Topic: {stream.topic}</div>}
              </div>
            )}
          </div>
        )}

        {/* ── Offline State ────────────────────────────────────────────── */}
        {!isLive && !loading && (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>🎬</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>No stream right now</div>
            <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
              The founder hosts live streams here — business strategy, community updates, and interactive sessions. Check back soon.
            </div>
          </div>
        )}

        {/* ── NAVI Co-Host Panel ────────────────────────────────────────── */}
        {isLive && stream.topic && (
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.15)" }}>
            <div style={{ fontSize: 9, color: "#a855f7", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
              🤖 NAVI Co-Host — {stream.topic}
            </div>

            {coHostLoading && <div style={{ fontSize: 10, color: "#64748b" }}>NAVI is analyzing the topic…</div>}

            {coHost && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {coHost.keyPoints.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#a855f7", marginBottom: 4 }}>Key Points</div>
                    {coHost.keyPoints.map((p, i) => (
                      <div key={i} style={{ fontSize: 10, color: "#e2e8f0", lineHeight: 1.55, marginBottom: 3, display: "flex", gap: 6 }}>
                        <span style={{ color: "#a855f7", flexShrink: 0 }}>•</span> {p}
                      </div>
                    ))}
                  </div>
                )}
                {coHost.resources.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#34d399", marginBottom: 4 }}>Resources</div>
                    {coHost.resources.map((r, i) => (
                      <div key={i} style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.55, marginBottom: 3, display: "flex", gap: 6 }}>
                        <span style={{ color: "#34d399", flexShrink: 0 }}>→</span> {r}
                      </div>
                    ))}
                  </div>
                )}
                {coHost.actions.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#C9A227", marginBottom: 4 }}>Take Action Now</div>
                    {coHost.actions.map((a, i) => (
                      <div key={i} style={{ fontSize: 10, color: "#e2e8f0", lineHeight: 1.55, marginBottom: 3, display: "flex", gap: 6 }}>
                        <span style={{ color: "#C9A227", flexShrink: 0 }}>⚡</span> {a}
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick action buttons */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                  {[
                    { id: "business", label: "Business Plan", icon: "📊" },
                    { id: "resume", label: "Resume Builder", icon: "📄" },
                    { id: "jobs", label: "Find Jobs", icon: "💼" },
                    { id: "trades", label: "Trades Mode", icon: "🚛" },
                  ].map(({ id, label, icon }) => (
                    <button key={id} onClick={() => onAction?.(id)} style={{
                      padding: "5px 10px", borderRadius: 6,
                      background: "rgba(168,85,247,0.08)",
                      border: "1px solid rgba(168,85,247,0.20)",
                      color: "#a855f7", fontSize: 8, fontWeight: 700,
                      fontFamily: "monospace", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Live Chat ────────────────────────────────────────────────── */}
        {isLive && (
          <div style={{
            borderRadius: 14,
            background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(10,10,20,0.95) 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column",
            maxHeight: 300,
          }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 10, fontWeight: 700, color: "#f1f5f9" }}>
              💬 Live Chat
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", minHeight: 120 }}>
              {chat.length === 0 && (
                <div style={{ fontSize: 9, color: "#475569", textAlign: "center", padding: "20px 0" }}>Be the first to chat!</div>
              )}
              {chat.map((msg) => (
                <div key={msg.id} style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#a855f7" }}>{msg.display_name}</span>
                  <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: 6 }}>{msg.content}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "8px 10px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 6 }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value.slice(0, 300))}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                placeholder={authUserId ? "Type a message…" : "Login to chat"}
                disabled={!authUserId}
                style={{
                  flex: 1, padding: "8px 10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0", fontSize: 10, fontFamily: "monospace", outline: "none",
                }}
              />
              <button onClick={handleChat} disabled={!chatInput.trim() || sending || !authUserId}
                style={{
                  padding: "8px 14px", borderRadius: 8,
                  background: chatInput.trim() ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(168,85,247,0.25)",
                  color: "#a855f7", fontSize: 9, fontWeight: 700,
                  fontFamily: "monospace", cursor: chatInput.trim() ? "pointer" : "default",
                }}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
