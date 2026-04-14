"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const BUNDLES = [
  {
    name: "Family Veggie Bundle",
    price: "$25",
    desc: "Collard greens, sweet potatoes, onions, tomatoes, bell peppers, corn",
    serves: "Feeds a family of 4",
    pickup: "Weekly pickup · Saturday 9AM–1PM",
    color: "#34d399",
    icon: "🥬",
  },
  {
    name: "Fruit Refresh Box",
    price: "$20",
    desc: "Apples, oranges, bananas, grapes, strawberries, seasonal melon",
    serves: "15+ servings of fresh fruit",
    pickup: "Weekly pickup · Saturday 9AM–1PM",
    color: "#f59e0b",
    icon: "🍎",
  },
  {
    name: "Starter Singles Box",
    price: "$12",
    desc: "Bananas, apples, carrots, potatoes, onions — perfect for 1-2 people",
    serves: "Great for individuals",
    pickup: "Weekly pickup · Saturday 9AM–1PM",
    color: "#00d4ff",
    icon: "🥕",
  },
  {
    name: "Smoothie Pack",
    price: "$15",
    desc: "Spinach, bananas, blueberries, strawberries, mangoes — blend-ready",
    serves: "Makes 8–10 smoothies",
    pickup: "Weekly pickup · Saturday 9AM–1PM",
    color: "#a855f7",
    icon: "🫐",
  },
  {
    name: "Southern Roots Bundle",
    price: "$22",
    desc: "Collard greens, okra, black-eyed peas, sweet potatoes, cabbage, cornmeal",
    serves: "Traditional soul food staples",
    pickup: "Weekly pickup · Saturday 9AM–1PM",
    color: "#C9A227",
    icon: "🌽",
  },
  {
    name: "Kids Snack Box",
    price: "$10",
    desc: "Apple slices, carrot sticks, grapes, celery, cherry tomatoes",
    serves: "Healthy snacks for the week",
    pickup: "Weekly pickup · Saturday 9AM–1PM",
    color: "#f472b6",
    icon: "🍇",
  },
];

export default function FreshFoodPanel({ onClose }: { onClose: () => void }) {
  const [selectedBundle, setSelectedBundle] = useState<typeof BUNDLES[0] | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) setUserId(session.user.id);
    });
  }, []);

  const handleOrder = async () => {
    if (!formName.trim() || !formPhone.trim() || !selectedBundle) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/food-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name: formName,
          phone: formPhone,
          bundle_name: selectedBundle.name,
          quantity: parseInt(formQty) || 1,
          notes: formNotes,
        }),
      });
      if (res.ok) {
        setOrderSuccess(true);
        setFormName(""); setFormPhone(""); setFormQty("1"); setFormNotes("");
      }
    } catch { /* silent */ }
    finally { setSubmitting(false); }
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
        borderBottom: "1px solid rgba(52,211,153,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#34d399", marginBottom: 3 }}>Community</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>🥬 Fresh Food Market</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* Scrollable */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Intro */}
        <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
            <span style={{ color: "#34d399", fontWeight: 700 }}>NAVI:</span> Fresh, affordable produce from local farms — delivered to your community. Browse bundles below and place your order. Healthy eating shouldn{"'"}t be a luxury.
          </div>
        </div>

        {/* Order success */}
        {orderSuccess && (
          <div style={{ padding: "20px 16px", borderRadius: 14, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.22)", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399", marginBottom: 4 }}>Order Placed!</div>
            <div style={{ fontSize: 10, color: "#475569", marginBottom: 12 }}>We{"'"}ll confirm your order shortly. Check your phone for updates.</div>
            <button onClick={() => { setOrderSuccess(false); setSelectedBundle(null); }} style={{ padding: "8px 20px", borderRadius: 8, background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399", fontSize: 10, fontFamily: "monospace", fontWeight: 600, cursor: "pointer" }}>
              Browse More
            </button>
          </div>
        )}

        {/* Order form */}
        {selectedBundle && !orderSuccess && (
          <div style={{ padding: "16px", borderRadius: 14, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: `1px solid ${selectedBundle.color}22`, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{selectedBundle.icon} {selectedBundle.name}</div>
                <div style={{ fontSize: 10, color: selectedBundle.color, fontWeight: 700, marginTop: 2 }}>{selectedBundle.price}</div>
              </div>
              <button onClick={() => setSelectedBundle(null)} style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b", fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}>← Back</button>
            </div>

            <div>
              <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Your Name</div>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Full name"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", position: "relative", zIndex: 10 }} />
            </div>
            <div>
              <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Phone Number</div>
              <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="(555) 123-4567" type="tel"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", position: "relative", zIndex: 10 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Quantity</div>
                <select value={formQty} onChange={(e) => setFormQty(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }}>
                  {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Notes (optional)</div>
                <input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Allergies, preferences..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", position: "relative", zIndex: 10 }} />
              </div>
            </div>
            <button onClick={handleOrder} disabled={submitting || !formName.trim() || !formPhone.trim()}
              style={{ width: "100%", padding: "12px", borderRadius: 10, background: (submitting || !formName.trim() || !formPhone.trim()) ? "rgba(52,211,153,0.06)" : "linear-gradient(135deg, #34d399, #10b981)", border: "none", color: (submitting || !formName.trim() || !formPhone.trim()) ? "#34d399" : "#02020a", fontSize: 12, fontFamily: "monospace", fontWeight: 700, cursor: (submitting || !formName.trim() || !formPhone.trim()) ? "default" : "pointer", opacity: (!formName.trim() || !formPhone.trim()) ? 0.4 : 1 }}>
              {submitting ? "Placing order..." : `Place Order — ${selectedBundle.price}`}
            </button>
          </div>
        )}

        {/* Bundle cards */}
        {!selectedBundle && !orderSuccess && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {BUNDLES.map((bundle) => (
              <div key={bundle.name} style={{
                padding: "16px", borderRadius: 14,
                background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)",
                border: `1px solid ${bundle.color}18`,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>{bundle.icon} {bundle.name}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5, marginBottom: 4 }}>{bundle.desc}</div>
                    <div style={{ fontSize: 9, color: "#475569" }}>{bundle.serves}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: bundle.color, flexShrink: 0, marginLeft: 10 }}>{bundle.price}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <div style={{ fontSize: 9, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                    <span>📍</span> {bundle.pickup}
                  </div>
                  <button onClick={() => setSelectedBundle(bundle)}
                    style={{ padding: "6px 16px", borderRadius: 8, background: `${bundle.color}12`, border: `1px solid ${bundle.color}30`, color: bundle.color, fontSize: 10, fontFamily: "monospace", fontWeight: 600, cursor: "pointer" }}>
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(201,162,39,0.03)", border: "1px solid rgba(201,162,39,0.10)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#C9A227", marginBottom: 8 }}>How It Works</div>
          {[
            { step: "1", text: "Browse bundles and tap Order Now" },
            { step: "2", text: "Fill in your name and phone number" },
            { step: "3", text: "We confirm your order via text" },
            { step: "4", text: "Pick up fresh food at the community location" },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 10, color: "#94a3b8" }}>
              <span style={{ color: "#C9A227", fontWeight: 700, flexShrink: 0 }}>{step}.</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", fontSize: 8, color: "#334155", lineHeight: 1.6 }}>
          All produce sourced from local farms and community partners. Availability may vary by season. Orders placed by Thursday are ready for Saturday pickup.
        </div>
      </div>
    </div>
  );
}
