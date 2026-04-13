export default function PrivacyPolicy() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "#08080f",
      color: "#e2e8f0",
      fontFamily: "'Courier New', Courier, monospace",
      padding: "0 0 60px",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(8,8,15,0.95)", backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(0,212,255,0.12)",
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <a href="/" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 32, height: 32, borderRadius: 8,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#64748b", fontSize: 14, textDecoration: "none",
        }}>←</a>
        <div>
          <div style={{ fontSize: 13, fontWeight: "bold", color: "#00d4ff", letterSpacing: "0.06em" }}>
            Privacy Policy
          </div>
          <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>
            NAVI by Springer Industries
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px" }}>

        <p style={{ fontSize: 10, color: "#475569", marginBottom: 24, lineHeight: 1.6, letterSpacing: "0.04em" }}>
          Last updated: April 2025
        </p>

        <Section title="Overview">
          NAVI is an AI-powered companion application built by Springer Industries.
          We take your privacy seriously. This policy explains what data we collect,
          how it is used, and what rights you have.
        </Section>

        <Section title="Microphone & Voice">
          When you activate the voice feature, your device microphone captures audio.
          This audio is sent to our speech-to-text service for processing so NAVI can
          understand what you said. We do not store raw audio recordings. Voice is
          an optional feature — you can use NAVI entirely through text.
        </Section>

        <Section title="AI Processing">
          Your text and voice messages are sent to an AI language model to generate
          NAVI&apos;s responses. These messages may be processed by third-party AI
          providers. We do not use your conversation history to train AI models or
          share it with advertisers. Conversations are stored locally on your device
          and are cleared when you reset NAVI.
        </Section>

        <Section title="Data We Store">
          All app data (your name, conversation history, progress, settings) is stored
          locally in your browser using localStorage. It never leaves your device unless
          you interact with NAVI&apos;s AI features, which require sending messages to
          our server. We do not maintain a user database or account system.
        </Section>

        <Section title="Payments & Stripe">
          NAVI PRO subscriptions are processed by Stripe, a secure payment platform.
          We never see or store your credit card number. All payment data is handled
          directly by Stripe under their own privacy policy and PCI DSS compliance.
          You can cancel your subscription at any time through Stripe.
        </Section>

        <Section title="Children">
          NAVI includes educational content suitable for children (such as STEM Explorer).
          We do not knowingly collect personal information from children under 13. If you
          are a parent and believe your child has provided personal information, please
          contact us so we can remove it.
        </Section>

        <Section title="Your Rights">
          You can clear all locally stored data at any time by tapping &quot;Reset NAVI&quot;
          in settings. This permanently removes your conversation history, progress, and
          preferences from your device.
        </Section>

        <Section title="Contact">
          For privacy questions, contact us at: privacy@springerindustries.com
        </Section>

        <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
          <a href="/terms" style={{
            fontSize: 10, fontFamily: "monospace", color: "#475569",
            textDecoration: "underline", letterSpacing: "0.04em",
          }}>Terms of Use →</a>
        </div>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 10, fontFamily: "monospace", fontWeight: "bold",
        color: "#00d4ff", letterSpacing: "0.18em", textTransform: "uppercase",
        marginBottom: 8,
      }}>
        {title}
      </div>
      <p style={{
        fontSize: 12, fontFamily: "monospace", color: "#94a3b8",
        lineHeight: 1.75, margin: 0,
      }}>
        {children}
      </p>
    </div>
  );
}
