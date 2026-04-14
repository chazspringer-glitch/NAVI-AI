"use client";

import { useState, useEffect, useCallback } from "react";

const CATEGORIES = ["All", "Money", "Housing", "AI", "Motivation", "Business", "Health", "History"];

// Starter content — shown when DB is empty or as defaults
const STARTER_VIDEOS = [
  { id: "s1", title: "How to Build Credit From Scratch", description: "NAVI breaks down the exact steps to build your credit score from zero. No gimmicks, just real strategies.", video_url: "", thumbnail_url: "", category: "Money" },
  { id: "s2", title: "5 Side Hustles You Can Start Today", description: "Real ways to make extra income using skills you already have. NAVI shows you how.", video_url: "", thumbnail_url: "", category: "Business" },
  { id: "s3", title: "Understanding Section 8 Housing", description: "Everything you need to know about Housing Choice Vouchers — how to apply, what to expect, and your rights.", video_url: "", thumbnail_url: "", category: "Housing" },
  { id: "s4", title: "AI Tools That Can Change Your Life", description: "The best free AI tools for job searching, learning, creating content, and managing money.", video_url: "", thumbnail_url: "", category: "AI" },
  { id: "s5", title: "Morning Mindset: You Are Enough", description: "A powerful 5-minute motivation session to start your day right. Your circumstances don't define your future.", video_url: "", thumbnail_url: "", category: "Motivation" },
  { id: "s6", title: "How to Eat Healthy on a Budget", description: "Meal planning, smart shopping, and recipes that cost less than fast food. Your health matters.", video_url: "", thumbnail_url: "", category: "Health" },
  { id: "s7", title: "Black Wall Street: The Full Story", description: "The rise, destruction, and legacy of the wealthiest Black community in American history.", video_url: "", thumbnail_url: "", category: "History" },
  { id: "s8", title: "Resume Tips That Actually Work", description: "Stop getting ignored. NAVI teaches you how to write a resume that gets interviews.", video_url: "", thumbnail_url: "", category: "Business" },
  { id: "s9", title: "What Is AI? Explained Simply", description: "AI isn't magic — it's a tool. Learn what it really is and how you can use it every day.", video_url: "", thumbnail_url: "", category: "AI" },
  { id: "s10", title: "How to Save $1,000 in 90 Days", description: "A realistic savings plan that works even on a tight budget. Step by step.", video_url: "", thumbnail_url: "", category: "Money" },
  { id: "s11", title: "Finding Affordable Housing: Step by Step", description: "NAVI walks you through the entire process — from searching to signing the lease.", video_url: "", thumbnail_url: "", category: "Housing" },
  { id: "s12", title: "You Are Built for This", description: "When life gets hard, remember: every challenge is building you for something greater.", video_url: "", thumbnail_url: "", category: "Motivation" },
];

const CAT_COLORS: Record<string, string> = {
  Money: "#34d399", Housing: "#00d4ff", AI: "#a855f7", Motivation: "#f59e0b",
  Business: "#C9A227", Health: "#f472b6", History: "#f87171", All: "#64748b",
};

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
}

export default function NaviTVPanel({ onClose }: { onClose: () => void }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<Video | null>(null);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/videos${category !== "All" ? `?category=${category}` : ""}`);
      const json = await res.json();
      if (Array.isArray(json.videos) && json.videos.length > 0) {
        setVideos(json.videos);
      } else {
        // Use starter content filtered by category
        const filtered = category === "All" ? STARTER_VIDEOS : STARTER_VIDEOS.filter((v) => v.category === category);
        setVideos(filtered);
      }
    } catch {
      const filtered = category === "All" ? STARTER_VIDEOS : STARTER_VIDEOS.filter((v) => v.category === category);
      setVideos(filtered);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  const playNext = () => {
    if (!playing) return;
    const idx = videos.findIndex((v) => v.id === playing.id);
    if (idx >= 0 && idx < videos.length - 1) {
      setPlaying(videos[idx + 1]);
    } else {
      setPlaying(null);
    }
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
      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(168,85,247,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#a855f7", marginBottom: 3 }}>Streaming</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>📺 NaviTV</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* Video player modal */}
      {playing && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 80,
          background: "rgba(0,0,0,0.95)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", flex: 1 }}>{playing.title}</div>
            <button onClick={() => setPlaying(null)} style={{ padding: "4px 12px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#64748b", fontSize: 10, fontFamily: "monospace", cursor: "pointer" }}>✕ Close</button>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            {playing.video_url ? (
              <video
                src={playing.video_url}
                controls
                autoPlay
                onEnded={playNext}
                style={{ width: "100%", maxHeight: "60vh", borderRadius: 12, background: "#000" }}
              />
            ) : (
              <div style={{
                width: "100%", maxWidth: 400, aspectRatio: "16/9",
                borderRadius: 12, background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(0,212,255,0.08))",
                border: "1px solid rgba(168,85,247,0.20)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
              }}>
                <div style={{ fontSize: 36 }}>📺</div>
                <div style={{ fontSize: 11, color: "#a855f7", fontWeight: 600 }}>Coming Soon</div>
                <div style={{ fontSize: 9, color: "#475569", textAlign: "center", padding: "0 20px" }}>
                  This video is being produced. Check back soon!
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: "12px 16px 16px", flexShrink: 0 }}>
            <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 8, fontWeight: 600, color: CAT_COLORS[playing.category] || "#64748b", background: `${CAT_COLORS[playing.category] || "#64748b"}15`, border: `1px solid ${CAT_COLORS[playing.category] || "#64748b"}30` }}>
              {playing.category}
            </span>
            <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.6, marginTop: 8 }}>{playing.description}</div>
            <button onClick={playNext} style={{ marginTop: 10, padding: "8px 16px", borderRadius: 8, background: "rgba(168,85,247,0.10)", border: "1px solid rgba(168,85,247,0.25)", color: "#a855f7", fontSize: 10, fontFamily: "monospace", fontWeight: 600, cursor: "pointer" }}>
              Next Video →
            </button>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Category filters */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, flexShrink: 0 }}>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: "6px 12px", borderRadius: 8, whiteSpace: "nowrap",
              fontSize: 10, fontFamily: "monospace", cursor: "pointer",
              background: category === c ? `${CAT_COLORS[c] || "#64748b"}18` : "rgba(255,255,255,0.03)",
              border: category === c ? `1px solid ${CAT_COLORS[c] || "#64748b"}45` : "1px solid rgba(255,255,255,0.06)",
              color: category === c ? CAT_COLORS[c] || "#64748b" : "#475569",
              fontWeight: category === c ? 700 : 400,
            }}>
              {c}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 10, color: "#a855f7" }}>Loading videos...</div>
          </div>
        )}

        {/* Truth Room — Featured */}
        {!loading && category === "All" && (
          <div style={{
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(168,85,247,0.04))",
            border: "1px solid rgba(239,68,68,0.18)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "12px 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f87171" }}>🎥 The Truth Room</div>
                <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>by QuantumPen</div>
              </div>
              <a href="https://youtube.com/@thequantumpen" target="_blank" rel="noopener noreferrer"
                style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)", color: "#f87171", fontSize: 9, fontFamily: "monospace", fontWeight: 600, textDecoration: "none" }}>
                Full Channel ↗
              </a>
            </div>
            <div style={{ padding: "0 14px 14px" }}>
              <div style={{ borderRadius: 10, overflow: "hidden", background: "#000" }}>
                <iframe
                  width="100%" height="200"
                  src="https://www.youtube.com/embed/Q8mE1aq4GMo"
                  title="The Truth Room — Featured"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ display: "block" }}
                />
              </div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  { label: "QuantumPen — Latest Drop", note: "New content added regularly" },
                  { label: "Deep History Series", note: "Truth-based education" },
                ].map((v) => (
                  <a key={v.label} href="https://youtube.com/@thequantumpen" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(239,68,68,0.10)" }}>
                      <div style={{ width: 36, height: 26, borderRadius: 4, background: "linear-gradient(135deg, rgba(239,68,68,0.20), rgba(168,85,247,0.20))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: "#f87171" }}>▶</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#e2e8f0" }}>{v.label}</div>
                        <div style={{ fontSize: 8, color: "#475569" }}>{v.note}</div>
                      </div>
                      <span style={{ marginLeft: "auto", fontSize: 10, color: "#475569" }}>↗</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommended */}
        {!loading && category === "All" && videos.length > 3 && (
          <div>
            <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.18em", color: "#C9A227", textTransform: "uppercase", marginBottom: 10 }}>
              Recommended for You
            </div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {videos.slice(0, 3).map((v) => (
                <div key={v.id} onClick={() => setPlaying(v)} style={{
                  minWidth: 200, borderRadius: 12, overflow: "hidden", cursor: "pointer",
                  background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
                  border: "1px solid rgba(168,85,247,0.12)",
                  flexShrink: 0,
                }}>
                  <div style={{
                    height: 100, background: v.thumbnail_url ? `url(${v.thumbnail_url}) center/cover` : `linear-gradient(135deg, ${CAT_COLORS[v.category] || "#64748b"}20, ${CAT_COLORS[v.category] || "#64748b"}08)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>▶</div>
                    <span style={{ position: "absolute", top: 6, right: 6, padding: "1px 6px", borderRadius: 4, fontSize: 7, fontWeight: 600, color: CAT_COLORS[v.category], background: "rgba(0,0,0,0.6)" }}>{v.category}</span>
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.3 }}>{v.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All videos grid */}
        {!loading && (
          <div>
            {category === "All" && videos.length > 3 && (
              <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.18em", color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>
                All Videos
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(category === "All" && videos.length > 3 ? videos.slice(3) : videos).map((v) => (
                <div key={v.id} onClick={() => setPlaying(v)} style={{
                  borderRadius: 12, overflow: "hidden", cursor: "pointer",
                  background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    height: 80,
                    background: v.thumbnail_url ? `url(${v.thumbnail_url}) center/cover` : `linear-gradient(135deg, ${CAT_COLORS[v.category] || "#64748b"}15, ${CAT_COLORS[v.category] || "#64748b"}05)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>▶</div>
                    <span style={{ position: "absolute", top: 4, right: 4, padding: "1px 5px", borderRadius: 3, fontSize: 7, fontWeight: 600, color: CAT_COLORS[v.category], background: "rgba(0,0,0,0.6)" }}>{v.category}</span>
                  </div>
                  <div style={{ padding: "8px 8px 10px" }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.3 }}>{v.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📺</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>No videos in this category yet</div>
          </div>
        )}
      </div>
    </div>
  );
}
