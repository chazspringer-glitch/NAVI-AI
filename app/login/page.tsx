"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resetMessage, setResetMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("[Login] Session check:", session ? "active" : "none", error?.message ?? "");
      if (session) router.replace(redirectTo === "onboarding" ? "/" : "/client");
    });
  }, [router, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      console.log("[Login] Attempting sign in for:", email);
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        console.error("[Login] Error:", authError.message);
        setError(authError.message);
      } else {
        console.log("[Login] Success — user:", data.user?.id, "session:", !!data.session);
        router.push(redirectTo === "onboarding" ? "/" : "/client");
      }
    } catch (err) {
      console.error("[Login] Unexpected error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) return;
    setResetStatus("sending");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (resetError) {
        console.error("[Login] Reset error:", resetError.message);
        setResetStatus("error");
        setResetMessage(resetError.message);
      } else {
        console.log("[Login] Password reset email sent to:", resetEmail);
        setResetStatus("sent");
        setResetMessage("Check your email for a password reset link.");
      }
    } catch {
      setResetStatus("error");
      setResetMessage("Something went wrong. Try again.");
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
          Sign In
        </div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>
          Access your client dashboard
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} style={{
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
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              style={{
                width: "100%", padding: "10px 40px 10px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0", fontSize: 12, fontFamily: "monospace",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 16, padding: "2px 4px", color: "#64748b",
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setShowReset(!showReset); setResetEmail(email); setResetStatus("idle"); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 10, fontFamily: "monospace", color: "#475569",
              padding: "4px 0", marginTop: 4, textAlign: "right", width: "100%",
            }}
          >
            Forgot password?
          </button>
        </div>

        {/* Password reset */}
        {showReset && (
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: "rgba(0,212,255,0.04)",
            border: "1px solid rgba(0,212,255,0.12)",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {resetStatus === "sent" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#34d399", fontWeight: 600, marginBottom: 4 }}>
                  {resetMessage}
                </div>
                <div style={{ fontSize: 9, color: "#475569" }}>
                  Check your inbox and spam folder.
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 9, color: "#00d4ff", fontWeight: 600 }}>Reset Password</div>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#e2e8f0", fontSize: 11, fontFamily: "monospace",
                    outline: "none",
                  }}
                />
                {resetStatus === "error" && (
                  <div style={{ fontSize: 9, color: "#f87171" }}>{resetMessage}</div>
                )}
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={resetStatus === "sending" || !resetEmail.trim()}
                  style={{
                    width: "100%", padding: "8px", borderRadius: 8,
                    background: resetStatus === "sending" ? "rgba(0,212,255,0.04)" : "rgba(0,212,255,0.10)",
                    border: "1px solid rgba(0,212,255,0.25)",
                    color: "#00d4ff", fontSize: 10, fontFamily: "monospace", fontWeight: 600,
                    cursor: resetStatus === "sending" || !resetEmail.trim() ? "default" : "pointer",
                    opacity: !resetEmail.trim() ? 0.4 : 1,
                  }}
                >
                  {resetStatus === "sending" ? "Sending..." : "Send Reset Link"}
                </button>
              </>
            )}
          </div>
        )}

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
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Links */}
      <div style={{ marginTop: 20, display: "flex", gap: 16, alignItems: "center" }}>
        <a href="/signup" style={{
          fontSize: 11, color: "#C9A227", textDecoration: "none",
        }}>
          Create account
        </a>
        <span style={{ fontSize: 8, color: "#1e293b" }}>|</span>
        <a href="/" style={{
          fontSize: 11, color: "#475569", textDecoration: "none",
        }}>
          Back to NAVI
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#08080f", fontFamily: "monospace",
      }}>
        <div style={{ fontSize: 11, color: "#C9A227" }}>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
