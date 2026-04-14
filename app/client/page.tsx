"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ClientPage() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) console.log("[Client] User:", session.user.id);
    });
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#08080f", fontFamily: "monospace",
      padding: 20,
    }}>
      {/* Glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: 300, height: 300, borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 65%)",
      }} />

      <div style={{ position: "relative", textAlign: "center", maxWidth: 420 }}>
        {/* Icon */}
        <div style={{ fontSize: 48, marginBottom: 20 }}>🚀</div>

        {/* Brand */}
        <div style={{
          fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase",
          color: "#C9A227", marginBottom: 10,
        }}>
          Springer Industries
        </div>

        {/* Title */}
        <div style={{
          fontSize: 24, fontWeight: 800, color: "#f1f5f9", marginBottom: 10,
          textShadow: "0 0 20px rgba(201,162,39,0.20)",
        }}>
          Client Dashboard
        </div>
        <div style={{
          fontSize: 16, fontWeight: 700, color: "#C9A227", marginBottom: 16,
        }}>
          Coming Soon
        </div>

        {/* Description */}
        <div style={{
          fontSize: 12, color: "#94a3b8", lineHeight: 1.7, marginBottom: 28,
        }}>
          We{"'"}re building something powerful for you. Your personal dashboard will include
          real-time analytics, content scheduling, AI-powered marketing tools, and a
          direct line to your strategy team.
        </div>

        {/* Feature preview cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
          {[
            { icon: "📊", label: "Growth Analytics", desc: "Track followers, engagement & reach" },
            { icon: "📅", label: "Content Calendar", desc: "Schedule posts across platforms" },
            { icon: "✨", label: "AI Content Generator", desc: "Captions, hashtags & post ideas" },
            { icon: "📤", label: "Content Uploads", desc: "Upload images & videos directly" },
            { icon: "📋", label: "Work Orders", desc: "View your strategy & deliverables" },
            { icon: "🧠", label: "NAVI Assistant", desc: "Your AI marketing advisor" },
          ].map(({ icon, label, desc }) => (
            <div key={label} style={{
              padding: "14px 12px", borderRadius: 14,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(201,162,39,0.10)",
              textAlign: "left",
            }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          padding: "14px 20px", borderRadius: 14,
          background: "rgba(201,162,39,0.06)",
          border: "1px solid rgba(201,162,39,0.18)",
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: "#C9A227", fontWeight: 700, marginBottom: 4 }}>
            Stay Tuned
          </div>
          <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>
            Complete your onboarding through "Work With Us" to be first in line when the dashboard launches.
          </div>
        </div>

        {/* Back link */}
        <a href="/" style={{
          fontSize: 11, color: "#475569", textDecoration: "none",
        }}>
          ← Back to NAVI
        </a>
      </div>
    </div>
  );
}
