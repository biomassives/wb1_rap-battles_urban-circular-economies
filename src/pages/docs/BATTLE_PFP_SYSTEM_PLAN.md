---
layout: "../../layouts/DocLayout.astro"
title: "BATTLE_PFP_SYSTEM_PLAN"
---
<div data-pagefind-filter="type:docs"></div>

# Rap Battle Commemorative PFP Cards - Implementation Plan

## Executive Summary
Transform the existing DVG card system into dynamic, collectible Profile Picture (PFP) NFTs that commemorate rap battle achievements. Each card features customizable rapper personas with earned "bling" (badges), battle stats, and airdrop rewards. Think Pokemon cards meets hip-hop culture meets Web3 collectibles.

**Goal**: Create a visual identity and reward system that makes rap battles memorable and shareable
**Priority**: High - Core engagement and monetization feature
**Target Audience**: Battle participants, collectors, hip-hop fans

---

## Vision & Core Concept

### The Problem
- Current DVG cards are generic (just showing the "3" symbol)
- No visual record of battle achievements
- No social sharing incentive
- Missing collectibility and trading potential

### The Solution
**Battle PFP Cards**: Unique, customizable rapper persona cards that:
1. **Commemorate battles** with specific designs per battle
2. **Display achievements** via bling badges (🏆 wins, 🔥 streaks, 💎 rare moves)
3. **Show battle stats** (wins, losses, kill-death ratio, signature moves)
4. **Unlock airdrops** (cards = tickets to future rewards)
5. **Enable trading** (marketplace for rare cards)
6. **Profile pictures** (use as avatar across platform)

### Design Philosophy
- **Playing card aesthetic** - Traditional card game feel
- **Hip-hop bling culture** - Gold chains, diamonds, badges of honor
- **Solana NFT standard** - Metaplex compatible
- **Dynamic SVG** - Server-rendered, customizable on-chain
- **Rarity tiers** - Common, Rare, Epic, Legendary, Mythic

---

## Card Anatomy

### Front Face Design

```
╔═══════════════════════════════════════╗
║  👑 [Rank Badge]    💎 [Rarity Tier]  ║
║                                       ║
║         ┌─────────────────┐          ║
║         │                 │          ║
║         │   [AVATAR]      │          ║
║         │   Rapper PFP    │          ║
║         │   with Bling    │          ║
║         └─────────────────┘          ║
║                                       ║
║   🎤 [USERNAME] #[CARD_NUMBER]       ║
║   Battle Record: [W-L-D]              ║
║                                       ║
║   ╔════════════════════════╗         ║
║   ║ [Bling Badges Row]     ║         ║
║   ║ 🏆🔥💎⚡🎯            ║         ║
║   ╚════════════════════════╝         ║
║                                       ║
║   Battle: [Battle Title]              ║
║   Date: [MM/DD/YYYY]                  ║
║   Result: [WIN/LOSS]                  ║
║                                       ║
║  [DVG Symbol]           [Edition #]   ║
╚═══════════════════════════════════════╝
```

### Back Face Design

```
╔═══════════════════════════════════════╗
║   WORLDBRIDGER ONE                    ║
║   Rap Battle Commemorative Series     ║
║                                       ║
║   ┌───────────────────────────────┐  ║
║   │   [Battle QR Code]            │  ║
║   │   Scan to view replay         │  ║
║   └───────────────────────────────┘  ║
║                                       ║
║   Stats:                              ║
║   • Total Battles: [#]                ║
║   • Win Rate: [%]                     ║
║   • Best Streak: [#]                  ║
║   • Signature Move: [Name]            ║
║                                       ║
║   Unlocked Airdrops:                  ║
║   ✓ [Airdrop 1 Name]                 ║
║   ✓ [Airdrop 2 Name]                 ║
║   ⏳ [Locked Airdrop]                ║
║                                       ║
║   Minted: [Timestamp]                 ║
║   Solana: [Truncated Address]         ║
║   [DVG Logo]           [Verified ✓]   ║
╚═══════════════════════════════════════╝
```

---

## Bling Badge System

### Badge Categories

#### 🏆 **Victory Badges**
- **First Blood** 🥇 - First battle win
- **Undefeated** 🛡️ - 5-win streak
- **Legendary** 👑 - 10-win streak
- **Perfect Victory** 💯 - Won all rounds in a battle
- **Comeback King** 🔄 - Won after losing first round

#### 🔥 **Performance Badges**
- **Fire Bars** 🔥 - 90+ community vote score
- **Crowd Favorite** 👥 - Most votes in a battle
- **Technical Master** 🎯 - Complex rhyme schemes detected
- **Wordsmith** ✍️ - Creative wordplay award
- **Flow God** 🌊 - Perfect rhythm/delivery

#### 💎 **Rarity Badges**
- **Diamond Hands** 💎 - Held NFT for 6+ months
- **OG Battle** 🦖 - Participated in first 100 battles
- **Elite Collector** 🃏 - Own 10+ battle cards
- **Whale** 🐋 - Own 50+ battle cards
- **Completionist** 📚 - Full set from a season

#### ⚡ **Special Event Badges**
- **Tournament Winner** 🏆 - Won bracket tournament
- **Kakuma Champion** 🌍 - Won benefit battle
- **Holiday Special** 🎄 - Participated in holiday event
- **Collaboration** 🤝 - Tag-team battle winner
- **Wildcard** 🃏 - Random rare drop

#### 🎯 **Skill Badges**
- **Multisyllabic** 📖 - Complex rhymes
- **Metaphor King** 🎭 - Creative comparisons
- **Storyteller** 📜 - Narrative bars
- **Punchline Pro** 💥 - Devastating one-liners
- **Freestyler** 🎲 - Improvised performance

---

## Rarity Tier System

### Tier Definitions

| Tier | Drop Rate | Visual Style | Perks |
|------|-----------|--------------|-------|
| **Common** | 60% | Bronze border, standard avatar | 1 bling badge |
| **Rare** | 25% | Silver border, glowing avatar | 2-3 bling badges |
| **Epic** | 10% | Gold border, animated glow | 3-5 bling badges, sparkle effect |
| **Legendary** | 4% | Purple/holographic, 3D effect | 5-7 bling badges, special frame |
| **Mythic** | 1% | Rainbow/animated, particle effects | All bling, exclusive airdrop access |

### Rarity Modifiers
- **Battle outcome**: Wins increase rarity chance by 10%
- **Streak bonus**: Each win in streak adds 5% rarity
- **Community votes**: High votes increase rarity
- **First X participants**: First 10 in a battle get rarity boost
- **Special events**: Event battles have higher legendary rates
- **Limited editions**: Certain battles cap at 100 cards (instant rarity)

---

## Avatar & Bling Customization

### Avatar Components (Layered SVG)

```
Base Layer (Required):
├── Face shape (5 options: round, square, oval, diamond, heart)
├── Skin tone (10 options: full spectrum)
├── Expression (8 options: confident, fierce, chill, happy, etc.)

Facial Features:
├── Eyes (12 options: almond, round, intense, squint, etc.)
├── Eyebrows (8 options: thick, thin, arched, straight)
├── Nose (6 options: button, wide, pointed, etc.)
├── Mouth (10 options: smile, smirk, serious, tongue out, etc.)

Hair/Head (Optional):
├── Hairstyle (20+ options: dreads, afro, fade, braids, etc.)
├── Headwear (15+ options: snapback, beanie, crown, bandana, etc.)
├── Hair color (spectrum)

Accessories (Bling Layer):
├── Chains (10+ styles: gold rope, diamond Cuban, platinum, etc.)
├── Earrings (8+ styles: studs, hoops, diamonds)
├── Grillz (5+ styles: full gold, diamond, platinum fangs)
├── Glasses (10+ styles: shades, glasses, designer)
├── Face tattoos (15+ designs: teardrops, symbols, text)

Badge Overlay:
├── Up to 7 bling badges
├── Arranged around avatar
├── Glow/pulse animation for high rarity
```

### Bling Earned Through Gameplay

**Purchase vs Earned**:
- **Free (Earned)**: Basic avatar + battle badges
- **Paid (XP Shop)**: Premium hairstyles, chains, grillz
- **Rare Drops**: Limited edition accessories (1% drop)
- **Season Pass**: Exclusive seasonal bling sets
- **Tournament Prizes**: Unique championship bling

**Customization Flow**:
1. Win battle → Card is minted
2. Navigate to `/profile/cards/[card-id]/customize`
3. Select avatar features (one-time edit or pay to re-customize)
4. Bling badges auto-applied based on achievements
5. Preview in 3D viewer
6. Confirm and update on-chain metadata

---

## Technical Implementation

### Card Generation System

#### Dynamic SVG Template
```xml
<!-- battle-card-template.svg -->
<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradients for rarity tiers -->
    <linearGradient id="common-border">
      <stop offset="0%" stop-color="#cd7f32"/>
      <stop offset="100%" stop-color="#8b4513"/>
    </linearGradient>

    <linearGradient id="legendary-border">
      <stop offset="0%" stop-color="#9b59b6"/>
      <stop offset="50%" stop-color="#3498db"/>
      <stop offset="100%" stop-color="#e74c3c"/>
    </linearGradient>

    <!-- Animated effects for mythic cards -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Dynamic border based on rarity -->
  <rect id="card-border" x="0" y="0" width="400" height="600"
        rx="20" fill="url(#{{rarity}}-border)" stroke="#000" stroke-width="4"/>

  <!-- Avatar container -->
  <g id="avatar-container" transform="translate(200, 150)">
    {{> avatar-layers}}
  </g>

  <!-- Username and stats -->
  <text id="username" x="200" y="320" text-anchor="middle"
        font-size="28" font-weight="bold" fill="#fff">
    {{username}} #{{cardNumber}}
  </text>

  <text id="battle-record" x="200" y="350" text-anchor="middle"
        font-size="18" fill="#ccc">
    Record: {{wins}}-{{losses}}-{{draws}}
  </text>

  <!-- Bling badges row -->
  <g id="bling-badges" transform="translate(80, 380)">
    {{#each badges}}
      <g transform="translate({{@index * 45}}, 0)">
        <circle r="18" fill="rgba(255,215,0,0.3)" stroke="gold" stroke-width="2"/>
        <text x="0" y="8" text-anchor="middle" font-size="24">{{this}}</text>
      </g>
    {{/each}}
  </g>

  <!-- Battle info -->
  <text id="battle-title" x="200" y="480" text-anchor="middle" font-size="16" fill="#fff">
    {{battleTitle}}
  </text>

  <text id="battle-date" x="200" y="505" text-anchor="middle" font-size="14" fill="#aaa">
    {{battleDate}}
  </text>

  <text id="battle-result" x="200" y="530" text-anchor="middle"
        font-size="20" font-weight="bold" fill="{{resultColor}}">
    {{result}}
  </text>

  <!-- DVG logo and edition number -->
  <g id="dvg-logo" transform="translate(50, 560)">
    {{> dvg-symbol}}
  </g>

  <text id="edition" x="350" y="575" text-anchor="end" font-size="12" fill="#888">
    #{{editionNumber}}/{{totalEditions}}
  </text>
</svg>
```

#### Server-Side Generation (Node.js/Astro Endpoint)

```typescript
// src/pages/api/generate-battle-card.ts
import type { APIRoute } from 'astro';
import { renderBattleCard } from '../../lib/card-renderer';
import { uploadToArweave } from '../../lib/arweave-uploader';
import { mintCardNFT } from '../../lib/solana-minting';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();

  // Generate SVG
  const svg = await renderBattleCard({
    username: data.username,
    walletAddress: data.walletAddress,
    battleId: data.battleId,
    battleTitle: data.battleTitle,
    battleDate: new Date(data.battleTimestamp),
    result: data.result, // 'WIN', 'LOSS', 'DRAW'
    wins: data.totalWins,
    losses: data.totalLosses,
    draws: data.totalDraws,
    badges: data.earnedBadges, // ['🏆', '🔥', '💎']
    rarity: calculateRarity(data),
    avatar: data.avatarConfig,
    cardNumber: data.cardNumber,
    editionNumber: data.editionNumber,
    totalEditions: data.totalEditions
  });

  // Upload to Arweave (permanent storage)
  const arweaveUrl = await uploadToArweave({
    svg,
    metadata: {
      name: `${data.username} Battle Card #${data.cardNumber}`,
      description: `Commemorative card for ${data.battleTitle}`,
      attributes: [
        { trait_type: 'Result', value: data.result },
        { trait_type: 'Rarity', value: calculateRarity(data) },
        { trait_type: 'Battle', value: data.battleTitle },
        ...data.earnedBadges.map(badge => ({
          trait_type: 'Badge',
          value: badge
        }))
      ]
    }
  });

  // Mint NFT on Solana
  const nftAddress = await mintCardNFT({
    recipientWallet: data.walletAddress,
    metadataUri: arweaveUrl,
    sellerFeeBasisPoints: 500, // 5% royalty
    creators: [
      { address: 'WORLDBRIDGER_WALLET', share: 100 }
    ]
  });

  return new Response(JSON.stringify({
    success: true,
    nftAddress,
    metadataUri: arweaveUrl,
    svgPreview: svg
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

function calculateRarity(data: any): string {
  let rarityScore = 0;

  // Win bonus
  if (data.result === 'WIN') rarityScore += 20;

  // Streak bonus
  rarityScore += Math.min(data.currentStreak * 5, 30);

  // Votes bonus
  rarityScore += Math.min(data.communityVotes / 10, 20);

  // Badge count bonus
  rarityScore += data.earnedBadges.length * 10;

  // Determine tier
  if (rarityScore >= 90) return 'Mythic';
  if (rarityScore >= 70) return 'Legendary';
  if (rarityScore >= 50) return 'Epic';
  if (rarityScore >= 30) return 'Rare';
  return 'Common';
}
```

### Database Schema

```sql
-- Battle cards table
CREATE TABLE battle_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number BIGSERIAL UNIQUE,
  owner_wallet TEXT NOT NULL,
  battle_id UUID REFERENCES battles(id),

  -- Card metadata
  username TEXT NOT NULL,
  avatar_config JSONB NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Rare', 'Epic', 'Legendary', 'Mythic')),
  badges TEXT[] DEFAULT '{}',

  -- Battle stats at time of minting
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,

  -- NFT data
  nft_address TEXT UNIQUE,
  metadata_uri TEXT,
  arweave_tx_id TEXT,
  edition_number INTEGER,
  total_editions INTEGER,

  -- Airdrop eligibility
  airdrop_tier INTEGER DEFAULT 1,
  airdrops_claimed TEXT[] DEFAULT '{}',

  -- Trading
  listed_for_sale BOOLEAN DEFAULT FALSE,
  sale_price NUMERIC(20,9),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bling badges table
CREATE TABLE bling_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_emoji TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  category TEXT NOT NULL, -- 'victory', 'performance', 'rarity', 'special', 'skill'
  unlock_criteria JSONB NOT NULL,
  rarity TEXT DEFAULT 'Common',
  created_at TIMESTAMP DEFAULT NOW()
);

-- User badges junction table
CREATE TABLE user_badges (
  user_id UUID REFERENCES users(id),
  badge_id UUID REFERENCES bling_badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  battle_id UUID REFERENCES battles(id),
  PRIMARY KEY (user_id, badge_id)
);

-- Airdrops table
CREATE TABLE card_airdrops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airdrop_name TEXT NOT NULL,
  description TEXT,

  -- Eligibility criteria
  required_card_count INTEGER DEFAULT 1,
  required_rarity TEXT,
  required_badges TEXT[],
  required_tier INTEGER DEFAULT 1,

  -- Reward
  reward_type TEXT NOT NULL, -- 'token', 'nft', 'whitelist', 'physical'
  reward_amount NUMERIC(20,9),
  reward_nft_collection TEXT,

  -- Timing
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  claimed_count INTEGER DEFAULT 0,
  max_claims INTEGER,

  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Solana NFT Minting (Metaplex)

```typescript
// src/lib/solana-minting.ts
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile
} from '@metaplex-foundation/js';

const connection = new Connection(process.env.SOLANA_RPC_URL!);
const wallet = Keypair.fromSecretKey(
  Buffer.from(process.env.SOLANA_WALLET_SECRET!, 'base64')
);

const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(wallet))
  .use(bundlrStorage());

export async function mintCardNFT(config: {
  recipientWallet: string;
  metadataUri: string;
  sellerFeeBasisPoints: number;
  creators: { address: string; share: number }[];
}) {
  try {
    const { nft } = await metaplex.nfts().create({
      uri: config.metadataUri,
      name: 'Worldbridger Battle Card',
      sellerFeeBasisPoints: config.sellerFeeBasisPoints,
      creators: config.creators.map(c => ({
        address: new PublicKey(c.address),
        share: c.share
      })),
      tokenOwner: new PublicKey(config.recipientWallet),
      collection: new PublicKey(process.env.BATTLE_CARD_COLLECTION!),
      isMutable: true, // Allow updates for badge additions
    });

    return nft.address.toString();
  } catch (error) {
    console.error('Minting failed:', error);
    throw error;
  }
}

export async function updateCardMetadata(
  nftAddress: string,
  newMetadataUri: string
) {
  const nft = await metaplex.nfts().findByMint({
    mintAddress: new PublicKey(nftAddress)
  });

  await metaplex.nfts().update({
    nftOrSft: nft,
    uri: newMetadataUri
  });
}
```

---

## Airdrop & Reward System

### Airdrop Tiers

**Tier 1: Bronze Holders** (1+ cards)
- Quarterly token airdrops (100 $WBO tokens)
- Early access to new battles
- Exclusive Discord role

**Tier 2: Silver Collectors** (5+ cards)
- All Tier 1 benefits
- Monthly whitelist raffles
- Free battle entry (1 per month)
- Exclusive bling pack (3 items)

**Tier 3: Gold Collectors** (10+ cards)
- All Tier 1-2 benefits
- Guaranteed whitelist for all drops
- VIP battle commentator access
- Physical merch raffle (quarterly)
- Exclusive legendary card airdrop (1 per year)

**Tier 4: Diamond Whales** (25+ cards)
- All Tier 1-3 benefits
- Co-branding opportunities
- Custom bling design submission
- Revenue share from marketplace fees (0.1%)
- IRL event invitations

**Tier 5: Mythic Legends** (50+ cards or 1 Mythic card)
- All Tier 1-4 benefits
- Governance voting rights
- Profit-sharing NFT (1% of battle revenue)
- Lifetime premium membership
- Custom battle tournament hosting

### Special Event Airdrops

**Seasonal Drops**:
- **Summer Vibes**: Beach-themed bling (sunglasses, flip-flops emoji)
- **Halloween Spooky**: Skeleton grillz, ghost chain
- **Winter Holidays**: Santa hat, snowflake earrings
- **Black History Month**: Special edition cards with historical figures

**Milestone Airdrops**:
- **10,000th Battle**: All participants get "Pioneer" badge
- **100,000 Cards Minted**: Commemorative platinum card to all holders
- **1 Million Users**: Exclusive governance token airdrop

**Partnership Airdrops**:
- **Record Label Collabs**: Artist signature bling
- **Fashion Brand Collabs**: Designer accessories (Supreme chain, etc.)
- **Charity Battles**: Proceeds go to Kakuma, special humanitarian badge

---

## Marketplace & Trading

### Primary Market (Minting)
- **Free Minting**: Winners of battles (gas fee only)
- **Paid Minting**: Losers can mint for 0.1 SOL
- **Premium Editions**: Limited runs with exclusive art (0.5-2 SOL)

### Secondary Market (Trading)
- **Built-in Marketplace**: `/marketplace/battle-cards`
- **Filters**: Rarity, badges, username, battle, date
- **Sorting**: Price, rarity, recent, popular
- **Royalties**: 5% to Worldbridger, 2% to original battle winner

### Trading Features
- **Wishlist**: Mark cards you want to buy
- **Offers**: Make offers below listing price
- **Bundles**: Sell multiple cards together
- **Auctions**: Timed auctions for rare cards
- **Swaps**: Trade cards directly (no SOL needed)

### Rarity Market Dynamics
| Rarity | Expected Floor Price | Average Sale |
|--------|---------------------|--------------|
| Common | 0.05 SOL | 0.08 SOL |
| Rare | 0.15 SOL | 0.25 SOL |
| Epic | 0.5 SOL | 0.8 SOL |
| Legendary | 2 SOL | 5 SOL |
| Mythic | 10 SOL | 50+ SOL |

---

## User Interface

### Card Collection Page (`/profile/cards`)

```tsx
<div class="card-collection">
  <div class="collection-header">
    <h1>Your Battle Cards</h1>
    <div class="collection-stats">
      <div class="stat">
        <span class="stat-value">{totalCards}</span>
        <span class="stat-label">Total Cards</span>
      </div>
      <div class="stat">
        <span class="stat-value">{rarityBreakdown.legendary}</span>
        <span class="stat-label">Legendary+</span>
      </div>
      <div class="stat">
        <span class="stat-value">{totalBadges}</span>
        <span class="stat-label">Unique Badges</span>
      </div>
      <div class="stat">
        <span class="stat-value">{airdropTier}</span>
        <span class="stat-label">Airdrop Tier</span>
      </div>
    </div>
  </div>

  <div class="filters">
    <select name="rarity">
      <option>All Rarities</option>
      <option>Mythic</option>
      <option>Legendary</option>
      <option>Epic</option>
      <option>Rare</option>
      <option>Common</option>
    </select>

    <select name="sort">
      <option>Recent First</option>
      <option>Rarest First</option>
      <option>Win Rate</option>
      <option>Most Badges</option>
    </select>

    <input type="search" placeholder="Search by battle, username..." />
  </div>

  <div class="card-grid">
    {cards.map(card => (
      <div class="card-item" data-rarity={card.rarity}>
        <div class="card-preview">
          <img src={card.svgUrl} alt={card.name} />
          {card.rarity === 'Mythic' && (
            <div class="mythic-glow"></div>
          )}
        </div>

        <div class="card-info">
          <h3>{card.username} #{card.cardNumber}</h3>
          <div class="card-badges">
            {card.badges.map(badge => (
              <span class="badge" title={badge.name}>{badge.emoji}</span>
            ))}
          </div>
          <div class="card-actions">
            <button class="btn-view">View</button>
            <button class="btn-sell">Sell</button>
            <button class="btn-share">Share</button>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

### Card Detail Modal

```tsx
<div class="card-modal">
  <div class="modal-content">
    <div class="card-display">
      <div class="card-flip-container">
        <div class="card-front">
          <img src={card.svgUrl} />
        </div>
        <div class="card-back">
          <img src={card.backSvgUrl} />
        </div>
      </div>
      <button class="flip-button">Flip Card</button>
    </div>

    <div class="card-details">
      <h2>{card.username} #{card.cardNumber}</h2>
      <div class="rarity-badge" data-rarity={card.rarity}>
        {card.rarity}
      </div>

      <div class="detail-section">
        <h3>Battle Info</h3>
        <p><strong>Title:</strong> {card.battleTitle}</p>
        <p><strong>Date:</strong> {formatDate(card.battleDate)}</p>
        <p><strong>Result:</strong> {card.result}</p>
        <p><strong>Edition:</strong> {card.editionNumber}/{card.totalEditions}</p>
      </div>

      <div class="detail-section">
        <h3>Stats</h3>
        <p><strong>Record:</strong> {card.wins}-{card.losses}-{card.draws}</p>
        <p><strong>Win Rate:</strong> {winRate}%</p>
        <p><strong>Badges Earned:</strong> {card.badges.length}</p>
      </div>

      <div class="detail-section">
        <h3>Bling Badges</h3>
        <div class="badge-list">
          {card.badges.map(badge => (
            <div class="badge-item">
              <span class="badge-emoji">{badge.emoji}</span>
              <div>
                <strong>{badge.name}</strong>
                <p>{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div class="detail-section">
        <h3>Unlocked Airdrops</h3>
        {eligibleAirdrops.map(airdrop => (
          <div class="airdrop-item">
            <span class="airdrop-icon">🎁</span>
            <div>
              <strong>{airdrop.name}</strong>
              <p>{airdrop.description}</p>
            </div>
            {airdrop.claimed ? (
              <span class="claimed">Claimed ✓</span>
            ) : (
              <button class="btn-claim">Claim</button>
            )}
          </div>
        ))}
      </div>

      <div class="action-buttons">
        <button class="btn-customize">Customize Avatar</button>
        <button class="btn-share">Share on Twitter</button>
        <button class="btn-list">List for Sale</button>
        <button class="btn-download">Download PNG</button>
      </div>
    </div>
  </div>
</div>
```

---

## Social Sharing & Virality

### Share Features
- **Twitter Card**: Auto-generated image with card preview
- **Discord Embed**: Rich embed with card stats
- **Instagram Stories**: Vertical format card export
- **TikTok**: Animated card reveal video
- **Frame Export**: Profile picture ready (1:1 crop)

### Sharing Templates

**Twitter Template**:
```
Just won my battle and earned this {rarity} card! 🏆

{badges} earned:
{badgeList}

Battle: {battleTitle}
Record: {wins}-{losses}

Think you can beat me? 👀
Join the battle at {battleUrl}

#RapBattle #Web3 #NFT #{username}
```

**Discord Embed**:
```json
{
  "title": "New Battle Card Minted!",
  "description": "**{username}** just earned a **{rarity}** card!",
  "color": "{rarityColor}",
  "thumbnail": { "url": "{cardImageUrl}" },
  "fields": [
    { "name": "Battle", "value": "{battleTitle}", "inline": true },
    { "name": "Result", "value": "{result}", "inline": true },
    { "name": "Record", "value": "{wins}-{losses}-{draws}", "inline": true },
    { "name": "Badges", "value": "{badgeEmojis}", "inline": false }
  ],
  "footer": { "text": "Worldbridger Battle Cards" },
  "timestamp": "{timestamp}"
}
```

---

## Gamification & Engagement Loops

### Collection Challenges

**Weekly Challenges**:
- Win 3 battles this week → Exclusive badge
- Mint a card every day for 7 days → Streak badge
- Collect 3 different rarity tiers → Collector badge

**Monthly Quests**:
- Collect 5 cards from different opponents → Social badge
- Get a card with 5+ badges → Elite badge
- Win a tournament → Champion badge

**Seasonal Goals**:
- Complete full season set → Completionist badge + rare airdrop
- Reach 1000 total community votes → Superstar badge
- Hold 10+ cards for 3 months → Diamond Hands badge

### Leaderboards

**Global Rankings**:
1. Most Cards Collected
2. Highest Rarity Collection Value
3. Most Badges Earned
4. Longest Win Streak
5. Best Win Rate (min 10 battles)

**Rewards for Top 10**:
- Custom profile banner
- Exclusive "Top 10" badge on all future cards
- Monthly SOL prize pool
- Featured on homepage

---

## Roadmap & Milestones

### Phase 1: MVP (Weeks 1-2)
- [ ] Update DVG card SVG template with battle fields
- [ ] Create basic avatar customization system (10 options)
- [ ] Implement 5 core bling badges
- [ ] Set up Solana minting pipeline (testnet)
- [ ] Build `/profile/cards` collection page
- [ ] Test minting flow end-to-end

### Phase 2: Enhancement (Weeks 3-4)
- [ ] Add rarity tier system
- [ ] Create 20+ bling badges across all categories
- [ ] Implement card back design with QR code
- [ ] Build card detail modal with flip animation
- [ ] Add social sharing features
- [ ] Marketplace v1 (list, buy, sell)

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Advanced avatar builder (50+ options)
- [ ] Airdrop tier system
- [ ] Trading/swapping functionality
- [ ] Animated card reveals
- [ ] Collection challenges
- [ ] Leaderboards

### Phase 4: Scale & Polish (Weeks 7-8)
- [ ] Performance optimization (lazy loading, CDN)
- [ ] Mobile app integration (React Native)
- [ ] Physical card printing service
- [ ] AR card viewer (hold up to camera)
- [ ] Partnership integrations
- [ ] Marketing campaign launch

---

## Success Metrics

### User Engagement
- [ ] 80%+ of battle participants mint cards
- [ ] 30%+ customize their avatar
- [ ] 20%+ list cards for sale
- [ ] 10%+ actively collect cards
- [ ] 5%+ reach Tier 3+ airdrop status

### Economic Metrics
- [ ] 10,000 cards minted in first month
- [ ] $50K+ in secondary market volume
- [ ] 5% monthly growth in card minting
- [ ] $10+ average card value
- [ ] 20% of revenue from marketplace fees

### Social Metrics
- [ ] 5,000+ card shares on Twitter
- [ ] 1,000+ cards used as profile pictures
- [ ] 500+ Discord mentions
- [ ] Featured on at least 3 NFT marketplaces
- [ ] Trending on Solana NFT tracker

---

## Technical Challenges & Solutions

### Challenge 1: Dynamic SVG Generation
**Problem**: Generating unique SVGs for every card at scale
**Solution**:
- Use templating engine (Handlebars) with modular components
- Pre-render common elements (borders, backgrounds)
- Cache generated SVGs on Arweave/IPFS
- Lazy generate on-demand for customization

### Challenge 2: On-Chain Metadata Updates
**Problem**: Adding new badges to existing cards without re-minting
**Solution**:
- Set `isMutable: true` on Metaplex NFTs
- Store badge references in external JSON (updateable)
- Use versioned metadata URIs (v1, v2, etc.)
- Implement badge claim transaction to update metadata

### Challenge 3: Avatar Customization State
**Problem**: Storing user avatar choices efficiently
**Solution**:
```typescript
interface AvatarConfig {
  version: 1;
  layers: {
    face: string;        // 'round'
    skinTone: string;    // '#8d5524'
    eyes: string;        // 'almond'
    hair: string;        // 'dreads'
    accessories: string[]; // ['gold-chain', 'diamond-studs']
  };
  bling: string[];       // ['🏆', '🔥']
}

// Compressed to base64 for storage
const compressed = btoa(JSON.stringify(config)); // ~200 bytes
```

### Challenge 4: Rarity Calculation Fairness
**Problem**: Preventing gaming of rarity system
**Solution**:
- Use provably fair randomness (Chainlink VRF)
- Combine on-chain data + timestamp hash
- Community vote weight decay (prevent vote manipulation)
- Cap rarity boosts (max 50% from any single factor)

---

## Legal & Compliance

### Copyright & Licensing
- [ ] Obtain rights for all avatar components
- [ ] Create terms of service for NFT ownership
- [ ] Clarify IP rights (user owns image, not underlying IP)
- [ ] Royalty structure disclosure

### Regulatory Compliance
- [ ] NFT classification (collectible vs security)
- [ ] KYC/AML for high-value transactions (>$10k)
- [ ] Tax reporting guidance for users
- [ ] Gambling law compliance (battles are skill-based)

### Content Moderation
- [ ] Review system for custom avatars
- [ ] Ban on offensive imagery
- [ ] DMCA takedown process
- [ ] Report button on marketplace listings

---

## Marketing & Launch Strategy

### Pre-Launch (2 weeks before)
- [ ] Teaser campaign: "Something special for battle winners..."
- [ ] Influencer previews (send early cards to hip-hop influencers)
- [ ] Discord hype channel with sneak peeks
- [ ] Twitter Space AMA about cards

### Launch Day
- [ ] First 100 cards minted get "Founder" badge
- [ ] Limited edition launch day cards (special border)
- [ ] Giveaway: 10 free mints to Twitter followers
- [ ] Live stream: Watch first mythic card minted

### Post-Launch (First month)
- [ ] Weekly spotlight on rare cards
- [ ] Community voting on new bling designs
- [ ] Partnership announcements (brands, artists)
- [ ] Monthly wrap-up: "Top cards of the month"

---

## Documentation

### User Guides
- [ ] "What are Battle Cards?" explainer
- [ ] "How to customize your avatar" tutorial
- [ ] "Earning bling badges" guide
- [ ] "Understanding rarity" article
- [ ] "Trading cards 101" for beginners

### Developer Docs
- [ ] SVG template customization guide
- [ ] Minting API reference
- [ ] Metadata schema documentation
- [ ] Integration guide (how to display cards on external sites)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-03
**Author**: Claude Code
**Status**: Planning Complete - Ready for Implementation
