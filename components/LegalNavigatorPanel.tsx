"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Legal Navigator — helps users understand their situation, find lawyers,
// and prepare effectively. NOT legal advice.
// ─────────────────────────────────────────────────────────────────────────────

const CASE_TYPES = [
  { id: "family",     label: "Family Law",          icon: "👨‍👩‍👧", examples: "Divorce, custody, child support, adoption" },
  { id: "criminal",   label: "Criminal Defense",    icon: "⚖️",  examples: "Charges, arrests, DUI, probation" },
  { id: "housing",    label: "Housing / Tenant",    icon: "🏠",  examples: "Eviction, landlord disputes, repairs" },
  { id: "employment", label: "Employment",          icon: "💼",  examples: "Wrongful termination, discrimination, wages" },
  { id: "immigration",label: "Immigration",         icon: "🌍",  examples: "Visas, asylum, deportation defense" },
  { id: "personal",   label: "Personal Injury",     icon: "🏥",  examples: "Car accidents, medical malpractice, slip & fall" },
  { id: "consumer",   label: "Consumer / Debt",     icon: "💳",  examples: "Debt collection, fraud, bankruptcy" },
  { id: "civil",      label: "Civil Rights",        icon: "✊",  examples: "Discrimination, police misconduct, voting rights" },
  { id: "business",   label: "Business / Contract", icon: "📊",  examples: "Contracts, LLC, partnerships, disputes" },
  { id: "other",      label: "Other / Not Sure",    icon: "❓",  examples: "I need help figuring out my situation" },
];

const BUDGET_OPTIONS = [
  { id: "free",    label: "Free / Pro Bono",     desc: "Legal aid, nonprofits, pro bono attorneys" },
  { id: "low",     label: "Low Cost",            desc: "Sliding scale, payment plans, legal clinics" },
  { id: "moderate",label: "Moderate",            desc: "Standard rates, flat fees available" },
  { id: "any",     label: "Any Budget",          desc: "Show all options" },
];

type NavTab = "find" | "understand" | "prepare" | "rights";

function buildSearchLinks(caseType: string, location: string, budget: string) {
  const q = encodeURIComponent(`${CASE_TYPES.find((c) => c.id === caseType)?.label ?? "lawyer"} lawyer`);
  const loc = encodeURIComponent(location);
  const links = [
    { label: "Avvo — Lawyer Directory", url: `https://www.avvo.com/find-a-lawyer?q=${q}&loc=${loc}`, desc: "Ratings, reviews, and free Q&A", color: "#00d4ff" },
    { label: "FindLaw — Attorney Search", url: `https://lawyers.findlaw.com/lawyer/practice/${caseType === "criminal" ? "criminal-law" : caseType === "family" ? "family-law" : caseType === "housing" ? "landlord-tenant" : caseType === "employment" ? "employment-law" : "general-practice"}/${loc}`, desc: "Comprehensive lawyer profiles", color: "#34d399" },
    { label: "Justia — Legal Help", url: `https://www.justia.com/lawyers/${caseType === "criminal" ? "criminal-law" : caseType === "family" ? "family-law" : ""}/${loc}`, desc: "Free legal information + directory", color: "#C9A227" },
    { label: "State Bar — Lawyer Lookup", url: `https://www.google.com/search?q=${encodeURIComponent(location + " state bar attorney search")}`, desc: "Official state bar referral service", color: "#a855f7" },
  ];
  if (budget === "free" || budget === "low") {
    links.unshift({
      label: "LegalAid.org — Free Help", url: `https://www.legalaid.org/find-legal-aid?q=${loc}`, desc: "Free legal services for qualifying individuals", color: "#ef4444",
    });
    links.unshift({
      label: "LawHelp.org — Local Resources", url: `https://www.lawhelp.org/find-help/`, desc: "State-by-state free legal help finder", color: "#f59e0b",
    });
  }
  return links;
}

const DISCLAIMER = "This is informational guidance, not legal advice. Always consult a licensed attorney for advice specific to your situation.";

export default function LegalNavigatorPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<NavTab>("find");

  // Find a Lawyer state
  const [caseType, setCaseType] = useState<string>("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [searchResults, setSearchResults] = useState<ReturnType<typeof buildSearchLinks> | null>(null);

  const handleSearch = () => {
    if (!caseType || !location.trim()) return;
    setSearchResults(buildSearchLinks(caseType, location.trim(), budget || "any"));
  };

  const TABS: { key: NavTab; label: string; icon: string }[] = [
    { key: "find",       label: "Find",    icon: "🔍" },
    { key: "understand", label: "Case",    icon: "📋" },
    { key: "prepare",    label: "Prepare", icon: "✅" },
    { key: "rights",     label: "Rights",  icon: "⚖️" },
  ];

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
        borderBottom: "1px solid rgba(96,165,250,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#60a5fa", marginBottom: 3 }}>NAVI Legal</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>⚖️ Legal Navigator</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "8px 16px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {TABS.map(({ key, label, icon }) => {
          const active = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 9, fontFamily: "monospace", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              background: active ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)",
              border: active ? "1px solid rgba(96,165,250,0.35)" : "1px solid rgba(255,255,255,0.06)",
              color: active ? "#60a5fa" : "#64748b", fontWeight: active ? 700 : 400,
            }}>
              <span style={{ fontSize: 12 }}>{icon}</span> {label}
            </button>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── FIND A LAWYER ─────────────────────────────────────────────── */}
        {activeTab === "find" && (
          <>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                <span style={{ color: "#60a5fa", fontWeight: 700 }}>NAVI:</span> Tell me what kind of help you need, where you{"'"}re located, and your budget. I{"'"}ll point you to the right resources.
              </div>
            </div>

            {/* Case type */}
            <div>
              <div style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>What type of case?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {CASE_TYPES.map((ct) => {
                  const active = caseType === ct.id;
                  return (
                    <button key={ct.id} onClick={() => setCaseType(ct.id)} style={{
                      padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                      background: active ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.03)",
                      border: active ? "1px solid rgba(96,165,250,0.40)" : "1px solid rgba(255,255,255,0.06)",
                      color: active ? "#60a5fa" : "#94a3b8",
                      fontFamily: "monospace", fontSize: 10, fontWeight: active ? 700 : 400,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{ fontSize: 14 }}>{ct.icon}</span>
                      <div style={{ textAlign: "left" }}>
                        <div>{ct.label}</div>
                        {active && <div style={{ fontSize: 8, color: "#64748b", marginTop: 1 }}>{ct.examples}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location */}
            <div>
              <div style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>Your location</div>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State (e.g. Wilmington, NC)"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none",
                }}
              />
            </div>

            {/* Budget */}
            <div>
              <div style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>Budget</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {BUDGET_OPTIONS.map((b) => {
                  const active = budget === b.id;
                  return (
                    <button key={b.id} onClick={() => setBudget(b.id)} style={{
                      padding: "10px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                      background: active ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)",
                      border: active ? "1px solid rgba(96,165,250,0.35)" : "1px solid rgba(255,255,255,0.06)",
                      fontFamily: "monospace",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? "#60a5fa" : "#e2e8f0" }}>{b.label}</div>
                      <div style={{ fontSize: 8, color: "#64748b", marginTop: 1 }}>{b.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search button */}
            <button onClick={handleSearch} disabled={!caseType || !location.trim()}
              style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: caseType && location.trim() ? "linear-gradient(135deg, #60a5fa, #3b82f6)" : "rgba(255,255,255,0.04)",
                border: "none",
                color: caseType && location.trim() ? "#08080f" : "#475569",
                fontSize: 13, fontWeight: 700, fontFamily: "monospace",
                cursor: caseType && location.trim() ? "pointer" : "default",
                letterSpacing: "0.04em",
              }}>
              🔍 Find Lawyers
            </button>

            {/* Results */}
            {searchResults && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
                  Results for {CASE_TYPES.find((c) => c.id === caseType)?.label} in {location}
                </div>
                {searchResults.map((r) => (
                  <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{
                      padding: "12px 14px", borderRadius: 12,
                      background: `${r.color}08`, border: `1px solid ${r.color}20`,
                      display: "flex", alignItems: "flex-start", gap: 10,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.label}</div>
                        <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{r.desc}</div>
                      </div>
                      <span style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>↗</span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.6, padding: "8px 0" }}>
              ⚖️ {DISCLAIMER}
            </div>
          </>
        )}

        {/* Placeholder for other tabs — will be added in parts 2-4 */}
        {/* ── UNDERSTAND YOUR CASE ────────────────────────────────────── */}
        {activeTab === "understand" && (() => {
          const selected = CASE_TYPES.find((c) => c.id === caseType);
          const CASE_INFO: Record<string, { overview: string; timeline: string[]; nextSteps: string[] }> = {
            family: {
              overview: "Family law covers divorce, child custody, child support, alimony, adoption, and domestic violence protection orders. These cases are handled in family court and often involve mediation before trial.",
              timeline: ["Consultation with attorney (Week 1)", "File petition with court (Week 2–3)", "Serve the other party (Week 3–4)", "Response period (30 days)", "Discovery / mediation (Month 2–4)", "Trial or settlement (Month 4–12)"],
              nextSteps: ["Gather financial documents (bank statements, tax returns, pay stubs)", "Document custody-related concerns", "List all shared assets and debts", "Consult a family law attorney for a case evaluation"],
            },
            criminal: {
              overview: "Criminal defense covers charges filed by the government against you — misdemeanors or felonies. You have constitutional rights including the right to an attorney. If you can't afford one, a public defender will be assigned.",
              timeline: ["Arrest / charges filed (Day 1)", "First court appearance / arraignment (24–72 hrs)", "Bail hearing (if applicable)", "Pre-trial motions and discovery (Month 1–3)", "Plea negotiations (ongoing)", "Trial or plea deal (Month 3–12)"],
              nextSteps: ["Do NOT discuss your case with anyone except your attorney", "Write down exactly what happened while it's fresh", "Gather any evidence (photos, texts, witnesses)", "Request a public defender if you can't afford an attorney"],
            },
            housing: {
              overview: "Tenant law protects your rights as a renter — from illegal evictions to unsafe living conditions. Landlords must follow specific legal procedures to evict you, and you have the right to habitable housing.",
              timeline: ["Issue arises (Day 1)", "Written notice to landlord (required in most states)", "Landlord response period (7–30 days depending on state)", "File complaint with housing authority if unresolved", "Court hearing if eviction is filed (2–4 weeks after filing)", "Appeal period if judgment entered"],
              nextSteps: ["Save all written communication with your landlord", "Take photos/video of any housing issues", "Review your lease agreement", "Contact local tenant rights organization"],
            },
            employment: {
              overview: "Employment law covers wrongful termination, workplace discrimination, unpaid wages, harassment, and retaliation. Federal and state laws protect workers from unfair treatment.",
              timeline: ["Incident occurs (Day 1)", "Internal complaint / HR report (Week 1)", "File EEOC or state agency complaint (within 180–300 days of incident)", "Agency investigation (2–10 months)", "Right to sue letter issued", "Civil lawsuit if needed (6–18 months)"],
              nextSteps: ["Document everything — dates, witnesses, emails, texts", "File an internal complaint with HR (creates a paper trail)", "Do NOT quit before consulting an attorney", "Check if your employer has more than 15 employees (federal law threshold)"],
            },
            immigration: {
              overview: "Immigration law covers visas, green cards, asylum, deportation defense, DACA, and citizenship. Cases are handled by USCIS (applications) or immigration court (deportation proceedings).",
              timeline: ["Determine immigration status and options", "File application with USCIS (processing: 6–24 months)", "Biometrics appointment (2–3 months after filing)", "Interview (if required)", "Decision issued", "Appeal if denied (30 days to file)"],
              nextSteps: ["Never miss a court date or filing deadline", "Keep copies of ALL documents submitted", "Do not sign anything you don't understand", "Consult an immigration attorney — many offer free initial consultations"],
            },
            personal: {
              overview: "Personal injury law covers situations where you're hurt due to someone else's negligence — car accidents, medical malpractice, slip and falls, product defects. Most attorneys work on contingency (no fee unless you win).",
              timeline: ["Injury occurs (Day 1)", "Seek medical treatment immediately", "Consult a personal injury attorney (free consultation)", "Investigation and evidence gathering (Month 1–3)", "Demand letter / negotiations (Month 3–6)", "Lawsuit filed if no settlement (Month 6–12)", "Trial (Year 1–2)"],
              nextSteps: ["Get medical treatment and keep all records", "Do NOT give a recorded statement to insurance companies", "Take photos of injuries, accident scene, property damage", "Most personal injury attorneys offer free consultations and work on contingency"],
            },
            consumer: {
              overview: "Consumer law protects you from unfair debt collection, fraud, predatory lending, and identity theft. The Fair Debt Collection Practices Act (FDCPA) gives you specific rights against debt collectors.",
              timeline: ["Issue identified (Day 1)", "Send written dispute or cease-and-desist letter", "Creditor must verify debt within 30 days", "File complaint with CFPB or FTC if violations found", "Consult attorney if sued or need to file bankruptcy", "Bankruptcy process (if needed): 3–6 months"],
              nextSteps: ["Request debt validation in writing within 30 days of first contact", "Check your credit reports for errors (annualcreditreport.com)", "Document all communication from collectors", "Know that collectors cannot threaten, harass, or call before 8am or after 9pm"],
            },
            civil: {
              overview: "Civil rights law addresses discrimination based on race, gender, religion, disability, or national origin. It also covers police misconduct, voting rights violations, and First Amendment issues.",
              timeline: ["Incident occurs (Day 1)", "Document everything immediately", "File complaint with relevant agency (EEOC, DOJ, local human rights commission)", "Agency investigation (2–12 months)", "Right to sue letter or agency action", "Civil lawsuit if needed"],
              nextSteps: ["Write down exactly what happened, when, where, and who was involved", "Save any evidence (emails, recordings, witness contact info)", "File a complaint with the appropriate agency", "Contact the ACLU, NAACP, or a civil rights attorney"],
            },
            business: {
              overview: "Business law covers contracts, LLC formation, partnerships, intellectual property, and commercial disputes. Having proper legal structure protects your personal assets from business liabilities.",
              timeline: ["Identify legal need (Day 1)", "Consult a business attorney", "Draft or review documents (1–2 weeks)", "File with state if forming entity (1–4 weeks)", "Ongoing compliance and contract review"],
              nextSteps: ["Gather all relevant contracts and agreements", "Document the business dispute or need in writing", "Determine if you need formation, litigation, or advisory services", "Many business attorneys offer flat-fee consultations"],
            },
            other: {
              overview: "If you're not sure what kind of legal help you need, that's okay. Many attorneys offer free initial consultations where they can help you understand your situation and what options are available.",
              timeline: ["Identify and document your situation", "Research attorneys in your area", "Schedule free consultations (most offer 15–30 min)", "Choose an attorney who explains things clearly", "Follow their guidance on next steps"],
              nextSteps: ["Write down your situation in your own words", "List your key questions", "Search for attorneys on Avvo or your state bar website", "Ask friends or family for referrals"],
            },
          };
          const info = CASE_INFO[caseType || "other"] ?? CASE_INFO.other;
          return (
            <>
              <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                  <span style={{ color: "#60a5fa", fontWeight: 700 }}>NAVI:</span> {caseType ? `Here's what you should know about ${selected?.label ?? "your"} cases.` : "Select a case type in the Find tab first, or read the general overview below."}
                </div>
              </div>

              {/* Case type quick selector */}
              <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4 }}>
                {CASE_TYPES.map((ct) => (
                  <button key={ct.id} onClick={() => setCaseType(ct.id)} style={{
                    padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap",
                    fontSize: 9, fontFamily: "monospace", cursor: "pointer",
                    fontWeight: caseType === ct.id ? 700 : 400,
                    background: caseType === ct.id ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.03)",
                    border: caseType === ct.id ? "1px solid rgba(96,165,250,0.40)" : "1px solid rgba(255,255,255,0.06)",
                    color: caseType === ct.id ? "#60a5fa" : "#64748b",
                  }}>{ct.icon} {ct.label}</button>
                ))}
              </div>

              {/* Overview */}
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", marginBottom: 8 }}>What you need to know</div>
                <div style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.7 }}>{info.overview}</div>
              </div>

              {/* Timeline */}
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#34d399", marginBottom: 10 }}>Typical timeline</div>
                {info.timeline.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 8, fontWeight: 700, color: "#34d399",
                    }}>{i + 1}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5, paddingTop: 2 }}>{step}</div>
                  </div>
                ))}
              </div>

              {/* Next steps */}
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(201,162,39,0.04)", border: "1px solid rgba(201,162,39,0.12)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#C9A227", marginBottom: 10 }}>What you should do right now</div>
                {info.nextSteps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: "#C9A227", fontSize: 10, flexShrink: 0, marginTop: 1 }}>→</span>
                    <div style={{ fontSize: 10, color: "#e2e8f0", lineHeight: 1.55 }}>{step}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.6 }}>⚖️ {DISCLAIMER}</div>
            </>
          );
        })()}
        {/* ── PREPARE ────────────────────────────────────────────────── */}
        {activeTab === "prepare" && (() => {
          const PREP: Record<string, { checklist: string[]; questions: string[]; documents: string[] }> = {
            family:      { checklist: ["Research attorneys specializing in family law", "Gather financial records for the past 2 years", "Document custody schedule or concerns", "List all shared assets and debts", "Prepare a summary of your situation in writing"], questions: ["What are my options — mediation, collaborative, or litigation?", "How long does this typically take in our county?", "What is your fee structure and estimated total cost?", "What should I expect at the first court hearing?", "How will custody and support be determined?"], documents: ["Tax returns (last 2 years)", "Pay stubs (last 3 months)", "Bank and investment statements", "Mortgage / lease agreement", "Prenuptial agreement (if any)", "List of all debts"] },
            criminal:    { checklist: ["Do NOT speak to police without your attorney present", "Write down exactly what happened while fresh", "Identify any witnesses", "Save any text messages, photos, or evidence", "Arrange for bail if applicable"], questions: ["What are the exact charges against me?", "What is the best-case and worst-case scenario?", "Is a plea deal possible and advisable?", "Can any evidence be suppressed?", "What are the consequences for my record and employment?"], documents: ["Arrest report or citation", "Bail paperwork", "Any correspondence from the court", "Witness contact information", "Character references", "Employment verification"] },
            housing:     { checklist: ["Review your lease agreement thoroughly", "Document all issues with photos and dates", "Send written notice to landlord (keep a copy)", "Research your state's tenant rights", "Check if there's a local tenant rights organization"], questions: ["Is my landlord's action legal under our state law?", "What are my rights if I'm being evicted?", "Can I withhold rent for uninhabitable conditions?", "What is the timeline for this type of case?", "Are there any local ordinances that protect me?"], documents: ["Lease agreement", "All written communication with landlord", "Photos/videos of housing issues", "Receipts for any repairs you paid for", "Records of rent payments", "Move-in inspection report"] },
            employment:  { checklist: ["Document all incidents with dates and details", "Save emails, texts, and any written evidence", "Identify witnesses to discrimination or harassment", "Review your employee handbook", "File an internal HR complaint (creates paper trail)"], questions: ["Do I have a viable case?", "Should I file with the EEOC or a state agency?", "What is the statute of limitations?", "Should I resign or wait to be terminated?", "What damages could I recover?"], documents: ["Employment contract or offer letter", "Employee handbook / HR policies", "Performance reviews", "Emails or messages showing discrimination/harassment", "Pay stubs showing wage issues", "Termination letter or notice"] },
            immigration: { checklist: ["Never miss a court date or filing deadline", "Keep originals AND copies of all documents", "Do not sign anything you don't understand", "Find an attorney who speaks your language if needed", "Check for free legal aid in your area"], questions: ["What is my current immigration status?", "What options are available to me?", "What are the risks of this application/action?", "How long will the process take?", "What happens if my application is denied?"], documents: ["Passport and travel documents", "I-94 arrival record", "Any USCIS notices or receipts", "Employment authorization card (if any)", "Birth certificates and marriage certificates", "Evidence of ties to the U.S. (lease, bills, tax returns)"] },
            personal:    { checklist: ["Seek medical treatment immediately and follow up", "Do NOT give recorded statements to insurance", "Take photos of injuries and the accident scene", "Get contact info from witnesses", "Keep all medical bills and records"], questions: ["Do you work on contingency (no fee unless we win)?", "What is my case worth?", "How long will this take?", "Will I need to go to trial?", "What percentage do you take as your fee?"], documents: ["Medical records and bills", "Police report (if applicable)", "Photos of injuries and damage", "Insurance information (yours and theirs)", "Lost wage documentation", "Witness statements or contact info"] },
            consumer:    { checklist: ["Request debt validation in writing within 30 days", "Check your credit reports at annualcreditreport.com", "Document all collector communications", "Know that collectors cannot harass or threaten you", "Research if bankruptcy is a viable option"], questions: ["Is this debt valid and within the statute of limitations?", "Are the collectors violating the FDCPA?", "Should I negotiate, dispute, or file bankruptcy?", "What assets are protected in my state?", "How will this affect my credit long-term?"], documents: ["Debt validation letters", "Credit reports from all 3 bureaus", "Collection letters and call logs", "Original loan or credit agreements", "Bank statements", "Income documentation"] },
            civil:       { checklist: ["Document the discrimination or violation immediately", "Save all evidence (emails, recordings, photos)", "File a complaint with the relevant agency", "Contact the ACLU or NAACP for guidance", "Identify witnesses who can corroborate your account"], questions: ["Was my constitutional right violated?", "Which agency should I file with first?", "What is the deadline to file a complaint?", "Can I file both an agency complaint and a lawsuit?", "What remedies are available to me?"], documents: ["Written account of what happened", "Any physical evidence (photos, recordings)", "Witness names and contact information", "Agency complaint form or receipt", "Employment records (if workplace discrimination)", "Prior complaints filed (if any)"] },
            business:    { checklist: ["Gather all relevant contracts and agreements", "Document the dispute or issue in writing", "Review your business formation documents", "Check insurance coverage for the dispute", "Assess whether mediation could resolve it"], questions: ["What type of business entity should I form?", "Is this contract enforceable?", "What are my liability risks?", "Should I pursue litigation or mediation?", "What are the costs vs. potential recovery?"], documents: ["Articles of incorporation / LLC operating agreement", "Contracts in dispute", "Business financial statements", "Correspondence related to the dispute", "Insurance policies", "Partnership or shareholder agreements"] },
            other:       { checklist: ["Write down your situation in your own words", "List your key questions and concerns", "Gather any documents related to your issue", "Research attorneys in your area (try Avvo)", "Schedule free consultations with 2–3 attorneys"], questions: ["What area of law does my issue fall under?", "Do I need an attorney or can I handle this myself?", "What is your experience with cases like mine?", "What are my options and their likely outcomes?", "What will this cost me?"], documents: ["Any documents related to your situation", "Written timeline of events", "Contact information for relevant parties", "Photos or evidence if applicable", "Your questions written down", "ID and contact information"] },
          };
          const prep = PREP[caseType || "other"] ?? PREP.other;
          const typeLabel = CASE_TYPES.find((c) => c.id === caseType)?.label ?? "Legal";
          return (
            <>
              <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                  <span style={{ color: "#60a5fa", fontWeight: 700 }}>NAVI:</span> Being prepared makes a huge difference. Here{"'"}s your {typeLabel.toLowerCase()} preparation guide — checklist, key questions, and documents to bring.
                </div>
              </div>

              {/* Checklist */}
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#34d399", marginBottom: 10 }}>✅ Pre-Consultation Checklist</div>
                {prep.checklist.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: "#34d399", fontSize: 11, flexShrink: 0 }}>☐</span>
                    <span style={{ fontSize: 10, color: "#e2e8f0", lineHeight: 1.55 }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Questions */}
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", marginBottom: 10 }}>❓ Questions to Ask Your Lawyer</div>
                {prep.questions.map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: "#60a5fa", flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
                    <span style={{ fontSize: 10, color: "#e2e8f0", lineHeight: 1.55 }}>{q}</span>
                  </div>
                ))}
              </div>

              {/* Documents */}
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(201,162,39,0.04)", border: "1px solid rgba(201,162,39,0.12)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#C9A227", marginBottom: 10 }}>📁 Documents to Bring</div>
                {prep.documents.map((doc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ color: "#C9A227", fontSize: 9 }}>📄</span>
                    <span style={{ fontSize: 10, color: "#e2e8f0" }}>{doc}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.6 }}>⚖️ {DISCLAIMER}</div>
            </>
          );
        })()}
        {/* ── KNOW YOUR RIGHTS ────────────────────────────────────────── */}
        {activeTab === "rights" && (
          <>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                <span style={{ color: "#60a5fa", fontWeight: 700 }}>NAVI:</span> These are your fundamental rights under U.S. law. Know them before you need them.
              </div>
            </div>

            {[
              { title: "Right to remain silent", body: "The Fifth Amendment protects you from self-incrimination. You do not have to answer questions from police, investigators, or government agents. Say: \"I am exercising my right to remain silent.\" This applies whether you are arrested or not.", icon: "🤐", color: "#60a5fa" },
              { title: "Right to an attorney", body: "The Sixth Amendment guarantees your right to legal counsel. If you cannot afford an attorney, one will be appointed to you (public defender). Always say: \"I want to speak to a lawyer\" before answering any questions after arrest.", icon: "👨‍⚖️", color: "#60a5fa" },
              { title: "Right to refuse a search", body: "The Fourth Amendment protects you from unreasonable searches. Police generally need a warrant or your consent to search your home, car, or person. Say: \"I do not consent to this search.\" Do NOT physically resist — assert your rights verbally and note the violation for your attorney.", icon: "🚫", color: "#34d399" },
              { title: "Right to record police", body: "In all 50 states, you can legally record police officers performing their duties in public. You may NOT interfere with their work while recording. Keep a safe distance and stay calm. Your recording can be critical evidence.", icon: "📹", color: "#34d399" },
              { title: "Right to know why you're being stopped", body: "Officers must have reasonable suspicion to stop you and probable cause to arrest you. Ask: \"Am I being detained, or am I free to go?\" If detained, ask: \"What is the reason for this stop?\"", icon: "❓", color: "#C9A227" },
              { title: "Right to due process", body: "The Fourteenth Amendment guarantees that the government cannot deprive you of life, liberty, or property without due process of law. This means fair hearings, notice of charges, and the opportunity to be heard.", icon: "⚖️", color: "#C9A227" },
              { title: "Right to a speedy trial", body: "The Sixth Amendment guarantees your right to a speedy and public trial. You cannot be held indefinitely without being charged or tried. If you feel your case is being unreasonably delayed, your attorney can file a motion.", icon: "⏱️", color: "#a855f7" },
              { title: "Right to equal protection", body: "The Fourteenth Amendment guarantees equal protection under the law regardless of race, gender, religion, or national origin. If you believe you've been discriminated against by a government entity, you may have a civil rights claim.", icon: "🤝", color: "#a855f7" },
              { title: "What to do during a police encounter", body: "Stay calm. Keep your hands visible. Do not run or resist. State your rights clearly and calmly. Ask if you are free to leave. Do not consent to searches. Request an attorney before answering questions. Remember badge numbers and officer names. Write down everything as soon as possible.", icon: "🛡️", color: "#ef4444" },
              { title: "What to do if your rights are violated", body: "Document everything immediately — date, time, location, badge numbers, witnesses. File a complaint with the department's Internal Affairs division. File a complaint with the DOJ Civil Rights Division at civilrights.justice.gov. Contact the ACLU or NAACP. Consult a civil rights attorney.", icon: "📋", color: "#ef4444" },
            ].map((r) => (
              <div key={r.title} style={{ padding: "14px 16px", borderRadius: 14, background: `${r.color}06`, border: `1px solid ${r.color}15` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{r.icon}</span>
                  <div style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.title}</div>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.65 }}>{r.body}</div>
              </div>
            ))}

            {/* Resources */}
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", marginBottom: 10 }}>🔗 Legal Resources</div>
              {[
                { label: "ACLU — Know Your Rights", url: "https://www.aclu.org/know-your-rights", desc: "Comprehensive rights guide" },
                { label: "LawHelp.org", url: "https://www.lawhelp.org/", desc: "Free legal help by state" },
                { label: "LegalAid.org", url: "https://www.legalaid.org/", desc: "Find free legal services" },
                { label: "DOJ Civil Rights", url: "https://civilrights.justice.gov/", desc: "File federal complaints" },
                { label: "ABA Free Legal Answers", url: "https://abafreelegalanswers.org/", desc: "Free attorney Q&A for qualifying individuals" },
              ].map((r) => (
                <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(96,165,250,0.10)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#60a5fa" }}>{r.label}</div>
                      <div style={{ fontSize: 8, color: "#64748b", marginTop: 1 }}>{r.desc}</div>
                    </div>
                    <span style={{ fontSize: 10, color: "#475569" }}>↗</span>
                  </div>
                </a>
              ))}
            </div>

            <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.6 }}>⚖️ {DISCLAIMER}</div>
          </>
        )}
      </div>
    </div>
  );
}
