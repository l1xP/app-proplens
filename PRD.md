# Project Requirements Document
## Singapore Property Investment Calculator

**Version:** 1.2
**Date:** June 8, 2026
**Author:** Product Owner
**Status:** Partially Complete — Phases 1–4 shipped, Phases 5–6 pending

---

## 1. Executive Summary

A web-based property investment calculator designed to replace an existing spreadsheet workflow for evaluating Residential, Industrial, and Commercial properties in Singapore. The tool supports both solo and joint venture (JV) investment structures, calculates ROI across multiple growth scenarios, and provides sensitivity analysis via interactive sliders. Primary output is comprehensive PDF/Excel reports for sharing with investment partners.

**Key Capabilities:**
- Multi-scenario ROI calculation (Conservative, Baseline, Target, Aggressive)
- Joint venture profit distribution (Deal Maker, Loan Bearer, Cash Investor roles)
- Singapore tax calculations (BSD, ABSD, GST)
- Sensitivity analysis with real-time recalculation
- Side-by-side property comparison
- Year-on-year exit table (Years 1–10)
- PDF and Excel export *(pending — Phase 5)*

**Tech Stack:** React 18 + TypeScript + Vite frontend (Vercel), Supabase backend (PostgreSQL + Auth + RLS), serverless architecture on free tiers.

---

## 2. Problem Statement

The current property evaluation workflow uses Excel spreadsheets with these issues:
- **Disorganized:** Input fields scattered across multiple sections
- **Error-prone:** Manual data entry, no validation, formula errors (#DIV/0!)
- **Poor UX:** Not visually appealing, lacks charts, difficult to navigate
- **Clutter:** One spreadsheet per property, comparison requires switching files
- **Collaboration friction:** Sharing requires manual copy-paste to messaging apps
- **No tracking:** Difficult to find past evaluations or revisit with updated assumptions

These problems slow down investment decisions and increase risk of calculation errors when evaluating time-sensitive property deals.

---

## 3. Goals

**Primary Goal:**
Enable faster, more accurate property investment evaluation with structured data entry, automated calculations, and easy sharing.

**Specific Objectives:**
1. Reduce evaluation time from spreadsheet workflow to <10 minutes per property
2. Eliminate calculation errors through validated inputs and tested formulas
3. Enable quick comparison of multiple properties (2-5 properties side-by-side)
4. Provide professional PDF reports for partner sharing
5. Support sensitivity analysis during price negotiations via interactive sliders
6. Maintain evaluation history for market change tracking

**Learning Goal:**
Gain hands-on experience setting up and using Claude agent teams for software development.

---

## 4. Non-Goals

**Explicitly OUT of MVP scope:**

**Features:**
- Real-time collaboration (no shared workspaces, concurrent editing, or comments)
- Post-purchase tracking (actual rental income, expense tracking, performance monitoring)
- Property ranking/scoring beyond Investable yes/no
- API integration with PropertyGuru or other listing services
- Automated market data feeds (interest rates, rental comps)
- Notifications/alerts for market changes
- Custom visualizations beyond trend line chart
- Bulk CSV import of properties
- Version history showing change diffs between evaluations
- Mobile native apps (iOS/Android)

**Data Scope:**
- International properties (Singapore only)
- Complex ownership structures beyond CI/DM/LB model

---

## 5. Target Users / Personas

**Primary User: Solo/JV Property Investor**

**Profile:**
- Singapore-based investor
- Evaluates Residential, Industrial, and Commercial properties
- Participates in joint venture deals OR invests solo
- Evaluates 0-5 properties at irregular intervals (not full-time investor)
- Needs to share analysis with JV partners
- Comfortable with financial concepts (ROI, yield, leverage)
- Uses PropertyGuru, agents, or direct seller contacts for deal sourcing

**User Jobs to Be Done:**
1. **Evaluate:** Determine if a property meets 3% ROI threshold across growth scenarios
2. **Compare:** Assess multiple properties to prioritize best opportunities
3. **Negotiate:** Test price/rental adjustments during seller negotiations
4. **Share:** Provide partners with detailed analysis for decision-making
5. **Track:** Maintain history of evaluated properties for future reference

**Context of Use:**
- Desktop/laptop (web browser)
- Office or home environment
- May evaluate properties over multiple sessions (save partial progress)
- Needs quick access during time-sensitive negotiations

**Frequency:** Irregular usage patterns (weeks of no activity, then 5 evaluations in one day)

---

## 6. Assumptions

**Market/Domain:**
- Singapore property tax regulations (BSD, ABSD, GST) remain relatively stable
- Residential, Industrial, and Commercial property investment follows documented JV structure
- 3-year holding period is standard evaluation timeframe
- 9% GST rate applies to Industrial/Commercial properties (not Residential)
- IRAS stamp duty formulas are publicly available and implementable

**User Behavior:**
- User has basic understanding of property investment terminology
- User will manually enter data from property listings (no auto-population)
- User values comprehensive reports over minimal summaries
- User prefers creating new evaluations over editing old ones when re-evaluating

**Technical:**
- Free-tier Supabase and Vercel are sufficient for expected load (1-10 concurrent users)
- Modern browsers support required features (Chrome, Safari, Firefox, Edge)
- Users have stable internet connection (no offline mode needed)
- PDF generation can complete within 5 seconds

**Business:**
- Product owner will act as admin for tax formula updates
- No customer support infrastructure needed for MVP (single user)
- Learning goal does not compromise product quality

---

## 7. Scope

### 7.1 In Scope (MVP Features)

**Core Evaluation:**
- Create new property evaluation with multi-step form
- Support for all three property types: **Residential, Industrial, Commercial**
- Property-type-specific logic:
  - **Residential:** No GST, LTV max 75% (Individual)
  - **Industrial/Commercial:** GST applicable if seller GST-registered, LTV max 80-90% depending on LB Profile
- Save draft evaluations (partial data entry)
- Edit existing evaluations
- Delete evaluations
- Duplicate evaluations (clone with all data)
- Auto-calculate all derived values (ROI, profits, taxes, pocket money)

**Calculations:**
- Buyer Stamp Duty (BSD) using IRAS tiered rates
- Additional Buyer Stamp Duty (ABSD) — simplified flat 17% (see FR-2.2)
- GST (9% on Industrial/Commercial only, not Residential; refundable if GST-registered)
- Backup funds reserve (months × rental, added to initial investment)
- Loan-to-Value (LTV) suggestions based on LB Profile and Property Type
- Mortgage payments (PMT formula)
- Monthly pocket money (rental - expenses)
- Exit scenarios: 4 growth rates (Conservative, Baseline, Target, Aggressive)
- CI/DM/LB profit distribution
- Per-lot calculations for multiple Cash Investors

**Analysis:**
- Interactive sliders: Purchase Price, Rental, Interest Rate, Loan Tenure, Downpayment %, 4 Growth Rates (9 sliders total)
- Trend line chart: ROI across exit years 1-10 for all scenarios
- Year-on-year exit table: Years 1-10, all 4 scenarios, 6 columns each
- Investable decision logic (scenario-based thresholds)
- Side-by-side comparison (2+ properties)

**Data Management:**
- List/dashboard view of all evaluations
- Search by property name
- Filter by status (Draft, Complete, Investable, Not Investable)
- Default values for common case (Industrial, GST-registered, IHC/Operating)

**Export:**
- PDF report with complete evaluation details *(not yet implemented)*
- Excel export with all data and formulas *(not yet implemented)*

**User Management:**
- User registration and login
- Password-protected accounts
- Data isolation per user (no cross-user visibility)

**Admin:**
- Admin panel to update BSD/ABSD formula parameters when regulations change *(not yet implemented)*

### 7.2 Technical Scope

- **Frontend:** React 18 (functional components, hooks), TypeScript, Vite build tool
- **Navigation:** State-based routing via `view` enum in `App.tsx` with `window.history.pushState` for URL updates. No React Router.
- **Backend:** Supabase (PostgreSQL database, Auth, Row Level Security)
- **Charting:** Recharts
- **Hosting:** Vercel (frontend), Supabase cloud (backend)
- **Responsive web design:** minimum 1280px width

---

## 8. User Journeys / Use Cases

### 8.1 Primary Journey: Evaluate New Property

**Actor:** Property Investor
**Precondition:** User is logged in, has property listing details
**Flow:**

1. User finds property on PropertyGuru or via agent
2. User clicks "Create New Evaluation"
3. System presents multi-step form with defaults pre-filled
4. User enters property details (name, address, type, size, lease, price, valuations)
5. System validates inputs, calculates PSF values
6. User enters loan terms (interest rate, tenure, downpayment %)
7. System suggests max LTV based on LB Profile and Property Type, user can override
8. User enters costs (stamp duties auto-calculated, fees manual)
9. System calculates GST if applicable (Industrial/Commercial only)
10. User enters rental info (monthly rental, expected rental, tax, maintenance)
11. User enters JV structure (CI/DM/LB percentages, lot size) OR keeps defaults for solo
12. System validates percentages sum to 100%
13. User enters growth scenarios (or uses defaults)
14. User clicks "Save" at any stage (draft saved)
15. User clicks "Calculate" when all required fields complete
16. System calculates all 4 scenarios, displays results with investable decision
17. User reviews results, adjusts sliders to test scenarios
18. User clicks "Export PDF" to generate report *(pending Phase 5)*
19. System generates comprehensive PDF, user downloads *(pending Phase 5)*
20. User shares PDF via WhatsApp/email with partners *(pending Phase 5)*

**Postcondition:** Evaluation saved, decision made, partners informed

**Alternative Flows:**
- **Partial Save:** User can save at step 6, return later to complete
- **Solo Investment:** User skips JV structure, system uses defaults (CI=100%, DM=0%, LB=0%)

### 8.2 Compare Multiple Properties

**Actor:** Property Investor
**Precondition:** User has 2+ completed evaluations
**Flow:**

1. User navigates to dashboard
2. User selects 2+ evaluations via checkboxes
3. User clicks "Compare"
4. System displays summary cards (property name, type, price, initial investment)
5. System displays comparison table: Purchase Price, PSF, Initial Investment, Monthly Pocket Money, Investable Decision
6. System displays ROI table: Conservative/Baseline/Target/Aggressive ROI per property, highest ROI highlighted per row, Best ROI row
7. Best overall opportunity highlighted with "Best Opportunity" badge
8. User clicks on property name to drill into full details

**Postcondition:** User has selected best property for further action

### 8.3 Negotiate with Seller Using Sliders

**Actor:** Property Investor during negotiation call
**Precondition:** Evaluation exists, seller is proposing price adjustment
**Flow:**

1. User opens evaluation in tool during negotiation
2. Seller says "Can you do $950k instead of $1M?"
3. User expands Sensitivity Analysis section, drags Purchase Price slider to $950k
4. System recalculates all scenarios in real-time (<500ms)
5. User sees ROI increase, checks if now investable
6. User tells seller decision
7. User exports updated PDF with new price *(pending Phase 5)*

**Postcondition:** Deal terms adjusted, new analysis shared

### 8.4 Revisit Old Property with Market Changes

**Actor:** Property Investor
**Precondition:** Evaluation exists from 6 months ago (was not investable)
**Flow:**

1. User hears interest rates dropped
2. User searches property name in dashboard
3. User clicks "Duplicate" on old evaluation
4. System creates copy with all data pre-filled, " (Copy)" appended to name
5. User edits Interest Rate via Edit form
6. System shows updated ROI
7. User compares side-by-side with original evaluation
8. User exports PDF, contacts seller *(pending Phase 5)*

**Postcondition:** Re-evaluation complete, new opportunity identified

---

## 9. Functional Requirements

### 9.1 Evaluation Management

**FR-1.1 Create Evaluation** ✅ Implemented
- System shall provide a multi-step form for creating new evaluations
- Form sections: Property Details, Financial Terms, Costs, Rental, JV Structure, Growth Scenarios
- System shall pre-fill default values based on "most common case" (Industrial, GST-registered, IHC, 2.5% interest, etc.)
- System shall allow saving partial evaluations as "Draft" status

**FR-1.2 Edit Evaluation** ✅ Implemented
- System shall allow editing of any evaluation field at any time
- System shall recalculate results when inputs change
- System shall maintain Draft vs Complete status based on required field completion

**FR-1.3 Delete Evaluation** ✅ Implemented
- System shall allow permanent deletion of evaluations
- System shall prompt for confirmation before delete
- System shall remove evaluation from database (no soft delete)

**FR-1.4 Duplicate Evaluation** ✅ Implemented
- System shall allow cloning an evaluation with all data copied
- System shall create new evaluation with distinct ID
- System shall append " (Copy)" to property name to differentiate

### 9.2 Calculation Engine

**FR-2.1 Buyer Stamp Duty (BSD)** ✅ Implemented
- System shall calculate BSD using IRAS tiered rates:
  - First $180,000: 1%
  - Next $180,000: 2%
  - Next $640,000: 3%
  - Next $500,000: 4%
  - Next $1,500,000: 5%
  - Above $3,000,000: 6%

**FR-2.2 Additional Buyer Stamp Duty (ABSD)** ⚠️ Simplified
- **Current implementation:** Flat 17% when ABSD flag is enabled. Rate is hardcoded, not pulled from `tax_formulas` table.
- **Intended:** Calculate ABSD based on IRAS formulas with rates configurable in admin panel
- **Pending:** Admin panel integration and buyer-profile-aware rate lookup

**FR-2.3 GST Calculation** ✅ Implemented
- System shall charge 9% GST on **Industrial and Commercial** properties if seller is GST-registered
- System shall **NOT charge GST on Residential properties** under any circumstances
- System shall calculate GST refund if buyer is GST-registered
- System shall mark GST as non-refundable if LB Profile = Individual (cannot be GST-registered)

**FR-2.4 Backup Funds** ✅ Implemented
- System shall calculate backup funds reserve: `backup_funds_months × rental`
- Backup funds is included in `initialInvestmentWithoutGST` (upfront cash required)
- Flows through to Net Capital Gain and ROI calculations

**FR-2.5 Loan-to-Value (LTV) Suggestion** ✅ Implemented
- System shall suggest max LTV based on LB Profile and Property Type:
  - Individual + **Residential: 75%**
  - Individual + Industrial/Commercial: 80%
  - IHC + Industrial/Commercial: 80% (IHC cannot purchase Residential)
  - Operating + Industrial/Commercial: 90% (Operating cannot purchase Residential)
- System shall allow user override of suggested LTV

**FR-2.6 Mortgage Calculation** ✅ Implemented
- System shall calculate monthly mortgage using PMT formula: `PMT(rate/12, tenure*12, -loan_amount)`

**FR-2.7 Monthly Pocket Money** ✅ Implemented
- System shall calculate: `Rental - (Mortgage + Property Tax + MCST/Maintenance)`

**FR-2.8 Exit Scenario Calculations** ✅ Implemented
- System shall calculate for each scenario (Conservative, Baseline, Target, Aggressive):
  - Exit PSF = Purchase PSF × (1 + Growth Rate)^Years *(compound growth)*
  - Selling Price = Exit PSF × Size
  - Outstanding Loan = Remaining balance after amortization
  - Selling Fees = Legal Conveyance Fee + (Selling Price × 2% agent commission)
  - Net Capital Gain = Selling Price − Outstanding Loan − Selling Fees − Initial Investment (w/o GST)
  - Total Pocket Money = Monthly Pocket Money × (Years × 12)
  - Total Profit = Net Capital Gain + Total Pocket Money
  - ROI = Total Profit / Initial Investment (w/o GST)
  - ROI Annualised = ROI / Exit Years

**FR-2.9 Year-on-Year Exit Table** ✅ Implemented
- System shall display a scrollable table for exit years 1–10
- Each year shows all 4 scenarios with: Selling Price, Net Capital Gain, Total Pocket Money, Total Profit, ROI, Annualised ROI
- Plan exit year highlighted
- Note: Year-on-year table uses simplified outstanding loan formula (linear, not amortization). Plan exit view uses correct amortization.

**FR-2.10 Profit Distribution (JV)** ✅ Implemented
- System shall calculate (at plan exit year, baseline scenario):
  - DM Profit = Total Profit × DM%
  - LB Profit = Total Profit × LB%
  - CI Profit = Total Profit × CI%
  - CI Profit per Lot = CI Profit / Lot Size

**FR-2.11 Investable Decision Logic** ✅ Implemented
- System shall mark evaluation as:
  - "Resounding Pass" if ROI ≥3% for all 4 scenarios
  - "Proceed" if ROI ≥3% for 3 scenarios
  - "Proceed with Caution" if ROI ≥3% for 2 scenarios
  - "Resounding No" if ROI ≥3% for 0-1 scenarios
- System shall display decision prominently on results page

### 9.3 Interactive Sliders

**FR-3.1 Slider Functionality** ✅ Implemented
- System shall provide sliders for: Purchase Price, Monthly Rental, Interest Rate, Loan Tenure, Downpayment %, Conservative Growth, Baseline Growth, Target Growth, Aggressive Growth (9 sliders)
- Note: CI/DM/LB % sliders are **not implemented** (PRD specified 12+ sliders)
- System shall recalculate all results in real-time when slider changes
- System shall debounce slider input (300ms) to prevent lag
- Slider panel is collapsible, collapsed by default
- "Modified" badge shown when values differ from saved
- Reset button restores to saved values
- Note: loading indicator during recalculation is **not implemented**
- Slider changes are temporary (not saved to DB); user must click Edit to persist

**FR-3.2 Slider Range Limits** ✅ Implemented
- Purchase Price: $100k – $5M (step $10k)
- Monthly Rental: $1k – $50k (step $100)
- Interest Rate: 1% – 8% (step 0.25%)
- Loan Tenure: 5 – 35 years (step 1 year)
- Downpayment: 5% – 90% (step 5%)
- Growth Rates: 0% – 10/12/15/20% depending on scenario (step 0.5%)

### 9.4 Comparison

**FR-4.1 Side-by-Side Comparison** ✅ Implemented
- System shall allow selecting 2+ evaluations for comparison
- System shall display summary cards per property (type, price, initial investment)
- System shall display metrics table: Purchase Price, PSF, Initial Investment, Pocket Money, Investable Decision
- System shall display ROI table by scenario with highest value highlighted per row
- System shall highlight best overall opportunity
- System shall allow clicking property name to view full evaluation

### 9.5 Visualization

**FR-5.1 Trend Line Chart** ✅ Implemented (Recharts)
- X-axis: Exit Year (1–10)
- Y-axis: ROI %
- 4 lines: Conservative, Baseline, Target, Aggressive scenarios
- Chart updates when sliders change

### 9.6 Data Management

**FR-6.1 Dashboard List View** ✅ Implemented
- System shall display all user's evaluations in table format
- Columns: Property Name, Type, Purchase Price, Investable, Best ROI, Created Date, Status (Draft/Complete)
- System shall sort by Created Date (newest first) by default

**FR-6.2 Search** ✅ Implemented
- System shall provide text search by Property Name or Address
- System shall filter results as user types

**FR-6.3 Filter** ✅ Implemented
- System shall provide filters: All, Draft, Complete, Investable, Not Investable

### 9.7 Export

**FR-7.1 PDF Export** ❌ Not implemented
- Export button exists but shows "PDF export coming soon" alert
- Planned: comprehensive PDF containing property details, inputs, scenario results, CI/DM/LB breakdowns, trend chart, investable decision

**FR-7.2 Excel Export** ❌ Not implemented
- Not yet started
- Planned: .xlsx with separate tabs for Inputs, Calculations, Results, CI/DM/LB breakdowns; formulas preserved

### 9.8 User Management

**FR-8.1 Registration** ✅ Implemented
- Email + password registration via Supabase Auth

**FR-8.2 Login** ✅ Implemented
- Email + password authentication
- Session persists across browser refresh
- Redirect to dashboard on login

**FR-8.3 Data Isolation** ✅ Implemented
- Row Level Security enforced at DB level; users access only their own evaluations

### 9.9 Admin Panel

**FR-9.1 Tax Formula Management** ❌ Not implemented
- `tax_formulas` table exists in DB with BSD/ABSD config as JSONB
- No admin UI yet; formulas updated via SQL only
- ABSD rate currently hardcoded at 17% in `calculations.ts` regardless of DB values

---

## 10. Non-Functional Requirements

### 10.1 Performance

**NFR-1.1 Page Load**
- Dashboard shall load in <2 seconds on standard broadband

**NFR-1.2 Calculation Speed**
- Slider recalculation shall complete in <500ms ✅ (debounced 300ms, client-side only)
- Full evaluation calculation shall complete in <1 second ✅

**NFR-1.3 Export Speed**
- PDF generation shall complete in <5 seconds *(pending)*
- Excel export shall complete in <3 seconds *(pending)*

**NFR-1.4 Concurrent Users**
- System shall support up to 10 concurrent users without degradation

### 10.2 Usability

**NFR-2.1 Responsiveness**
- UI shall be fully functional at 1280px width minimum
- Mobile warning below 1280px ❌ *not implemented*

**NFR-2.2 Error Handling**
- System shall display user-friendly error messages ⚠️ *partial — no toast library, errors handled inline*
- Toast notifications ❌ *not implemented*
- Invalid form field highlighting ✅

**NFR-2.3 Loading States**
- Spinner during page/data loads ✅
- Loading indicator during slider recalculation ❌ *not implemented*
- Button disable during processing ⚠️ *partial*

### 10.3 Reliability

**NFR-3.1 Data Persistence**
- Auto-save draft evaluations every 30 seconds ❌ *not implemented*
- Data persists on browser refresh ✅ (Supabase)

**NFR-3.2 Calculation Accuracy**
- All financial calculations shall match existing spreadsheet results within 0.01% tolerance ⚠️ *exit PSF needs validation — see Known Issues*
- BSD calculations shall match IRAS official calculators ✅

### 10.4 Security

**NFR-4.1 Transport Security**
- All communication shall use HTTPS only ✅ (Supabase enforced)

**NFR-4.2 Authentication**
- Passwords hashed via Supabase Auth (bcrypt) ✅
- Session persists 7 days ✅

**NFR-4.3 Authorization**
- RLS at database level ✅
- SQL injection prevention via parameterized queries (Supabase client) ✅

### 10.5 Maintainability

**NFR-5.1 Code Quality**
- TypeScript throughout ✅
- Standard React hooks/functional components ✅

**NFR-5.2 Documentation**
- CLAUDE.md: AI agent onboarding (codebase structure, calculation rules, patterns) ✅
- HANDOVER.md: developer handoff documentation ✅
- README.md: not yet created

---

## 11. Data / Content / Inputs / Outputs

### 11.1 Data Model

**Evaluation Entity** (PostgreSQL `evaluations` table)
```
id: UUID (primary key)
user_id: UUID (foreign key to auth.users)
property_name: string (required)
property_address: string (optional)
property_type: enum ['Residential', 'Industrial', 'Commercial']
absd: boolean
gst_registered: boolean
lb_profile: enum ['Individual', 'IHC', 'Operating']
loan_interest_rate: decimal (e.g., 0.025 for 2.5%)
loan_tenure_years: integer
rental_current: decimal
rental_expected: decimal
rental_agents_commission: decimal
property_tax_monthly: decimal
mcst_monthly: decimal
corp_sect_fee: decimal
legal_conveyance_fee: decimal
selling_legal_conveyance_fee: decimal
legal_jv_fee: decimal
bank_facilities_fee: decimal
insurance: decimal
backup_funds_months: integer
plan_exit_year: integer
lot_size: integer
conservative_growth: decimal
baseline_growth: decimal
target_growth: decimal
aggressive_growth: decimal
ci_percent: decimal
dm_percent: decimal
lb_percent: decimal
lease_left: integer
size_sqft: decimal
market_valuation: decimal
bank_valuation: decimal
purchase_price: decimal
downpayment_percent: decimal
status: enum ['Draft', 'Complete']
created_at: timestamp
updated_at: timestamp
```

**Calculated Fields (not stored, computed on-demand in `calculations.ts`):**
- BSD, ABSD, GST, GST refundable
- Total Costs, Total Costs (w/o GST)
- Backup Funds, Initial Investment (w/o GST)
- Loan Amount, Monthly Mortgage, Monthly Pocket Money
- Purchase PSF, Market PSF, Suggested LTV
- Per scenario: Exit PSF, Selling Price, Outstanding Loan, Selling Fees, Agent Commission, Legal Fee, Net Capital Gain, Total Pocket Money, Total Profit, ROI, Annualised ROI
- Investable Decision, Investable Score

**Supporting Tables:**
- `tax_formulas`: BSD/ABSD config as JSONB, readable by authenticated users, updated via SQL (no admin UI yet)
- `user_roles`: admin flag per user

### 11.2 Input Requirements

**Required Fields (cannot save as Complete without these):**
- Property Name, Property Type, LB Profile
- Purchase Price, Size (sqft), Lease Left
- Loan Interest Rate, Loan Tenure, Downpayment %
- Rental (Current or Expected), Property Tax, MCST
- Plan Exit Year
- Conservative Growth, Baseline Growth, Target Growth, Aggressive Growth
- CI%, DM%, LB%, Lot Size

**Optional Fields (can be $0 or blank):**
- Property Address, Market Valuation, Bank Valuation
- Corp Sect Fee, Legal Conveyance Fee, Legal JV Fee, Bank Facilities Fee, Insurance
- Rental Agents Commission, Backup Funds Months

**Validation Rules:**
- CI% + DM% + LB% must equal 100%
- Purchase Price > 0
- Size > 0
- Loan Tenure > 0
- All percentages: 0–100%
- All growth rates: -100% to 100%

### 11.3 Default Values

```
Property Type: Industrial
ABSD: No
GST Registered: Yes
LB Profile: IHC
Loan Interest Rate: 2.5%
Loan Tenure: 30 years
Downpayment %: 20%
Conservative Growth: 3%
Baseline Growth: 4%
Target Growth: 5%
Aggressive Growth: 6%
Plan Exit Year: 3
CI %: 40%
DM %: 30%
LB %: 30%
Lot Size: 10
Backup Funds Months: 3
Corp Sect Fee: $0
Legal JV Fee: $0
Legal Conveyance Fee: $1,500
Insurance: $3,500
Bank Facilities Fee: $3,600
```

### 11.4 Output Formats

**On-screen results include:**
1. Investable Decision banner (color-coded)
2. Sensitivity Analysis sliders (collapsible)
3. Quick stats: Purchase Price, Initial Investment, Monthly Pocket Money, Loan Amount
4. Costs Breakdown table
5. Exit Scenarios table (Plan Exit Year view and Year-on-Year view)
6. JV Profit Distribution (CI/DM/LB at plan exit year, baseline scenario)
7. ROI Trend chart (Years 1–10, all 4 scenarios)
8. Property Details summary

**PDF Report** *(pending Phase 5)*
**Excel Export** *(pending Phase 5)*

---

## 12. Integrations / Dependencies

### 12.1 External Dependencies

**None for MVP.**

All calculations are self-contained. No external APIs for:
- Property listing data (manual entry)
- Market interest rates (manual entry)
- Tax rate lookups (stored in database)

### 12.2 Internal Dependencies

**Supabase Services:**
- PostgreSQL database for data storage
- Supabase Auth for user management
- Row Level Security for data isolation

**Third-Party Libraries (Frontend — installed):**
- React 18 (UI framework)
- TypeScript
- Vite (build tool)
- Recharts (trend line chart)
- Tailwind CSS (styling)
- Lucide React (icons)
- `@supabase/supabase-js` (DB client)

**Third-Party Libraries (Frontend — pending for Phase 5):**
- jsPDF or react-pdf (PDF generation)
- xlsx library (Excel export)

---

## 13. Constraints

### 13.1 Technical Constraints

**Platform:**
- Must run on Supabase free tier (500MB database, 50k monthly active users)
- Must run on Vercel free tier (100GB bandwidth/month)
- No custom backend server (serverless only)

**Browser Support:**
- Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- Desktop only (minimum 1280px width)

**Data Volume:**
- Assumed <10,000 evaluations total across all users
- Assumed <100 evaluations per user

### 13.2 Regulatory Constraints

**Singapore Tax Law:**
- BSD/ABSD rates subject to government changes (requires admin update mechanism)
- GST rate currently 9% (hardcoded)

### 13.3 User Constraints

**Manual Data Entry:**
- User must manually enter all property data (no auto-import)
- User must know property investment terminology

### 13.4 Business Constraints

**Cost:** Total hosting cost must remain $0/month (free tiers only)

---

## 14. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|---------|------------|
| **BSD/ABSD formulas change** | Medium | High | `tax_formulas` table exists for DB config; admin UI pending; ABSD currently hardcoded at 17% |
| **Exit PSF calculation diverges from spreadsheet** | High | High | Known issue — compound formula structurally correct but needs validation against original spreadsheet values |
| **Year-on-year outstanding loan inaccurate** | Medium | Low | YoY table uses simplified linear loan formula; plan exit view uses correct amortization |
| **Mortgage calculation variance vs banks** | Medium | Low | Acceptable; PMT formula is standard approximation |
| **PDF generation fails for complex evaluations** | Low | Medium | Pending implementation |
| **Slider lag with many calculations** | Low | Low | Debounce 300ms; all calculations client-side |
| **Supabase free tier limits exceeded** | Low | High | Monitor usage; upgrade to paid tier if needed |
| **Data loss from browser crash** | Low | Medium | Auto-save not implemented; user must manually save |

---

## 15. Success Metrics

### 15.1 User Adoption (3-month targets)

**Quantitative:**
- ✅ 20+ evaluations created
- ⬜ 10+ PDF exports generated *(pending Phase 5)*
- ⬜ 100% of new property evaluations use tool (spreadsheet retired)
- ✅ 0 critical bugs reported

**Qualitative:**
- ✅ Evaluation time <10 minutes per property (vs 15+ min with spreadsheet)
- ✅ Side-by-side comparison of 3 properties is faster than switching spreadsheets
- ⬜ PDF reports are clearer and more professional than spreadsheet screenshots *(pending)*

### 15.2 Technical Quality

- ⚠️ 100% calculation accuracy — exit PSF needs spreadsheet validation
- ✅ 0 data loss incidents
- ✅ <2s page load time on broadband
- ✅ <500ms slider response time

---

## 16. Acceptance Criteria

**Definition of Done for MVP:**

### 16.1 Core Functionality
- [x] User can register, login, logout
- [x] User can create evaluation with all required fields
- [x] User can save partial evaluation as draft
- [x] User can edit any evaluation
- [x] User can delete evaluation with confirmation
- [x] User can duplicate evaluation
- [x] System auto-calculates BSD using IRAS tiered rates
- [x] System auto-calculates ABSD (simplified 17% flat rate)
- [x] System auto-calculates GST (9% on Industrial/Commercial only, not Residential)
- [x] System suggests LTV based on LB Profile and Property Type
- [x] System calculates mortgage using PMT formula
- [x] System calculates 4 scenarios (Conservative, Baseline, Target, Aggressive) correctly
- [x] System calculates CI/DM/LB profit distribution correctly
- [x] System displays investable decision based on ROI threshold logic
- [x] System includes backup funds in initial investment calculation

### 16.2 Interactive Features
- [x] User can adjust purchase price via slider, results update in <500ms
- [x] User can adjust rental via slider, results update in <500ms
- [x] User can adjust interest rate via slider, results update in <500ms
- [x] User can adjust loan tenure via slider, results update in <500ms
- [x] User can adjust downpayment % via slider, results update in <500ms
- [x] User can adjust all 4 growth rates via sliders
- [ ] User can adjust CI/DM/LB % via sliders (not implemented)
- [x] Trend line chart displays ROI across exit years 1-10
- [x] Chart updates when sliders change
- [x] Year-on-year table shows Years 1-10 for all 4 scenarios

### 16.3 Comparison
- [x] User can select 2+ evaluations and view side-by-side comparison
- [x] Comparison table shows: Name, Investable Decision, ROI for all 4 scenarios
- [x] Best ROI highlighted in each scenario row
- [x] Best overall opportunity highlighted

### 16.4 Data Management
- [x] Dashboard displays all evaluations in table format
- [x] User can search by property name
- [x] User can filter by status (Draft, Complete, Investable, Not Investable)
- [x] Evaluations sorted by created date (newest first)

### 16.5 Export
- [ ] User can export evaluation to PDF
- [ ] PDF contains all sections per spec (property details, inputs, results, breakdowns, chart)
- [ ] User can export evaluation to Excel
- [ ] Excel contains all tabs per spec (Inputs, Calculations, Results, CI, DM, LB, Chart)
- [ ] Excel formulas are preserved (not hardcoded values)

### 16.6 Admin
- [ ] Admin can access formula management UI
- [ ] Admin can update BSD rate table (JSON config)
- [ ] Admin can update ABSD rate table (JSON config)
- [ ] Updated formulas apply to new calculations

### 16.7 Validation Testing
- [ ] Woodlands 11 evaluation matches existing spreadsheet output (BSD, ROI, all values within 0.01%)
- [ ] Exit PSF calculations validated against original spreadsheet
- [x] Solo investment (CI=100%, DM=0%, LB=0%) calculates correctly
- [x] GST-registered buyer scenario calculates GST refund correctly
- [x] Non-GST-registered buyer does not get GST refund
- [x] Residential property evaluation calculates correctly (no GST charged)

### 16.8 Documentation
- [x] CLAUDE.md exists with codebase guidance, calculation rules, architecture
- [x] HANDOVER.md exists with developer handoff documentation
- [ ] README.md with full 12-section structure per NFR-5.3

---

## 17. Milestones / Phases

### Phase 1: Foundation ✅ Complete
**Deliverables shipped:**
- Supabase project, database schema, RLS
- User registration and login
- Evaluation CRUD (create, read, update, delete, duplicate)
- Dashboard with search and filters

---

### Phase 2: Calculation Engine ✅ Complete (ABSD simplified)
**Deliverables shipped:**
- BSD (tiered IRAS rates)
- ABSD (17% flat, pending admin integration)
- GST with refund logic
- LTV suggestion
- Mortgage (PMT)
- 4-scenario exit calculation (compound growth)
- CI/DM/LB profit distribution
- Investable decision logic
- Backup funds in initial investment

**Known gap:** ABSD rate hardcoded, not from `tax_formulas` DB table

---

### Phase 3: Interactive UI ✅ Complete
**Deliverables shipped:**
- 9 sliders (Purchase Price, Rental, Interest Rate, Tenure, Downpayment, 4 Growth Rates)
- Real-time recalculation, debounced 300ms
- Collapsible slider panel with reset
- Modified state badge

**Gap:** CI/DM/LB % sliders not implemented

---

### Phase 4: Visualization & Comparison ✅ Complete
**Deliverables shipped:**
- Trend line chart (Recharts, ROI years 1–10, all 4 scenarios)
- Year-on-year exit table (years 1–10, 4 scenarios)
- Side-by-side comparison with best ROI highlighting

---

### Phase 5: Export ❌ Not started
**Goals:** PDF and Excel generation

**Deliverables pending:**
- PDF generation with all sections per spec
- Excel export with formulas preserved
- Download functionality
- Error handling for failed exports

**Acceptance:** User can export Woodlands evaluation to PDF and Excel, files open correctly

---

### Phase 6: Admin & Polish ❌ Not started
**Goals:** Admin panel, final refinements

**Deliverables pending:**
- Admin UI for BSD/ABSD formula updates (replace 17% hardcode with DB-driven rates)
- CI/DM/LB % sliders
- Toast notifications for errors
- Auto-save drafts
- Mobile warning (unsupported below 1280px)
- Loading indicator during recalculation
- README.md with AI agent onboarding section
- Exit PSF validation against original spreadsheet
- Bug fixes

**Acceptance:** Admin can update formulas, README complete, all acceptance criteria passed

---

## 18. Known Issues

### 18.1 Exit PSF Calculation Needs Spreadsheet Validation
- Formula `purchasePSF × (1 + growthRate)^exitYear` is structurally correct
- Actual values diverge from original spreadsheet — growth rate interpretation may be off
- See HANDOVER.md for sample values and expected outputs

### 18.2 Year-on-Year Outstanding Loan Uses Simplified Formula
- YoY table uses `loanAmount × (1 - year/tenure)` (linear)
- Plan Exit view uses correct amortization formula
- Impact: YoY outstanding loan values are approximations only

### 18.3 ABSD Hardcoded at 17%
- `tax_formulas` table exists but ABSD rate not read from it
- Buyer profile and property count not factored in
- Affects accuracy for non-citizen or third-property buyers

---

## 19. Open Questions

**Post-MVP considerations (not blocking):**
- How to handle property re-sale scenarios (buying property already owned, capital gains tax)?
- Future feature: Actual vs projected tracking post-purchase?
- Should CI/DM/LB % sliders enforce sum-to-100% constraint in real-time?

---

## 20. Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| **Cloud + Multi-user (separate evaluations)** | Enables sharing with partners via export; simpler than real-time collaboration | May 23, 2026 |
| **Solo investment: CI=100%, DM=0%, LB=0%** | Logical representation (one person = all roles); no artificial 33% split | May 23, 2026 |
| **Plan Exit Year: Fixed input (not slider)** | Evaluation is for specific holding period; trend chart shows alternatives | May 23, 2026 |
| **GST is ON TOP of purchase price** | Confirmed via spreadsheet examples (Purchase $1.01M + GST $90.9k) | May 23, 2026 |
| **Supabase + Vercel (free tiers)** | Zero hosting cost, sufficient for expected load, good developer experience | May 23, 2026 |
| **PDF and Excel export (both)** | PDF for partners (read-only), Excel for power users (formula editing) | May 23, 2026 |
| **Edit capability included** | Needed for typo fixes and data corrections; duplicate handles re-evaluation | May 23, 2026 |
| **Keep all evaluations (even rejected)** | Track history, revisit when market changes, avoid re-evaluating same property | May 23, 2026 |
| **Defaults for Industrial + IHC** | Most common case for primary user; accelerates data entry | May 23, 2026 |
| **BSD/ABSD formulas in database (admin-updateable)** | Tax law changes require quick updates without code deployment | May 23, 2026 |
| **Full Residential property support** | User evaluates all three property types equally; not just Industrial/Commercial | May 23, 2026 |
| **State-based navigation (no React Router)** | Simpler for single-page app with few views; `window.history.pushState` for URL sharing | June 2026 |
| **Vite as build tool** | Faster HMR and build times than CRA; native TypeScript support | June 2026 |
| **Recharts for charting** | Simpler API than Chart.js for React; sufficient for trend line use case | June 2026 |
| **initialInvestmentWithoutGST as ROI denominator** | GST may be refundable; excluding it gives consistent ROI base regardless of GST registration status | June 2026 |
| **Backup funds = months × rental** | Cash reserve sized to rental income; covers vacancy risk | June 2026 |

---

## 21. Out-of-Scope

**Explicitly excluded from MVP (documented for future phases):**

- Real-time collaboration (shared workspaces, concurrent editing, comments)
- Post-purchase tracking (actual rental income, expense tracking, performance monitoring vs projections)
- Property ranking/scoring beyond Investable yes/no
- API integration with PropertyGuru, SRX, or other listing services
- Automated market data feeds (interest rates, rental comps, vacancy rates)
- Email/SMS notifications for market changes or deal alerts
- Custom chart builder or advanced visualizations
- Bulk import via CSV
- Version history with change diffs
- Mobile native apps
- Offline mode
- Multi-currency support
- International property markets
- Calendar integration
- CRM integration
- Accounting software integration (Xero, QuickBooks)
- Machine learning price predictions
- Risk scoring algorithms
- Portfolio optimization across multiple properties
- Tax optimization recommendations
- Property agents (commercial use)
- Multi-user teams with roles (viewer, editor, admin)
- White-label for investment firms

---

## END OF PRD

**Document Version:** 1.2
**Status:** Phases 1–4 complete. Phases 5–6 (Export + Admin/Polish) pending.
