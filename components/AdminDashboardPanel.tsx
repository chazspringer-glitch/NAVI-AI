"use client";

import { useState, useEffect, useCallback } from "react";

/* ── Static mock data ─────────────────────────────────────────────────────── */

const STATS = [
  { label: "Total Clients",   value: "48",      change: "+6 this month",    icon: "👥", accent: "#C9A227" },
  { label: "Active Projects",  value: "17",      change: "3 pending review", icon: "📂", accent: "#00d4ff" },
  { label: "Revenue (MTD)",   value: "$28,400",  change: "+12% vs last mo",  icon: "💰", accent: "#34d399" },
  { label: "Completion Rate",  value: "94%",     change: "Above target",     icon: "✅", accent: "#a855f7" },
];

const ACTIVITY = [
  { id: 1, text: "New client onboarded — **Luxe Beauty Bar**",         time: "12 min ago", dot: "#34d399" },
  { id: 2, text: "Work order delivered — **TrueGrit Fitness** (Logo)", time: "1 hr ago",   dot: "#C9A227" },
  { id: 3, text: "Ad campaign launched — **SolShine Candles**",        time: "3 hrs ago",  dot: "#00d4ff" },
  { id: 4, text: "Invoice paid — **UrbanRoots Co.** ($600)",          time: "5 hrs ago",  dot: "#34d399" },
  { id: 5, text: "Content batch uploaded — **NovaTech Solutions**",    time: "Yesterday",  dot: "#a855f7" },
  { id: 6, text: "Strategy call completed — **Pinnacle Realty**",      time: "Yesterday",  dot: "#C9A227" },
  { id: 7, text: "New inquiry received — **FreshPlate Meals**",        time: "2 days ago", dot: "#00d4ff" },
];

const CLIENTS = [
  { name: "Luxe Beauty Bar",    service: "Startup Launch Package", status: "Active",    revenue: "$600"   },
  { name: "TrueGrit Fitness",   service: "Logo Generator",        status: "Delivered", revenue: "$250"   },
  { name: "SolShine Candles",   service: "Targeted Ads",          status: "Active",    revenue: "$800"   },
  { name: "UrbanRoots Co.",     service: "Social Media",          status: "Active",    revenue: "$600"   },
  { name: "NovaTech Solutions", service: "AI Content",            status: "Active",    revenue: "$1,200" },
  { name: "Pinnacle Realty",    service: "Consulting",            status: "Completed", revenue: "$400"   },
  { name: "FreshPlate Meals",   service: "Startup Launch Package", status: "Pending",   revenue: "$600"   },
];

const CONTENT_QUEUE = [
  { client: "Luxe Beauty Bar",    type: "Video Post", platform: "Instagram", due: "Today",    status: "In Progress" },
  { client: "Luxe Beauty Bar",    type: "Image Post", platform: "Facebook",  due: "Today",    status: "Ready"       },
  { client: "UrbanRoots Co.",     type: "Story",      platform: "Instagram", due: "Today",    status: "Scheduled"   },
  { client: "SolShine Candles",   type: "Video Post", platform: "Instagram", due: "Tomorrow", status: "In Progress" },
  { client: "NovaTech Solutions", type: "Image Post", platform: "LinkedIn",  due: "Tomorrow", status: "Draft"       },
  { client: "UrbanRoots Co.",     type: "Video Post", platform: "TikTok",    due: "Apr 15",   status: "Draft"       },
];

type AdminTab = "dashboard" | "clients" | "content" | "analytics" | "settings";

const ADMIN_TABS: { key: AdminTab; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "clients",   label: "Clients",   icon: "👥" },
  { key: "content",   label: "Content",   icon: "📝" },
  { key: "analytics", label: "Analytics", icon: "📈" },
  { key: "settings",  label: "Settings",  icon: "⚙️" },
];

const STATUS_COLOR: Record<string, string> = {
  Active:        "#34d399",
  Delivered:     "#C9A227",
  Completed:     "#a855f7",
  Pending:       "#64748b",
  "In Progress": "#00d4ff",
  Ready:         "#34d399",
  Scheduled:     "#C9A227",
  Draft:         "#64748b",
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} style={{ color: "#f1f5f9", fontWeight: 700 }}>{part}</span>
      : <span key={i}>{part}</span>
  );
}

/* ── Component ────────────────────────────────────────────────────────────── */

interface SupabaseClient {
  id: string;
  name: string;
  email: string;
  business_name: string;
  service_type: string;
  created_at: string;
}

export default function AdminDashboardPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<AdminTab>("dashboard");

  // ── Supabase clients state ──────────────────────────────────────────────
  const [dbClients, setDbClients] = useState<SupabaseClient[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Add-client form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formBusiness, setFormBusiness] = useState("");
  const [formService, setFormService] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const loadClients = useCallback(async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      console.log("[AdminDash] Fetching clients from /api/clients...");
      const res = await fetch("/api/clients");
      const json = await res.json();
      if (Array.isArray(json.clients)) {
        console.log("[AdminDash] Received", json.clients.length, "clients from Supabase");
        setDbClients(json.clients);
      } else {
        console.warn("[AdminDash] Unexpected response:", json);
      }
    } catch (err) {
      console.error("[AdminDash] Fetch failed:", err);
      setDbError("Could not connect to database");
    } finally {
      setDbLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleAddClient = async () => {
    if (!formName || !formEmail || !formBusiness || !formService) return;
    setFormSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          business_name: formBusiness,
          service_type: formService,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        console.log("[AdminDash] Client created:", json.client?.id);
        setFormName(""); setFormEmail(""); setFormBusiness(""); setFormService("");
        setShowAddForm(false);
        await loadClients();
      }
    } catch (err) {
      console.error("[AdminDash] Insert failed:", err);
    } finally {
      setFormSaving(false);
    }
  };

  const handleTestInsert = async () => {
    setFormSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Client",
          email: "test@navi.com",
          business_name: "Test Brand",
          service_type: "Startup Package",
        }),
      });
      if (res.ok) {
        const json = await res.json();
        console.log("[AdminDash] Test client inserted:", json.client?.id);
        await loadClients();
      }
    } catch (err) {
      console.error("[AdminDash] Test insert failed:", err);
    } finally {
      setFormSaving(false);
    }
  };

  // Dynamic stats — update Total Clients from live data
  const liveStats = STATS.map((s) =>
    s.label === "Total Clients" && !dbLoading
      ? { ...s, value: String(dbClients.length), change: dbClients.length > 0 ? "Live from Supabase" : "No clients yet" }
      : s
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "rgba(4,4,12,0.98)",
      backdropFilter: "blur(20px)",
      fontFamily: "monospace",
    }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid rgba(201,162,39,0.12)",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "#C9A227", marginBottom: 3 }}>
            Springer Industries
          </div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9", letterSpacing: "0.03em" }}>
            📊 Admin Dashboard
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            padding: "4px 10px", borderRadius: 6,
            background: "rgba(52,211,153,0.10)",
            border: "1px solid rgba(52,211,153,0.20)",
            fontSize: 9, color: "#34d399", fontWeight: 600,
          }}>
            Online
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent", color: "#64748b",
              cursor: "pointer", fontSize: 14,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Tab navigation ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, overflowX: "auto", padding: "8px 16px 0", flexShrink: 0 }}>
        {ADMIN_TABS.map(({ key, label, icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: "8px 6px", borderRadius: 8,
                fontSize: 9, fontFamily: "monospace", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                whiteSpace: "nowrap",
                background: active ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.03)",
                border: active ? "1px solid rgba(201,162,39,0.35)" : "1px solid rgba(255,255,255,0.06)",
                color: active ? "#C9A227" : "#64748b",
                fontWeight: active ? 700 : 400,
                transition: "all 0.18s ease",
              }}
            >
              <span style={{ fontSize: 13 }}>{icon}</span>
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Dashboard ──────────────────────────────────────────────────── */}
      {tab === "dashboard" && (
        <>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {liveStats.map(({ label, value, change, icon, accent }) => (
              <div key={label} style={{
                padding: "14px 14px 12px",
                borderRadius: 12,
                background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
                border: `1px solid ${accent}22`,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -16, right: -16,
                  width: 60, height: 60, borderRadius: "50%",
                  background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`,
                  pointerEvents: "none",
                }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 9, color: "#64748b", letterSpacing: "0.04em" }}>{label}</span>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: 4 }}>
                  {value}
                </div>
                <div style={{ fontSize: 9, color: accent, fontWeight: 500 }}>
                  {change}
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div style={{
            padding: "16px 16px",
            borderRadius: 12,
            background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
            border: "1px solid rgba(201,162,39,0.10)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", marginBottom: 12, letterSpacing: "0.02em" }}>
              Recent Activity
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ACTIVITY.map(({ id, text, time, dot }, i) => (
                <div key={id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 0",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: dot, flexShrink: 0, marginTop: 4,
                    boxShadow: `0 0 6px ${dot}55`,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
                      {renderBold(text)}
                    </div>
                    <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>
                      {time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            padding: "16px 16px",
            borderRadius: 12,
            background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
            border: "1px solid rgba(201,162,39,0.10)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", marginBottom: 12, letterSpacing: "0.02em" }}>
              Quick Actions
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { icon: "➕", label: "Add Client" },
                { icon: "📤", label: "Send Work Order" },
                { icon: "📅", label: "Schedule Content" },
                { icon: "💬", label: "Messages" },
              ].map(({ icon, label }) => (
                <button key={label} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 12px", borderRadius: 8,
                  background: "rgba(201,162,39,0.04)",
                  border: "1px solid rgba(201,162,39,0.10)",
                  cursor: "pointer", fontSize: 10, fontFamily: "monospace",
                  color: "#94a3b8", transition: "all 0.18s ease",
                }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Clients ────────────────────────────────────────────────────── */}
      {tab === "clients" && (
        <>
          {/* Action buttons row */}
          <div style={{ display: "flex", gap: 8 }}>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "rgba(201,162,39,0.06)",
                  border: "1px solid rgba(201,162,39,0.18)",
                  color: "#C9A227", fontSize: 10, fontFamily: "monospace",
                  cursor: "pointer", fontWeight: 600, transition: "all 0.18s ease",
                }}
              >
                <span style={{ fontSize: 14 }}>➕</span> Add New Client
              </button>
            )}
            <button
              onClick={handleTestInsert}
              disabled={formSaving}
              style={{
                flex: showAddForm ? 0 : 1, padding: "10px 14px", borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "rgba(0,212,255,0.06)",
                border: "1px solid rgba(0,212,255,0.18)",
                color: "#00d4ff", fontSize: 10, fontFamily: "monospace",
                cursor: "pointer", fontWeight: 600, transition: "all 0.18s ease",
                opacity: formSaving ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: 14 }}>🧪</span> {formSaving ? "Inserting..." : "Test Insert"}
            </button>
          </div>

          {/* Add Client form */}
          {showAddForm && (
            <div style={{
              padding: "14px 16px", borderRadius: 12,
              background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
              border: "1px solid rgba(201,162,39,0.18)",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#C9A227", marginBottom: 2 }}>New Client</div>
              {[
                { label: "Name", value: formName, set: setFormName, placeholder: "Full name" },
                { label: "Email", value: formEmail, set: setFormEmail, placeholder: "email@example.com" },
                { label: "Business", value: formBusiness, set: setFormBusiness, placeholder: "Business name" },
                { label: "Service", value: formService, set: setFormService, placeholder: "e.g. Startup Launch Package" },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <div style={{ fontSize: 8, color: "#475569", marginBottom: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
                  <input
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder={placeholder}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 8,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#e2e8f0", fontSize: 11, fontFamily: "monospace",
                      outline: "none",
                    }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  onClick={handleAddClient}
                  disabled={formSaving || !formName || !formEmail || !formBusiness || !formService}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer",
                    background: formSaving ? "rgba(201,162,39,0.08)" : "rgba(201,162,39,0.12)",
                    border: "1px solid rgba(201,162,39,0.30)",
                    color: "#C9A227", fontSize: 10, fontFamily: "monospace", fontWeight: 600,
                    opacity: (!formName || !formEmail || !formBusiness || !formService) ? 0.4 : 1,
                  }}
                >
                  {formSaving ? "Saving..." : "Save Client"}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#64748b", fontSize: 10, fontFamily: "monospace",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Client list — LIVE from Supabase */}
          <div style={{
            borderRadius: 12,
            background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
            border: "1px solid rgba(201,162,39,0.10)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227" }}>Client Roster</div>
                <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>
                  {dbClients.length} total — Live from Supabase
                </div>
              </div>
              {dbLoading && (
                <div style={{ fontSize: 9, color: "#C9A227" }}>Loading...</div>
              )}
            </div>

            {/* Error state */}
            {dbError && (
              <div style={{ padding: "12px 16px", fontSize: 10, color: "#f87171", background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {dbError}
              </div>
            )}

            {/* Loading state */}
            {dbLoading && dbClients.length === 0 && (
              <div style={{ padding: "24px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#C9A227", marginBottom: 4 }}>Loading clients...</div>
                <div style={{ fontSize: 9, color: "#475569" }}>Connecting to Supabase</div>
              </div>
            )}

            {/* Empty state */}
            {!dbLoading && !dbError && dbClients.length === 0 && (
              <div style={{ padding: "24px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>No clients yet</div>
                <div style={{ fontSize: 9, color: "#475569" }}>Use "Add New Client" or "Test Insert" above</div>
              </div>
            )}

            {/* Client rows — all Supabase fields */}
            {dbClients.map((c, i) => (
              <div key={c.id} style={{
                padding: "12px 16px",
                borderBottom: i < dbClients.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{c.name}</div>
                  <span style={{
                    padding: "2px 8px", borderRadius: 5, fontSize: 8, fontWeight: 600,
                    color: "#34d399", background: "rgba(52,211,153,0.12)",
                    border: "1px solid rgba(52,211,153,0.25)",
                  }}>
                    Active
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  <div>
                    <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>Email</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{c.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>Business</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{c.business_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>Service</div>
                    <div style={{ fontSize: 10, color: "#C9A227", marginTop: 1 }}>{c.service_type}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>Created</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {tab === "content" && (
        <div style={{
          borderRadius: 12,
          background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
          border: "1px solid rgba(201,162,39,0.10)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227" }}>Content Queue</div>
            <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>Upcoming posts & deliverables</div>
          </div>
          {CONTENT_QUEUE.map(({ client, type, platform, due, status }, i) => (
            <div key={`${client}-${type}-${i}`} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 16px",
              borderBottom: i < CONTENT_QUEUE.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9", marginBottom: 2 }}>{client}</div>
                <div style={{ fontSize: 9, color: "#64748b" }}>{type} · {platform}</div>
              </div>
              <span style={{
                fontSize: 9, fontWeight: due === "Today" ? 600 : 400,
                color: due === "Today" ? "#C9A227" : "#64748b",
                flexShrink: 0,
              }}>
                {due}
              </span>
              <span style={{
                padding: "2px 8px", borderRadius: 5, fontSize: 8, fontWeight: 600,
                color: STATUS_COLOR[status] || "#64748b",
                background: `${STATUS_COLOR[status] || "#64748b"}15`,
                border: `1px solid ${STATUS_COLOR[status] || "#64748b"}30`,
                flexShrink: 0,
              }}>
                {status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Analytics ──────────────────────────────────────────────────── */}
      {tab === "analytics" && (
        <>
          {/* Revenue by Service */}
          <div style={{
            padding: "16px 16px",
            borderRadius: 12,
            background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
            border: "1px solid rgba(201,162,39,0.10)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", marginBottom: 14 }}>
              Revenue by Service
            </div>
            {[
              { service: "Startup Launch Package", amount: "$7,200",  pct: 25 },
              { service: "Social Media",           amount: "$6,000",  pct: 21 },
              { service: "AI Content",             amount: "$4,800",  pct: 17 },
              { service: "Targeted Ads",           amount: "$4,000",  pct: 14 },
              { service: "Consulting",             amount: "$3,200",  pct: 11 },
              { service: "Other",                  amount: "$3,200",  pct: 12 },
            ].map(({ service, amount, pct }) => (
              <div key={service} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>{service}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#f1f5f9" }}>{amount}</span>
                </div>
                <div style={{
                  height: 5, borderRadius: 3,
                  background: "rgba(201,162,39,0.08)", overflow: "hidden",
                }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 3,
                    background: "linear-gradient(90deg, #C9A227, #a07818)",
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Monthly Metrics */}
          <div style={{
            padding: "16px 16px",
            borderRadius: 12,
            background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
            border: "1px solid rgba(201,162,39,0.10)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", marginBottom: 12 }}>
              Monthly Metrics
            </div>
            {[
              { label: "New Clients",            value: "6",       trend: "+50% vs Mar" },
              { label: "Churn Rate",             value: "2.1%",    trend: "Below target" },
              { label: "Avg. Project Value",      value: "$593",    trend: "+8% vs Mar" },
              { label: "Client Satisfaction",     value: "4.8/5",   trend: "98% positive" },
              { label: "Content Pieces Shipped",  value: "142",     trend: "+18 vs Mar" },
              { label: "Ad Spend Managed",       value: "$12,400", trend: "+22% vs Mar" },
            ].map(({ label, value, trend }, i) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 0",
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{label}</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{value}</div>
                  <div style={{ fontSize: 9, color: "#34d399", marginTop: 1 }}>{trend}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Settings ───────────────────────────────────────────────────── */}
      {tab === "settings" && (
        <>
          <div style={{
            padding: "16px 16px",
            borderRadius: 12,
            background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
            border: "1px solid rgba(201,162,39,0.10)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", marginBottom: 12 }}>
              Account
            </div>
            {[
              { label: "Name",         value: "Chaz Springer" },
              { label: "Email",        value: "springerindustry@gmail.com" },
              { label: "Role",         value: "Admin / Founder" },
              { label: "Organization", value: "Springer Industries" },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{ fontSize: 10, color: "#64748b" }}>{label}</span>
                <span style={{ fontSize: 10, color: "#f1f5f9", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{
            padding: "16px 16px",
            borderRadius: 12,
            background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
            border: "1px solid rgba(201,162,39,0.10)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", marginBottom: 12 }}>
              Preferences
            </div>
            {[
              { label: "Email Notifications",    status: "Enabled" },
              { label: "Auto Work Order Emails",  status: "Enabled" },
              { label: "Dark Mode",               status: "Always" },
              { label: "Two-Factor Auth",          status: "Not set up" },
            ].map(({ label, status }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{ fontSize: 10, color: "#64748b" }}>{label}</span>
                <span style={{
                  fontSize: 9, fontWeight: 600,
                  color: status === "Not set up" ? "#f59e0b" : "#34d399",
                }}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      </div>{/* end scrollable content */}
    </div>
  );
}
