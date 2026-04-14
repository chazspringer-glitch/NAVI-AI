"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { xpForNextLevel } from "@/lib/leaderboard";

interface LBEntry {
  user_id: string;
  display_name: string;
  xp: number;
  level: number;
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];
const LEVEL_COLORS = ["#64748b", "#00d4ff", "#34d399", "#C9A227", "#a855f7", "#f472b6", "#f59e0b", "#ef4444", "#00d4ff", "#C9A227"];

export default function LeaderboardPanel({ onClose }: { onClose: () => void }) {
  const [top, setTop] = useState<LBEntry[]>([]);
  const [userRank, setUserRank] = useState<{ entry: LBEntry | null; rank: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const loadData = useCallback(async (uid: string | null) => {
    setLoading(true);
    try {
      const url = uid ? `/api/leaderboard?user_id=${uid}` : "/api/leaderboard";
      const res = await fetch(url);
      const json = await res.json();
      setTop(json.top || []);
      setUserRank(json.userRank || null);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      loadData(uid);
    });
  }, [loadData]);

  const myEntry = userRank?.entry;
  const myRankNum = userRank?.rank || 0;
  const progress = myEntry ? xpForNextLevel(myEntry.xp) : null;

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
        borderBottom: "1px solid rgba(201,162,39,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#C9A227", marginBottom: 3 }}>NAVI</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>🏆 Leaderboard</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* Scrollable */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Your rank card */}
        {myEntry && (
          <div style={{
            padding: "16px", borderRadius: 14,
            background: "linear-gradient(135deg, rgba(201,162,39,0.08), rgba(201,162,39,0.03))",
            border: "1px solid rgba(201,162,39,0.20)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>Your Rank</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#C9A227" }}>#{myRankNum}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>Level {myEntry.level}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>{myEntry.xp.toLocaleString()} XP</div>
              </div>
            </div>
            {progress && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Level {myEntry.level}</span>
                  <span style={{ fontSize: 9, color: "#64748b" }}>Level {myEntry.level + 1}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{
                    width: `${progress.progress}%`, height: "100%", borderRadius: 3,
                    background: "linear-gradient(90deg, #C9A227, #f5c842)",
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <div style={{ fontSize: 8, color: "#475569", marginTop: 4, textAlign: "center" }}>
                  {progress.next - myEntry.xp} XP to next level
                </div>
              </div>
            )}
          </div>
        )}

        {/* How to earn XP */}
        <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.10)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00d4ff", marginBottom: 8 }}>How to Earn XP</div>
          {[
            { action: "Send a chat message", xp: "+5 XP", icon: "💬" },
            { action: "Use voice mode", xp: "+10 XP", icon: "🎤" },
            { action: "Use a tool", xp: "+20 XP", icon: "🔧" },
            { action: "Complete onboarding", xp: "+50 XP", icon: "🎯" },
          ].map(({ action, xp, icon }) => (
            <div key={action} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#94a3b8" }}>
                <span>{icon}</span> {action}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#00d4ff" }}>{xp}</span>
            </div>
          ))}
        </div>

        {/* Top 10 */}
        <div style={{
          borderRadius: 14,
          background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
          border: "1px solid rgba(201,162,39,0.10)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#C9A227" }}>Top 10</div>
          </div>

          {loading && (
            <div style={{ padding: "20px 16px", textAlign: "center", fontSize: 10, color: "#C9A227" }}>Loading...</div>
          )}

          {!loading && top.length === 0 && (
            <div style={{ padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 16, marginBottom: 6 }}>🏆</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>No rankings yet — be the first!</div>
            </div>
          )}

          {top.map((entry, i) => {
            const isMe = userId && entry.user_id === userId;
            const levelColor = LEVEL_COLORS[Math.min(entry.level - 1, 9)];
            return (
              <div key={entry.user_id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px",
                borderBottom: i < top.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                background: isMe ? "rgba(201,162,39,0.06)" : "transparent",
              }}>
                {/* Rank */}
                <div style={{ width: 24, fontSize: i < 3 ? 18 : 12, fontWeight: 700, color: i < 3 ? "#C9A227" : "#475569", textAlign: "center", flexShrink: 0 }}>
                  {i < 3 ? RANK_MEDALS[i] : `${i + 1}`}
                </div>

                {/* Level badge */}
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: `${levelColor}18`, border: `1px solid ${levelColor}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: levelColor, flexShrink: 0,
                }}>
                  {entry.level}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: isMe ? 700 : 500,
                    color: isMe ? "#C9A227" : "#f1f5f9",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {entry.display_name || "NAVI User"}
                    {isMe && <span style={{ fontSize: 8, color: "#C9A227", marginLeft: 4 }}>(you)</span>}
                  </div>
                </div>

                {/* XP */}
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", flexShrink: 0 }}>
                  {entry.xp.toLocaleString()}
                  <span style={{ fontSize: 8, color: "#475569", marginLeft: 2 }}>XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
