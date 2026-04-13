"use client";

import { useState } from "react";

const STEPS = [
  { num: "1", title: "Set Your Budget", desc: "Know your max. Include insurance, gas, and maintenance." },
  { num: "2", title: "Get Pre-Approved", desc: "Check your credit union or bank before the dealer." },
  { num: "3", title: "Find a Reliable Car", desc: "Stick to brands known for lasting 200K+ miles." },
  { num: "4", title: "Inspect the Vehicle", desc: "Always get a pre-purchase inspection. No exceptions." },
  { num: "5", title: "Negotiate the Price", desc: "Never pay sticker. Use KBB and market data." },
];

const CAR_TYPES = ["Sedan", "SUV", "Truck", "Any"];

function estimateMonthly(budget: number): string {
  if (budget <= 0) return "—";
  // Rough estimate: 60-month loan at ~7% APR
  const rate = 0.07 / 12;
  const months = 60;
  const payment = (budget * rate) / (1 - Math.pow(1 + rate, -months));
  return `~$${Math.round(payment)}/mo`;
}

function getRecommendations(budget: number, carType: string) {
  const budgetRange = budget < 8000
    ? { label: "$3K–$8K", tier: "budget" }
    : budget < 15000
      ? { label: "$8K–$15K", tier: "mid" }
      : { label: "$15K+", tier: "upper" };

  const brands: Record<string, string[]> = {
    budget: ["Toyota Corolla", "Honda Civic", "Nissan Sentra", "Hyundai Elantra"],
    mid:    ["Toyota Camry", "Honda Accord", "Mazda CX-5", "Hyundai Tucson"],
    upper:  ["Toyota RAV4", "Honda CR-V", "Subaru Outback", "Mazda CX-30"],
  };

  const suvBrands: Record<string, string[]> = {
    budget: ["Honda CR-V (older)", "Toyota RAV4 (older)", "Ford Escape"],
    mid:    ["Toyota RAV4", "Honda CR-V", "Mazda CX-5", "Hyundai Santa Fe"],
    upper:  ["Toyota Highlander", "Subaru Outback", "Honda Passport"],
  };

  const truckBrands: Record<string, string[]> = {
    budget: ["Ford Ranger (older)", "Toyota Tacoma (older)", "Nissan Frontier"],
    mid:    ["Toyota Tacoma", "Ford Ranger", "Chevrolet Colorado"],
    upper:  ["Toyota Tundra", "Ford F-150", "Ram 1500"],
  };

  let suggested = brands[budgetRange.tier] || brands.mid;
  if (carType === "SUV") suggested = suvBrands[budgetRange.tier] || suvBrands.mid;
  if (carType === "Truck") suggested = truckBrands[budgetRange.tier] || truckBrands.mid;

  const warnings = [
    "Avoid 'Buy Here Pay Here' lots — interest rates can be 20%+",
    "Never skip a pre-purchase inspection ($100–$150 can save you thousands)",
    budget < 5000 ? "At this budget, mileage matters more than year — look for well-maintained cars" : null,
    "If the deal feels rushed, walk away. Good deals don't disappear overnight.",
  ].filter(Boolean) as string[];

  return { budgetRange, suggested, warnings, monthly: estimateMonthly(budget) };
}

export default function AutoFinderPanel({ onClose }: { onClose: () => void }) {
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [carType, setCarType] = useState("Any");
  const [result, setResult] = useState<ReturnType<typeof getRecommendations> | null>(null);

  const handleSearch = () => {
    const b = parseInt(budget.replace(/[^0-9]/g, ""), 10);
    if (!b || b < 1000) return;
    setResult(getRecommendations(b, carType));
  };

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
        borderBottom: "1px solid rgba(74,222,128,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#4ade80", marginBottom: 3 }}>
            NAVI Tool
          </div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9", letterSpacing: "0.02em" }}>
            🚗 Affordable Auto Finder
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 30, height: 30, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent", color: "#64748b",
            cursor: "pointer", fontSize: 13,
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* NAVI intro */}
        <div style={{
          padding: "14px 16px", borderRadius: 14,
          background: "rgba(74,222,128,0.04)",
          border: "1px solid rgba(74,222,128,0.12)",
        }}>
          <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>NAVI:</span> Let me help you find a reliable, affordable car. I{"'"}ll give you real advice — no sugarcoating. Tell me your budget and what you{"'"}re looking for.
          </div>
        </div>

        {/* Input form */}
        <div style={{
          padding: "16px", borderRadius: 14,
          background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
          border: "1px solid rgba(74,222,128,0.10)",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Budget ($)</div>
            <input
              type="text"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 8000"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0", fontSize: 14, fontFamily: "monospace",
                outline: "none", position: "relative", zIndex: 10,
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Location</div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or zip code"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0", fontSize: 12, fontFamily: "monospace",
                outline: "none", position: "relative", zIndex: 10,
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Car Type</div>
            <select
              value={carType}
              onChange={(e) => setCarType(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0", fontSize: 12, fontFamily: "monospace",
                outline: "none", position: "relative", zIndex: 10,
              }}
            >
              {CAR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={!budget || parseInt(budget) < 1000}
            style={{
              width: "100%", padding: "12px", borderRadius: 10,
              background: (!budget || parseInt(budget) < 1000)
                ? "rgba(74,222,128,0.06)"
                : "linear-gradient(135deg, rgba(74,222,128,0.18), rgba(52,211,153,0.10))",
              border: "1px solid rgba(74,222,128,0.30)",
              color: "#4ade80", fontSize: 12, fontFamily: "monospace",
              fontWeight: 700, letterSpacing: "0.04em",
              cursor: (!budget || parseInt(budget) < 1000) ? "default" : "pointer",
              opacity: (!budget || parseInt(budget) < 1000) ? 0.4 : 1,
            }}
          >
            🔍 Find My Car
          </button>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Budget analysis */}
            <div style={{
              padding: "16px", borderRadius: 14,
              background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
              border: "1px solid rgba(74,222,128,0.10)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", marginBottom: 12 }}>NAVI{"'"}s Analysis</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 8, color: "#475569", marginBottom: 3 }}>BUDGET RANGE</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>{result.budgetRange.label}</div>
                </div>
                <div style={{ padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 8, color: "#475569", marginBottom: 3 }}>EST. MONTHLY</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>{result.monthly}</div>
                </div>
              </div>

              {location && (
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10 }}>
                  Searching near: <span style={{ color: "#94a3b8" }}>{location}</span>
                </div>
              )}
            </div>

            {/* Suggested vehicles */}
            <div style={{
              padding: "16px", borderRadius: 14,
              background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
              border: "1px solid rgba(0,212,255,0.10)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#00d4ff", marginBottom: 10 }}>Recommended Vehicles</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {result.suggested.map((car) => (
                  <div key={car} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", borderRadius: 8,
                    background: "rgba(0,212,255,0.04)",
                    border: "1px solid rgba(0,212,255,0.10)",
                  }}>
                    <span style={{ fontSize: 14 }}>🚗</span>
                    <span style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 500 }}>{car}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 9, color: "#475569", marginTop: 10, lineHeight: 1.5 }}>
                These brands are known for reliability and low cost of ownership. Always check specific vehicle history with Carfax or AutoCheck.
              </div>
            </div>

            {/* Warnings */}
            <div style={{
              padding: "16px", borderRadius: 14,
              background: "rgba(245,158,11,0.03)",
              border: "1px solid rgba(245,158,11,0.15)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 10 }}>Watch Out For</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {result.warnings.map((w, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
                    <span style={{ color: "#f59e0b", flexShrink: 0 }}>⚠️</span>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step-by-step guide (always visible) */}
        <div style={{
          padding: "16px", borderRadius: 14,
          background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
          border: "1px solid rgba(168,85,247,0.10)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", marginBottom: 12 }}>Car Buying Guide</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} style={{ display: "flex", gap: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(168,85,247,0.10)",
                  border: "1px solid rgba(168,85,247,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#a855f7",
                }}>
                  {num}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
          fontSize: 8, color: "#334155", lineHeight: 1.6,
        }}>
          NAVI is not a financial advisor. Recommendations are for guidance only. Always do your own research and consult a professional for financing decisions.
        </div>
      </div>
    </div>
  );
}
