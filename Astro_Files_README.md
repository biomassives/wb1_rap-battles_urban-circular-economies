# Astro Files for Hobby Farm Gamification System
## Complete Frontend Implementation with Placeholder Forms

**Created for**: Mupy / WorldBridger One Ecosystem  
**Purpose**: Gamified platform for music, environmental education & Kakuma support  
**Technology**: Astro.js with vanilla JavaScript class structure

---

## 📦 What's Included

### Directory Structure

```
astro-files/
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro          # Central template for all pages
│   └── pages/
│       ├── progress.astro             # User progress dashboard
│       ├── music.astro                # Music studio with forms
│       ├── learning.astro             # Environmental learning hub
│       └── kakuma.astro               # Kakuma impact page
└── public/
    └── styles/
        ├── global.css                 # Emulated Tailwind + custom styles
        └── gamification.css           # (Create this for page-specific styles)
```

---

## 🎯 Features by File

### **BaseLayout.astro** - Central Template

**Provides**:
- Header with navigation (Collection, Progress, Music, Learning, Kakuma, Leaderboard)
- Wallet connection UI
- XP/Level display in header
- Notifications panel
- Achievement unlock modal
- Level up modal
- XP toast notifications
- Footer with links
- Core JavaScript manager classes

**Manager Classes Included**:
- `WalletManager` - Solana wallet connections
- `ProgressManager` - XP and leveling system
- `UIManager` - Modals, toasts, notifications

**Usage**:
```astro
import BaseLayout from '../layouts/BaseLayout.astro';

<BaseLayout 
  title="Page Title" 
  description="Page description"
  activeSection="progress"
  includeMusicPlayer={true}
>
  <!-- Your page content here -->
</BaseLayout>
```

---

### **progress.astro** - Progress Dashboard

**Features**:
- Hero section with level/XP display
- Animated XP progress bar
- Animal mentor section with daily wisdom
- Achievements showcase (filterable by category)
- Stats dashboard (Musical, Environmental, Community, Kakuma)
- Skill trees visualization (4 paths)
- Recent activity feed

**Form Placeholders**:
- None (display-only page)

**Data Fetching**:
- Loads from `/api/gamification/user-progress`
- Displays comprehensive user stats
- Real-time XP and level updates

**JavaScript Class**:
- `ProgressPageManager` - Handles data loading and rendering

---

### **music.astro** - Music Studio

**Features with Forms**:

#### Tab 1: Create Track
**Form**: Track upload with:
- Track title (text input)
- Genre selection (dropdown)
- Audio file upload (drag & drop)
- Cover art upload (optional)
- Lyrics textarea
- Description textarea
- Collaboration options
  - Checkbox for "is collaboration"
  - Collaborators list (dynamic)
- NFT minting option
- Release options (now/draft/scheduled)

**Placeholder Comments**:
```html
<!-- TODO: Add audio preview player -->
<!-- TODO: Upload to IPFS/S3/Blob -->
<!-- TODO: Show waveform visualization -->
```

#### Tab 2: Rap Battles
**Form**: Create battle with:
- Opponent selection (open/specific)
- Battle category (6 categories)
- Format options (rounds, bars, time limit)
- Stake amount (XP or SOL)
- Battle theme (optional)
- Judging breakdown display

**Placeholder Comments**:
```html
<!-- TODO: Load active battles from API -->
<!-- TODO: Implement battle submission -->
<!-- TODO: Add voting system -->
```

#### Tab 3: Collaborations
- Collaboration board (view open projects)
- Filter by role needed
- Request to join forms

**Placeholder Comments**:
```html
<!-- TODO: Load collaborations from API -->
<!-- TODO: Implement join request system -->
```

#### Tab 4: My Library
- User's published tracks
- Drafts
- Stats (plays, likes)

**JavaScript Classes**:
- `TrackFormManager` - Track upload handling
- `BattleManager` - Battle creation/management
- `CollabManager` - Collaboration features

---

### **learning.astro** - Environmental Learning Hub

**Features with Forms**:

#### Main Form: Submit Observation
**Complete citizen science form**:
- Project selection (dropdown)
- Observation type (8 types)
- Measurement value + unit
- Location (text input)
  - TODO: Add GPS coordinates
- Date/time picker
- Weather conditions (dropdown)
- Notes (textarea)
- Photo uploads (multiple)
- Data quality self-assessment (1-5 scale)

**Placeholder Comments**:
```html
<!-- TODO: Add GPS coordinates option -->
<!-- TODO: Upload photos to IPFS -->
<!-- TODO: Show observation on map -->
```

#### Course Enrollment
- Browse courses grid
- Filter by category/difficulty
- Enroll button
- Track progress

#### Projects Section
- Active citizen science projects
- Participation stats
- Submit observation button

**JavaScript Classes**:
- `LearningHubManager` - Course and project management
- Form handlers for observation submission

---

### **kakuma.astro** - Kakuma Impact Dashboard

**Features with Forms**:

#### Main Form: Make Donation
**Complete donation form**:
- Project selection (dropdown)
- Amount selection
  - Quick amounts ($10, $25, $50, $100, custom)
  - Custom amount input
  - Currency selection (USD/SOL)
- Recurring option (checkbox)
- Impact preview (shows what donation achieves)
- Message to youth (textarea)
- Anonymous option (checkbox)

**Placeholder Comments**:
```html
<!-- TODO: Integrate payment processor -->
<!-- TODO: Generate donation receipt -->
<!-- TODO: Send notification to project -->
```

#### Impact Tracking
- Global impact stats
- Personal impact metrics
- Active projects grid
- Success stories showcase

**Forms for Future**:
- Mentor signup
- Project proposal
- Success story submission

**JavaScript Classes**:
- `KakumaImpactManager` - Impact tracking and project management
- Donation form handlers

---

## 🎨 CSS Architecture

### global.css Features

**CSS Variables**:
- Complete color palette
- Spacing scale
- Border radius values
- Shadow definitions
- Typography
- Z-index layers

**Utility Classes** (Emulated Tailwind):
- Container & responsive breakpoints
- Flexbox utilities
- Grid utilities
- Spacing (padding, margin)
- Text utilities
- Background utilities

**Component Styles**:
- Header & navigation
- Buttons (primary, secondary, text, icon)
- Forms (inputs, selects, textareas, checkboxes)
- Modals
- Cards
- Badges & tags
- Progress bars
- Footer

**Gamification Specific**:
- XP toast notifications
- Level up animations
- Achievement modals
- Progress bars
- Stat cards

**Responsive Design**:
- Mobile breakpoints
- Collapsible navigation
- Flexible grids

---

## 🚀 How to Use These Files

### Step 1: Set Up Astro Project

```bash
# Create new Astro project
npm create astro@latest hobby-farm-gamification

# When prompted:
# - Template: Empty
# - TypeScript: No
# - Dependencies: Yes
# - Git: Yes

cd hobby-farm-gamification
```

### Step 2: Copy Files

```bash
# Copy layout and pages
cp -r astro-files/src/* src/

# Copy styles
cp -r astro-files/public/* public/

# Your structure should now match:
src/
├── layouts/
│   └── BaseLayout.astro
└── pages/
    ├── progress.astro
    ├── music.astro
    ├── learning.astro
    └── kakuma.astro

public/
└── styles/
    └── global.css
```

### Step 3: Configure astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static', // or 'server' if using Vercel
  integrations: [],
  vite: {
    css: {
      preprocessorOptions: {}
    }
  }
});
```

### Step 4: Update package.json

```json
{
  "name": "hobby-farm-gamification",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^4.0.0"
  }
}
```

### Step 5: Start Development

```bash
npm run dev
```

Visit: http://localhost:4321

---

## 📝 Form Implementation Checklist

Each form has TODO comments showing what needs to be implemented:

### Track Upload Form (music.astro)
- [ ] Audio file upload to IPFS/S3/Vercel Blob
- [ ] Cover art upload
- [ ] Waveform visualization
- [ ] Audio preview player
- [ ] Lyrics import from file
- [ ] Collaborator management
- [ ] NFT minting integration
- [ ] Schedule release date/time picker
- [ ] Call `/api/music/create-track` endpoint

### Battle Creation Form (music.astro)
- [ ] Opponent search/selection
- [ ] Battle format validation
- [ ] Stake payment handling
- [ ] Call `/api/music/create-battle` endpoint
- [ ] Battle submission interface
- [ ] Voting system integration

### Observation Form (learning.astro)
- [ ] GPS coordinate capture
- [ ] Photo upload to storage
- [ ] Observation validation
- [ ] Call `/api/environmental/submit-observation`
- [ ] Show observation on map
- [ ] Data quality verification

### Donation Form (kakuma.astro)
- [ ] Payment processor integration (Stripe/Solana Pay)
- [ ] Impact calculation logic
- [ ] Receipt generation
- [ ] Call `/api/kakuma/donate` endpoint
- [ ] Recurring donation scheduling
- [ ] Thank you email/notification

---

## 🔗 API Integration Points

Each form connects to API endpoints that need to be implemented:

### Music Studio
```javascript
// Track upload
POST /api/music/create-track
Body: { walletAddress, title, genre, audioFileUrl, ... }

// Battle creation
POST /api/music/create-battle
Body: { challenger, opponent, category, rounds, ... }

// Get battles
GET /api/music/get-battles?filter=open&category=conscious
```

### Learning Hub
```javascript
// Get courses
GET /api/environmental/get-courses?category=all&difficulty=all

// Enroll in course
POST /api/environmental/enroll-course
Body: { walletAddress, courseId }

// Submit observation
POST /api/environmental/submit-observation
Body: { walletAddress, projectId, type, measurement, ... }

// Get projects
GET /api/environmental/get-projects?status=active
```

### Kakuma Impact
```javascript
// Get projects
GET /api/kakuma/get-projects?category=all&status=active

// Make donation
POST /api/kakuma/donate
Body: { walletAddress, projectId, amount, currency, ... }

// Get user impact
GET /api/kakuma/user-impact?walletAddress=xxx

// Get global stats
GET /api/kakuma/global-stats
```

---

## 🎯 Next Steps for Implementation

### Phase 1: Connect to Database
1. Hook up to your Nile DB using existing API endpoints
2. Test data flow from forms to database
3. Verify XP awarding works

### Phase 2: File Storage
1. Set up IPFS, S3, or Vercel Blob
2. Implement upload handlers
3. Test audio/image uploads

### Phase 3: Payment Processing
1. Choose payment processor (Stripe/Solana Pay)
2. Implement donation flow
3. Test transaction handling

### Phase 4: Advanced Features
1. Implement battle judging system
2. Add collaboration matching
3. Build observation map view
4. Create admin dashboard

---

## 💡 Customization Guide

### Adding New Pages

```astro
---
// src/pages/your-page.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout 
  title="Your Page" 
  activeSection="your-page"
>
  <section class="your-section">
    <div class="container mx-auto">
      <h1 class="section-title">Your Content</h1>
      <!-- Your content -->
    </div>
  </section>
</BaseLayout>
```

### Adding New Forms

1. Copy structure from existing forms
2. Add form validation
3. Create submit handler
4. Connect to API endpoint
5. Add XP reward on success

### Styling New Components

Use CSS variables and utility classes:

```css
.your-component {
  background: var(--color-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
```

---

## 🐛 Common Issues & Solutions

### Forms not submitting
- Check browser console for errors
- Verify API endpoint exists
- Check wallet connection status
- Validate form data before submit

### Styles not applying
- Verify global.css is imported in BaseLayout
- Check for CSS specificity conflicts
- Use browser DevTools to inspect elements

### Data not loading
- Check API endpoint responses
- Verify wallet address is passed correctly
- Look at network tab in DevTools
- Check for CORS issues

---

## 📚 Additional Resources

### Astro Documentation
- https://docs.astro.build/en/getting-started/
- https://docs.astro.build/en/core-concepts/layouts/

### Related Project Files
- `GAMIFICATION_DESIGN.md` - Full system design
- `database-schema-gamification.sql` - Complete database schema
- `IMPLEMENTATION_GUIDE.md` - Step-by-step implementation
- `api/gamification/` - API endpoints for XP/progress

---

## ✅ Testing Checklist

Before deploying:

- [ ] All pages load without errors
- [ ] Navigation works between all pages
- [ ] Forms display correctly
- [ ] Buttons have hover states
- [ ] Mobile responsive (test at 375px, 768px, 1024px)
- [ ] Modals open and close
- [ ] XP notifications appear
- [ ] Level up modal triggers
- [ ] Achievement modal displays
- [ ] Footer links work
- [ ] Wallet connection UI functions
- [ ] API calls work (mock or real)
- [ ] Console has no errors

---

## 🎨 Design Tokens Reference

Quick reference for consistent styling:

**Colors**:
- Primary: `#667eea`
- Success: `#4ade80`
- Warning: `#fbbf24`
- Kakuma: `#f59e0b`

**Spacing**:
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)

**Breakpoints**:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

---

## 🚀 Deployment

When ready to deploy:

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

---

**Created by Mupy for WorldBridger One**  
**Supporting Kakuma Refugee Camp & POREFPC Initiative**  
**License: GPL-3.0**

🌾 Let's build this movement together! ✨
