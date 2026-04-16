/**
 * One-time intro tracking — localStorage-backed.
 *
 * Each cinematic NAVI intro overlay (Partners, News Web, NaviTV, Library,
 * future ones) should check hasSeenIntro(key) before opening. If the user
 * has already seen it, open the real content directly and skip the intro.
 *
 * Mark an intro as seen the moment it is shown — that way even if the user
 * taps away or force-quits, we don't nag them again.
 *
 * Users can reset everything via resetAllIntros() from a dev/debug button.
 */

const PREFIX = "navi-intro-";

function safeLS(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function hasSeenIntro(key: string): boolean {
  // SSR / unavailable storage: treat as "already seen" so we never flash an
  // intro during hydration or on a privacy-locked browser.
  const ls = safeLS();
  if (!ls) return true;
  try {
    return ls.getItem(PREFIX + key) === "1";
  } catch {
    return true;
  }
}

export function markIntroSeen(key: string): void {
  const ls = safeLS();
  if (!ls) return;
  try {
    ls.setItem(PREFIX + key, "1");
  } catch { /* quota or unavailable — ignore */ }
}

export function resetAllIntros(): void {
  const ls = safeLS();
  if (!ls) return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => ls.removeItem(k));
  } catch { /* ignore */ }
}
