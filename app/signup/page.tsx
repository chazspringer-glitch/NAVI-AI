"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#08080f",
      fontFamily: "monospace",
      padding: 20,
    }}>
      {/* Brand */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase",
          color: "#C9A227", marginBottom: 8,
        }}>
          Springer Industries
        </div>
        <div style={{
          fontSize: 22, fontWeight: 800, color: "#f1f5f9",
          textShadow: "0 0 20px rgba(201,162,39,0.25)",
        }}>
          Create Account
        </div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>
          Join NAVI and get started
        </div>
      </div>

      {/* Success state */}
      {success ? (
        <div style={{
          width: "100%", maxWidth: 360,
          padding: "28px 24px", borderRadius: 16,
          background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
          border: "1px solid rgba(52,211,153,0.25)",
          boxShadow: "0 0 40px rgba(52,211,153,0.06)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399", marginBottom: 8 }}>
            Account created!
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6, marginBottom: 16 }}>
            Check your email to confirm your account, then sign in.
          </div>
          <a href="/login" style={{
            display: "inline-block", padding: "10px 24px", borderRadius: 10,
            background: "linear-gradient(135deg, #C9A227, #a07818)",
            color: "#08080f", fontSize: 12, fontWeight: 700,
            textDecoration: "none", letterSpacing: "0.06em",
          }}>
            Go to Sign In
          </a>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSignup} style={{
          width: "100%", maxWidth: 360,
          padding: "28px 24px",
          borderRadius: 16,
          background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
          border: "1px solid rgba(201,162,39,0.15)",
          boxShadow: "0 0 40px rgba(201,162,39,0.06), 0 8px 32px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              Email
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0", fontSize: 12, fontFamily: "monospace",
                outline: "none",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              Password
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0", fontSize: 12, fontFamily: "monospace",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 10, color: "#f87171", padding: "8px 10px",
              borderRadius: 8, background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.18)",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "11px", borderRadius: 10,
              background: loading
                ? "rgba(201,162,39,0.08)"
                : "linear-gradient(135deg, #C9A227, #a07818)",
              border: "none",
              color: loading ? "#C9A227" : "#08080f",
              fontSize: 12, fontFamily: "monospace", fontWeight: 700,
              letterSpacing: "0.06em",
              cursor: loading ? "default" : "pointer",
              boxShadow: loading ? "none" : "0 0 16px rgba(201,162,39,0.20)",
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      )}

      {/* Links */}
      {!success && (
        <div style={{ marginTop: 20, display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/login" style={{
            fontSize: 11, color: "#C9A227", textDecoration: "none",
          }}>
            Already have an account? Sign in
          </a>
          <span style={{ fontSize: 8, color: "#1e293b" }}>|</span>
          <a href="/" style={{
            fontSize: 11, color: "#475569", textDecoration: "none",
          }}>
            Back to NAVI
          </a>
        </div>
      )}
    </div>
  );
}
