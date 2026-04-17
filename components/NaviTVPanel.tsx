"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const PodcastPanel = dynamic(() => import("@/components/PodcastPanel"), { ssr: false });

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
}

interface YTVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
  viewCount?: string;
  duration?: string;
}

interface YTChannel {
  channelId: string;
  name: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  videos: YTVideo[];
}

// Channel config — add new channels here
const CHANNELS = [
  { handle: "@thequantumpen",     label: "The Truth Room",        accent: "#f87171", icon: "🎥", category: "Education · History · Culture",       fallbackEmbed: "https://www.youtube.com/embed/Q8mE1aq4GMo" },
  { handle: "@DrusWorldCartoon",  label: "Drus World Cartoon",    accent: "#fb923c", icon: "🎨", category: "Animation · Kids · Entertainment",    fallbackEmbed: "https://www.youtube.com/embed/Xnw-emPozQU" },
];

export default function NaviTVPanel({ onClose }: { onClose: () => void }) {
  const [dbVideos, setDbVideos] = useState<Video[]>([]);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [showPodcastApp, setShowPodcastApp] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [ytChannels, setYtChannels] = useState<Record<string, YTChannel>>({});
  const [ytLoading, setYtLoading] = useState(true);
  const [ytError, setYtError] = useState(false);

  // Load DB videos
  const loadVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/videos");
      const json = await res.json();
      if (Array.isArray(json.videos)) setDbVideos(json.videos);
    } catch { /* silent */ }
  }, []);
  useEffect(() => { loadVideos(); }, [loadVideos]);

  // Load YouTube channel data
  useEffect(() => {
    let cancelled = false;
    setYtLoading(true);
    (async () => {
      const results: Record<string, YTChannel> = {};
      let anySuccess = false;
      for (const ch of CHANNELS) {
        try {
          const res = await fetch(`/api/youtube?handle=${encodeURIComponent(ch.handle)}`);
          if (cancelled) return;
          if (res.ok) {
            const json = await res.json();
            if (json.channel) {
              results[ch.handle] = json.channel;
              anySuccess = true;
            }
          }
        } catch { /* silent */ }
      }
      if (!cancelled) {
        setYtChannels(results);
        setYtError(!anySuccess);
        setYtLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

      {/* YouTube embed modal */}
      {embedUrl && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 80,
          background: "rgba(0,0,0,0.95)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}>
            <button onClick={() => setEmbedUrl(null)} style={{ padding: "6px 14px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#64748b", fontSize: 10, fontFamily: "monospace", cursor: "pointer" }}>✕ Close</button>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <iframe
              width="100%" height="100%"
              src={embedUrl}
              title="NaviTV Player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ display: "block", maxHeight: "60vh", borderRadius: 12, background: "#000" }}
            />
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Channels (YouTube API or fallback) ─────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CHANNELS.map((cfg) => {
            const yt = ytChannels[cfg.handle];
            const channelUrl = `https://youtube.com/${cfg.handle}`;
            return (
              <div key={cfg.handle} style={{
                borderRadius: 14,
                background: `linear-gradient(135deg, ${cfg.accent}0a, rgba(168,85,247,0.04))`,
                border: `1px solid ${cfg.accent}28`,
                padding: "14px 16px",
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  {yt?.thumbnail ? (
                    <img src={yt.thumbnail} alt="" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${cfg.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {cfg.icon}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{yt?.name ?? cfg.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                      <div style={{ fontSize: 7, letterSpacing: "0.14em", textTransform: "uppercase", color: cfg.accent, fontWeight: 700 }}>
                        {cfg.category}
                      </div>
                      {yt && (
                        <div style={{ fontSize: 8, color: "#64748b" }}>
                          {yt.subscriberCount} subs · {yt.videoCount} videos
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Video grid (from YouTube API) or fallback buttons */}
                {yt && yt.videos.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    {yt.videos.slice(0, 4).map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setEmbedUrl(`https://www.youtube.com/embed/${v.id}`)}
                        style={{
                          borderRadius: 10, overflow: "hidden", cursor: "pointer",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          padding: 0, textAlign: "left",
                        }}
                      >
                        <div style={{ position: "relative" }}>
                          <img src={v.thumbnail} alt="" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", bottom: 4, right: 4, padding: "1px 5px", borderRadius: 4, background: "rgba(0,0,0,0.75)", fontSize: 8, color: "#fff", fontFamily: "monospace" }}>
                            {v.duration || "▶"}
                          </div>
                          {v.viewCount && (
                            <div style={{ position: "absolute", bottom: 4, left: 4, padding: "1px 5px", borderRadius: 4, background: "rgba(0,0,0,0.75)", fontSize: 7, color: "#94a3b8", fontFamily: "monospace" }}>
                              {v.viewCount} views
                            </div>
                          )}
                        </div>
                        <div style={{ padding: "6px 8px" }}>
                          <div style={{ fontSize: 9, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {v.title}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginBottom: 10 }}>
                    {ytLoading ? (
                      <div style={{ fontSize: 9, color: "#64748b", padding: "8px 0" }}>Loading videos…</div>
                    ) : (
                      <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.6, marginBottom: 8 }}>
                        Tap Watch Now to see the latest from this channel.
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      const latestId = yt?.videos?.[0]?.id;
                      setEmbedUrl(latestId ? `https://www.youtube.com/embed/${latestId}` : cfg.fallbackEmbed);
                    }}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 10,
                      background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.accent}cc)`,
                      border: "none", color: "#08080f",
                      fontSize: 11, fontFamily: "monospace", fontWeight: 700,
                      cursor: "pointer", letterSpacing: "0.04em",
                      boxShadow: `0 0 12px ${cfg.accent}40`,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}
                  >
                    ▶ {yt ? "Latest" : "Watch Now"}
                  </button>
                  <a href={channelUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      flex: 1, padding: "10px", borderRadius: 10,
                      background: `${cfg.accent}10`,
                      border: `1px solid ${cfg.accent}30`,
                      color: cfg.accent,
                      fontSize: 11, fontFamily: "monospace", fontWeight: 700,
                      textDecoration: "none", letterSpacing: "0.04em",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}
                  >
                    Full Channel ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Podcast Partnership ─────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "#f472b6", fontWeight: 700, marginBottom: 10 }}>
            Podcast Partnership
          </div>

          {!showPodcastApp ? (
            <div style={{
              borderRadius: 14,
              background: "linear-gradient(135deg, rgba(244,114,182,0.06), rgba(168,85,247,0.04))",
              border: "1px solid rgba(244,114,182,0.18)",
              padding: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(244,114,182,0.20), rgba(168,85,247,0.15))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>
                  🎙️
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Get Featured on NAVI</div>
                  <div style={{ fontSize: 7, letterSpacing: "0.16em", textTransform: "uppercase", color: "#f472b6", fontWeight: 700, marginTop: 2 }}>
                    Podcast · Creator · Content
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.65, marginBottom: 12 }}>
                Have a podcast or content channel? Apply to be featured inside NAVI{"'"}s ecosystem. Get exposure to our growing community, AI-powered promotion, and creator resources.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                {["App exposure", "Community reach", "AI promotion", "Creator support", "Growth strategy"].map((b) => (
                  <span key={b} style={{
                    padding: "3px 8px", borderRadius: 6, fontSize: 8,
                    background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.18)",
                    color: "#f472b6", fontWeight: 600,
                  }}>{b}</span>
                ))}
              </div>
              <button
                onClick={() => setShowPodcastApp(true)}
                style={{
                  width: "100%", padding: "12px", borderRadius: 10,
                  background: "linear-gradient(135deg, #f472b6, #db2777)",
                  border: "none", color: "#08080f",
                  fontSize: 12, fontFamily: "monospace", fontWeight: 700,
                  cursor: "pointer", letterSpacing: "0.04em",
                  boxShadow: "0 0 14px rgba(244,114,182,0.30)",
                }}>
                Apply Now →
              </button>
            </div>
          ) : (
            <div style={{
              borderRadius: 14,
              border: "1px solid rgba(244,114,182,0.18)",
              overflow: "hidden",
              background: "rgba(4,4,12,0.95)",
            }}>
              <div style={{ padding: "10px 16px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f472b6" }}>🎙️ Partnership Application</div>
                <button
                  onClick={() => setShowPodcastApp(false)}
                  style={{ background: "none", border: "none", color: "#64748b", fontSize: 10, fontFamily: "monospace", cursor: "pointer" }}>
                  ✕ Close
                </button>
              </div>
              <PodcastPanel />
            </div>
          )}
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
