"use client";

import { useState, useRef } from "react";
import NaviOrb from "@/components/NaviOrb";

// ── Theme ─────────────────────────────────────────────────────────────────────
const RED   = "#ef4444";
const AMBER = "#f59e0b";
const BLUE  = "#60a5fa";
const GREEN = "#4ade80";

// ── Hardcoded rights & guidance per situation ─────────────────────────────────
const SITUATIONS = {
  police: {
    label: "Police Encounter",
    icon:  "🚨",
    color: RED,
    tagline: "You have constitutional rights. Know them.",
    rights: [
      "You have the right to remain silent (5th Amendment). You are NOT required to answer questions beyond identifying yourself in some states.",
      "You have the right to refuse a search of your person, car, or home without a warrant (4th Amendment).",
      "If arrested, you have the right to an attorney. Ask for one immediately and stop talking.",
      "You have the right to know why you are being detained or arrested.",
      "You cannot be punished for asserting your rights calmly and clearly.",
    ],
    doNow: [
      "Stay calm. Do not argue, resist, or run.",
      'Say clearly: "I am invoking my right to remain silent."',
      'Say clearly: "I do not consent to this search."',
      "If arrested, immediately ask: \"Am I free to go? I want a lawyer.\"",
      "Memorize badge numbers, officer names, and any witnesses.",
      "After the encounter, write down everything you remember.",
    ],
    avoid: [
      "Do NOT lie to police — silence is always safer than lies.",
      "Do NOT physically resist even an unlawful arrest.",
      "Do NOT consent to searches — you can refuse politely.",
      "Do NOT answer questions without a lawyer if detained or arrested.",
    ],
    emergency: [
      { label: "National Lawyer Referral", number: "1-800-285-2221" },
      { label: "ACLU Know Your Rights", url: "https://www.aclu.org/know-your-rights" },
      { label: "Dial 2-1-1 for local legal aid", number: "211" },
    ],
  },

  court: {
    label: "Court / Criminal Case",
    icon:  "⚖️",
    color: BLUE,
    tagline: "You have due process rights. Use them.",
    rights: [
      "You have the right to an attorney (6th Amendment). If you cannot afford one, a public defender must be appointed.",
      "You have the right to a speedy trial by a jury of your peers.",
      "You are presumed innocent until proven guilty beyond a reasonable doubt.",
      "You have the right to confront witnesses against you and present your own evidence.",
      "You cannot be tried twice for the same crime (double jeopardy, 5th Amendment).",
    ],
    doNow: [
      "Request a public defender at your first hearing if you cannot afford an attorney.",
      "Write down all dates, charges, and what was said in court.",
      "Do NOT miss court dates — a warrant will be issued for your arrest.",
      "Review all documents carefully before signing anything.",
      "Keep copies of every document you receive.",
      "Ask your attorney about diversion programs, expungement, or plea deals.",
    ],
    avoid: [
      "Do NOT represent yourself without understanding the charges.",
      "Do NOT talk to the other party without your attorney present.",
      "Do NOT post about your case on social media.",
      "Do NOT miss court dates for any reason.",
    ],
    emergency: [
      { label: "National Legal Aid & Defender Assoc.", url: "https://www.nlada.org" },
      { label: "Public Defender (request at arraignment)", number: "Request in court" },
      { label: "Dial 2-1-1 for local legal aid", number: "211" },
    ],
  },

  housing: {
    label: "Eviction / Housing",
    icon:  "🏠",
    color: AMBER,
    tagline: "You have tenant rights. Act before the deadline.",
    rights: [
      "Landlords must provide proper written notice before eviction — typically 3 to 30 days depending on your state.",
      "You have the right to contest an eviction in court. Filing an answer to the eviction notice buys you time.",
      "Your home must be habitable. Landlords cannot cut off heat, water, or electricity to force you out.",
      "A landlord cannot change your locks, remove your belongings, or physically remove you without a court order.",
      "You may have the right to withhold rent if the landlord refuses to make emergency repairs.",
    ],
    doNow: [
      "Read your eviction notice carefully — note the date and the reason given.",
      "Respond in writing to the notice within the stated deadline.",
      "File an answer with the local housing court to preserve your right to a hearing.",
      "Document all habitability issues with dated photos and written requests.",
      "Contact your local housing authority or legal aid for emergency rental assistance.",
      "Never abandon your home voluntarily during the eviction process — you may lose rights.",
    ],
    avoid: [
      "Do NOT ignore an eviction notice — deadlines are strict.",
      "Do NOT withhold rent without legal guidance — it can backfire.",
      "Do NOT let a landlord enter without proper notice (usually 24–48 hours).",
      "Do NOT pay rent in cash without getting a receipt.",
    ],
    emergency: [
      { label: "HUD Housing Helpline", number: "1-800-569-4287" },
      { label: "National Housing Law Project", url: "https://nhlp.org" },
      { label: "Emergency Rental Assistance — 2-1-1", number: "211" },
    ],
  },

  family: {
    label: "Family Law",
    icon:  "👨‍👩‍👧",
    color: "#a855f7",
    tagline: "You have rights as a parent and as a person.",
    rights: [
      "Both parents generally have equal rights to custody until a court order says otherwise.",
      "Domestic violence survivors can seek an emergency protective order (EPO) the same day without a lawyer.",
      "Child support is a legal obligation — the paying parent cannot reduce it without a court modification.",
      "You have the right to legal representation in divorce, custody, and child support hearings.",
      "Immigration status does NOT remove your parental rights or prevent you from seeking a protective order.",
    ],
    doNow: [
      "If you are in danger right now, call 911 or the National DV Hotline: 1-800-799-7233.",
      "Document all incidents with dates, descriptions, photos, and witnesses.",
      "Contact your local courthouse to file for a protective order — it's free.",
      "Contact legal aid for free help with custody, divorce, or support orders.",
      "Secure important documents: ID, birth certificates, financial records, lease/deed.",
      "Create a safety plan if there is any risk of violence.",
    ],
    avoid: [
      "Do NOT violate any existing protective order — even if invited.",
      "Do NOT make major decisions about custody without a legal agreement.",
      "Do NOT move children out of state without a court order or written consent.",
      "Do NOT use children as messengers between parents.",
    ],
    emergency: [
      { label: "National DV Hotline", number: "1-800-799-7233" },
      { label: "National Parent Helpline", number: "1-855-427-2736" },
      { label: "Dial 2-1-1 for local family legal aid", number: "211" },
    ],
  },

  other: {
    label: "Other Legal Issue",
    icon:  "📋",
    color: GREEN,
    tagline: "NAVI can help you find the right resource.",
    rights: [
      "You have the right to contact your state bar association for a free or low-cost attorney referral.",
      "Many legal issues have a statute of limitations — time limits on when you can file. Act quickly.",
      "Legal aid organizations provide free civil legal help to people who cannot afford an attorney.",
      "Court self-help centers are available in most courthouses and can assist with paperwork.",
      "You can file small claims court cases (typically under $10,000) without an attorney.",
    ],
    doNow: [
      "Write down all key dates, names, and facts related to your situation.",
      "Gather and organize all relevant documents.",
      "Contact your state bar association for a lawyer referral.",
      "Search LawHelp.org for free resources in your state.",
      "Call 211 to be connected to local social services and legal aid.",
      "Ask NAVI specific questions — I can explain documents and legal concepts.",
    ],
    avoid: [
      "Do NOT sign legal documents without fully understanding them.",
      "Do NOT miss deadlines — legal rights expire.",
      "Do NOT rely solely on advice from non-lawyers (friends, internet forums).",
      "Do NOT wait too long — many problems worsen without action.",
    ],
    emergency: [
      { label: "State Bar Referral", number: "1-800-285-2221" },
      { label: "LawHelp.org — free resources by state", url: "https://www.lawhelp.org" },
      { label: "Dial 2-1-1 for local help", number: "211" },
    ],
  },
};

// ── Resource type metadata ────────────────────────────────────────────────────
const RESOURCE_META = {
  legal_aid:      { label: "Legal Aid",       icon: "⚖️",  color: BLUE  },
  hotline:        { label: "Hotline",          icon: "📞", color: RED   },
  court_help:     { label: "Court Help",       icon: "🏛️", color: AMBER },
  bar_referral:   { label: "Bar Referral",     icon: "📋", color: GREEN },
  national_org:   { label: "National Org",     icon: "🌐", color: BLUE  },
  social_services:{ label: "Social Services",  icon: "🤝", color: "#a855f7" },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function NaviBubble({ text, typing = false }) {
  return (
    <div className="flex items-start gap-2.5 animate-[fadeUp_0.35s_ease_both]" style={{ animationFillMode: "both" }}>
      <div className="flex-shrink-0 mt-0.5">
        <NaviOrb size={28} />
      </div>
      <div
        className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {typing ? (
          <div className="flex items-center gap-1 py-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-slate-400"
                style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-line">{text}</p>
        )}
      </div>
    </div>
  );
}

function SituationCard({ situation, sitKey, onSelect }) {
  return (
    <button
      onClick={() => onSelect(sitKey)}
      className="w-full flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all duration-200"
      style={{
        background: `${situation.color}10`,
        border: `1px solid ${situation.color}28`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${situation.color}1e`; e.currentTarget.style.borderColor = `${situation.color}50`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = `${situation.color}10`; e.currentTarget.style.borderColor = `${situation.color}28`; }}
    >
      <span style={{ fontSize: 24, lineHeight: 1 }}>{situation.icon}</span>
      <div>
        <div className="text-sm font-mono font-bold text-white">{situation.label}</div>
        <div className="text-[10px] font-mono mt-0.5" style={{ color: situation.color }}>{situation.tagline}</div>
      </div>
      <span className="ml-auto text-sm" style={{ color: situation.color }}>→</span>
    </button>
  );
}

function RightsSection({ title, icon, items, color }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color }}>{title}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-xl px-3 py-2"
            style={{ background: `${color}0c`, border: `1px solid ${color}18` }}
          >
            <span className="text-[10px] font-bold mt-0.5 flex-shrink-0" style={{ color }}>
              {i + 1}.
            </span>
            <span className="text-[11px] font-mono text-slate-300 leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmergencyContact({ contact }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2"
      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
    >
      <span className="text-sm">{contact.number ? "📞" : "🔗"}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-mono font-bold text-white leading-snug">{contact.label}</div>
        {contact.number && (
          <div className="text-[10px] font-mono" style={{ color: RED }}>{contact.number}</div>
        )}
        {contact.url && !contact.number && (
          <a
            href={contact.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono truncate hover:underline"
            style={{ color: RED }}
          >
            {contact.url}
          </a>
        )}
      </div>
    </div>
  );
}

function ResourceCard({ resource }) {
  const meta = RESOURCE_META[resource.type] ?? { label: resource.type ?? "Resource", icon: "📋", color: BLUE };
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${meta.color}28` }}
    >
      <span
        className="self-start text-[10px] font-mono px-2 py-0.5 rounded-full"
        style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}38`, color: meta.color, letterSpacing: "0.05em" }}
      >
        {meta.icon} {meta.label}
      </span>
      <div className="text-sm font-mono font-bold text-white leading-snug">{resource.name}</div>
      <p className="text-xs font-mono text-slate-400 leading-relaxed">{resource.description}</p>
      {resource.contact && (
        <div
          className="rounded-xl px-3 py-2"
          style={{ background: `${meta.color}0c`, border: `1px solid ${meta.color}22` }}
        >
          <span className="text-[11px] font-mono leading-relaxed" style={{ color: meta.color }}>
            📞 {resource.contact}
          </span>
        </div>
      )}
      {resource.cost && (
        <span className="text-[10px] font-mono" style={{ color: GREEN }}>
          💚 {resource.cost}
        </span>
      )}
      {resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono truncate underline-offset-2 hover:underline"
          style={{ color: "rgba(148,163,184,0.45)" }}
        >
          {resource.url}
        </a>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2.5 animate-pulse"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="h-4 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="h-4 w-3/4 rounded-lg"  style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="h-3 w-full rounded-lg"  style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="h-8 w-full rounded-xl"  style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LegalRightsPanel({ onClose }) {
  const [phase, setPhase]               = useState("home"); // home | urgent | situation | resources
  const [activeSitKey, setActiveSitKey] = useState(null);
  const [location, setLocation]         = useState("");
  const [searchedLocation, setSearchedLocation] = useState("");
  const [loadingResources, setLoadingResources] = useState(false);
  const [legalResources, setLegalResources]     = useState(null);
  const [resourceError, setResourceError]       = useState(null);
  const inputRef = useRef(null);

  const activeSit = activeSitKey ? SITUATIONS[activeSitKey] : null;

  const handleSelectSituation = (key) => {
    setActiveSitKey(key);
    setPhase("situation");
  };

  const handleFindResources = async (e) => {
    e?.preventDefault();
    const loc = location.trim();
    if (!loc || loadingResources) return;

    setLoadingResources(true);
    setResourceError(null);
    setLegalResources(null);

    try {
      const res = await fetch("/api/legal-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc, situationType: activeSitKey }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to load resources.");
      setSearchedLocation(loc);
      setLegalResources(data.resources ?? []);
      setPhase("resources");
    } catch (err) {
      setResourceError(err?.message ?? "Something went wrong.");
    } finally {
      setLoadingResources(false);
    }
  };

  const resetToHome = () => {
    setPhase("home");
    setActiveSitKey(null);
    setLegalResources(null);
    setResourceError(null);
    setLocation("");
  };

  // ── Back button label ──────────────────────────────────────────────────────
  const backLabel =
    phase === "urgent"    ? "← Back"        :
    phase === "situation" ? "← Situations"  :
    phase === "resources" ? "← Back"        :
    null;

  const handleBack = () => {
    if (phase === "urgent")    { setPhase("home"); return; }
    if (phase === "situation") { setPhase("home"); setActiveSitKey(null); return; }
    if (phase === "resources") {
      setLegalResources(null);
      setResourceError(null);
      setPhase("situation");
      return;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden animate-overlay-in"
      style={{ background: "rgba(8,8,15,0.97)", backdropFilter: "blur(16px)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          {backLabel && (
            <button
              onClick={handleBack}
              className="text-[11px] font-mono px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ color: "#64748b", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {backLabel}
            </button>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
              ⚖️ Legal Rights Guide
            </span>
            <span className="text-[10px] font-mono text-slate-500 tracking-wide">
              Know your rights · Find free legal help
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-16">

        {/* ── HOME phase ── */}
        {phase === "home" && (
          <div className="flex flex-col gap-4">
            <NaviBubble text={"I'm here to help you understand your rights and options.\n\nSelect your situation below, or tap the red button if you need help right now."} />

            {/* Urgent button */}
            <button
              onClick={() => setPhase("urgent")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-mono font-bold text-sm transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.20), rgba(220,38,38,0.10))",
                border: "1px solid rgba(239,68,68,0.45)",
                color: RED,
                boxShadow: "0 0 16px rgba(239,68,68,0.12)",
              }}
            >
              🚨 I need help RIGHT NOW
            </button>

            {/* Situation cards */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-mono tracking-widest uppercase text-slate-600 mb-1">
                Choose your situation
              </p>
              {Object.entries(SITUATIONS).map(([key, sit]) => (
                <SituationCard key={key} sitKey={key} situation={sit} onSelect={handleSelectSituation} />
              ))}
            </div>

            <NaviBubble text="Remember: this is educational information, not legal advice. I'll always help you find a real attorney or legal aid near you." />
          </div>
        )}

        {/* ── URGENT phase ── */}
        {phase === "urgent" && (
          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl p-4 flex flex-col gap-2"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.30)" }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 20 }}>🚨</span>
                <span className="text-sm font-mono font-bold" style={{ color: RED }}>Emergency Contacts</span>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                {[
                  { label: "Emergency — Police, Fire, Medical", number: "9-1-1" },
                  { label: "National DV Hotline (24/7, free)", number: "1-800-799-7233" },
                  { label: "National Lawyer Referral Service", number: "1-800-285-2221" },
                  { label: "Social Services & Local Legal Aid", number: "2-1-1" },
                  { label: "Crisis Text Line — text HOME to", number: "741741" },
                ].map((c, i) => (
                  <EmergencyContact key={i} contact={c} />
                ))}
              </div>
            </div>

            <NaviBubble text="If you are in immediate danger, call 911. If it is safe to talk, call 211 to be connected to local legal aid." />

            <RightsSection
              title="Key Rights to Know Right Now"
              icon="📋"
              color={RED}
              items={[
                "You have the right to remain silent — you do NOT have to answer questions without a lawyer.",
                "You have the right to an attorney. Ask for one clearly. Then stop talking.",
                "You cannot be evicted without a court order. A landlord cannot change your locks without one.",
                "Domestic violence survivors can get a free emergency protective order the same day.",
                "You have the right to refuse a search without a warrant.",
              ]}
            />

            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-mono tracking-widest uppercase text-slate-600 mb-1">
                Still need help? Choose your situation
              </p>
              {Object.entries(SITUATIONS).map(([key, sit]) => (
                <SituationCard key={key} sitKey={key} situation={sit} onSelect={handleSelectSituation} />
              ))}
            </div>
          </div>
        )}

        {/* ── SITUATION phase ── */}
        {phase === "situation" && activeSit && (
          <div className="flex flex-col gap-4">
            {/* Situation header */}
            <div
              className="rounded-2xl p-4"
              style={{ background: `${activeSit.color}0c`, border: `1px solid ${activeSit.color}30` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 22 }}>{activeSit.icon}</span>
                <div>
                  <div className="text-sm font-mono font-bold text-white">{activeSit.label}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: activeSit.color }}>{activeSit.tagline}</div>
                </div>
              </div>
            </div>

            <RightsSection
              title="Your Rights"
              icon="📋"
              color={activeSit.color}
              items={activeSit.rights}
            />

            <RightsSection
              title="What To Do Now"
              icon="✅"
              color={GREEN}
              items={activeSit.doNow}
            />

            <RightsSection
              title="What To Avoid"
              icon="⛔"
              color={RED}
              items={activeSit.avoid}
            />

            {/* Emergency contacts for this situation */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ fontSize: 14 }}>📞</span>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: RED }}>
                  Get Help Now
                </span>
              </div>
              {activeSit.emergency.map((c, i) => (
                <EmergencyContact key={i} contact={c} />
              ))}
            </div>

            {/* Find local legal aid */}
            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.20)" }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16 }}>📍</span>
                <span className="text-sm font-mono font-bold text-white">Find Local Legal Aid</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                Enter your city or ZIP to find free and low-cost legal services near you.
              </p>
              <form onSubmit={handleFindResources} className="flex gap-2">
                <div
                  className="flex items-center flex-1 gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span className="text-sm flex-shrink-0">📍</span>
                  <input
                    ref={inputRef}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City or ZIP code"
                    disabled={loadingResources}
                    className="flex-1 bg-transparent font-mono text-sm text-slate-200 placeholder-slate-600 focus:outline-none disabled:opacity-50 min-w-0"
                    style={{ caretColor: BLUE }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!location.trim() || loadingResources}
                  className="px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(96,165,250,0.12)",
                    border: "1px solid rgba(96,165,250,0.35)",
                    color: BLUE,
                  }}
                >
                  {loadingResources ? "..." : "Search"}
                </button>
              </form>
              {resourceError && (
                <p className="text-[10px] font-mono leading-relaxed" style={{ color: "#fca5a5" }}>
                  ⚠ {resourceError}
                </p>
              )}
            </div>

            <NaviBubble text="You can also ask me questions directly in Lawyer Mode — I'll explain anything in plain language." />
          </div>
        )}

        {/* ── RESOURCES phase ── */}
        {phase === "resources" && (
          <div className="flex flex-col gap-3">
            <NaviBubble text={`Here are free and low-cost legal resources near ${searchedLocation}. Always call ahead to confirm eligibility and hours.`} />

            {loadingResources && (
              <div className="flex flex-col gap-3">
                <div className="text-[10px] font-mono text-slate-600 tracking-widest uppercase animate-pulse">
                  Searching for legal resources…
                </div>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {legalResources && legalResources.length > 0 && (
              <>
                <div className="text-[10px] font-mono text-slate-600 tracking-widest uppercase mb-1">
                  {legalResources.length} resources near {searchedLocation}
                </div>
                {legalResources.map((r, i) => (
                  <ResourceCard key={i} resource={r} />
                ))}
              </>
            )}

            {legalResources && legalResources.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12">
                <span style={{ fontSize: 32 }}>🔍</span>
                <p className="text-xs font-mono text-slate-500 text-center leading-relaxed max-w-[240px]">
                  No results found for "{searchedLocation}". Try a nearby city or a different ZIP code.
                </p>
              </div>
            )}

            <button
              onClick={resetToHome}
              className="w-full py-2.5 rounded-xl font-mono text-xs font-bold mt-2 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#64748b",
              }}
            >
              ← Start Over
            </button>

            <p className="text-[10px] font-mono text-slate-700 text-center leading-relaxed pt-2 pb-4 px-2">
              Results are AI-generated suggestions. Always verify details directly with each resource.
            </p>
          </div>
        )}
      </div>

      {/* ── Sticky disclaimer ── */}
      <div
        className="flex-shrink-0 px-4 py-2.5 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(8,8,15,0.90)" }}
      >
        <p className="text-[9px] font-mono leading-relaxed" style={{ color: "rgba(100,116,139,0.6)" }}>
          ⚠ This information is for educational purposes only and is NOT legal advice. For your specific situation, consult a licensed attorney.
        </p>
      </div>
    </div>
  );
}
