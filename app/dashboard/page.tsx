"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/client"); }, [router]);
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#08080f", fontFamily: "monospace",
    }}>
      <div style={{ fontSize: 11, color: "#C9A227" }}>Redirecting...</div>
    </div>
  );
}
