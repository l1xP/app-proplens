# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server at localhost:5173
npm run build      # production build
npm run typecheck  # tsc --noEmit (no emit, just check)
npm run lint       # eslint
npm run preview    # preview production build
```

No test suite. Validation is manual against known spreadsheet values (see HANDOVER.md).

## Environment

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Architecture

React 18 + TypeScript SPA (Vite). **No React Router** — navigation is state-based in `App.tsx` via `view` enum (`dashboard | evaluation | create | edit | comparison`) with `window.history.pushState` for URL updates. `AuthProvider` wraps the entire app; unauthenticated users see login/register forms.

Backend: Supabase (PostgreSQL + Auth + Row Level Security). All DB calls use the Supabase JS client in `src/lib/supabase.ts`. RLS ensures users only access their own `evaluations` rows.

### Key files

| File | Role |
|------|------|
| `src/lib/calculations.ts` | All financial formulas — modify here for any calc change |
| `src/types/database.ts` | TypeScript interfaces mirroring DB schema |
| `src/components/evaluations/EvaluationForm.tsx` | Multi-step input wizard + default values |
| `src/pages/EvaluationDetail.tsx` | Results display, year-on-year table |
| `src/pages/Dashboard.tsx` | List, search, filter, comparison selection |
| `src/hooks/useAuth.tsx` | Auth context (user, session, signOut) |

### Adding a new field (canonical pattern)

1. DB migration in `supabase/migrations/`
2. Update type in `database.ts`
3. Add input in `EvaluationForm.tsx`
4. Update `calculateEvaluation()` in `calculations.ts`
5. Display in `EvaluationDetail.tsx`

## Critical calculation rules

**Exit PSF — compound growth only:**
```typescript
// CORRECT
const exitPSF = purchasePSF * Math.pow(1 + growthRate, exitYear)
// WRONG — do not use
const exitPSF = purchasePSF * (1 + growthRate * exitYear)
```

**GST — Residential always zero:**
```typescript
if (propertyType === 'Residential') return 0  // always, regardless of flags
```

**GST refund — Individual lb_profile cannot be GST-registered:**
```typescript
if (lbProfile === 'Individual') return 0
```

**Investable decision (ROI ≥ 3% threshold):**
- 4 passing scenarios → "Resounding Pass"
- 3 → "Proceed"
- 2 → "Proceed with Caution"
- 0–1 → "Resounding No"

**LTV by profile:**
- Individual + Residential = 75%; Individual + Ind/Comm = 80%
- IHC = 80%; Operating = 90%

**BSD tiers (IRAS, progressive):** 0–180K@1%, 180K–360K@2%, 360K–1M@3%, 1M–1.5M@4%, 1.5M–3M@5%, >3M@6%

## Known issue

Exit PSF calculation in `calculateScenario()` (`calculations.ts` ~line 240) needs validation against the original spreadsheet. The compound formula is structurally correct but the expected vs. actual values diverge — growth rate interpretation may be off. See HANDOVER.md "Known Issues" for details.

## Data model notes

Three tables: `evaluations` (user data, RLS per user), `tax_formulas` (BSD/ABSD config as JSONB, readable by all authenticated users), `user_roles` (admin flag). Tax formulas are updated via SQL, not UI (admin panel is a future feature).

JV structure: CI (Cash Investor) + DM (Deal Maker) + LB (Loan Bearer) percentages must sum to 100%. Solo investment = CI 100%.

Initial investment denominator for ROI = downpayment + all fees, **excluding** GST (because GST may be refundable). This "without GST" variant is threaded through calculations as `initialInvestmentWithoutGST`.
