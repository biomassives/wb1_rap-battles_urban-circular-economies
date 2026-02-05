-- 005_governance.sql
-- DAO Governance Tables for WorldBridger One
-- Supports: Voting Power, Proposals, Delegation

-- ============================================
-- GOVERNANCE TOKENS / VOTING POWER
-- ============================================
CREATE TABLE IF NOT EXISTS governance_tokens (
  wallet_address VARCHAR(44) PRIMARY KEY,

  -- Base Voting Power (calculated from various sources)
  base_voting_power DECIMAL(18, 8) DEFAULT 0,

  -- Breakdown of voting power sources
  nft_voting_power DECIMAL(18, 8) DEFAULT 0,
  -- From NFT holdings (rarity-weighted)
  contribution_voting_power DECIMAL(18, 8) DEFAULT 0,
  -- From total contributions
  stake_voting_power DECIMAL(18, 8) DEFAULT 0,
  -- From staked NFTs
  level_voting_power DECIMAL(18, 8) DEFAULT 0,
  -- From user level

  -- Delegation
  delegated_to VARCHAR(44),
  -- Wallet receiving delegated votes
  delegation_pct DECIMAL(5, 2) DEFAULT 100,
  -- Percentage delegated (0-100)
  delegations_received DECIMAL(18, 8) DEFAULT 0,
  -- Total votes delegated to this user

  -- Effective voting power (base + delegations - delegated_out)
  effective_voting_power DECIMAL(18, 8) DEFAULT 0,

  -- Activity tracking
  proposals_created INTEGER DEFAULT 0,
  proposals_voted INTEGER DEFAULT 0,
  last_vote_at TIMESTAMP,
  last_proposal_at TIMESTAMP,

  -- Reputation (affects proposal weight)
  governance_reputation DECIMAL(8, 4) DEFAULT 100,
  -- Starts at 100, can go up/down

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gov_tokens_power ON governance_tokens(effective_voting_power DESC);
CREATE INDEX IF NOT EXISTS idx_gov_tokens_delegated ON governance_tokens(delegated_to)
  WHERE delegated_to IS NOT NULL;

-- ============================================
-- GOVERNANCE PROPOSALS
-- ============================================
CREATE TABLE IF NOT EXISTS governance_proposals (
  id SERIAL PRIMARY KEY,
  proposal_number INTEGER UNIQUE,
  -- Human-readable proposal number (WB-001, WB-002)
  proposer_wallet VARCHAR(44) NOT NULL,

  -- Proposal Type
  proposal_type VARCHAR(50) NOT NULL CHECK (
    proposal_type IN ('funding', 'policy', 'parameter', 'feature', 'grant', 'emergency', 'community')
  ),

  -- Content
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  -- Short summary for lists
  description TEXT NOT NULL,
  -- Full proposal with markdown
  discussion_url TEXT,
  -- Link to forum discussion

  -- For funding proposals
  funding_amount DECIMAL(12, 2),
  funding_currency VARCHAR(10),
  funding_recipient VARCHAR(44),

  -- Execution
  execution_payload JSONB,
  -- What happens if passed {action: "...", params: {...}}
  execution_delay_hours INTEGER DEFAULT 48,

  -- Voting Parameters
  required_quorum_pct DECIMAL(5, 2) DEFAULT 10.00,
  -- Percentage of total voting power needed
  required_majority_pct DECIMAL(5, 2) DEFAULT 50.00,
  -- Percentage yes votes needed to pass

  -- Voting Period
  voting_starts TIMESTAMP,
  voting_ends TIMESTAMP,
  voting_duration_days INTEGER DEFAULT 7,

  -- Vote Counts
  votes_for DECIMAL(18, 8) DEFAULT 0,
  votes_against DECIMAL(18, 8) DEFAULT 0,
  votes_abstain DECIMAL(18, 8) DEFAULT 0,
  total_voters INTEGER DEFAULT 0,
  total_voting_power_cast DECIMAL(18, 8) DEFAULT 0,

  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending', 'active', 'passed', 'rejected', 'executed', 'cancelled', 'vetoed')
  ),

  -- Outcome
  quorum_reached BOOLEAN DEFAULT FALSE,
  passed BOOLEAN,
  pass_margin DECIMAL(8, 4),
  -- (votes_for - votes_against) / total

  -- Execution Status
  executed_at TIMESTAMP,
  execution_tx_signature VARCHAR(88),
  execution_result JSONB,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_proposer ON governance_proposals(proposer_wallet);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON governance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_type ON governance_proposals(proposal_type);
CREATE INDEX IF NOT EXISTS idx_proposals_active ON governance_proposals(voting_ends)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_proposals_number ON governance_proposals(proposal_number);

-- Sequence for proposal numbers
CREATE SEQUENCE IF NOT EXISTS proposal_number_seq START 1;

-- ============================================
-- GOVERNANCE VOTES
-- ============================================
CREATE TABLE IF NOT EXISTS governance_votes (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER NOT NULL REFERENCES governance_proposals(id) ON DELETE CASCADE,
  voter_wallet VARCHAR(44) NOT NULL,

  -- Vote
  vote_choice VARCHAR(10) NOT NULL CHECK (vote_choice IN ('for', 'against', 'abstain')),
  voting_power_used DECIMAL(18, 8) NOT NULL,

  -- Optional reasoning (public)
  reason TEXT,

  -- Was this a delegated vote?
  is_delegated BOOLEAN DEFAULT FALSE,
  delegated_from VARCHAR(44),

  -- Metadata
  ip_hash VARCHAR(64),
  -- Hashed IP for sybil detection

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(proposal_id, voter_wallet)
);

CREATE INDEX IF NOT EXISTS idx_votes_proposal ON governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON governance_votes(voter_wallet);
CREATE INDEX IF NOT EXISTS idx_votes_choice ON governance_votes(proposal_id, vote_choice);

-- ============================================
-- VOTE DELEGATION
-- ============================================
CREATE TABLE IF NOT EXISTS vote_delegations (
  id SERIAL PRIMARY KEY,
  delegator_wallet VARCHAR(44) NOT NULL,
  delegate_wallet VARCHAR(44) NOT NULL,
  delegation_pct DECIMAL(5, 2) NOT NULL DEFAULT 100 CHECK (
    delegation_pct > 0 AND delegation_pct <= 100
  ),
  -- Can do partial delegation
  delegation_scope VARCHAR(50) DEFAULT 'all' CHECK (
    delegation_scope IN ('all', 'funding', 'policy', 'parameter', 'feature')
  ),
  -- Can delegate for specific proposal types
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,

  UNIQUE(delegator_wallet, delegate_wallet, delegation_scope)
);

CREATE INDEX IF NOT EXISTS idx_delegations_delegator ON vote_delegations(delegator_wallet);
CREATE INDEX IF NOT EXISTS idx_delegations_delegate ON vote_delegations(delegate_wallet);
CREATE INDEX IF NOT EXISTS idx_delegations_active ON vote_delegations(is_active) WHERE is_active = TRUE;

-- ============================================
-- GOVERNANCE ACTIONS LOG
-- ============================================
CREATE TABLE IF NOT EXISTS governance_actions (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(50) NOT NULL,
  -- 'proposal_created', 'vote_cast', 'proposal_executed', 'delegation_changed'
  wallet_address VARCHAR(44) NOT NULL,
  proposal_id INTEGER REFERENCES governance_proposals(id),
  action_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gov_actions_wallet ON governance_actions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_gov_actions_proposal ON governance_actions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_gov_actions_type ON governance_actions(action_type);

-- ============================================
-- VOTING POWER CALCULATION WEIGHTS
-- ============================================
CREATE TABLE IF NOT EXISTS voting_power_weights (
  id VARCHAR(100) PRIMARY KEY,
  source_type VARCHAR(50) NOT NULL,
  -- 'nft_common', 'nft_rare', 'contribution_usd', 'level', 'stake_days'
  weight DECIMAL(10, 4) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO voting_power_weights (id, source_type, weight, description, is_active) VALUES
  ('nft_common', 'nft', 1, 'Common NFT grants 1 voting power', TRUE),
  ('nft_uncommon', 'nft', 2, 'Uncommon NFT grants 2 voting power', TRUE),
  ('nft_rare', 'nft', 5, 'Rare NFT grants 5 voting power', TRUE),
  ('nft_legendary', 'nft', 10, 'Legendary NFT grants 10 voting power', TRUE),
  ('nft_mythic', 'nft', 20, 'Mythic NFT grants 20 voting power', TRUE),
  ('contribution_100', 'contribution', 0.01, '$100 contribution = 1 voting power', TRUE),
  ('level_10', 'level', 0.1, 'Level 10 = 1 voting power', TRUE),
  ('stake_day', 'stake', 0.01, 'Each day staked = 0.01 voting power', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- HELPER FUNCTION: Calculate Voting Power
-- ============================================
-- Note: This is a reference SQL function. Actual implementation in application code
-- due to Nile DB function limitations.

COMMENT ON TABLE governance_tokens IS
'Voting Power Calculation:
1. NFT Power = SUM(nft_rarity_weight * count)
   - Common: 1, Uncommon: 2, Rare: 5, Legendary: 10, Mythic: 20
2. Contribution Power = total_contributions_usd / 100
3. Level Power = user_level / 10
4. Stake Power = total_stake_days * 0.01

Effective Power = Base Power + Delegations Received - (Delegated Out * delegation_pct)

Proposal Requirements:
- Quorum: 10% of total voting power must participate
- Majority: 50% of votes must be "for"
- Execution Delay: 48 hours after passing';

-- ============================================
-- GOVERNANCE PARAMETERS (Configurable)
-- ============================================
CREATE TABLE IF NOT EXISTS governance_parameters (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by VARCHAR(44),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO governance_parameters (key, value, description) VALUES
  ('min_proposal_power', '{"value": 100}', 'Minimum voting power to create proposal'),
  ('default_voting_days', '{"value": 7}', 'Default voting period in days'),
  ('execution_delay_hours', '{"value": 48}', 'Delay between passing and execution'),
  ('quorum_percentage', '{"value": 10}', 'Percentage of total power needed for quorum'),
  ('majority_percentage', '{"value": 50}', 'Percentage needed to pass'),
  ('max_active_proposals', '{"value": 10}', 'Maximum concurrent active proposals'),
  ('proposal_cooldown_days', '{"value": 7}', 'Days between proposals from same wallet')
ON CONFLICT (key) DO NOTHING;
