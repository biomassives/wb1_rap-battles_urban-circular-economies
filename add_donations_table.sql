-- Add donations table to support generic donation tracking
-- Works for Kakuma and other WorldBridge One initiatives

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,  -- 'general' or specific project ID
  donor_wallet VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  recurring BOOLEAN DEFAULT FALSE,
  message TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'completed', 'failed', 'refunded'
  transaction_hash VARCHAR(255),  -- For blockchain donations
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for querying donations by project
CREATE INDEX IF NOT EXISTS idx_donations_project_id ON donations(project_id);

-- Index for querying donations by donor
CREATE INDEX IF NOT EXISTS idx_donations_donor_wallet ON donations(donor_wallet);

-- Index for querying donations by status
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);

-- Index for querying donations by date
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donations_updated_at_trigger
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_donations_updated_at();

-- Sample donation data for testing
INSERT INTO donations (project_id, donor_wallet, amount, currency, message, anonymous, status)
VALUES
  ('kakuma-garden-1', 'test_wallet_1', 50.00, 'USD', 'Keep up the great work!', false, 'completed'),
  ('kakuma-solar-1', 'test_wallet_2', 100.00, 'USD', null, true, 'completed'),
  ('general', 'test_wallet_3', 25.00, 'USD', 'Supporting all projects', false, 'completed')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE donations IS 'Tracks all donations to projects - supports Kakuma and other initiatives';
COMMENT ON COLUMN donations.project_id IS 'Project ID or "general" for general fund';
COMMENT ON COLUMN donations.donor_wallet IS 'Wallet address of donor or "anonymous"';
COMMENT ON COLUMN donations.recurring IS 'Whether this is a recurring monthly donation';
COMMENT ON COLUMN donations.transaction_hash IS 'Blockchain transaction hash for on-chain donations';
