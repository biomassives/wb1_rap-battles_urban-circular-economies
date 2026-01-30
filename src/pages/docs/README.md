---
layout: "../../layouts/DocLayout.astro"
title: "README"
---
<div data-pagefind-filter="type:docs"></div>

# Purple Point - Rap Battle NFT Platform

**WorldBridger One Ecosystem**
A retro-arcade themed rap battle platform where artists create beats, battle with rhymes, earn NFTs, and support communities like Urban & Coastal Youth refugee camp.

## Vision

Purple Point combines hip-hop culture, Web3 technology, and environmental engineering awareness to create an engaging platform where freestyle rap battles intersect with critical urban infrastructure education. Battle, create, learn—and support refugee communities through music.

---

## Role-Based Workflows

### 🎤 **New User Journey**
**Goal:** Onboard quickly and understand what Purple Point offers

1. **Land on Homepage** → [View Homepage](/)
   - See hero section: "SHOW SKILLS. WIN BATTLES. EARN NFTS."
   - Understand 3-step flow: Create Beats → Battle → Earn NFTs
   - Browse NFT card showcase (Legendary & Common rapper cards)

2. **Explore Music Tools** → [Visit Music Studio](/music)
   - Try the Moog Synth for analog sound creation
   - Test the Sampler for beat making
   - Experiment with the Looper for layered compositions

3. **Learn the Basics** → [Take Training Quiz](/training-quiz)
   - Answer questions about hip-hop, sustainability, and culture
   - Earn XP for correct answers
   - Track progress toward certificate NFTs

4. **Create Profile** → [Set Up Profile](/profile)
   - Connect wallet or use testnet wallet
   - Customize username, bio, avatar
   - View stats dashboard with XP, level, badges

**Status:** ✅ Working

---

### 🎵 **Music Creator / Rapper Workflow**
**Goal:** Create beats and rap performances for battles

#### Phase 1: Beat Creation

1. **Choose Your Instrument** → [Music Studio](/music)
   - **Moog Synthesizer** → [#moog](/music#moog)
     - Analog-style oscillators with frequency control
     - Adjustable filter, attack, decay, sustain, release
     - Real-time waveform visualization
   - **Enhanced Sampler** → [Sampler Page](/sampler)
     - 16-pad drum machine with sound library
     - Volume, pitch, and effect adjustments
     - Save/load patterns
   - **Moog Looper** → [#looper](/music#looper)
     - Layer multiple loops
     - Record, overdub, playback controls

2. **Create & Save Beat**
   - Record/layer sounds to build your track
   - Export audio file or save to library
   - ⚠️ Status: Save/Export feature **Planned**

3. **Optional: Use Beatmaker** → [Beatmaker Demo](/music#beatmaker)
   - Quick beat generation with presets
   - Visual beat timeline
   - Status: ⚠️ **Testing**

#### Phase 2: Battle Recording

4. **Record Your Rap** → [Battle Recorder Demo](/battle-recorder-demo)
   - **Mode 1: Record Live**
     - Browser-based audio recording (Web Audio API)
     - Real-time waveform visualization
     - Level meter with color-coded feedback (green = optimal)
     - Max duration: 2 minutes
   - **Mode 2: Upload File**
     - Drag-and-drop or file browser
     - Supported formats: MP3, WAV, M4A, OGG
     - Max file size: 10MB
   - **Mode 3: Use Sampler**
     - Create backing beats with sampler integration
     - Record vocals over sampler output

5. **Submit to Battle** → [Battle Page](/battle)
   - Review your recording with playback preview
   - Add metadata (battle ID, rapper name)
   - Submit entry to active battle
   - Status: ⚠️ **Testing**

**Status:** ✅ Recording Tools Working | ⚠️ Battle Submission Testing

---

### 🏆 **Judge / Voter Workflow**
**Goal:** Vote on rap battles and influence results

1. **Browse Active Battles** → [Battle List](/battle)
   - View list of ongoing battles
   - See participant count and deadline

2. **Listen to Performances**
   - Play each rapper's submission
   - Compare lyrics, flow, beat choice

3. **Cast Your Vote**
   - Vote for your favorite performance
   - Earn voting badges/XP

4. **View Results**
   - See final rankings after voting closes
   - Track popular battles and trending rappers

**Status:** 🔜 **Planned**

---

### 🎨 **NFT Collector Workflow**
**Goal:** Earn and collect rapper persona NFT cards

1. **View NFT Collection** → [Homepage Collection](/##collection)
   - Browse 55 unique animal NFTs:
     - 40 Chickens, 5 Cats, 4 Goats, 4 Pigeons, 1 Dog, 1 Rabbit
   - See rarity tiers: Common, Uncommon, Rare, Legendary

2. **Earn Battle Cards** → [Battle Cards Showcase](/#battle-cards)
   - Participate in rap battles to earn commemorative PFP cards
   - Each card shows:
     - Rapper persona with animal spirit (10 types available)
     - Geodesic face styling (angular, male/female variations)
     - Bling badges showing achievements (MIC, BEAT, VOTE, etc.)
     - Battle stats and performance metrics
   - View card examples:
     - [Legendary Card](/images/nft/rapper-card-legendary.svg)
     - [Common Card](/images/nft/rapper-card-common.svg)

3. **Customize Rapper Persona** → [Rapper Template Builder](/rapper-template-builder)
   - Choose gender (Male/Female)
   - Select animal spirit:
     - **Farm:** Chicken, Cat, Goat, Dog, Bunny
     - **Sky:** Pigeon, Cooper's Hawk, Eagle
     - **Wild:** Lion, Coywolf
   - Pick skin tone (6 options)
   - Select hairstyle: Dreads, Fade, Afro, Braids, Bun, Waves
   - Add accessories: Sunglasses, Chain, Earrings, Hat
   - Preview live SVG rendering

4. **Mint Your Card** (After Battle Win)
   - Generate unique rapper card with stats
   - Mint to Solana blockchain via Metaplex
   - Stored on Arweave for permanence

**Status:** ✅ Template Builder Working | 🔜 Minting System Planned

---

### 🏕️ **Impact Supporter Workflow**
**Goal:** Learn about and support Urban & Coastal Youth refugee camp

1. **Visit Urban & Coastal Youth Page** → [Urban & Coastal Youth Impact](/kakuma)
   - Read stories from the camp
   - Understand how platform supports community

2. **Battle for a Cause**
   - Participate in special "Impact Battles"
   - Portion of NFT sales goes to Urban & Coastal Youth support

3. **Track Contributions**
   - View total funds raised
   - See impact metrics and stories

**Status:** ✅ Urban & Coastal Youth Page Working | 🔜 Impact Battles Planned

---

### ⚙️ **Developer / Admin Workflow**
**Goal:** Monitor system, review code, test features

1. **Check System Status** → [Workflows Dashboard](/workflows)
   - Visual map of all user journeys
   - Color-coded status indicators:
     - 🟢 Working | 🟡 Testing | ⚪ Planned
   - Interactive checklist for testing pages
   - Accordion sections for detailed battle phases

2. **Review Technical Docs**
   - [API Reference](/API_Reference.md) - Endpoint documentation
   - [Astro Files README](/Astro_Files_README.md) - File structure
   - [Forms Reference](/Forms_Reference.md) - Form components
   - [Deployment Guide](/DEPLOYMENT.md) - Production deployment

3. **Check Feature Plans**
   - [Battle PFP System Plan](BATTLE_PFP_SYSTEM_PLAN.md)
   - [Training Quiz System](TRAINING_QUIZ_SYSTEM_PLAN.md)
   - [Sampler Integration](SAMPLER_INTEGRATION_GUIDE.md)
   - [Music Page Fixes](MUSIC_PAGE_FIXES.md)
   - [Profile Stats Enhancement](PROFILE_STATS_ENHANCEMENT_PLAN.md)

4. **Test Pages**
   - Run through quick test checklist
   - Verify no console errors
   - Check mobile responsiveness

**Status:** ✅ Working

---

## Tech Stack

### Frontend
- **Framework:** Astro v5+ (Static Site Generation)
- **Styling:** Custom CSS with CSS variables
- **Theme:** Dark retro arcade (Space Invaders × Ska two-tone)
  - Black & white base with neon green accents
  - Scanline effects, pixel borders, glitch animations
  - Sharp shadows, geometric shapes

### Audio/Music
- **Web Audio API:** Real-time audio recording and playback
- **MediaRecorder:** Browser-based vocal recording
- **AnalyserNode:** Waveform visualization
- **Tone.js:** Moog synthesizer implementation (planned)

### Web3/Blockchain
- **Solana Web3.js:** Wallet connection and transactions
- **Phantom Wallet:** Primary wallet integration
- **Metaplex:** NFT minting (planned)
- **Arweave:** Permanent storage (planned)
- **Polkadot:** Cross-chain support (planned)

### Backend/Database
- **Vercel Serverless Functions:** API endpoints
- **Vercel Postgres:** User profiles, progress, stats
- **Astro API Routes:** XP system, battle management

### File Storage (Planned)
- **IPFS/Arweave:** Audio files, images, metadata

---

## Page Directory

### Core Pages
- `/` - Homepage (battle funnel hero, NFT showcase)
- `/music` - Music Studio (Moog, Sampler, Looper)
- `/battle` - Battle List (browse/create battles)
- `/battle/[id]` - Individual Battle Page
- `/profile` - User Profile (stats, NFTs, settings)
- `/kakuma` - Urban & Coastal Youth Impact Page

### Tools & Features
- `/sampler` - Enhanced Sampler Interface
- `/battle-recorder-demo` - Audio Recording Demo
- `/rapper-template-builder` - NFT Card Generator
- `/training-quiz` - Educational Quiz System

### Documentation & Admin
- `/workflows` - User Workflows Dashboard (this doc as interactive page)
- `/email-template` - Email templates

---

## API Endpoints

### Gamification
- `POST /api/gamification/award-xp` - Award XP to user
  ```json
  {
    "userId": "wallet_address",
    "xp": 50,
    "reason": "Completed quiz"
  }
  ```

### User Profile
- `GET /api/profile/get?walletAddress=...` - Fetch user profile
- `POST /api/profile/upsert` - Create/update profile
  ```json
  {
    "walletAddress": "...",
    "username": "...",
    "email": "...",
    "bio": "..."
  }
  ```

### Stats (Planned)
- `GET /api/stats/user?walletAddress=...` - User statistics
- `GET /api/stats/battle?battleId=...` - Battle statistics

### Quiz (Working)
- `GET /api/quiz/questions` - Fetch quiz questions
- `POST /api/quiz/submit` - Submit quiz answers

---

## Feature Status Matrix

### ✅ Fully Working
- [x] Homepage with rap battle funnel
- [x] Dark retro theme (arcade aesthetic)
- [x] Moog Synthesizer interface
- [x] Basic Sampler (16 pads)
- [x] Audio recorder (3 modes: record, upload, sampler)
- [x] Rapper template builder (geodesic faces, animal spirits)
- [x] Profile page with stats
- [x] Training quiz system
- [x] XP award system
- [x] Urban & Coastal Youth impact page
- [x] NFT collection display (55 animals)
- [x] Workflows dashboard

### ⚠️ Testing/In Progress
- [ ] Battle audio submission
- [ ] Moog Looper functionality
- [ ] Enhanced sampler (save/load patterns)
- [ ] Web3 wallet integration (Phantom)
- [ ] Database operations (user profiles)
- [ ] Battle list browsing

### 🔜 Planned
- [ ] Community voting on battles
- [ ] Battle results & rankings
- [ ] NFT card minting (Metaplex)
- [ ] POAP certificate NFTs
- [ ] File storage (IPFS/Arweave)
- [ ] Impact battles for Urban & Coastal Youth
- [ ] Animal mentor progression system
- [ ] Analytics & tracking
- [ ] Marketplace for NFT trading

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Vercel account (for deployment)

### Local Development

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/purple-point.git
cd purple-point/pp

# Install dependencies
npm install

# Set environment variables
# Create .env file with:
# POSTGRES_URL="your_postgres_connection_string"

# Run dev server
npm run dev

# Open browser
# http://localhost:4321
```

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
vercel --prod
```

See [DEPLOYMENT.md](/DEPLOYMENT.md) for detailed deployment instructions.

---

## Database Schema

### user_profiles
- `wallet_address` (PRIMARY KEY)
- `username`
- `email`
- `bio`
- `avatar_url`
- `level` (from XP)
- `total_xp`
- `owned_nfts` (JSON array)
- `badges` (JSON array)
- `created_at`
- `updated_at`

### battles (Planned)
- `battle_id` (PRIMARY KEY)
- `creator_wallet`
- `beat_url`
- `status` (open/voting/closed)
- `deadline`
- `participants` (JSON array)
- `votes` (JSON array)
- `winner_wallet`

### quiz_progress
- `wallet_address`
- `category`
- `score`
- `completed_questions` (JSON array)
- `certificates_earned` (JSON array)

See database schema files for full structure.

---

## Design System

### Colors
```css
--color-black: #000000
--color-white: #ffffff
--color-neon-green: #00ff00
--color-neon-cyan: #00ffff
--color-neon-yellow: #ffff00
--color-neon-pink: #ff00ff
```

### Typography
```css
--font-mono: 'Courier New', Courier, monospace
--font-arcade: 'Press Start 2P', monospace
--font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI'
```

### Components
- `.btn-retro` - White button with sharp shadow
- `.btn-retro-neon` - Neon green glowing button
- `.card-retro` - White border card with sharp shadow
- `.neon-text` - Green glowing text with pulse animation
- `.scanlines` - CRT scanline overlay effect
- `.ska-pattern` - Checkerboard background
- `.arcade-screen` - Retro screen bezel effect

See [/src/styles/dark-theme.css](/src/styles/dark-theme.css) for full design system.

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Commit Message Style
Follow repository convention:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation update
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Add/update tests

---

## Security

- Environment variables for sensitive data
- Parameterized SQL queries (prevent injection)
- No private keys stored in database
- Testnet only (Solana devnet for now)
- CORS configured for Vercel domains
- Content Security Policy headers

---

## Support & Resources

### Documentation
- [API Reference](API_REFERENCE.md)
- [Astro Files Guide](Astro_Files_README.md)
- [Forms Reference](Forms_Reference.md)
- [Deployment Guide](DEPLOYMENT.md)

### Interactive Tools
- [Workflows Dashboard](/workflows) - Visual user journeys
- [Rapper Template Builder](/rapper-template-builder) - NFT card preview
- [Training Quiz](/training-quiz) - Learn and earn XP

### External Links
- [Astro Documentation](https://docs.astro.build)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Metaplex Docs](https://docs.metaplex.com/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### Issues & Feedback
- Create issue on GitHub
- Check `/workflows` page for system status
- Review plan documents for roadmap

---

## License

GPL-3.0 License - see LICENSE file

---

## Acknowledgments

- Built for **WorldBridger One** ecosystem
- Supporting **Urban & Coastal Youth refugee camp** through music
- Part of **SparkHope.space** mycological innovation platform
- Inspired by classic arcade games (Space Invaders, Pac-Man)
- Honoring hip-hop culture and freestyle rap battles
- Raising awareness for environmental engineering and water safety

---

**Made with ⚡ by [Mupy](https://hub.approvideo.org)**
**Powered by Solana, Astro, Vercel & Web Audio API**

🎤 Battle • 🎵 Create • 🏆 Earn • 🌍 Impact
