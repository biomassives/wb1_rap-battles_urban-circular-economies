-- 003_nft_rewards.sql
-- NFT Rewards & Utility Tables for WorldBridger One
-- Supports: Reward Rules, Staking, Marketplace, Fractional Ownership

-- ============================================
-- NFT REWARD RULES
-- ============================================
CREATE TABLE IF NOT EXISTS nft_reward_rules (
  id VARCHAR(100) PRIMARY KEY,
  rule_name VARCHAR(200) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL CHECK (
    trigger_type IN ('contribution_amount', 'contribution_count', 'achievement', 'project_completion', 'data_quality', 'airdrop', 'battle_win', 'level_up', 'referral')
  ),
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  -- contribution_amount: {"min_amount": 100, "currency": "USD", "project_category": "any"}
  -- contribution_count: {"min_count": 10, "contribution_type": "data_submission"}
  -- data_quality: {"min_quality_score": 80, "min_submissions": 5}
  -- level_up: {"level": 25}
  -- battle_win: {"min_wins": 5}
  nft_collection VARCHAR(100) NOT NULL,
  -- 'contributor_badges', 'animal_spirits', 'rapper_cards', 'project_commemorative'
  rarity_tier VARCHAR(20) CHECK (rarity_tier IN ('common', 'uncommon', 'rare', 'legendary', 'mythic')),
  nft_metadata_template JSONB DEFAULT '{}',
  -- Template for NFT attributes
  max_claims INTEGER,
  -- NULL = unlimited
  current_claims INTEGER DEFAULT 0,
  xp_bonus INTEGER DEFAULT 0,
  -- Bonus XP when claimed
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_rules_trigger ON nft_reward_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_reward_rules_active ON nft_reward_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_reward_rules_collection ON nft_reward_rules(nft_collection);

-- ============================================
-- NFT REWARD CLAIMS
-- ============================================
CREATE TABLE IF NOT EXISTS nft_reward_claims (
  id SERIAL PRIMARY KEY,
  rule_id VARCHAR(100) NOT NULL REFERENCES nft_reward_rules(id),
  claimer_wallet VARCHAR(44) NOT NULL,
  nft_mint_address VARCHAR(88),
  -- Solana mint address once minted
  claim_status VARCHAR(20) DEFAULT 'pending' CHECK (
    claim_status IN ('pending', 'eligible', 'claimed', 'minting', 'minted', 'failed')
  ),
  eligibility_data JSONB DEFAULT '{}',
  -- Data that qualified them (contribution_id, score, etc.)
  xp_awarded INTEGER DEFAULT 0,
  error_message TEXT,
  claimed_at TIMESTAMP,
  minted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_rule ON nft_reward_claims(rule_id);
CREATE INDEX IF NOT EXISTS idx_claims_wallet ON nft_reward_claims(claimer_wallet);
CREATE INDEX IF NOT EXISTS idx_claims_status ON nft_reward_claims(claim_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_unique ON nft_reward_claims(rule_id, claimer_wallet)
  WHERE claim_status IN ('claimed', 'minting', 'minted');

-- ============================================
-- NFT STAKES (Using NFTs for utility)
-- ============================================
CREATE TABLE IF NOT EXISTS nft_stakes (
  id SERIAL PRIMARY KEY,
  nft_mint_address VARCHAR(88) NOT NULL,
  staker_wallet VARCHAR(44) NOT NULL,
  stake_type VARCHAR(30) NOT NULL CHECK (
    stake_type IN ('project_boost', 'user_sponsor', 'governance_lock', 'yield_farm', 'battle_entry')
  ),
  target_id VARCHAR(255),
  -- Project ID, user wallet, or pool ID being supported
  target_type VARCHAR(30),
  -- 'project', 'user', 'governance', 'pool'
  stake_amount INTEGER DEFAULT 1,
  -- For fractional stakes or multiple NFTs
  boost_multiplier DECIMAL(4, 2) DEFAULT 1.0,
  -- Calculated based on NFT rarity
  rewards_earned JSONB DEFAULT '{}',
  -- {xp: 150, tokens: 10, royalties: 0.5}
  stake_start TIMESTAMP DEFAULT NOW(),
  stake_end TIMESTAMP,
  -- NULL = indefinite
  unstake_requested_at TIMESTAMP,
  unstake_cooldown_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stakes_nft ON nft_stakes(nft_mint_address);
CREATE INDEX IF NOT EXISTS idx_stakes_staker ON nft_stakes(staker_wallet);
CREATE INDEX IF NOT EXISTS idx_stakes_type ON nft_stakes(stake_type);
CREATE INDEX IF NOT EXISTS idx_stakes_target ON nft_stakes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_stakes_active ON nft_stakes(is_active) WHERE is_active = TRUE;

-- ============================================
-- NFT MARKETPLACE LISTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS nft_listings (
  id SERIAL PRIMARY KEY,
  nft_mint_address VARCHAR(88) NOT NULL,
  seller_wallet VARCHAR(44) NOT NULL,
  price_sol DECIMAL(12, 6) NOT NULL CHECK (price_sol > 0),
  listing_type VARCHAR(20) DEFAULT 'fixed_price' CHECK (
    listing_type IN ('fixed_price', 'auction', 'offer_only')
  ),
  auction_start TIMESTAMP,
  auction_end TIMESTAMP,
  min_bid_increment DECIMAL(12, 6) DEFAULT 0.01,
  highest_bid_sol DECIMAL(12, 6),
  highest_bidder VARCHAR(44),
  reserve_price_sol DECIMAL(12, 6),
  royalty_pct DECIMAL(5, 2) DEFAULT 5.0,
  -- Creator royalty percentage
  platform_fee_pct DECIMAL(5, 2) DEFAULT 2.5,
  status VARCHAR(20) DEFAULT 'active' CHECK (
    status IN ('active', 'sold', 'cancelled', 'expired')
  ),
  escrow_address VARCHAR(88),
  -- Solana escrow account
  transaction_signature VARCHAR(88),
  buyer_wallet VARCHAR(44),
  sold_price_sol DECIMAL(12, 6),
  created_at TIMESTAMP DEFAULT NOW(),
  sold_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_listings_nft ON nft_listings(nft_mint_address);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON nft_listings(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_listings_status ON nft_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_active ON nft_listings(status, created_at DESC)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_auctions ON nft_listings(auction_end)
  WHERE listing_type = 'auction' AND status = 'active';

-- ============================================
-- NFT BIDS (for auctions)
-- ============================================
CREATE TABLE IF NOT EXISTS nft_bids (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES nft_listings(id) ON DELETE CASCADE,
  bidder_wallet VARCHAR(44) NOT NULL,
  bid_amount_sol DECIMAL(12, 6) NOT NULL,
  bid_status VARCHAR(20) DEFAULT 'active' CHECK (
    bid_status IN ('active', 'outbid', 'won', 'cancelled', 'refunded')
  ),
  escrow_signature VARCHAR(88),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bids_listing ON nft_bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON nft_bids(bidder_wallet);

-- ============================================
-- NFT TRANSFERS/GIFTS
-- ============================================
CREATE TABLE IF NOT EXISTS nft_transfers (
  id SERIAL PRIMARY KEY,
  nft_mint_address VARCHAR(88) NOT NULL,
  from_wallet VARCHAR(44) NOT NULL,
  to_wallet VARCHAR(44) NOT NULL,
  transfer_type VARCHAR(20) NOT NULL CHECK (
    transfer_type IN ('gift', 'sale', 'airdrop', 'sponsor', 'claim', 'fractional_redemption')
  ),
  transaction_signature VARCHAR(88),
  price_sol DECIMAL(12, 6),
  -- For sales
  message TEXT,
  -- For gifts/sponsorships
  xp_awarded_sender INTEGER DEFAULT 0,
  xp_awarded_receiver INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_nft ON nft_transfers(nft_mint_address);
CREATE INDEX IF NOT EXISTS idx_transfers_from ON nft_transfers(from_wallet);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON nft_transfers(to_wallet);
CREATE INDEX IF NOT EXISTS idx_transfers_type ON nft_transfers(transfer_type);

-- ============================================
-- FRACTIONAL NFT OWNERSHIP
-- ============================================
CREATE TABLE IF NOT EXISTS fractional_nfts (
  id SERIAL PRIMARY KEY,
  original_nft_mint VARCHAR(88) NOT NULL UNIQUE,
  fraction_token_mint VARCHAR(88),
  -- SPL token representing fractions
  creator_wallet VARCHAR(44) NOT NULL,
  nft_name VARCHAR(255),
  nft_image_url TEXT,
  total_fractions INTEGER NOT NULL CHECK (total_fractions >= 10 AND total_fractions <= 10000),
  fractions_available INTEGER NOT NULL,
  price_per_fraction_sol DECIMAL(12, 8),
  buyout_price_sol DECIMAL(12, 6),
  -- Price to buy all fractions and reclaim NFT
  royalty_pool_sol DECIMAL(12, 6) DEFAULT 0,
  -- Accumulated royalties to distribute
  total_royalties_distributed DECIMAL(12, 6) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (
    status IN ('pending', 'active', 'sold_out', 'bought_out', 'cancelled')
  ),
  escrow_address VARCHAR(88),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fractional_original ON fractional_nfts(original_nft_mint);
CREATE INDEX IF NOT EXISTS idx_fractional_creator ON fractional_nfts(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_fractional_status ON fractional_nfts(status);

-- ============================================
-- FRACTIONAL NFT OWNERS
-- ============================================
CREATE TABLE IF NOT EXISTS fractional_owners (
  id SERIAL PRIMARY KEY,
  fractional_nft_id INTEGER NOT NULL REFERENCES fractional_nfts(id) ON DELETE CASCADE,
  owner_wallet VARCHAR(44) NOT NULL,
  fractions_owned INTEGER NOT NULL CHECK (fractions_owned > 0),
  purchase_price_sol DECIMAL(12, 8),
  royalties_claimed DECIMAL(12, 6) DEFAULT 0,
  acquired_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(fractional_nft_id, owner_wallet)
);

CREATE INDEX IF NOT EXISTS idx_frac_owners_nft ON fractional_owners(fractional_nft_id);
CREATE INDEX IF NOT EXISTS idx_frac_owners_wallet ON fractional_owners(owner_wallet);

-- ============================================
-- DEFAULT REWARD RULES
-- ============================================
INSERT INTO nft_reward_rules (id, rule_name, description, trigger_type, trigger_conditions, nft_collection, rarity_tier, is_active) VALUES
  ('contrib_bronze', 'Bronze Contributor', 'Donate $25 or more', 'contribution_amount', '{"min_amount": 25, "currency": "USD"}', 'contributor_badges', 'common', TRUE),
  ('contrib_silver', 'Silver Contributor', 'Donate $50 or more', 'contribution_amount', '{"min_amount": 50, "currency": "USD"}', 'contributor_badges', 'uncommon', TRUE),
  ('contrib_gold', 'Gold Contributor', 'Donate $100 or more', 'contribution_amount', '{"min_amount": 100, "currency": "USD"}', 'contributor_badges', 'rare', TRUE),
  ('contrib_platinum', 'Platinum Contributor', 'Donate $500 or more', 'contribution_amount', '{"min_amount": 500, "currency": "USD"}', 'contributor_badges', 'legendary', TRUE),
  ('data_scientist', 'Data Scientist', 'Submit 10 verified observations', 'contribution_count', '{"min_count": 10, "contribution_type": "data_submission", "status": "verified"}', 'contributor_badges', 'uncommon', TRUE),
  ('quality_researcher', 'Quality Researcher', 'Maintain 80+ quality score on 5+ submissions', 'data_quality', '{"min_quality_score": 80, "min_submissions": 5}', 'contributor_badges', 'rare', TRUE),
  ('battle_champion', 'Battle Champion', 'Win 5 rap battles', 'battle_win', '{"min_wins": 5}', 'rapper_cards', 'rare', TRUE),
  ('level_25', 'Rising Star', 'Reach level 25', 'level_up', '{"level": 25}', 'animal_spirits', 'uncommon', TRUE),
  ('level_50', 'Community Leader', 'Reach level 50', 'level_up', '{"level": 50}', 'animal_spirits', 'rare', TRUE),
  ('level_100', 'Platform Legend', 'Reach level 100', 'level_up', '{"level": 100}', 'animal_spirits', 'legendary', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- NFT BENEFIT TIERS REFERENCE
-- ============================================
COMMENT ON TABLE nft_reward_rules IS
'NFT Benefit Tiers:
- Common: +5% XP boost, 1 governance vote, profile badge
- Uncommon: +10% XP boost, 2 governance votes, custom avatar border
- Rare: +15% XP boost, 5 governance votes, priority support, early access
- Legendary: +25% XP boost, 10 governance votes, revenue share, mentor badge, premium features
- Mythic: +35% XP boost, 20 governance votes, founding member benefits';
