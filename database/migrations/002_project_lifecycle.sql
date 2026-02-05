-- 002_project_lifecycle.sql
-- Project Lifecycle Tables for WorldBridger One
-- Supports: Proposals, Contributions, Impact Reports, Equity

-- ============================================
-- PROJECT PROPOSALS
-- ============================================
CREATE TABLE IF NOT EXISTS project_proposals (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255),
  -- Links to projects table if approved
  proposer_wallet VARCHAR(44) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  -- 'environment', 'education', 'music', 'technology', 'health', 'agriculture'
  funding_goal DECIMAL(12, 2),
  funding_currency VARCHAR(10) DEFAULT 'USD',
  timeline_weeks INTEGER,
  milestones JSONB DEFAULT '[]',
  -- [{name, description, target_date, funding_allocation_pct, deliverables}]
  team_members JSONB DEFAULT '[]',
  -- [{wallet, name, role, allocation_pct, bio}]
  impact_metrics JSONB DEFAULT '{}',
  -- {beneficiaries_target, jobs_created, co2_offset, etc.}
  requirements JSONB DEFAULT '{}',
  -- {skills_needed, resources_needed, location_requirements}
  status VARCHAR(30) DEFAULT 'draft' CHECK (
    status IN ('draft', 'submitted', 'community_review', 'expert_review', 'approved', 'rejected', 'active', 'completed', 'cancelled')
  ),
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  votes_abstain INTEGER DEFAULT 0,
  total_voting_power DECIMAL(18, 8) DEFAULT 0,
  review_deadline TIMESTAMP,
  rejection_reason TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_wallet ON project_proposals(proposer_wallet);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON project_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_category ON project_proposals(category);
CREATE INDEX IF NOT EXISTS idx_proposals_review ON project_proposals(status, review_deadline)
  WHERE status IN ('community_review', 'expert_review');

-- ============================================
-- PROPOSAL VOTES
-- ============================================
CREATE TABLE IF NOT EXISTS proposal_votes (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER NOT NULL REFERENCES project_proposals(id) ON DELETE CASCADE,
  voter_wallet VARCHAR(44) NOT NULL,
  vote_choice VARCHAR(10) NOT NULL CHECK (vote_choice IN ('for', 'against', 'abstain')),
  voting_power DECIMAL(18, 8) NOT NULL DEFAULT 1,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(proposal_id, voter_wallet)
);

CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_voter ON proposal_votes(voter_wallet);

-- ============================================
-- PROJECT CONTRIBUTIONS (Unified Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS project_contributions (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  contributor_wallet VARCHAR(44) NOT NULL,
  contribution_type VARCHAR(30) NOT NULL CHECK (
    contribution_type IN ('donation', 'volunteer_time', 'data_submission', 'resource_share', 'code_commit', 'mentorship', 'equipment', 'services')
  ),
  amount DECIMAL(12, 4),
  -- Dollar amount, hours, or quantity
  currency VARCHAR(10),
  -- 'USD', 'KES', 'HOURS', 'SOL', 'UNITS'
  description TEXT,
  proof_url TEXT,
  -- Link to receipt, timesheet, commit, etc.
  proof_type VARCHAR(30),
  -- 'receipt', 'timesheet', 'commit_hash', 'photo', 'certificate'
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'verified', 'rejected', 'disputed')
  ),
  verified_by VARCHAR(44),
  equity_earned DECIMAL(8, 4) DEFAULT 0,
  -- Ownership percentage earned
  xp_awarded INTEGER DEFAULT 0,
  nft_reward_id VARCHAR(255),
  milestone_id INTEGER,
  -- Links to specific milestone if applicable
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contributions_project ON project_contributions(project_id);
CREATE INDEX IF NOT EXISTS idx_contributions_wallet ON project_contributions(contributor_wallet);
CREATE INDEX IF NOT EXISTS idx_contributions_type ON project_contributions(contribution_type);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON project_contributions(verification_status);

-- ============================================
-- PROJECT IMPACT REPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS project_impact_reports (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  reporter_wallet VARCHAR(44) NOT NULL,
  report_type VARCHAR(30) DEFAULT 'periodic' CHECK (
    report_type IN ('periodic', 'milestone', 'final', 'emergency')
  ),
  milestone_index INTEGER,
  -- Reference to milestone in project
  report_period_start DATE,
  report_period_end DATE,
  metrics_achieved JSONB NOT NULL DEFAULT '{}',
  -- {beneficiaries_reached: 150, trees_planted: 500, ...}
  metrics_target JSONB DEFAULT '{}',
  -- Original targets for comparison
  beneficiaries_reached INTEGER DEFAULT 0,
  funds_utilized DECIMAL(12, 2) DEFAULT 0,
  funds_remaining DECIMAL(12, 2) DEFAULT 0,
  narrative TEXT,
  challenges TEXT,
  lessons_learned TEXT,
  next_steps TEXT,
  media_urls JSONB DEFAULT '[]',
  supporting_documents JSONB DEFAULT '[]',
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'verified', 'rejected', 'needs_revision')
  ),
  verified_by VARCHAR(44),
  verifier_notes TEXT,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_impact_project ON project_impact_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_impact_reporter ON project_impact_reports(reporter_wallet);
CREATE INDEX IF NOT EXISTS idx_impact_type ON project_impact_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_impact_status ON project_impact_reports(verification_status);

-- ============================================
-- PROJECT EQUITY DISTRIBUTION
-- ============================================
CREATE TABLE IF NOT EXISTS project_equity (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  holder_wallet VARCHAR(44) NOT NULL,
  equity_pct DECIMAL(8, 4) NOT NULL CHECK (equity_pct >= 0 AND equity_pct <= 100),
  -- Percentage ownership (e.g., 5.5000 = 5.5%)
  source VARCHAR(50) NOT NULL CHECK (
    source IN ('founding', 'contribution', 'purchase', 'grant', 'vesting', 'transfer')
  ),
  source_reference VARCHAR(255),
  -- contribution_id, transaction_id, etc.
  vesting_start TIMESTAMP,
  vesting_cliff_months INTEGER DEFAULT 0,
  vesting_duration_months INTEGER DEFAULT 0,
  vested_pct DECIMAL(8, 4) DEFAULT 100,
  -- How much has vested (0-100%)
  is_transferable BOOLEAN DEFAULT TRUE,
  dividends_claimed DECIMAL(12, 4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, holder_wallet)
);

CREATE INDEX IF NOT EXISTS idx_equity_project ON project_equity(project_id);
CREATE INDEX IF NOT EXISTS idx_equity_holder ON project_equity(holder_wallet);
CREATE INDEX IF NOT EXISTS idx_equity_vesting ON project_equity(vesting_start)
  WHERE vesting_duration_months > 0;

-- ============================================
-- PROJECT MILESTONES
-- ============================================
CREATE TABLE IF NOT EXISTS project_milestones (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  milestone_index INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  funding_allocation_pct DECIMAL(5, 2) DEFAULT 0,
  deliverables JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'completed', 'delayed', 'cancelled')
  ),
  completed_at TIMESTAMP,
  completion_evidence JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, milestone_index)
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON project_milestones(status);

-- ============================================
-- CONTRIBUTION XP VALUES
-- ============================================
-- These are reference values, actual XP awarded in code
COMMENT ON TABLE project_contributions IS
'XP Values:
- donation: 10 XP per $1
- volunteer_time: 50 XP per hour
- data_submission: See scientific data tables
- code_commit: 25 XP per merged PR
- mentorship: 75 XP per hour
- resource_share: 10-100 XP based on value
Equity Earning:
- $100+ donation: 0.1% equity
- 10+ volunteer hours: 0.5% equity
- Core contributor: negotiated';
