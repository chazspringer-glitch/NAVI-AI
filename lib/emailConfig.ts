/**
 * NAVI Email Configuration — Single Source of Truth
 *
 * All service submissions, work orders, and logo deliveries route to
 * EMAIL_RECEIVER. Import this constant in every API route that sends email.
 *
 * ⚠ STABILITY RULE: Never hardcode an email address in any route or component.
 *   Always reference EMAIL_RECEIVER from this file so a single change here
 *   propagates to every service automatically.
 */
export const EMAIL_RECEIVER = "springerindustry@gmail.com";
