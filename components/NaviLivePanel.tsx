"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Post {
  id: string;
  user_id: string | null;
  display_name: string;
  content: string;
  label: "community_report" | "verified_source" | "unconfirmed";
  likes: number;
  reply_count: number;
  parent_id: string | null;
  expires_at: string;
  created_at: string;
}

const LABEL_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  community_report: { label: "Community Report", color: "#00d4ff", icon: "💬" },
  verified_source:  { label: "Verified Source",  color: "#34d399", icon: "✅" },
  unconfirmed:      { label: "Unconfirmed",      color: "#f59e0b", icon: "⚠️" },
};

function timeAgo(iso: string): string {
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return "expired";
}

function timeLeft(iso: string): string {
  const left = Math.max(0, (new Date(iso).getTime() - Date.now()) / 1000);
  if (left <= 0)     return "expired";
  if (left < 3600)   return `${Math.floor(left / 60)}m left`;
  return `${Math.floor(left / 3600)}h left`;
}

export default function NaviLivePanel({ onClose }: { onClose: () => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, Post[]>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUserId(session.user.id);
        const md = session.user.user_metadata ?? {};
        setAuthDisplayName(
          (md.display_name || md.full_name || "").trim() ||
          (session.user.email ? session.user.email.split("@")[0] : "") ||
          "NAVI User"
        );
      }
    });
  }, []);

  // Fetch posts
  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/community");
      const json = await res.json();
      if (Array.isArray(json.posts)) setPosts(json.posts);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadPosts();
    const interval = setInterval(loadPosts, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [loadPosts]);

  // Create post
  const handlePost = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: authUserId,
          display_name: authDisplayName,
          content: content.trim(),
        }),
      });
      if (res.ok) {
        setContent("");
        setComposing(false);
        await loadPosts();
      }
    } catch { /* silent */ }
    finally { setPosting(false); }
  };

  // Like
  const handleLike = async (id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    await fetch("/api/community", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "like" }),
    }).catch(() => {});
  };

  // Load replies
  const loadReplies = async (postId: string) => {
    try {
      const res = await fetch(`/api/community?parent_id=${postId}`);
      const json = await res.json();
      if (Array.isArray(json.posts)) {
        setReplies((prev) => ({ ...prev, [postId]: json.posts }));
      }
    } catch { /* silent */ }
  };

  // Submit reply
  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    try {
      await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: authUserId,
          display_name: authDisplayName,
          content: replyContent.trim(),
          parent_id: parentId,
        }),
      });
      setReplyContent("");
      setReplyTo(null);
      await loadReplies(parentId);
      await loadPosts();
    } catch { /* silent */ }
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
        borderBottom: "1px solid rgba(0,212,255,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#00d4ff", marginBottom: 3 }}>Community</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>🔴 NAVI Live</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 8, color: "#64748b" }}>{posts.length} posts · 24h expiry</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
        </div>
      </div>

      {/* Truth label legend */}
      <div style={{ display: "flex", gap: 8, padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
        {Object.values(LABEL_CONFIG).map(({ label, color, icon }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 8, color }}>
            <span>{icon}</span> {label}
          </div>
        ))}
      </div>

      {/* Scrollable feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Compose button / form */}
        {!composing ? (
          <button onClick={() => {
            if (!authUserId) { window.location.href = "/login?redirect=onboarding"; return; }
            setComposing(true);
          }} style={{
            width: "100%", padding: "14px", borderRadius: 14, cursor: "pointer",
            background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(168,85,247,0.04))",
            border: "1px solid rgba(0,212,255,0.20)",
            color: "#00d4ff", fontSize: 12, fontWeight: 700,
            fontFamily: "monospace", letterSpacing: "0.04em",
          }}>
            + Share something with the community
          </button>
        ) : (
          <div style={{
            padding: "14px", borderRadius: 14,
            background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(10,10,20,0.95) 100%)",
            border: "1px solid rgba(0,212,255,0.20)",
          }}>
            <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>
              Posting as <span style={{ color: "#00d4ff", fontWeight: 600 }}>{authDisplayName}</span> · expires in 24 hours
            </div>
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="What's happening in your community?"
              rows={3}
              style={{
                width: "100%", padding: "10px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0", fontSize: 12, fontFamily: "monospace",
                outline: "none", resize: "none",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 8, color: content.length > 450 ? "#f87171" : "#475569" }}>
                {content.length}/500
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { setComposing(false); setContent(""); }}
                  style={{ padding: "6px 12px", borderRadius: 8, background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b", fontSize: 10, fontFamily: "monospace", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handlePost} disabled={posting || !content.trim()}
                  style={{
                    padding: "6px 16px", borderRadius: 8,
                    background: content.trim() ? "linear-gradient(135deg, #00d4ff, #0891b2)" : "rgba(255,255,255,0.04)",
                    border: "none",
                    color: content.trim() ? "#08080f" : "#475569",
                    fontSize: 10, fontWeight: 700, fontFamily: "monospace", cursor: content.trim() ? "pointer" : "default",
                  }}>
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "30px 0", fontSize: 11, color: "#00d4ff" }}>Loading community posts…</div>
        )}

        {/* Empty */}
        {!loading && posts.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Be the first to post</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Share what{"'"}s happening in your community. Posts disappear after 24 hours.</div>
          </div>
        )}

        {/* Posts */}
        {posts.map((post) => {
          const lbl = LABEL_CONFIG[post.label] ?? LABEL_CONFIG.community_report;
          const isExpanded = expandedPost === post.id;
          return (
            <div key={post.id} style={{
              padding: "14px", borderRadius: 14,
              background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(10,10,20,0.95) 100%)",
              border: `1px solid ${lbl.color}18`,
            }}>
              {/* Post header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: `${lbl.color}15`, border: `1px solid ${lbl.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: lbl.color,
                  }}>
                    {post.display_name[0]?.toUpperCase() ?? "N"}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9" }}>{post.display_name}</div>
                    <div style={{ fontSize: 8, color: "#475569" }}>{timeAgo(post.created_at)} · {timeLeft(post.expires_at)}</div>
                  </div>
                </div>
                <div style={{
                  padding: "2px 8px", borderRadius: 6,
                  fontSize: 7, fontWeight: 700,
                  color: lbl.color,
                  background: `${lbl.color}12`,
                  border: `1px solid ${lbl.color}25`,
                  display: "flex", alignItems: "center", gap: 3,
                }}>
                  {lbl.icon} {lbl.label}
                </div>
              </div>

              {/* Content */}
              <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.65, marginBottom: 10 }}>
                {post.content}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => handleLike(post.id)} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "none", border: "none", color: "#64748b", fontSize: 10,
                  fontFamily: "monospace", cursor: "pointer",
                }}>
                  ❤️ {post.likes > 0 ? post.likes : ""}
                </button>
                <button onClick={() => {
                  if (isExpanded) { setExpandedPost(null); } else {
                    setExpandedPost(post.id);
                    loadReplies(post.id);
                  }
                }} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "none", border: "none", color: "#64748b", fontSize: 10,
                  fontFamily: "monospace", cursor: "pointer",
                }}>
                  💬 {post.reply_count > 0 ? post.reply_count : ""} {isExpanded ? "▲" : "Reply"}
                </button>
              </div>

              {/* Expanded replies */}
              {isExpanded && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  {/* Reply input */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <input
                      value={replyTo === post.id ? replyContent : ""}
                      onChange={(e) => { setReplyTo(post.id); setReplyContent(e.target.value.slice(0, 300)); }}
                      onFocus={() => setReplyTo(post.id)}
                      placeholder="Write a reply…"
                      style={{
                        flex: 1, padding: "8px 10px", borderRadius: 8,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#e2e8f0", fontSize: 10, fontFamily: "monospace", outline: "none",
                      }}
                    />
                    <button onClick={() => handleReply(post.id)}
                      disabled={!replyContent.trim() || replyTo !== post.id}
                      style={{
                        padding: "8px 12px", borderRadius: 8,
                        background: replyContent.trim() && replyTo === post.id ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(0,212,255,0.20)",
                        color: "#00d4ff", fontSize: 9, fontWeight: 700,
                        fontFamily: "monospace", cursor: "pointer",
                      }}>
                      Send
                    </button>
                  </div>
                  {/* Reply list */}
                  {(replies[post.id] ?? []).map((r) => (
                    <div key={r.id} style={{
                      padding: "8px 10px", marginBottom: 4, borderRadius: 8,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      <div style={{ fontSize: 9, color: "#00d4ff", fontWeight: 600 }}>
                        {r.display_name} <span style={{ color: "#475569", fontWeight: 400 }}>· {timeAgo(r.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.55, marginTop: 2 }}>{r.content}</div>
                    </div>
                  ))}
                  {(replies[post.id] ?? []).length === 0 && (
                    <div style={{ fontSize: 9, color: "#475569", textAlign: "center", padding: "8px 0" }}>No replies yet</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
