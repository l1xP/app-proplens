# Deployment Guide - PropLens

This document provides step-by-step instructions for deploying the application to Vercel (frontend) and Supabase (backend).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance](#maintenance)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account (for code repository)
- [ ] Vercel account (https://vercel.com)
- [ ] Supabase account (https://supabase.com)
- [ ] Git installed locally
- [ ] Node.js 18+ installed
- [ ] Project code pushed to GitHub repository

---

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in project details:
   - **Name:** `proplens` (or your preferred name)
   - **Database Password:** Save this securely
   - **Region:** Choose closest to your users (e.g., Southeast Asia - Singapore)
4. Click "Create new project"
5. Wait for project to be provisioned (~2 minutes)

### Step 2: Get API Keys

1. In your Supabase dashboard, go to **Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these values:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJhbGc...`)

Save these - you'll need them for Vercel deployment.

### Step 3: Apply Database Migrations

The project includes migration files in `supabase/migrations/`. You need to apply these to set up the database schema.

#### Option A: Using Supabase Dashboard (Recommended for first deployment)

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Open the file `supabase/migrations/20260529032658_20240529_create_initial_schema.sql.sql`
4. Copy the entire content
5. Paste into SQL Editor
6. Click "Run" to execute
7. Verify tables were created in **Table Editor**

#### Option B: Using MCP Tools (if available)

If you have Supabase MCP tools configured:

```bash
# The migration will be applied via the apply_migration tool
# Check that tables exist by listing tables
```

### Step 4: Enable Authentication

1. Go to **Authentication** > **Providers**
2. Ensure **Email** is enabled (should be by default)
3. Optionally configure:
   - Email confirmation (disabled by default in this project)
   - Password requirements
   - Session expiration

### Step 5: Configure Row Level Security (RLS)

The migration already enables RLS, but verify:

1. Go to **Table Editor**
2. For each table (`evaluations`, `tax_formulas`, `user_roles`):
   - Click the table
   - Click **RLS Policies** tab
   - Verify policies are created
   - Should see policies like "Users can manage own evaluations"

### Step 6: Seed Tax Formula Data (Optional)

If starting fresh, you may need to seed the `tax_formulas` table:

```sql
-- Run in SQL Editor
INSERT INTO tax_formulas (formula_type, formula_name, formula_config, description, updated_at)
VALUES 
(
  'BSD',
  'standard',
  '[
    {"min": 0, "max": 180000, "rate": 0.01},
    {"min": 180000, "max": 360000, "rate": 0.02},
    {"min": 360000, "max": 1000000, "rate": 0.03},
    {"min": 1000000, "max": 1500000, "rate": 0.04},
    {"min": 1500000, "max": 3000000, "rate": 0.05},
    {"min": 3000000, "max": null, "rate": 0.06}
  ]'::jsonb,
  'Standard BSD rates per IRAS',
  now()
),
(
  'ABSD',
  'individual_buyer',
  '[
    {"citizenship": "SC", "first_property": 0, "second_property": 12, "third_plus": 15},
    {"citizenship": "PR", "first_property": 5, "second_property": 15, "third_plus": 15},
    {"citizenship": "Foreigner", "first_property": 60, "second_property": 60, "third_plus": 60},
    {"citizenship": "Entity", "first_property": 65, "second_property": 65, "third_plus": 65}
  ]'::jsonb,
  'ABSD rates for various buyer profiles',
  now()
);
```

---

## Vercel Deployment

### Step 1: Push Code to GitHub

If you haven't already:

```bash
# Initialize git if needed
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote (create repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to main branch
git push -u origin main
```

### Step 2: Connect Vercel to GitHub

1. Go to https://vercel.com and sign in
2. Click "Add New..." > "Project"
3. Click "Import Git Repository"
4. If first time, click "Connect GitHub Account"
5. Select your repository from the list
6. Click "Import"

### Step 3: Configure Project Settings

In the "Configure Project" screen:

**Framework Preset:**
- Should auto-detect "Vite"
- If not, select "Vite" from dropdown

**Root Directory:**
- Leave as `./` (or set to project folder if in monorepo)

**Build Settings:**
- Build Command: `npm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)
- Install Command: `npm install` (auto-detected)

**Environment Variables:**
Click "Environment Variables" and add:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

These MUST match what you copied from Supabase dashboard.

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Vercel will show build logs

**On Success:**
- Vercel shows "Congratulations!" screen
- Displays preview URL (e.g., `https://sg-property-calculator.vercel.app`)

### Step 5: Verify Deployment

1. Click the preview URL
2. Verify:
   - Application loads
   - Login page appears
   - No console errors
3. Test registration and login
4. Create a test evaluation

---

## Environment Variables

### Required Variables

These MUST be set for the application to work:

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Public anon key | Supabase Dashboard > Settings > API |

### Optional Variables

Future enhancements may use:

| Variable | Description | Required For |
|----------|-------------|--------------|
| `VITE_APP_ENV` | Environment name | Logging, debugging |
| `VITE_GA_TRACKING_ID` | Google Analytics ID | Analytics |

### Setting Environment Variables in Vercel

**Initial Deployment:**
- Set during Step 3 above

**After Deployment:**
1. Go to Vercel Dashboard
2. Select your project
3. Click "Settings" tab
4. Click "Environment Variables" in sidebar
5. Add/Edit/Remove variables
6. Click "Save"
7. **IMPORTANT:** Redeploy for changes to take effect

**Multiple Environments:**
- Preview: For pull request previews
- Production: For main branch
- Development: For development branch (if configured)

Set different values for each environment if needed.

### Local Development

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Security:**
- ✅ `anon` key is safe for frontend (designed to be public)
- ❌ NEVER commit `.env` to git
- ❌ NEVER use `service_role` key in frontend code
- ✅ `.env` is already in `.gitignore`

---

## Post-Deployment

### Step 1: Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Click "Settings" > "Domains"
3. Click "Add"
4. Enter your domain (e.g., `calculator.yourcompany.com`)
5. Configure DNS records as instructed
6. Wait for verification

### Step 2: Enable Analytics (Optional)

Vercel provides free analytics:

1. In Vercel Dashboard, go to your project
2. Click " Analytics" tab
3. Click "Enable Analytics"
4. View visitor data over time

### Step 3: Test Production

**Authentication:**
- [ ] Register new account
- [ ] Login
- [ ] Logout
- [ ] Password reset (if enabled)

**Core Features:**
- [ ] Create new evaluation
- [ ] Save draft
- [ ] Edit evaluation
- [ ] Delete evaluation
- [ ] Duplicate evaluation
- [ ] Compare evaluations

**Calculations:**
- [ ] BSD calculated correctly
- [ ] GST shows $0 for residential
- [ ] LTV suggestion accurate
- [ ] Exit scenarios display
- [ ] ROI calculations work

**Data Persistence:**
- [ ] Data saves to database
- [ ] Data persists after refresh
- [ ] User can only see their data (RLS working)

### Step 4: Set Up Monitoring

**Vercel Logs:**
1. Go to Project > "Deployments"
2. Click on any deployment
3. Click "Functions" or "Runtime Logs"
4. View real-time logs

**Supabase Logs:**
1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. View API, Postgres, Auth logs

---

## Troubleshooting

### Build Fails on Vercel

**Error: "Module not found"**
```
Error: Cannot find module 'some-package'
```

**Fix:**
- Check `package.json` has the dependency
- Run `npm install` locally and test
- Ensure lock file is committed

**Error: "VITE_SUPABASE_URL is not defined"**
```
ReferenceError: process.env.VITE_SUPABASE_URL is not defined
```

**Fix:**
- Add environment variables in Vercel dashboard
- Redeploy after adding
- Verify variable names match (case-sensitive)

**Error: TypeScript errors**
```
Type 'X' is not assignable to type 'Y'
```

**Fix:**
- Run `npm run build` locally
- Fix TypeScript errors
- Push fixes to GitHub
- Vercel will auto-deploy

### Application Not Loading

**Blank white screen:**
1. Check browser console for errors
2. Verify environment variables are set
3. Check Supabase connection

**"Failed to fetch" errors:**
1. Verify `VITE_SUPABASE_URL` is correct
2. Check Supabase project is not paused
3. Verify URL format: `https://xxxxx.supabase.co` (no trailing slash)

**Authentication not working:**
1. Verify `VITE_SUPABASE_ANON_KEY` is correct
2. Check Supabase Auth is enabled
3. Verify email provider is enabled in Supabase

### Database Issues

**Tables not created:**
1. Run migrations in Supabase SQL Editor
2. Check for SQL errors in migration output
3. Verify table names match TypeScript types

**"Permission denied" for database operations:**
1. Check RLS policies exist
2. Verify user is authenticated
3. Check policies allow the operation

**RLS blocking all access:**
- You may have enabled RLS without creating policies
- Run the migration to create policies
- Or manually create policies in SQL Editor

### CORS Errors

If you see CORS errors:
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Fix:**
- Supabase handles CORS automatically
- This shouldn't happen with Supabase client
- If using custom API, configure CORS headers

---

## Maintenance

### Updating the Application

**Automatic Deployments:**
Vercel automatically deploys when you push to the connected branch.

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Vercel will auto-deploy
```

**Manual Deployments:**
1. Go to Vercel Dashboard
2. Select project
3. Click "Deployments"
4. Click "Redeploy" on latest deployment

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Or update specific package
npm install package-name@latest

# Test build
npm run build

# Commit and push
git add package*.json
git commit -m "Update dependencies"
git push
```

### Database Migrations

When schema changes are needed:

1. Create new migration file in `supabase/migrations/`
2. Name format: `YYYYMMDD_description.sql`
3. Write migration SQL with proper comments
4. Test locally if possible
5. Apply to production via Supabase SQL Editor
6. Verify in Table Editor

**Migration Template:**
```sql
/*
  # Short description of migration

  1. New Tables
    - table_name (description)

  2. Modified Tables
    - table_name (what changed)

  3. Security
    - RLS policies added/removed
*/

CREATE TABLE IF NOT EXISTS new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns
);

ALTER TABLE existing_table ADD COLUMN IF NOT EXISTS new_column type;
```

### Monitoring Production

**Regular Checks:**

**Weekly:**
- [ ] Check Vercel Analytics for uptime/performance
- [ ] Review error logs for issues
- [ ] Check Supabase dashboard for usage

**Monthly:**
- [ ] Review database size and performance
- [ ] Update dependencies if security patches needed
- [ ] Check backup status

**Quarterly:**
- [ ] Review and update tax formulas if laws change
- [ ] Audit user access and roles
- [ ] Review security practices

### Backup Strategy

**Supabase Backups:**
- Supabase automatically backs up databases
- Restore from Supabase Dashboard > Database > Backups
- For Pro projects: Point-in-time recovery available

**Manual Backups:**
```bash
# Export data using Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql

# Or use MCP tools if available
# Use the execute_sql tool to export critical tables
```

**Code Backups:**
- Use GitHub for version control
- Tag releases for production deployments
```bash
git tag -a v1.0.0 -m "Production release 1.0.0"
git push origin v1.0.0
```

### Security Updates

**When to Update:**
- Security vulnerabilities announced
- Dependencies with known exploits
- Framework updates (React, Vite)
- Supabase client library updates

**How to Update Safely:**
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Review changes
git diff package.json

# Test locally
npm run dev
npm run build

# Deploy
git add .
git commit -m "Security updates"
git push
```

---

## CI/CD Pipeline (Optional)

### GitHub Actions Setup

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist
```

Add secrets in GitHub repository settings:
1. Go to repo > Settings > Secrets and variables > Actions
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

---

## Rollback Procedures

### Vercel Rollback

If a deployment causes issues:

1. Go to Vercel Dashboard
2. Select project
3. Click "Deployments"
4. Find last working deployment
5. Click "..." menu
6. Click "Redeploy"
7. Confirm rollback

### Database Rollback

If database migration causes issues:

1. Keep previous migration files
2. Create "down" migration to reverse changes
3. Test on local/staging first
4. Apply to production via SQL Editor
5. Verify data integrity

**Example Down Migration:**
```sql
-- Revert: Remove added column
ALTER TABLE evaluations DROP COLUMN IF EXISTS new_column;

-- Revert: Drop new table
DROP TABLE IF EXISTS new_table;
```

---

## Scaling Considerations

### Current Architecture Limits

- **Vercel Free Tier:** 100GB bandwidth, 100 builds/day
- **Supabase Free Tier:** 500MB database, 5GB bandwidth

### When to Upgrade

**Upgrade Vercel if:**
- Bandwidth exceeds 100GB/month
- Need team features
- Need longer build times
- Need advanced analytics

**Upgrade Supabase if:**
- Database exceeds 500MB
- Need point-in-time recovery
- Need dedicated support
- Need custom backup policies

### Optimization Tips

**Reduce Bundle Size:**
- Code-split by route
- Lazy load heavy components (charts)
- Tree-shake unused code

**Reduce Database Load:**
- Add indexes on frequently queried columns
- Cache tax formulas client-side
- Implement pagination for large lists

**Reduce API Calls:**
- Batch operations where possible
- Cache unchanged data
- Use React Query for caching

---

## Support & Resources

### Official Documentation

- **Vercel:** https://vercel.com/docs
- **Supabase:** https://supabase.com/docs
- **React:** https://react.dev
- **Vite:** https://vitejs.dev

### Troubleshooting Help

- **Vercel Status:** https://www.vercel-status.com
- **Supabase Status:** https://status.supabase.com
- **GitHub Issues:** Check project issues on GitHub

### Community

- **Supabase Discord:** https://discord.supabase.com
- **Vercel Discord:** https://vercel.com/discord

---

## Checklist: Production Deployment

Complete this checklist before announcing the application:

### Pre-Deployment
- [ ] All migrations applied to Supabase production
- [ ] Tax formulas seeded in database
- [ ] Environment variables configured in Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic with Vercel)

### Testing
- [ ] Registration works
- [ ] Login works
- [ ] Evaluation CRUD works
- [ ] Calculations verified against test cases
- [ ] Data persists correctly
- [ ] RLS policies working (users only see own data)

### Security
- [ ] RLS enabled on all tables
- [ ] No service_role keys in frontend code
- [ ] No sensitive data in git repository
- [ ] Authentication working correctly

### Performance
- [ ] Build completes successfully
- [ ] Page load time acceptable
- [ ] No console errors
- [ ] Charts render correctly

### Monitoring
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Backup strategy documented

### Documentation
- [ ] README.md updated
- [ ] HANDOVER.md updated
- [ ] DEPLOYMENT.md current
- [ ] Release notes prepared

---

**Document Version:** 1.0  
**Last Updated:** May 30, 2026  
**Maintained By:** Development Team
