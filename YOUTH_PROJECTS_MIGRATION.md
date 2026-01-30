# Urban & Coastal Youth Projects & Donations Migration Guide

This migration adds support for the generic projects and donations system that powers the Urban & Coastal Youth page and can be used for other WorldBridge One initiatives.

## What This Migration Adds

### New Tables

1. **`projects`** - Generic projects table
   - Supports multiple initiatives (nairobi-youth, lamu-coastal, future initiatives)
   - Includes funding tracking, beneficiary counts, status
   - Pre-loaded with sample urban and coastal youth programs

2. **`donations`** - Donation tracking table
   - Tracks donations to specific projects or general fund
   - Supports recurring donations
   - Blockchain transaction hash support
   - Anonymous donation option

## Actual Programs to Add

### POREFPC (Lamu) - Mureithi Jarife
```sql
INSERT INTO projects (id, initiative, title, description, category, location, status)
VALUES (
  'porefpc-lamu',
  'lamu-coastal',
  'POREFPC - Poverty Reduction Food Pure Culture',
  'Community-led initiative including coconut oil processing, cashew nut processing, beach cleanups, plastics recycling, aluminum ingot making, and table banking.',
  'enterprise',
  'Lamu, Kenya',
  'active'
);
```

### Street Poets (Nairobi) - Fana Ke
```sql
INSERT INTO projects (id, initiative, title, description, category, location, status)
VALUES (
  'street-poets-nairobi',
  'nairobi-youth',
  'Street Poets Youth Empowerment',
  'Rap and poetry youth empowerment program led by Fana Ke, teaching hip-hop culture, performance, and lyric writing.',
  'arts',
  'Nairobi, Kenya',
  'active'
);
```

### Cosmetology School (Nairobi) - Francis 'Rank' Mutuku
```sql
INSERT INTO projects (id, initiative, title, description, category, location, status)
VALUES (
  'cosmetology-nairobi',
  'nairobi-youth',
  'Cosmetology Vocational School',
  'Vocational beauty training led by Francis Rank Mutuku, offering hair styling, makeup artistry, and business skills for beauty entrepreneurs.',
  'enterprise',
  'Nairobi, Kenya',
  'active'
);
```

### OT Kulcha Reggae
```sql
INSERT INTO projects (id, initiative, title, description, category, location, status)
VALUES (
  'ot-kulcha-reggae',
  'nairobi-youth',
  'OT Kulcha Reggae - Pain in the Ghetto',
  'Music production program teaching reggae and dancehall, with studio recording sessions and music industry mentorship.',
  'arts',
  'Nairobi, Kenya',
  'active'
);
```

### K-6 School Support (Njiru)
```sql
INSERT INTO projects (id, initiative, title, description, category, location, status)
VALUES (
  'k6-school-njiru',
  'nairobi-youth',
  'K-6 School Tech & Environmental Education',
  'Tech education and environmental awareness support for primary school in Njiru, in partnership with OT Kulcha.',
  'education',
  'Njiru, Nairobi',
  'active'
);
```

## How to Run This Migration

### Option 1: Run Both Tables Together (Recommended)

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste **both** files in this order:
   - First: `add_projects_table.sql`
   - Second: `add_donations_table.sql`
4. Add the actual programs SQL above
5. Click "Run"

### Option 2: Run Individual Files

**Step 1: Add Projects Table**
```bash
# Run add_projects_table.sql in Supabase SQL Editor
```

**Step 2: Add Donations Table**
```bash
# Run add_donations_table.sql in Supabase SQL Editor
```

**Step 3: Insert Actual Programs**
```bash
# Run the INSERT statements above for each program
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

**Initiative Values:**
- `nairobi-youth` - Urban programs in Nairobi
- `lamu-coastal` - Coastal programs in Lamu
- `general` - Cross-regional programs

**Category Values:**
- `tech` - Tech & AI Literacy
- `arts` - Arts, Music & Culture
- `enterprise` - Social Enterprise
- `health` - Health & Wellness
- `education` - Education & Career
- `environment` - Environmental & Land Regeneration

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

### Youth Programs API
- **GET** `/api/nairobi-youth/programs`
  - Query params: `status`, `category`
  - Returns Urban & Coastal Youth programs
  - Includes 8 program categories

### User Impact API
- **GET** `/api/nairobi-youth/user-impact`
  - Query params: `walletAddress`
  - Returns user's personal contribution metrics

### Global Stats API
- **GET** `/api/nairobi-youth/global-stats`
  - Returns overall impact statistics
  - Includes community breakdown

### Donations API
- **POST** `/api/donations/create`
  - Body: `{ projectId, amount, currency, recurring, message, anonymous, walletAddress }`
  - Creates donation record
  - Updates project funding_raised
  - Awards XP to donor

## Features Enabled

### On Urban & Coastal Youth Page (`/nairobi-youth`)

**Focus Areas Section:**
- 6 focus area cards with icons
- Tech & AI Literacy
- Arts, Music & Culture
- Social Enterprise
- Health & Wellness
- Education & Career
- Environmental Education

**Programs Section:**
- Displays 5 actual programs
- Shows program leader names
- Location badges (Nairobi/Lamu)
- Support buttons

**Volunteer/Mentor Section:**
- Volunteer signup modal
- Mentor registration
- Skills matching

**Impact Dashboard:**
- Total youth reached
- Programs supported
- Community breakdown

## Testing the Migration

### 1. Verify Tables Created

```sql
-- Check projects table
SELECT * FROM projects WHERE initiative IN ('nairobi-youth', 'lamu-coastal');

-- Check donations table exists
SELECT COUNT(*) FROM donations;
```

### 2. Test Project Filtering

```sql
-- Get all Nairobi youth projects
SELECT * FROM projects WHERE initiative = 'nairobi-youth';

-- Get all arts projects
SELECT * FROM projects WHERE category = 'arts';

-- Get active Lamu projects
SELECT * FROM projects WHERE initiative = 'lamu-coastal' AND status = 'active';
```

### 3. Test Donation Creation

```sql
-- Create test donation
INSERT INTO donations (project_id, donor_wallet, amount, currency, status)
VALUES ('street-poets-nairobi', 'test_wallet', 25.00, 'USD', 'completed');

-- Check project funding updated
SELECT id, title, funding_raised FROM projects WHERE id = 'street-poets-nairobi';
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

### XP Rewards for Contributions

When a user supports a program through the API:
- **10 XP per $1 contributed**
- XP is added to their user record
- Auto-leveling trigger updates their level/stage

### Project Funding Updates

When a donation is made:
- `projects.funding_raised` is incremented
- Funding progress bars update on frontend
- Impact statistics refresh

## Program Leaders Contact

| Program | Leader | Location |
|---------|--------|----------|
| POREFPC | Mureithi Jarife | Lamu |
| Street Poets | Fana Ke | Nairobi |
| Cosmetology School | Francis 'Rank' Mutuku | Nairobi |
| OT Kulcha Reggae | - | Nairobi |
| K-6 School Support | - | Njiru |

## Next Steps After Migration

1. **Verify in Supabase Admin**
   - Go to `/supabase-admin`
   - Click "Tables" tab
   - Confirm `projects` and `donations` tables exist

2. **Test Urban & Coastal Youth Page**
   - Navigate to `/nairobi-youth`
   - Verify 5 programs display
   - Check focus area cards
   - Test volunteer modal

3. **Test Donation Flow**
   - Click "Support" on a program
   - Enter amount
   - Submit (will process in database)

4. **Update Program Data**
   - Add real images for programs
   - Set actual funding goals
   - Update beneficiary counts

## Troubleshooting

### Programs not showing?
- Check API response at `/api/nairobi-youth/programs`
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

**Migration Created:** 2026-01-30
**Compatible With:** Supabase PostgreSQL 15+
**Programs Included:** 5 actual programs
**Required Environment Variables:**
- `lab_POSTGRES_URL` or `DATABASE_URL`
