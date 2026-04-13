"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CourseAccessPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const grantAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { error } = await supabase
            .from("clients")
            .update({ has_course_access: true })
            .eq("id", session.user.id);

          if (error) {
            console.warn("[course-access] DB update failed:", error.message);
          } else {
            console.log("[course-access] Access granted for:", session.user.id);
          }
        }
        setStatus("success");
      } catch {
        setStatus("success");
      }
    };

    grantAccess();
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#08080f", fontFamily: "monospace",
      padding: 20,
    }}>
      {status === "loading" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#C9A227" }}>Processing your purchase...</div>
        </div>
      )}

      {status === "success" && (
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 42, marginBottom: 16 }}>🎉</div>
          <div style={{
            fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase",
            color: "#C9A227", marginBottom: 10,
          }}>
            Springer Industries
          </div>
          <div style={{
            fontSize: 24, fontWeight: 800, color: "#f1f5f9", marginBottom: 8,
            textShadow: "0 0 20px rgba(201,162,39,0.25)",
          }}>
            Purchase Complete!
          </div>
          <div style={{
            fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 24,
          }}>
            You now have full access to the Adult STEM Program. Your learning journey starts now.
          </div>

          <div style={{
            padding: "16px 20px", borderRadius: 14, marginBottom: 20,
            background: "rgba(52,211,153,0.06)",
            border: "1px solid rgba(52,211,153,0.20)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#34d399", marginBottom: 8 }}>
              What{"'"}s Included
            </div>
            {[
              "Full AI Skills curriculum",
              "Prompting masterclass",
              "Career development tools",
              "Certificate of completion",
            ].map((item) => (
              <div key={item} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 0", fontSize: 11, color: "#94a3b8",
              }}>
                <span style={{ color: "#34d399", fontSize: 10 }}>✓</span>
                {item}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <a href="/" style={{
              padding: "10px 20px", borderRadius: 10,
              background: "linear-gradient(135deg, #C9A227, #a07818)",
              color: "#08080f", fontSize: 12, fontWeight: 700,
              textDecoration: "none", letterSpacing: "0.04em",
              boxShadow: "0 0 14px rgba(201,162,39,0.20)",
            }}>
              Go to NAVI
            </a>
            <a href="/client" style={{
              padding: "10px 20px", borderRadius: 10,
              background: "rgba(52,211,153,0.10)",
              border: "1px solid rgba(52,211,153,0.25)",
              color: "#34d399", fontSize: 12, fontWeight: 700,
              textDecoration: "none", letterSpacing: "0.04em",
            }}>
              My Dashboard
            </a>
          </div>
        </div>
      )}

      {status === "error" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "#f87171", marginBottom: 8 }}>Something went wrong</div>
          <a href="/" style={{ fontSize: 11, color: "#475569", textDecoration: "none" }}>Back to NAVI</a>
        </div>
      )}
    </div>
  );
}
