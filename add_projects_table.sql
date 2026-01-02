-- Add projects table to support generic project tracking
-- Works for Kakuma and other WorldBridge One initiatives

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(255) PRIMARY KEY,
  initiative VARCHAR(100) NOT NULL,  -- 'kakuma', 'general', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,  -- 'education', 'agriculture', 'energy', 'water', 'music', etc.
  status VARCHAR(50) DEFAULT 'active',  -- 'active', 'completed', 'paused', 'cancelled'
  location VARCHAR(255),
  target_beneficiaries INTEGER,
  current_beneficiaries INTEGER DEFAULT 0,
  funding_goal DECIMAL(10, 2),
  funding_raised DECIMAL(10, 2) DEFAULT 0,
  nft_floor_price DECIMAL(10, 4) DEFAULT 0,  -- Floor price in SOL
  nft_volume_24h DECIMAL(10, 2) DEFAULT 0,  -- 24h trading volume in SOL
  nft_total_minted INTEGER DEFAULT 0,  -- Total NFTs minted for this project
  start_date DATE,
  end_date DATE,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_projects_initiative ON projects(initiative);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Insert sample Kakuma projects with NFT data
INSERT INTO projects (
  id,
  initiative,
  title,
  description,
  category,
  status,
  location,
  target_beneficiaries,
  current_beneficiaries,
  funding_goal,
  funding_raised,
  nft_floor_price,
  nft_volume_24h,
  nft_total_minted,
  start_date,
  end_date,
  image_url
) VALUES
  (
    'kakuma-garden-1',
    'kakuma',
    'Permaculture Garden Initiative',
    'Establishing sustainable food gardens in Kakuma 1 and 2 to improve nutrition and teach permaculture skills to youth',
    'agriculture',
    'active',
    'Kakuma 1 & 2',
    200,
    87,
    10000.00,
    6500.00,
    1.2500,
    45.30,
    87,
    '2024-01-15',
    '2025-04-15',
    '/images/kakuma-garden.jpg'
  ),
  (
    'kakuma-solar-1',
    'kakuma',
    'Solar Panel Training Program',
    'Teaching youth to install and maintain solar power systems, creating income opportunities in clean energy',
    'energy',
    'active',
    'Kakuma 3',
    150,
    120,
    15000.00,
    12300.00,
    2.8750,
    78.50,
    120,
    '2024-02-01',
    '2025-06-30',
    '/images/kakuma-solar.jpg'
  ),
  (
    'kakuma-music-1',
    'kakuma',
    'Music Production Academy',
    'Equipping youth with music production skills, recording equipment, and online income opportunities',
    'music',
    'active',
    'Kakuma 1',
    100,
    65,
    20000.00,
    8500.00,
    3.4500,
    125.80,
    65,
    '2024-03-01',
    '2025-12-31',
    '/images/kakuma-music.jpg'
  ),
  (
    'kakuma-water-1',
    'kakuma',
    'Clean Water Access Initiative',
    'Installing water filtration systems and teaching maintenance skills to ensure clean drinking water',
    'water',
    'active',
    'Kakuma 2',
    300,
    180,
    25000.00,
    15000.00,
    1.8900,
    92.40,
    180,
    '2024-01-01',
    '2025-03-31',
    '/images/kakuma-water.jpg'
  ),
  (
    'kakuma-tech-1',
    'kakuma',
    'Coding & Tech Skills Bootcamp',
    'Teaching web development, app building, and freelancing skills to create remote work opportunities',
    'education',
    'active',
    'Kakuma 1 & 3',
    80,
    45,
    18000.00,
    7200.00,
    4.1200,
    156.70,
    45,
    '2024-04-01',
    '2025-09-30',
    '/images/kakuma-tech.jpg'
  )
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE projects IS 'Generic projects table supporting Kakuma and other WorldBridge One initiatives';
COMMENT ON COLUMN projects.initiative IS 'Which WorldBridge One initiative this project belongs to';
COMMENT ON COLUMN projects.category IS 'Project category for filtering and organization';
COMMENT ON COLUMN projects.funding_raised IS 'Amount raised so far - updated when donations are made';
