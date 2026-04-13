"use client";

import { useState } from "react";

/* ── Static mock data ─────────────────────────────────────────────────────── */

const STATS = [
  { label: "Total Clients",    value: "48",        change: "+6 this month",   icon: "👥", accent: "#C9A227" },
  { label: "Active Projects",  value: "17",        change: "3 pending review", icon: "📂", accent: "#00d4ff" },
  { label: "Revenue (MTD)",    value: "$28,400",   change: "+12% vs last mo",  icon: "💰", accent: "#34d399" },
  { label: "Completion Rate",  value: "94%",       change: "Above target",     icon: "✅", accent: "#a855f7" },
];

const ACTIVITY = [
  { id: 1, text: "New client onboarded — **Luxe Beauty Bar**",         time: "12 min ago",  dot: "#34d399" },
  { id: 2, text: "Work order delivered — **TrueGrit Fitness** (Logo)", time: "1 hr ago",    dot: "#C9A227" },
  { id: 3, text: "Ad campaign launched — **SolShine Candles**",        time: "3 hrs ago",   dot: "#00d4ff" },
  { id: 4, text: "Invoice paid — **UrbanRoots Co.** ($600)",          time: "5 hrs ago",   dot: "#34d399" },
  { id: 5, text: "Content batch uploaded — **NovaTech Solutions**",    time: "Yesterday",   dot: "#a855f7" },
  { id: 6, text: "Strategy call completed — **Pinnacle Realty**",      time: "Yesterday",   dot: "#C9A227" },
  { id: 7, text: "New inquiry received — **FreshPlate Meals**",        time: "2 days ago",  dot: "#00d4ff" },
];

const CLIENTS = [
  { name: "Luxe Beauty Bar",     service: "Startup Launch Package", status: "Active",    revenue: "$600"  },
  { name: "TrueGrit Fitness",    service: "Logo Generator",         status: "Delivered",  revenue: "$250"  },
  { name: "SolShine Candles",    service: "Targeted Ads",           status: "Active",    revenue: "$800"  },
  { name: "UrbanRoots Co.",      service: "Social Media",           status: "Active",    revenue: "$600"  },
  { name: "NovaTech Solutions",  service: "AI Content",             status: "Active",    revenue: "$1,200" },
  { name: "Pinnacle Realty",     service: "Consulting",             status: "Completed", revenue: "$400"  },
  { name: "FreshPlate Meals",    service: "Startup Launch Package", status: "Pending",   revenue: "$600"  },
];

const CONTENT_QUEUE = [
  { client: "Luxe Beauty Bar",    type: "Video Post",  platform: "Instagram", due: "Today",     status: "In Progress" },
  { client: "Luxe Beauty Bar",    type: "Image Post",  platform: "Facebook",  due: "Today",     status: "Ready" },
  { client: "UrbanRoots Co.",     type: "Story",       platform: "Instagram", due: "Today",     status: "Scheduled" },
  { client: "SolShine Candles",   type: "Video Post",  platform: "Instagram", due: "Tomorrow",  status: "In Progress" },
  { client: "NovaTech Solutions", type: "Image Post",  platform: "LinkedIn",  due: "Tomorrow",  status: "Draft" },
  { client: "UrbanRoots Co.",     type: "Video Post",  platform: "TikTok",   due: "Apr 15",    status: "Draft" },
];

type NavItem = "dashboard" | "clients" | "content" | "analytics" | "settings";

const NAV_ITEMS: { key: NavItem; label: string; icon: string }[] = [
  { key: "dashboard",  label: "Dashboard",  icon: "📊" },
  { key: "clients",    label: "Clients",    icon: "👥" },
  { key: "content",    label: "Content",    icon: "📝" },
  { key: "analytics",  label: "Analytics",  icon: "📈" },
  { key: "settings",   label: "Settings",   icon: "⚙️" },
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} style={{ color: "#f1f5f9", fontWeight: 700 }}>{part}</span>
      : <span key={i}>{part}</span>
  );
}

const statusColor: Record<string, string> = {
  Active:      "#34d399",
  Delivered:   "#C9A227",
  Completed:   "#a855f7",
  Pending:     "#64748b",
  "In Progress": "#00d4ff",
  Ready:       "#34d399",
  Scheduled:   "#C9A227",
  Draft:       "#64748b",
};

/* ── Component ────────────────────────────────────────────────────────────── */

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#08080f",
      color: "#e2e8f0",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      overflow: "auto",
    }}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarOpen ? 240 : 68,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0c0c16 0%, #08080f 100%)",
        borderRight: "1px solid rgba(201,162,39,0.12)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0,
        position: "sticky",
        top: 0,
      }}>

        {/* Brand */}
        <div style={{
          padding: sidebarOpen ? "24px 20px 20px" : "24px 12px 20px",
          borderBottom: "1px solid rgba(201,162,39,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #C9A227, #a07818)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
            boxShadow: "0 0 20px rgba(201,162,39,0.25)",
          }}>
            S
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#C9A227", letterSpacing: "0.03em" }}>
                Springer
              </div>
              <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Admin Panel
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "16px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map(({ key, label, icon }) => {
            const active = activeNav === key;
            return (
              <button
                key={key}
                onClick={() => setActiveNav(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: sidebarOpen ? "10px 14px" : "10px 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#C9A227" : "#94a3b8",
                  background: active
                    ? "rgba(201,162,39,0.10)"
                    : "transparent",
                  transition: "all 0.18s ease",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <span style={{ fontSize: 17, flexShrink: 0 }}>{icon}</span>
                {sidebarOpen && label}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(201,162,39,0.08)" }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: "100%", padding: "8px 0",
              borderRadius: 8, border: "1px solid rgba(201,162,39,0.12)",
              background: "rgba(201,162,39,0.04)",
              color: "#64748b", fontSize: 11, cursor: "pointer",
              transition: "all 0.18s ease",
            }}
          >
            {sidebarOpen ? "← Collapse" : "→"}
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <header style={{
          padding: "16px 32px",
          borderBottom: "1px solid rgba(201,162,39,0.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(12,12,22,0.6)",
          backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div>
            <h1 style={{
              fontSize: 20, fontWeight: 700, margin: 0, color: "#f1f5f9",
              letterSpacing: "0.01em",
            }}>
              {NAV_ITEMS.find(n => n.key === activeNav)?.icon}{" "}
              {NAV_ITEMS.find(n => n.key === activeNav)?.label}
            </h1>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
              Springer Industries Internal
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              padding: "6px 14px", borderRadius: 8,
              background: "rgba(52,211,153,0.10)",
              border: "1px solid rgba(52,211,153,0.20)",
              fontSize: 11, color: "#34d399", fontWeight: 600,
            }}>
              System Online
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "linear-gradient(135deg, #C9A227, #a07818)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "#08080f",
              boxShadow: "0 0 14px rgba(201,162,39,0.20)",
            }}>
              CS
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding: "28px 32px 40px", flex: 1, overflowY: "auto" }}>

          {/* ── Dashboard view ─────────────────────────────────────────────── */}
          {activeNav === "dashboard" && (
            <>
              {/* Stat cards */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16, marginBottom: 32,
              }}>
                {STATS.map(({ label, value, change, icon, accent }) => (
                  <div key={label} style={{
                    padding: "20px 22px",
                    borderRadius: 14,
                    background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
                    border: `1px solid ${accent}22`,
                    position: "relative", overflow: "hidden",
                  }}>
                    {/* Accent glow */}
                    <div style={{
                      position: "absolute", top: -20, right: -20,
                      width: 80, height: 80, borderRadius: "50%",
                      background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`,
                      pointerEvents: "none",
                    }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, letterSpacing: "0.04em" }}>
                        {label}
                      </span>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: 6 }}>
                      {value}
                    </div>
                    <div style={{ fontSize: 11, color: accent, fontWeight: 500 }}>
                      {change}
                    </div>
                  </div>
                ))}
              </div>

              {/* Two-column layout: Activity + Quick Actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* Recent Activity */}
                <div style={{
                  padding: "22px 24px",
                  borderRadius: 14,
                  background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
                  border: "1px solid rgba(201,162,39,0.10)",
                }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C9A227", margin: "0 0 18px", letterSpacing: "0.02em" }}>
                    Recent Activity
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {ACTIVITY.map(({ id, text, time, dot }, i) => (
                      <div key={id} style={{
                        display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "12px 0",
                        borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: dot, flexShrink: 0, marginTop: 5,
                          boxShadow: `0 0 8px ${dot}55`,
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.5 }}>
                            {renderBold(text)}
                          </div>
                          <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>
                            {time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{
                  padding: "22px 24px",
                  borderRadius: 14,
                  background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
                  border: "1px solid rgba(201,162,39,0.10)",
                }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C9A227", margin: "0 0 18px", letterSpacing: "0.02em" }}>
                    Quick Actions
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { icon: "➕", label: "Add New Client",       desc: "Start a new client onboarding" },
                      { icon: "📤", label: "Send Work Order",      desc: "Generate and deliver a work order" },
                      { icon: "📅", label: "Schedule Content",     desc: "Queue posts for the week" },
                      { icon: "📊", label: "View Reports",         desc: "Monthly performance summaries" },
                      { icon: "💬", label: "Client Messages",      desc: "Review incoming requests" },
                    ].map(({ icon, label, desc }) => (
                      <button key={label} style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 16px", borderRadius: 10,
                        background: "rgba(201,162,39,0.04)",
                        border: "1px solid rgba(201,162,39,0.08)",
                        cursor: "pointer", textAlign: "left",
                        transition: "all 0.18s ease",
                        color: "#e2e8f0",
                      }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</div>
                          <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>{desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Clients view ───────────────────────────────────────────────── */}
          {activeNav === "clients" && (
            <div style={{
              borderRadius: 14,
              background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
              border: "1px solid rgba(201,162,39,0.10)",
              overflow: "hidden",
            }}>
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C9A227", margin: 0 }}>
                  Client Roster
                </h2>
                <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0" }}>
                  {CLIENTS.length} total clients
                </p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Client", "Service", "Status", "Revenue"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "12px 24px",
                        fontSize: 10, fontWeight: 600,
                        color: "#475569", letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CLIENTS.map(({ name, service, status, revenue }, i) => (
                    <tr key={name} style={{
                      borderBottom: i < CLIENTS.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                      transition: "background 0.15s",
                      cursor: "pointer",
                    }}>
                      <td style={{ padding: "14px 24px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{name}</div>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 12, color: "#94a3b8" }}>
                        {service}
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        <span style={{
                          display: "inline-block", padding: "3px 10px",
                          borderRadius: 6, fontSize: 10, fontWeight: 600,
                          color: statusColor[status] || "#64748b",
                          background: `${statusColor[status] || "#64748b"}15`,
                          border: `1px solid ${statusColor[status] || "#64748b"}30`,
                        }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, fontWeight: 600, color: "#34d399" }}>
                        {revenue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Content view ───────────────────────────────────────────────── */}
          {activeNav === "content" && (
            <div style={{
              borderRadius: 14,
              background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
              border: "1px solid rgba(201,162,39,0.10)",
              overflow: "hidden",
            }}>
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C9A227", margin: 0 }}>
                  Content Queue
                </h2>
                <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0" }}>
                  Upcoming posts and deliverables
                </p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Client", "Type", "Platform", "Due", "Status"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "12px 24px",
                        fontSize: 10, fontWeight: 600,
                        color: "#475569", letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONTENT_QUEUE.map(({ client, type, platform, due, status }, i) => (
                    <tr key={`${client}-${type}-${i}`} style={{
                      borderBottom: i < CONTENT_QUEUE.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                      cursor: "pointer",
                    }}>
                      <td style={{ padding: "14px 24px", fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>
                        {client}
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 12, color: "#94a3b8" }}>{type}</td>
                      <td style={{ padding: "14px 24px", fontSize: 12, color: "#94a3b8" }}>{platform}</td>
                      <td style={{ padding: "14px 24px", fontSize: 12, color: due === "Today" ? "#C9A227" : "#64748b", fontWeight: due === "Today" ? 600 : 400 }}>
                        {due}
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        <span style={{
                          display: "inline-block", padding: "3px 10px",
                          borderRadius: 6, fontSize: 10, fontWeight: 600,
                          color: statusColor[status] || "#64748b",
                          background: `${statusColor[status] || "#64748b"}15`,
                          border: `1px solid ${statusColor[status] || "#64748b"}30`,
                        }}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Analytics view ─────────────────────────────────────────────── */}
          {activeNav === "analytics" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Revenue breakdown */}
              <div style={{
                padding: "22px 24px",
                borderRadius: 14,
                background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
                border: "1px solid rgba(201,162,39,0.10)",
              }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C9A227", margin: "0 0 18px" }}>
                  Revenue by Service
                </h2>
                {[
                  { service: "Startup Launch Package", amount: "$7,200",  pct: 25 },
                  { service: "Social Media",           amount: "$6,000",  pct: 21 },
                  { service: "AI Content",             amount: "$4,800",  pct: 17 },
                  { service: "Targeted Ads",           amount: "$4,000",  pct: 14 },
                  { service: "Consulting",             amount: "$3,200",  pct: 11 },
                  { service: "Other",                  amount: "$3,200",  pct: 12 },
                ].map(({ service, amount, pct }) => (
                  <div key={service} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{service}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{amount}</span>
                    </div>
                    <div style={{
                      height: 6, borderRadius: 3,
                      background: "rgba(201,162,39,0.08)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${pct}%`, height: "100%", borderRadius: 3,
                        background: "linear-gradient(90deg, #C9A227, #a07818)",
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Client metrics */}
              <div style={{
                padding: "22px 24px",
                borderRadius: 14,
                background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
                border: "1px solid rgba(201,162,39,0.10)",
              }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C9A227", margin: "0 0 18px" }}>
                  Monthly Metrics
                </h2>
                {[
                  { label: "New Clients",         value: "6",      trend: "+50% vs Mar" },
                  { label: "Churn Rate",           value: "2.1%",   trend: "Below target" },
                  { label: "Avg. Project Value",   value: "$593",   trend: "+8% vs Mar" },
                  { label: "Client Satisfaction",   value: "4.8/5",  trend: "98% positive" },
                  { label: "Content Pieces Shipped", value: "142",    trend: "+18 vs Mar" },
                  { label: "Ad Spend Managed",     value: "$12,400", trend: "+22% vs Mar" },
                ].map(({ label, value, trend }, i) => (
                  <div key={label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 0",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{value}</div>
                      <div style={{ fontSize: 10, color: "#34d399", marginTop: 1 }}>{trend}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Settings view ──────────────────────────────────────────────── */}
          {activeNav === "settings" && (
            <div style={{ maxWidth: 640 }}>
              <div style={{
                padding: "22px 24px",
                borderRadius: 14,
                background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
                border: "1px solid rgba(201,162,39,0.10)",
                marginBottom: 20,
              }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C9A227", margin: "0 0 18px" }}>
                  Account
                </h2>
                {[
                  { label: "Name",         value: "Chaz Springer" },
                  { label: "Email",        value: "springerindustry@gmail.com" },
                  { label: "Role",         value: "Admin / Founder" },
                  { label: "Organization", value: "Springer Industries" },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
                    <span style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{
                padding: "22px 24px",
                borderRadius: 14,
                background: "linear-gradient(160deg, #10101a 0%, #0c0c16 100%)",
                border: "1px solid rgba(201,162,39,0.10)",
              }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C9A227", margin: "0 0 18px" }}>
                  Preferences
                </h2>
                {[
                  { label: "Email Notifications",   status: "Enabled" },
                  { label: "Auto Work Order Emails", status: "Enabled" },
                  { label: "Dark Mode",              status: "Always" },
                  { label: "Two-Factor Auth",        status: "Not set up" },
                ].map(({ label, status }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: status === "Not set up" ? "#f59e0b" : "#34d399",
                    }}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
