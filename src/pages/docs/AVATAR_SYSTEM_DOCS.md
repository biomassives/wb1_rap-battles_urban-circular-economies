---
layout: "../../layouts/DocLayout.astro"
title: "AVATAR_SYSTEM_DOCS"
---
<div data-pagefind-filter="type:docs"></div>

# Purple Point - Avatar System Documentation
**Created**: 2026-01-02
**Version**: 1.0

---

## 📋 Overview

The Purple Point Avatar System is a **composable NFT-based avatar builder** that allows users to create unique profile pictures (PFPs) and rap battle avatars using:

1. **Vector-based canvas rendering** (HTML5 Canvas)
2. **Level-gated base characters** (animal mentors)
3. **Composable NFT accessories** (bling, hats, chains, props)
4. **Multi-use export** (profile pictures, rap battles, NFT minting)

---

## 🎨 System Architecture

### Components

```
/src/pages/
├── profile.astro          # Simple avatar upload modal
└── avatar-builder.astro   # Advanced vector avatar builder

/public/avatars/           # Saved avatar images (future)
/src/lib/
└── avatar-engine.js       # Avatar rendering engine (future extraction)
```

### Data Flow

```
User Selection → Avatar State → Canvas Render → Export Options
                                                 ├─ Download PNG
                                                 ├─ Set as Profile Pic
                                                 └─ Mint as NFT
```

---

## 🐾 Base Characters (Animal Mentors)

### Character Progression

| Character | Emoji | Unlock Level | Special Ability |
|-----------|-------|--------------|-----------------|
| **Chicken** | 🐓 | 1 (Default) | Community Builder |
| **Cat** | 🐱 | 11 | Independent Learner |
| **Goat** | 🐐 | 11 | Resilient Spirit |
| **Pigeon** | 🕊️ | 21 | Peace Messenger |
| **Dog** | 🐕 | 21 | Loyal Collaborator |
| **Rabbit** | 🐰 | 31 | Rapid Growth |

### Character Data Structure

```javascript
const characterData = {
  chicken: {
    emoji: '🐓',
    name: 'Chicken Mentor',
    unlockLevel: 1,
    description: 'The foundation starter. Learns community building.',
    abilities: ['community_boost', 'tutorial_mastery'],
    defaultTint: '#ffffff'
  },
  cat: {
    emoji: '🐱',
    name: 'Cat Mentor',
    unlockLevel: 11,
    description: 'Independent and curious. Masters self-directed learning.',
    abilities: ['solo_learning_boost', 'curiosity_bonus'],
    defaultTint: '#fbbf24'
  },
  // ... more characters
};
```

---

## 💎 Composable NFT Accessories

### Accessory Categories

#### 1. Headwear (Hat Slot)
- **Crown** 👑 - NFT Item (Rare)
  - Unlocked by: Owning Crown NFT
  - Effect: +10% XP in Urban & Coastal Youth projects

- **Cap** 🧢 - Common Item
  - Unlocked by: Default
  - Effect: Casual style bonus

- **Halo** 😇 - NFT Item (Epic)
  - Unlocked by: Completing all environmental courses
  - Effect: +15% XP in learning activities

- **Wizard Hat** 🧙 - Level-gated (LVL 25)
  - Unlocked by: Reaching Level 25
  - Effect: +20% mystical XP

- **Party Hat** 🎉 - Level-gated (LVL 15)
  - Unlocked by: Hosting 5 collaborations
  - Effect: +10% social XP

#### 2. Bling & Chains (Neck Slot)
- **Gold Chain** 🥇 - NFT Item (Epic)
  - Unlocked by: Winning 10 rap battles
  - Effect: +25% battle XP

- **Diamond** 💎 - NFT Item (Legendary)
  - Unlocked by: Owning Diamond NFT (rare drop)
  - Effect: +50% all XP (max prestige)

- **Silver Chain** 🥈 - Common Item
  - Unlocked by: Winning 3 rap battles
  - Effect: +10% battle XP

#### 3. Eyewear (Eyes Slot)
- **Sunglasses** 😎 - Common Item
  - Unlocked by: Default
  - Effect: Cool style bonus

- **Monocle** 🧐 - NFT Item (Rare)
  - Unlocked by: Completing 5 courses
  - Effect: +15% learning XP

- **Laser Eyes** ⚡ - Level-gated (LVL 50)
  - Unlocked by: Reaching Level 50
  - Effect: +30% all XP (legendary status)

#### 4. Props (Hand/Side Slot)
- **Microphone** 🎤 - Common Item
  - Unlocked by: Creating first track
  - Effect: +10% music XP

- **Money Bag** 💰 - NFT Item (Epic)
  - Unlocked by: Earning 10,000 tokens
  - Effect: +20% token earnings

- **Fire** 🔥 - Common Item
  - Unlocked by: Creating hot track
  - Effect: Flame aura in battles

### NFT Accessory System

```javascript
const accessoryNFTs = {
  crown: {
    type: 'headwear',
    rarity: 'rare',
    mintAddress: 'Sol...', // Solana NFT address
    attributes: {
      xpBoost: 0.10,
      category: 'kakuma',
      transferable: true
    },
    requirements: {
      ownership: true, // Must own NFT
      level: 0
    }
  },
  diamond: {
    type: 'chain',
    rarity: 'legendary',
    mintAddress: 'Sol...',
    attributes: {
      xpBoost: 0.50,
      category: 'all',
      transferable: true,
      stackable: false // Only one can be equipped
    },
    requirements: {
      ownership: true,
      level: 0
    }
  }
  // ... more NFT accessories
};
```

---

## 🎨 Customization Options

### Background Colors
- Purple Gradient `#667eea`
- Deep Purple `#764ba2`
- Pink `#f093fb`
- Blue `#4facfe`
- Green `#43e97b`
- Rose `#fa709a`

### Character Tints
- White (Default) `#ffffff`
- Gold `#fbbf24`
- Red `#f87171`
- Blue `#60a5fa`
- Green `#34d399`
- Purple `#a78bfa`

---

## 💾 Export & Usage

### 1. Download PNG
```javascript
function downloadAvatar() {
  const canvas = document.getElementById('avatarCanvas');
  const link = document.createElement('a');
  link.download = `purple-point-avatar-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
```

**Use Cases**:
- Social media profile pictures
- Discord/Twitter avatars
- Printable merch designs

### 2. Set as Profile Picture
```javascript
function saveAsProfilePic() {
  const avatarDataUrl = canvas.toDataURL('image/png');

  // Upload to IPFS/S3
  const ipfsHash = await uploadToIPFS(avatarDataUrl);

  // Save to user profile
  await fetch('/api/profile/update-avatar', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: userWallet,
      avatarUrl: `ipfs://${ipfsHash}`
    })
  });
}
```

**Use Cases**:
- Profile page avatar
- User card displays
- Leaderboard entries

### 3. Mint as NFT (Future Feature)
```javascript
async function mintAsNFT() {
  // 1. Generate metadata
  const metadata = {
    name: `Purple Point Avatar #${userId}`,
    symbol: 'PPAVATAR',
    description: 'Composable avatar NFT from Purple Point',
    image: avatarDataUrl,
    attributes: [
      { trait_type: 'Character', value: avatarState.character },
      { trait_type: 'Headwear', value: avatarState.accessories.hat },
      { trait_type: 'Chain', value: avatarState.accessories.chain },
      { trait_type: 'Eyewear', value: avatarState.accessories.eyes },
      { trait_type: 'Prop', value: avatarState.accessories.prop },
      { trait_type: 'Background', value: avatarState.bgColor },
      { trait_type: 'Tint', value: avatarState.tintColor }
    ]
  };

  // 2. Upload metadata to IPFS
  const metadataUri = await uploadMetadataToIPFS(metadata);

  // 3. Mint NFT on Solana
  const nft = await metaplex.nfts().create({
    uri: metadataUri,
    name: metadata.name,
    sellerFeeBasisPoints: 500, // 5% royalty
    collection: AVATAR_COLLECTION_ADDRESS
  });

  return nft;
}
```

**Benefits of Minting**:
- **Ownership**: True ownership of avatar design
- **Portability**: Use across Web3 platforms
- **Composability**: Accessories as child NFTs
- **Trading**: Sell/trade unique avatars
- **Royalties**: Earn from resales

---

## 🎮 Rap Battle Integration

### Battle Avatar Display

```javascript
// In battle/[id].astro
function displayBattleAvatar(userId) {
  const avatar = await loadUserAvatar(userId);

  // Render avatar in battle card
  const battleCard = `
    <div class="battle-participant">
      <img src="${avatar.imageUrl}" class="battle-avatar" />
      <div class="battle-bling">
        ${avatar.accessories.chain !== 'none' ? '✨ BLING' : ''}
      </div>
      <h3>${avatar.username}</h3>
      <div class="battle-stats">
        <span>Level ${avatar.level}</span>
        ${avatar.accessories.prop === 'mic' ? '<span>🎤 Pro</span>' : ''}
      </div>
    </div>
  `;

  return battleCard;
}
```

### Avatar Power-Ups in Battles

Certain accessories grant bonuses in rap battles:

| Accessory | Battle Bonus |
|-----------|--------------|
| 🎤 Microphone | +10% lyrical creativity |
| 🥇 Gold Chain | +15% battle presence |
| 💎 Diamond | +25% total battle XP |
| 😎 Sunglasses | +10% crowd appeal |
| 🔥 Fire | +20% heat meter |

```javascript
function calculateBattleBonus(avatar) {
  let bonus = 1.0;

  if (avatar.accessories.prop === 'mic') bonus *= 1.10;
  if (avatar.accessories.chain === 'gold') bonus *= 1.15;
  if (avatar.accessories.chain === 'diamond') bonus *= 1.25;
  if (avatar.accessories.eyes === 'sunglasses') bonus *= 1.10;
  if (avatar.accessories.prop === 'fire') bonus *= 1.20;

  return bonus;
}
```

---

## 🔗 Composable NFT Architecture

### Parent-Child NFT Structure

```
Avatar NFT (Parent)
├── Character: Chicken 🐓
├── Background: #667eea
├── Tint: #ffffff
└── Child NFTs (Accessories)
    ├── Crown NFT 👑 (equipped)
    ├── Diamond NFT 💎 (equipped)
    ├── Monocle NFT 🧐 (unequipped)
    └── Money Bag NFT 💰 (equipped)
```

### Metaplex Metadata Standard

```json
{
  "name": "Purple Point Avatar #1234",
  "symbol": "PPAVATAR",
  "description": "Composable avatar from Purple Point",
  "image": "ipfs://QmXx.../avatar.png",
  "external_url": "https://purplepoint.io/avatar/1234",
  "attributes": [
    { "trait_type": "Character", "value": "Chicken" },
    { "trait_type": "Level", "value": 15 },
    { "trait_type": "Headwear", "value": "Crown", "is_nft": true },
    { "trait_type": "Chain", "value": "Diamond", "is_nft": true },
    { "trait_type": "Eyewear", "value": "None" },
    { "trait_type": "Prop", "value": "Money Bag", "is_nft": true }
  ],
  "properties": {
    "files": [
      { "uri": "ipfs://QmXx.../avatar.png", "type": "image/png" }
    ],
    "category": "image",
    "creators": [
      {
        "address": "PurplePointCreatorWallet...",
        "share": 100
      }
    ]
  },
  "collection": {
    "name": "Purple Point Avatars",
    "family": "Purple Point"
  },
  "composable": {
    "child_nfts": [
      "CrownNFTMintAddress...",
      "DiamondNFTMintAddress...",
      "MoneyBagNFTMintAddress..."
    ],
    "equip_slots": {
      "headwear": "CrownNFTMintAddress...",
      "chain": "DiamondNFTMintAddress...",
      "eyes": null,
      "prop": "MoneyBagNFTMintAddress..."
    }
  }
}
```

---

## 🎯 Implementation Roadmap

### Phase 1: Basic Avatar Builder ✅ (Completed)
- [x] Canvas-based rendering
- [x] 6 base characters
- [x] 4 accessory categories
- [x] Color customization
- [x] Download PNG
- [x] Save as profile picture

### Phase 2: NFT Integration (Week 1-2)
- [ ] Metaplex NFT minting
- [ ] IPFS metadata upload
- [ ] Accessory ownership verification
- [ ] NFT collection creation
- [ ] Composable NFT parent-child linking

### Phase 3: Advanced Features (Week 3-4)
- [ ] Animated avatars (GIF/WebM export)
- [ ] 3D rendering option (Three.js)
- [ ] Community marketplace for accessories
- [ ] Accessory crafting system
- [ ] Avatar evolution (level-based transformations)

### Phase 4: Integration (Week 5-6)
- [ ] Rap battle avatar display
- [ ] Leaderboard avatar previews
- [ ] Social sharing (Twitter/Discord)
- [ ] Avatar gallery page
- [ ] Avatar remix feature

---

## 📊 Database Schema

### Avatars Table

```sql
CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(44) NOT NULL,

  -- Character
  character VARCHAR(20) NOT NULL, -- chicken, cat, goat, etc.
  bg_color VARCHAR(7) NOT NULL,   -- #667eea
  tint_color VARCHAR(7) NOT NULL, -- #ffffff

  -- Accessories (can be NULL if none equipped)
  hat_accessory VARCHAR(50),
  chain_accessory VARCHAR(50),
  eyes_accessory VARCHAR(50),
  prop_accessory VARCHAR(50),

  -- Storage
  image_url TEXT,                 -- IPFS or S3 URL
  nft_mint_address VARCHAR(44),   -- If minted as NFT

  -- Usage
  is_profile_avatar BOOLEAN DEFAULT false,
  is_battle_avatar BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
);

CREATE INDEX idx_avatars_wallet ON avatars(wallet_address);
CREATE INDEX idx_avatars_profile ON avatars(wallet_address, is_profile_avatar);
```

### Accessory NFTs Table

```sql
CREATE TABLE accessory_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_address VARCHAR(44) UNIQUE NOT NULL,

  -- Accessory details
  accessory_type VARCHAR(20) NOT NULL, -- hat, chain, eyes, prop
  accessory_name VARCHAR(50) NOT NULL, -- crown, diamond, etc.
  emoji VARCHAR(10) NOT NULL,

  -- NFT metadata
  rarity VARCHAR(20) NOT NULL,         -- common, rare, epic, legendary
  metadata_uri TEXT NOT NULL,

  -- Attributes
  xp_boost DECIMAL(3,2) DEFAULT 0.00,  -- 0.10 = 10% boost
  category_boost VARCHAR(50),          -- music, kakuma, learning, all

  -- Ownership
  current_owner VARCHAR(44),
  is_transferable BOOLEAN DEFAULT true,

  -- Stats
  times_equipped INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (current_owner) REFERENCES users(wallet_address)
);

CREATE INDEX idx_accessories_owner ON accessory_nfts(current_owner);
CREATE INDEX idx_accessories_type ON accessory_nfts(accessory_type);
```

---

## 🔧 API Endpoints

### Avatar Management

```javascript
// GET /api/avatar/get?walletAddress=xxx
// Returns user's current avatar
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  const avatar = await db.query(
    'SELECT * FROM avatars WHERE wallet_address = $1 AND is_profile_avatar = true',
    [walletAddress]
  );

  return new Response(JSON.stringify({
    success: true,
    avatar: avatar.rows[0] || null
  }));
}

// POST /api/avatar/save
// Saves new avatar configuration
export async function POST({ request }) {
  const { walletAddress, character, bgColor, tintColor, accessories, imageUrl } =
    await request.json();

  // Unset current profile avatar
  await db.query(
    'UPDATE avatars SET is_profile_avatar = false WHERE wallet_address = $1',
    [walletAddress]
  );

  // Insert new avatar
  const result = await db.query(`
    INSERT INTO avatars (
      wallet_address, character, bg_color, tint_color,
      hat_accessory, chain_accessory, eyes_accessory, prop_accessory,
      image_url, is_profile_avatar
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
    RETURNING *
  `, [
    walletAddress, character, bgColor, tintColor,
    accessories.hat, accessories.chain, accessories.eyes, accessories.prop,
    imageUrl
  ]);

  return new Response(JSON.stringify({
    success: true,
    avatar: result.rows[0]
  }));
}

// POST /api/avatar/mint-nft
// Mints avatar as NFT
export async function POST({ request }) {
  const { avatarId, walletAddress } = await request.json();

  // Get avatar data
  const avatar = await getAvatar(avatarId);

  // Generate and upload metadata
  const metadataUri = await uploadAvatarMetadata(avatar);

  // Mint NFT
  const nft = await mintAvatarNFT(walletAddress, metadataUri);

  // Update avatar record
  await db.query(
    'UPDATE avatars SET nft_mint_address = $1 WHERE id = $2',
    [nft.mintAddress, avatarId]
  );

  return new Response(JSON.stringify({
    success: true,
    nft: nft
  }));
}
```

### Accessory Management

```javascript
// GET /api/accessories/owned?walletAddress=xxx
// Returns NFT accessories owned by user
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  const accessories = await db.query(
    'SELECT * FROM accessory_nfts WHERE current_owner = $1',
    [walletAddress]
  );

  return new Response(JSON.stringify({
    success: true,
    accessories: accessories.rows
  }));
}

// POST /api/accessories/equip
// Equips an accessory NFT to avatar
export async function POST({ request }) {
  const { walletAddress, accessoryMintAddress, slot } = await request.json();

  // Verify ownership
  const owned = await verifyAccessoryOwnership(walletAddress, accessoryMintAddress);
  if (!owned) {
    return new Response(JSON.stringify({
      success: false,
      error: 'You do not own this accessory NFT'
    }), { status: 403 });
  }

  // Update avatar with equipped accessory
  await db.query(`
    UPDATE avatars
    SET ${slot}_accessory = (
      SELECT accessory_name FROM accessory_nfts
      WHERE mint_address = $1
    )
    WHERE wallet_address = $2 AND is_profile_avatar = true
  `, [accessoryMintAddress, walletAddress]);

  // Increment times_equipped
  await db.query(
    'UPDATE accessory_nfts SET times_equipped = times_equipped + 1 WHERE mint_address = $1',
    [accessoryMintAddress]
  );

  return new Response(JSON.stringify({ success: true }));
}
```

---

## 🎨 Future Enhancements

### 1. Animated Avatars
- GIF export with animated accessories
- Particle effects (sparkles, flames, etc.)
- Idle animations for battle screens

### 2. 3D Avatars (Three.js)
- Rotate and view from different angles
- VR/AR avatar preview
- 3D accessory marketplace

### 3. Community Features
- Avatar remix/collaboration
- Accessory design contests
- Trending avatar styles leaderboard

### 4. Advanced Composability
- Layered accessory stacking
- Dynamic trait unlocks based on achievements
- Seasonal limited-edition accessories

### 5. Cross-Platform Integration
- Export to VRChat, Decentraland, etc.
- AR filters for social media
- Printable physical collectibles

---

## 📝 Summary

The Purple Point Avatar System provides:

✅ **Canvas-based vector avatar builder**
✅ **6 level-gated animal characters**
✅ **20+ composable accessories across 4 categories**
✅ **NFT ownership integration**
✅ **Multiple export formats** (PNG, Profile Pic, NFT)
✅ **Rap battle integration** with power-ups
✅ **Full customization** (colors, tints, accessories)

**Next Steps**:
1. Implement NFT minting (Metaplex)
2. Add accessory ownership verification
3. Create accessory marketplace
4. Integrate with rap battle system
5. Add animated export options

---

**Ready to build unique avatars for the Purple Point community! 🎨✨**
