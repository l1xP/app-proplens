# PropLens - Singapore Property Investment Analysis - Handover Document

**Project Status:** Core functionality complete, calculation formulas need validation  
**Last Updated:** May 30, 2026  
**Maintained By:** Development Team  

---

## Quick Start

### For Developers

```bash
# Clone and install
git clone <repository-url>
cd project
npm install

# Setup environment
cp .env.example .env
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Run development server
npm run dev

# Build for production
npm run build
```

### For AI Agents / New Tools

This project is a React + TypeScript + Supabase application for Singapore property investment analysis.

**Key Files:**
- `src/lib/calculations.ts` - All financial formulas
- `src/types/database.ts` - TypeScript interfaces
- `src/pages/Dashboard.tsx` - Main entry after login
- `src/components/evaluations/EvaluationForm.tsx` - Multi-step wizard

---

## Known Issues

### 1. Exit PSF Calculation Needs Validation

**Issue:** The exit scenario calculations may not match the original spreadsheet values.

**Current Formula (Compound Growth):**
```typescript
Exit PSF = Purchase PSF × (1 + Growth Rate)^Years
```

**Example:**
- Purchase Price: $1,010,000
- Size: 1,830 sqft
- Purchase PSF: $551.91
- Conservative Growth: 3% for 3 years
- **Current Result:** Exit PSF = $603.09
- **Expected Result:** Exit PSF = $714.61 (approximately 9% growth needed)

**Action Required:**
1. Validate formula against original spreadsheet
2. Check if growth rates are annual or total
3. Verify if there are additional factors (inflation, market adjustments)
4. Update `calculateScenario()` in `src/lib/calculations.ts`

**File to Modify:** `/src/lib/calculations.ts` (lines 228-265)

---

## Application Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | UI components |
| Build Tool | Vite | Fast bundler |
| Styling | Tailwind CSS | Utility-first CSS |
| Backend | Supabase | PostgreSQL + Auth + RLS |
| Charts | Recharts | Trend line visualization |
| Icons | Lucide React | Icon library |

### Directory Structure

```
src/
├── components/
│   ├── auth/              # Login/Register forms
│   ├── common/            # Layout, Chart, shared UI
│   └── evaluations/       # Evaluation form
├── hooks/                 # useAuth context
├── lib/
│   ├── calculations.ts   # ⚠️ All financial formulas
│   └── supabase.ts        # Database client
├── pages/
│   ├── Dashboard.tsx      # Evaluation list
│   ├── CreateEvaluation.tsx
│   ├── EvaluationDetail.tsx
│   └── Comparison.tsx
└── types/
    └── database.ts        # TypeScript interfaces
```

---

## Database Schema

### Tables

**1. `evaluations`** - Main data table
- Links to `auth.users` via `user_id`
- All property and financial details
- RLS: Users only see their own evaluations

**2. `tax_formulas`** - Configurable tax rates
- BSD and ABSD rate tables
- JSON format for flexibility
- RLS: Read-only for authenticated users

**3. `user_roles`** - Admin permissions
- Manages admin access
- RLS: Own role visible, admin manages all

### Row Level Security

All tables have RLS enabled:
- Users can only CRUD their own evaluations
- Tax formulas are readable by all authenticated users
- Only service role can update tax_formulas

---

## Core Business Logic

### Calculation Engine

Located in: `/src/lib/calculations.ts`

#### Functions:

| Function | Purpose | Status |
|----------|---------|--------|
| `calculateBSD()` | Buyer Stamp Duty (tiered) | ✅ Complete |
| `calculateABSD()` | Additional BSD | ✅ Complete |
| `calculateGST()` | GST (9% for Ind/Comm) | ✅ Complete |
| `calculateSuggestedLTV()` | Max loan % | ✅ Complete |
| `calculateMonthlyMortgage()` | PMT formula | ✅ Complete |
| `calculateOutstandingLoan()` | Amortization | ✅ Complete |
| `calculateMonthlyPocketMoney()` | Rental - Expenses | ✅ Complete |
| `calculateScenario()` | Exit calculations | ⚠️ Needs validation |
| `calculateEvaluation()` | Main orchestrator | ⚠️ Depends on above |

#### Key Calculation Rules:

**CRITICAL:**
1. **GST on Residential = $0** (never charge GST)
2. **GST Refund:** Only for GST-registered buyers (not Individual)
3. **Exit PSF** must use compound growth: `(1 + r)^n`
4. **Investable Decision:** ROI ≥ 3% in ≥ 3 scenarios

**BSD Tiers (IRAS):**
```
$0 - $180K: 1%
$180K - $360K: 2%
$360K - $1M: 3%
$1M - $1.5M: 4%
$1.5M - $3M: 5%
Above $3M: 6%
```

**LTV Rules:**
- Individual + Residential = 75%
- Individual + Ind/Comm = 80%
- IHC = 80%
- Operating = 90%

---

## User Flow

### Authentication Flow

```
1. User registers/logs in (Supabase Auth)
   ↓
2. Session created (7 days)
   ↓
3. Redirect to Dashboard
   ↓
4. If session expired → Login page
```

### Evaluation Flow

```
Dashboard
    ↓ [Create New Evaluation]
Multi-step Form:
    Step 1: Property Details
    Step 2: Loan Terms
    Step 3: Costs
    Step 4: Rental Info
    Step 5: JV Structure (CI/DM/LB)
    Step 6: Growth Scenarios
    ↓ [Calculate & Save]
Evaluation Detail View
    ↓ [Toggle between Plan Exit Year / Year-on-Year]
Results with charts and tables
```

### Comparison Flow

```
Dashboard
    ↓ [Select 2+ evaluations via checkboxes]
    ↓ [Compare button]
Comparison View
    - Side-by-side metrics
    - ROI comparison
    - Best opportunity highlighted
```

---

## Common Modifications

### Update BSD/ABSD Rates

When tax regulations change:

```sql
-- Connect to Supabase SQL Editor
UPDATE tax_formulas
SET formula_config = '[
  {"min": 0, "max": 200000, "rate": 0.01},
  ...
]'::jsonb, updated_at = now()
WHERE formula_type = 'BSD' AND formula_name = 'standard';
```

### Fix Exit PSF Calculation

**Current formula (line ~240 in calculations.ts):**
```typescript
const purchasePSF = evaluation.purchase_price / evaluation.size_sqft
const exitPSF = purchasePSF * Math.pow(1 + growthRate, exitYear)
```

**If formula needs adjustment:**
1. Check if growth rate is annual vs. total period
2. Verify against Woodlands 11 spreadsheet example
3. Update `calculateScenario()` function
4. Update Year-on-Year calculations in EvaluationDetail.tsx

### Add New Input Field

1. Add column to database (migration):
```sql
ALTER TABLE evaluations ADD COLUMN new_field_name type DEFAULT value;
```

2. Update TypeScript type: `/src/types/database.ts`

3. Add to form: `/src/components/evaluations/EvaluationForm.tsx`

4. Use in calculations: `/src/lib/calculations.ts`

5. Display in results: `/src/pages/EvaluationDetail.tsx`

---

## Testing Checklist

### Manual Testing

**Authentication:**
- [ ] Register new account
- [ ] Login with correct credentials
- [ ] Logout clears session
- [ ] Session persists across refresh

**Evaluation CRUD:**
- [ ] Create new evaluation (all fields)
- [ ] Save as draft (partial data)
- [ ] Edit existing evaluation
- [ ] Duplicate evaluation
- [ ] Delete evaluation (with confirmation)

**Calculations:**
- [ ] BSD matches IRAS calculator
- [ ] GST is $0 for Residential
- [ ] LTV suggestion correct per profile
- [ ] Mortgage matches bank quote
- [ ] Exit PSF calculations match spreadsheet
- [ ] ROI calculations correct
- [ ] Investable decision logic works

**Comparison:**
- [ ] Select multiple evaluations
- [ ] Compare view shows all scenarios
- [ ] Best ROI highlighted

**Dashboard:**
- [ ] List shows all evaluations
- [ ] Search works
- [ ] Filters work
- [ ] Status badges correct

### Edge Cases

- [ ] Zero interest rate
- [ ] Negative growth rates
- [ ] Solo investment (CI=100%)
- [ ] GST-registered buyer refund
- [ ] Very high purchase prices

---

## Environment Variables

```bash
# Required
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Optional (future)
VITE_APP_ENV=development|production
```

**Security:**
- Never commit .env file
- ANON_KEY is safe for frontend
- Service role key is server-side only

---

## Troubleshooting

### Blank screen after login

**Cause:** Missing import (e.g., Building2 icon was missing)

**Fix:** Check browser console for React errors, verify all imports exist

### Evaluations not loading

**Cause:** RLS policy issue or auth session expired

**Debug:**
```typescript
// In Dashboard.tsx
console.log('User:', user)
console.log('Session:', session)
```

**Check:**
- User is authenticated
- RLS policies enabled
- Supabase connection working

### Calculation mismatch

**Cause:** Formula different from spreadsheet

**Debug:**
```typescript
// In calculations.ts
console.log('Purchase PSF:', purchasePSF)
console.log('Exit PSF:', exitPSF)
console.log('Selling Price:', sellingPrice)
```

**Fix:** Update formula in `calculateScenario()`

### Charts not rendering

**Cause:** Data not passed correctly to Recharts

**Check:**
- Evaluation prop exists
- initialInvestmentWithoutGST calculated
- ResponsiveContainer has height

---

## Performance Notes

### Bundle Size

Current: ~700KB (gzipped: ~200KB)

**Warnings:**
- Recharts adds significant size
- Consider code-splitting by route

**Improvements:**
```typescript
// Lazy load charts
const TrendLineChart = lazy(() => import('./TrendLineChart'))
```

### Database Queries

All queries use Supabase client with automatic RLS filtering.

**Optimize:**
- `select('*')` retrieves all columns - consider specifying
- Add indexes for frequently queried fields
- Use pagination for large lists

---

## Future Enhancements

### Planned (Not Yet Implemented)

**Phase 3 - Interactive Sliders:**
- Real-time recalculation
- Debounced input
- Slider controls for key variables

**Phase 5 - Export:**
- PDF generation (jsPDF or react-pdf)
- Excel export (xlsx library)
- Formula preservation in Excel

**Phase 6 - Admin Panel:**
- Formula management UI
- Role management
- Audit logs

### Known Technical Debt

1. **Bundle size:** Recharts is large, consider alternatives
2. **Type safety:** Some `any` types in calculations
3. **Error handling:** Toasts not implemented
4. **Validation:** Form validation could be stricter
5. **Tests:** No unit tests yet

---

## Key Decisions & Context

### Why Compound Growth?

The PRD specifies: "Exit PSF = Purchase PSF × (1 + Growth Rate)^N"

This is standard compound growth formula for property appreciation.

**Alternative (Linear):** `Purchase PSF × (1 + Growth Rate × N)` - NOT used

### Why GST Excludes Residential?

Singapore tax law: Residential properties are exempt from GST. This is hardcoded in `calculateGST()`.

### Why Supabase?

- Free tier sufficient for expected load
- Built-in Auth removes complexity
- RLS provides security without custom backend
- PostgreSQL for calculation precision (DECIMAL type)

### Why Vite?

- Fast HMR for development
- Better performance than CRA
- Native TypeScript support

---

## Developer Handoff Checklist

When handing off this project:

- [ ] Provide access to Supabase dashboard
- [ ] Share original spreadsheet with correct values
- [ ] Document any verbal requirements
- [ ] Share Vercel deployment access
- [ ] Transfer domain ownership (if any)
- [ ] Archive and share design files
- [ ] Provide login for existing accounts

---

## Support & Resources

### Documentation

- README.md - Technical details
- PRD markdown file - Requirements
- Supabase docs: https://supabase.com/docs

### External Tools

- IRAS BSD Calculator: https://www.iras.gov.sg/taxes/stamp-duty/for-property
- IRAS ABSD Rates: https://www.iras.gov.sg/taxes/stamp-duty/for-property/additional-buyer-s-stamp-duty-(absd)

### Contacts

- Product Owner: [Contact details]
- Original Developer: [Contact details]
- Supabase Support: https://supabase.com/support

---

## Appendix: Sample Data

### Woodlands 11 Example

```typescript
{
  property_name: "Woodlands 11",
  property_address: "11 Woodlands Close #05-52",
  property_type: "Industrial",
  size_sqft: 1830,
  purchase_price: 1010000,
  loan_interest_rate: 0.025,
  loan_tenure_years: 30,
  downpayment_percent: 0.20,
  rental_current: 8500,
  property_tax_monthly: 200,
  mcst_monthly: 300,
  ci_percent: 0.40,
  dm_percent: 0.30,
  lb_percent: 0.30,
  plan_exit_year: 3,
  conservative_growth: 0.03,
  baseline_growth: 0.04,
  target_growth: 0.05,
  aggressive_growth: 0.06,
}
```

**Expected Results:**
- Purchase PSF: $551.91
- Conservative Exit PSF (3yr, 3%): ~$603 (verify against spreadsheet)
- Target Exit PSF (3yr, 5%): ~$639
- Aggressive Exit PSF (3yr, 6%): ~$657

**TODO:** Get actual expected values from spreadsheet to validate.

---

## Changelog

### v1.0.0 - May 30, 2026

**Completed:**
- Database schema with RLS
- Authentication (register, login, logout)
- Evaluation CRUD (create, read, update, delete, duplicate)
- Dashboard with search and filters
- BSD/ABSD/GST calculations
- LTV suggestions
- Mortgage calculation
- Exit scenario calculations (needs validation)
- Investable decision logic
- Side-by-side comparison
- Trend line chart
- Dark theme UI

**Pending Validation:**
- Exit PSF calculations against original spreadsheet
- ROI values match expected outputs
- Pocket money calculations

**Known Issues:**
- Exit PSF calculation needs verification (see Known Issues section)

---

**Document Version:** 1.0  
**Status:** Ready for Handover
