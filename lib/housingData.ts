/**
 * Free geocoding via OpenStreetMap Nominatim.
 * No API key required. Rate limit: 1 req/sec.
 */
export interface GeoResult {
  lat: number;
  lon: number;
  displayName: string;
  city: string;
  state: string;
}

export async function geocode(query: string): Promise<GeoResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "NAVI-AI/1.0 (housing-finder)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.[0]) return null;
    const r = data[0];
    return {
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      displayName: r.display_name || query,
      city: r.address?.city || r.address?.town || r.address?.village || query,
      state: r.address?.state || "",
    };
  } catch {
    return null;
  }
}

/**
 * Build real search URLs for housing sites based on location and budget.
 */
export function buildHousingLinks(location: string, maxRent: number, bedrooms: string) {
  const loc = encodeURIComponent(location.trim());
  const locSlug = location.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  // Craigslist city slug — approximate, works for most US cities
  const clCity = location.trim().toLowerCase().split(",")[0].replace(/\s+/g, "").replace(/[^a-z]/g, "");
  const brParam = bedrooms !== "any" && bedrooms !== "studio" ? `&min_bedrooms=${bedrooms}&max_bedrooms=${bedrooms}` : "";

  return {
    craigslist: `https://${clCity}.craigslist.org/search/apa?max_price=${maxRent}${brParam}#search=1~list~0~0`,
    zillow: `https://www.zillow.com/homes/for_rent/${loc}_rb/0-${maxRent}_mp/`,
    apartmentsCom: `https://www.apartments.com/${locSlug}/max-${maxRent}-monthly/`,
    affordableHousing: `https://affordablehousingonline.com/housing-search/${loc}`,
    hudCounseling: "https://www.hud.gov/findacounselor",
    hudPHA: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts",
    section8: `https://www.gosection8.com/place/rentals/${loc}`,
    call211: "tel:211",
  };
}

/**
 * Static dataset of major US housing assistance programs.
 * Real organizations, real contact info.
 */
export const NATIONAL_PROGRAMS = [
  {
    name: "Section 8 Housing Choice Voucher",
    type: "section_8",
    desc: "Federal program that pays a portion of your rent. Apply through your local Public Housing Authority (PHA).",
    url: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts",
    action: "Find your local PHA and apply",
  },
  {
    name: "Emergency Rental Assistance (ERA)",
    type: "emergency",
    desc: "Federal funds for renters behind on rent due to hardship. Covers back rent and utilities.",
    url: "https://home.treasury.gov/policy-issues/coronavirus/assistance-for-state-local-and-tribal-governments/emergency-rental-assistance-program",
    action: "Check if your state still has ERA funds",
  },
  {
    name: "Habitat for Humanity",
    type: "nonprofit",
    desc: "Helps qualifying families build and buy affordable homes with 0% interest mortgages.",
    url: "https://www.habitat.org/housing-help",
    action: "Apply at your local Habitat affiliate",
  },
  {
    name: "211 Helpline",
    type: "emergency",
    desc: "Free national helpline connecting you to local shelters, food banks, utility assistance, and housing.",
    url: "tel:211",
    action: "Call or text 211 now for immediate help",
  },
  {
    name: "HUD Housing Counseling",
    type: "nonprofit",
    desc: "Free, HUD-certified counselors help with renting, buying, foreclosure prevention, and credit.",
    url: "https://www.hud.gov/findacounselor",
    action: "Find a free counselor near you",
  },
  {
    name: "Low Income Home Energy Assistance (LIHEAP)",
    type: "nonprofit",
    desc: "Helps pay heating/cooling bills. Frees up budget for rent.",
    url: "https://www.acf.hhs.gov/ocs/programs/liheap",
    action: "Apply through your state LIHEAP office",
  },
];
