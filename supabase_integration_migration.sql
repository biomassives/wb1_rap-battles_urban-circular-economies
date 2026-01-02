-- ============================================
-- WORLDBRIDGE ONE - SUPABASE INTEGRATION MIGRATION
-- ============================================
-- This migration adds support for:
-- 1. Anonymous wallets
-- 2. Airdrop rewards system
-- 3. Reggae collaborations
-- 4. Environmental tech projects
-- 5. Food security/community gardens
-- 6. Mentorship system
-- 7. Achievements & events
-- 8. Enhanced progress tracking
-- ============================================

-- ============================================
-- 1. UPDATE EXISTING TABLES
-- ============================================

-- Update users table to support anonymous wallets
ALTER TABLE users
  ALTER COLUMN wallet_address TYPE VARCHAR(255), -- Allow longer anonymous wallet IDs
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS anonymous_claimed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS claimed_by_wallet VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'meadow',
  ADD COLUMN IF NOT EXISTS life_stage VARCHAR(50),
  ADD COLUMN IF NOT EXISTS animal_mentor VARCHAR(50),
  ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS achievements_unlocked JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}'::jsonb;

-- Create index for anonymous wallet lookups
CREATE INDEX IF NOT EXISTS idx_users_is_anonymous ON users(is_anonymous);
CREATE INDEX IF NOT EXISTS idx_users_claimed_by ON users(claimed_by_wallet);

-- Add comments
COMMENT ON COLUMN users.is_anonymous IS 'Whether this is an anonymous wallet (anon_XXXXX)';
COMMENT ON COLUMN users.anonymous_claimed_at IS 'When anonymous wallet was claimed by real wallet';
COMMENT ON COLUMN users.claimed_by_wallet IS 'Real wallet address that claimed this anonymous wallet';

-- ============================================
-- 2. AIRDROP SYSTEM TABLES
-- ============================================

-- Airdrop Reward Templates
CREATE TABLE IF NOT EXISTS airdrop_templates (
  id VARCHAR(100) PRIMARY KEY,
  category VARCHAR(50) NOT NULL CHECK (category IN ('artist_promotion', 'educational', 'mentorship', 'events')),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  tokens INTEGER NOT NULL,
  xp INTEGER NOT NULL,
  frequency VARCHAR(50) NOT NULL, -- 'weekly', 'bi-weekly', 'monthly', 'per event', 'one-time'
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled Airdrops
CREATE TABLE IF NOT EXISTS airdrops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(100) NOT NULL REFERENCES airdrop_templates(id),
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  bonus_multiplier NUMERIC DEFAULT 1.0,
  max_claims INTEGER,
  current_claims INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Airdrop Claims
CREATE TABLE IF NOT EXISTS airdrop_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  airdrop_id UUID NOT NULL REFERENCES airdrops(id) ON DELETE CASCADE,
  template_id VARCHAR(100) NOT NULL REFERENCES airdrop_templates(id),
  tokens_earned INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_proof JSONB,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, airdrop_id)
);

-- Indexes for airdrops
CREATE INDEX IF NOT EXISTS idx_airdrops_status ON airdrops(status);
CREATE INDEX IF NOT EXISTS idx_airdrops_dates ON airdrops(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_user ON airdrop_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_airdrop ON airdrop_claims(airdrop_id);

-- ============================================
-- 3. REGGAE COLLABORATIONS
-- ============================================

-- Collaborations Table
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_name VARCHAR(200) NOT NULL,
  description TEXT,
  style VARCHAR(50) CHECK (style IN ('roots', 'dub', 'dancehall', 'ska', 'lovers_rock', 'ragga')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'released', 'cancelled')),
  needed_roles JSONB DEFAULT '[]'::jsonb, -- ['vocals', 'bass', 'keys', 'percussion']
  current_contributors JSONB DEFAULT '[]'::jsonb,
  max_contributors INTEGER DEFAULT 10,
  target_completion_date TIMESTAMP WITH TIME ZONE,
  audio_url TEXT,
  artwork_url TEXT,
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration Contributors
CREATE TABLE IF NOT EXISTS collaboration_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'vocals', 'bass', 'keys', etc.
  contribution_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  xp_earned INTEGER DEFAULT 20,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(collaboration_id, user_id, role)
);

-- Indexes for collaborations
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON collaborations(status);
CREATE INDEX IF NOT EXISTS idx_collaborations_creator ON collaborations(creator_id);
CREATE INDEX IF NOT EXISTS idx_collab_contributors_collab ON collaboration_contributors(collaboration_id);
CREATE INDEX IF NOT EXISTS idx_collab_contributors_user ON collaboration_contributors(user_id);

-- ============================================
-- 4. ENVIRONMENTAL TECH PROJECTS
-- ============================================

-- Tech Projects Table
CREATE TABLE IF NOT EXISTS tech_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('solar', 'water', 'air_quality', 'climate', 'recycling', 'smart_city')),
  tech_stack JSONB DEFAULT '[]'::jsonb, -- ['arduino', 'python', 'react']
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('planning', 'active', 'completed', 'archived')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  github_url TEXT,
  documentation_url TEXT,
  deployment_url TEXT,
  contributors_count INTEGER DEFAULT 1,
  impact_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Contributors
CREATE TABLE IF NOT EXISTS project_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES tech_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50), -- 'frontend', 'backend', 'hardware', 'testing'
  contributions_count INTEGER DEFAULT 0,
  commits_count INTEGER DEFAULT 0,
  issues_closed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contribution_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, user_id)
);

-- Project Help Wanted
CREATE TABLE IF NOT EXISTS project_help_wanted (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES tech_projects(id) ON DELETE CASCADE,
  role_needed VARCHAR(50) NOT NULL,
  description TEXT,
  skills_required JSONB DEFAULT '[]'::jsonb,
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'urgent')),
  estimated_hours INTEGER,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'filled', 'cancelled')),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  filled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for tech projects
CREATE INDEX IF NOT EXISTS idx_tech_projects_status ON tech_projects(status);
CREATE INDEX IF NOT EXISTS idx_tech_projects_category ON tech_projects(category);
CREATE INDEX IF NOT EXISTS idx_project_contributors_project ON project_contributors(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contributors_user ON project_contributors(user_id);

-- ============================================
-- 5. FOOD SECURITY / COMMUNITY GARDENS
-- ============================================

-- Community Gardens Table
CREATE TABLE IF NOT EXISTS gardens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  location VARCHAR(200),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  total_plots INTEGER DEFAULT 0,
  available_plots INTEGER DEFAULT 0,
  participants_count INTEGER DEFAULT 0,
  growing_methods JSONB DEFAULT '[]'::jsonb, -- ['permaculture', 'organic', 'hydroponics']
  crops_grown JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('planning', 'active', 'seasonal_break', 'closed')),
  contact_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garden Participants
CREATE TABLE IF NOT EXISTS garden_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garden_id UUID NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plot_number INTEGER,
  role VARCHAR(50) DEFAULT 'member', -- 'organizer', 'member', 'volunteer'
  crops_growing JSONB DEFAULT '[]'::jsonb,
  xp_earned INTEGER DEFAULT 40,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(garden_id, user_id)
);

-- Harvest Exchange
CREATE TABLE IF NOT EXISTS harvest_exchange (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garden_id UUID REFERENCES gardens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange_type VARCHAR(20) NOT NULL CHECK (exchange_type IN ('offer', 'request')),
  item_name VARCHAR(100) NOT NULL,
  quantity VARCHAR(50),
  unit VARCHAR(20),
  description TEXT,
  location VARCHAR(200),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Garden Workshops
CREATE TABLE IF NOT EXISTS garden_workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garden_id UUID REFERENCES gardens(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  topic VARCHAR(100), -- 'composting', 'seed_saving', 'pest_management'
  format VARCHAR(20) CHECK (format IN ('in_person', 'online', 'hybrid')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  location VARCHAR(200),
  meeting_url TEXT,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  xp_reward INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for gardens
CREATE INDEX IF NOT EXISTS idx_gardens_status ON gardens(status);
CREATE INDEX IF NOT EXISTS idx_garden_participants_garden ON garden_participants(garden_id);
CREATE INDEX IF NOT EXISTS idx_garden_participants_user ON garden_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_harvest_exchange_status ON harvest_exchange(status);

-- ============================================
-- 6. MENTORSHIP SYSTEM
-- ============================================

-- Mentors Table
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  specialties JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  availability JSONB DEFAULT '{}'::jsonb,
  max_mentees INTEGER DEFAULT 5,
  current_mentees INTEGER DEFAULT 0,
  sessions_completed INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentorship Sessions
CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(50) CHECK (session_type IN ('one_on_one', 'group', 'workshop')),
  topic VARCHAR(200),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 60,
  notes TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  mentee_rating INTEGER CHECK (mentee_rating BETWEEN 1 AND 5),
  mentee_feedback TEXT,
  xp_awarded INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Mentorship Programs
CREATE TABLE IF NOT EXISTS mentorship_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  milestones JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Program Enrollments
CREATE TABLE IF NOT EXISTS program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES mentorship_programs(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES mentors(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  milestones_completed JSONB DEFAULT '[]'::jsonb,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(program_id, mentee_id)
);

-- Indexes for mentorship
CREATE INDEX IF NOT EXISTS idx_mentors_user ON mentors(user_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_mentor ON mentorship_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_mentee ON mentorship_sessions(mentee_id);

-- ============================================
-- 7. ACHIEVEMENTS SYSTEM
-- ============================================

-- Achievement Definitions
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('battles', 'music', 'tech', 'gardens', 'mentorship', 'social', 'special')),
  icon VARCHAR(50), -- emoji or icon name
  xp_reward INTEGER DEFAULT 0,
  token_reward INTEGER DEFAULT 0,
  rarity VARCHAR(20) CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_id)
);

-- Indexes for achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- ============================================
-- 8. EVENTS SYSTEM
-- ============================================

-- Platform Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) CHECK (event_type IN ('live_event', 'battle_tournament', 'hackathon', 'community_day', 'workshop', 'milestone_celebration')),
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(200),
  is_online BOOLEAN DEFAULT FALSE,
  meeting_url TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  xp_reward INTEGER,
  token_reward INTEGER,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Participants
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registration_status VARCHAR(20) DEFAULT 'registered' CHECK (registration_status IN ('registered', 'attended', 'no_show', 'cancelled')),
  check_in_at TIMESTAMP WITH TIME ZONE,
  xp_earned INTEGER DEFAULT 0,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id);

-- ============================================
-- 9. KAKUMA IMPACT TRACKING
-- ============================================

-- User Impact Metrics
CREATE TABLE IF NOT EXISTS user_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  youth_impacted INTEGER DEFAULT 0,
  total_actions INTEGER DEFAULT 0,
  value_generated NUMERIC DEFAULT 0,
  projects_supported INTEGER DEFAULT 0,
  hours_contributed NUMERIC DEFAULT 0,
  resources_shared INTEGER DEFAULT 0,
  impact_score NUMERIC DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Impact Actions
CREATE TABLE IF NOT EXISTS impact_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  description TEXT,
  impact_value NUMERIC DEFAULT 0,
  youth_impacted INTEGER DEFAULT 0,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_proof JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for impact
CREATE INDEX IF NOT EXISTS idx_impact_actions_user ON impact_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_impact_actions_type ON impact_actions(action_type);

-- ============================================
-- 10. NOTIFICATIONS SYSTEM
-- ============================================

-- User Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- ============================================
-- 11. INSERT INITIAL DATA
-- ============================================

-- Insert Airdrop Templates (25 rewards)
INSERT INTO airdrop_templates (id, category, name, description, tokens, xp, frequency, requirements) VALUES
-- Artist Promotion (7)
('artist-stream-boost', 'artist_promotion', 'Stream Boost', 'Stream featured artist tracks 10+ times', 50, 25, 'weekly', '{"min_streams": 10, "featured_only": true}'::jsonb),
('artist-share-campaign', 'artist_promotion', 'Share Campaign', 'Share artist profiles on social media', 75, 30, 'bi-weekly', '{"min_shares": 3, "tag_required": "@WorldBridgerOne"}'::jsonb),
('artist-discovery', 'artist_promotion', 'Artist Discovery', 'Discover and follow 5 new artists', 60, 20, 'monthly', '{"new_follows": 5, "listen_requirement": 1}'::jsonb),
('artist-collab-support', 'artist_promotion', 'Collab Support', 'Vote for collaborations or contribute ideas', 100, 40, 'monthly', '{"votes": 5}'::jsonb),
('artist-feedback', 'artist_promotion', 'Constructive Feedback', 'Leave detailed feedback on artist works', 80, 35, 'weekly', '{"comments": 5, "min_length": 50}'::jsonb),
('artist-playlist', 'artist_promotion', 'Playlist Creator', 'Create playlists featuring platform artists', 120, 50, 'monthly', '{"tracks": 10, "min_artists": 5}'::jsonb),
('artist-battle-spectator', 'artist_promotion', 'Battle Spectator', 'Watch and engage with rap battles', 40, 15, 'weekly', '{"battles_watched": 3, "must_vote": true}'::jsonb),

-- Educational (7)
('edu-course-complete', 'educational', 'Course Completion', 'Complete full environmental course', 200, 100, 'monthly', '{"modules": "all", "quiz_pass": true}'::jsonb),
('edu-quiz-master', 'educational', 'Quiz Master', 'Score 90%+ on course quizzes', 75, 40, 'bi-weekly', '{"quizzes": 5, "min_score": 90}'::jsonb),
('edu-project-submit', 'educational', 'Project Submission', 'Submit environmental tech project', 250, 120, 'monthly', '{"prototype": true, "documentation": true}'::jsonb),
('edu-research', 'educational', 'Research Contributor', 'Submit environmental observations', 60, 30, 'weekly', '{"observations": 10, "data_required": true}'::jsonb),
('edu-workshop-attend', 'educational', 'Workshop Attendance', 'Attend live educational workshops', 90, 45, 'per event', '{"full_attendance": true, "participation": true}'::jsonb),
('edu-peer-teacher', 'educational', 'Peer Teacher', 'Create tutorial or teach others', 180, 80, 'monthly', '{"tutorial": true, "min_learners": 5}'::jsonb),
('edu-certification', 'educational', 'Certification Earned', 'Complete certification program', 500, 250, 'one-time', '{"all_requirements": true, "exam_pass": true}'::jsonb),

-- Mentorship (6)
('mentor-session-attend', 'mentorship', 'Mentor Session', 'Attend one-on-one mentor session', 100, 50, 'weekly', '{"book_and_attend": true, "action_items": true}'::jsonb),
('mentor-become', 'mentorship', 'Become a Mentor', 'Sign up as mentor and conduct sessions', 300, 150, 'one-time', '{"min_level": 10, "training": true}'::jsonb),
('mentor-milestone', 'mentorship', 'Mentorship Milestone', 'Complete mentorship program milestones', 150, 70, 'monthly', '{"sessions": 3, "goals_achieved": true}'::jsonb),
('mentor-feedback', 'mentorship', 'Mentor Feedback', 'Provide feedback on mentor sessions', 30, 10, 'per session', '{"feedback_form": true, "detailed": true}'::jsonb),
('mentor-peer-group', 'mentorship', 'Peer Group Session', 'Participate in group mentorship', 80, 35, 'bi-weekly', '{"attend": true, "share_learnings": true}'::jsonb),
('mentor-success-story', 'mentorship', 'Success Story', 'Share your mentorship success journey', 200, 90, 'quarterly', '{"written_story": true, "evidence": true}'::jsonb),

-- Events (5)
('event-live-attend', 'events', 'Live Event Attendance', 'Attend live platform events', 120, 60, 'per event', '{"full_attendance": true, "check_in": true}'::jsonb),
('event-battle-tournament', 'events', 'Battle Event', 'Compete in battle tournament', 250, 120, 'per event', '{"enter": true, "complete_rounds": true}'::jsonb),
('event-community-day', 'events', 'Community Day', 'Participate in community day activities', 150, 70, 'monthly', '{"join_activities": true, "connections": 5}'::jsonb),
('event-hackathon', 'events', 'Hackathon', 'Build project during hackathon', 400, 200, 'per event', '{"submit_project": true, "demo": true}'::jsonb),
('event-milestone', 'events', 'Milestone Celebration', 'Celebrate platform milestones', 100, 50, 'per milestone', '{"participate": true, "share_social": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Achievements
INSERT INTO achievements (id, name, description, category, icon, xp_reward, token_reward, rarity, requirements) VALUES
('first-steps', 'First Steps', 'Created your profile and connected wallet', 'social', '👋', 10, 0, 'common', '{"profile_created": true}'::jsonb),
('battle-rookie', 'Battle Rookie', 'Completed your first rap battle', 'battles', '⚔️', 50, 25, 'common', '{"battles_completed": 1}'::jsonb),
('battle-veteran', 'Battle Veteran', 'Won 10 rap battles', 'battles', '🏆', 200, 100, 'rare', '{"battles_won": 10}'::jsonb),
('collab-starter', 'Collab Starter', 'Started your first collaboration', 'music', '🎵', 30, 15, 'common', '{"collaborations_started": 1}'::jsonb),
('tech-pioneer', 'Tech Pioneer', 'Created your first environmental tech project', 'tech', '💻', 50, 25, 'uncommon', '{"projects_created": 1}'::jsonb),
('green-thumb', 'Green Thumb', 'Joined a community garden', 'gardens', '🌱', 40, 20, 'common', '{"gardens_joined": 1}'::jsonb),
('mentor-of-many', 'Mentor of Many', 'Completed 25 mentorship sessions', 'mentorship', '🎓', 300, 150, 'epic', '{"sessions_completed": 25}'::jsonb),
('kakuma-champion', 'Kakuma Champion', 'Impacted 100+ youth in Kakuma', 'special', '🏕️', 500, 250, 'legendary', '{"youth_impacted": 100}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 12. CREATE VIEWS FOR EASY QUERYING
-- ============================================

-- User Progress View
CREATE OR REPLACE VIEW user_progress_view AS
SELECT
  u.id,
  u.wallet_address,
  u.username,
  u.level,
  u.xp,
  u.life_stage,
  u.animal_mentor,
  u.total_tokens,
  u.is_anonymous,
  COALESCE(b.total_battles, 0) as total_battles,
  COALESCE(b.battles_won, 0) as battles_won,
  COALESCE(c.total_collabs, 0) as total_collaborations,
  COALESCE(p.total_projects, 0) as total_projects,
  COALESCE(g.total_gardens, 0) as total_gardens,
  COALESCE(a.achievements_count, 0) as achievements_count
FROM users u
LEFT JOIN (
  SELECT
    challenger_id as user_id,
    COUNT(*) as total_battles,
    SUM(CASE WHEN winner_id = challenger_id THEN 1 ELSE 0 END) as battles_won
  FROM battles
  WHERE status = 'COMPLETED'
  GROUP BY challenger_id
) b ON u.id = b.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as total_collabs
  FROM collaboration_contributors
  GROUP BY user_id
) c ON u.id = c.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as total_projects
  FROM project_contributors
  GROUP BY user_id
) p ON u.id = p.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as total_gardens
  FROM garden_participants
  GROUP BY user_id
) g ON u.id = g.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as achievements_count
  FROM user_achievements
  GROUP BY user_id
) a ON u.id = a.user_id;

-- ============================================
-- 13. CREATE FUNCTIONS
-- ============================================

-- Function to calculate XP required for next level
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level_num INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Formula: XP = level^2 * 100
  RETURN (level_num * level_num * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update user level based on XP
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
BEGIN
  -- Calculate level based on XP: level = floor(sqrt(xp / 100)) + 1
  new_level := LEAST(120, FLOOR(SQRT(NEW.xp / 100.0)) + 1);

  IF new_level != NEW.level THEN
    NEW.level := new_level;

    -- Update life stage and animal mentor based on level
    NEW.life_stage := CASE
      WHEN new_level BETWEEN 1 AND 20 THEN 'Egg'
      WHEN new_level BETWEEN 21 AND 40 THEN 'Hatchling'
      WHEN new_level BETWEEN 41 AND 60 THEN 'Youth'
      WHEN new_level BETWEEN 61 AND 80 THEN 'Adult'
      WHEN new_level BETWEEN 81 AND 100 THEN 'Elder'
      ELSE 'Legend'
    END;

    NEW.animal_mentor := CASE
      WHEN new_level BETWEEN 1 AND 20 THEN 'chicken'
      WHEN new_level BETWEEN 21 AND 40 THEN 'cat'
      WHEN new_level BETWEEN 41 AND 60 THEN 'goat'
      WHEN new_level BETWEEN 61 AND 80 THEN 'pigeon'
      WHEN new_level BETWEEN 81 AND 100 THEN 'dog'
      ELSE 'rabbit'
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update level when XP changes
DROP TRIGGER IF EXISTS update_level_on_xp_change ON users;
CREATE TRIGGER update_level_on_xp_change
  BEFORE UPDATE OF xp ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- Function to award XP and check achievements
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_activity_type VARCHAR,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_result JSON;
BEGIN
  -- Get current level
  SELECT level INTO v_old_level FROM users WHERE id = p_user_id;

  -- Update XP (trigger will update level automatically)
  UPDATE users
  SET
    xp = xp + p_xp_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING level INTO v_new_level;

  -- Log activity
  INSERT INTO activity_log (wallet_address, activity_type, activity_data)
  SELECT wallet_address, p_activity_type,
    jsonb_build_object(
      'xp_awarded', p_xp_amount,
      'description', p_description,
      'old_level', v_old_level,
      'new_level', v_new_level
    )
  FROM users WHERE id = p_user_id;

  -- Build result
  v_result := json_build_object(
    'success', true,
    'xp_awarded', p_xp_amount,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'leveled_up', v_new_level > v_old_level
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Note: Uncomment these when you have authentication set up

-- Enable RLS on user tables
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
-- CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

-- Users can read all achievements but only insert their own
-- CREATE POLICY achievements_select_all ON user_achievements FOR SELECT USING (true);
-- CREATE POLICY achievements_insert_own ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own notifications
-- CREATE POLICY notifications_select_own ON notifications FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- Next steps:
-- 1. Review and run this migration in your Supabase SQL editor
-- 2. Verify tables created successfully
-- 3. Test with sample data
-- 4. Enable RLS policies when auth is ready
-- 5. Create API endpoints to interact with new tables
-- ============================================
