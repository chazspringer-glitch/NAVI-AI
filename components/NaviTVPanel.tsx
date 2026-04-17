"use client";

import { useState, useEffect, useCallback } from "react";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
}

export default function NaviTVPanel({ onClose }: { onClose: () => void }) {
  const [dbVideos, setDbVideos] = useState<Video[]>([]);
  const [playing, setPlaying] = useState<Video | null>(null);

  // Load any future DB videos
  const loadVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/videos");
      const json = await res.json();
      if (Array.isArray(json.videos)) setDbVideos(json.videos);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadVideos(); }, [loadVideos]);

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
              <video src={playing.video_url} controls autoPlay style={{ width: "100%", maxHeight: "60vh", borderRadius: 12, background: "#000" }} />
            ) : (
              <div style={{ width: "100%", maxWidth: 400, aspectRatio: "16/9", borderRadius: 12, background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(0,212,255,0.08))", border: "1px solid rgba(168,85,247,0.20)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div style={{ fontSize: 36 }}>📺</div>
                <div style={{ fontSize: 11, color: "#a855f7", fontWeight: 600 }}>Coming Soon</div>
              </div>
            )}
          </div>
          <div style={{ padding: "12px 16px 16px", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.6 }}>{playing.description}</div>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* QuantumPen — Featured */}
        <div style={{
          borderRadius: 14,
          background: "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(168,85,247,0.04))",
          border: "1px solid rgba(239,68,68,0.18)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171" }}>🎥 The Truth Room</div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>by QuantumPen</div>
            </div>
            <a href="https://youtube.com/@thequantumpen" target="_blank" rel="noopener noreferrer"
              style={{ padding: "5px 12px", borderRadius: 7, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: 10, fontFamily: "monospace", fontWeight: 600, textDecoration: "none" }}>
              Full Channel ↗
            </a>
          </div>

          {/* Featured Video */}
          <div style={{ padding: "0 16px 16px" }}>
            <div style={{ borderRadius: 12, overflow: "hidden", background: "#000", marginBottom: 12 }}>
              <iframe
                width="100%" height="220"
                src="https://www.youtube.com/embed/Q8mE1aq4GMo"
                title="The Truth Room — Featured"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ display: "block" }}
              />
            </div>

            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6, marginBottom: 12 }}>
              Learn the truth. Understand the history. Elevate your mind. Educational content from QuantumPen — real stories, real knowledge.
            </div>

            {/* More from QuantumPen */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "QuantumPen — Latest Drop", note: "New content added regularly" },
                { label: "Deep History Series", note: "Truth-based education" },
                { label: "Subscribe on YouTube", note: "Never miss a video" },
              ].map((v) => (
                <a key={v.label} href="https://youtube.com/@thequantumpen" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(239,68,68,0.10)" }}>
                    <div style={{ width: 40, height: 28, borderRadius: 6, background: "linear-gradient(135deg, rgba(239,68,68,0.20), rgba(168,85,247,0.20))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: "#f87171" }}>▶</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 500 }}>{v.label}</div>
                      <div style={{ fontSize: 8, color: "#475569" }}>{v.note}</div>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "#475569" }}>↗</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Featured Channels ────────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "#a855f7", fontWeight: 700, marginBottom: 10 }}>
            Featured Channels
          </div>

          {/* Drus World Cartoon */}
          <div style={{
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(251,146,60,0.06), rgba(168,85,247,0.04))",
            border: "1px solid rgba(251,146,60,0.18)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "14px 16px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "linear-gradient(135deg, rgba(251,146,60,0.20), rgba(168,85,247,0.15))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20,
                  }}>
                    🎨
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Drus World Cartoon</div>
                    <div style={{
                      fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase",
                      color: "#fb923c", fontWeight: 700, marginTop: 2,
                    }}>
                      Animation · Kids · Entertainment
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.65, marginBottom: 12 }}>
                A creative cartoon channel delivering animated stories and entertainment content. Great for light viewing, creativity, and engaging storytelling through animation.
              </div>
              <a href="https://m.youtube.com/@DrusWorldCartoon" target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 10,
                  background: "linear-gradient(135deg, #fb923c, #ea580c)",
                  border: "none", color: "#08080f",
                  fontSize: 11, fontFamily: "monospace", fontWeight: 700,
                  textDecoration: "none", letterSpacing: "0.04em",
                  boxShadow: "0 0 14px rgba(251,146,60,0.30)",
                }}>
                Watch Channel ↗
              </a>
            </div>
          </div>
        </div>

        {/* More content coming soon */}
        <div style={{
          padding: "20px 16px", borderRadius: 14, textAlign: "center",
          background: "rgba(168,85,247,0.03)",
          border: "1px solid rgba(168,85,247,0.10)",
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📺</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#a855f7", marginBottom: 4 }}>More Channels Coming Soon</div>
          <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.5 }}>
            NaviTV is growing. Have a channel? Reach out to be featured.
          </div>
        </div>

        {/* DB videos — shown when admin adds them */}
        {dbVideos.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.18em", color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>
              More Videos
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {dbVideos.map((v) => (
                <div key={v.id} onClick={() => setPlaying(v)} style={{
                  borderRadius: 12, overflow: "hidden", cursor: "pointer",
                  background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    height: 80,
                    background: v.thumbnail_url ? `url(${v.thumbnail_url}) center/cover` : "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>▶</div>
                  </div>
                  <div style={{ padding: "8px 8px 10px" }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.3 }}>{v.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
