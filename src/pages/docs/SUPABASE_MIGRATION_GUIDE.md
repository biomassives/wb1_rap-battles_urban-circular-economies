---
layout: "../../layouts/DocLayout.astro"
title: "SUPABASE_MIGRATION_GUIDE"
---
<div data-pagefind-filter="type:docs"></div>

# Supabase Integration Migration Guide

## Overview

This migration adds comprehensive support for all WorldBridge One platform features to your Supabase database, including anonymous wallets, airdrops, collaborations, tech projects, gardens, mentorship, achievements, and events.

## What This Migration Adds

### 📊 Database Enhancements

1. **Anonymous Wallet Support** - Track anonymous users and allow claiming
2. **Airdrop System** - 25 reward templates, scheduled drops, claims tracking
3. **Reggae Collaborations** - Music collaboration management
4. **Environmental Tech Projects** - Open-source project tracking
5. **Community Gardens** - Food security initiatives
6. **Mentorship System** - Mentor/mentee matching and sessions
7. **Achievements** - Unlock system with 8+ starter achievements
8. **Events** - Platform events and attendance tracking
9. **Impact Metrics** - Kakuma youth impact tracking
10. **Notifications** - User notification system

### 🗂️ New Tables Created (30+)

**Airdrop System:**
- `airdrop_templates` - 25 reward types
- `airdrops` - Scheduled airdrop drops
- `airdrop_claims` - User claims tracking

**Music & Collaboration:**
- `collaborations` - Reggae collaboration projects
- `collaboration_contributors` - Contributors to collabs

**Technology:**
- `tech_projects` - Environmental tech projects
- `project_contributors` - Project contributors
- `project_help_wanted` - Open roles in projects

**Food Security:**
- `gardens` - Community garden listings
- `garden_participants` - Garden members
- `harvest_exchange` - Produce trading
- `garden_workshops` - Educational workshops

**Mentorship:**
- `mentors` - Mentor profiles
- `mentorship_sessions` - Session tracking
- `mentorship_programs` - Structured programs
- `program_enrollments` - Program participants

**Gamification:**
- `achievements` - Achievement definitions
- `user_achievements` - User unlocks

**Events:**
- `events` - Platform events
- `event_participants` - Event attendance

**Impact:**
- `user_impact` - Aggregated impact metrics
- `impact_actions` - Individual impact actions

**Core:**
- `notifications` - User notifications

### ⚡ Functions & Triggers

- `calculate_xp_for_level()` - Calculate XP needed for level
- `update_user_level()` - Auto-update level when XP changes
- `award_xp()` - Award XP and log activity
- Auto-trigger on XP changes to update level/stage/mentor

### 📈 Views

- `user_progress_view` - Comprehensive user stats in one query

## How to Run This Migration

### Step 1: Backup Your Database

```sql
-- In Supabase SQL Editor, export current schema first
-- Dashboard > Database > Backups > Create Manual Backup
```

### Step 2: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 3: Copy & Paste Migration

1. Open `supabase_integration_migration.sql`
2. Copy the entire file contents
3. Paste into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 4: Verify Success

Check that tables were created:

```sql
-- List all new tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'airdrop_templates',
    'airdrops',
    'airdrop_claims',
    'collaborations',
    'tech_projects',
    'gardens',
    'mentors',
    'achievements',
    'events',
    'user_impact'
  );
```

You should see 10 tables listed.

### Step 5: Test with Sample Query

```sql
-- Check airdrop templates inserted
SELECT id, name, category, tokens, xp
FROM airdrop_templates
LIMIT 5;

-- Should return 5 reward templates
```

## Post-Migration Tasks

### 1. Update Environment Variables

Add to your `.env` file:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Keep existing database URLs for migration
lab_POSTGRES_URL=your-neon-or-vercel-postgres-url
```

### 2. Update API Endpoints

The migration is compatible with your existing APIs, but you can enhance them:

**`/api/gamification/user-progress`** - Already works ✅
- Now includes life_stage and animal_mentor from database

**`/api/airdrops/*`** - Create these new endpoints:
```javascript
// Get active airdrops
GET /api/airdrops/active

// Claim airdrop
POST /api/airdrops/claim
{
  "userId": "uuid",
  "airdropId": "uuid",
  "proof": {}
}

// Get user's airdrop history
GET /api/airdrops/claims?userId=uuid
```

**`/api/collaborations/*`** - New endpoints needed:
```javascript
GET /api/collaborations/open
POST /api/collaborations/create
POST /api/collaborations/:id/join
```

**`/api/projects/*`** - New endpoints needed:
```javascript
GET /api/projects?category=solar
POST /api/projects/create
GET /api/projects/:id/help-wanted
```

### 3. Test Anonymous Wallet Flow

```sql
-- Insert test anonymous user
INSERT INTO users (wallet_address, username, level, xp, is_anonymous)
VALUES ('anon_TEST123456789', 'TestAnon', 1, 0, true)
RETURNING *;

-- Award XP (will auto-update level via trigger)
SELECT award_xp(
  (SELECT id FROM users WHERE wallet_address = 'anon_TEST123456789'),
  500,
  'test_activity',
  'Testing XP award system'
);

-- Check updated user (should be level 3 now)
SELECT wallet_address, level, xp, life_stage, animal_mentor
FROM users
WHERE wallet_address = 'anon_TEST123456789';

-- Claim anonymous wallet
UPDATE users
SET
  is_anonymous = false,
  claimed_by_wallet = 'RealWallet123...',
  anonymous_claimed_at = NOW()
WHERE wallet_address = 'anon_TEST123456789';
```

### 4. Populate Initial Data

#### Add More Achievements

```sql
INSERT INTO achievements (id, name, description, category, icon, xp_reward, token_reward, rarity, requirements) VALUES
('level-10', 'Level 10 Reached', 'Reached level 10', 'social', '🎯', 100, 50, 'uncommon', '{"level": 10}'::jsonb),
('social-butterfly', 'Social Butterfly', 'Connected with 50 users', 'social', '🦋', 150, 75, 'rare', '{"connections": 50}'::jsonb),
('tech-stack-master', 'Tech Stack Master', 'Contributed to 5 different tech projects', 'tech', '🔧', 250, 125, 'epic', '{"projects": 5}'::jsonb);
```

#### Schedule First Airdrop

```sql
-- Create first weekly stream boost airdrop
INSERT INTO airdrops (template_id, status, start_date, end_date, max_claims)
VALUES (
  'artist-stream-boost',
  'active',
  NOW(),
  NOW() + INTERVAL '7 days',
  1000
);
```

#### Create Sample Collaboration

```sql
INSERT INTO collaborations (creator_id, track_name, description, style, needed_roles)
SELECT
  id,
  'Kakuma Voices Riddim',
  'A roots reggae track celebrating Kakuma resilience',
  'roots',
  '["bass", "keys", "percussion"]'::jsonb
FROM users
LIMIT 1;
```

## Integration with Existing Code

### Frontend: Update to Use Supabase

Replace database calls with Supabase client:

```javascript
// Install Supabase client
npm install @supabase/supabase-js

// Create Supabase client (src/lib/supabase.js)
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY
);

// Example: Load user progress
async function loadUserProgress(walletAddress) {
  const { data, error } = await supabase
    .from('user_progress_view')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error) {
    console.error('Error loading progress:', error);
    return null;
  }

  return data;
}

// Example: Claim airdrop
async function claimAirdrop(userId, airdropId, proof) {
  const { data, error } = await supabase
    .from('airdrop_claims')
    .insert({
      user_id: userId,
      airdrop_id: airdropId,
      verification_proof: proof
    })
    .select()
    .single();

  if (error) {
    console.error('Error claiming airdrop:', error);
    return { success: false, error: error.message };
  }

  // Award tokens and XP
  const airdrop = await supabase
    .from('airdrops')
    .select('*, template:airdrop_templates(*)')
    .eq('id', airdropId)
    .single();

  await supabase.rpc('award_xp', {
    p_user_id: userId,
    p_xp_amount: airdrop.data.template.xp,
    p_activity_type: 'airdrop_claim',
    p_description: `Claimed ${airdrop.data.template.name}`
  });

  return { success: true, data };
}
```

### Backend: Use Direct Queries

```javascript
// api/collaborations/create.js
import { neon } from '@neondatabase/serverless';

export async function POST({ request }) {
  const sql = neon(process.env.lab_POSTGRES_URL);
  const body = await request.json();

  const result = await sql`
    INSERT INTO collaborations (
      creator_id, track_name, description, style, needed_roles
    ) VALUES (
      ${body.creatorId},
      ${body.trackName},
      ${body.description},
      ${body.style},
      ${JSON.stringify(body.neededRoles)}::jsonb
    )
    RETURNING *
  `;

  return new Response(JSON.stringify({
    success: true,
    collaboration: result[0]
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Common Queries

### Get User's Full Progress

```sql
SELECT * FROM user_progress_view
WHERE wallet_address = 'your_wallet_address';
```

### Get Active Airdrops

```sql
SELECT
  a.*,
  t.name,
  t.description,
  t.tokens,
  t.xp,
  t.category
FROM airdrops a
JOIN airdrop_templates t ON a.template_id = t.id
WHERE a.status = 'active'
  AND a.start_date <= NOW()
  AND a.end_date >= NOW()
ORDER BY a.end_date ASC;
```

### Get User's Claimed Airdrops

```sql
SELECT
  ac.*,
  t.name,
  t.category,
  ac.tokens_earned,
  ac.xp_earned
FROM airdrop_claims ac
JOIN airdrop_templates t ON ac.template_id = t.id
WHERE ac.user_id = 'user_uuid'
ORDER BY ac.claimed_at DESC;
```

### Get Open Collaborations

```sql
SELECT
  c.*,
  u.username as creator_username,
  (c.max_contributors - jsonb_array_length(c.current_contributors)) as open_spots
FROM collaborations c
JOIN users u ON c.creator_id = u.id
WHERE c.status = 'open'
  AND jsonb_array_length(c.current_contributors) < c.max_contributors
ORDER BY c.created_at DESC;
```

### Award XP and Check for Level Up

```sql
SELECT award_xp(
  'user_uuid',    -- user ID
  150,            -- XP amount
  'battle_won',   -- activity type
  'Won conscious bars battle'  -- description
);
```

## Troubleshooting

### Migration Fails with "relation already exists"

Some tables might already exist from previous migrations. Either:

1. **Drop existing tables** (CAUTION: loses data):
```sql
DROP TABLE IF EXISTS airdrop_templates CASCADE;
-- Repeat for all tables
```

2. **Use CREATE TABLE IF NOT EXISTS** (already in migration)
3. **Skip errored parts** and continue with rest

### Foreign Key Constraint Errors

Ensure `users` table exists and has proper structure:

```sql
-- Check users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users';
```

### Function Creation Fails

PostgreSQL version might not support some syntax. Check version:

```sql
SELECT version();
```

Supabase uses PostgreSQL 15+, which supports all functions in this migration.

### RLS Policies Blocking Queries

If you enabled RLS policies and queries fail:

```sql
-- Temporarily disable RLS for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable when auth is ready
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## Performance Optimization

### Add Additional Indexes

For high-traffic queries:

```sql
-- Index for wallet lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_wallet_lookup ON users(wallet_address) WHERE is_anonymous = false;

-- Index for active airdrops
CREATE INDEX IF NOT EXISTS idx_airdrops_active ON airdrops(status, start_date, end_date) WHERE status = 'active';

-- Index for user claims
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_lookup ON airdrop_claims(user_id, claimed_at DESC);
```

### Monitor Query Performance

```sql
-- Enable query stats
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT
  calls,
  mean_exec_time,
  query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Next Steps

1. ✅ Run migration in Supabase
2. ✅ Verify tables created
3. ✅ Test sample queries
4. ⬜ Update API endpoints to use new tables
5. ⬜ Update frontend to call new APIs
6. ⬜ Enable RLS when auth is ready
7. ⬜ Populate with real data
8. ⬜ Monitor performance and optimize

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Need Help?** Check the Supabase logs in Dashboard > Database > Logs for detailed error messages.
