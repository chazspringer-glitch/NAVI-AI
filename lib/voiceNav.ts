/**
 * NAVI Voice Navigation — Service Intent Routing
 *
 * Maps spoken commands to onboarding service routes so hands-free
 * users can open Logo Generator, Websites, etc. by voice.
 * Consumed by handleSpeechResultStable in app/page.tsx.
 */

export interface ServiceRoute {
  /** Matches the `title` field in the SERVICES array in page.tsx */
  title:    string;
  icon:     string;
  desc:     string;
  subject:  string;
  patterns: string[];
}

export const SERVICE_VOICE_ROUTES: ServiceRoute[] = [
  {
    title:   "Logo Generator",
    icon:    "🎨",
    desc:    "Create high-quality logos for your business instantly.",
    subject: "Logo Generator",
    patterns: [
      "logo", "create a logo", "make a logo", "design a logo", "brand logo",
      "logo design", "logo generator", "need a logo", "i need a logo",
      "build a logo", "get a logo",
    ],
  },
  {
    title:   "Websites",
    icon:    "🌐",
    desc:    "High-converting landing pages and sites built fast with modern tools.",
    subject: "Websites & Landing Pages",
    patterns: [
      "website", "build a website", "create a website", "make a website",
      "landing page", "web design", "i need a website", "need a website",
      "build my website", "web page",
    ],
  },
  {
    title:   "Social Media",
    icon:    "📱",
    desc:    "Daily content, scheduling & community management across all platforms.",
    subject: "Social Media Management",
    patterns: [
      "social media", "instagram help", "tiktok help", "social media management",
      "social content", "post content", "content strategy", "manage my social",
    ],
  },
  {
    title:   "AI Agents",
    icon:    "🤖",
    desc:    "Intelligent agents working for your business 24/7 without breaks.",
    subject: "AI Agents",
    patterns: [
      "ai agent", "ai agents", "build an agent", "automation agent",
      "chatbot", "intelligent agent", "build me an agent",
    ],
  },
  {
    title:   "Automation",
    icon:    "⚙️",
    desc:    "Custom workflows and automations that save you time and money.",
    subject: "Automated Systems",
    patterns: [
      "automation", "workflow automation", "automate my business",
      "automated systems", "process automation", "automate my workflow",
    ],
  },
  {
    title:   "Consulting",
    icon:    "📊",
    desc:    "Strategy sessions to grow your revenue and digital presence.",
    subject: "Marketing Consulting",
    patterns: [
      "consulting", "strategy session", "marketing strategy",
      "grow my business", "business consulting", "marketing advice",
    ],
  },
  {
    title:   "Brand Package",
    icon:    "💎",
    desc:    "Identity, logos, color systems — a complete brand built for impact.",
    subject: "Brand Package",
    patterns: [
      "brand package", "branding", "brand identity", "brand design",
      "complete brand", "brand kit", "brand my business", "full branding",
    ],
  },
  {
    title:   "Copywriting",
    icon:    "✍️",
    desc:    "Persuasive copy for ads, emails, websites, and sales funnels.",
    subject: "Copywriting",
    patterns: [
      "copywriting", "write copy", "ad copy", "email copy",
      "sales copy", "write my ads", "write my website", "need copy",
    ],
  },
  {
    title:   "Targeted Ads",
    icon:    "🎯",
    desc:    "Data-driven campaigns that reach the right audience at the right time.",
    subject: "Targeted Ads",
    patterns: [
      "targeted ads", "run ads", "paid ads", "facebook ads",
      "google ads", "advertising campaign", "ad campaign", "run my ads",
    ],
  },
  {
    title:   "AI Content",
    icon:    "🎬",
    desc:    "AI-powered video, audio & visuals that stop the scroll and convert.",
    subject: "AI Commercials / Content",
    patterns: [
      "ai content", "content creation", "video content", "ai video",
      "create content", "brand video", "ai commercial", "make content",
    ],
  },
];

/**
 * Match a spoken command to a service route.
 * Returns the matched ServiceRoute or null.
 */
export function matchServiceRoute(text: string): ServiceRoute | null {
  const lower = text.toLowerCase().trim();
  for (const route of SERVICE_VOICE_ROUTES) {
    if (route.patterns.some((p) => lower.includes(p))) {
      return route;
    }
  }
  return null;
}
