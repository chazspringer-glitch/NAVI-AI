"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Food Intelligence — helps users find affordable food, plan meals on a
// budget, and access emergency food resources.
// ─────────────────────────────────────────────────────────────────────────────

type FoodTab = "find" | "emergency" | "meals" | "recipe";

const TABS: { key: FoodTab; label: string; icon: string }[] = [
  { key: "find",      label: "Find Food",  icon: "📍" },
  { key: "emergency", label: "Emergency",  icon: "🆘" },
  { key: "meals",     label: "Meal Plans", icon: "🍽️" },
  { key: "recipe",    label: "Recipes",    icon: "👨‍🍳" },
];

function buildFoodSearchLinks(location: string) {
  const loc = encodeURIComponent(location);
  return [
    { label: "Food Banks Near You", url: `https://www.feedingamerica.org/find-your-local-foodbank?zip=${loc}`, desc: "Feeding America — largest hunger-relief network in the U.S.", color: "#34d399", icon: "🏦" },
    { label: "Food Pantries", url: `https://www.google.com/maps/search/food+pantry+near+${loc}`, desc: "Find nearby pantries on Google Maps", color: "#00d4ff", icon: "📍" },
    { label: "SNAP Office Locator", url: `https://www.fns.usda.gov/snap/state-directory`, desc: "Apply for SNAP benefits (food stamps) in your state", color: "#f59e0b", icon: "🏛️" },
    { label: "WIC Clinics", url: `https://www.google.com/search?q=WIC+office+near+${loc}`, desc: "Women, Infants, and Children nutrition program", color: "#f472b6", icon: "👶" },
    { label: "Community Fridges", url: `https://www.google.com/search?q=community+fridge+near+${loc}`, desc: "Free public fridges stocked by neighbors", color: "#a855f7", icon: "🧊" },
    { label: "Farmer's Markets (EBT)", url: `https://www.google.com/search?q=farmers+market+accepts+EBT+near+${loc}`, desc: "Fresh produce that accepts SNAP/EBT", color: "#34d399", icon: "🥕" },
  ];
}

const EMERGENCY_RESOURCES = [
  { title: "SNAP (Food Stamps)", desc: "Monthly benefits loaded onto an EBT card for groceries. Most low-income individuals and families qualify.", url: "https://www.fns.usda.gov/snap/recipient/eligibility", icon: "🏛️", color: "#f59e0b", action: "Check eligibility" },
  { title: "WIC Program", desc: "Free food, nutrition education, and healthcare referrals for pregnant women, new mothers, and children under 5.", url: "https://www.fns.usda.gov/wic", icon: "👶", color: "#f472b6", action: "Apply now" },
  { title: "National Hunger Hotline", desc: "Call 1-866-3-HUNGRY (1-866-348-6479) to find food assistance near you. Available M-F 7am-10pm ET.", url: "tel:18663486479", icon: "📞", color: "#ef4444", action: "Call now" },
  { title: "Free School Meals", desc: "Free breakfast and lunch for qualifying students. Many districts offer universal free meals.", url: "https://www.fns.usda.gov/cn/school-meals", icon: "🎒", color: "#00d4ff", action: "Learn more" },
  { title: "Meals on Wheels", desc: "Home-delivered meals for seniors and homebound individuals. No one is turned away.", url: "https://www.mealsonwheelsamerica.org/find-meals", icon: "🚗", color: "#a855f7", action: "Find meals" },
  { title: "211 — Community Help", desc: "Dial 2-1-1 for local food, housing, and utility assistance. Available 24/7.", url: "tel:211", icon: "📱", color: "#34d399", action: "Call 211" },
];

const MEAL_PLANS: Record<string, { budget: string; tag: string; color: string; days: { day: string; meals: string[] }[] }> = {
  "$25": {
    budget: "$25/week", tag: "Survival Mode", color: "#ef4444",
    days: [
      { day: "Mon", meals: ["Oatmeal + banana", "PB&J + apple", "Rice & beans + frozen veggies"] },
      { day: "Tue", meals: ["Scrambled eggs + toast", "Leftover rice & beans", "Pasta + canned tomato sauce"] },
      { day: "Wed", meals: ["Oatmeal + raisins", "Egg sandwich", "Baked potato + butter + broccoli"] },
      { day: "Thu", meals: ["Toast + peanut butter", "Ramen + egg + frozen veggies", "Rice + canned chicken"] },
      { day: "Fri", meals: ["Oatmeal + banana", "PB&J", "Spaghetti + garlic bread"] },
      { day: "Sat", meals: ["Pancakes (from mix)", "Quesadilla (tortilla + cheese)", "Fried rice + egg + soy sauce"] },
      { day: "Sun", meals: ["French toast", "Soup (canned)", "Rice & beans + tortilla"] },
    ],
  },
  "$50": {
    budget: "$50/week", tag: "Smart Budget", color: "#f59e0b",
    days: [
      { day: "Mon", meals: ["Yogurt + granola", "Turkey sandwich + chips", "Chicken thighs + rice + salad"] },
      { day: "Tue", meals: ["Eggs + toast + fruit", "Leftover chicken wrap", "Ground beef tacos + lettuce"] },
      { day: "Wed", meals: ["Oatmeal + berries", "Tuna salad sandwich", "Pasta + meat sauce + side salad"] },
      { day: "Thu", meals: ["Cereal + banana", "Quesadilla + salsa", "Baked chicken + roasted potatoes"] },
      { day: "Fri", meals: ["Smoothie (banana + yogurt)", "Leftover pasta", "Fish sticks + mac & cheese + peas"] },
      { day: "Sat", meals: ["Pancakes + eggs", "Grilled cheese + tomato soup", "Stir fry (chicken + veggies + rice)"] },
      { day: "Sun", meals: ["French toast + fruit", "BLT sandwich", "Slow cooker chili + cornbread"] },
    ],
  },
  "$75": {
    budget: "$75/week", tag: "Balanced Living", color: "#34d399",
    days: [
      { day: "Mon", meals: ["Avocado toast + eggs", "Chicken Caesar wrap", "Salmon + quinoa + roasted vegetables"] },
      { day: "Tue", meals: ["Smoothie bowl", "Turkey & cheese wrap + fruit", "Ground turkey stir fry + brown rice"] },
      { day: "Wed", meals: ["Greek yogurt parfait", "Tuna poke bowl", "Chicken fajitas + peppers + guacamole"] },
      { day: "Thu", meals: ["Egg & veggie scramble", "Soup & half sandwich", "Baked tilapia + sweet potato + greens"] },
      { day: "Fri", meals: ["Overnight oats + berries", "Leftover fajitas", "Homemade pizza + salad"] },
      { day: "Sat", meals: ["Veggie omelet + toast", "Chicken salad + crackers", "Shrimp pasta + garlic bread"] },
      { day: "Sun", meals: ["Brunch: waffles + fruit + eggs", "Light: hummus + veggies + pita", "Roast chicken + potatoes + green beans"] },
    ],
  },
};

export default function FoodIntelPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<FoodTab>("find");
  const [location, setLocation] = useState("");
  const [foodResults, setFoodResults] = useState<ReturnType<typeof buildFoodSearchLinks> | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("$50");
  const [ingredients, setIngredients] = useState("");
  const [recipe, setRecipe] = useState<string | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);

  const handleFoodSearch = () => {
    if (!location.trim()) return;
    setFoodResults(buildFoodSearchLinks(location.trim()));
  };

  const handleRecipe = async () => {
    if (!ingredients.trim() || recipeLoading) return;
    setRecipeLoading(true);
    setRecipe(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `I have these ingredients: ${ingredients.trim()}. Give me a simple, budget-friendly recipe I can make with them. Include the recipe name, ingredients list with amounts, and step-by-step instructions. Keep it practical and easy.`,
          userName: "User", petName: "NAVI", mood: "happy",
          bondLevel: 2, bondName: "Friend", mentorMode: "chat",
          appMode: "companion", history: [],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setRecipe(json.reply ?? "Couldn't generate a recipe. Try different ingredients.");
      } else {
        setRecipe("Something went wrong. Try again.");
      }
    } catch {
      setRecipe("Could not reach NAVI. Check your connection.");
    } finally {
      setRecipeLoading(false);
    }
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
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#34d399", marginBottom: 3 }}>NAVI Food</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>🥗 Food Intelligence</div>
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
              background: active ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.03)",
              border: active ? "1px solid rgba(52,211,153,0.35)" : "1px solid rgba(255,255,255,0.06)",
              color: active ? "#34d399" : "#64748b", fontWeight: active ? 700 : 400,
            }}>
              <span style={{ fontSize: 12 }}>{icon}</span> {label}
            </button>
          );
        })}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── FIND FOOD ────────────────────────────────────────────────── */}
        {activeTab === "find" && (
          <>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                <span style={{ color: "#34d399", fontWeight: 700 }}>NAVI:</span> No one should go hungry. Enter your location and I{"'"}ll find food banks, pantries, SNAP offices, and community resources near you.
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State or ZIP"
                onKeyDown={(e) => e.key === "Enter" && handleFoodSearch()}
                style={{ flex: 1, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none" }}
              />
              <button onClick={handleFoodSearch} disabled={!location.trim()}
                style={{ padding: "10px 16px", borderRadius: 10, background: location.trim() ? "linear-gradient(135deg, #34d399, #10b981)" : "rgba(255,255,255,0.04)", border: "none", color: location.trim() ? "#08080f" : "#475569", fontSize: 11, fontWeight: 700, fontFamily: "monospace", cursor: location.trim() ? "pointer" : "default" }}>
                Search
              </button>
            </div>

            {foodResults && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {foodResults.map((r) => (
                  <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{ padding: "12px 14px", borderRadius: 12, background: `${r.color}08`, border: `1px solid ${r.color}20`, display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.label}</div>
                        <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{r.desc}</div>
                      </div>
                      <span style={{ fontSize: 11, color: "#475569" }}>↗</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── EMERGENCY ────────────────────────────────────────────────── */}
        {activeTab === "emergency" && (
          <>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>NAVI:</span> If you or your family need food right now, these resources can help today. Many require no application.
              </div>
            </div>

            {EMERGENCY_RESOURCES.map((r) => (
              <div key={r.title} style={{ padding: "14px 16px", borderRadius: 14, background: `${r.color}06`, border: `1px solid ${r.color}15` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{r.icon}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{r.title}</div>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.65, marginBottom: 10 }}>{r.desc}</div>
                <a href={r.url} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "8px 14px", borderRadius: 8,
                  background: `${r.color}12`, border: `1px solid ${r.color}30`,
                  color: r.color, fontSize: 10, fontWeight: 700,
                  fontFamily: "monospace", textDecoration: "none",
                }}>
                  {r.action} ↗
                </a>
              </div>
            ))}
          </>
        )}

        {/* ── MEAL PLANS ───────────────────────────────────────────────── */}
        {activeTab === "meals" && (() => {
          const plan = MEAL_PLANS[selectedPlan] ?? MEAL_PLANS["$50"];
          return (
            <>
              <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                  <span style={{ color: "#34d399", fontWeight: 700 }}>NAVI:</span> Eating well on a budget is possible. Pick a weekly budget and get a full 7-day meal plan — breakfast, lunch, and dinner.
                </div>
              </div>

              {/* Budget selector */}
              <div style={{ display: "flex", gap: 6 }}>
                {Object.entries(MEAL_PLANS).map(([key, p]) => {
                  const active = selectedPlan === key;
                  return (
                    <button key={key} onClick={() => setSelectedPlan(key)} style={{
                      flex: 1, padding: "10px 8px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                      background: active ? `${p.color}15` : "rgba(255,255,255,0.03)",
                      border: active ? `1px solid ${p.color}40` : "1px solid rgba(255,255,255,0.06)",
                      fontFamily: "monospace",
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: active ? p.color : "#64748b" }}>{key}</div>
                      <div style={{ fontSize: 7, color: active ? p.color : "#475569", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.1em" }}>{p.tag}</div>
                    </button>
                  );
                })}
              </div>

              {/* Meal plan grid */}
              {plan.days.map(({ day, meals }) => (
                <div key={day} style={{ padding: "12px 14px", borderRadius: 12, background: `${plan.color}05`, border: `1px solid ${plan.color}12` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: plan.color, marginBottom: 6 }}>{day}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {["Breakfast", "Lunch", "Dinner"].map((label, i) => (
                      <div key={label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 8, color: "#475569", width: 48, flexShrink: 0, textAlign: "right", paddingTop: 2 }}>{label}</span>
                        <span style={{ fontSize: 10, color: "#e2e8f0", lineHeight: 1.4 }}>{meals[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          );
        })()}

        {/* ── RECIPE GENERATOR ─────────────────────────────────────────── */}
        {activeTab === "recipe" && (
          <>
            <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(201,162,39,0.04)", border: "1px solid rgba(201,162,39,0.12)" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                <span style={{ color: "#C9A227", fontWeight: 700 }}>NAVI:</span> Tell me what{"'"}s in your fridge and I{"'"}ll create a recipe you can make right now. No fancy ingredients needed.
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9, color: "#C9A227", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>What ingredients do you have?</div>
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="e.g. chicken, rice, onion, garlic, soy sauce, frozen broccoli"
                rows={3}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", outline: "none", resize: "none" }}
              />
            </div>

            <button onClick={handleRecipe} disabled={!ingredients.trim() || recipeLoading}
              style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: ingredients.trim() ? "linear-gradient(135deg, #C9A227, #a07818)" : "rgba(255,255,255,0.04)",
                border: "none", color: ingredients.trim() ? "#08080f" : "#475569",
                fontSize: 13, fontWeight: 700, fontFamily: "monospace",
                cursor: ingredients.trim() ? "pointer" : "default",
              }}>
              {recipeLoading ? "Cooking up a recipe…" : "👨‍🍳 Generate Recipe"}
            </button>

            {recipe && (
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(201,162,39,0.04)", border: "1px solid rgba(201,162,39,0.12)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#C9A227", marginBottom: 8 }}>Your Recipe</div>
                <div style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{recipe}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
