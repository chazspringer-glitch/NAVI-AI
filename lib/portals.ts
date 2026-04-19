/**
 * City Portal System — localized NAVI experiences.
 *
 * Each portal is a config object that customizes branding, data sources,
 * and featured content without changing any core NAVI code.
 *
 * Detection: URL param ?portal=wilmington or direct link meetnavi.space?portal=wilmington
 *
 * Adding a new city = one new object in PORTALS. No other files to touch.
 */

export interface PortalBranding {
  primaryColor: string;
  accentColor:  string;
}

export interface PortalConfig {
  id:          string;
  name:        string;          // "Wilmington Assistant"
  type:        string;          // "city" | "org" | "school"
  city:        string;
  state:       string;
  fullName:    string;          // "Wilmington, NC"
  tagline:     string;          // shown in header banner
  branding:    PortalBranding;
  homeCards:   string[];        // featured action labels shown on portal home
  features:    string[];        // featured tool IDs (navigate destinations)
  partners:    string[];        // partner names to highlight
  newsQuery:   string;          // Google News RSS search term
  crimeQuery:  string;          // crime data search term
  resources:   { label: string; url: string; desc: string }[];
}

export const PORTALS: Record<string, PortalConfig> = {
  wilmington: {
    id:        "wilmington",
    name:      "Wilmington Assistant",
    type:      "city",
    city:      "Wilmington",
    state:     "NC",
    fullName:  "Wilmington, NC",
    tagline:   "NAVI for Wilmington",
    branding:  { primaryColor: "#0B3C5D", accentColor: "#1E90FF" },
    homeCards: ["Find Job", "Find Housing", "Get Food", "Stay Safe"],
    features:  ["jobs", "housing", "foodIntel", "trades", "legalRights", "policeAccountability"],
    partners:  ["Schmaders 910", "7 Birds Co."],
    newsQuery: "Wilmington NC",
    crimeQuery: "Wilmington NC",
    resources: [
      { label: "City of Wilmington", url: "https://www.wilmingtonnc.gov/", desc: "Official city government" },
      { label: "Wilmington Police Dept", url: "https://www.wilmingtonnc.gov/departments/police", desc: "Local law enforcement" },
      { label: "New Hanover County DSS", url: "https://health.nhcgov.com/", desc: "Social services & benefits" },
      { label: "Cape Fear Community College", url: "https://cfcc.edu/", desc: "Workforce training & education" },
      { label: "Wilmington Housing Authority", url: "https://www.wha.net/", desc: "Public housing & Section 8" },
    ],
  },
  atlanta: {
    id:        "atlanta",
    name:      "Atlanta Assistant",
    type:      "city",
    city:      "Atlanta",
    state:     "GA",
    fullName:  "Atlanta, GA",
    tagline:   "NAVI for Atlanta",
    branding:  { primaryColor: "#1a1a2e", accentColor: "#ef4444" },
    homeCards: ["Find Job", "Find Housing", "Get Food", "Stay Safe"],
    features:  ["jobs", "housing", "foodIntel", "trades"],
    partners:  [],
    newsQuery: "Atlanta GA",
    crimeQuery: "Atlanta GA",
    resources: [
      { label: "City of Atlanta", url: "https://www.atlantaga.gov/", desc: "Official city government" },
      { label: "Atlanta Workforce Development", url: "https://www.atlantaga.gov/government/mayor-s-office/workforce-development", desc: "Job training programs" },
    ],
  },
  charlotte: {
    id:        "charlotte",
    name:      "Charlotte Assistant",
    type:      "city",
    city:      "Charlotte",
    state:     "NC",
    fullName:  "Charlotte, NC",
    tagline:   "NAVI for Charlotte",
    branding:  { primaryColor: "#0d1b2a", accentColor: "#a855f7" },
    homeCards: ["Find Job", "Find Housing", "Get Food", "Stay Safe"],
    features:  ["jobs", "housing", "foodIntel", "trades"],
    partners:  [],
    newsQuery: "Charlotte NC",
    crimeQuery: "Charlotte NC",
    resources: [
      { label: "City of Charlotte", url: "https://www.charlottenc.gov/", desc: "Official city government" },
      { label: "Charlotte Works", url: "https://www.charlotteworks.com/", desc: "Workforce development" },
    ],
  },
};

/**
 * Detect portal from URL search params.
 * Returns null if no portal is active.
 */
export function detectPortal(): PortalConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const portalId = params.get("portal")?.toLowerCase().trim();
    if (portalId && PORTALS[portalId]) return PORTALS[portalId];

    // Also check pathname: /wilmington → portal=wilmington
    const path = window.location.pathname.replace(/^\//, "").toLowerCase().trim();
    if (path && PORTALS[path]) return PORTALS[path];
  } catch { /* ignore */ }
  return null;
}
