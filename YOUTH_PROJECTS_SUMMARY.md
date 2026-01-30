# Urban & Coastal Youth Projects & Donations System - Implementation Summary

## Overview

Implemented a comprehensive, generic projects and donations system for the Urban & Coastal Youth page that can be reused for other WorldBridge One initiatives. This system supports youth programs across Nairobi's urban communities and Lamu's coastal region.

## Actual Youth Programs Supported

### 1. POREFPC (Lamu) - Mureithi Jarife
**POVERTY REDUCTION FOOD PURE CULTURE**
- Coconut oil processing
- Cashew nut processing
- Beach cleanups
- Plastics shredding and reselling
- Aluminum ingot making from recycling
- Community table banking

### 2. Street Poets (Nairobi) - Fana Ke
- Rap/poetry youth empowerment
- Hip-hop culture education
- Performance training
- Lyric writing workshops

### 3. Cosmetology School (Nairobi) - Francis 'Rank' Mutuku
- Vocational beauty training
- Hair styling certification
- Makeup artistry
- Business skills for beauty entrepreneurs

### 4. OT Kulcha Reggae
- "Pain in the Ghetto" music production
- Reggae/dancehall training
- Studio recording sessions
- Music industry mentorship

### 5. K-6 School Support (Njiru)
- Tech education support
- Environmental education
- Digital literacy programs
- Partnership with OT Kulcha

## What Was Built

### 1. Generic Projects API
**File:** `/src/pages/api/projects/list.js`

**Features:**
- Filter by initiative (nairobi-youth, lamu-coastal, general, etc.)
- Filter by category (education, tech, arts, enterprise, health, environment)
- Filter by status (active, completed, all)
- Database-first with sample data fallback
- Returns project details with funding/beneficiary metrics

**Example Usage:**
```javascript
GET /api/projects/list?initiative=nairobi-youth&status=active
GET /api/projects/list?initiative=lamu-coastal&category=environment
GET /api/projects/list?category=tech
```

**Program Categories:**
1. Tech Literacy Hub - Kibera (Tech)
2. AI Skills Workshop - Mathare (Tech)
3. Community Music Studio - Korogocho (Arts)
4. Youth Enterprise Incubator - Mukuru (Enterprise)
5. Youth Health & Wellness - Dandora (Health)
6. Career Mentorship Network - Nairobi-wide (Mentorship)
7. Visual Arts Academy - Kawangware (Arts)
8. Education Support Program - Nairobi-wide (Education)

### 2. Donations API
**File:** `/src/pages/api/donations/create.js`

**Features:**
- Create donations to specific projects or general fund
- Support for USD and SOL currencies
- Recurring donation flag
- Anonymous donation option
- Optional message to youth
- Auto-awards XP (10 XP per $1)
- Updates project funding_raised
- Database-first with localStorage fallback

**Request Body:**
```json
{
  "projectId": "tech-literacy-kibera",
  "amount": 50.00,
  "currency": "USD",
  "recurring": false,
  "message": "Keep up the great work!",
  "anonymous": false,
  "walletAddress": "user_wallet_address"
}
```

### 3. Urban & Coastal Youth Page
**File:** `/src/pages/nairobi-youth.astro`

**Major Features:**

#### Focus Area Cards (6 Areas)
- Tech & AI Literacy
- Arts, Music & Culture
- Social Enterprise & Earning
- Health & Wellness
- Education & Career Mentoring
- Environmental & Land Regeneration

#### Program Display
- Dynamic program cards with leader information
- Location badges (Nairobi/Lamu)
- Category tags
- Contact/support buttons

#### Volunteer Modal
- Interest area selection
- Skills input
- Availability options
- Contact information collection

#### Mentor Signup
- Professional background
- Mentorship areas
- Time commitment options

### 4. Youth Impact APIs
**Files:** `/src/pages/api/nairobi-youth/`

- `global-stats.js` - Returns overall impact statistics
- `programs.js` - Returns list of programs with filtering
- `user-impact.js` - Returns user's personal contribution metrics

### 5. Database Migrations

#### Projects Table
**File:** `add_projects_table.sql`

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

#### Donations Table
**File:** `add_donations_table.sql`

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

## How It Works

### User Flow: Viewing Programs

1. User navigates to `/nairobi-youth`
2. Page displays 6 focus area cards
3. User sees 5 actual programs with leader names
4. User can click on programs to learn more
5. Impact statistics shown from API

### User Flow: Making Donation

1. User clicks "Support" on a program
2. Donation modal opens
3. User selects amount using quick buttons or custom input
4. Impact preview updates showing what their donation enables
5. User optionally adds message and checks anonymous option
6. User submits form
7. POST request to `/api/donations/create`
8. API creates donation record
9. API updates project funding_raised
10. API awards XP to donor (10 XP per $1)
11. Success message shown
12. User impact stats refresh

### Generic System Design

The system supports multiple initiatives:

**For Nairobi Youth:**
```javascript
fetch('/api/projects/list?initiative=nairobi-youth')
```

**For Lamu Coastal:**
```javascript
fetch('/api/projects/list?initiative=lamu-coastal')
```

**For All Urban & Coastal Youth:**
```javascript
fetch('/api/nairobi-youth/programs')
```

## Files Created/Modified

### New Files
1. `/src/pages/nairobi-youth.astro` - Main youth impact page
2. `/src/pages/api/nairobi-youth/global-stats.js` - Impact statistics API
3. `/src/pages/api/nairobi-youth/programs.js` - Programs list API
4. `/src/pages/api/nairobi-youth/user-impact.js` - User impact API
5. `YOUTH_PROJECTS_SUMMARY.md` - This file
6. `YOUTH_PROJECTS_MIGRATION.md` - Migration guide

### Modified Files
1. `/src/layouts/BaseLayout.astro` - Navigation links updated
2. `/src/pages/index.astro` - Homepage feature card updated
3. `README.md` - Documentation updated

## Features Implemented

- Generic projects API with filtering
- 5 actual youth programs with leaders
- 6 focus area categories
- Program cards with location badges
- Volunteer signup modal
- Mentor registration
- Impact statistics dashboard
- XP rewards for contributions
- Database integration with fallback
- Responsive design
- Complete retro styling

## Communities Served

### Nairobi Urban
- Kibera
- Mathare
- Korogocho
- Mukuru
- Dandora
- Kawangware
- Njiru

### Lamu Coastal
- Lamu Town
- Coastal communities

## Integration Points

### With Existing Systems

**User Profile:**
- Contributions appear in user's impact metrics
- XP from donations counted in leveling
- Programs supported shown on profile

**Battle System:**
- Battle winnings could support youth programs
- "Impact Battles" where proceeds go to programs

**Achievement System:**
- "Youth Supporter" badge
- "Community Champion" achievement
- Contribution streak achievements

## Program Leaders

| Program | Leader | Location |
|---------|--------|----------|
| POREFPC | Mureithi Jarife | Lamu |
| Street Poets | Fana Ke | Nairobi |
| Cosmetology School | Francis 'Rank' Mutuku | Nairobi |
| OT Kulcha Reggae | - | Nairobi |
| K-6 School Support | - | Njiru |

## Success Metrics

The system enables:
- **Transparency**: Clear program details and leader information
- **Engagement**: Interactive volunteer and mentor signup
- **Impact**: Real-time impact statistics
- **Scalability**: Works for programs across regions
- **Community**: Connects supporters with local leaders
- **Gamification**: XP rewards incentivize participation

---

**Status:** Complete and ready to test
**Date:** 2026-01-30
**Programs Supported:** 5 actual programs
**Focus Areas:** 6 categories
**API Endpoints Created:** 3 new youth impact APIs
