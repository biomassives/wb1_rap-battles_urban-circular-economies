-- Hobby Farm NFT Collection - Database Schema
-- PostgreSQL Schema for Vercel Postgres

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  -- Primary Key
  id SERIAL PRIMARY KEY,
  
  -- Wallet Information (Unique)
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  
  -- Profile Information
  username VARCHAR(50),
  email VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  
  -- User Preferences
  favorite_animals JSONB DEFAULT '[]'::jsonb,
  theme_preference VARCHAR(20) DEFAULT 'meadow',
  notification_settings JSONB DEFAULT '{"email": false, "browser": false}'::jsonb,

  -- NFT Collection
  owned_nfts JSONB DEFAULT '[]'::jsonb,

  -- Gamification Fields
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT valid_wallet_address CHECK (LENGTH(wallet_address) >= 32)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wallet_address ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_username ON user_profiles(username);

-- NFT Transactions Table (Optional - for tracking mints/transfers)
CREATE TABLE IF NOT EXISTS nft_transactions (
  id SERIAL PRIMARY KEY,
  
  -- Transaction Details
  signature VARCHAR(88) UNIQUE NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- 'mint', 'transfer', 'list', 'buy'
  
  -- Wallet Addresses
  from_wallet VARCHAR(44),
  to_wallet VARCHAR(44),
  
  -- NFT Details
  nft_id INTEGER NOT NULL,
  nft_type VARCHAR(20) NOT NULL,
  nft_name VARCHAR(100),
  
  -- Financial Details
  price_sol DECIMAL(10, 4),
  
  -- Blockchain Details
  block_number BIGINT,
  slot BIGINT,
  
  -- Timestamps
  transaction_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transaction_signature ON nft_transactions(signature);
CREATE INDEX IF NOT EXISTS idx_from_wallet ON nft_transactions(from_wallet);
CREATE INDEX IF NOT EXISTS idx_to_wallet ON nft_transactions(to_wallet);
CREATE INDEX IF NOT EXISTS idx_nft_id ON nft_transactions(nft_id);
CREATE INDEX IF NOT EXISTS idx_transaction_time ON nft_transactions(transaction_time);

-- Activity Log Table (Optional - for user activity tracking)
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  
  -- User Reference
  wallet_address VARCHAR(44) NOT NULL,
  
  -- Activity Details
  activity_type VARCHAR(50) NOT NULL, -- 'profile_update', 'theme_change', 'nft_view', 'favorite_add', etc.
  activity_data JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activity log
CREATE INDEX IF NOT EXISTS idx_activity_wallet ON activity_log(wallet_address);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);

-- Collection Statistics Table (Optional - for analytics)
CREATE TABLE IF NOT EXISTS collection_stats (
  id SERIAL PRIMARY KEY,
  
  -- Statistics
  total_minted INTEGER DEFAULT 0,
  total_holders INTEGER DEFAULT 0,
  floor_price_sol DECIMAL(10, 4),
  total_volume_sol DECIMAL(20, 4) DEFAULT 0,
  
  -- Breakdown by Type
  chickens_minted INTEGER DEFAULT 0,
  cats_minted INTEGER DEFAULT 0,
  goats_minted INTEGER DEFAULT 0,
  pigeons_minted INTEGER DEFAULT 0,
  dog_minted INTEGER DEFAULT 0,
  rabbit_minted INTEGER DEFAULT 0,
  
  -- Timestamp
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial stats row
INSERT INTO collection_stats (id, total_minted, total_holders)
VALUES (1, 0, 0)
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Stores user profile information linked to Solana wallet addresses';
COMMENT ON COLUMN user_profiles.wallet_address IS 'Solana wallet public key (base58 encoded)';
COMMENT ON COLUMN user_profiles.favorite_animals IS 'Array of favorite animal types: ["chicken", "goat", etc.]';
COMMENT ON COLUMN user_profiles.owned_nfts IS 'Array of owned NFT objects with mint addresses and metadata';
COMMENT ON COLUMN user_profiles.theme_preference IS 'User preferred theme: meadow, sunset, autumn, spring, night, winter';

COMMENT ON TABLE nft_transactions IS 'Records all NFT transactions on Solana testnet';
COMMENT ON COLUMN nft_transactions.signature IS 'Solana transaction signature (base58 encoded)';

COMMENT ON TABLE activity_log IS 'Tracks user activity and interactions';

COMMENT ON TABLE collection_stats IS 'Global collection statistics and analytics';
