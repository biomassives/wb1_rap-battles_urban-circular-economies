# XP & Airdrop Game Logic

**WorldBridger One** — Unified XP system where every platform action earns XP that directly determines airdrop rarity and quantity.

---

## Core Loop

```
ACTION → XP → LEVEL UP → HIGHER AIRDROP TIER → RARER DROPS + MORE TOKENS
```

Every meaningful action on the platform earns XP. Accumulated XP determines your **Airdrop Tier**, which controls:
- **Drop Quantity** — How many items you receive per airdrop cycle
- **Token Multiplier** — How many tokens each reward is worth
- **Rarity Boost** — Percentage shift toward rarer NFT drops

---

## XP-Earning Activities

### Battles & Challenges
| Activity | XP | API Endpoint |
|---|---|---|
| Battle submission (per verse) | 25 | `/api/battles/submit-entry` |
| Battle vote | 10 | `/api/battles/vote` |
| Battle win | 150 | `/api/battles/` (completion) |
| Battle loss (participation) | 50 | `/api/battles/` (completion) |
| Challenge submission | 30 | `/api/challenges/submit` |
| Challenge vote | 15 | `/api/challenges/vote` |
| Challenge win | 100 | `/api/challenges/` (completion) |

### Music
| Activity | XP | API Endpoint |
|---|---|---|
| Track upload (base) | 100 | `/api/music/create-track` |
| + lyrics bonus | +25 | included above |
| + cover art bonus | +15 | included above |
| + collaboration bonus | +30 | included above |
| + detailed description bonus | +10 | included above |
| Track play milestone (every 10th) | 5 | `/api/music/track/[id]/play` |
| Track like milestone | varies | `/api/music/track/[id]/like` |

### Reviews & Community
| Activity | XP | API Endpoint |
|---|---|---|
| Artist review (basic, 50+ chars) | 20 | `/api/community/artist-review` |
| Artist review (detailed, 200+ chars) | 35 | `/api/community/artist-review` |

### Mentoring
| Activity | XP | API Endpoint |
|---|---|---|
| Mentoring check-in | 25 | `/api/community/mentoring-checkin` |
| Full session (30+ min) | 50 | `/api/community/mentoring-checkin` |
| Become a mentor (one-time) | 150 | `/api/community/mentoring-checkin` |

### Citizen Science & Eco
| Activity | XP | API Endpoint |
|---|---|---|
| Environmental observation (basic) | 25 | `/api/data/environmental/submit` |
| Environmental observation (detailed) | 50 | `/api/data/environmental/submit` |
| Environmental (biodiversity) | 75 | `/api/data/environmental/submit` |
| Environmental verified bonus | +50 | `/api/data/environmental/submit` |
| Citizen science submission | 40 | `/api/data/citizen-science` |
| Citizen science verified | 75 | `/api/data/citizen-science` (PUT) |

### DAO Governance
| Activity | XP | API Endpoint |
|---|---|---|
| Governance vote | 25 | `/api/governance/proposals/[id]/vote` |
| Create governance proposal | 100 | `/api/governance/proposals/create` |
| Delegation (one-time) | 10 | `/api/governance/voting-power` |

### Health & Wellness
| Activity | XP | API Endpoint |
|---|---|---|
| Health log | 10 | `/api/data/health/log` |
| Exercise log | 15 | `/api/data/health/log` |
| Daily streak bonus | +5 | `/api/data/health/log` |

### NFT & Profile
| Activity | XP | API Endpoint |
|---|---|---|
| NFT reward claim | 50 | `/api/nft/rewards/claim` |
| Profile created | 10 | `/api/gamification/user-progress` |

---

## Level Formula

```
level = Math.min(120, Math.floor(Math.sqrt(xp / 100)) + 1)
```

| XP | Level | Life Stage | Animal Mentor |
|---|---|---|---|
| 0 | 1 | Egg | Chicken |
| 100 | 2 | Egg | Chicken |
| 900 | 4 | Egg | Chicken |
| 10,000 | 11 | Chick | Goat |
| 62,500 | 26 | Juvenile | Pigeon |
| 250,000 | 51 | Adult | Dog |
| 562,500 | 76 | Elder | Rabbit |

**Max Level:** 120

---

## Airdrop Tier System

| Tier | XP Range | Token Multiplier | Rarity Boost | Drops Per Cycle |
|---|---|---|---|---|
| Bronze | 0 – 499 | 1.0x | +0% | 1 |
| Silver | 500 – 1,999 | 1.25x | +5% | 1 |
| Gold | 2,000 – 4,999 | 1.5x | +10% | 2 |
| Platinum | 5,000 – 14,999 | 2.0x | +20% | 3 |
| Diamond | 15,000 – 49,999 | 3.0x | +35% | 4 |
| Mythic | 50,000+ | 5.0x | +50% | 5 |

### How Rarity Boost Works

Base rarity weights: Common 60%, Rare 25%, Epic 10%, Legendary 4%, Mythic 1%

Rarity boost shifts probability from Common toward rarer tiers. A Diamond tier user (35% boost) gets:
- Common: 25% (down from 60%)
- Rare: 39% (up from 25%)
- Epic: 20.5% (up from 10%)
- Legendary: 11% (up from 4%)
- Mythic: 4.5% (up from 1%)

### How Token Multiplier Works

If a scheduled airdrop is worth 100 base tokens:
- Bronze user gets: 100 tokens
- Silver user gets: 125 tokens
- Diamond user gets: 300 tokens
- Mythic user gets: 500 tokens

### How Drop Quantity Works

Per airdrop cycle (weekly/bi-weekly), a Platinum tier user receives 3 separate drops (each with its own rarity roll) while a Bronze user receives 1.

---

## Airdrop Schedule

Drops follow the **Lattice Rhythm** — a time-based schedule where alignment occurs at even UTC hours with prime-numbered minutes.

**Drop Windows:**
- Weekly drops: Every Monday
- Bi-weekly drops: 1st and 15th
- Monthly drops: 1st of month
- Event-based: During tournaments, hackathons, community days

**Eligibility:** Must have connected wallet and XP > 0 (any tier qualifies).

---

## Achievement Milestones

| Achievement | Trigger | Bonus XP |
|---|---|---|
| 1K XP Club | Total XP reaches 1,000 | +100 |
| 10K XP Club | Total XP reaches 10,000 | +500 |
| Dedicated Learner | Reach Level 10 | +250 |
| Master Artist | Reach Level 50 | +1,000 |

---

## Anti-Gaming Measures

- **Rate limiting**: Max 10 artist reviews per day, 1 play per track per hour
- **Duplicate prevention**: UNIQUE constraints on battle votes, challenge votes, governance votes
- **Self-interaction blocked**: Can't review yourself, vote for your own submission
- **Minimum quality**: Reviews require 50+ chars, proposals 100+ chars
- **Anonymous wallet handling**: Test/anon wallets skip DB sync, tracked locally only
- **Verification system**: Citizen science data can be verified by peers for bonus XP

---

## API Reference

### Check Airdrop Tier
```
GET /api/airdrop/tier?walletAddress=<wallet>
```
Returns current tier, rarity weights, progress to next tier, recent activity.

### Check Drop Eligibility
```
GET /api/check-drop?wallet=<wallet>
```
Returns lattice alignment status, personalized rarity roll, drop quantity based on tier.

### Award XP (Internal)
```
POST /api/gamification/award-xp
Body: { walletAddress, xpAmount, activityType, description, metadata }
```

### User Progress
```
GET /api/gamification/user-progress?walletAddress=<wallet>
```

---

## Config Source

All XP values and tier definitions are centralized in `src/lib/xp-config.js`. This is the single source of truth — import from there when building new features.

---

## Database Tables

- `user_profiles` — wallet_address, xp, level
- `xp_activities` — per-action XP log
- `activity_log` — all activity tracking
- `artist_reviews` — review submissions
- `mentoring_sessions` — mentoring check-ins
- `citizen_science_data` — field data submissions

Schema can be initialized via `/api/settings/init-schema` (select "community" group).
