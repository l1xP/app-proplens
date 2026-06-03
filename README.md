# PropLens - Singapore Property Investment Analysis

A sophisticated property investment analysis platform designed to replace spreadsheet workflows for evaluating Residential, Industrial, and Commercial properties in Singapore.

## Overview

This tool supports both solo and joint venture (JV) investment structures, calculates ROI across multiple growth scenarios, and provides sensitivity analysis. The primary output is comprehensive reports for sharing with investment partners.

### Purpose

Enable faster, more accurate property investment evaluation with:
- Structured data entry
- Automated calculations (BSD, ABSD, GST, mortgage, ROI)
- Easy comparison of multiple properties
- Professional reports for partner sharing

### Target Users

- Singapore-based property investors
- Evaluates Residential, Industrial, and Commercial properties
- Participates in joint venture deals OR invests solo
- Needs to share analysis with JV partners

### Tech Stack

- **Frontend**: React with TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS with custom dark theme
- **Charts**: Recharts

---

## Architecture

### System Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│  React Frontend │◄────►│  Supabase Auth   │      │   PostgreSQL    │
│  (Vercel)       │      │                  │      │   Database      │
│                 │      └──────────────────┘      │                 │
└─────────────────┘                                └─────────────────┘
         │                                                  ▲
         │                                                  │
         └──────────────────► Row Level Security ──────────┘
```

### Data Flow

1. **User Input** → Form validation → Database storage
2. **Calculation** → Retrieve stored data → Apply financial formulas → Display results
3. **Export** → Generate reports from stored data and calculations

### Authentication Flow

1. User registers/signs in with email + password (Supabase Auth)
2. Session maintained for 7 days
3. All API calls include authentication token
4. Row Level Security ensures data isolation per user

### Calculation Pipeline

```
Property Data → BSD/ABSD/GST → Total Costs → Initial Investment
                                    ↓
                              Loan Amount → Monthly Mortgage
                                    ↓
                              Rental - Expenses → Pocket Money
                                    ↓
          ┌────────────────────────┼────────────────────────┐
          ↓                        ↓                        ↓
    Conservative (3%)         Baseline (4%)            Target (5%)
          ↓                        ↓                        ↓
       Exit PSF                 Exit PSF                Exit PSF
          ↓                        ↓                        ↓
     Selling Price            Selling Price           Selling Price
          ↓                        ↓                        ↓
     Outstanding Loan         Outstanding Loan        Outstanding Loan
          ↓                        ↓                        ↓
      Net Capital              Net Capital             Net Capital
         Gain                     Gain                    Gain
          └────────────────────────┼────────────────────────┘
                                   ↓
                            Total Profit → ROI
```

---

## Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx           # User login UI
│   │   │   └── RegisterForm.tsx        # User registration UI
│   │   ├── common/
│   │   │   ├── Layout.tsx              # Page layout wrapper
│   │   │   └── TrendLineChart.tsx       # ROI trend visualization
│   │   └── evaluations/
│   │       └── EvaluationForm.tsx       # Multi-step evaluation form
│   ├── hooks/
│   │   └── useAuth.tsx                  # Authentication context
│   ├── lib/
│   │   ├── calculations.ts             # Financial calculation engine
│   │   └── supabase.ts                  # Database client
│   ├── pages/
│   │   ├── Comparison.tsx              # Side-by-side comparison
│   │   ├── CreateEvaluation.tsx         # New evaluation wizard
│   │   ├── Dashboard.tsx                # Evaluation list/dashboard
│   │   └── EvaluationDetail.tsx         # Single evaluation view
│   ├── types/
│   │   └── database.ts                 # TypeScript types from schema
│   ├── App.tsx                          # Main app component
│   ├── index.css                        # Global styles + Tailwind
│   └── main.tsx                         # App entry point
├── public/                              # Static assets
├── .env                                 # Environment variables
├── vite.config.ts                       # Vite configuration
├── tailwind.config.js                   # Tailwind CSS config
├── tsconfig.json                        # TypeScript configuration
└── package.json                         # Dependencies and scripts
```

---

## Data Model

### Database Schema

#### `evaluations` table

Stores all property evaluation data for each user.

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `id` | uuid | Primary key | Auto |
| `user_id` | uuid | Foreign key to auth.users | Yes |
| `property_name` | text | Property identifier | Yes |
| `property_address` | text | Physical address | No |
| `property_type` | enum | Residential/Industrial/Commercial | Yes |
| `size_sqft` | decimal | Size in square feet | Yes |
| `lease_left` | integer | Remaining lease years | Yes |
| `purchase_price` | decimal | Purchase price (SGD) | Yes |
| `market_valuation` | decimal | Market valuation | No |
| `bank_valuation` | decimal | Bank valuation | No |
| `lb_profile` | enum | Individual/IHC/Operating | Yes |
| `absd` | boolean | ABSD applicable | Default: false |
| `gst_registered` | boolean | Seller GST-registered | Default: true |
| `loan_interest_rate` | decimal | Annual interest rate | Yes |
| `loan_tenure_years` | integer | Loan tenure | Yes |
| `downpayment_percent` | decimal | Downpayment percentage | Yes |
| `rental_current` | decimal | Current monthly rental | Yes |
| `rental_expected` | decimal | Expected monthly rental | No |
| `property_tax_monthly` | decimal | Monthly property tax | Yes |
| `mcst_monthly` | decimal | MCST/maintenance fee | Yes |
| `lot_size` | integer | Number of CI lots | Yes |
| `ci_percent` | decimal | Cash Investor percentage | Yes |
| `dm_percent` | decimal | Deal Maker percentage | Yes |
| `lb_percent` | decimal | Loan Bearer percentage | Yes |
| `plan_exit_year` | integer | Target exit year | Yes |
| `conservative_growth` | decimal | Conservative growth rate | Yes |
| `baseline_growth` | decimal | Baseline growth rate | Yes |
| `target_growth` | decimal | Target growth rate | Yes |
| `aggressive_growth` | decimal | Aggressive growth rate | Yes |
| `status` | enum | Draft/Complete | Default: Draft |
| `created_at` | timestamptz | Creation timestamp | Auto |
| `updated_at` | timestamptz | Last update timestamp | Auto |

#### `tax_formulas` table

Stores configurable BSD and ABSD rate tables.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `formula_type` | text | 'BSD' or 'ABSD' |
| `formula_name` | text | Formula identifier |
| `formula_config` | jsonb | Rate table configuration |
| `description` | text | Human-readable description |
| `updated_at` | timestamptz | Last update timestamp |

#### `user_roles` table

Manages admin access permissions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to auth.users |
| `role` | text | 'admin' or 'user' |

### Relationships

- `evaluations.user_id` → `auth.users.id` (CASCADE DELETE)
- `user_roles.user_id` → `auth.users.id` (CASCADE DELETE)
- `tax_formulas.updated_by` → `auth.users.id` (SET NULL)

### Row Level Security

**evaluations table:**
- Users can only read/write their own evaluations
- Policies: SELECT, INSERT, UPDATE, DELETE all check `auth.uid() = user_id`

**tax_formulas table:**
- All authenticated users can read
- Only service role can write (admin panel uses service role)

**user_roles table:**
- Users can read their own role
- Only service role can manage roles

---

## Calculation Logic

### BSD (Buyer Stamp Duty)

IRAS tiered rates, calculated progressively:

```typescript
function calculateBSD(purchasePrice: number): number {
  const tiers = [
    { min: 0, max: 180000, rate: 0.01 },
    { min: 180000, max: 360000, rate: 0.02 },
    { min: 360000, max: 1000000, rate: 0.03 },
    { min: 1000000, max: 1500000, rate: 0.04 },
    { min: 1500000, max: 3000000, rate: 0.05 },
    { min: 3000000, max: null, rate: 0.06 },
  ]

  let bsd = 0
  for (const tier of tiers) {
    if (purchasePrice <= tier.min) break
    const upperBound = tier.max === null 
      ? purchasePrice 
      : Math.min(purchasePrice, tier.max)
    const taxableAmount = upperBound - tier.min
    bsd += taxableAmount * tier.rate
  }
  return bsd
}
```

**Example:**
- Purchase Price: $1,010,000
- BSD = (180,000 × 1%) + (180,000 × 2%) + (640,000 × 3%) + (10,000 × 4%)
- BSD = $1,800 + $3,600 + $19,200 + $400 = **$25,000**

### ABSD (Additional Buyer Stamp Duty)

Simplified version using boolean flag (in real implementation, would fetch from tax_formulas):

```typescript
function calculateABSD(purchasePrice: number, hasABSD: boolean): number {
  if (!hasABSD) return 0
  const absdRate = 0.17  // Citizen second property
  return purchasePrice * absdRate
}
```

### GST Calculation

**Critical Rules:**
- **Residential properties: NO GST** (always $0)
- **Industrial/Commercial: 9% GST** if seller is GST-registered
- GST refunded if buyer is GST-registered (except Individual)

```typescript
function calculateGST(
  purchasePrice: number,
  propertyType: PropertyType,
  sellerGSTRegistered: boolean
): number {
  if (propertyType === 'Residential') return 0
  if (!sellerGSTRegistered) return 0
  return purchasePrice * 0.09
}

function calculateGSTRefund(
  gstAmount: number,
  buyerGSTRegistered: boolean,
  lbProfile: LbProfile
): number {
  // Individual cannot be GST-registered
  if (lbProfile === 'Individual') return 0
  if (!buyerGSTRegistered) return 0
  return gstAmount
}
```

### LTV Suggestion

Based on LB Profile and Property Type:

```typescript
function calculateSuggestedLTV(
  propertyType: PropertyType,
  lbProfile: LbProfile
): number {
  if (lbProfile === 'Individual' && propertyType === 'Residential') {
    return 0.75
  }
  if (lbProfile === 'Individual') {
    return 0.80  // Industrial/Commercial
  }
  if (lbProfile === 'IHC') {
    return 0.80
  }
  if (lbProfile === 'Operating') {
    return 0.90
  }
  return 0.75
}
```

### Mortgage Calculation (PMT)

```typescript
function calculateMonthlyMortgage(
  loanAmount: number,
  interestRate: number,
  tenureYears: number
): number {
  const monthlyRate = interestRate / 12
  const totalPayments = tenureYears * 12

  if (monthlyRate === 0) {
    return loanAmount / totalPayments
  }

  const numerator = loanAmount * monthlyRate * 
    Math.pow(1 + monthlyRate, totalPayments)
  const denominator = Math.pow(1 + monthlyRate, totalPayments) - 1

  return numerator / denominator
}
```

### Exit Scenario Calculation

**CRITICAL: Compound Growth, NOT Linear**

Exit PSF uses compound annual growth:
- **Correct**: `Exit PSF = Purchase PSF × (1 + Growth Rate)^N`
- **WRONG**: `Exit PSF = Purchase PSF × (1 + Growth Rate × N)`

```typescript
function calculateScenario(
  evaluation: Evaluation,
  exitYear: number,
  growthRate: number,
  initialInvestmentWithoutGST: number
): ScenarioResult {
  const purchasePSF = evaluation.purchase_price / evaluation.size_sqft
  
  // COMPOUND growth - year on year
  const exitPSF = purchasePSF * Math.pow(1 + growthRate, exitYear)
  
  const sellingPrice = exitPSF * evaluation.size_sqft
  const outstandingLoan = calculateOutstandingLoan(...)
  const sellingFees = evaluation.legal_conveyance_fee + 
    sellingPrice * 0.02  // Agent selling commission
  
  const netCapitalGain = sellingPrice - outstandingLoan - 
    sellingFees - initialInvestmentWithoutGST
  
  const totalPocketMoney = monthlyPocketMoney * exitYear * 12
  const totalProfit = netCapitalGain + totalPocketMoney
  
  const roi = totalProfit / initialInvestmentWithoutGST
  const roiAnnualized = roi / exitYear

  return {
    exitYear, growthRate, exitPSF, sellingPrice,
    outstandingLoan, sellingFees, netCapitalGain,
    totalPocketMoney, totalProfit, roi, roiAnnualized
  }
}
```

**Example: Woodlands Industrial Property**
- Purchase: $1,010,000, Size: 1,830 sqft → PSF = $551.91
- Growth Rate: 6%, Exit Year: 3
- Exit PSF = 551.91 × (1.06)³ = 551.91 × 1.191 = **$657.32**
- Selling Price = 657.32 × 1,830 = **$1,202,883**

### Investable Decision Logic

```typescript
const passingScenarios = scenarios.filter(s => s.roi >= 0.03).length

if (passingScenarios === 4) return "Resounding Pass"
if (passingScenarios === 3) return "Proceed"
if (passingScenarios === 2) return "Proceed with Caution"
return "Resounding No"
```

### Edge Cases

1. **Zero Interest Rate**: Loan = Purchase Price / Total Payments
2. **Zero Initial Investment**: ROI = 0 (avoid division by zero)
3. **Negative Growth**: Exit PSF can be lower than Purchase PSF
4. **Outstanding Loan Calculation**: Standard amortization formula
5. **GST on Residential**: Always return 0, regardless of flags

---

## Key Code Patterns

### React Component Structure

All components use functional components + hooks:

```typescript
import { useState, useEffect } from 'react'

interface ComponentProps {
  // props
}

export function Component({ prop }: ComponentProps) {
  const [state, setState] = useState<Type>(initialValue)

  useEffect(() => {
    // side effects
  }, [dependencies])

  return (
    // JSX
  )
}
```

### State Management

- Local state for component-specific data
- Auth context for user/session data
- Supabase for persistent data
- No global state management library

### Supabase Query Pattern

```typescript
// SELECT
const { data, error } = await supabase
  .from('evaluations')
  .select('*')
  .eq('id', evaluationId)
  .single()

// INSERT
const { data, error } = await supabase
  .from('evaluations')
  .insert(newEvaluation)
  .select()
  .single()

// UPDATE
const { data, error } = await supabase
  .from('evaluations')
  .update(updatedFields)
  .eq('id', evaluationId)
  .select()
  .single()

// DELETE
const { error } = await supabase
  .from('evaluations')
  .delete()
  .eq('id', evaluationId)
```

### Error Handling

```typescript
// Database operations
const { data, error } = await supabase.from('...').select()

if (error) {
  // Handle error
  console.error('Database error:', error.message)
  return
}

// Use data
```

### Form Validation

Multi-step form with validation per step:

```typescript
function canProceed(): boolean {
  switch (currentStep) {
    case 'property':
      return !!(formData.property_name && 
                formData.property_type &&
                formData.size_sqft && ...)
    // ...
  }
}
```

---

## Configuration

### Environment Variables

```bash
# .env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Default Values

Located in `EvaluationForm.tsx`:

```typescript
const DEFAULT_VALUES = {
  property_type: 'Industrial',
  absd: false,
  gst_registered: true,
  lb_profile: 'IHC',
  loan_interest_rate: 0.025,  // 2.5%
  loan_tenure_years: 30,
  downpayment_percent: 0.20,  // 20%
  corp_sect_fee: 0,
  legal_conveyance_fee: 1500,
  bank_facilities_fee: 3600,
  insurance: 3500,
  lot_size: 10,
  ci_percent: 0.40,  // 40%
  dm_percent: 0.30,  // 30%
  lb_percent: 0.30,  // 30%
  plan_exit_year: 3,
  conservative_growth: 0.03,
  baseline_growth: 0.04,
  target_growth: 0.05,
  aggressive_growth: 0.06,
}
```

### Tax Formula Configuration

Stored in `tax_formulas` table:

```json
// BSD
[
  {"min": 0, "max": 180000, "rate": 0.01},
  {"min": 180000, "max": 360000, "rate": 0.02},
  {"min": 360000, "max": 1000000, "rate": 0.03},
  {"min": 1000000, "max": 1500000, "rate": 0.04},
  {"min": 1500000, "max": 3000000, "rate": 0.05},
  {"min": 3000000, "max": null, "rate": 0.06}
]

// ABSD
{"rate": 0.17, "description": "Citizen second property"}
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier)
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd proplens

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Add your Supabase URL and ANON_KEY to .env
```

### Running Locally

```bash
npm run dev
```

App will be available at `http://localhost:5173`

### Database Setup

Database schema is managed via Supabase migrations. The application will work with the existing Supabase project configured in `.env`.

---

## Testing

### Manual Validation Checklist

Test against known spreadsheet values:

**Woodlands 11 Example:**
- [ ] BSD calculation matches IRAS calculator
- [ ] GST calculation correct for Industrial property
- [ ] Mortgage payment matches bank quote
- [ ] ROI calculations match spreadsheet within 0.01%

**Residential Property Test:**
- [ ] GST is $0 (not charged)
- [ ] LTV suggestion is 75% for Individual
- [ ] All calculations work correctly

**Edge Cases:**
- [ ] Zero interest rate works
- [ ] Negative growth rates handled
- [ ] Solo investment (CI=100%, DM=0%, LB=0%) works
- [ ] GST-registered buyer sees "After Return GST"

---

## Deployment

### Vercel Deployment

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy - Vercel will auto-deploy on push to main

### Supabase Production Setup

Database is already configured. To add admin user:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('admin-user-uuid', 'admin');
```

---

## Common Maintenance Tasks

### Update BSD/ABSD Formulas

When tax regulations change:

```sql
UPDATE tax_formulas
SET formula_config = '[
  {"min": 0, "max": 200000, "rate": 0.01},
  ...
]'::jsonb
WHERE formula_type = 'BSD' AND formula_name = 'standard';
```

### Add New Property Type

1. Update `property_type_enum` in database
2. Add to TypeScript types in `database.ts`
3. Update form dropdowns in `EvaluationForm.tsx`
4. Add LTV logic in `calculations.ts` if needed

### Add New Calculation Field

1. Add column to `evaluations` table via migration
2. Update TypeScript types
3. Add input field in `EvaluationForm.tsx`
4. Update `calculateEvaluation()` in `calculations.ts`
5. Update display in `EvaluationDetail.tsx`

### Modify Export Templates

**PDF:**
- Update template when exporting (future feature)

**Excel:**
- Update export function (future feature)

---

## AI Agent Onboarding Section

**Purpose**: This section helps AI agents quickly understand the codebase for maintenance and enhancement work.

### Key Context

**Core Business Logic:**
- **3% ROI threshold**: Evaluations are marked "investable" if ROI ≥ 3%
- **4-scenario evaluation**: Conservative, Baseline, Target, Aggressive growth rates
- **JV structure**: CI (Cash Investor), DM (Deal Maker), LB (Loan Bearer)

**Critical Calculation Rules:**
- BSD: Progressive tiered rates (IRAS)
- GST: 9% on Industrial/Commercial only, NOT Residential
- Exit PSF: Compound growth formula, NOT linear
- LTV: Profile + Property Type determines max loan percentage

**Data Flow:**
1. User input → Form validation → Supabase insert
2. Page load → Supabase fetch → Calculate results → Display
3. Export → Fetch data → Generate report → Download

### Common Enhancement Patterns

**Adding New Input Fields:**
```
1. Update database schema (migration)
2. Update TypeScript types (database.ts)
3. Add form input (EvaluationForm.tsx)
4. Update calculations if needed (calculations.ts)
5. Update display (EvaluationDetail.tsx)
6. Update exports (future)
```

**Adding New Calculations:**
```
1. Implement in lib/calculations.ts
2. Export function
3. Call in calculateEvaluation()
4. Update TypeScript types for results
5. Display in EvaluationDetail.tsx
```

**Modifying Existing Formulas:**
```
1. Check calculations.ts for function
2. Update formula logic
3. Test with known values (Woodlands example)
4. Verify against spreadsheet
5. Check all scenarios still work
```

### File Responsibilities

| File | Purpose | When to Modify |
|------|---------|----------------|
| `calculations.ts` | All financial formulas | Adding/changing calculations |
| `database.ts` | TypeScript types | Schema changes |
| `supabase.ts` | Database client | Rarely |
| `EvaluationForm.tsx` | Data input UI | Adding input fields |
| `EvaluationDetail.tsx` | Data display UI | Adding output displays |
| `Dashboard.tsx` | List/filter/search | Dashboard features |
| `useAuth.tsx` | Authentication | Auth changes |
| `index.css` | Design tokens | Theming changes |

### Critical Business Rules

**GST on Residential Properties:**
```typescript
// ALWAYS return 0 for Residential
if (propertyType === 'Residential') return 0
```

**Compound vs Linear Growth:**
```typescript
// CORRECT - Compound
const exitPSF = purchasePSF * Math.pow(1 + growthRate, years)

// WRONG - Linear
const exitPSF = purchasePSF * (1 + growthRate * years)
```

**Initial Investment Calculation:**
- Includes: Downpayment + All fees (including GST)
- Excludes for "without GST" version: GST amount
- Used for: ROI denominator

**Investable Decision:**
- Count scenarios where ROI ≥ 3%
- 4 passing = "Resounding Pass"
- 3 passing = "Proceed"
- 2 passing = "Proceed with Caution"
- 0-1 passing = "Resounding No"

### Database Queries to Know

**Get all evaluations for current user:**
```typescript
const { data } = await supabase
  .from('evaluations')
  .select('*')
  .order('created_at', { ascending: false })
```

**Get single evaluation:**
```typescript
const { data } = await supabase
  .from('evaluations')
  .select('*')
  .eq('id', evaluationId)
  .single()
```

**Check if user is admin:**
```typescript
const { data } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .single()
```

### Troubleshooting

**Calculation doesn't match spreadsheet:**
1. Check growth formula (compound vs linear)
2. Verify GST exclusion for Residential
3. Check rounding differences
4. Verify outstanding loan formula

**User can't see their evaluations:**
1. Check RLS policies are enabled
2. Verify `auth.uid()` in policies
3. Check user is authenticated

**Form validation failing:**
1. Check required fields marked with `*`
2. Verify field types match database
3. Check enum values match database enums

**Chart not updating:**
1. Check evaluation prop is passed
2. Verify initialInvestmentWithoutGST calculated
3. Check Recharts ResponsiveContainer

### Quick Testing Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck
```

---

## Changelog

### Version 1.0.0 (2026-05-29)

**Initial Release:**
- Database schema with RLS policies
- User authentication (register, login, logout)
- Evaluation CRUD operations
- Dashboard with search and filters
- BSD/ABSD/GST calculations
- LTV suggestions
- Mortgage calculation (PMT formula)
- 4-scenario exit calculations
- CI/DM/LB profit distribution
- Investable decision logic
- Side-by-side comparison
- Trend line chart
- Responsive dark theme UI

---

## License

Private - All rights reserved

---

## Support

For questions or issues, contact the product owner.
