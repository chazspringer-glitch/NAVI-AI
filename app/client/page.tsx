"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ClientDashboardPanel from "@/components/ClientDashboardPanel";

export default function ClientPage() {
  const [session, setSession] = useState<unknown>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) {
        router.replace("/login");
      } else {
        setSession(s);
        setChecking(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!s) {
        router.replace("/login");
      } else {
        setSession(s);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (checking || !session) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#08080f", fontFamily: "monospace",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#C9A227", marginBottom: 6 }}>Loading your dashboard...</div>
          <div style={{ fontSize: 9, color: "#475569" }}>Checking authentication</div>
        </div>
      </div>
    );
  }

  return (
    <ClientDashboardPanel onClose={() => router.push("/")} showLogout asPage />
  );
}
