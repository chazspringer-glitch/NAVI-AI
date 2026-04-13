/**
 * NAVI System Health — Feature Manifest
 *
 * This file is the authoritative inventory of all protected features.
 * It is consumed by the admin SystemHealthPanel and serves as living
 * documentation of what exists and how each feature is guarded.
 *
 * ⚠ STABILITY RULE: Features listed here must NEVER be removed without
 * updating this manifest. Any refactor must preserve feature behavior.
 */

// ── Owner email — single source of truth in lib/emailConfig ─────────────────
import { EMAIL_RECEIVER } from "@/lib/emailConfig";
export { EMAIL_RECEIVER as OWNER_EMAIL };
const OWNER_EMAIL = EMAIL_RECEIVER; // local alias for use within this file

// ── Environment variable registry ────────────────────────────────────────────
export const ENV_VARS = [
  {
    key:      "OPENAI_API_KEY",
    label:    "OpenAI API Key",
    usedBy:   ["Chat API", "Logo Generator", "Onboarding Work Order", "All Resource Finders"],
    required: true,
  },
  {
    key:      "ELEVENLABS_API_KEY",
    label:    "ElevenLabs API Key",
    usedBy:   ["NAVI Voice TTS"],
    required: false,
    note:     "Required for voice. PRO or Founder access only.",
  },
  {
    key:      "EMAILJS_SERVICE_ID",
    label:    "EmailJS Service ID",
    usedBy:   ["Work Order Delivery", "Logo Delivery"],
    required: false,
    note:     "All emails route to " + OWNER_EMAIL,
  },
  {
    key:      "EMAILJS_TEMPLATE_ID",
    label:    "EmailJS Template ID",
    usedBy:   ["Work Order Delivery", "Logo Delivery"],
    required: false,
  },
  {
    key:      "EMAILJS_PUBLIC_KEY",
    label:    "EmailJS Public Key",
    usedBy:   ["Work Order Delivery", "Logo Delivery"],
    required: false,
  },
] as const;

// ── Feature manifest ──────────────────────────────────────────────────────────
export interface FeatureEntry {
  id:          string;
  name:        string;
  description: string;
  accessGate:  "public" | "pro" | "founder" | "pro_or_founder";
  storageKey?: string;
  apiRoutes?:  string[];
  component?:  string;
  protected:   true;
}

export const FEATURE_MANIFEST: FeatureEntry[] = [
  {
    id:          "subscription",
    name:        "Subscription System",
    description: "Stripe payment link → PRO unlock. Persisted in localStorage ai-pet-pro. Cleared on Reset NAVI.",
    accessGate:  "public",
    storageKey:  "ai-pet-pro",
    component:   "SubscriptionPanel",
    protected:   true,
  },
  {
    id:          "voice",
    name:        "NAVI Voice (ElevenLabs TTS)",
    description: "Text-to-speech via ElevenLabs. Toggle in header. Only available to PRO subscribers or Founder.",
    accessGate:  "pro_or_founder",
    storageKey:  "ai-pet-voice",
    apiRoutes:   ["/api/tts"],
    protected:   true,
  },
  {
    id:          "founder_access",
    name:        "Founder / Admin Mode",
    description: "Triple-tap NaviOrb → passcode → full access. Persisted in ai-pet-admin. Disable button clears it.",
    accessGate:  "founder",
    storageKey:  "ai-pet-admin",
    protected:   true,
  },
  {
    id:          "email_intake",
    name:        "Email Intake System (EmailJS)",
    description: "All completed work orders auto-sent to springerindustry@gmail.com via EmailJS REST API.",
    accessGate:  "public",
    apiRoutes:   ["/api/onboard", "/api/generate-logo"],
    protected:   true,
  },
  {
    id:          "work_with_us",
    name:        "Work With Us — Client Onboarding",
    description: "Founders tab service cards → NAVI Q&A flow → work order + AI strategy generation.",
    accessGate:  "public",
    apiRoutes:   ["/api/onboard"],
    component:   "ClientOnboardingPanel",
    protected:   true,
  },
  {
    id:          "logo_generator",
    name:        "Logo Generator (DALL-E 3)",
    description: "NAVI-guided branding intake → 2 HD logo variations via DALL-E 3 → email delivery.",
    accessGate:  "public",
    apiRoutes:   ["/api/generate-logo"],
    component:   "LogoGeneratorPanel",
    protected:   true,
  },
  {
    id:          "stem_explorer",
    name:        "STEM Explorer (Kids Gamified)",
    description: "Interactive STEM lessons for kids. PRO-gated. XP rewards on level completion.",
    accessGate:  "pro_or_founder",
    component:   "StemPanel",
    protected:   true,
  },
  {
    id:          "ai_skills",
    name:        "AI Skills Lab (Adult Structured)",
    description: "Structured AI literacy lessons for adults. PRO-gated. Lesson chat API.",
    accessGate:  "pro_or_founder",
    apiRoutes:   ["/api/lesson-chat"],
    component:   "AiSkillsPanel",
    protected:   true,
  },
  {
    id:          "housing_finder",
    name:        "Affordable Housing Finder",
    description: "AI-powered housing search + hub panel. PRO-gated.",
    accessGate:  "pro_or_founder",
    apiRoutes:   ["/api/housing"],
    component:   "HousingPanel",
    protected:   true,
  },
  {
    id:          "family_support",
    name:        "Family Support Finder",
    description: "GPS-assisted finder for free/low-cost youth programs. Community section. Public.",
    accessGate:  "public",
    apiRoutes:   ["/api/family-programs"],
    component:   "FamilySupportFinder",
    protected:   true,
  },
  {
    id:          "legal_rights",
    name:        "Legal Rights Guide",
    description: "Phase-based rights navigator (police, court, housing, family). Emergency contacts. Public.",
    accessGate:  "public",
    apiRoutes:   ["/api/legal-resources"],
    component:   "LegalRightsPanel",
    protected:   true,
  },
  {
    id:          "local_resources",
    name:        "Local Resource Finder",
    description: "AI finds local temp agencies, food banks, housing help, workforce centers. PRO-gated.",
    accessGate:  "pro_or_founder",
    apiRoutes:   ["/api/resources"],
    component:   "LocalResourceFinder",
    protected:   true,
  },
  {
    id:          "resume_builder",
    name:        "Resume Builder",
    description: "AI-guided resume creation. PRO-gated.",
    accessGate:  "pro_or_founder",
    component:   "ResumeBuilder",
    protected:   true,
  },
  {
    id:          "biz_plan_builder",
    name:        "Business Plan Builder",
    description: "AI-guided business plan generator. PRO-gated.",
    accessGate:  "pro_or_founder",
    component:   "BusinessPlanBuilder",
    protected:   true,
  },
  {
    id:          "homework_helper",
    name:        "Homework Helper",
    description: "Step-by-step tutoring — explains concepts without giving direct answers. PRO-gated.",
    accessGate:  "pro_or_founder",
    component:   "HomeworkHelper",
    protected:   true,
  },
  {
    id:          "springer_intro",
    name:        "Springer Industries Intro Overlay",
    description: "Cinematic intro on first-ever open of Work With Us tab. Persisted in workWithUsIntroSeen.",
    accessGate:  "public",
    storageKey:  "workWithUsIntroSeen",
    component:   "SpringerIntroOverlay",
    protected:   true,
  },
];

// ── Access gate labels ────────────────────────────────────────────────────────
export const GATE_LABELS: Record<FeatureEntry["accessGate"], string> = {
  public:         "Public",
  pro:            "PRO Only",
  founder:        "Founder Only",
  pro_or_founder: "PRO or Founder",
};

export const GATE_COLORS: Record<FeatureEntry["accessGate"], string> = {
  public:         "#4ade80",
  pro:            "#f59e0b",
  founder:        "#00d4ff",
  pro_or_founder: "#a78bfa",
};

// ── Storage keys inventory ────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  state:         "ai-pet-state",       // PetState: messages, bondXP, reminders, etc.
  gamif:         "ai-pet-gamif",       // GamifState: XP, missions, level
  levelRewards:  "ai-pet-lvl-rewards", // claimed level rewards
  voice:         "ai-pet-voice",       // "1" = voice on
  sound:         "ai-pet-sound",       // "1" = sound on
  admin:         "ai-pet-admin",       // "1" = founder/admin unlocked
  pro:           "ai-pet-pro",         // "1" = PRO subscriber
  workWithUsIntro: "workWithUsIntroSeen", // "1" = intro seen
} as const;

// ── Reset clears all of these ─────────────────────────────────────────────────
export const RESET_CLEARS: (keyof typeof STORAGE_KEYS)[] = [
  "state", "gamif", "levelRewards", "voice", "sound", "admin", "pro",
];
