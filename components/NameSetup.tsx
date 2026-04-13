"use client";

import { useState } from "react";
import NaviOrb from "@/components/NaviOrb";

interface NameSetupProps {
  petName: string;
  onComplete: (name: string) => void;
}

export default function NameSetup({ petName, onComplete }: NameSetupProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onComplete(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(8,8,15,0.92)" }}>
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-50" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #00d4ff, transparent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />

      <div
        className="relative z-10 w-full max-w-sm rounded-2xl p-8 flex flex-col items-center gap-6 text-center"
        style={{
          background: "rgba(16,16,26,0.95)",
          border: "1px solid rgba(0,212,255,0.2)",
          boxShadow: "0 0 40px rgba(0,212,255,0.1), 0 0 80px rgba(168,85,247,0.05)",
        }}
      >
        {/* Boot text */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-mono tracking-[0.4em] text-slate-500 uppercase">system boot</span>
          <span className="text-xs font-mono tracking-widest text-cyan-400/60">v1.0.0</span>
        </div>

        {/* NAVI orb avatar */}
        <NaviOrb
          size={80}
          className="animate-float"
          style={{ boxShadow: "0 0 36px rgba(0,212,255,0.5), 0 0 72px rgba(0,212,255,0.22)" }}
        />

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold holo-text tracking-wide">{petName}</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            AI assistant for real-life situations.
            <br />
            What should I call you?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={24}
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-center font-mono text-white placeholder-slate-600 focus:outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(0,212,255,0.25)",
              boxShadow: "inset 0 0 12px rgba(0,212,255,0.05)",
              caretColor: "#00d4ff",
            }}
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 rounded-xl font-mono font-bold tracking-widest text-sm uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: name.trim()
                ? "linear-gradient(135deg, #00d4ff20, #a855f720)"
                : "rgba(255,255,255,0.03)",
              border: "1px solid rgba(0,212,255,0.4)",
              color: name.trim() ? "#00d4ff" : "#64748b",
              boxShadow: name.trim() ? "0 0 20px rgba(0,212,255,0.15)" : "none",
            }}
          >
            Let&apos;s Go
          </button>
        </form>

        <p className="text-xs text-slate-600 font-mono">
          Your data is stored locally on your device
        </p>
      </div>
    </div>
  );
}
