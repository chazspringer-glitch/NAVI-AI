"use client";

const SECTIONS = [
  {
    label: "The Problem",
    icon: "⚡",
    color: "#f87171",
    heading: "The system wasn't built for everyone.",
    body: "Millions of people wake up every day trying to figure out how to find a job, fix their credit, get housing, feed their family, and build something — with no guidance, no roadmap, and no one in their corner.",
  },
  {
    label: "The Reality",
    icon: "💔",
    color: "#f59e0b",
    heading: "Information exists. Access doesn't.",
    body: "The resources are out there — housing programs, financial workshops, business tools, legal rights — but they're scattered, confusing, and buried behind barriers most people don't have time to navigate. The gap isn't knowledge. It's access.",
  },
  {
    label: "The Idea",
    icon: "💡",
    color: "#C9A227",
    heading: "What if there was someone who could help — 24/7, for free?",
    body: "Not a website with a hundred links. Not a government hotline with a 2-hour hold. A real guide — powered by AI — that speaks your language, understands your situation, and walks you through the process step by step.",
  },
  {
    label: "What NAVI Is",
    icon: "🤖",
    color: "#00d4ff",
    heading: "NAVI is your AI-powered life navigator.",
    body: "NAVI helps you find housing, jobs, legal help, financial resources, food, education, and business opportunities — all from your phone. No appointments. No judgment. No cost. Just guidance when you need it most.",
  },
  {
    label: "The Mission",
    icon: "🎯",
    color: "#34d399",
    heading: "Bridge the gap between struggle and stability.",
    body: "NAVI exists to make sure that where you come from doesn't determine where you end up. Every feature was built with one question in mind: \"Does this actually help someone improve their life today?\"",
  },
  {
    label: "The Vision",
    icon: "🌍",
    color: "#a855f7",
    heading: "A world where AI works for the people who need it most.",
    body: "We believe AI shouldn't just serve the privileged. It should serve the single mother looking for childcare, the young man trying to build credit for the first time, the family searching for affordable housing, and the dreamer ready to start a business with nothing but a phone and a plan.",
  },
  {
    label: "Call to Action",
    icon: "✊",
    color: "#C9A227",
    heading: "This is bigger than an app. This is a movement.",
    body: null,
  },
];

export default function WhyNaviPanel({ onClose }: { onClose: () => void }) {
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
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#C9A227", marginBottom: 3 }}>Springer Industries</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>Why NAVI Exists</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* Scrollable */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Opening */}
        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <div style={{ fontSize: 36, marginBottom: 12, filter: "drop-shadow(0 0 16px rgba(201,162,39,0.3))" }}>🤖</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, textShadow: "0 0 20px rgba(201,162,39,0.15)" }}>
            Every great thing starts with a why.
          </div>
          <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
            This is the story behind NAVI — and why it matters.
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((s, i) => (
          <div key={i}>
            {/* Section label */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
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
            </div>

            {/* Heading */}
            <div style={{
              fontSize: 16, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.4,
              marginBottom: s.body ? 10 : 16,
              textShadow: `0 0 14px ${s.color}20`,
            }}>
              {s.heading}
            </div>

            {/* Body */}
            {s.body && (
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.75 }}>
                {s.body}
              </div>
            )}

            {/* CTA section */}
            {s.label === "Call to Action" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.75 }}>
                  Use NAVI. Share NAVI. Tell someone who needs it. Every person who finds a job, a home, or the confidence to start a business through this app is proof that technology can serve the people.
                </div>
                <div style={{
                  padding: "16px", borderRadius: 14,
                  background: "linear-gradient(135deg, rgba(201,162,39,0.08), rgba(201,162,39,0.03))",
                  border: "1px solid rgba(201,162,39,0.20)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#C9A227", marginBottom: 6 }}>
                    Built by Springer Industries
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>
                    AI-powered solutions for the communities that need them most.
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 12,
                    background: "linear-gradient(135deg, #C9A227, #a07818)",
                    border: "none", color: "#08080f",
                    fontSize: 13, fontFamily: "monospace", fontWeight: 700,
                    cursor: "pointer", letterSpacing: "0.04em",
                    boxShadow: "0 0 18px rgba(201,162,39,0.20)",
                  }}
                >
                  Explore NAVI →
                </button>
              </div>
            )}

            {/* Divider */}
            {i < SECTIONS.length - 1 && (
              <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginTop: 20 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
