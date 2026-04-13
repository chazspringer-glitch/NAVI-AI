import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Pet — Your Digital Companion",
  description: "A futuristic AI Tamagotchi powered by OpenAI",
  icons: {
    icon: "data:image/svg+xml," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="g" cx="42%" cy="38%" r="55%">
            <stop offset="0%"   stop-color="#00d4ff" stop-opacity="0.75"/>
            <stop offset="48%"  stop-color="#a855f7" stop-opacity="0.40"/>
            <stop offset="100%" stop-color="#020208" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="c" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#00d4ff" stop-opacity="0.60"/>
            <stop offset="100%" stop-color="#00d4ff" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="#020208"/>
        <circle cx="50" cy="50" r="46" fill="url(#g)"/>
        <circle cx="50" cy="50" r="18" fill="url(#c)"/>
        <circle cx="50" cy="50" r="46" fill="none" stroke="#00d4ff" stroke-width="2.5" stroke-opacity="0.55"/>
      </svg>`
    ),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#08080f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
