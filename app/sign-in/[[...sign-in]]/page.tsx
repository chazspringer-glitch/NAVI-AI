import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#08080f",
      fontFamily: "monospace",
      padding: 20,
    }}>
      {/* Brand header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase",
          color: "#C9A227", marginBottom: 8,
        }}>
          Springer Industries
        </div>
        <div style={{
          fontSize: 22, fontWeight: 800, color: "#f1f5f9",
          letterSpacing: "0.02em",
          textShadow: "0 0 20px rgba(201,162,39,0.25)",
        }}>
          Sign In
        </div>
        <div style={{
          fontSize: 11, color: "#475569", marginTop: 6,
          lineHeight: 1.5,
        }}>
          Access your NAVI dashboard
        </div>
      </div>

      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#C9A227",
            colorBackground: "#10101a",
            colorText: "#e2e8f0",
            colorInputBackground: "#14141f",
            colorInputText: "#e2e8f0",
            borderRadius: "12px",
            fontFamily: "monospace",
          },
          elements: {
            card: {
              boxShadow: "0 0 40px rgba(201,162,39,0.08), 0 8px 32px rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,162,39,0.15)",
            },
            formButtonPrimary: {
              background: "linear-gradient(135deg, #C9A227, #a07818)",
              boxShadow: "0 0 16px rgba(201,162,39,0.20)",
            },
          },
        }}
      />

      {/* Back link */}
      <a
        href="/"
        style={{
          marginTop: 24, fontSize: 11, color: "#475569",
          textDecoration: "none", letterSpacing: "0.06em",
          fontFamily: "monospace",
        }}
      >
        ← Back to NAVI
      </a>
    </div>
  );
}
