"use client";

import { useState, useEffect } from "react";
import NaviOrb from "./NaviOrb";

const QUOTES = [
  { text: "A people without the knowledge of their past history, origin and culture is like a tree without roots.", author: "Marcus Garvey" },
  { text: "The most common way people give up their power is by thinking they don't have any.", author: "Alice Walker" },
  { text: "If there is no struggle, there is no progress.", author: "Frederick Douglass" },
  { text: "I am no longer accepting the things I cannot change. I am changing the things I cannot accept.", author: "Angela Davis" },
  { text: "Injustice anywhere is a threat to justice everywhere.", author: "Martin Luther King Jr." },
  { text: "Every great dream begins with a dreamer.", author: "Harriet Tubman" },
  { text: "Hold fast to dreams, for if dreams die, life is a broken-winged bird that cannot fly.", author: "Langston Hughes" },
  { text: "Success is to be measured not so much by the position that one has reached in life as by the obstacles which he has overcome.", author: "Booker T. Washington" },
];

// ── "Today in History" entries keyed by MM-DD ────────────────────────────────
const TODAY_ENTRIES: Record<string, { title: string; year: string; desc: string }> = {
  "01-01": { title: "Emancipation Proclamation takes effect", year: "1863", desc: "President Lincoln's executive order freed enslaved people in Confederate states, transforming the Civil War into a fight for freedom." },
  "01-15": { title: "Martin Luther King Jr. born", year: "1929", desc: "Born in Atlanta, Georgia. Went on to become the most iconic civil rights leader in American history." },
  "01-20": { title: "Barack Obama inaugurated as 44th President", year: "2009", desc: "First Black President of the United States, making history watched by millions worldwide." },
  "02-01": { title: "First day of Black History Month", year: "1976", desc: "Officially recognized by President Gerald Ford. Grew from Carter G. Woodson's 'Negro History Week' (1926)." },
  "02-21": { title: "Malcolm X assassinated", year: "1965", desc: "Civil rights leader and minister shot in New York. His autobiography remains one of the most influential books in American history." },
  "02-25": { title: "Hiram Revels becomes first Black U.S. Senator", year: "1870", desc: "Represented Mississippi — just 5 years after the end of slavery." },
  "03-07": { title: "Bloody Sunday — Selma to Montgomery March", year: "1965", desc: "State troopers attacked peaceful marchers on the Edmund Pettus Bridge. Led directly to the Voting Rights Act." },
  "04-04": { title: "Martin Luther King Jr. assassinated", year: "1968", desc: "Shot in Memphis, Tennessee at age 39. Sparked nationwide grief and uprisings." },
  "04-16": { title: "Letter from Birmingham Jail", year: "1963", desc: "MLK wrote his famous defense of nonviolent civil disobedience while imprisoned in Alabama." },
  "05-17": { title: "Brown v. Board of Education decided", year: "1954", desc: "Supreme Court unanimously ruled school segregation unconstitutional." },
  "05-25": { title: "George Floyd killed in Minneapolis", year: "2020", desc: "His murder by police sparked the largest civil rights protests in U.S. history." },
  "06-19": { title: "Juneteenth — Freedom Day", year: "1865", desc: "Union soldiers arrived in Galveston, Texas with news that enslaved people were free — two years after the Emancipation Proclamation." },
  "07-02": { title: "Civil Rights Act signed into law", year: "1964", desc: "Outlawed discrimination based on race, color, religion, sex, or national origin." },
  "08-28": { title: "March on Washington — 'I Have a Dream'", year: "1963", desc: "250,000 people gathered at the Lincoln Memorial. MLK delivered the most famous speech in American history." },
  "09-15": { title: "16th Street Baptist Church bombing", year: "1963", desc: "Four young girls killed in a Klan bombing in Birmingham, Alabama. Galvanized support for civil rights legislation." },
  "10-16": { title: "Million Man March", year: "1995", desc: "Hundreds of thousands of Black men gathered in Washington D.C. for unity, atonement, and community responsibility." },
  "11-05": { title: "Barack Obama elected President", year: "2008", desc: "Won 365 electoral votes. 'Yes We Can' became a defining moment in American history." },
  "12-01": { title: "Rosa Parks refuses to give up her seat", year: "1955", desc: "Her arrest in Montgomery, Alabama ignited the Montgomery Bus Boycott — a 381-day protest that changed America." },
  "12-05": { title: "Montgomery Bus Boycott begins", year: "1955", desc: "Led by a 26-year-old MLK. The boycott lasted over a year and ended bus segregation." },
};

function getTodayEntry(): { title: string; year: string; desc: string } | null {
  const now = new Date();
  const key = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return TODAY_ENTRIES[key] ?? null;
}

const ERAS = [
  "Any Era",
  "Ancient Africa & Pre-Colonial",
  "Slavery & Resistance (1619–1865)",
  "Reconstruction & Jim Crow (1865–1954)",
  "Civil Rights Movement (1954–1975)",
  "Modern Era (1975–Present)",
];

const TOPICS = [
  "Any Topic",
  "Leaders & Activists",
  "Inventors & Scientists",
  "Art, Music & Culture",
  "Business & Economics",
  "Military & Wars",
  "Education & Scholars",
  "Sports & Athletes",
  "Politics & Law",
  "Hidden Figures & Untold Stories",
];

interface HistoryEntry {
  title: string;
  year: string;
  desc: string;
  significance: string;
  category: string;
}

function generateEntries(era: string, topic: string): HistoryEntry[] {
  const all: HistoryEntry[] = [
    { title: "Mansa Musa — Richest Person in History", year: "1312–1337", desc: "Emperor of the Mali Empire whose wealth was so vast it destabilized economies he passed through on his pilgrimage to Mecca.", significance: "Proves Africa had advanced economies and empires centuries before European colonization.", category: "Ancient Africa & Pre-Colonial" },
    { title: "The Kingdom of Kush", year: "1070 BCE–350 CE", desc: "A powerful Nubian kingdom that rivaled and even conquered Egypt. Built over 200 pyramids — more than Egypt itself.", significance: "Challenges the narrative that advanced civilization only existed in Egypt.", category: "Ancient Africa & Pre-Colonial" },
    { title: "Timbuktu — Center of Learning", year: "1300s–1500s", desc: "Home to one of the world's oldest universities (Sankore). Scholars studied astronomy, math, medicine, and law.", significance: "African intellectual tradition predates many European universities.", category: "Ancient Africa & Pre-Colonial" },
    { title: "The Haitian Revolution", year: "1791–1804", desc: "The only successful large-scale slave revolt in history. Led by Toussaint Louverture and Jean-Jacques Dessalines, enslaved people defeated Napoleon's army.", significance: "First free Black republic. Changed the course of world history.", category: "Slavery & Resistance (1619–1865)" },
    { title: "The Underground Railroad", year: "1810–1860", desc: "A secret network of routes and safe houses used by enslaved people to escape to freedom. Harriet Tubman made 13 missions rescuing ~70 people.", significance: "Showed organized resistance existed throughout slavery.", category: "Slavery & Resistance (1619–1865)" },
    { title: "Nat Turner's Rebellion", year: "1831", desc: "An enslaved man led one of the most significant slave uprisings in American history in Virginia.", significance: "Demonstrated that enslaved people never accepted their condition and fought back.", category: "Slavery & Resistance (1619–1865)" },
    { title: "Black Wall Street — Tulsa, Oklahoma", year: "1906–1921", desc: "The Greenwood District was the wealthiest Black community in America with its own banks, hotels, hospitals, and theaters. Destroyed in the 1921 Tulsa Race Massacre.", significance: "Proves Black economic self-sufficiency was real — and was violently suppressed.", category: "Reconstruction & Jim Crow (1865–1954)" },
    { title: "The Great Migration", year: "1916–1970", desc: "6 million Black Americans moved from the rural South to cities in the North, Midwest, and West seeking better lives and escaping Jim Crow.", significance: "Reshaped American culture, politics, and demographics forever.", category: "Reconstruction & Jim Crow (1865–1954)" },
    { title: "Ida B. Wells — Anti-Lynching Crusader", year: "1892–1931", desc: "Journalist and activist who documented lynchings across America and fought to expose racial terror.", significance: "Her investigative journalism was decades ahead of its time.", category: "Reconstruction & Jim Crow (1865–1954)" },
    { title: "Brown v. Board of Education", year: "1954", desc: "Supreme Court ruled that racial segregation in public schools was unconstitutional, overturning 'separate but equal.'", significance: "Legal foundation for the entire Civil Rights Movement.", category: "Civil Rights Movement (1954–1975)" },
    { title: "March on Washington", year: "1963", desc: "250,000 people marched for jobs and freedom. Martin Luther King Jr. delivered 'I Have a Dream.'", significance: "Led directly to the Civil Rights Act of 1964.", category: "Civil Rights Movement (1954–1975)" },
    { title: "The Black Panther Party", year: "1966–1982", desc: "Founded by Huey Newton and Bobby Seale. Ran free breakfast programs, health clinics, and community schools while advocating for self-defense.", significance: "Redefined activism — combined direct action with community service.", category: "Civil Rights Movement (1954–1975)" },
    { title: "Shirley Chisholm — First Black Woman in Congress", year: "1968", desc: "Elected to the U.S. House of Representatives from New York. In 1972, became the first Black candidate for a major party's presidential nomination.", significance: "Broke barriers that paved the way for every Black politician after her.", category: "Civil Rights Movement (1954–1975)" },
    { title: "Garrett Morgan — Invented the Traffic Signal", year: "1923", desc: "Also invented an early gas mask used to rescue trapped workers. His traffic signal patent was sold to General Electric.", significance: "Black inventors created things the entire world depends on daily.", category: "Reconstruction & Jim Crow (1865–1954)" },
    { title: "Dr. Charles Drew — Blood Banks", year: "1940s", desc: "Pioneered techniques for blood storage and organized the first large-scale blood bank during WWII.", significance: "His work has saved millions of lives worldwide.", category: "Reconstruction & Jim Crow (1865–1954)" },
    { title: "Katherine Johnson — NASA Mathematician", year: "1953–1986", desc: "Calculated trajectories for the first American in space and the Apollo 11 moon landing. Her math was so trusted that John Glenn requested she verify the computer's calculations.", significance: "A 'hidden figure' whose genius made space travel possible.", category: "Modern Era (1975–Present)" },
    { title: "Hip-Hop Culture", year: "1973–Present", desc: "Born in the Bronx, created by Black and Latino youth. DJing, MCing, breakdancing, and graffiti became a global cultural movement worth billions.", significance: "The most influential cultural export of the late 20th century.", category: "Modern Era (1975–Present)" },
    { title: "Barack Obama — 44th President", year: "2009–2017", desc: "First Black President of the United States. Served two terms.", significance: "A milestone many thought impossible — changed what representation looks like globally.", category: "Modern Era (1975–Present)" },
    { title: "The 1619 Project", year: "2019", desc: "Created by Nikole Hannah-Jones for the New York Times. Reframes American history by placing the consequences of slavery at the center of the national narrative.", significance: "Sparked a national conversation about how we teach history.", category: "Modern Era (1975–Present)" },
    { title: "Black Lives Matter Movement", year: "2013–Present", desc: "Founded by Alicia Garza, Patrisse Cullors, and Opal Tometi after the acquittal of Trayvon Martin's killer. Grew into a global movement.", significance: "Largest civil rights movement of the 21st century.", category: "Modern Era (1975–Present)" },
    { title: "Robert Smalls — Escaped Slavery by Stealing a Confederate Ship", year: "1862", desc: "An enslaved man who commandeered a Confederate military vessel and sailed his family and crew to freedom. Later became a U.S. Congressman.", significance: "One of the most daring escapes in American history.", category: "Slavery & Resistance (1619–1865)" },
    { title: "Madam C.J. Walker — First Self-Made Female Millionaire", year: "1910s", desc: "Built a hair care empire and became one of the wealthiest Black women in America. Used her wealth to fund civil rights causes.", significance: "Proved Black entrepreneurship could thrive despite systemic barriers.", category: "Reconstruction & Jim Crow (1865–1954)" },
    { title: "Jesse Owens — 1936 Berlin Olympics", year: "1936", desc: "Won 4 gold medals in Nazi Germany, directly defying Hitler's claims of Aryan racial superiority.", significance: "Used athletic excellence as a statement against racism.", category: "Reconstruction & Jim Crow (1865–1954)" },
    { title: "The Harlem Renaissance", year: "1920s–1930s", desc: "An explosion of Black art, literature, music, and thought. Langston Hughes, Zora Neale Hurston, Duke Ellington, and many others redefined American culture.", significance: "Proved that Black creativity was central to American identity.", category: "Reconstruction & Jim Crow (1865–1954)" },
  ];

  let filtered = all;
  if (era !== "Any Era") filtered = filtered.filter((e) => e.category === era);
  if (topic !== "Any Topic") {
    const topicMap: Record<string, string[]> = {
      "Leaders & Activists": ["Mansa Musa", "Nat Turner", "Ida B. Wells", "Shirley Chisholm", "Black Panther", "Black Lives Matter", "Robert Smalls", "March on Washington"],
      "Inventors & Scientists": ["Garrett Morgan", "Dr. Charles Drew", "Katherine Johnson"],
      "Art, Music & Culture": ["Harlem Renaissance", "Hip-Hop", "1619 Project", "Timbuktu"],
      "Business & Economics": ["Black Wall Street", "Madam C.J. Walker", "Mansa Musa"],
      "Military & Wars": ["Haitian Revolution", "Robert Smalls", "Jesse Owens"],
      "Education & Scholars": ["Timbuktu", "Brown v. Board", "Katherine Johnson", "1619 Project"],
      "Sports & Athletes": ["Jesse Owens"],
      "Politics & Law": ["Brown v. Board", "Shirley Chisholm", "Barack Obama"],
      "Hidden Figures & Untold Stories": ["Katherine Johnson", "Robert Smalls", "Kingdom of Kush", "Black Wall Street", "Dr. Charles Drew"],
    };
    const keywords = topicMap[topic] || [];
    if (keywords.length > 0) {
      filtered = filtered.filter((e) => keywords.some((k) => e.title.includes(k)));
    }
  }

  if (filtered.length === 0) filtered = all;
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);

  // Always return at least 7 — pad with random entries from the full set if needed
  if (shuffled.length >= 7) return shuffled.slice(0, 7);
  const remaining = all.filter((e) => !shuffled.some((s) => s.title === e.title)).sort(() => Math.random() - 0.5);
  return [...shuffled, ...remaining].slice(0, 7);
}

export default function BlackHistoryPanel({ onClose }: { onClose: () => void }) {
  const [era, setEra] = useState("Any Era");
  const [topic, setTopic] = useState("Any Topic");
  const [results, setResults] = useState<HistoryEntry[] | null>(null);
  const [mounted, setMounted] = useState(false);
  const [quoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));

  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);

  // Auto-load results on mount so the panel opens with content visible
  useEffect(() => { setResults(generateEntries(era, topic)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setResults(generateEntries(era, topic));
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
        borderBottom: "1px solid rgba(239,68,68,0.12)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.30em", textTransform: "uppercase", color: "#f87171", marginBottom: 3 }}>NAVI Learns</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f1f5f9" }}>✊ Black History</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13 }} aria-label="Close">✕</button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Cinematic hero */}
        <div style={{
          textAlign: "center", padding: "24px 18px",
          borderRadius: 18,
          background: "linear-gradient(160deg, rgba(16,16,26,0.98) 0%, rgba(10,10,20,0.98) 100%)",
          border: "1px solid rgba(239,68,68,0.15)",
          boxShadow: "0 0 48px rgba(239,68,68,0.06), 0 12px 40px rgba(0,0,0,0.5)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 700ms ease, transform 700ms ease",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <NaviOrb size={52} />
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "#f87171", marginBottom: 10 }}>
            Our History. Our Power.
          </div>
          <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.7, fontStyle: "italic", marginBottom: 6, maxWidth: 320, margin: "0 auto 6px" }}>
            {"\u201C"}{QUOTES[quoteIdx].text}{"\u201D"}
          </div>
          <div style={{ fontSize: 10, color: "#C9A227", fontWeight: 700 }}>
            — {QUOTES[quoteIdx].author}
          </div>
        </div>

        {/* Today in History */}
        {(() => {
          const today = getTodayEntry();
          if (!today) return null;
          return (
            <div style={{
              padding: "14px 16px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(201,162,39,0.08), rgba(201,162,39,0.03))",
              border: "1px solid rgba(201,162,39,0.20)",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 600ms ease 200ms, transform 600ms ease 200ms",
            }}>
              <div style={{ fontSize: 8, letterSpacing: "0.24em", textTransform: "uppercase", color: "#C9A227", fontWeight: 700, marginBottom: 6 }}>
                📅 Today in Black History
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3 }}>{today.title}</div>
                <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 600, color: "#C9A227", background: "rgba(201,162,39,0.10)", border: "1px solid rgba(201,162,39,0.20)", flexShrink: 0 }}>{today.year}</span>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.65 }}>{today.desc}</div>
            </div>
          );
        })()}

        {/* Era pills */}
        <div>
          <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 2 }}>Time Period</div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {ERAS.map((e) => {
              const active = era === e;
              return (
                <button key={e} onClick={() => { setEra(e); setResults(generateEntries(e, topic)); }}
                  style={{
                    padding: "6px 12px", borderRadius: 999, whiteSpace: "nowrap",
                    fontSize: 9, fontFamily: "monospace", fontWeight: active ? 700 : 400, cursor: "pointer",
                    background: active ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.03)",
                    border: active ? "1px solid rgba(239,68,68,0.40)" : "1px solid rgba(255,255,255,0.06)",
                    color: active ? "#f87171" : "#64748b",
                    transition: "all 0.15s ease",
                  }}>{e === "Any Era" ? "All" : e.split("(")[0].trim()}</button>
              );
            })}
          </div>
        </div>

        {/* Topic pills */}
        <div>
          <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 2 }}>Topic</div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", flexWrap: "wrap" }}>
            {TOPICS.map((t) => {
              const active = topic === t;
              return (
                <button key={t} onClick={() => { setTopic(t); setResults(generateEntries(era, t)); }}
                  style={{
                    padding: "6px 12px", borderRadius: 999, whiteSpace: "nowrap",
                    fontSize: 9, fontFamily: "monospace", fontWeight: active ? 700 : 400, cursor: "pointer",
                    background: active ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.03)",
                    border: active ? "1px solid rgba(201,162,39,0.35)" : "1px solid rgba(255,255,255,0.06)",
                    color: active ? "#C9A227" : "#64748b",
                    transition: "all 0.15s ease",
                  }}>{t === "Any Topic" ? "All" : t}</button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {results && (
          <>
            <div style={{ padding: "16px", borderRadius: 14, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(239,68,68,0.10)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>What You Need to Know</div>
              <div style={{ fontSize: 9, color: "#475569", marginBottom: 14 }}>{results.length} entries · {era} · {topic}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {results.map((entry, i) => (
                  <div key={i} style={{ padding: "14px", borderRadius: 12, background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.10)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3, flex: 1 }}>{entry.title}</div>
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 600, color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", flexShrink: 0, marginLeft: 8 }}>{entry.year}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.65, marginBottom: 10 }}>{entry.desc}</div>
                    <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.12)" }}>
                      <div style={{ fontSize: 8, color: "#C9A227", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3, fontWeight: 700 }}>Why This Matters</div>
                      <div style={{ fontSize: 10, color: "#C9A227", lineHeight: 1.55 }}>{entry.significance}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learn more links */}
            <div style={{ padding: "16px", borderRadius: 14, background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.10)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#f87171", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>📚 Learn More</div>
              {[
                { label: "National Museum of African American History", url: "https://nmaahc.si.edu/" },
                { label: "BlackPast.org — Encyclopedia", url: "https://www.blackpast.org/" },
                { label: "The 1619 Project", url: "https://www.nytimes.com/interactive/2019/08/14/magazine/1619-america-slavery.html" },
                { label: "African American History (History.com)", url: "https://www.history.com/topics/black-history" },
                { label: "Schomburg Center for Research", url: "https://www.nypl.org/locations/schomburg" },
                { label: "PBS — Black Culture Connection", url: "https://www.pbs.org/black-culture/explore/" },
              ].map(({ label, url }) => (
                <button key={label} onClick={() => window.open(url, "_blank")} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, cursor: "pointer", marginBottom: 4,
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(239,68,68,0.08)", color: "#fca5a5", fontSize: 11, fontFamily: "monospace",
                }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>↗</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Timeline (always visible) */}
        <div style={{ padding: "16px", borderRadius: 14, background: "linear-gradient(160deg, rgba(16,16,26,0.95) 0%, rgba(12,12,22,0.95) 100%)", border: "1px solid rgba(168,85,247,0.10)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", marginBottom: 14 }}>Timeline of Resilience</div>
          {[
            { year: "3000 BCE", event: "Kingdom of Kush rises in Nubia", color: "#C9A227" },
            { year: "1312", event: "Mansa Musa rules Mali Empire", color: "#C9A227" },
            { year: "1619", event: "First enslaved Africans arrive in Virginia", color: "#f87171" },
            { year: "1804", event: "Haiti wins independence — first free Black republic", color: "#34d399" },
            { year: "1865", event: "Slavery abolished (13th Amendment)", color: "#34d399" },
            { year: "1921", event: "Tulsa Race Massacre destroys Black Wall Street", color: "#f87171" },
            { year: "1954", event: "Brown v. Board ends school segregation", color: "#00d4ff" },
            { year: "1963", event: "March on Washington — 'I Have a Dream'", color: "#a855f7" },
            { year: "1966", event: "Black Panther Party founded", color: "#f87171" },
            { year: "2009", event: "Barack Obama inaugurated as 44th President", color: "#34d399" },
            { year: "2020", event: "Black Lives Matter becomes global movement", color: "#a855f7" },
          ].map(({ year, event, color }, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 52, flexShrink: 0, textAlign: "right" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color }}>{year}</div>
              </div>
              <div style={{ width: 8, display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}55` }} />
                {i < 10 && <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 2 }} />}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5, paddingBottom: 4 }}>{event}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", fontSize: 8, color: "#334155", lineHeight: 1.6 }}>
          NAVI{"'"}s Black History content is educational and draws from documented historical sources. For academic research, always cross-reference with primary sources and established institutions.
        </div>
      </div>
    </div>
  );
}
