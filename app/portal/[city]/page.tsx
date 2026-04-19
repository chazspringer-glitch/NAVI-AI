"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PORTALS } from "@/lib/portals";

/**
 * /portal/wilmington → redirects to /?portal=wilmington
 * This gives clean deep-link URLs while keeping all logic in the main page.
 */
export default function PortalRedirect({ params }: { params: { city: string } }) {
  const router = useRouter();
  const city = params.city?.toLowerCase();

  useEffect(() => {
    if (city && PORTALS[city]) {
      router.replace(`/?portal=${city}`);
    } else {
      router.replace("/");
    }
  }, [city, router]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#08080f", fontFamily: "monospace", color: "#00d4ff", fontSize: 12,
    }}>
      Loading {PORTALS[city]?.fullName ?? "NAVI"}...
    </div>
  );
}
