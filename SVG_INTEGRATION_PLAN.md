# SVG Integration Plan
**Created**: 2026-01-02
**Status**: In Progress

---

## 📁 Folder Structure Created

```
/public/images/
├── icons/          # Small UI icons (16-64px)
├── heroes/         # Hero section backgrounds and illustrations
├── decorative/     # Decorative elements for headers/footers
├── nft/            # NFT-related graphics and card templates
└── email/          # Email template graphics
```

---

## 🎯 SVG Integration Areas

### 1. **NFT Inventory Pages**
**Files to Update**:
- `index.astro` - NFT grid page
- `[id].astro` - NFT detail page
- `profile.astro` - User NFT collection

**SVG Uses**:
- NFT card wireframe as placeholder
- Category icons (music, art, environmental, nairobi-youth)
- Rarity badges (common, rare, epic, legendary)
- Empty state illustrations

**Implementation**:
```html
<!-- NFT Card Template -->
<div class="nft-card">
  <img src="/images/nft/card-wireframe.svg" alt="NFT Template" />
  <!-- Or inline SVG for animations -->
</div>

<!-- Empty State -->
<div class="empty-nfts">
  <img src="/images/decorative/empty-collection.svg" alt="No NFTs yet" />
  <p>Start collecting NFTs!</p>
</div>
```

---

### 2. **Headers**
**Files to Update**:
- `src/components/Header.astro`
- All pages using BaseLayout

**SVG Uses**:
- Logo/brand mark
- Navigation icons
- Notification badges
- User avatar placeholder

**Implementation**:
```html
<!-- Logo -->
<a href="/" class="logo">
  <img src="/images/icons/logo.svg" alt="Worldbridger One" class="logo-svg" />
  <span>Worldbridger One</span>
</a>

<!-- Nav Icons -->
<nav>
  <a href="/music"><img src="/images/icons/music.svg" />Music</a>
  <a href="/learning"><img src="/images/icons/leaf.svg" />Learning</a>
  <a href="/nairobi-youth"><img src="/images/icons/heart.svg" />Kakuma</a>
</nav>
```

---

### 3. **Hero Sections**
**Files to Update**:
- `index.astro` - Landing page hero
- `music.astro` - Music studio hero
- `nairobi-youth.astro` - Kakuma hero
- `learning.astro` - Education hero

**SVG Uses**:
- Background patterns
- Decorative illustrations
- Feature highlights
- Call-to-action graphics

**Implementation**:
```html
<!-- Hero with SVG Background -->
<section class="hero">
  <div class="hero-bg">
    <img src="/images/heroes/waves-pattern.svg" class="pattern" />
  </div>
  <div class="hero-content">
    <img src="/images/heroes/music-illustration.svg" class="hero-graphic" />
    <h1>Create Music, Earn Rewards</h1>
  </div>
</section>
```

---

### 4. **Footers**
**Files to Update**:
- `src/layouts/BaseLayout.astro` - Footer component

**SVG Uses**:
- Social media icons
- Project logos
- Decorative elements
- Partnership badges

**Implementation**:
```html
<footer>
  <div class="footer-decorative">
    <img src="/images/decorative/footer-wave.svg" class="wave-top" />
  </div>
  <div class="footer-content">
    <div class="social-links">
      <a href="#"><img src="/images/icons/twitter.svg" /></a>
      <a href="#"><img src="/images/icons/discord.svg" /></a>
      <a href="#"><img src="/images/icons/github.svg" /></a>
    </div>
  </div>
</footer>
```

---

### 5. **Welcome Page** (New)
**File**: `src/pages/welcome.astro`

**Purpose**: Onboarding for new users

**SVG Uses**:
- Step-by-step illustrations
- Feature showcase graphics
- Progress indicators
- Character illustrations (animal mentors)

**Layout**:
```html
<section class="welcome-steps">
  <div class="step">
    <img src="/images/heroes/step1-wallet.svg" />
    <h3>Connect Wallet</h3>
  </div>
  <div class="step">
    <img src="/images/heroes/step2-explore.svg" />
    <h3>Explore Projects</h3>
  </div>
  <div class="step">
    <img src="/images/heroes/step3-earn.svg" />
    <h3>Earn Rewards</h3>
  </div>
</section>
```

---

### 6. **Email Letter Template** (New)
**File**: `src/pages/email-template.astro`

**Purpose**: Branded email template for notifications

**SVG Uses**:
- Email header graphic
- Section dividers
- Icon badges for achievements
- Footer branding

**Layout**:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Inline CSS for email compatibility */
    .email-header { background: #f5f5f5; text-align: center; }
    .header-graphic { max-width: 600px; }
  </style>
</head>
<body>
  <table width="600" cellpadding="0" cellspacing="0">
    <!-- Header -->
    <tr>
      <td class="email-header">
        <img src="https://purplepoint.io/images/email/header-banner.svg" 
             alt="Purple Point" class="header-graphic" />
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td>
        <!-- Dynamic content -->
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td>
        <img src="https://purplepoint.io/images/email/footer-divider.svg" />
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🎨 SVG Design Guidelines

### Color Palette
- **Primary**: #667eea (Purple)
- **Secondary**: #764ba2 (Deep Purple)
- **Accent**: #f093fb (Pink)
- **Success**: #10b981 (Green)
- **Kakuma**: #f59e0b (Orange)
- **Neutral**: #1f2937 (Dark Gray)

### Styling Best Practices
```css
/* Responsive SVG */
.svg-container {
  width: 100%;
  height: auto;
  max-width: 600px;
}

.svg-container svg {
  width: 100%;
  height: auto;
}

/* Inline SVG for animations */
.animated-svg path {
  animation: draw 2s ease-in-out;
}

@keyframes draw {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

/* Dark mode compatibility */
@media (prefers-color-scheme: dark) {
  .svg-light { filter: invert(1); }
}
```

---

## 📋 SVG Asset Checklist

### Icons (16-64px)
- [ ] Logo / Brand Mark
- [ ] Music note
- [ ] Environmental leaf
- [ ] Kakuma heart
- [ ] Battle swords
- [ ] Achievement trophy
- [ ] XP star
- [ ] Social media (Twitter, Discord, GitHub)
- [ ] Wallet icon
- [ ] Settings gear
- [ ] Notification bell

### Hero Graphics (400-800px)
- [ ] Music studio illustration
- [ ] Environmental garden
- [ ] Kakuma camp scene
- [ ] NFT collection showcase
- [ ] Rap battle arena
- [ ] Welcome onboarding steps

### Decorative Elements
- [ ] Wave patterns (header/footer)
- [ ] Geometric backgrounds
- [ ] Section dividers
- [ ] Corner ornaments
- [ ] Border patterns

### NFT Related
- [ ] Card wireframe (existing)
- [ ] Rarity badges (Common, Rare, Epic, Legendary)
- [ ] Category icons (55 animal types)
- [ ] Empty collection placeholder
- [ ] Loading spinner

### Email Templates
- [ ] Header banner
- [ ] Footer divider
- [ ] Achievement badges
- [ ] Notification icons

---

## 🚀 Implementation Priority

### Phase 1: Core Icons (Day 1)
1. Create/add logo SVG
2. Add navigation icons
3. Add social media icons
4. Update header component

### Phase 2: Hero Sections (Day 2)
1. Landing page hero graphic
2. Music page hero
3. Kakuma page hero
4. Learning page hero

### Phase 3: NFT Integration (Day 3)
1. Use existing card wireframe
2. Create rarity badges
3. Add empty state graphics
4. Update NFT grid display

### Phase 4: Welcome & Email (Day 4)
1. Create welcome page
2. Design email template
3. Add onboarding illustrations

### Phase 5: Polish (Day 5)
1. Add decorative elements
2. Implement animations
3. Test responsive behavior
4. Cross-browser testing

---

## 💡 Technical Implementation

### Inline SVG vs External
**Use Inline When**:
- Need to animate with CSS/JS
- Need to change colors dynamically
- SVG is small (<2KB)
- Critical for above-fold content

**Use External When**:
- SVG is large or complex
- Reused across multiple pages
- Doesn't need dynamic styling
- Can be cached

### Example: Inline SVG Component
```astro
---
// src/components/icons/MusicIcon.astro
const { size = 24, color = "currentColor" } = Astro.props;
---
<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
  <path d="M9 18V5l12-2v13" stroke={color} stroke-width="2"/>
  <circle cx="6" cy="18" r="3" fill={color}/>
  <circle cx="18" cy="16" r="3" fill={color}/>
</svg>
```

### Example: External SVG
```astro
<img src="/images/heroes/music-hero.svg" alt="Music Studio" class="hero-graphic" />
```

---

## 📝 Next Steps

1. **Collect/Create SVG Assets**
   - Review existing brand assets
   - Create missing icons
   - Design hero illustrations

2. **Organize Files**
   - Move existing SVGs to proper folders
   - Add new SVGs with consistent naming
   - Create SVG sprite for icons

3. **Update Components**
   - Header with logo and nav icons
   - Footer with social icons
   - Hero sections with graphics

4. **Create New Pages**
   - Welcome/onboarding page
   - Email template

5. **Test & Optimize**
   - Optimize SVG file sizes
   - Test responsive behavior
   - Ensure accessibility (alt text, ARIA labels)

