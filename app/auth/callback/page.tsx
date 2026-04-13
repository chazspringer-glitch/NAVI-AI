"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase puts the tokens in the URL hash after email confirmation.
    // The JS client auto-detects and exchanges them on init.
    // We just wait for the session to appear, then redirect.
    const handleAuth = async () => {
      console.log("[Auth Callback] Processing email confirmation...");
      console.log("[Auth Callback] URL hash present:", window.location.hash.length > 0);

      const { data: { session }, error } = await supabase.auth.getSession();
      console.log("[Auth Callback] Session:", session ? `active (${session.user.id})` : "none", error?.message ?? "");

      if (session) {
        router.replace("/client");
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
          console.log("[Auth Callback] Auth change:", event, s ? "session active" : "no session");
          if (s) {
            subscription.unsubscribe();
            router.replace("/client");
          }
        });

        setTimeout(() => {
          console.warn("[Auth Callback] Timeout — redirecting to login");
          subscription.unsubscribe();
          router.replace("/login");
        }, 5000);
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#08080f", fontFamily: "monospace",
    }}>
      <div style={{ fontSize: 22, marginBottom: 12 }}>✅</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399", marginBottom: 6 }}>
        Email confirmed!
      </div>
      <div style={{ fontSize: 11, color: "#475569" }}>
        Setting up your account...
      </div>
    </div>
  );
}
