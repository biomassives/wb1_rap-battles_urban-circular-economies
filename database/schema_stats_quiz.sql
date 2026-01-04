-- ============================================
-- STATS & QUIZ SYSTEM DATABASE SCHEMA
-- For Worldbridger One Platform
-- Created: January 3, 2026
-- ============================================

-- ============================================
-- USER STATS TABLES
-- ============================================

-- User Stats Summary (aggregated stats)
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,

  -- Music Studio Stats
  total_tracks INTEGER DEFAULT 0,
  tracks_this_week INTEGER DEFAULT 0,
  total_studio_time_minutes INTEGER DEFAULT 0,
  moog_plays INTEGER DEFAULT 0,
  sampler_hits INTEGER DEFAULT 0,
  loops_created INTEGER DEFAULT 0,

  -- Battle Stats
  total_battles INTEGER DEFAULT 0,
  battles_won INTEGER DEFAULT 0,
  battles_lost INTEGER DEFAULT 0,
  battles_drawn INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,
  total_badges_earned INTEGER DEFAULT 0,
  unique_badges INTEGER DEFAULT 0,

  -- Learning Stats
  courses_started INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  total_learning_time_minutes INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  quizzes_taken INTEGER DEFAULT 0,
  quiz_average_score NUMERIC(5,2) DEFAULT 0,
  certificates_earned INTEGER DEFAULT 0,
  current_learning_streak INTEGER DEFAULT 0,
  longest_learning_streak INTEGER DEFAULT 0,

  -- Community Impact Stats
  total_donated_sol NUMERIC(20,9) DEFAULT 0,
  volunteer_hours INTEGER DEFAULT 0,
  mentorship_sessions INTEGER DEFAULT 0,
  helpful_reports INTEGER DEFAULT 0,
  community_upvotes INTEGER DEFAULT 0,

  -- NFT Collection Stats
  total_nfts INTEGER DEFAULT 0,
  battle_cards INTEGER DEFAULT 0,
  total_collection_value_sol NUMERIC(20,9) DEFAULT 0,
  nfts_bought INTEGER DEFAULT 0,
  nfts_sold INTEGER DEFAULT 0,
  trading_volume_sol NUMERIC(20,9) DEFAULT 0,

  -- Engagement Metrics
  last_active TIMESTAMP DEFAULT NOW(),
  active_days_count INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,

  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Weekly Stats History (for trends)
CREATE TABLE IF NOT EXISTS user_stats_weekly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Weekly Metrics
  tracks_created INTEGER DEFAULT 0,
  battles_fought INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,

  -- Achievements This Week
  badges_earned TEXT[] DEFAULT '{}',
  level_ups INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, week_start)
);

-- Daily Activity Log (for heatmaps)
CREATE TABLE IF NOT EXISTS user_activity_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,

  -- Activity Counts
  tracks_created INTEGER DEFAULT 0,
  battles_participated INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,

  -- Activity Types
  activities JSONB DEFAULT '[]', -- Array of {type, count, timestamp}

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, activity_date)
);

-- ============================================
-- TRAINING QUIZ TABLES
-- ============================================

-- Quizzes
CREATE TABLE IF NOT EXISTS training_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 80, -- Percentage
  time_limit_minutes INTEGER DEFAULT 15,
  max_attempts_per_day INTEGER DEFAULT 3,
  cooldown_hours INTEGER DEFAULT 4,
  total_questions INTEGER DEFAULT 15,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES training_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false', 'multi_select'
  category TEXT NOT NULL, -- 'platform', 'battles', 'music', 'nft', 'community'
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  points INTEGER DEFAULT 1,
  explanation TEXT, -- Shown after answering
  order_index INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Answer Choices
CREATE TABLE IF NOT EXISTS quiz_answer_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  explanation TEXT, -- Why this answer is correct/incorrect
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES training_quizzes(id),
  user_id UUID REFERENCES users(id),
  wallet_address TEXT,

  -- Attempt Details
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  time_taken_seconds INTEGER,

  -- Scoring
  total_questions INTEGER,
  correct_answers INTEGER,
  score_percentage NUMERIC(5,2),
  passed BOOLEAN,

  -- Answers (JSON array)
  answers JSONB,

  -- Certificate
  certificate_minted BOOLEAN DEFAULT FALSE,
  certificate_nft_address TEXT,
  certificate_metadata_uri TEXT,
  certificate_number INTEGER,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Training Certificates
CREATE TABLE IF NOT EXISTS training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES quiz_attempts(id),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,

  -- Certificate Details
  certificate_number SERIAL,
  certificate_type TEXT DEFAULT 'standard', -- 'standard', 'advanced', 'perfect'
  score_percentage NUMERIC(5,2),

  -- NFT Details
  nft_mint_address TEXT UNIQUE NOT NULL,
  metadata_uri TEXT NOT NULL,
  arweave_tx_id TEXT,

  -- Visual
  svg_hash TEXT,
  cohort TEXT, -- 'Q1 2026', etc.

  -- Status
  revoked BOOLEAN DEFAULT FALSE,
  revoked_reason TEXT,
  revoked_at TIMESTAMP,

  issued_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User Stats Indexes
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_wallet ON user_stats(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_stats_updated ON user_stats(updated_at DESC);

-- Weekly Stats Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_stats_user ON user_stats_weekly(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_week ON user_stats_weekly(week_start DESC);

-- Daily Activity Indexes
CREATE INDEX IF NOT EXISTS idx_daily_activity_user ON user_activity_daily(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON user_activity_daily(activity_date DESC);

-- Quiz Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category);
CREATE INDEX IF NOT EXISTS idx_quiz_choices_question ON quiz_answer_choices(question_id);

-- Quiz Attempts Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_wallet ON quiz_attempts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_passed ON quiz_attempts(passed);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON quiz_attempts(completed_at DESC);

-- Certificates Indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user ON training_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_wallet ON training_certificates(wallet_address);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON training_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_nft ON training_certificates(nft_mint_address);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update weekly stats
CREATE OR REPLACE FUNCTION update_weekly_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats_weekly (
    user_id,
    week_start,
    week_end,
    tracks_created,
    battles_fought,
    lessons_completed,
    xp_earned
  )
  VALUES (
    NEW.user_id,
    date_trunc('week', CURRENT_DATE),
    date_trunc('week', CURRENT_DATE) + INTERVAL '6 days',
    CASE WHEN TG_TABLE_NAME = 'tracks' THEN 1 ELSE 0 END,
    CASE WHEN TG_TABLE_NAME = 'battles' THEN 1 ELSE 0 END,
    CASE WHEN TG_TABLE_NAME = 'lessons' THEN 1 ELSE 0 END,
    NEW.xp_earned
  )
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    tracks_created = user_stats_weekly.tracks_created + EXCLUDED.tracks_created,
    battles_fought = user_stats_weekly.battles_fought + EXCLUDED.battles_fought,
    lessons_completed = user_stats_weekly.lessons_completed + EXCLUDED.lessons_completed,
    xp_earned = user_stats_weekly.xp_earned + EXCLUDED.xp_earned;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily activity
CREATE OR REPLACE FUNCTION update_daily_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_time_spent INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_activity_daily (
    user_id,
    activity_date,
    activities,
    time_spent_minutes
  )
  VALUES (
    p_user_id,
    CURRENT_DATE,
    jsonb_build_array(jsonb_build_object(
      'type', p_activity_type,
      'timestamp', NOW()
    )),
    p_time_spent
  )
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    activities = user_activity_daily.activities || jsonb_build_object(
      'type', p_activity_type,
      'timestamp', NOW()
    ),
    time_spent_minutes = user_activity_daily.time_spent_minutes + p_time_spent;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate win rate
CREATE OR REPLACE FUNCTION calculate_win_rate(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_win_rate NUMERIC;
BEGIN
  SELECT
    CASE
      WHEN (battles_won + battles_lost + battles_drawn) = 0 THEN 0
      ELSE ROUND((battles_won::NUMERIC / (battles_won + battles_lost + battles_drawn)) * 100, 2)
    END INTO v_win_rate
  FROM user_stats
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_win_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA - Default Quiz
-- ============================================

-- Insert default training quiz
INSERT INTO training_quizzes (
  id,
  title,
  description,
  passing_score,
  time_limit_minutes,
  max_attempts_per_day,
  cooldown_hours,
  total_questions,
  active
)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- Fixed UUID for easy reference
  'Worldbridger Training Quiz',
  'Test your knowledge of platform features, battle protocols, music tools, NFT systems, and community guidelines. Pass with 80% to earn your certificate NFT.',
  80,
  15,
  3,
  4,
  15,
  TRUE
)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE user_stats IS 'Aggregated user statistics across all platform activities';
COMMENT ON TABLE user_stats_weekly IS 'Weekly statistics snapshots for trend analysis';
COMMENT ON TABLE user_activity_daily IS 'Daily activity log for heatmap visualizations';
COMMENT ON TABLE training_quizzes IS 'Training quizzes for platform onboarding';
COMMENT ON TABLE quiz_questions IS 'Questions for training quizzes';
COMMENT ON TABLE quiz_answer_choices IS 'Multiple choice answers for quiz questions';
COMMENT ON TABLE quiz_attempts IS 'User attempts at quizzes';
COMMENT ON TABLE training_certificates IS 'NFT certificates issued for quiz completion';

-- ============================================
-- GRANTS (Adjust based on your role setup)
-- ============================================

-- Example: Grant permissions to your application role
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_role;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO your_app_role;
