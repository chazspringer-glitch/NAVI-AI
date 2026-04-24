"use client";

import { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// NAVI HVAC Pro — Demo SaaS dashboard for HVAC companies
// Route: /hvac
// ─────────────────────────────────────────────────────────────────────────────

type Page = "login" | "dashboard" | "leads" | "quotes" | "bookings";

// ── Mock data ───────────────────────────────────────────────────────────────

const MOCK_LEADS = [
  { id: 1, name: "Marcus Williams", phone: "(910) 555-0142", service: "AC Repair", status: "New" },
  { id: 2, name: "Tanya Brooks", phone: "(910) 555-0287", service: "Full Install", status: "Contacted" },
  { id: 3, name: "David Chen", phone: "(910) 555-0391", service: "Maintenance", status: "Booked" },
  { id: 4, name: "Lisa Rodriguez", phone: "(910) 555-0456", service: "AC Repair", status: "New" },
  { id: 5, name: "James Carter", phone: "(910) 555-0523", service: "Duct Work", status: "Contacted" },
  { id: 6, name: "Angela Foster", phone: "(910) 555-0614", service: "Heat Pump Install", status: "New" },
  { id: 7, name: "Robert King", phone: "(910) 555-0738", service: "Thermostat Install", status: "Booked" },
];

const MOCK_JOBS = [
  { time: "10:00 AM", customer: "John Smith", type: "AC Repair", address: "1423 Market St" },
  { time: "11:30 AM", customer: "Maria Gonzalez", type: "Maintenance", address: "892 Oleander Dr" },
  { time: "1:00 PM", customer: "Sarah Johnson", type: "Full Install", address: "3201 Wrightsville Ave" },
  { time: "3:00 PM", customer: "Kevin Brown", type: "Duct Inspection", address: "456 College Rd" },
  { time: "4:30 PM", customer: "Diane Mitchell", type: "AC Repair", address: "789 Independence Blvd" },
];

const MOCK_BOOKINGS = [
  { date: "2026-04-18", customer: "John Smith", type: "AC Repair", time: "10:00 AM" },
  { date: "2026-04-18", customer: "Sarah Johnson", type: "Full Install", time: "1:00 PM" },
  { date: "2026-04-19", customer: "Marcus Williams", type: "AC Repair", time: "9:00 AM" },
  { date: "2026-04-19", customer: "Angela Foster", type: "Heat Pump Install", time: "11:00 AM" },
  { date: "2026-04-20", customer: "Robert King", type: "Thermostat", time: "10:00 AM" },
  { date: "2026-04-21", customer: "Lisa Rodriguez", type: "AC Repair", time: "2:00 PM" },
  { date: "2026-04-22", customer: "James Carter", type: "Duct Work", time: "9:30 AM" },
];

const AI_PROMPTS = [
  "Generate HVAC quote for 3-ton AC install",
  "Summarize today's schedule",
  "Follow up message for pending leads",
  "Draft a maintenance reminder email",
];

const STATUS_COLORS: Record<string, string> = {
  New: "#00d4ff",
  Contacted: "#f59e0b",
  Booked: "#34d399",
};

export default function HVACPro() {
  const [page, setPage] = useState<Page>("login");
  const [showAI, setShowAI] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  // Quote state
  const [quoteService, setQuoteService] = useState("repair");
  const [quoteTons, setQuoteTons] = useState("3");
  const [quoteLabor, setQuoteLabor] = useState("850");
  const [quoteMaterial, setQuoteMaterial] = useState("1200");
  const [quoteGenerated, setQuoteGenerated] = useState(false);

  // Leads state
  const [leads, setLeads] = useState(MOCK_LEADS);
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", phone: "", service: "AC Repair" });

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages.length]);

  const handleLogin = () => {
    if (loginEmail === "demo@example.com" && loginPass === "password") {
      setPage("dashboard");
      setLoginError("");
    } else {
      setLoginError("Invalid credentials. Use demo@example.com / password");
    }
  };

  const handleAI = async (prompt?: string) => {
    const text = prompt ?? aiInput.trim();
    if (!text || aiLoading) return;
    setAiInput("");
    setAiMessages((prev) => [...prev, { role: "user", content: text }]);
    setAiLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `You are NAVI HVAC Pro, an AI assistant for HVAC business owners. Help with quotes, scheduling, lead management, and customer communication. Be professional but friendly. The user says: ${text}`,
          userName: "HVAC Pro", petName: "NAVI", mood: "happy",
          bondLevel: 3, bondName: "Partner", mentorMode: "chat",
          appMode: "companion", history: aiMessages.slice(-6),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiMessages((prev) => [...prev, { role: "assistant", content: json.reply ?? "I couldn't process that." }]);
      }
    } catch { /* silent */ }
    finally { setAiLoading(false); }
  };

  const addLead = () => {
    if (!newLead.name.trim()) return;
    setLeads((prev) => [...prev, { id: prev.length + 1, name: newLead.name, phone: newLead.phone, service: newLead.service, status: "New" }]);
    setNewLead({ name: "", phone: "", service: "AC Repair" });
    setShowAddLead(false);
  };

  const NAV: { key: Page; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "leads",     label: "Leads",     icon: "👥" },
    { key: "quotes",    label: "Quotes",    icon: "📄" },
    { key: "bookings",  label: "Bookings",  icon: "📅" },
  ];

  // ── LOGIN PAGE ────────────────────────────────────────────────────────────
  if (page === "login") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0a0a1a, #0d1b2e)", fontFamily: "monospace" }}>
        <div style={{ width: "100%", maxWidth: 380, padding: "32px 24px", borderRadius: 20, background: "linear-gradient(160deg, rgba(16,16,28,0.98), rgba(10,10,22,0.98))", border: "1px solid rgba(0,150,255,0.15)", boxShadow: "0 0 60px rgba(0,150,255,0.08)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>❄️</div>
            <div style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#0096ff", marginBottom: 6 }}>Springer Industries</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>NAVI HVAC Pro</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Business Intelligence Dashboard</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Email" type="email"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }} />
            <input value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="Password" type="password"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }} />
            {loginError && <div style={{ fontSize: 10, color: "#f87171", padding: "6px 10px", borderRadius: 8, background: "rgba(239,68,68,0.08)" }}>{loginError}</div>}
            <button onClick={handleLogin} style={{ width: "100%", padding: "13px", borderRadius: 10, background: "linear-gradient(135deg, #0096ff, #0066cc)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "monospace", cursor: "pointer", boxShadow: "0 0 20px rgba(0,150,255,0.25)" }}>
              Sign In
            </button>
            <div style={{ fontSize: 8, color: "#475569", textAlign: "center" }}>Demo: demo@example.com / password</div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN APP ──────────────────────────────────────────────────────────────
  const quoteTotal = (parseInt(quoteLabor) || 0) + (parseInt(quoteMaterial) || 0);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0a0a1a, #0d1b2e)", fontFamily: "monospace", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(0,150,255,0.10)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>❄️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9" }}>NAVI HVAC Pro</div>
            <div style={{ fontSize: 8, color: "#475569" }}>Powered by Springer Industries</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setShowAI(!showAI)} style={{
            padding: "6px 14px", borderRadius: 8,
            background: showAI ? "rgba(0,150,255,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${showAI ? "rgba(0,150,255,0.35)" : "rgba(255,255,255,0.08)"}`,
            color: showAI ? "#0096ff" : "#64748b", fontSize: 10, fontWeight: 700, fontFamily: "monospace", cursor: "pointer",
          }}>
            🤖 AI Assistant
          </button>
          <button onClick={() => setPage("login")} style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b", fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{ display: "flex", gap: 4, padding: "8px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
        {NAV.map(({ key, label, icon }) => {
          const active = page === key;
          return (
            <button key={key} onClick={() => setPage(key)} style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 11, fontFamily: "monospace", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              background: active ? "rgba(0,150,255,0.12)" : "transparent",
              border: active ? "1px solid rgba(0,150,255,0.30)" : "1px solid transparent",
              color: active ? "#0096ff" : "#64748b", fontWeight: active ? 700 : 400,
              transition: "all 0.15s ease",
            }}>
              <span style={{ fontSize: 14 }}>{icon}</span> {label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Main content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

          {/* ── DASHBOARD ──────────────────────────────────────────────── */}
          {page === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>Dashboard</div>
              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                {[
                  { label: "Total Leads", value: String(leads.length), icon: "👥", color: "#0096ff" },
                  { label: "Jobs Today", value: "5", icon: "🔧", color: "#34d399" },
                  { label: "Revenue This Week", value: "$8,450", icon: "💰", color: "#f59e0b" },
                  { label: "Pending Quotes", value: "3", icon: "📄", color: "#a855f7" },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} style={{
                    padding: "18px 16px", borderRadius: 14,
                    background: `linear-gradient(135deg, ${color}0c, ${color}04)`,
                    border: `1px solid ${color}20`,
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${color}15`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{icon}</span>
                      <span style={{ fontSize: 8, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
                  </div>
                ))}
              </div>
              {/* Today's jobs */}
              <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>🔧 Today{"'"}s Jobs</div>
                {MOCK_JOBS.map((job, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < MOCK_JOBS.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    <div style={{ width: 60, fontSize: 11, fontWeight: 600, color: "#0096ff", flexShrink: 0 }}>{job.time}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{job.customer}</div>
                      <div style={{ fontSize: 9, color: "#64748b" }}>{job.type} · {job.address}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LEADS ──────────────────────────────────────────────────── */}
          {page === "leads" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>Leads</div>
                <button onClick={() => setShowAddLead(!showAddLead)} style={{ padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg, #0096ff, #0066cc)", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}>
                  + Add Lead
                </button>
              </div>
              {showAddLead && (
                <div style={{ padding: "16px", borderRadius: 14, background: "rgba(0,150,255,0.04)", border: "1px solid rgba(0,150,255,0.15)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} placeholder="Name" style={{ flex: 1, minWidth: 120, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 11, fontFamily: "monospace", outline: "none" }} />
                  <input value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} placeholder="Phone" style={{ flex: 1, minWidth: 120, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 11, fontFamily: "monospace", outline: "none" }} />
                  <select value={newLead.service} onChange={(e) => setNewLead({ ...newLead, service: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 11, fontFamily: "monospace", outline: "none" }}>
                    <option>AC Repair</option><option>Full Install</option><option>Maintenance</option><option>Duct Work</option><option>Heat Pump Install</option>
                  </select>
                  <button onClick={addLead} style={{ padding: "8px 16px", borderRadius: 8, background: "#0096ff", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "monospace", cursor: "pointer" }}>Save</button>
                </div>
              )}
              <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  <span>Name</span><span>Phone</span><span>Service</span><span>Status</span>
                </div>
                {leads.map((lead) => (
                  <div key={lead.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.1s", cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,150,255,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{lead.name}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{lead.phone}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{lead.service}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLORS[lead.status] ?? "#64748b", padding: "2px 8px", borderRadius: 6, background: `${STATUS_COLORS[lead.status] ?? "#64748b"}15`, display: "inline-block" }}>{lead.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── QUOTES ─────────────────────────────────────────────────── */}
          {page === "quotes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 600 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>Quote Generator</div>
              <div style={{ padding: "20px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Service Type</div>
                  <select value={quoteService} onChange={(e) => setQuoteService(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }}>
                    <option value="repair">AC Repair</option><option value="install">Full Installation</option><option value="maintenance">Maintenance</option><option value="heatpump">Heat Pump Install</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Unit Size (Tons)</div>
                  <select value={quoteTons} onChange={(e) => setQuoteTons(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }}>
                    {[1,1.5,2,2.5,3,3.5,4,5].map((t) => <option key={t} value={t}>{t} Ton</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Labor Cost ($)</div>
                    <input value={quoteLabor} onChange={(e) => setQuoteLabor(e.target.value)} type="number" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Material Cost ($)</div>
                    <input value={quoteMaterial} onChange={(e) => setQuoteMaterial(e.target.value)} type="number" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }} />
                  </div>
                </div>
                <button onClick={() => setQuoteGenerated(true)} style={{ width: "100%", padding: "13px", borderRadius: 10, background: "linear-gradient(135deg, #0096ff, #0066cc)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "monospace", cursor: "pointer", boxShadow: "0 0 16px rgba(0,150,255,0.20)" }}>
                  Generate Quote
                </button>
              </div>
              {quoteGenerated && (
                <div style={{ padding: "24px", borderRadius: 14, background: "linear-gradient(160deg, rgba(16,16,28,0.98), rgba(10,20,35,0.98))", border: "1px solid rgba(0,150,255,0.20)", boxShadow: "0 0 30px rgba(0,150,255,0.06)" }}>
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#0096ff", marginBottom: 4 }}>NAVI HVAC Pro</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>Service Estimate</div>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 0", marginBottom: 14 }}>
                    {[
                      { label: "Service", value: quoteService === "repair" ? "AC Repair" : quoteService === "install" ? "Full Installation" : quoteService === "heatpump" ? "Heat Pump Install" : "Maintenance" },
                      { label: "Unit Size", value: `${quoteTons} Ton` },
                      { label: "Labor", value: `$${parseInt(quoteLabor).toLocaleString()}` },
                      { label: "Materials", value: `$${parseInt(quoteMaterial).toLocaleString()}` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>TOTAL ESTIMATE</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#0096ff" }}>${quoteTotal.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 8, color: "#475569", marginTop: 12, textAlign: "center" }}>This is an estimate. Final pricing may vary based on site conditions.</div>
                </div>
              )}
            </div>
          )}

          {/* ── BOOKINGS ───────────────────────────────────────────────── */}
          {page === "bookings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>Bookings</div>
              {(() => {
                const grouped: Record<string, typeof MOCK_BOOKINGS> = {};
                MOCK_BOOKINGS.forEach((b) => { (grouped[b.date] ??= []).push(b); });
                return Object.entries(grouped).map(([date, bookings]) => (
                  <div key={date} style={{ borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12, fontWeight: 700, color: "#0096ff" }}>
                      📅 {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </div>
                    {bookings.map((b, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < bookings.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                        <div style={{ width: 60, fontSize: 11, fontWeight: 600, color: "#34d399", flexShrink: 0 }}>{b.time}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{b.customer}</div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>{b.type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* ── AI ASSISTANT PANEL ────────────────────────────────────────── */}
        {showAI && (
          <div style={{ width: 340, flexShrink: 0, borderLeft: "1px solid rgba(0,150,255,0.10)", display: "flex", flexDirection: "column", background: "rgba(6,6,18,0.95)" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,150,255,0.10)", fontSize: 13, fontWeight: 700, color: "#0096ff", display: "flex", alignItems: "center", gap: 8 }}>
              🤖 NAVI AI Assistant
            </div>
            {/* Quick prompts */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", flexWrap: "wrap", gap: 4 }}>
              {AI_PROMPTS.map((p) => (
                <button key={p} onClick={() => handleAI(p)} style={{
                  padding: "4px 8px", borderRadius: 6, fontSize: 8, fontFamily: "monospace", cursor: "pointer",
                  background: "rgba(0,150,255,0.06)", border: "1px solid rgba(0,150,255,0.15)", color: "#0096ff",
                }}>
                  {p}
                </button>
              ))}
            </div>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {aiMessages.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 10px", fontSize: 10, color: "#475569" }}>
                  Ask NAVI anything about your HVAC business — quotes, scheduling, leads, follow-ups.
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} style={{ marginBottom: 10, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "85%", padding: "8px 12px", borderRadius: 10,
                    background: msg.role === "user" ? "rgba(0,150,255,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${msg.role === "user" ? "rgba(0,150,255,0.25)" : "rgba(255,255,255,0.06)"}`,
                    fontSize: 11, color: "#e2e8f0", lineHeight: 1.6,
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && <div style={{ fontSize: 10, color: "#0096ff", padding: "8px" }}>NAVI is thinking…</div>}
              <div ref={chatEndRef} />
            </div>
            {/* Input */}
            <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 6 }}>
              <input value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAI()}
                placeholder="Ask NAVI..."
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 11, fontFamily: "monospace", outline: "none" }} />
              <button onClick={() => handleAI()} disabled={aiLoading || !aiInput.trim()} style={{
                padding: "8px 14px", borderRadius: 8,
                background: aiInput.trim() ? "#0096ff" : "rgba(255,255,255,0.04)",
                border: "none", color: "#fff", fontSize: 10, fontWeight: 700, fontFamily: "monospace", cursor: "pointer",
              }}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
