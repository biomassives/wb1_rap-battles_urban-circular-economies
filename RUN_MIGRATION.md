# Run Supabase Migration - Step by Step

## Option 1: Via Supabase Dashboard (Recommended)

### Step 1: Open Supabase SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy Migration SQL

Open the migration file and copy all contents:

```bash
cat supabase_integration_migration.sql | pbcopy  # macOS
cat supabase_integration_migration.sql | xclip -selection clipboard  # Linux
```

Or manually:
1. Open `supabase_integration_migration.sql` in your editor
2. Select all (Cmd/Ctrl + A)
3. Copy (Cmd/Ctrl + C)

### Step 3: Paste and Run

1. Paste into SQL Editor (Cmd/Ctrl + V)
2. Click **Run** button (or press Cmd/Ctrl + Enter)
3. Wait for completion (~10-30 seconds)

### Step 4: Verify Success

You should see messages like:
```
ALTER TABLE
CREATE TABLE
CREATE INDEX
INSERT 0 25
CREATE FUNCTION
CREATE TRIGGER
```

Check for any errors in red. If you see errors, scroll down to Troubleshooting section.

### Step 5: Test Migration

Run this test query in SQL Editor:

```sql
-- Test 1: Check tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('airdrop_templates', 'airdrops', 'collaborations', 'tech_projects', 'gardens')
ORDER BY table_name;

-- Should return 5 rows

-- Test 2: Check airdrop templates loaded
SELECT COUNT(*) as template_count FROM airdrop_templates;

-- Should return 25

-- Test 3: Check achievements loaded
SELECT COUNT(*) as achievement_count FROM achievements;

-- Should return 8

-- Test 4: Test XP award function exists
SELECT proname FROM pg_proc WHERE proname = 'award_xp';

-- Should return 'award_xp'
```

If all tests pass, migration is successful! ✅

---

## Option 2: Via Supabase CLI (Advanced)

### Prerequisites

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Or via Homebrew (macOS)
brew install supabase/tap/supabase
```

### Step 1: Login to Supabase

```bash
supabase login
```

### Step 2: Link to Your Project

```bash
# Get your project ref from dashboard URL: https://supabase.com/dashboard/project/YOUR_PROJECT_REF
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Run Migration

```bash
# Execute migration file
supabase db execute -f supabase_integration_migration.sql

# Or push to remote
supabase db push
```

### Step 4: Verify

```bash
# Check tables
supabase db list

# Or run test query
supabase db execute --query "SELECT COUNT(*) FROM airdrop_templates;"
```

---

## Option 3: Using psql (Database Direct)

### Prerequisites

You need your database connection string from Supabase Dashboard:
- Go to Settings > Database > Connection string > URI

### Run Migration

```bash
# Using psql
psql "your_connection_string_here" -f supabase_integration_migration.sql

# Or using stdin
psql "your_connection_string_here" < supabase_integration_migration.sql
```

---

## Post-Migration Verification

### 1. Count Tables Created

```sql
SELECT
  COUNT(*) as new_tables_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'airdrop_templates', 'airdrops', 'airdrop_claims',
    'collaborations', 'collaboration_contributors',
    'tech_projects', 'project_contributors', 'project_help_wanted',
    'gardens', 'garden_participants', 'harvest_exchange', 'garden_workshops',
    'mentors', 'mentorship_sessions', 'mentorship_programs', 'program_enrollments',
    'achievements', 'user_achievements',
    'events', 'event_participants',
    'user_impact', 'impact_actions',
    'notifications'
  );
-- Expected: 23
```

### 2. Test Auto-Leveling System

```sql
-- Create test user
INSERT INTO users (wallet_address, username, level, xp, is_anonymous)
VALUES ('test_migration_user', 'MigrationTest', 1, 0, false)
RETURNING *;

-- Award XP (should auto-level from 1 to 3)
SELECT award_xp(
  (SELECT id FROM users WHERE wallet_address = 'test_migration_user'),
  500,
  'migration_test',
  'Testing auto-level system'
);

-- Check results
SELECT
  wallet_address,
  level,
  xp,
  life_stage,
  animal_mentor
FROM users
WHERE wallet_address = 'test_migration_user';

-- Expected:
-- level: 3
-- xp: 500
-- life_stage: Egg
-- animal_mentor: chicken

-- Cleanup
DELETE FROM users WHERE wallet_address = 'test_migration_user';
```

### 3. Test View

```sql
-- Check user_progress_view works
SELECT * FROM user_progress_view LIMIT 5;

-- Should return user data with aggregated stats
```

### 4. Test Airdrop System

```sql
-- Create test airdrop
INSERT INTO airdrops (template_id, status, start_date, end_date, max_claims)
VALUES (
  'artist-stream-boost',
  'active',
  NOW(),
  NOW() + INTERVAL '7 days',
  100
)
RETURNING *;

-- Check it appears in active airdrops query
SELECT
  a.id,
  t.name,
  t.tokens,
  t.xp
FROM airdrops a
JOIN airdrop_templates t ON a.template_id = t.id
WHERE a.status = 'active';

-- Should show the stream boost airdrop
```

---

## Troubleshooting

### Error: "relation already exists"

**Cause:** Tables already exist from previous migration attempts.

**Solution:**
```sql
-- Check what exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'airdrop%';

-- Option A: Drop specific table and re-run
DROP TABLE airdrop_templates CASCADE;

-- Option B: Skip to next section of migration
-- (Comment out conflicting CREATE TABLE statements)
```

### Error: "column already exists"

**Cause:** Columns added to users table already.

**Solution:**
```sql
-- Check what columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users';

-- Skip the ALTER TABLE section for existing columns
```

### Error: "function already exists"

**Cause:** Functions were created in previous attempt.

**Solution:**
```sql
-- Replace instead of create
CREATE OR REPLACE FUNCTION award_xp(...)
-- Already in migration file, should work
```

### Error: "permission denied"

**Cause:** Using wrong database credentials or insufficient permissions.

**Solution:**
- Use service_role key (not anon key) for migrations
- Check database settings in Supabase dashboard
- Ensure you're project owner or admin

### Migration Runs But Some Inserts Fail

**Cause:** Duplicate key violations on pre-loaded data.

**Solution:**
This is expected if running migration twice. The `ON CONFLICT DO NOTHING` clauses handle this.

Check what was inserted:
```sql
SELECT COUNT(*) FROM airdrop_templates;  -- Should be 25
SELECT COUNT(*) FROM achievements;       -- Should be 8
```

---

## What to Do After Migration Success

### 1. Document Your Database URL

Add to `.env`:
```env
# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# For direct database access (migrations)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 2. Update API Endpoints

Your existing APIs will work, but you can enhance them:

**Example: Update user progress API**
```javascript
// /api/gamification/user-progress.js
import { neon } from '@neondatabase/serverless';

export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  const sql = neon(process.env.DATABASE_URL);

  // Use the new view for optimized query
  const result = await sql`
    SELECT * FROM user_progress_view
    WHERE wallet_address = ${walletAddress}
  `;

  if (result.length === 0) {
    return new Response(JSON.stringify({
      success: false,
      error: 'User not found'
    }), { status: 404 });
  }

  return new Response(JSON.stringify({
    success: true,
    ...result[0]
  }), { status: 200 });
}
```

### 3. Test Anonymous Wallet Flow

```sql
-- Create anonymous user
INSERT INTO users (wallet_address, is_anonymous)
VALUES ('anon_test_' || gen_random_uuid()::text, true)
RETURNING *;

-- Award some XP
SELECT award_xp(
  (SELECT id FROM users WHERE wallet_address LIKE 'anon_test_%' LIMIT 1),
  250,
  'test_activity',
  'Testing anonymous wallet'
);

-- Claim it with real wallet
UPDATE users
SET
  is_anonymous = false,
  claimed_by_wallet = 'RealWallet123',
  anonymous_claimed_at = NOW()
WHERE wallet_address LIKE 'anon_test_%';
```

### 4. Explore the Data

```sql
-- See all available airdrops
SELECT * FROM airdrop_templates ORDER BY category, name;

-- See all achievements
SELECT * FROM achievements ORDER BY category, rarity;

-- Check user stats
SELECT * FROM user_progress_view;
```

---

## Quick Command Reference

```bash
# Copy migration to clipboard (macOS)
cat supabase_integration_migration.sql | pbcopy

# Copy migration to clipboard (Linux)
cat supabase_integration_migration.sql | xclip -selection clipboard

# View migration file
cat supabase_integration_migration.sql | less

# Count lines in migration
wc -l supabase_integration_migration.sql

# Backup before running (export from Supabase dashboard first)
```

---

## Need Help?

1. Check Supabase Dashboard > Database > Logs for error details
2. Review `SUPABASE_MIGRATION_GUIDE.md` for detailed troubleshooting
3. Use `supabase_quick_reference.sql` for common queries
4. Check Supabase community forum

---

**Ready?** Open Supabase Dashboard → SQL Editor → Copy/Paste → Run! 🚀
