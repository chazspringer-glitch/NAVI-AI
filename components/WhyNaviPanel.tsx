"use client";

import { useState, useEffect, useRef } from "react";
import NaviOrb from "./NaviOrb";

const SECTIONS = [
  {
    label: "The Problem",
    icon: "⚡",
    color: "#f87171",
    heading: "The system wasn't built for everyone.",
    body: "Millions of people wake up every day trying to figure out how to find a job, fix their credit, get housing, feed their family, and build something — with no guidance, no roadmap, and no one in their corner.",
    stat: { value: "37M", label: "Americans live below the poverty line" },
  },
  {
    label: "The Reality",
    icon: "💔",
    color: "#f59e0b",
    heading: "Information exists. Access doesn't.",
    body: "The resources are out there — housing programs, financial workshops, business tools, legal rights — but they're scattered, confusing, and buried behind barriers most people don't have time to navigate. The gap isn't knowledge. It's access.",
    stat: { value: "73%", label: "of low-income adults can't find help online" },
  },
  {
    label: "The Idea",
    icon: "💡",
    color: "#C9A227",
    heading: "What if there was someone who could help — 24/7, for free?",
    body: "Not a website with a hundred links. Not a government hotline with a 2-hour hold. A real guide — powered by AI — that speaks your language, understands your situation, and walks you through the process step by step.",
    stat: null,
  },
  {
    label: "What NAVI Is",
    icon: "🧭",
    color: "#00d4ff",
    heading: "NAVI is your AI-powered life navigator.",
    body: "NAVI helps you find housing, jobs, legal help, financial resources, food, education, and business opportunities — all from your phone. No appointments. No judgment. No cost. Just guidance when you need it most.",
    stat: null,
    features: ["Housing Finder", "Job Search", "Legal Rights", "Financial Literacy", "Business Tools", "Fresh Food", "Auto Finder", "AI Education"],
  },
  {
    label: "The Mission",
    icon: "🎯",
    color: "#34d399",
    heading: "Bridge the gap between struggle and stability.",
    body: "NAVI exists to make sure that where you come from doesn't determine where you end up. Every feature was built with one question in mind: \"Does this actually help someone improve their life today?\"",
    stat: null,
  },
  {
    label: "The Vision",
    icon: "🌍",
    color: "#a855f7",
    heading: "A world where AI works for the people who need it most.",
    body: "We believe AI shouldn't just serve the privileged. It should serve the single mother looking for childcare, the young man trying to build credit for the first time, the family searching for affordable housing, and the dreamer ready to start a business with nothing but a phone and a plan.",
    stat: null,
  },
  {
    label: "Call to Action",
    icon: "✊",
    color: "#C9A227",
    heading: "This is bigger than an app. This is a movement.",
    body: null,
    stat: null,
  },
];

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.6s ease, transform 0.6s ease",
    }}>
      {children}
    </div>
  );
}

function AnimatedCounter({ value, color }: { value: string; color: string }) {
  const [display, setDisplay] = useState("0");
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const numPart = value.replace(/[^0-9.]/g, "");
    const suffix = value.replace(/[0-9.]/g, "");
    const target = parseFloat(numPart);
    const steps = 30;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased * 10) / 10;
      setDisplay(Number.isInteger(target) ? Math.round(current) + suffix : current.toFixed(1) + suffix);
      if (step >= steps) { setDisplay(value); clearInterval(interval); }
    }, 40);
    return () => clearInterval(interval);
  }, [started, value]);

  return (
    <div ref={ref} style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-0.02em" }}>
      {display}
    </div>
  );
}

export default function WhyNaviPanel({ onClose }: { onClose: () => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "rgba(4,4,12,0.98)",
      backdropFilter: "blur(20px)",
      fontFamily: "monospace",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(201,162,39,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NaviOrb size={24} />
          <div>
            <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#C9A227", marginBottom: 2 }}>Springer Industries</div>
            <div style={{ fontSize: 14, fontWeight: "bold", color: "#f1f5f9" }}>Why NAVI Exists</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* Scrollable */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Hero with NaviOrb */}
        <RevealSection>
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <NaviOrb size={64} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, textShadow: "0 0 20px rgba(201,162,39,0.15)", lineHeight: 1.3 }}>
              Every great thing starts with a why.
            </div>
            <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
              This is the story behind NAVI — and why it matters.
            </div>
          </div>
        </RevealSection>

        {/* Sections */}
        {SECTIONS.map((s, i) => {
          const isExpanded = expandedIdx === i;
          const hasMore = s.label === "What NAVI Is";
          return (
            <RevealSection key={i} delay={i * 80}>
              <div style={{ textAlign: "center" }}>
                {/* Section label */}
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12,
                    background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: `${s.color}15`, border: `1px solid ${s.color}35`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, flexShrink: 0,
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: "0.20em", textTransform: "uppercase", color: s.color, fontWeight: 700 }}>
                    {s.label}
                  </div>
                  <div style={{
                    fontSize: 10, color: "#334155",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s ease",
                  }}>
                    ▼
                  </div>
                </button>

                {/* Heading — always visible */}
                <div style={{
                  fontSize: 16, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.4,
                  marginBottom: (s.body || s.stat || hasMore) ? 10 : 16,
                  textShadow: `0 0 14px ${s.color}20`,
                }}>
                  {s.heading}
                </div>

                {/* Expandable content */}
                <div style={{
                  maxHeight: isExpanded ? 500 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.4s ease",
                }}>
                  {/* Stat counter */}
                  {s.stat && (
                    <div style={{
                      padding: "12px 14px", borderRadius: 12, marginBottom: 12,
                      background: `${s.color}08`, border: `1px solid ${s.color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                    }}>
                      {isExpanded && <AnimatedCounter value={s.stat.value} color={s.color} />}
                      <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4, textAlign: "left" }}>{s.stat.label}</div>
                    </div>
                  )}

                  {/* Body text */}
                  {s.body && (
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.75, marginBottom: 8 }}>
                      {s.body}
                    </div>
                  )}

                  {/* Feature tags — What NAVI Is */}
                  {(s as { features?: string[] }).features && (
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 8, marginBottom: 8 }}>
                      {((s as { features?: string[] }).features || []).map((f) => (
                        <span key={f} style={{
                          padding: "4px 10px", borderRadius: 8,
                          background: `${s.color}0a`, border: `1px solid ${s.color}20`,
                          fontSize: 9, color: s.color, fontWeight: 600,
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* CTA section */}
                  {s.label === "Call to Action" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                      <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.75 }}>
                        Use NAVI. Share NAVI. Tell someone who needs it. Every person who finds a job, a home, or the confidence to start a business through this app is proof that technology can serve the people.
                      </div>
                      <div style={{
                        padding: "16px", borderRadius: 14,
                        background: "linear-gradient(135deg, rgba(201,162,39,0.08), rgba(201,162,39,0.03))",
                        border: "1px solid rgba(201,162,39,0.20)",
                        textAlign: "center",
                      }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                          <NaviOrb size={28} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#C9A227", marginBottom: 4 }}>
                          Built by Springer Industries
                        </div>
                        <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>
                          AI-powered solutions for the communities that need them most.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tap to expand hint */}
                {!isExpanded && s.body && (
                  <button
                    onClick={() => setExpandedIdx(i)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 9, color: s.color, fontWeight: 600, display: "block", margin: "0 auto" }}
                  >
                    Tap to read more
                  </button>
                )}

                {/* Divider */}
                {i < SECTIONS.length - 1 && (
                  <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginTop: 16 }} />
                )}
              </div>
            </RevealSection>
          );
        })}

        {/* Final CTA */}
        <RevealSection delay={600}>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "16px", borderRadius: 14,
              background: "linear-gradient(135deg, #C9A227, #a07818)",
              border: "none", color: "#08080f",
              fontSize: 14, fontFamily: "monospace", fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.04em",
              boxShadow: "0 0 20px rgba(201,162,39,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <NaviOrb size={20} /> Explore NAVI →
          </button>
        </RevealSection>
      </div>
    </div>
  );
}
