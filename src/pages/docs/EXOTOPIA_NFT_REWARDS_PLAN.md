---
layout: "../../layouts/DocLayout.astro"
title: "EXOTOPIA_NFT_REWARDS_PLAN"
---
<div data-pagefind-filter="type:docs"></div>

# Exotopia/EcoCity NFT Rewards Integration Plan

**Date:** 2026-01-04
**Status:** 🔬 Research & Planning Phase

---

## Vision

Integrate **Exotopia** and **EcoCity** sustainability rewards with **multi-chain NFT minting**, enabling users to earn verifiable on-chain credentials for eco-positive actions, learning achievements, and community contributions.

---

## Reward Categories

### 1. 🌱 Environmental Impact NFTs

**Mint Trigger:** User completes eco-learning modules or takes environmental action

**Chains:** Polygon (primary), Algorand (fractional)

**NFT Types:**
- **Carbon Offset Certificates** - For tree planting, renewable energy use
- **Biodiversity Badges** - For wildlife habitat restoration learning
- **Water Conservation Medals** - For completing water sustainability courses
- **Waste Reduction Tokens** - For recycling/composting achievements

**Metadata:**
```json
{
  "name": "Carbon Offset Certificate #1234",
  "description": "Certified 50kg CO2 offset through reforestation",
  "image": "ipfs://...",
  "attributes": [
    { "trait_type": "Category", "value": "Environmental" },
    { "trait_type": "Impact Type", "value": "Carbon Offset" },
    { "trait_type": "CO2 Offset (kg)", "value": 50 },
    { "trait_type": "Date Earned", "value": "2026-01-04" },
    { "trait_type": "Location", "value": "Nairobi/Lamu, Kenya" }
  ],
  "animation_url": "https://...",
  "external_url": "https://exotopia.world/impact/1234"
}
```

---

### 2. 🎓 Learning Achievement NFTs

**Mint Trigger:** User completes courses, quizzes, or skill certifications

**Chains:** Near (primary - easy onboarding), Polygon (marketplace)

**NFT Types:**
- **Course Completion Certificates** - Verifiable educational credentials
- **Skill Badges** - Programming, agriculture, renewable energy, etc.
- **Quiz Master Tokens** - High scores on environmental quizzes
- **Mentor Medals** - For teaching others

**Use Cases:**
- **Employment Verification** - Refugees can prove skills to employers
- **University Credit** - Partner with institutions for course recognition
- **Scholarship Eligibility** - NFT holders qualify for funding

**Metadata:**
```json
{
  "name": "Renewable Energy Specialist Certificate",
  "description": "Completed 40-hour solar power installation course",
  "image": "ipfs://...",
  "attributes": [
    { "trait_type": "Category", "value": "Education" },
    { "trait_type": "Skill", "value": "Solar Energy" },
    { "trait_type": "Level", "value": "Intermediate" },
    { "trait_type": "Hours", "value": 40 },
    { "trait_type": "Issuer", "value": "Exotopia Academy" },
    { "trait_type": "Verified By", "value": "UN Refugee Agency" }
  ]
}
```

---

### 3. 🎵 Hip-Hop × Sustainability NFTs

**Mint Trigger:** User creates music, wins rap battles, or participates in eco-themed competitions

**Chains:** Tezos (primary - art focus), Solana (fast minting)

**NFT Types:**
- **Rap Battle Victory Trophies** - Won eco-themed battles
- **Music Track NFTs** - Original sustainability-themed songs
- **Collaboration Badges** - Multi-artist eco projects
- **Fan Support Tokens** - Supporting green musicians

**Revenue Model:**
- **Primary Sale:** 70% artist, 20% EcoCity fund, 10% platform
- **Royalties:** 10% on resales → 5% artist, 5% EcoCity reforestation

**Metadata:**
```json
{
  "name": "Eco Warrior Anthem #42",
  "description": "Hip-hop track about climate action from Nairobi/Lamu MC",
  "image": "ipfs://album-art.png",
  "animation_url": "ipfs://track.mp3",
  "attributes": [
    { "trait_type": "Category", "value": "Music" },
    { "trait_type": "Genre", "value": "Hip-Hop/Rap" },
    { "trait_type": "Theme", "value": "Environmental" },
    { "trait_type": "Artist Location", "value": "Nairobi/Lamu Camp" },
    { "trait_type": "BPM", "value": 95 },
    { "trait_type": "Duration", "value": "3:45" }
  ]
}
```

---

### 4. 🏕️ Nairobi/Lamu Impact NFTs

**Mint Trigger:** Community contributions, volunteer work, social impact

**Chains:** Celo (primary - mobile-first), Near (identity)

**NFT Types:**
- **Volunteer Hour Certificates** - Verifiable service records
- **Community Builder Badges** - Leadership achievements
- **Mentorship Medals** - Teaching/supporting others
- **Infrastructure Contribution Tokens** - Building community resources

**Special Features:**
- **Soulbound NFTs** (non-transferable) for identity
- **Verifiable Credentials** for resettlement applications
- **Social Capital Score** based on NFT collection

**Metadata:**
```json
{
  "name": "Nairobi/Lamu Community Builder Badge",
  "description": "100+ volunteer hours building solar microgrid",
  "image": "ipfs://...",
  "attributes": [
    { "trait_type": "Category", "value": "Social Impact" },
    { "trait_type": "Impact Type", "value": "Infrastructure" },
    { "trait_type": "Hours Contributed", "value": 120 },
    { "trait_type": "Project", "value": "Solar Microgrid Block 3" },
    { "trait_type": "Verified By", "value": "UNHCR Kenya" },
    { "trait_type": "Soulbound", "value": "true" }
  ]
}
```

---

### 5. 🎨 PFP Collection Rewards

**Mint Trigger:** User generates rare character in Rapper Template Builder

**Chains:** Polygon (marketplace), Solana (speed)

**NFT Types:**
- **Legendary Rapper Cards** - Rare builds from builder
- **Animal Spirit Guardians** - Rare animal combinations
- **Style Evolution Tokens** - Hairstyle achievement unlocks
- **Power Level Certificates** - High-stat characters

**Rarity-Based Rewards:**
- **Common (60%):** Basic rewards
- **Uncommon (25%):** 2x XP multiplier
- **Rare (10%):** Exclusive community access
- **Epic (4%):** Mentorship opportunities
- **Legendary (1%):** Revenue share from platform

---

## Multi-Chain Minting Architecture

### Contract Design

```typescript
// Universal NFT Minting Interface
interface IExotopiaNFT {
  // Core minting
  mint(to: address, metadata: URI, category: string): tokenId

  // Reward tracking
  linkToAction(tokenId: uint, actionType: string, proof: bytes): bool

  // Cross-chain
  bridgeTo(tokenId: uint, destinationChain: string): bool

  // Sustainability metrics
  getCarbonOffset(tokenId: uint): uint
  getImpactScore(tokenId: uint): uint
}
```

### Chain-Specific Implementations

#### 1. Polygon Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ExotopiaRewardsPolygon is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct RewardMetadata {
        string category;        // "environmental", "education", etc.
        uint256 impactScore;    // Quantified impact (CO2, hours, etc.)
        uint256 mintedAt;
        string actionProof;     // IPFS hash of proof
        bool soulbound;         // Non-transferable
    }

    mapping(uint256 => RewardMetadata) public rewards;
    uint256 private _tokenIdCounter;

    constructor() ERC721("Exotopia Rewards", "EXTR") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mintReward(
        address to,
        string memory category,
        uint256 impactScore,
        string memory actionProof,
        bool soulbound
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);

        rewards[tokenId] = RewardMetadata({
            category: category,
            impactScore: impactScore,
            mintedAt: block.timestamp,
            actionProof: actionProof,
            soulbound: soulbound
        });

        return tokenId;
    }

    // Override transfer to enforce soulbound
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        require(
            !rewards[tokenId].soulbound || from == address(0),
            "Soulbound NFT cannot be transferred"
        );
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
```

#### 2. Near Contract (Rust)
```rust
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::UnorderedMap;
use near_sdk::{env, near_bindgen, AccountId, PanicOnDefault};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct ExotopiaRewardsNear {
    pub owner_id: AccountId,
    pub tokens: UnorderedMap<String, RewardMetadata>,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct RewardMetadata {
    pub category: String,
    pub impact_score: u64,
    pub minted_at: u64,
    pub action_proof: String,
    pub soulbound: bool,
}

#[near_bindgen]
impl ExotopiaRewardsNear {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner_id,
            tokens: UnorderedMap::new(b"t"),
        }
    }

    pub fn mint_reward(
        &mut self,
        receiver_id: AccountId,
        category: String,
        impact_score: u64,
        action_proof: String,
        soulbound: bool,
    ) -> String {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only owner can mint"
        );

        let token_id = format!(
            "{}:{}",
            env::block_timestamp(),
            receiver_id
        );

        self.tokens.insert(
            &token_id,
            &RewardMetadata {
                category,
                impact_score,
                minted_at: env::block_timestamp(),
                action_proof,
                soulbound,
            },
        );

        token_id
    }
}
```

---

## Integration with Existing System

### 1. Backend API Endpoints

**New Endpoints:**

```typescript
// /api/rewards/mint
POST /api/rewards/mint
{
  "walletAddress": "0x...",
  "chain": "polygon" | "near" | "solana" | "tezos" | "celo",
  "rewardType": "environmental" | "education" | "music" | "impact" | "pfp",
  "metadata": {
    "name": "...",
    "description": "...",
    "attributes": [...],
    "impactScore": 50
  },
  "proof": "ipfs://..." // Proof of action
}

// /api/rewards/claim
GET /api/rewards/claim?walletAddress=0x...&rewardId=123
// Returns claimable rewards based on user achievements

// /api/rewards/portfolio
GET /api/rewards/portfolio?walletAddress=0x...
// Returns all NFTs across all chains

// /api/rewards/impact-score
GET /api/rewards/impact-score?walletAddress=0x...
// Calculates total environmental impact from NFT collection
```

### 2. Frontend Integration Points

**Update Profile Page:**
```astro
<!-- Add NFT Portfolio Display -->
<div class="nft-portfolio">
  <h3>MY NFT REWARDS</h3>

  <div class="chain-tabs">
    <button data-chain="polygon">Polygon</button>
    <button data-chain="near">Near</button>
    <button data-chain="solana">Solana</button>
  </div>

  <div class="nft-grid" id="nftGrid">
    <!-- NFT cards rendered here -->
  </div>

  <div class="impact-summary">
    <h4>TOTAL IMPACT</h4>
    <p>🌳 <strong id="totalCO2">0 kg</strong> CO2 Offset</p>
    <p>📚 <strong id="totalHours">0 hours</strong> Learning</p>
    <p>🤝 <strong id="totalVolunteer">0 hours</strong> Volunteering</p>
  </div>
</div>
```

**Update Rapper Builder Export:**
```javascript
// After SVG export, prompt for NFT minting
window.exportSVG = function() {
  const svg = document.getElementById('svgPreview').innerHTML;
  const rarityScore = calculateRarityScore();
  const rarityTier = getRarityTier(rarityScore);

  // Download SVG first
  downloadSVG(svg, rarityTier);

  // Prompt for NFT minting
  if (rarityTier === 'LEGENDARY' || rarityTier === 'EPIC') {
    setTimeout(() => {
      if (confirm(`🎉 You created a ${rarityTier} character!\n\nMint as NFT for rewards?`)) {
        window.location.href = `/mint-nft?rarity=${rarityTier}&build=${encodeURIComponent(JSON.stringify(config))}`;
      }
    }, 500);
  }
}
```

---

## Minting Workflow

### User Journey

```
1. USER COMPLETES ACTION
   ↓
2. SYSTEM VALIDATES ACTION
   - Check completion criteria
   - Verify proof (quiz score, volunteer hours, etc.)
   ↓
3. CALCULATE REWARD TIER
   - Environmental: Impact score (CO2, trees, etc.)
   - Education: Course difficulty + score
   - Music: Engagement + quality votes
   - Impact: Hours + verification
   ↓
4. GENERATE METADATA
   - Create NFT metadata JSON
   - Upload to IPFS
   - Generate certificate image
   ↓
5. SELECT CHAIN
   - Environmental → Polygon/Algorand
   - Education → Near
   - Music → Tezos/Solana
   - Impact → Celo/Near
   ↓
6. MINT NFT
   - Call chain-specific contract
   - Emit minting event
   - Store token ID in database
   ↓
7. NOTIFY USER
   - Push notification
   - Email with NFT link
   - Update profile badge count
   ↓
8. UPDATE STATS
   - Increment total impact score
   - Update leaderboard
   - Award XP bonus
```

---

## Testnet Deployment Plan

### Week 1: Smart Contract Development
- [ ] Deploy Polygon Mumbai contract
- [ ] Deploy Near Testnet contract
- [ ] Deploy Solana Devnet program
- [ ] Deploy Celo Alfajores contract
- [ ] Test cross-chain metadata compatibility

### Week 2: API Integration
- [ ] Build minting API endpoints
- [ ] Integrate with wallet manager
- [ ] Add IPFS metadata upload
- [ ] Create reward eligibility checker

### Week 3: Frontend Integration
- [ ] Update profile page with NFT portfolio
- [ ] Add minting flow to builder
- [ ] Create reward claim interface
- [ ] Build impact dashboard

### Week 4: Testing & Refinement
- [ ] Test minting on all chains
- [ ] Verify metadata standards
- [ ] Load testing
- [ ] Security audit (basic)

---

## Economic Model

### Minting Costs (Testnet → Mainnet)

| Chain | Testnet Cost | Mainnet Est. | Speed | Best For |
|-------|-------------|--------------|-------|----------|
| Polygon | FREE | ~$0.01 | 2-3s | High volume |
| Near | FREE | ~$0.01 | 1-2s | Identity |
| Solana | FREE | ~$0.00025 | <1s | Music drops |
| Tezos | FREE | ~$0.05 | 30s | Art NFTs |
| Celo | FREE | ~$0.001 | 5s | Mobile users |
| Algorand | FREE | ~$0.001 | <4s | Fractional |

### Revenue Streams

1. **NFT Marketplace Fees:** 2.5% on secondary sales
2. **Premium Minting:** $5/month for instant cross-chain minting
3. **Verification Services:** $10/certificate for employer verification
4. **Corporate Sponsorships:** Brands pay to sponsor reward categories
5. **Carbon Credit Sales:** Sell aggregated carbon offsets to companies

### Sustainability Fund Allocation

```
100% Revenue
├─ 40% → Nairobi/Lamu Community Projects
├─ 30% → Platform Development
├─ 20% → Reforestation (actual tree planting)
└─ 10% → Operating Costs
```

---

## Success Metrics

### Phase 1 (Testnet - Month 1)
- [ ] 100+ NFTs minted across all chains
- [ ] 50+ unique users claiming rewards
- [ ] 10+ different reward types tested
- [ ] 0 critical bugs

### Phase 2 (Mainnet Beta - Month 2-3)
- [ ] 1,000+ NFTs minted
- [ ] 500+ active users
- [ ] $5,000+ total impact value
- [ ] 10 tons CO2 offset verified

### Phase 3 (Scale - Month 4-6)
- [ ] 10,000+ NFTs minted
- [ ] 5,000+ users across 10 countries
- [ ] $50,000+ marketplace volume
- [ ] 100 tons CO2 offset
- [ ] 5 institutional partnerships (NGOs, universities)

---

## Risk Mitigation

### Technical Risks
- **Chain Downtime:** Deploy to multiple chains for redundancy
- **Gas Fee Spikes:** Batch minting during low-activity periods
- **Metadata Loss:** Triple backup (IPFS, Arweave, Filecoin)

### Regulatory Risks
- **NFT Classification:** Consult legal for securities compliance
- **Cross-Border Transfers:** KYC for high-value NFTs
- **Tax Implications:** Document NFTs as educational credentials, not securities

### Social Risks
- **Speculation:** Implement soulbound NFTs for identity
- **Fake Claims:** Multi-signature verification for high-impact rewards
- **Exclusion:** Keep minting free on testnet, subsidize mainnet costs

---

## Next Steps

### Immediate (This Week)
1. Choose 2-3 primary chains (recommend: Polygon, Near, Solana)
2. Set up testnet wallets and faucets
3. Deploy first smart contract (Polygon Mumbai)
4. Create test NFT metadata

### Short-Term (Month 1)
1. Build minting API
2. Integrate with profile page
3. Launch testnet campaign (100 test users)
4. Document minting flow

### Medium-Term (Months 2-3)
1. Mainnet deployment (1 chain first)
2. Partnership with 1 NGO for verification
3. Launch public beta
4. Marketing campaign

---

## Resources & Tools

### Development
- **Hardhat** - Ethereum/Polygon contract development
- **Anchor** - Solana program development
- **Near SDK** - Near contract development
- **Pinata/Web3.Storage** - IPFS pinning
- **Alchemy/Infura** - RPC providers

### Testing
- **Mumbai Faucet** - https://faucet.polygon.technology/
- **Near Faucet** - https://near-faucet.io/
- **Solana Faucet** - https://solfaucet.com/
- **Celo Faucet** - https://faucet.celo.org/

### Analytics
- **Dune Analytics** - On-chain data
- **Nansen** - NFT tracking
- **Moralis** - Multi-chain APIs

---

**Status:** Ready to begin testnet deployment
**Next Action:** Choose primary chains and deploy first contract
**Timeline:** 4-week testnet phase → 2-month mainnet beta → Scale

