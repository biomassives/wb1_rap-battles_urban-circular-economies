-- 004_payout_system.sql
-- Cash Out & Payout System Tables for WorldBridger One
-- Supports: Mobile Money, Crypto, Gift Cards

-- ============================================
-- USER PAYOUT SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS user_payout_settings (
  wallet_address VARCHAR(44) PRIMARY KEY,
  preferred_method VARCHAR(30) CHECK (
    preferred_method IN ('mobile_money', 'crypto', 'gift_card', 'bank_transfer')
  ),
  -- Mobile Money Settings
  mobile_money_provider VARCHAR(30),
  -- 'mpesa', 'airtel_money', 'mtn_momo', 'chipper_cash', 'flutterwave'
  mobile_money_phone VARCHAR(20),
  mobile_money_name VARCHAR(100),
  mobile_money_country VARCHAR(3),
  -- ISO 3166-1 alpha-3 (KEN, UGA, TZA, etc.)

  -- Crypto Settings
  crypto_wallet_address VARCHAR(255),
  crypto_network VARCHAR(30) DEFAULT 'solana',
  -- 'solana', 'polygon', 'ethereum', 'near'
  crypto_token VARCHAR(20) DEFAULT 'SOL',
  -- 'SOL', 'USDC', 'USDT'

  -- Bank Settings (for larger payouts)
  bank_details JSONB,
  -- Encrypted: {bank_name, account_number, routing_number, swift_code}

  -- Preferences
  auto_payout_enabled BOOLEAN DEFAULT FALSE,
  auto_payout_threshold DECIMAL(10, 2) DEFAULT 100,
  -- Auto payout when balance exceeds this
  auto_payout_method VARCHAR(30),
  payout_notification_email VARCHAR(255),
  payout_notification_sms BOOLEAN DEFAULT TRUE,

  -- KYC Status
  kyc_status VARCHAR(20) DEFAULT 'none' CHECK (
    kyc_status IN ('none', 'pending', 'basic', 'verified', 'rejected', 'expired')
  ),
  kyc_level INTEGER DEFAULT 0,
  -- 0=none, 1=basic (email+phone), 2=id verified, 3=address verified
  kyc_submitted_at TIMESTAMP,
  kyc_verified_at TIMESTAMP,
  kyc_expires_at TIMESTAMP,
  daily_limit_usd DECIMAL(10, 2) DEFAULT 100,
  -- Based on KYC level
  monthly_limit_usd DECIMAL(10, 2) DEFAULT 1000,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- USER BALANCES
-- ============================================
CREATE TABLE IF NOT EXISTS user_balances (
  wallet_address VARCHAR(44) PRIMARY KEY,
  xp_balance INTEGER DEFAULT 0,
  -- Convertible XP (separate from level XP)
  usd_balance DECIMAL(12, 4) DEFAULT 0,
  -- From NFT sales, royalties, etc.
  sol_balance DECIMAL(12, 8) DEFAULT 0,
  -- Pending SOL rewards
  pending_royalties DECIMAL(12, 4) DEFAULT 0,
  lifetime_earned_usd DECIMAL(12, 4) DEFAULT 0,
  lifetime_withdrawn_usd DECIMAL(12, 4) DEFAULT 0,
  last_payout_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balances_updated ON user_balances(updated_at DESC);

-- ============================================
-- PAYOUT TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,
  payout_type VARCHAR(30) NOT NULL CHECK (
    payout_type IN ('mobile_money', 'crypto', 'gift_card', 'bank_transfer')
  ),
  -- Source
  source_balance_type VARCHAR(30) NOT NULL CHECK (
    source_balance_type IN ('xp_rewards', 'nft_sales', 'royalties', 'project_earnings', 'referral_bonus', 'mixed')
  ),
  source_amount DECIMAL(12, 4) NOT NULL,
  source_currency VARCHAR(10) NOT NULL,
  -- 'XP', 'USD', 'SOL'

  -- Conversion
  converted_amount DECIMAL(12, 4) NOT NULL,
  target_currency VARCHAR(10) NOT NULL,
  -- 'KES', 'USD', 'SOL', etc.
  exchange_rate DECIMAL(12, 6),

  -- Fees
  platform_fee DECIMAL(10, 4) DEFAULT 0,
  platform_fee_pct DECIMAL(5, 2) DEFAULT 0,
  provider_fee DECIMAL(10, 4) DEFAULT 0,
  network_fee DECIMAL(10, 4) DEFAULT 0,
  -- For crypto
  total_fees DECIMAL(10, 4) DEFAULT 0,

  -- Net Amount
  net_amount DECIMAL(12, 4) NOT NULL,

  -- Provider Details
  provider VARCHAR(50) NOT NULL,
  -- 'mpesa', 'chipper_cash', 'solana', 'bitpay', etc.
  provider_reference VARCHAR(255),
  -- Transaction ID from provider
  destination_identifier VARCHAR(255),
  -- Phone, wallet address, etc. (masked for display)

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'awaiting_confirmation', 'completed', 'failed', 'refunded', 'cancelled')
  ),
  error_code VARCHAR(50),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  processing_started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_payouts_wallet ON payouts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_type ON payouts(payout_type);
CREATE INDEX IF NOT EXISTS idx_payouts_created ON payouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_pending ON payouts(status, created_at)
  WHERE status IN ('pending', 'processing');

-- ============================================
-- GIFT CARD CATALOG
-- ============================================
CREATE TABLE IF NOT EXISTS gift_card_catalog (
  id VARCHAR(100) PRIMARY KEY,
  provider VARCHAR(100) NOT NULL,
  -- 'safaricom', 'amazon', 'google_play', 'netflix', 'airtel'
  card_name VARCHAR(200) NOT NULL,
  card_description TEXT,
  category VARCHAR(50) NOT NULL CHECK (
    category IN ('airtime', 'data', 'shopping', 'streaming', 'gaming', 'food', 'transport', 'utilities')
  ),
  available_countries JSONB DEFAULT '["KEN", "UGA", "TZA"]',
  -- ISO 3166-1 alpha-3
  denominations JSONB NOT NULL,
  -- [{value: 100, currency: "KES", cost_xp: 1000, cost_usd: 1}]
  image_url TEXT,
  terms_url TEXT,
  min_order INTEGER DEFAULT 1,
  max_order INTEGER DEFAULT 10,
  delivery_method VARCHAR(30) DEFAULT 'instant',
  -- 'instant', 'email', 'sms'
  is_active BOOLEAN DEFAULT TRUE,
  stock_available INTEGER,
  -- NULL = unlimited
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_category ON gift_card_catalog(category);
CREATE INDEX IF NOT EXISTS idx_gift_cards_active ON gift_card_catalog(is_active) WHERE is_active = TRUE;

-- ============================================
-- GIFT CARD REDEMPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS gift_card_redemptions (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,
  catalog_id VARCHAR(100) NOT NULL REFERENCES gift_card_catalog(id),
  denomination_value DECIMAL(10, 2) NOT NULL,
  denomination_currency VARCHAR(10) NOT NULL,
  cost_xp INTEGER NOT NULL,
  cost_usd DECIMAL(10, 4),

  -- Redemption Code (encrypted)
  redemption_code TEXT,
  pin_code TEXT,
  serial_number VARCHAR(100),

  -- Delivery
  delivery_method VARCHAR(30) NOT NULL,
  delivery_destination VARCHAR(255),
  -- Email or phone

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'delivered', 'failed', 'expired', 'used')
  ),
  error_message TEXT,

  -- Provider
  provider_order_id VARCHAR(255),
  provider_response JSONB,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  expires_at TIMESTAMP,
  used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redemptions_wallet ON gift_card_redemptions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_redemptions_catalog ON gift_card_redemptions(catalog_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON gift_card_redemptions(status);

-- ============================================
-- CONVERSION RATES
-- ============================================
CREATE TABLE IF NOT EXISTS conversion_rates (
  id VARCHAR(100) PRIMARY KEY,
  from_currency VARCHAR(20) NOT NULL,
  -- 'XP', 'SOL', 'USD', 'KES', etc.
  to_currency VARCHAR(20) NOT NULL,
  rate DECIMAL(12, 8) NOT NULL,
  -- 1 from_currency = rate to_currency
  min_amount DECIMAL(12, 4),
  max_amount DECIMAL(12, 4),
  fee_pct DECIMAL(5, 2) DEFAULT 0,
  fee_fixed DECIMAL(10, 4) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_until TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rates_currencies ON conversion_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_rates_active ON conversion_rates(is_active) WHERE is_active = TRUE;

-- ============================================
-- PAYOUT LIMITS BY KYC LEVEL
-- ============================================
CREATE TABLE IF NOT EXISTS payout_limits (
  kyc_level INTEGER PRIMARY KEY,
  kyc_level_name VARCHAR(50) NOT NULL,
  daily_limit_usd DECIMAL(10, 2) NOT NULL,
  monthly_limit_usd DECIMAL(10, 2) NOT NULL,
  single_transaction_limit_usd DECIMAL(10, 2) NOT NULL,
  allowed_methods TEXT[] NOT NULL,
  requirements TEXT[]
);

INSERT INTO payout_limits (kyc_level, kyc_level_name, daily_limit_usd, monthly_limit_usd, single_transaction_limit_usd, allowed_methods, requirements) VALUES
  (0, 'None', 50, 200, 25, ARRAY['gift_card'], ARRAY['wallet_connected']),
  (1, 'Basic', 100, 500, 50, ARRAY['gift_card', 'mobile_money'], ARRAY['email_verified', 'phone_verified']),
  (2, 'Verified', 500, 2500, 200, ARRAY['gift_card', 'mobile_money', 'crypto'], ARRAY['id_verified']),
  (3, 'Premium', 2500, 10000, 1000, ARRAY['gift_card', 'mobile_money', 'crypto', 'bank_transfer'], ARRAY['id_verified', 'address_verified'])
ON CONFLICT (kyc_level) DO NOTHING;

-- ============================================
-- DEFAULT CONVERSION RATES
-- ============================================
INSERT INTO conversion_rates (id, from_currency, to_currency, rate, min_amount, max_amount, fee_pct, is_active) VALUES
  ('xp_to_usd', 'XP', 'USD', 0.001, 1000, 1000000, 0, TRUE),
  -- 1000 XP = $1
  ('usd_to_kes', 'USD', 'KES', 130.00, 1, 10000, 0, TRUE),
  -- $1 = 130 KES (approximate)
  ('usd_to_ugx', 'USD', 'UGX', 3700.00, 1, 10000, 0, TRUE),
  ('sol_to_usd', 'SOL', 'USD', 250.00, 0.01, 1000, 0, TRUE),
  -- $250 per SOL (approximate)
  ('mobile_money_fee', 'TRANSACTION', 'FEE_PCT', 3.5, 0, 0, 0, TRUE),
  ('crypto_network_fee', 'SOL_TRANSFER', 'SOL', 0.000005, 0, 0, 0, TRUE)
ON CONFLICT (id) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = NOW();

-- ============================================
-- DEFAULT GIFT CARDS
-- ============================================
INSERT INTO gift_card_catalog (id, provider, card_name, category, available_countries, denominations, is_active) VALUES
  ('safaricom_airtime', 'Safaricom', 'Safaricom Airtime', 'airtime',
   '["KEN"]',
   '[{"value": 50, "currency": "KES", "cost_xp": 500}, {"value": 100, "currency": "KES", "cost_xp": 1000}, {"value": 250, "currency": "KES", "cost_xp": 2500}, {"value": 500, "currency": "KES", "cost_xp": 5000}]',
   TRUE),
  ('safaricom_data', 'Safaricom', 'Safaricom Data Bundle', 'data',
   '["KEN"]',
   '[{"value": 99, "currency": "KES", "cost_xp": 1000, "data_mb": 250}, {"value": 250, "currency": "KES", "cost_xp": 2500, "data_mb": 1000}, {"value": 500, "currency": "KES", "cost_xp": 5000, "data_mb": 3000}]',
   TRUE),
  ('airtel_airtime_ke', 'Airtel Kenya', 'Airtel Kenya Airtime', 'airtime',
   '["KEN"]',
   '[{"value": 50, "currency": "KES", "cost_xp": 500}, {"value": 100, "currency": "KES", "cost_xp": 1000}, {"value": 500, "currency": "KES", "cost_xp": 5000}]',
   TRUE),
  ('amazon_us', 'Amazon', 'Amazon Gift Card', 'shopping',
   '["USA", "GBR", "CAN"]',
   '[{"value": 10, "currency": "USD", "cost_xp": 10000}, {"value": 25, "currency": "USD", "cost_xp": 25000}, {"value": 50, "currency": "USD", "cost_xp": 50000}]',
   TRUE)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE payouts IS
'Payout System:
- Minimum thresholds: Mobile Money 500 KES (~$4), Crypto 0.1 SOL, Gift Cards 1000 XP
- Base conversion: 1000 XP = $1 USD
- NFT holder bonus: +10% on conversions
- Fees: Mobile Money 3-4%, Crypto network fees only, Gift Cards 0%
- KYC required for amounts > $100/day';
