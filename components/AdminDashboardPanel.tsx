"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ── Static mock data (used only for dashboard activity feed fallback) ───── */

const ACTIVITY_FALLBACK = [
  { id: 1, text: "Dashboard connected — **live data active**", time: "just now", dot: "#34d399" },
];

// CONTENT_QUEUE mock removed — Content tab now shows live System Health

type AdminTab = "dashboard" | "clients" | "orders" | "food" | "content" | "analytics" | "settings";

const ADMIN_TABS: { key: AdminTab; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "clients",   label: "Clients",   icon: "👥" },
  { key: "orders",    label: "Orders",    icon: "📋" },
  { key: "food",      label: "Food",      icon: "🥬" },
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

function timeAgoShort(iso: string): string {
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

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

  // ── Work orders state ──────────────────────────────────────────────────
  interface WorkOrderRow {
    id: string;
    user_id: string | null;
    client_name: string;
    client_email: string;
    business_name: string;
    service: string;
    status: string;
    answers: { question: string; answer: string }[];
    work_order: { clientName: string; service: string; summary: string; objectives: string[]; deliverables: string[]; timeline: string; notes: string };
    strategy: { winningAngle: string; approach: string; contentIdeas: string[]; growthDirection: string; nextSteps: string[] };
    created_at: string;
  }
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrderRow | null>(null);

  const loadWorkOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/work-orders");
      const json = await res.json();
      if (Array.isArray(json.orders)) setWorkOrders(json.orders);
    } catch { /* silent */ }
    finally { setOrdersLoading(false); }
  }, []);

  useEffect(() => { loadWorkOrders(); }, [loadWorkOrders]);

  // ── Food orders state ──────────────────────────────────────────────────
  interface FoodOrderRow { id: string; name: string; phone: string; bundle_name: string; quantity: number; notes: string; status: string; created_at: string; }
  const [foodOrders, setFoodOrders] = useState<FoodOrderRow[]>([]);
  const [foodLoading, setFoodLoading] = useState(false);

  const loadFoodOrders = useCallback(async () => {
    setFoodLoading(true);
    try {
      const res = await fetch("/api/food-orders");
      const json = await res.json();
      if (Array.isArray(json.orders)) setFoodOrders(json.orders);
    } catch { /* silent */ }
    finally { setFoodLoading(false); }
  }, []);

  useEffect(() => { loadFoodOrders(); }, [loadFoodOrders]);

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

  // ── Status update handlers ──────────────────────────────────────────────
  const updateWorkOrderStatus = useCallback(async (id: string, status: string) => {
    try {
      await fetch("/api/work-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await loadWorkOrders();
    } catch { /* silent */ }
  }, [loadWorkOrders]);

  const updateFoodOrderStatus = useCallback(async (id: string, status: string) => {
    try {
      await fetch("/api/food-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await loadFoodOrders();
    } catch { /* silent */ }
  }, [loadFoodOrders]);

  // ── Leaderboard + user counts ────────────────────────────────────────────
  const [leaderboardCount, setLeaderboardCount] = useState(0);
  const [registeredUsers, setRegisteredUsers] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { count } = await supabase.from("leaderboard").select("id", { count: "exact", head: true });
        if (typeof count === "number") setLeaderboardCount(count);
      } catch { /* silent */ }
      try {
        const { count } = await supabase.from("leaderboard").select("id", { count: "exact", head: true });
        if (typeof count === "number") setRegisteredUsers(count);
      } catch { /* silent */ }
    })();
  }, []);

  // ── Dynamic stats from live data ──────────────────────────────────────────
  const liveStats = [
    { label: "Registered Users", value: String(registeredUsers), change: "From leaderboard", icon: "👥", accent: "#C9A227" },
    { label: "Work Orders",      value: String(workOrders.length), change: workOrders.filter((o) => o.status === "new" || o.status === "pending").length + " pending", icon: "📋", accent: "#00d4ff" },
    { label: "Clients",          value: String(dbClients.length), change: dbClients.length > 0 ? "Live from Supabase" : "No clients yet", icon: "📂", accent: "#34d399" },
    { label: "Leaderboard",      value: String(leaderboardCount), change: "Active users with XP", icon: "🏆", accent: "#a855f7" },
  ];

  // ── Activity feed from real data ──────────────────────────────────────────
  const realActivity = [
    ...workOrders.slice(0, 3).map((o, i) => ({
      id: 100 + i,
      text: `Work order — **${o.client_name}** (${o.service})`,
      time: timeAgoShort(o.created_at),
      dot: o.status === "complete" ? "#34d399" : o.status === "in_progress" ? "#00d4ff" : "#C9A227",
    })),
    ...foodOrders.slice(0, 2).map((o, i) => ({
      id: 200 + i,
      text: `Food order — **${o.name}** (${o.bundle_name})`,
      time: timeAgoShort(o.created_at),
      dot: "#34d399",
    })),
    ...dbClients.slice(0, 2).map((c, i) => ({
      id: 300 + i,
      text: `Client added — **${c.name}** (${c.service_type})`,
      time: timeAgoShort(c.created_at),
      dot: "#C9A227",
    })),
  ];
  const activityFeed = realActivity.length > 0 ? realActivity : ACTIVITY_FALLBACK;

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
              {activityFeed.map(({ id, text, time, dot }, i) => (
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
      {/* ── Work Orders ──────────────────────────────────────────────── */}
      {tab === "orders" && !selectedOrder && (
        <div style={{
          borderRadius: 12,
          background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
          border: "1px solid rgba(201,162,39,0.10)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227" }}>Work Orders</div>
              <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{workOrders.length} total</div>
            </div>
            {ordersLoading && <div style={{ fontSize: 9, color: "#C9A227" }}>Loading...</div>}
          </div>
          {workOrders.length === 0 && !ordersLoading && (
            <div style={{ padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 16, marginBottom: 6 }}>📋</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>No work orders yet</div>
            </div>
          )}
          {workOrders.map((o) => (
            <div
              key={o.id}
              onClick={() => setSelectedOrder(o)}
              style={{
                padding: "12px 16px", cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
                transition: "background 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{o.client_name || o.business_name}</div>
                <span style={{
                  padding: "2px 8px", borderRadius: 5, fontSize: 8, fontWeight: 600,
                  color: o.status === "new" ? "#34d399" : "#C9A227",
                  background: o.status === "new" ? "rgba(52,211,153,0.12)" : "rgba(201,162,39,0.12)",
                  border: `1px solid ${o.status === "new" ? "rgba(52,211,153,0.25)" : "rgba(201,162,39,0.25)"}`,
                }}>
                  {o.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 9, color: "#C9A227" }}>{o.service}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <div style={{ fontSize: 8, color: "#475569" }}>{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  {["new", "in_progress", "complete"].map((s) => (
                    <button key={s} onClick={() => updateWorkOrderStatus(o.id, s)}
                      style={{
                        padding: "2px 7px", borderRadius: 5, fontSize: 7, fontFamily: "monospace", fontWeight: 600, cursor: "pointer",
                        background: o.status === s ? (s === "complete" ? "rgba(52,211,153,0.18)" : s === "in_progress" ? "rgba(0,212,255,0.12)" : "rgba(201,162,39,0.12)") : "rgba(255,255,255,0.03)",
                        border: `1px solid ${o.status === s ? (s === "complete" ? "rgba(52,211,153,0.35)" : s === "in_progress" ? "rgba(0,212,255,0.25)" : "rgba(201,162,39,0.25)") : "rgba(255,255,255,0.06)"}`,
                        color: o.status === s ? (s === "complete" ? "#34d399" : s === "in_progress" ? "#00d4ff" : "#C9A227") : "#475569",
                      }}>
                      {s === "new" ? "New" : s === "in_progress" ? "Working" : "Done"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Work Order Detail View ─────────────────────────────────────── */}
      {tab === "orders" && selectedOrder && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => setSelectedOrder(null)}
            style={{
              alignSelf: "flex-start", padding: "6px 12px", borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748b", fontSize: 10, fontFamily: "monospace", cursor: "pointer",
            }}
          >
            ← Back to Orders
          </button>

          {/* Client Info */}
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(201,162,39,0.10)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", marginBottom: 10 }}>Client Info</div>
            {[
              { label: "Name", value: selectedOrder.client_name },
              { label: "Email", value: selectedOrder.client_email },
              { label: "Business", value: selectedOrder.business_name },
              { label: "Service", value: selectedOrder.service },
              { label: "Status", value: selectedOrder.status.toUpperCase() },
              { label: "Date", value: new Date(selectedOrder.created_at).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 9, color: "#475569" }}>{label}</span>
                <span style={{ fontSize: 9, color: "#e2e8f0", fontWeight: 500 }}>{value || "—"}</span>
              </div>
            ))}
          </div>

          {/* Intake Answers */}
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(0,212,255,0.10)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#00d4ff", marginBottom: 10 }}>Intake Answers</div>
            {Array.isArray(selectedOrder.answers) && selectedOrder.answers.map((a, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, color: "#475569", marginBottom: 2 }}>{a.question}</div>
                <div style={{ fontSize: 10, color: "#e2e8f0", lineHeight: 1.5 }}>{a.answer || "(no answer)"}</div>
              </div>
            ))}
          </div>

          {/* Work Order */}
          {selectedOrder.work_order && (
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(201,162,39,0.10)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", marginBottom: 10 }}>Work Order</div>
              <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.6, marginBottom: 10 }}>{selectedOrder.work_order.summary}</div>
              {Array.isArray(selectedOrder.work_order.objectives) && selectedOrder.work_order.objectives.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 8, color: "#475569", marginBottom: 4 }}>OBJECTIVES</div>
                  {selectedOrder.work_order.objectives.map((o, i) => (
                    <div key={i} style={{ fontSize: 9, color: "#e2e8f0", padding: "2px 0" }}>{i + 1}. {o}</div>
                  ))}
                </div>
              )}
              {Array.isArray(selectedOrder.work_order.deliverables) && selectedOrder.work_order.deliverables.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 8, color: "#475569", marginBottom: 4 }}>DELIVERABLES</div>
                  {selectedOrder.work_order.deliverables.map((d, i) => (
                    <div key={i} style={{ fontSize: 9, color: "#e2e8f0", padding: "2px 0" }}>• {d}</div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 9, color: "#64748b" }}>Timeline: {selectedOrder.work_order.timeline || "TBD"}</div>
            </div>
          )}

          {/* AI Strategy */}
          {selectedOrder.strategy && (
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(168,85,247,0.10)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", marginBottom: 10 }}>AI Strategy</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, color: "#475569", marginBottom: 2 }}>WINNING ANGLE</div>
                <div style={{ fontSize: 10, color: "#e2e8f0", lineHeight: 1.5 }}>{selectedOrder.strategy.winningAngle}</div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, color: "#475569", marginBottom: 2 }}>APPROACH</div>
                <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>{selectedOrder.strategy.approach}</div>
              </div>
              {Array.isArray(selectedOrder.strategy.contentIdeas) && selectedOrder.strategy.contentIdeas.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 8, color: "#475569", marginBottom: 4 }}>CONTENT IDEAS</div>
                  {selectedOrder.strategy.contentIdeas.map((c, i) => (
                    <div key={i} style={{ fontSize: 9, color: "#e2e8f0", padding: "2px 0" }}>{i + 1}. {c}</div>
                  ))}
                </div>
              )}
              {Array.isArray(selectedOrder.strategy.nextSteps) && selectedOrder.strategy.nextSteps.length > 0 && (
                <div>
                  <div style={{ fontSize: 8, color: "#475569", marginBottom: 4 }}>NEXT STEPS</div>
                  {selectedOrder.strategy.nextSteps.map((s, i) => (
                    <div key={i} style={{ fontSize: 9, color: "#34d399", padding: "2px 0" }}>{i + 1}. {s}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Food Orders ──────────────────────────────────────────────── */}
      {tab === "food" && (
        <div style={{
          borderRadius: 12,
          background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
          border: "1px solid rgba(52,211,153,0.10)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#34d399" }}>Food Orders</div>
              <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{foodOrders.length} total</div>
            </div>
            {foodLoading && <div style={{ fontSize: 9, color: "#34d399" }}>Loading...</div>}
          </div>
          {foodOrders.length === 0 && !foodLoading && (
            <div style={{ padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 16, marginBottom: 6 }}>🥬</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>No food orders yet</div>
            </div>
          )}
          {foodOrders.map((o, i) => (
            <div key={o.id} style={{
              padding: "12px 16px",
              borderBottom: i < foodOrders.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{o.name}</div>
                <span style={{
                  padding: "2px 8px", borderRadius: 5, fontSize: 8, fontWeight: 600,
                  color: o.status === "new" ? "#34d399" : o.status === "confirmed" ? "#C9A227" : "#a855f7",
                  background: o.status === "new" ? "rgba(52,211,153,0.12)" : o.status === "confirmed" ? "rgba(201,162,39,0.12)" : "rgba(168,85,247,0.12)",
                  border: `1px solid ${o.status === "new" ? "rgba(52,211,153,0.25)" : o.status === "confirmed" ? "rgba(201,162,39,0.25)" : "rgba(168,85,247,0.25)"}`,
                }}>{o.status.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 10, color: "#34d399", fontWeight: 600, marginBottom: 2 }}>{o.bundle_name} x{o.quantity}</div>
              <div style={{ fontSize: 9, color: "#64748b" }}>📞 {o.phone}</div>
              {o.notes && <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>Notes: {o.notes}</div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 5 }}>
                <div style={{ fontSize: 8, color: "#334155" }}>{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["new", "confirmed", "delivered"].map((s) => (
                    <button key={s} onClick={() => updateFoodOrderStatus(o.id, s)}
                      style={{
                        padding: "2px 7px", borderRadius: 5, fontSize: 7, fontFamily: "monospace", fontWeight: 600, cursor: "pointer",
                        background: o.status === s ? (s === "delivered" ? "rgba(168,85,247,0.15)" : s === "confirmed" ? "rgba(201,162,39,0.12)" : "rgba(52,211,153,0.12)") : "rgba(255,255,255,0.03)",
                        border: `1px solid ${o.status === s ? (s === "delivered" ? "rgba(168,85,247,0.30)" : s === "confirmed" ? "rgba(201,162,39,0.25)" : "rgba(52,211,153,0.25)") : "rgba(255,255,255,0.06)"}`,
                        color: o.status === s ? (s === "delivered" ? "#a855f7" : s === "confirmed" ? "#C9A227" : "#34d399") : "#475569",
                      }}>
                      {s === "new" ? "New" : s === "confirmed" ? "Confirmed" : "Delivered"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "content" && (() => {
        // Content tab → System Health (replaces mock content queue)
        return (
        <div style={{
          borderRadius: 12,
          background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
          border: "1px solid rgba(201,162,39,0.10)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227" }}>System Health</div>
            <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>Live service diagnostics</div>
          </div>
          <SystemHealthInline />
        </div>
        );
      })()}

      {/* ── Analytics ──────────────────────────────────────────────────── */}
      {tab === "analytics" && (() => {
        // Compute real metrics from loaded data
        const serviceCount: Record<string, number> = {};
        workOrders.forEach((o) => { serviceCount[o.service] = (serviceCount[o.service] ?? 0) + 1; });
        const serviceEntries = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]);
        const maxCount = Math.max(1, ...serviceEntries.map(([, c]) => c));

        const completedOrders = workOrders.filter((o) => o.status === "complete").length;
        const pendingOrders   = workOrders.filter((o) => o.status === "new" || o.status === "pending").length;
        const inProgressOrders = workOrders.filter((o) => o.status === "in_progress").length;
        const completionRate  = workOrders.length > 0 ? Math.round((completedOrders / workOrders.length) * 100) : 0;

        const foodNew       = foodOrders.filter((o) => o.status === "new").length;
        const foodConfirmed = foodOrders.filter((o) => o.status === "confirmed").length;
        const foodDelivered = foodOrders.filter((o) => o.status === "delivered").length;

        return (
        <>
          {/* Orders by Service (live) */}
          <div style={{ padding: "16px", borderRadius: 12, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(201,162,39,0.10)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", marginBottom: 14 }}>Orders by Service</div>
            {serviceEntries.length === 0 && (
              <div style={{ fontSize: 10, color: "#64748b" }}>No work orders yet</div>
            )}
            {serviceEntries.map(([service, count]) => (
              <div key={service} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>{service}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#f1f5f9" }}>{count}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "rgba(201,162,39,0.08)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((count / maxCount) * 100)}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #C9A227, #a07818)" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Live Metrics */}
          <div style={{ padding: "16px", borderRadius: 12, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(201,162,39,0.10)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", marginBottom: 12 }}>Live Metrics</div>
            {[
              { label: "Registered Users",      value: String(registeredUsers),       trend: "From leaderboard" },
              { label: "Leaderboard Entries",    value: String(leaderboardCount),      trend: "Users with XP" },
              { label: "Total Work Orders",      value: String(workOrders.length),     trend: `${pendingOrders} pending · ${inProgressOrders} active` },
              { label: "Completion Rate",        value: `${completionRate}%`,          trend: `${completedOrders} of ${workOrders.length} complete` },
              { label: "Total Clients",          value: String(dbClients.length),      trend: "Live from Supabase" },
              { label: "Food Orders",            value: String(foodOrders.length),     trend: `${foodNew} new · ${foodConfirmed} confirmed · ${foodDelivered} delivered` },
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
        );
      })()}

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

// ── Inline System Health for Content tab ────────────────────────────────────
function SystemHealthInline() {
  const [health, setHealth] = useState<Record<string, { healthy?: boolean; configured?: boolean; label?: string; error?: string; latencyMs?: number }> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/health");
        const json = await res.json();
        setHealth(json.services ?? null);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ padding: "16px", fontSize: 10, color: "#C9A227" }}>Checking services...</div>;
  if (!health) return <div style={{ padding: "16px", fontSize: 10, color: "#f87171" }}>Could not reach health endpoint</div>;

  const services = Object.entries(health);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {services.map(([key, svc], i) => {
        const ok = svc.healthy !== false;
        const color = ok ? "#34d399" : "#f87171";
        return (
          <div key={key} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 16px",
            borderBottom: i < services.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9" }}>{svc.label || key}</div>
              {svc.error && <div style={{ fontSize: 8, color: "#f87171", marginTop: 1 }}>{svc.error}</div>}
              {svc.latencyMs !== undefined && <div style={{ fontSize: 8, color: "#475569", marginTop: 1 }}>{svc.latencyMs}ms</div>}
            </div>
            <span style={{
              padding: "2px 8px", borderRadius: 5, fontSize: 8, fontWeight: 600,
              color, background: `${color}15`, border: `1px solid ${color}30`,
            }}>
              {ok ? "Healthy" : "Down"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
