-- 001_scientific_data.sql
-- Scientific Data Contribution Tables for WorldBridger One
-- Supports: Environmental, Health/Biometric, Community Research data

-- ============================================
-- ENVIRONMENTAL OBSERVATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS environmental_observations (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,
  observation_type VARCHAR(50) NOT NULL CHECK (
    observation_type IN ('water_quality', 'biodiversity', 'pollution', 'climate', 'soil', 'air_quality', 'wildlife', 'vegetation')
  ),
  title VARCHAR(255),
  location_name VARCHAR(255),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  data_payload JSONB NOT NULL DEFAULT '{}',
  -- Example data_payload for water_quality:
  -- {"ph": 7.2, "turbidity": "clear", "temperature_c": 24, "dissolved_oxygen": 8.5}
  media_urls JSONB DEFAULT '[]',
  -- [{type: "image", url: "...", caption: "..."}, {type: "video", url: "..."}]
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'under_review', 'verified', 'rejected', 'needs_revision')
  ),
  quality_score INTEGER DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  reviewer_wallet VARCHAR(44),
  reviewer_notes TEXT,
  xp_awarded INTEGER DEFAULT 0,
  nft_reward_claimed BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_env_obs_wallet ON environmental_observations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_env_obs_type ON environmental_observations(observation_type);
CREATE INDEX IF NOT EXISTS idx_env_obs_status ON environmental_observations(verification_status);
CREATE INDEX IF NOT EXISTS idx_env_obs_created ON environmental_observations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_env_obs_location ON environmental_observations(latitude, longitude);

-- ============================================
-- HEALTH/BIOMETRIC OBSERVATIONS (Privacy-First)
-- ============================================
CREATE TABLE IF NOT EXISTS health_observations (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,
  observation_type VARCHAR(50) NOT NULL CHECK (
    observation_type IN ('activity', 'wellness', 'nutrition', 'sleep', 'mental_health', 'vitals', 'exercise')
  ),
  data_payload JSONB NOT NULL DEFAULT '{}',
  -- Example for activity: {"steps": 8500, "active_minutes": 45, "calories_burned": 320}
  -- Example for wellness: {"mood": "good", "energy_level": 7, "stress_level": 3}
  privacy_level VARCHAR(20) DEFAULT 'private' CHECK (
    privacy_level IN ('private', 'anonymous_aggregate', 'research_consent')
  ),
  -- private: Only user can see
  -- anonymous_aggregate: Included in anonymous statistics
  -- research_consent: Can be used for research with consent
  verification_status VARCHAR(20) DEFAULT 'self_reported',
  data_source VARCHAR(50) DEFAULT 'manual',
  -- manual, wearable, app_sync
  xp_awarded INTEGER DEFAULT 0,
  recorded_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_obs_wallet ON health_observations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_health_obs_type ON health_observations(observation_type);
CREATE INDEX IF NOT EXISTS idx_health_obs_date ON health_observations(recorded_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_obs_privacy ON health_observations(privacy_level);

-- ============================================
-- COMMUNITY RESEARCH SUBMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS community_research (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,
  research_type VARCHAR(50) NOT NULL CHECK (
    research_type IN ('survey', 'interview', 'local_knowledge', 'oral_history', 'case_study', 'photo_documentation', 'mapping')
  ),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  -- For surveys: {"questions": [...], "responses": [...]}
  -- For interviews: {"transcript": "...", "summary": "...", "key_themes": [...]}
  -- For local_knowledge: {"topic": "...", "knowledge": "...", "source_type": "elder/community"}
  language VARCHAR(10) DEFAULT 'en',
  location VARCHAR(255),
  target_community VARCHAR(255),
  media_urls JSONB DEFAULT '[]',
  consent_obtained BOOLEAN DEFAULT FALSE,
  consent_details TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'under_review', 'verified', 'rejected', 'needs_revision')
  ),
  quality_score INTEGER DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  reviewer_wallet VARCHAR(44),
  reviewer_notes TEXT,
  xp_awarded INTEGER DEFAULT 0,
  nft_reward_claimed BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_wallet ON community_research(wallet_address);
CREATE INDEX IF NOT EXISTS idx_community_type ON community_research(research_type);
CREATE INDEX IF NOT EXISTS idx_community_status ON community_research(verification_status);
CREATE INDEX IF NOT EXISTS idx_community_created ON community_research(created_at DESC);

-- ============================================
-- DATA REVIEW QUEUE
-- ============================================
CREATE TABLE IF NOT EXISTS data_reviews (
  id SERIAL PRIMARY KEY,
  submission_type VARCHAR(50) NOT NULL CHECK (
    submission_type IN ('environmental', 'health', 'community')
  ),
  submission_id INTEGER NOT NULL,
  reviewer_wallet VARCHAR(44),
  review_status VARCHAR(20) DEFAULT 'pending' CHECK (
    review_status IN ('pending', 'approved', 'rejected', 'needs_revision')
  ),
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  feedback TEXT,
  review_criteria JSONB DEFAULT '{}',
  -- {"completeness": 90, "accuracy": 85, "evidence_quality": 80, "relevance": 95}
  xp_awarded_reviewer INTEGER DEFAULT 0,
  assigned_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_type ON data_reviews(submission_type, submission_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON data_reviews(reviewer_wallet);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON data_reviews(review_status);
CREATE INDEX IF NOT EXISTS idx_reviews_pending ON data_reviews(review_status) WHERE review_status = 'pending';

-- ============================================
-- REVIEWER QUALIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS data_reviewers (
  wallet_address VARCHAR(44) PRIMARY KEY,
  qualified_types TEXT[] DEFAULT '{}',
  -- ['environmental', 'community'] etc.
  reviews_completed INTEGER DEFAULT 0,
  average_quality_score NUMERIC(5, 2) DEFAULT 0,
  is_expert BOOLEAN DEFAULT FALSE,
  expertise_areas TEXT[] DEFAULT '{}',
  joined_at TIMESTAMP DEFAULT NOW(),
  last_review_at TIMESTAMP
);

-- ============================================
-- XP REWARD CONFIGURATION FOR DATA
-- ============================================
INSERT INTO conversion_rates (id, from_currency, to_currency, rate, min_amount, is_active) VALUES
  ('data_env_basic', 'OBSERVATION', 'XP', 25, 1, TRUE),
  ('data_env_detailed', 'OBSERVATION_DETAILED', 'XP', 50, 1, TRUE),
  ('data_env_verified_bonus', 'VERIFICATION', 'XP', 50, 1, TRUE),
  ('data_biodiversity', 'BIODIVERSITY_SURVEY', 'XP', 75, 1, TRUE),
  ('data_community_survey', 'COMMUNITY_SURVEY', 'XP', 50, 1, TRUE),
  ('data_local_knowledge', 'LOCAL_KNOWLEDGE', 'XP', 100, 1, TRUE),
  ('data_review', 'DATA_REVIEW', 'XP', 15, 1, TRUE)
ON CONFLICT (id) DO NOTHING;
