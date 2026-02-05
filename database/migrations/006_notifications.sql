-- 006_notifications.sql
-- Notifications System for WorldBridger One
-- Central hub for all user alerts and activity

-- ============================================
-- USER NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS user_notifications (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,

  -- Notification Type
  category VARCHAR(30) NOT NULL CHECK (
    category IN ('xp', 'nft', 'project', 'governance', 'payout', 'social', 'achievement', 'system')
  ),
  notification_type VARCHAR(50) NOT NULL,
  -- e.g., 'xp_earned', 'nft_claimable', 'proposal_vote', 'payout_complete'

  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT,
  icon VARCHAR(10) DEFAULT '📢',

  -- Action
  action_url TEXT,
  action_label VARCHAR(50),
  action_data JSONB DEFAULT '{}',

  -- Priority & Status
  priority VARCHAR(10) DEFAULT 'normal' CHECK (
    priority IN ('low', 'normal', 'high', 'urgent')
  ),
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,

  -- Grouping (for batching similar notifications)
  group_key VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON user_notifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(wallet_address, is_read)
  WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_category ON user_notifications(wallet_address, category);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON user_notifications(created_at DESC);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  wallet_address VARCHAR(44) PRIMARY KEY,

  -- Category toggles
  notify_xp BOOLEAN DEFAULT TRUE,
  notify_nft BOOLEAN DEFAULT TRUE,
  notify_project BOOLEAN DEFAULT TRUE,
  notify_governance BOOLEAN DEFAULT TRUE,
  notify_payout BOOLEAN DEFAULT TRUE,
  notify_social BOOLEAN DEFAULT TRUE,
  notify_achievement BOOLEAN DEFAULT TRUE,
  notify_system BOOLEAN DEFAULT TRUE,

  -- Delivery preferences
  show_in_app BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  email_address VARCHAR(255),
  email_frequency VARCHAR(20) DEFAULT 'instant' CHECK (
    email_frequency IN ('instant', 'daily', 'weekly', 'never')
  ),

  -- Display preferences
  group_similar BOOLEAN DEFAULT TRUE,
  auto_dismiss_read_after_days INTEGER DEFAULT 7,
  max_visible INTEGER DEFAULT 50,

  -- Quiet hours (UTC)
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOTIFICATION TEMPLATES (for consistent messaging)
-- ============================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(30) NOT NULL,
  title_template VARCHAR(255) NOT NULL,
  message_template TEXT,
  icon VARCHAR(10) DEFAULT '📢',
  default_priority VARCHAR(10) DEFAULT 'normal',
  action_url_template TEXT,
  action_label VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE
);

-- Insert default templates
INSERT INTO notification_templates (id, category, title_template, message_template, icon, default_priority, action_url_template, action_label) VALUES
  -- XP notifications
  ('xp_earned', 'xp', 'Earned {amount} XP', '{description}', '⚡', 'normal', '/profile', 'View Progress'),
  ('level_up', 'xp', 'Level Up! Now Level {level}', 'Congratulations! You''ve reached level {level}.', '🎉', 'high', '/profile', 'View Profile'),
  ('streak_bonus', 'xp', '{days}-Day Streak!', 'Keep it up! Earned {amount} bonus XP.', '🔥', 'normal', '/profile', NULL),

  -- NFT notifications
  ('nft_claimable', 'nft', 'NFT Ready to Claim', 'You''ve unlocked {nft_name}! Claim it now.', '🎁', 'high', '/profile#rewards', 'Claim NFT'),
  ('nft_received', 'nft', 'NFT Received', 'You received {nft_name} from {sender}.', '💎', 'normal', '/profile#vault', 'View NFT'),
  ('nft_sold', 'nft', 'NFT Sold!', '{nft_name} sold for {amount} SOL.', '💰', 'high', '/profile#wallet', 'View Balance'),
  ('stake_complete', 'nft', 'Stake Complete', 'Your staked NFT is ready to unstake.', '🔓', 'normal', '/profile#rewards', 'Unstake'),

  -- Project notifications
  ('contribution_received', 'project', 'New Contribution', '{contributor} contributed to {project}.', '🤝', 'normal', '/projects/{slug}', 'View Project'),
  ('proposal_approved', 'project', 'Proposal Approved', 'Your proposal "{title}" has been approved!', '✅', 'high', '/projects/{slug}', 'View Project'),
  ('milestone_reached', 'project', 'Milestone Reached', '{project} reached a milestone!', '🏆', 'normal', '/projects/{slug}', 'View Details'),
  ('impact_report', 'project', 'New Impact Report', '{project} published an impact report.', '📊', 'normal', '/projects/{slug}', 'Read Report'),

  -- Governance notifications
  ('new_proposal', 'governance', 'New Proposal', '{title} is open for voting.', '📜', 'normal', '/governance', 'Vote Now'),
  ('vote_reminder', 'governance', 'Vote Ending Soon', '{title} voting ends in {hours} hours.', '⏰', 'high', '/governance', 'Vote Now'),
  ('proposal_passed', 'governance', 'Proposal Passed', '{title} has passed!', '✅', 'normal', '/governance', 'View Details'),
  ('delegation_received', 'governance', 'Votes Delegated to You', '{delegator} delegated {amount} voting power.', '🗳️', 'normal', '/governance', 'View Power'),

  -- Payout notifications
  ('payout_complete', 'payout', 'Payout Complete', '{amount} {currency} sent successfully.', '💸', 'high', '/profile#wallet', 'View Details'),
  ('payout_failed', 'payout', 'Payout Failed', 'Your payout could not be processed.', '❌', 'urgent', '/profile#wallet', 'Retry'),
  ('gift_card_ready', 'payout', 'Gift Card Ready', 'Your {card_name} code is ready.', '🎟️', 'high', '/profile#wallet', 'View Code'),
  ('balance_threshold', 'payout', 'Balance Milestone', 'Your balance reached {amount}!', '💰', 'normal', '/profile#wallet', 'Cash Out'),

  -- Social notifications
  ('new_follower', 'social', 'New Follower', '{username} is now following you.', '👤', 'low', '/profile/{username}', 'View Profile'),
  ('mention', 'social', 'You Were Mentioned', '{username} mentioned you in {context}.', '💬', 'normal', NULL, 'View'),
  ('project_like', 'social', 'Project Liked', '{username} liked your project.', '❤️', 'low', '/projects/{slug}', 'View'),

  -- Achievement notifications
  ('achievement_unlocked', 'achievement', 'Achievement Unlocked', 'You earned "{achievement}"!', '⭐', 'normal', '/profile#achievements', 'View'),
  ('badge_earned', 'achievement', 'New Badge', 'You earned the {badge_name} badge!', '🏅', 'normal', '/profile', 'View Badge'),

  -- System notifications
  ('welcome', 'system', 'Welcome to WorldBridger One', 'Start your journey by exploring projects.', '🌍', 'normal', '/projects', 'Explore'),
  ('maintenance', 'system', 'Scheduled Maintenance', 'Platform will be down {time}.', '🔧', 'high', NULL, NULL),
  ('update', 'system', 'New Features Available', '{description}', '🆕', 'normal', NULL, 'Learn More')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ACTIVITY FEED (public activities)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_feed (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,

  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- References
  reference_type VARCHAR(30), -- 'project', 'nft', 'proposal', etc.
  reference_id VARCHAR(100),

  -- Visibility
  is_public BOOLEAN DEFAULT TRUE,

  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_wallet ON activity_feed(wallet_address);
CREATE INDEX IF NOT EXISTS idx_activity_public ON activity_feed(is_public, created_at DESC)
  WHERE is_public = TRUE;
