"use client";

import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Police Accountability Dashboard — verified public data from the Washington
// Post Fatal Police Shootings Database. Aggregated stats only — no individual
// officer identification, no unverified claims.
// ─────────────────────────────────────────────────────────────────────────────

interface StateDetail {
  total: number;
  thisYear: number;
  bodyCameraRate: number;
  byCity: { city: string; count: number }[];
  byRace: Record<string, number>;
  byYear: Record<string, number>;
  unarmedCount: number;
  recentIncidents: { date: string; city: string; race: string; armed: string; bodyCamera: boolean }[];
}

interface NationalData {
  totalIncidents: number;
  thisYear: number;
  bodyCameraRate: number;
  byRace: Record<string, number>;
  byYear: Record<string, number>;
  lastUpdated: string;
  source: string;
}

const RACE_LABELS: Record<string, string> = {
  White: "White", Black: "Black", Hispanic: "Hispanic", Asian: "Asian",
  "Native American": "Native American", Multiracial: "Multiracial",
  Other: "Other", Unknown: "Unknown",
  // Legacy codes (in case API returns raw)
  W: "White", B: "Black", H: "Hispanic", A: "Asian", N: "Native American", O: "Other",
};

const COMPLAINT_STEPS = [
  { title: "Document everything", body: "Write down the date, time, location, badge numbers, patrol car numbers, and the names of any witnesses. Do this as soon as possible while details are fresh." },
  { title: "File with Internal Affairs", body: "Contact the police department's Internal Affairs division. You can usually file in person, by phone, or online. Request a copy of your complaint with a case number." },
  { title: "File with the Civilian Oversight Board", body: "If your city has a civilian oversight or review board, file a separate complaint there. They investigate independently from the department." },
  { title: "File a federal complaint", body: "You can file a civil rights complaint with the U.S. Department of Justice Civil Rights Division at civilrights.justice.gov or call (202) 514-4609." },
  { title: "Contact your local ACLU or NAACP", body: "They can help you understand your rights, connect you with legal counsel, and advocate on your behalf." },
];

const TRANSPARENCY_RESOURCES = [
  { label: "Washington Post Police Shootings Database", url: "https://www.washingtonpost.com/graphics/investigations/police-shootings-database/", desc: "Tracks every fatal police shooting since 2015" },
  { label: "Mapping Police Violence", url: "https://mappingpoliceviolence.us/", desc: "Comprehensive database of police killings" },
  { label: "Police Scorecard", url: "https://policescorecard.org/", desc: "Department-level accountability scores" },
  { label: "Campaign Zero", url: "https://campaignzero.org/", desc: "Data-driven policy solutions to end police violence" },
  { label: "ACLU — Know Your Rights", url: "https://www.aclu.org/know-your-rights/stopped-by-police", desc: "What to do during police encounters" },
  { label: "DOJ Civil Rights Division", url: "https://civilrights.justice.gov/", desc: "File federal civil rights complaints" },
];

interface Props {
  onClose: () => void;
  userState?: string;
}

export default function PoliceAccountabilityPanel({ onClose, userState }: Props) {
  const [national, setNational] = useState<NationalData | null>(null);
  const [stateDetail, setStateDetail] = useState<StateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"overview" | "local" | "action">("overview");

  useEffect(() => {
    (async () => {
      try {
        const param = userState ? `?state=${userState}` : "";
        const res = await fetch(`/api/news/policing-data${param}`);
        if (res.ok) {
          const json = await res.json();
          setNational(json.national ?? null);
          setStateDetail(json.stateDetail ?? null);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [userState]);

  const TABS = [
    { key: "overview" as const, label: "National", icon: "📊" },
    { key: "local" as const, label: userState || "State", icon: "📍" },
    { key: "action" as const, label: "Take Action", icon: "✊" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 75,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: "rgba(4,4,12,0.98)",
      backdropFilter: "blur(20px)",
      fontFamily: "monospace",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(245,158,11,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#f59e0b", marginBottom: 3 }}>Verified Public Data</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>⚖️ Police Accountability</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "8px 16px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {TABS.map(({ key, label, icon }) => {
          const active = activeSection === key;
          return (
            <button key={key} onClick={() => setActiveSection(key)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 9, fontFamily: "monospace", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              background: active ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.03)",
              border: active ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(255,255,255,0.06)",
              color: active ? "#f59e0b" : "#64748b", fontWeight: active ? 700 : 400,
            }}>
              <span style={{ fontSize: 12 }}>{icon}</span> {label}
            </button>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>

        {loading && <div style={{ textAlign: "center", padding: "40px 0", fontSize: 11, color: "#f59e0b" }}>Loading verified data…</div>}

        {/* ── National Overview ─────────────────────────────────────────── */}
        {!loading && activeSection === "overview" && national && (
          <>
            {/* Context explainer */}
            <div style={{
              padding: "14px 16px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))",
              border: "1px solid rgba(245,158,11,0.15)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>
                What is this data?
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
                This dashboard tracks <span style={{ color: "#fbbf24", fontWeight: 600 }}>every fatal police shooting</span> in the United States since January 2015, compiled by the Washington Post from news reports, public records, and law enforcement data. It is one of the most comprehensive and cited police accountability databases in the country.
              </div>
            </div>

            {/* Big stats with explanations */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fbbf24", marginBottom: 2 }}>{national.totalIncidents.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "#f1f5f9", fontWeight: 600, marginBottom: 4 }}>People killed by police since 2015</div>
                <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.55 }}>
                  This is the total number of fatal shootings by on-duty police officers across all 50 states. The actual number may be higher — not all incidents are reported.
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ padding: "14px 12px", borderRadius: 12, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>{String(national.thisYear) === "0" ? "—" : national.thisYear}</div>
                  <div style={{ fontSize: 9, color: "#f1f5f9", fontWeight: 600, marginBottom: 3 }}>This year so far</div>
                  <div style={{ fontSize: 8, color: "#64748b", lineHeight: 1.5 }}>
                    {String(national.thisYear) === "0" ? "Data for this year hasn't been published yet." : "Fatal police shootings reported this calendar year."}
                  </div>
                </div>
                <div style={{ padding: "14px 12px", borderRadius: 12, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>{national.bodyCameraRate}%</div>
                  <div style={{ fontSize: 9, color: "#f1f5f9", fontWeight: 600, marginBottom: 3 }}>Had body cameras on</div>
                  <div style={{ fontSize: 8, color: "#64748b", lineHeight: 1.5 }}>
                    Percentage of fatal shootings where the officer was wearing an active body camera. Higher is better for transparency.
                  </div>
                </div>
              </div>
            </div>

            {/* Race breakdown with context */}
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.10)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>Who is affected?</div>
              <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.55, marginBottom: 12 }}>
                Racial breakdown of people killed in fatal police shootings. Black Americans are killed at 2–3x the rate of white Americans relative to population size — this is one of the most studied disparities in criminal justice.
              </div>
              {Object.entries(national.byRace)
                .sort((a, b) => b[1] - a[1])
                .map(([race, count]) => {
                  const pct = Math.round((count / national.totalIncidents) * 100);
                  return (
                    <div key={race} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>{RACE_LABELS[race] ?? race}</span>
                        <span style={{ fontSize: 10, color: "#f1f5f9", fontWeight: 600 }}>{count.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: "rgba(245,158,11,0.08)" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: "#f59e0b" }} />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Year trend with context */}
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.10)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>Is it getting better or worse?</div>
              <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.55, marginBottom: 12 }}>
                Year-over-year count of fatal police shootings. A rising trend means more people are being killed each year. Reform advocates use this data to push for de-escalation training, accountability measures, and policy changes.
              </div>
              {Object.entries(national.byYear)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .slice(-6)
                .map(([year, count]) => {
                  const maxY = Math.max(...Object.values(national.byYear));
                  const pct = Math.round((count / maxY) * 100);
                  return (
                    <div key={year} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 9, color: "#64748b", width: 32, textAlign: "right" }}>{year}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(245,158,11,0.08)" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #f59e0b, #d97706)" }} />
                      </div>
                      <span style={{ fontSize: 9, color: "#f1f5f9", fontWeight: 600, width: 32 }}>{count}</span>
                    </div>
                  );
                })}
            </div>

            <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.5, padding: "4px 0" }}>
              Source: {national.source} · Last updated: {national.lastUpdated} · Data covers fatal police shootings only. Aggregated statistics — no individual identification.
            </div>
          </>
        )}

        {/* ── State/Local Detail ─────────────────────────────────────── */}
        {!loading && activeSection === "local" && (
          <>
            {!stateDetail ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  {userState ? `No data available for ${userState}` : "Enable location in NAVI Pulse to see local data"}
                </div>
              </div>
            ) : (
              <>
                {/* State context */}
                <div style={{
                  padding: "14px 16px", borderRadius: 14,
                  background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))",
                  border: "1px solid rgba(245,158,11,0.15)",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>
                    Your state: {userState}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
                    This is the policing data for your state. It shows how many people have been killed by police, which cities have the most incidents, and whether officers were wearing body cameras. Use this to understand patterns in your community.
                  </div>
                </div>

                {/* State stats with explanations */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ padding: "14px 12px", borderRadius: 12, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>{stateDetail.total}</div>
                      <div style={{ fontSize: 9, color: "#f1f5f9", fontWeight: 600, marginBottom: 3 }}>Total in {userState}</div>
                      <div style={{ fontSize: 8, color: "#64748b", lineHeight: 1.5 }}>Fatal police shootings recorded in your state since 2015.</div>
                    </div>
                    <div style={{ padding: "14px 12px", borderRadius: 12, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: stateDetail.unarmedCount > 0 ? "#ef4444" : "#fbbf24" }}>{stateDetail.unarmedCount}</div>
                      <div style={{ fontSize: 9, color: "#f1f5f9", fontWeight: 600, marginBottom: 3 }}>Were unarmed</div>
                      <div style={{ fontSize: 8, color: "#64748b", lineHeight: 1.5 }}>People who were not carrying a weapon when killed by police.</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ padding: "14px 12px", borderRadius: 12, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>{stateDetail.thisYear === 0 ? "—" : stateDetail.thisYear}</div>
                      <div style={{ fontSize: 9, color: "#f1f5f9", fontWeight: 600, marginBottom: 3 }}>This year</div>
                      <div style={{ fontSize: 8, color: "#64748b", lineHeight: 1.5 }}>{stateDetail.thisYear === 0 ? "No data published yet for this year." : "Incidents reported this calendar year."}</div>
                    </div>
                    <div style={{ padding: "14px 12px", borderRadius: 12, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>{stateDetail.bodyCameraRate}%</div>
                      <div style={{ fontSize: 9, color: "#f1f5f9", fontWeight: 600, marginBottom: 3 }}>Body cam rate</div>
                      <div style={{ fontSize: 8, color: "#64748b", lineHeight: 1.5 }}>Officers wearing active body cameras during fatal incidents.</div>
                    </div>
                  </div>
                </div>

                {/* Top cities */}
                <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.10)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>Which cities have the most incidents?</div>
                  <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.55, marginBottom: 10 }}>
                    Top 10 cities in {userState} ranked by total fatal police shootings. Higher numbers may indicate larger population, higher crime rates, or policing concerns that warrant community attention.
                  </div>
                  {stateDetail.byCity.map(({ city, count }) => {
                    const pct = Math.round((count / stateDetail.total) * 100);
                    return (
                      <div key={city} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 9, color: "#94a3b8", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{city}</span>
                        <div style={{ width: 80, height: 5, borderRadius: 3, background: "rgba(245,158,11,0.08)", flexShrink: 0 }}>
                          <div style={{ width: `${Math.min(100, pct * 3)}%`, height: "100%", borderRadius: 3, background: "#f59e0b" }} />
                        </div>
                        <span style={{ fontSize: 9, color: "#f1f5f9", fontWeight: 600, width: 24, textAlign: "right", flexShrink: 0 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* State demographics */}
                <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.10)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>Who is affected in {userState}?</div>
                  <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.55, marginBottom: 10 }}>
                    Racial breakdown of people killed by police in your state. Compare these percentages to your state{"'"}s population demographics to identify disproportionate impact.
                  </div>
                  {Object.entries(stateDetail.byRace).sort((a, b) => b[1] - a[1]).map(([race, count]) => {
                    const pct = Math.round((count / stateDetail.total) * 100);
                    return (
                      <div key={race} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>{RACE_LABELS[race] ?? race}</span>
                        <span style={{ fontSize: 10, color: "#f1f5f9", fontWeight: 600 }}>{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>

                {/* Recent incidents */}
                {stateDetail.recentIncidents.length > 0 && (
                  <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.10)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>Recent incidents in {userState}</div>
                    <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.55, marginBottom: 10 }}>
                      The most recent fatal police shootings reported in your state this year. Showing date, city, and whether the officer had an active body camera. No individual names are displayed.
                    </div>
                    {stateDetail.recentIncidents.map((inc, i) => (
                      <div key={`${inc.date}-${i}`} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
                        borderBottom: i < stateDetail.recentIncidents.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                      }}>
                        <span style={{ fontSize: 8, color: "#64748b", width: 60, flexShrink: 0 }}>{inc.date}</span>
                        <span style={{ fontSize: 9, color: "#e2e8f0", flex: 1 }}>{inc.city}</span>
                        <span style={{ fontSize: 8, color: inc.bodyCamera ? "#34d399" : "#64748b" }}>{inc.bodyCamera ? "Cam" : "No cam"}</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 8, color: "#475569", marginTop: 8, lineHeight: 1.5 }}>
                      Data shows date, city, and body camera status. No individual names are displayed. Source: Washington Post.
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Take Action ────────────────────────────────────────────── */}
        {!loading && activeSection === "action" && (
          <>
            {/* How to file a complaint */}
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 10 }}>📋 How to File a Police Complaint</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {COMPLAINT_STEPS.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: "#f59e0b",
                    }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>{step.title}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.55 }}>{step.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparency resources */}
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 10 }}>🔗 Transparency Resources</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {TRANSPARENCY_RESOURCES.map((r) => (
                  <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", borderRadius: 8,
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(245,158,11,0.10)",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#fbbf24" }}>{r.label}</div>
                        <div style={{ fontSize: 8, color: "#64748b", marginTop: 1 }}>{r.desc}</div>
                      </div>
                      <span style={{ fontSize: 10, color: "#475569", flexShrink: 0 }}>↗</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.6, padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              NAVI uses only verified, publicly available data sources. No individual officers are identified. This information is provided for community awareness and civic participation. For legal advice specific to your situation, consult a licensed attorney.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
