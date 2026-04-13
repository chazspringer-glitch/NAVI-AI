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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/client");
      } else {
        // Session might take a moment — listen for auth change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
          if (s) {
            subscription.unsubscribe();
            router.replace("/client");
          }
        });

        // Fallback: if nothing happens after 5s, send to login
        setTimeout(() => {
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
