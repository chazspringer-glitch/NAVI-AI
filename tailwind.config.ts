import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#08080f",
          surface: "#10101a",
          card: "#14141f",
          border: "#1e1e30",
        },
        neon: {
          cyan: "#00d4ff",
          purple: "#a855f7",
          pink: "#f472b6",
          green: "#4ade80",
        },
      },
      fontFamily: {
        mono: ["'Courier New'", "Courier", "monospace"],
        sans: ["system-ui", "sans-serif"],
      },
      animation: {
        "mode-in":       "modeIn 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "tab-in":        "tabIn 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "tab-out":       "tabOut 0.15s cubic-bezier(0.4,0,1,1) forwards",
        "overlay-in":    "overlayIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "mode-label-in": "modeLabelIn 0.26s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "switch-badge":  "switchBadge 0.65s ease-out forwards",
        "xp-float": "xpFloat 1.5s ease-out forwards",
        "xp-burst": "xpBurst 1.7s ease-out forwards",
        float: "float 3s ease-in-out infinite",
        breathe: "breathe 4s ease-in-out infinite",
        wiggle: "wiggle 0.5s ease-in-out infinite",
        "walk-bob": "walkBob 0.52s ease-in-out infinite",
        "excited-jump": "excitedJump 0.65s cubic-bezier(0.36,0.07,0.19,0.97) forwards",
        "glow-pulse-cyan": "glowPulseCyan 2s ease-in-out infinite",
        "glow-pulse-pink": "glowPulsePink 1s ease-in-out infinite",
        "glow-pulse-gray": "glowPulseGray 3s ease-in-out infinite",
        "scan-line": "scanLine 4s linear infinite",
        "fade-in-up": "fadeInUp 0.4s ease-out forwards",
        "blink": "blink 4s ease-in-out infinite",
        "typing": "typing 1.2s ease-in-out infinite",
        "orbit": "orbit 3s linear infinite",
        "particle": "particle 2s ease-out forwards",
      },
      keyframes: {
        modeIn: {
          "0%":   { opacity: "0", transform: "scale(0.95) translateY(12px)" },
          "60%":  { opacity: "1", transform: "scale(1.015) translateY(-3px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        tabIn: {
          "0%":   { opacity: "0", transform: "translateY(14px) scale(0.97)" },
          "58%":  { opacity: "1", transform: "translateY(-4px) scale(1.008)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        tabOut: {
          "0%":   { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-8px) scale(0.97)" },
        },
        overlayIn: {
          "0%":   { opacity: "0", transform: "translateY(22px) scale(0.96)" },
          "55%":  { opacity: "1", transform: "translateY(-5px) scale(1.008)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        modeLabelIn: {
          "0%":   { opacity: "0", transform: "translateX(8px) scale(0.88)" },
          "62%":  { opacity: "1", transform: "translateX(-2px) scale(1.06)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        switchBadge: {
          "0%":   { opacity: "0", transform: "translateX(-50%) translateY(6px)" },
          "18%":  { opacity: "1", transform: "translateX(-50%) translateY(0)" },
          "72%":  { opacity: "1", transform: "translateX(-50%) translateY(0)" },
          "100%": { opacity: "0", transform: "translateX(-50%) translateY(-4px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.75" },
          "50%": { transform: "scale(1.04)", opacity: "1" },
        },
        wiggle: {
          "0%": { transform: "rotate(-4deg) translateY(-4px)" },
          "25%": { transform: "rotate(4deg) translateY(-10px)" },
          "50%": { transform: "rotate(-4deg) translateY(-4px)" },
          "75%": { transform: "rotate(4deg) translateY(-10px)" },
          "100%": { transform: "rotate(-4deg) translateY(-4px)" },
        },
        glowPulseCyan: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(0,212,255,0.1)" },
          "50%": { boxShadow: "0 0 35px rgba(0,212,255,0.7), 0 0 70px rgba(0,212,255,0.3)" },
        },
        glowPulsePink: {
          "0%, 100%": { boxShadow: "0 0 25px rgba(244,114,182,0.5), 0 0 60px rgba(168,85,247,0.3)" },
          "50%": { boxShadow: "0 0 50px rgba(244,114,182,0.9), 0 0 100px rgba(168,85,247,0.5)" },
        },
        glowPulseGray: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(148,163,184,0.2), 0 0 30px rgba(148,163,184,0.05)" },
          "50%": { boxShadow: "0 0 25px rgba(148,163,184,0.4), 0 0 50px rgba(148,163,184,0.1)" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 88%, 100%": { transform: "scaleY(1)" },
          "93%": { transform: "scaleY(0.08)" },
        },
        typing: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(60px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(60px) rotate(-360deg)" },
        },
        particle: {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(-60px) scale(0)", opacity: "0" },
        },
        xpFloat: {
          "0%":   { opacity: "1", transform: "translateY(0px)" },
          "60%":  { opacity: "1", transform: "translateY(-14px)" },
          "100%": { opacity: "0", transform: "translateY(-20px)" },
        },
        xpBurst: {
          "0%":   { opacity: "0",   transform: "scale(0.3) translateY(24px)" },
          "18%":  { opacity: "1",   transform: "scale(1.25) translateY(-6px)" },
          "32%":  { opacity: "1",   transform: "scale(1)    translateY(-12px)" },
          "68%":  { opacity: "1",   transform: "scale(1)    translateY(-22px)" },
          "100%": { opacity: "0",   transform: "scale(0.85) translateY(-52px)" },
        },
        walkBob: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "30%": { transform: "translateY(-6px) rotate(-2deg)" },
          "70%": { transform: "translateY(-6px) rotate(2deg)" },
        },
        excitedJump: {
          "0%":   { transform: "translateY(0px) scale(1)" },
          "25%":  { transform: "translateY(-28px) scale(1.08)" },
          "50%":  { transform: "translateY(0px) scale(0.94)" },
          "70%":  { transform: "translateY(-14px) scale(1.04)" },
          "100%": { transform: "translateY(0px) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
