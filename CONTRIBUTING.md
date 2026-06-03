# Contributing to PropLens

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for developers and tools to contribute features, fix bugs, and maintain the application.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Code Style & Conventions](#code-style--conventions)
6. [Adding Features](#adding-features)
7. [Database Changes](#database-changes)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Common Tasks](#common-tasks)
11. [Pull Request Process](#pull-request-process)

---

## Getting Started

### Prerequisites

- Node.js 18+
- Git
- npm or yarn
- Supabase account (for database access)
- Vercel account (for deployment)

### First Steps

1. Clone the repository
```bash
git clone <repository-url>
cd proplens
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Add your Supabase credentials
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. Start development server
```bash
npm run dev
```

The app opens at `http://localhost:5173`

---

## Development Setup

### Environment Variables

Create `.env` in the project root:

```env
# Required for all development
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Optional
VITE_APP_ENV=development
```

**Never commit `.env` to git** - it's already in `.gitignore`.

### Supabase Connection

To access the production database for testing:

1. Get credentials from the project maintainer
2. Add them to `.env`
3. Verify connection by checking console logs in dev tools

### TypeScript Setup

Generate types from database schema:

```bash
# Install Supabase CLI (optional, for advanced use)
npm install -g @supabase/cli

# Types are already in src/types/database.ts
# Update this file if schema changes
```

---

## Project Structure

### Directory Overview

```
src/
├── components/
│   ├── auth/                 # Login/Register forms
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── common/               # Reusable components
│   │   ├── Layout.tsx        # App shell/navigation
│   │   ├── SensitivitySliders.tsx  # What-if scenarios
│   │   ├── TrendLineChart.tsx      # Chart visualization
│   │   └── ...
│   └── evaluations/          # Evaluation-specific
│       └── EvaluationForm.tsx      # Multi-step form
├── hooks/
│   └── useAuth.tsx           # Auth context & state
├── lib/
│   ├── calculations.ts       # ⚠️ All financial formulas
│   └── supabase.ts           # Database client
├── pages/
│   ├── Dashboard.tsx         # Evaluation list/search
│   ├── CreateEvaluation.tsx  # New evaluation wizard
│   ├── EvaluationDetail.tsx  # View results + sliders
│   └── Comparison.tsx        # Compare 2+ evaluations
├── types/
│   └── database.ts           # TypeScript interfaces
├── App.tsx                   # Main component
├── index.css                 # Global styles
└── main.tsx                  # React entry point

supabase/
└── migrations/               # Database schema changes
    └── 20260529032658_*.sql
```

### Key Files to Know

| File | Purpose | When to Modify |
|------|---------|---|
| `src/lib/calculations.ts` | All financial formulas | Adding calculations, fixing bugs |
| `src/types/database.ts` | TypeScript types | Database schema changes |
| `src/hooks/useAuth.tsx` | Authentication state | Auth flow changes |
| `src/pages/EvaluationDetail.tsx` | Results display | UI changes, new metrics |
| `supabase/migrations/*.sql` | Database schema | Adding tables, columns, policies |

---

## Development Workflow

### Starting Development

```bash
# 1. Create a new branch
git checkout -b feature/your-feature-name
# or for bug fixes:
git checkout -b fix/bug-description

# 2. Make changes to code
# 3. Test locally
npm run dev

# 4. Build to check for errors
npm run build

# 5. Commit changes
git add .
git commit -m "Clear description of changes"

# 6. Push and create PR
git push origin feature/your-feature-name
```

### Branch Naming

Use clear, descriptive branch names:

```
feature/add-pdf-export
feature/sensitivity-sliders
fix/exit-psf-calculation
fix/authentication-redirect
docs/update-readme
refactor/extract-calculations-helper
```

### Commit Messages

Write clear, concise commit messages:

```
# Good
Add sensitivity sliders for what-if analysis
Fix exit PSF calculation for 3+ year scenarios
Update BSD rates to latest IRAS regulations

# Avoid
updated stuff
fix bug
changes
```

---

## Code Style & Conventions

### TypeScript

- **Always use TypeScript** - no `any` types unless absolutely necessary
- Import types with `import type { }` syntax
- Use interfaces over types for object definitions
- Keep types close to where they're used

**Example:**
```typescript
import type { Evaluation } from '../types/database'

interface EvaluationDetailProps {
  evaluationId: string
  onNavigate: (view: string) => void
}

export function EvaluationDetail({ evaluationId, onNavigate }: EvaluationDetailProps) {
  // component code
}
```

### React Components

- Functional components only (no class components)
- Use hooks for state (`useState`, `useEffect`, `useContext`)
- Keep components focused on single responsibility
- Extract large components into smaller parts

**Example:**
```typescript
export function PropertyCard({ property }: PropertyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="card">
      <h3>{property.name}</h3>
      {isExpanded && <PropertyDetails property={property} />}
      <button onClick={() => setIsExpanded(!isExpanded)}>
        Toggle Details
      </button>
    </div>
  )
}
```

### Styling with Tailwind

- Use Tailwind classes for styling
- No component-specific CSS files unless necessary
- Follow Tailwind best practices
- Responsive design with `md:`, `lg:` breakpoints

**Example:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="card p-4 rounded-lg bg-surface hover:bg-surface-hover transition-colors">
    {/* content */}
  </div>
</div>
```

### Naming Conventions

```typescript
// Components: PascalCase
function PropertyCard() {}
export function EvaluationDetail() {}

// Functions: camelCase
function calculateROI() {}
const handleClick = () => {}

// Variables: camelCase
const propertyName = 'Woodlands 11'
let totalInvestment = 0

// Constants: UPPER_SNAKE_CASE
const MAX_LOAN_TENURE = 35
const DEFAULT_DOWNPAYMENT = 0.20

// Files: kebab-case (components: PascalCase)
src/lib/calculations.ts
src/hooks/useAuth.tsx
src/components/common/SensitivitySliders.tsx
```

### Error Handling

Always handle errors gracefully:

```typescript
// Database operations
const { data, error } = await supabase
  .from('evaluations')
  .select('*')

if (error) {
  console.error('Failed to fetch evaluations:', error)
  setError('Unable to load evaluations. Please try again.')
  return
}

// API calls
try {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
} catch (error) {
  console.error('Failed to fetch:', error)
  // Show user-friendly message
}
```

---

## Adding Features

### Feature Development Steps

#### 1. Plan the Feature

Ask yourself:
- What problem does this solve?
- Who uses this feature?
- What data is needed?
- What calculations are involved?

#### 2. Update Database (if needed)

Create a migration:

```bash
# File: supabase/migrations/YYYYMMDD_add_feature.sql
```

**Migration template:**
```sql
/*
  # Add feature name

  1. New Tables
    - table_name (description)

  2. Modified Tables
    - existing_table (what changed)

  3. Security
    - RLS policies added
*/

CREATE TABLE IF NOT EXISTS new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- columns
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own records"
  ON new_table
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### 3. Update Types

Update `src/types/database.ts`:

```typescript
export interface NewTable {
  id: string
  user_id: string
  field_name: string
  created_at: string
  updated_at: string
}

export interface Evaluation {
  // ... existing fields ...
  new_field?: string
}
```

#### 4. Implement Feature

- Create/modify components
- Add calculations if needed
- Update pages to use new components
- Test thoroughly

#### 5. Test

- Test happy path
- Test error cases
- Test edge cases
- Test with real data

---

## Database Changes

### Creating Migrations

**Important:** Always use the migration tool to apply schema changes.

```sql
/*
  # Clear descriptive title

  1. New Tables
    - `table_name`: Description of table
      - `id`: UUID primary key
      - `name`: Text field description
      - Other columns with descriptions

  2. Modified Tables
    - `existing_table`: What changed
      - Added column `new_column`
      - Changed type of `old_column`

  3. Security
    - Enabled RLS on new table
    - Added policy for user access
    - Added policy for admin access

  4. Important Notes
    - Note about data migration
    - Note about backwards compatibility
    - Note about performance implications
*/

-- New table
CREATE TABLE IF NOT EXISTS new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can read own records"
  ON new_table FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create records"
  ON new_table FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### Best Practices

- **Always include RLS** on new tables
- **Use IF NOT EXISTS** to prevent errors
- **Use IF EXISTS** when dropping/altering
- **Document changes** with detailed comments
- **Test locally** before deploying
- **One logical change per migration**
- **Use meaningful column defaults** (NOW(), false, 0, etc.)

### Updating Existing Tables

```sql
-- Add column safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'new_field'
  ) THEN
    ALTER TABLE evaluations ADD COLUMN new_field type DEFAULT value;
  END IF;
END $$;
```

---

## Testing

### Manual Testing Checklist

Before committing, test:

**Authentication:**
- [ ] Register new account
- [ ] Login with valid credentials
- [ ] Logout clears session
- [ ] Cannot access protected pages without auth

**Core Features (depends on changes):**
- [ ] CRUD operations work
- [ ] Data persists correctly
- [ ] UI displays data properly
- [ ] Forms validate input

**Calculations (if modified):**
- [ ] Results match expected values
- [ ] Edge cases handled (zero, negative, very large)
- [ ] Comparisons accurate
- [ ] Charts render correctly

**Database (if schema changed):**
- [ ] Migration applies without errors
- [ ] RLS policies work correctly
- [ ] Users only see their own data

### Browser Testing

Test in multiple browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance

- Check bundle size: `npm run build`
- Monitor console for warnings
- Test with slow network (DevTools Network tab)
- Check for memory leaks

---

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors**
```bash
# Check types locally
npm run build

# Fix errors as reported
# Most common: missing imports, type mismatches
```

**Components not rendering**
```typescript
// 1. Check browser console for React errors
// 2. Verify component imports
// 3. Check props match interface
// 4. Verify state initialization
```

**Database not syncing**
```typescript
// 1. Check environment variables
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)

// 2. Verify user is authenticated
const { data: { user } } = await supabase.auth.getUser()

// 3. Check RLS policies
-- In Supabase dashboard: Table Editor > RLS Policies
```

**Calculations give wrong results**
```typescript
// 1. Add debug logs
console.log('Input:', input)
console.log('Calculation:', result)

// 2. Compare with test cases
// 3. Check for type coercion issues
// 4. Verify formula matches spreadsheet
```

**Sensitivity sliders not updating**
```typescript
// 1. Check debounce delay (currently 300ms)
// 2. Verify onValuesChange prop is passed
// 3. Check if calculateEvaluation is being called
// 4. Monitor console for errors
```

---

## Common Tasks

### Adding a New Input Field

**1. Update database schema** (if storing value):
```sql
ALTER TABLE evaluations ADD COLUMN new_field_name type DEFAULT value;
```

**2. Update TypeScript types:**
```typescript
// src/types/database.ts
export interface Evaluation {
  // ... existing fields ...
  new_field_name: type
}
```

**3. Add to evaluation form:**
```typescript
// src/components/evaluations/EvaluationForm.tsx
<input
  type="number"
  value={formData.new_field_name}
  onChange={(e) => setFormData({
    ...formData,
    new_field_name: parseFloat(e.target.value)
  })}
  className="input"
/>
```

**4. Use in calculations:**
```typescript
// src/lib/calculations.ts
function calculateSomething(evaluation: Evaluation) {
  const value = evaluation.new_field_name
  // use value in calculation
}
```

**5. Display in results:**
```typescript
// src/pages/EvaluationDetail.tsx
<p className="text-lg font-semibold">
  {formatCurrency(results.newFieldResult)}
</p>
```

### Fixing a Calculation

**1. Identify the issue:**
- Compare with original spreadsheet
- Check formula against IRAS guidelines
- Test with known values

**2. Locate the calculation:**
- Check `src/lib/calculations.ts`
- Search for function name
- Review input parameters

**3. Fix the formula:**
```typescript
// Before
const result = value * rate

// After
const result = value * Math.pow(1 + rate, years)
```

**4. Test the fix:**
```bash
npm run build
npm run dev
# Test with sample data
```

**5. Update documentation:**
- Add comment if logic is non-obvious
- Update HANDOVER.md if known issue changed

### Adding a New Calculation Metric

**1. Create calculation function:**
```typescript
// src/lib/calculations.ts
export function calculateNewMetric(evaluation: Evaluation): number {
  // calculation logic
  return result
}
```

**2. Add to CalculationResults type:**
```typescript
export interface CalculationResults {
  // ... existing metrics ...
  newMetric: number
}
```

**3. Call in calculateEvaluation:**
```typescript
export function calculateEvaluation(evaluation: Evaluation): CalculationResults {
  return {
    // ... existing results ...
    newMetric: calculateNewMetric(evaluation)
  }
}
```

**4. Display in UI:**
```typescript
// src/pages/EvaluationDetail.tsx
<div className="card">
  <p className="text-sm text-secondary">New Metric Label</p>
  <p className="text-2xl font-bold">
    {formatCurrency(results.newMetric)}
  </p>
</div>
```

### Adding a Slider Parameter

**1. Update SensitivitySliders component:**
```typescript
// src/components/common/SensitivitySliders.tsx
const sliderConfigs: SliderConfig[] = [
  // ... existing sliders ...
  {
    key: 'new_field',
    label: 'New Parameter',
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    format: 'percent'
  }
]
```

**2. Test the slider:**
- Verify min/max values are appropriate
- Check step size for granularity
- Test with extreme values
- Verify calculations update

---

## Pull Request Process

### Before Submitting PR

- [ ] All code is committed to your branch
- [ ] `npm run build` completes without errors
- [ ] No console warnings (fix TypeScript issues)
- [ ] Tested locally thoroughly
- [ ] Updated HANDOVER.md if needed
- [ ] Added comments only where WHY is non-obvious
- [ ] Followed code style conventions

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tested on localhost
- [ ] All scenarios verified
- [ ] Database operations tested (if applicable)

## Files Changed
- src/pages/NewPage.tsx
- src/lib/calculations.ts
- supabase/migrations/...

## Related Issues
Fixes #123
```

### Code Review Criteria

- Code follows conventions
- TypeScript types are correct
- No security vulnerabilities
- Calculations verified
- Database changes follow best practices
- Tests pass
- Documentation updated

---

## Documentation

### When to Document

- **HANDOVER.md:** Known issues, business logic decisions
- **Code comments:** Non-obvious logic, tricky calculations
- **Git commits:** What changed and why
- **Type definitions:** Complex interfaces

### What NOT to Document

- ❌ What the code does (should be obvious from names)
- ❌ Reference to the current task/PR (belongs in PR description)
- ❌ How to run common commands (in README)

### Good Comments

```typescript
// Round to nearest cent for currency precision
const roundedAmount = Math.round(amount * 100) / 100

// Compound growth formula matches IRAS requirement for multi-year scenarios
const exitPSF = purchasePSF * Math.pow(1 + growthRate, exitYear)
```

---

## Performance Guidelines

### Bundle Size

Current: ~700KB (gzipped ~200KB)

**Keep in mind:**
- Avoid importing large libraries
- Use lazy loading for heavy components
- Check bundle impact: `npm run build`

### Calculations

**Rules:**
- Keep calculations deterministic
- Avoid infinite loops in recalculations
- Use debouncing for real-time updates (already implemented)
- Cache expensive computations

### Database Queries

**Best practices:**
- Select only needed columns
- Use filters in queries (WHERE clause)
- Paginate large result sets
- Add indexes for frequently queried columns

---

## Resources

### Official Documentation

- **React:** https://react.dev
- **Vite:** https://vitejs.dev
- **TypeScript:** https://www.typescriptlang.org
- **Tailwind CSS:** https://tailwindcss.com
- **Supabase:** https://supabase.com/docs

### Project Documentation

- **README.md** - Project overview
- **HANDOVER.md** - Technical decisions and known issues
- **DEPLOYMENT.md** - How to deploy to production

### Related Resources

- **Lucide React Icons:** https://lucide.dev
- **Recharts:** https://recharts.org
- **IRAS BSD Calculator:** https://www.iras.gov.sg/taxes/stamp-duty

---

## Getting Help

### Common Questions

**Q: How do I run tests?**
A: Currently, no automated tests are configured. Perform manual testing as described above.

**Q: How do I report a bug?**
A: Open an issue in GitHub with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

**Q: How long does deployment take?**
A: Vercel typically deploys within 2-5 minutes. Check deployment status in Vercel dashboard.

**Q: Can I test with production data?**
A: Yes, if you have credentials. Never commit credentials to git. Use .env file.

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn
- Follow the existing code style
- Test before merging

---

## Additional Notes

### Architecture Decisions

Why these technologies?
- **React + TypeScript:** Type-safe UI development
- **Vite:** Fast build and dev server
- **Tailwind CSS:** Utility-first, responsive design
- **Supabase:** Backend without managing infrastructure
- **Recharts:** Charting library with good React integration

### Future Improvements

See HANDOVER.md for:
- Known technical debt
- Planned features
- Bundle size optimization opportunities
- Testing framework setup

### Maintenance

This project is actively maintained. For long-term maintenance:
- Keep dependencies updated
- Monitor security advisories
- Review performance metrics
- Update documentation as features change

---

**Version:** 1.0  
**Last Updated:** May 30, 2026  
**Maintained By:** Development Team

For questions or suggestions, please reach out to the development team or create an issue on GitHub.
