-- ============================================
-- SUPABASE QUICK REFERENCE
-- Common queries and operations for WorldBridge One
-- ============================================

-- ============================================
-- USER MANAGEMENT
-- ============================================

-- Create new user (real wallet)
INSERT INTO users (wallet_address, username, level, xp, is_anonymous)
VALUES ('SolanaWalletAddress...', 'username', 1, 0, false)
RETURNING *;

-- Create anonymous user
INSERT INTO users (wallet_address, username, level, xp, is_anonymous)
VALUES ('anon_' || gen_random_uuid()::text, null, 1, 0, true)
RETURNING *;

-- Get user by wallet address
SELECT * FROM users WHERE wallet_address = 'wallet_address';

-- Get user's full progress
SELECT * FROM user_progress_view WHERE wallet_address = 'wallet_address';

-- Award XP to user
SELECT award_xp(
  (SELECT id FROM users WHERE wallet_address = 'wallet_address'),
  100,  -- XP amount
  'activity_type',
  'Description of activity'
);

-- Claim anonymous wallet
UPDATE users
SET
  is_anonymous = false,
  claimed_by_wallet = 'real_wallet_address',
  anonymous_claimed_at = NOW()
WHERE wallet_address = 'anon_xxxxx'
RETURNING *;

-- ============================================
-- AIRDROPS
-- ============================================

-- Get all active airdrops
SELECT
  a.id,
  a.start_date,
  a.end_date,
  a.bonus_multiplier,
  t.name,
  t.description,
  t.tokens,
  t.xp,
  t.category,
  t.frequency,
  t.requirements
FROM airdrops a
JOIN airdrop_templates t ON a.template_id = t.id
WHERE a.status = 'active'
  AND a.start_date <= NOW()
  AND a.end_date >= NOW()
ORDER BY a.end_date ASC;

-- Create new airdrop from template
INSERT INTO airdrops (template_id, status, start_date, end_date, max_claims)
VALUES (
  'artist-stream-boost',
  'active',
  NOW(),
  NOW() + INTERVAL '7 days',
  1000
)
RETURNING *;

-- Claim airdrop
INSERT INTO airdrop_claims (
  user_id,
  airdrop_id,
  template_id,
  tokens_earned,
  xp_earned,
  verification_proof
)
SELECT
  u.id,
  'airdrop_uuid',
  a.template_id,
  t.tokens,
  t.xp,
  '{"proof_type": "completed"}'::jsonb
FROM users u
CROSS JOIN airdrops a
JOIN airdrop_templates t ON a.template_id = t.id
WHERE u.wallet_address = 'wallet_address'
  AND a.id = 'airdrop_uuid'
ON CONFLICT (user_id, airdrop_id) DO NOTHING
RETURNING *;

-- Get user's claimed airdrops
SELECT
  ac.claimed_at,
  t.name,
  t.category,
  ac.tokens_earned,
  ac.xp_earned,
  ac.verification_status
FROM airdrop_claims ac
JOIN airdrop_templates t ON ac.template_id = t.id
JOIN users u ON ac.user_id = u.id
WHERE u.wallet_address = 'wallet_address'
ORDER BY ac.claimed_at DESC;

-- Get user's total airdrop earnings
SELECT
  u.wallet_address,
  COUNT(*) as total_claims,
  SUM(ac.tokens_earned) as total_tokens,
  SUM(ac.xp_earned) as total_xp
FROM airdrop_claims ac
JOIN users u ON ac.user_id = u.id
WHERE u.wallet_address = 'wallet_address'
GROUP BY u.wallet_address;

-- ============================================
-- BATTLES
-- ============================================

-- Get open battles
SELECT
  b.id,
  b.category,
  b.total_rounds,
  b.stake_amount,
  u.username as challenger_username,
  u.wallet_address as challenger_wallet
FROM battles b
JOIN users u ON b.challenger_id = u.id
WHERE b.status = 'OPEN'
ORDER BY b.created_at DESC;

-- Get user's battle stats
SELECT
  u.wallet_address,
  COUNT(*) as total_battles,
  SUM(CASE WHEN b.winner_id = u.id THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN b.winner_id != u.id AND b.winner_id IS NOT NULL THEN 1 ELSE 0 END) as losses,
  AVG(b.winning_score) as avg_score
FROM battles b
JOIN users u ON (b.challenger_id = u.id OR b.opponent_id = u.id)
WHERE b.status = 'COMPLETED'
  AND u.wallet_address = 'wallet_address'
GROUP BY u.wallet_address;

-- ============================================
-- COLLABORATIONS
-- ============================================

-- Get open collaborations
SELECT
  c.id,
  c.track_name,
  c.description,
  c.style,
  c.needed_roles,
  u.username as creator,
  (c.max_contributors - jsonb_array_length(c.current_contributors)) as open_spots
FROM collaborations c
JOIN users u ON c.creator_id = u.id
WHERE c.status = 'open'
  AND jsonb_array_length(c.current_contributors) < c.max_contributors
ORDER BY c.created_at DESC;

-- Create collaboration
INSERT INTO collaborations (
  creator_id,
  track_name,
  description,
  style,
  needed_roles,
  max_contributors
)
SELECT
  id,
  'Track Name',
  'Track description',
  'roots',
  '["bass", "keys", "percussion"]'::jsonb,
  10
FROM users
WHERE wallet_address = 'wallet_address'
RETURNING *;

-- Join collaboration
INSERT INTO collaboration_contributors (
  collaboration_id,
  user_id,
  role,
  status
)
SELECT
  'collaboration_uuid',
  id,
  'bass',
  'pending'
FROM users
WHERE wallet_address = 'wallet_address'
RETURNING *;

-- Get user's collaborations
SELECT
  c.track_name,
  c.style,
  c.status,
  cc.role,
  cc.joined_at,
  cc.xp_earned
FROM collaboration_contributors cc
JOIN collaborations c ON cc.collaboration_id = c.id
JOIN users u ON cc.user_id = u.id
WHERE u.wallet_address = 'wallet_address'
ORDER BY cc.joined_at DESC;

-- ============================================
-- TECH PROJECTS
-- ============================================

-- Get active tech projects
SELECT
  p.id,
  p.name,
  p.description,
  p.category,
  p.tech_stack,
  p.progress_percentage,
  p.contributors_count,
  u.username as creator
FROM tech_projects p
JOIN users u ON p.creator_id = u.id
WHERE p.status = 'active'
ORDER BY p.created_at DESC;

-- Create tech project
INSERT INTO tech_projects (
  creator_id,
  name,
  description,
  category,
  tech_stack,
  github_url
)
SELECT
  id,
  'Solar Tracker IoT',
  'IoT system for tracking solar panel efficiency',
  'solar',
  '["arduino", "python", "mqtt"]'::jsonb,
  'https://github.com/username/project'
FROM users
WHERE wallet_address = 'wallet_address'
RETURNING *;

-- Join tech project
INSERT INTO project_contributors (
  project_id,
  user_id,
  role
)
SELECT
  'project_uuid',
  id,
  'frontend'
FROM users
WHERE wallet_address = 'wallet_address'
RETURNING *;

-- Get projects needing help
SELECT
  h.id,
  h.role_needed,
  h.description,
  h.urgency,
  p.name as project_name,
  p.category
FROM project_help_wanted h
JOIN tech_projects p ON h.project_id = p.id
WHERE h.status = 'open'
ORDER BY
  CASE h.urgency
    WHEN 'urgent' THEN 1
    WHEN 'normal' THEN 2
    WHEN 'low' THEN 3
  END,
  h.created_at DESC;

-- ============================================
-- GARDENS
-- ============================================

-- Get active gardens
SELECT
  g.id,
  g.name,
  g.location,
  g.total_plots,
  g.available_plots,
  g.participants_count,
  g.growing_methods,
  u.username as creator
FROM gardens g
JOIN users u ON g.creator_id = u.id
WHERE g.status = 'active'
  AND g.available_plots > 0
ORDER BY g.created_at DESC;

-- Create garden
INSERT INTO gardens (
  creator_id,
  name,
  description,
  location,
  total_plots,
  available_plots,
  growing_methods
)
SELECT
  id,
  'Community Victory Garden',
  'Organic community garden for local food production',
  'Kakuma Refugee Camp, Block 3',
  50,
  50,
  '["organic", "permaculture"]'::jsonb
FROM users
WHERE wallet_address = 'wallet_address'
RETURNING *;

-- Join garden
INSERT INTO garden_participants (
  garden_id,
  user_id,
  plot_number,
  role
)
SELECT
  'garden_uuid',
  id,
  1,
  'member'
FROM users
WHERE wallet_address = 'wallet_address'
RETURNING *;

-- Get upcoming workshops
SELECT
  w.title,
  w.topic,
  w.scheduled_at,
  w.duration_minutes,
  w.max_participants - w.current_participants as spots_available,
  g.name as garden_name
FROM garden_workshops w
LEFT JOIN gardens g ON w.garden_id = g.id
WHERE w.status = 'upcoming'
  AND w.scheduled_at > NOW()
ORDER BY w.scheduled_at ASC;

-- ============================================
-- MENTORSHIP
-- ============================================

-- Get active mentors
SELECT
  m.id,
  u.username,
  m.specialties,
  m.max_mentees - m.current_mentees as available_spots,
  m.sessions_completed,
  m.rating
FROM mentors m
JOIN users u ON m.user_id = u.id
WHERE m.is_active = true
  AND m.current_mentees < m.max_mentees
ORDER BY m.rating DESC, m.sessions_completed DESC;

-- Become a mentor
INSERT INTO mentors (
  user_id,
  specialties,
  bio,
  max_mentees
)
SELECT
  id,
  '["music production", "environmental tech"]'::jsonb,
  'Experienced producer and tech developer',
  5
FROM users
WHERE wallet_address = 'wallet_address'
  AND level >= 10  -- Must be level 10+
RETURNING *;

-- Schedule mentorship session
INSERT INTO mentorship_sessions (
  mentor_id,
  mentee_id,
  session_type,
  topic,
  scheduled_at,
  duration_minutes
)
SELECT
  'mentor_uuid',
  id,
  'one_on_one',
  'Music production basics',
  '2025-02-01 14:00:00',
  60
FROM users
WHERE wallet_address = 'wallet_address'
RETURNING *;

-- ============================================
-- ACHIEVEMENTS
-- ============================================

-- Get all achievements
SELECT * FROM achievements ORDER BY rarity, category;

-- Get user's unlocked achievements
SELECT
  a.name,
  a.description,
  a.category,
  a.icon,
  a.rarity,
  ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
JOIN users u ON ua.user_id = u.id
WHERE u.wallet_address = 'wallet_address'
ORDER BY ua.unlocked_at DESC;

-- Unlock achievement for user
INSERT INTO user_achievements (user_id, achievement_id)
SELECT
  id,
  'battle-rookie'
FROM users
WHERE wallet_address = 'wallet_address'
ON CONFLICT (user_id, achievement_id) DO NOTHING
RETURNING *;

-- Check which achievements user can unlock
SELECT
  a.*,
  CASE
    WHEN 'first-steps' = a.id AND u.id IS NOT NULL THEN true
    WHEN 'battle-rookie' = a.id AND (SELECT COUNT(*) FROM battles WHERE challenger_id = u.id AND status = 'COMPLETED') >= 1 THEN true
    WHEN 'level-10' = a.id AND u.level >= 10 THEN true
    ELSE false
  END as can_unlock
FROM achievements a
CROSS JOIN users u
WHERE u.wallet_address = 'wallet_address'
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua
    WHERE ua.user_id = u.id AND ua.achievement_id = a.id
  );

-- ============================================
-- EVENTS
-- ============================================

-- Get upcoming events
SELECT * FROM events
WHERE status = 'upcoming'
  AND start_date > NOW()
ORDER BY start_date ASC;

-- Register for event
INSERT INTO event_participants (event_id, user_id)
SELECT
  'event_uuid',
  id
FROM users
WHERE wallet_address = 'wallet_address'
ON CONFLICT (event_id, user_id) DO NOTHING
RETURNING *;

-- Check in to event
UPDATE event_participants
SET
  registration_status = 'attended',
  check_in_at = NOW()
WHERE event_id = 'event_uuid'
  AND user_id = (SELECT id FROM users WHERE wallet_address = 'wallet_address')
RETURNING *;

-- ============================================
-- IMPACT TRACKING
-- ============================================

-- Get user's impact metrics
SELECT * FROM user_impact
WHERE user_id = (SELECT id FROM users WHERE wallet_address = 'wallet_address');

-- Log impact action
INSERT INTO impact_actions (
  user_id,
  action_type,
  description,
  impact_value,
  youth_impacted,
  verification_proof
)
SELECT
  id,
  'workshop_conducted',
  'Taught solar panel basics to 15 youth',
  100,
  15,
  '{"photos": ["url1", "url2"], "attendance": 15}'::jsonb
FROM users
WHERE wallet_address = 'wallet_address'
RETURNING *;

-- Update user impact aggregates
INSERT INTO user_impact (user_id, youth_impacted, total_actions, value_generated)
SELECT
  id,
  15,
  1,
  100
FROM users
WHERE wallet_address = 'wallet_address'
ON CONFLICT (user_id) DO UPDATE SET
  youth_impacted = user_impact.youth_impacted + EXCLUDED.youth_impacted,
  total_actions = user_impact.total_actions + EXCLUDED.total_actions,
  value_generated = user_impact.value_generated + EXCLUDED.value_generated,
  last_updated = NOW();

-- ============================================
-- ANALYTICS QUERIES
-- ============================================

-- Platform-wide stats
SELECT
  (SELECT COUNT(*) FROM users WHERE is_anonymous = false) as total_users,
  (SELECT COUNT(*) FROM users WHERE is_anonymous = true) as anonymous_users,
  (SELECT COUNT(*) FROM battles WHERE status = 'COMPLETED') as battles_completed,
  (SELECT COUNT(*) FROM collaborations) as total_collaborations,
  (SELECT COUNT(*) FROM tech_projects) as total_tech_projects,
  (SELECT COUNT(*) FROM gardens) as total_gardens,
  (SELECT SUM(tokens_earned) FROM airdrop_claims) as total_tokens_distributed,
  (SELECT SUM(youth_impacted) FROM user_impact) as total_youth_impacted;

-- Top users by XP
SELECT
  wallet_address,
  username,
  level,
  xp,
  life_stage,
  animal_mentor
FROM users
WHERE is_anonymous = false
ORDER BY xp DESC
LIMIT 10;

-- Most claimed airdrops
SELECT
  t.name,
  t.category,
  COUNT(*) as claim_count,
  SUM(ac.tokens_earned) as total_tokens,
  SUM(ac.xp_earned) as total_xp
FROM airdrop_claims ac
JOIN airdrop_templates t ON ac.template_id = t.id
GROUP BY t.id, t.name, t.category
ORDER BY claim_count DESC;

-- Most active collaborators
SELECT
  u.username,
  COUNT(*) as collaborations_count,
  SUM(cc.xp_earned) as total_xp
FROM collaboration_contributors cc
JOIN users u ON cc.user_id = u.id
GROUP BY u.id, u.username
ORDER BY collaborations_count DESC
LIMIT 10;

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Close expired airdrops
UPDATE airdrops
SET status = 'ended'
WHERE status = 'active'
  AND end_date < NOW();

-- Archive completed projects
UPDATE tech_projects
SET status = 'archived'
WHERE status = 'completed'
  AND updated_at < NOW() - INTERVAL '90 days';

-- Clean up old notifications
DELETE FROM notifications
WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_read = true;

-- Refresh materialized views (if any)
-- REFRESH MATERIALIZED VIEW view_name;

-- ============================================
-- END OF QUICK REFERENCE
-- ============================================
