-- ============================================
-- Music System Database Schema
-- WorldBridger One - Purple Point Platform
-- ============================================
--
-- NileDB Compatible Version
-- - Uses user_profiles table (not users)
-- - No triggers/functions (handle in application code)
-- - COMMENT commands removed (not supported)
-- ============================================

-- ============================================
-- TRACKS TABLE
-- Stores all music tracks uploaded to the platform
-- ============================================
CREATE TABLE IF NOT EXISTS tracks (
  id SERIAL PRIMARY KEY,
  user_wallet VARCHAR(44) NOT NULL,
  title VARCHAR(200) NOT NULL,
  genre VARCHAR(50) NOT NULL,
  audio_url TEXT NOT NULL,
  cover_art_url TEXT,
  lyrics TEXT,
  description TEXT,
  duration INTEGER, -- Duration in seconds
  bpm INTEGER, -- Beats per minute
  key VARCHAR(10), -- Musical key (e.g., "C Major", "A Minor")
  is_collaboration BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'published', -- published, draft, scheduled
  scheduled_date TIMESTAMP,
  plays INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]',
  nft_mint_address VARCHAR(44), -- Solana NFT mint address if minted
  nft_metadata_uri TEXT, -- URI to NFT metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for tracks
CREATE INDEX idx_tracks_user_wallet ON tracks(user_wallet);
CREATE INDEX idx_tracks_genre ON tracks(genre);
CREATE INDEX idx_tracks_status ON tracks(status);
CREATE INDEX idx_tracks_plays ON tracks(plays DESC);
CREATE INDEX idx_tracks_likes ON tracks(likes DESC);
CREATE INDEX idx_tracks_created_at ON tracks(created_at DESC);
CREATE INDEX idx_tracks_nft_mint ON tracks(nft_mint_address);

-- ============================================
-- TRACK_COLLABORATORS TABLE
-- Tracks collaborators on tracks
-- ============================================
CREATE TABLE IF NOT EXISTS track_collaborators (
  id SERIAL PRIMARY KEY,
  track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  collaborator_wallet VARCHAR(44) NOT NULL,
  role VARCHAR(50) DEFAULT 'collaborator', -- collaborator, producer, featured, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(track_id, collaborator_wallet)
);

CREATE INDEX idx_collab_track ON track_collaborators(track_id);
CREATE INDEX idx_collab_wallet ON track_collaborators(collaborator_wallet);

-- ============================================
-- TRACK_LIKES TABLE
-- Stores who liked which tracks
-- ============================================
CREATE TABLE IF NOT EXISTS track_likes (
  track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_wallet VARCHAR(44) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (track_id, user_wallet)
);

CREATE INDEX idx_likes_track ON track_likes(track_id);
CREATE INDEX idx_likes_user ON track_likes(user_wallet);
CREATE INDEX idx_likes_created ON track_likes(created_at DESC);

-- ============================================
-- TRACK_PLAYS TABLE
-- Logs track plays for analytics and rate limiting
-- ============================================
CREATE TABLE IF NOT EXISTS track_plays (
  id SERIAL PRIMARY KEY,
  track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  listener_wallet VARCHAR(44),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_plays_track ON track_plays(track_id);
CREATE INDEX idx_plays_listener ON track_plays(listener_wallet);
CREATE INDEX idx_plays_created ON track_plays(created_at DESC);

-- ============================================
-- TRACK_COMMENTS TABLE (Optional)
-- User comments on tracks
-- ============================================
CREATE TABLE IF NOT EXISTS track_comments (
  id SERIAL PRIMARY KEY,
  track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_wallet VARCHAR(44) NOT NULL,
  comment TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES track_comments(id) ON DELETE CASCADE, -- For replies
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_track ON track_comments(track_id);
CREATE INDEX idx_comments_user ON track_comments(user_wallet);
CREATE INDEX idx_comments_created ON track_comments(created_at DESC);

-- ============================================
-- BATTLES TABLE
-- Rap battle challenges
-- ============================================
CREATE TABLE IF NOT EXISTS battles (
  id SERIAL PRIMARY KEY,
  challenger_wallet VARCHAR(44) NOT NULL,
  opponent_wallet VARCHAR(44), -- NULL if open challenge
  category VARCHAR(50) NOT NULL, -- conscious, wordplay, flow, freestyle, storytelling, battle
  rounds INTEGER DEFAULT 3,
  bars_per_round INTEGER DEFAULT 16,
  time_limit VARCHAR(10) DEFAULT '48h', -- Time to submit verse
  stake_amount INTEGER DEFAULT 0,
  stake_currency VARCHAR(10) DEFAULT 'XP', -- XP or SOL
  theme VARCHAR(200), -- Optional battle theme
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, voting, completed, cancelled
  winner_wallet VARCHAR(44),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_battles_challenger ON battles(challenger_wallet);
CREATE INDEX idx_battles_opponent ON battles(opponent_wallet);
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_category ON battles(category);
CREATE INDEX idx_battles_created ON battles(created_at DESC);

-- ============================================
-- BATTLE_SUBMISSIONS TABLE
-- Verse submissions for battles
-- ============================================
CREATE TABLE IF NOT EXISTS battle_submissions (
  id SERIAL PRIMARY KEY,
  battle_id INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  user_wallet VARCHAR(44) NOT NULL,
  round INTEGER NOT NULL,
  audio_url TEXT NOT NULL,
  lyrics TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(battle_id, user_wallet, round)
);

CREATE INDEX idx_submissions_battle ON battle_submissions(battle_id);
CREATE INDEX idx_submissions_user ON battle_submissions(user_wallet);
CREATE INDEX idx_submissions_round ON battle_submissions(battle_id, round);

-- ============================================
-- BATTLE_VOTES TABLE
-- Community votes on battle winners
-- ============================================
CREATE TABLE IF NOT EXISTS battle_votes (
  id SERIAL PRIMARY KEY,
  battle_id INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  voter_wallet VARCHAR(44) NOT NULL,
  winner_wallet VARCHAR(44) NOT NULL, -- Who they voted for
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(battle_id, voter_wallet)
);

CREATE INDEX idx_votes_battle ON battle_votes(battle_id);
CREATE INDEX idx_votes_voter ON battle_votes(voter_wallet);
CREATE INDEX idx_votes_winner ON battle_votes(winner_wallet);

-- ============================================
-- PLAYLISTS TABLE (Optional)
-- User-created playlists
-- ============================================
CREATE TABLE IF NOT EXISTS playlists (
  id SERIAL PRIMARY KEY,
  user_wallet VARCHAR(44) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_playlists_user ON playlists(user_wallet);
CREATE INDEX idx_playlists_public ON playlists(is_public);

-- ============================================
-- PLAYLIST_TRACKS TABLE (Optional)
-- Tracks in playlists
-- ============================================
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- Order in playlist
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(playlist_id, track_id)
);

CREATE INDEX idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_track ON playlist_tracks(track_id);
CREATE INDEX idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Top tracks by plays
CREATE OR REPLACE VIEW top_tracks_by_plays AS
SELECT
  t.id,
  t.title,
  t.user_wallet,
  u.username as artist_name,
  t.genre,
  t.plays,
  t.likes,
  t.created_at
FROM tracks t
LEFT JOIN user_profiles u ON t.user_wallet = u.wallet_address
WHERE t.status = 'published'
ORDER BY t.plays DESC
LIMIT 100;

-- Top tracks by likes
CREATE OR REPLACE VIEW top_tracks_by_likes AS
SELECT
  t.id,
  t.title,
  t.user_wallet,
  u.username as artist_name,
  t.genre,
  t.plays,
  t.likes,
  t.created_at
FROM tracks t
LEFT JOIN user_profiles u ON t.user_wallet = u.wallet_address
WHERE t.status = 'published'
ORDER BY t.likes DESC
LIMIT 100;

-- User track stats
CREATE OR REPLACE VIEW user_track_stats AS
SELECT
  user_wallet,
  COUNT(*) as total_tracks,
  COUNT(*) FILTER (WHERE status = 'published') as published_tracks,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_tracks,
  SUM(plays) as total_plays,
  SUM(likes) as total_likes,
  AVG(plays) as avg_plays,
  AVG(likes) as avg_likes
FROM tracks
GROUP BY user_wallet;

-- Battle stats
CREATE OR REPLACE VIEW user_battle_stats AS
SELECT
  user_wallet,
  SUM(CASE WHEN status = 'completed' AND winner_wallet = user_wallet THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN status = 'completed' AND winner_wallet != user_wallet THEN 1 ELSE 0 END) as losses,
  COUNT(*) FILTER (WHERE status IN ('pending', 'active', 'voting')) as active_battles,
  COUNT(*) as total_battles
FROM (
  SELECT challenger_wallet as user_wallet, status, winner_wallet FROM battles
  UNION ALL
  SELECT opponent_wallet as user_wallet, status, winner_wallet FROM battles WHERE opponent_wallet IS NOT NULL
) battle_participation
GROUP BY user_wallet;

-- ============================================
-- TRIGGER FUNCTIONS (Not supported by NileDB)
-- ============================================
-- NOTE: Triggers and custom functions are not supported by NileDB.
-- Handle updated_at timestamps in application code instead.
--
-- Example in API endpoints:
-- await sql`UPDATE tracks SET updated_at = NOW() WHERE id = ${id}`;
--
-- -- Update updated_at timestamp
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- -- Apply trigger to tracks
-- DROP TRIGGER IF EXISTS update_tracks_updated_at ON tracks;
-- CREATE TRIGGER update_tracks_updated_at
--   BEFORE UPDATE ON tracks
--   FOR EACH ROW
--   EXECUTE FUNCTION update_updated_at_column();
--
-- -- Apply trigger to track_comments
-- DROP TRIGGER IF EXISTS update_comments_updated_at ON track_comments;
-- CREATE TRIGGER update_comments_updated_at
--   BEFORE UPDATE ON track_comments
--   FOR EACH ROW
--   EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CHALLENGES TABLE
-- Public challenge system with invite codes
-- ============================================
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  invite_code VARCHAR(6) UNIQUE NOT NULL,
  creator_wallet VARCHAR(44) NOT NULL,

  -- Challenge details
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(30) NOT NULL DEFAULT 'rap_battle',
    -- rap_battle, beat_battle, remix_challenge, freestyle, learning_race, eco_challenge
  mode VARCHAR(20) NOT NULL DEFAULT '1v1',
    -- 1v1, group, open
  category VARCHAR(50) DEFAULT 'freestyle',

  -- Stakes
  stakes_type VARCHAR(20) DEFAULT 'xp',  -- xp, bragging, nft
  stakes_amount INTEGER DEFAULT 50,

  -- Beat config from beat playground
  beat_config JSONB,
    -- { name, type, bpm, layers: [{source, beat, volume}] }
  beat_audio_url TEXT,

  -- Participants & limits
  max_participants INTEGER DEFAULT 2,
  min_participants INTEGER DEFAULT 2,

  -- State
  status VARCHAR(20) DEFAULT 'pending',
    -- pending, accepted, in_progress, voting, completed, cancelled, expired

  -- Linked battle (when challenge spawns a database battle)
  battle_id INTEGER REFERENCES battles(id),

  -- Timing
  duration_hours INTEGER DEFAULT 72,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  voting_ends_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Visibility & moderation
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_challenges_invite_code ON challenges(invite_code);
CREATE INDEX IF NOT EXISTS idx_challenges_creator ON challenges(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(type);
CREATE INDEX IF NOT EXISTS idx_challenges_public ON challenges(is_public, status);
CREATE INDEX IF NOT EXISTS idx_challenges_created ON challenges(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_expires ON challenges(expires_at);

-- ============================================
-- CHALLENGE_PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_participants (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  wallet_address VARCHAR(44) NOT NULL,
  role VARCHAR(20) DEFAULT 'challenger',  -- creator, challenger
  status VARCHAR(20) DEFAULT 'accepted',  -- accepted, declined, left
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(challenge_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_cp_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_cp_wallet ON challenge_participants(wallet_address);

-- ============================================
-- CHALLENGE_SUBMISSIONS TABLE
-- Entries submitted by participants
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  participant_wallet VARCHAR(44) NOT NULL,
  audio_url TEXT NOT NULL,
  beat_config JSONB,
  description TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  vote_count INTEGER DEFAULT 0,
  UNIQUE(challenge_id, participant_wallet)
);

CREATE INDEX IF NOT EXISTS idx_cs_challenge ON challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_cs_participant ON challenge_submissions(participant_wallet);

-- ============================================
-- CHALLENGE_VOTES TABLE
-- Community votes on challenge submissions
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_votes (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  submission_id INTEGER NOT NULL REFERENCES challenge_submissions(id) ON DELETE CASCADE,
  voter_wallet VARCHAR(44) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(challenge_id, voter_wallet)
);

CREATE INDEX IF NOT EXISTS idx_cv_challenge ON challenge_votes(challenge_id);
CREATE INDEX IF NOT EXISTS idx_cv_voter ON challenge_votes(voter_wallet);

-- ============================================
-- ALTER BATTLES TABLE
-- Add beat config and challenge link columns
-- ============================================
ALTER TABLE battles ADD COLUMN IF NOT EXISTS beat_config JSONB;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS beat_audio_url TEXT;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS challenge_id INTEGER REFERENCES challenges(id);
ALTER TABLE battles ADD COLUMN IF NOT EXISTS title VARCHAR(200);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample genres for reference (COMMENT not supported by NileDB)
-- COMMENT ON COLUMN tracks.genre IS 'Valid genres: rap, hip-hop, reggae, dancehall, afrobeat, ska, dub, conscious, trap, boom-bap, other';
-- Valid genres: rap, hip-hop, reggae, dancehall, afrobeat, ska, dub, conscious, trap, boom-bap, other

-- ============================================
-- PERMISSIONS (Adjust for your setup)
-- ============================================

-- Grant permissions to your app user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ============================================
-- NOTES
-- ============================================

/*
 * This schema supports:
 * - Track uploads with full metadata
 * - Collaboration tracking
 * - Play/like tracking with rate limiting
 * - Rap battle system
 * - Challenge system with invite codes and public arena
 * - NFT integration (mint addresses)
 * - Comments (optional)
 * - Playlists (optional)
 *
 * To integrate with existing users table:
 * - Assumes users table exists with wallet_address, username, avatar_url
 * - Foreign key constraints reference users(wallet_address)
 *
 * Performance considerations:
 * - All tables have appropriate indexes
 * - Use EXPLAIN ANALYZE to optimize queries
 * - Consider partitioning track_plays by date for large datasets
 *
 * Next steps:
 * 1. Run this schema on your database
 * 2. Test API endpoints
 * 3. Implement file upload for audio/images
 * 4. Add search functionality (full-text search on titles/lyrics)
 */
