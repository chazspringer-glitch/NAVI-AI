# NAVI — Claude Code Project Rules

## Current Build

**Stable Build v1.0 – Locked**  
Tagged: `v1.0-stable` · Branch: `claude/ai-tamagotchi-app-nuRbL`

---

## ⚠️ CRITICAL RULES — READ BEFORE EVERY CHANGE

### What you MUST NOT do

- DO NOT rewrite entire files
- DO NOT restructure navigation or layouts
- DO NOT refactor code that was not explicitly requested
- DO NOT change UI unless the user explicitly requests it
- DO NOT rename or relocate working components
- DO NOT modify `app/page.tsx` global structure (state declarations, tab system, overlay order)
- DO NOT add global handlers that override individual service logic
- DO NOT introduce shared mutable state between independent service panels

### What you MUST do

- Only modify the specific file/feature the user asked about
- Make additive changes only — add new code alongside existing code
- Preserve all existing props, exports, and function signatures
- Run `npx tsc --noEmit --skipLibCheck` before every commit; fix all errors
- Test that null/undefined guards exist on every service panel boundary
- Wrap every new service action in try/catch

---

## Protected Systems (do not break)

| System | File(s) | Notes |
|--------|---------|-------|
| NAVI core UI | `app/page.tsx`, `components/NaviFace.jsx`, `components/NaviOrb.tsx` | Orb, layout, HUD — no visual changes |
| Work With Us services | `components/ClientOnboardingPanel.jsx` | All service forms, stable chat flow |
| Logo Generator | `components/LogoGeneratorPanel.jsx` | Voice props intact, generation flow stable |
| Email routing | `lib/emailConfig.ts`, all `app/api/*/route.ts` | Always import EMAIL_RECEIVER — never hardcode addresses |
| Subscription system | `components/SubscriptionPanel.jsx` | NAVI PRO gating logic |
| Voice system | `app/page.tsx` voice hooks | Locked behind PRO / Founder mode |
| Settings tabs | `app/page.tsx` hubTab state | `"home"|"partners"|"truth"|"rewards"|"subscription"|"programs"|"founders"|"podcast"` |
| Business Plan Builder | `components/BusinessPlanBuilder.jsx`, `components/BusinessPlanCard.jsx`, `app/api/business-plan/route.ts` | 18-section Springer Industries framework |
| Podcast Partnership | `components/PodcastPanel.jsx`, `app/api/podcast-application/route.ts` | 7-question NAVI form |
| Error boundaries | `components/ServiceErrorBoundary.jsx`, `components/DiagnosticProvider.tsx` | Must remain wrapping all service panels |
| Diagnostics | `lib/diagnostics.ts`, `app/api/alert/route.ts` | Auto-recovery system — do not disable |

---

## Email Stability Rule

**Never hardcode an email address in any file.**  
Always import from `lib/emailConfig.ts`:

```typescript
import { EMAIL_RECEIVER } from "@/lib/emailConfig";
// EMAIL_RECEIVER = "springerindustry@gmail.com"
```

---

## Service Panel Rules

Each service panel must be fully isolated:

- No shared mutable state between panels
- No `onRegisterVoiceHandler` on `ClientOnboardingPanel` (voice props stripped)
- All array fields from API responses must be guarded: `Array.isArray(x) && x.length > 0`
- Null guard for `service` prop must come **after** all hooks
- `useCallback` deps must use optional chaining for nullable values: `service?.title`

---

## Future Update Protocol

1. Read the specific file being changed before editing
2. Make the smallest possible change that achieves the goal
3. Run TypeScript check
4. Commit with a descriptive message
5. Push to `claude/ai-tamagotchi-app-nuRbL`
6. Do NOT create a pull request unless the user explicitly asks
