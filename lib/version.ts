/**
 * NAVI — Stable Build Version
 *
 * This file is the single source of truth for the current build version.
 * Update ONLY when a new stable build is formally approved.
 *
 * Stable Build v1.0 — Locked
 * Tagged: v1.0-stable
 * Date:   2026-04-11
 */

export const BUILD_VERSION  = "1.0.0";
export const BUILD_LABEL    = "Stable Build v1.0 – Locked";
export const BUILD_DATE     = "2026-04-11";
export const BUILD_CHANNEL  = "production";

/** All features confirmed working at this version. */
export const STABLE_FEATURES = [
  "navi-core-ui",
  "work-with-us-services",
  "logo-generator",
  "email-routing",
  "subscription-pro",
  "voice-system",
  "settings-tabs",
  "business-plan-builder",
  "podcast-partnership",
  "diagnostic-auto-recovery",
] as const;
