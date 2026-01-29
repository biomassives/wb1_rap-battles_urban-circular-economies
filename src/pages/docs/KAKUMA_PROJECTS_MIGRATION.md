---
layout: "../../layouts/DocLayout.astro"
title: "KAKUMA_PROJECTS_MIGRATION"
---
<div data-pagefind-filter="type:docs"></div>

# Kakuma Projects & Donations Migration Guide

This migration adds support for the generic projects and donations system that powers the Kakuma page and can be used for other WorldBridge One initiatives.

## What This Migration Adds

### New Tables

1. **`projects`** - Generic projects table
   - Supports multiple initiatives (Kakuma, future initiatives)
   - Includes funding tracking, beneficiary counts, status
   - Pre-loaded with 5 sample Kakuma projects

2. **`donations`** - Donation tracking table
   - Tracks donations to specific projects or general fund
   - Supports recurring donations
   - Blockchain transaction hash support
   - Anonymous donation option

## How to Run This Migration

### Option 1: Run Both Tables Together (Recommended)

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste **both** files in this order:
   - First: `add_projects_table.sql`
   - Second: `add_donations_table.sql`
4. Click "Run"

### Option 2: Run Individual Files

**Step 1: Add Projects Table**
```bash
# Run add_projects_table.sql in Supabase SQL Editor
```

**Step 2: Add Donations Table**
```bash
# Run add_donations_table.sql in Supabase SQL Editor
```

## What Gets Created

### Projects Table Schema

```sql
CREATE TABLE projects (
  id VARCHAR(255) PRIMARY KEY,
  initiative VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  location VARCHAR(255),
  target_beneficiaries INTEGER,
  current_beneficiaries INTEGER DEFAULT 0,
  funding_goal DECIMAL(10, 2),
  funding_raised DECIMAL(10, 2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Sample Projects Included:**
- Permaculture Garden Initiative (Agriculture)
- Solar Panel Training Program (Energy)
- Music Production Academy (Music)
- Clean Water Access Initiative (Water)
- Coding & Tech Skills Bootcamp (Education)

### Donations Table Schema

```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  donor_wallet VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  recurring BOOLEAN DEFAULT FALSE,
  message TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending',
  transaction_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints That Use These Tables

### Projects API
- **GET** `/api/projects/list`
  - Query params: `initiative`, `category`, `status`
  - Returns filtered project list
  - Falls back to sample data if database unavailable

### Donations API
- **POST** `/api/donations/create`
  - Body: `{ projectId, amount, currency, recurring, message, anonymous, walletAddress }`
  - Creates donation record
  - Updates project funding_raised
  - Awards XP to donor

## Features Enabled

### On Kakuma Page (`/kakuma`)

**View Projects Section:**
- Displays all active Kakuma projects
- Filter by category (education, agriculture, energy, water, music)
- Shows funding progress bars
- Shows beneficiary counts

**Make Donation Modal:**
- Select specific project or general fund
- Quick amount buttons ($10, $25, $50, $100)
- Recurring donation option
- Impact preview based on amount
- Anonymous donation option
- Message of encouragement

**Project Cards Display:**
- Project title and description
- Location tag
- Funding progress (raised/goal)
- Beneficiary progress (current/target)
- Status badge (active/completed)
- Timeline remaining
- Support Project button
- View Details button

## Testing the Migration

### 1. Verify Tables Created

```sql
-- Check projects table
SELECT * FROM projects WHERE initiative = 'kakuma';

-- Check donations table exists
SELECT COUNT(*) FROM donations;
```

### 2. Test Project Filtering

```sql
-- Get all education projects
SELECT * FROM projects WHERE category = 'education';

-- Get active Kakuma projects
SELECT * FROM projects WHERE initiative = 'kakuma' AND status = 'active';
```

### 3. Test Donation Creation

```sql
-- Create test donation
INSERT INTO donations (project_id, donor_wallet, amount, currency, status)
VALUES ('kakuma-garden-1', 'test_wallet', 25.00, 'USD', 'completed');

-- Check project funding updated
SELECT id, title, funding_raised FROM projects WHERE id = 'kakuma-garden-1';
```

## Rollback (If Needed)

If you need to remove these tables:

```sql
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP FUNCTION IF EXISTS update_donations_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_projects_updated_at() CASCADE;
```

## Integration with Existing System

### XP Rewards for Donations

When a user makes a donation through the API, they automatically earn XP:
- **10 XP per $1 donated**
- XP is added to their user record
- Auto-leveling trigger updates their level/stage

### Project Funding Updates

When a donation is made:
- `projects.funding_raised` is incremented
- Funding progress bars update on frontend
- Beneficiary counts can be manually updated by admins

## Future Enhancements

### Ready for Other Initiatives

The system is designed to be generic:

```sql
-- Add a new initiative project
INSERT INTO projects (id, initiative, title, description, category, ...)
VALUES ('education-initiative-1', 'education', 'Global Learning Hub', ...);
```

### Recurring Donations

The `recurring` flag is in place for future implementation:
- Monthly automatic donations
- Subscription management
- Recurring donation dashboard

### Blockchain Integration

The `transaction_hash` field supports on-chain donations:
- Solana transaction hashes
- Ethereum transaction hashes
- Verification of on-chain donations

## Next Steps After Migration

1. **Verify in Supabase Admin**
   - Go to `/supabase-admin`
   - Click "Tables" tab
   - Confirm `projects` and `donations` tables exist

2. **Test Kakuma Page**
   - Navigate to `/kakuma`
   - Click "View Projects" button
   - Verify 5 sample projects appear
   - Try filtering by category

3. **Test Donation Flow**
   - Click "Make Donation" button
   - Select a project
   - Enter amount
   - Submit (will process in database)

4. **Add Real Project Data**
   - Update sample projects with real images
   - Add actual funding goals
   - Update beneficiary counts
   - Add more projects as needed

## Troubleshooting

### Projects not showing?
- Check API response at `/api/projects/list?initiative=kakuma`
- Verify Supabase connection in environment variables
- Check browser console for errors

### Donations failing?
- Verify `donations` table exists
- Check Supabase permissions (RLS policies)
- Ensure wallet is connected for XP rewards

### Funding not updating?
- Check donation API response
- Verify SQL trigger is working
- Manually verify in Supabase SQL Editor

---

**Migration Created:** 2026-01-01
**Compatible With:** Supabase PostgreSQL 15+
**Required Environment Variables:**
- `lab_POSTGRES_URL` or `DATABASE_URL`
