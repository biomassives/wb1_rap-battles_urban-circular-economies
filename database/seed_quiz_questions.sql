-- ============================================
-- TRAINING QUIZ QUESTIONS SEED DATA
-- Worldbridger One Platform
-- 15 Questions across 5 categories
-- ============================================

-- The quiz should already exist from schema_stats_quiz.sql
-- Quiz ID: 00000000-0000-0000-0000-000000000001

-- ============================================
-- PLATFORM BASICS (3 questions)
-- ============================================

-- Q1: Platform Mission
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'What is Worldbridger One''s primary mission?',
  'multiple_choice',
  'platform',
  'easy',
  1,
  'Worldbridger One empowers youth (especially in underserved communities like Kakuma refugee camp) through music creation, educational opportunities, and blockchain technology that provides real economic value.',
  1,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'To create the most profitable NFT marketplace', FALSE, 1),
  ('00000000-0000-0000-0000-000000000101', 'To empower youth through music, education, and blockchain technology', TRUE, 2),
  ('00000000-0000-0000-0000-000000000101', 'To compete with major record labels', FALSE, 3),
  ('00000000-0000-0000-0000-000000000101', 'To sell expensive NFTs to collectors', FALSE, 4)
ON CONFLICT DO NOTHING;

-- Q2: Kakuma Support
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000001',
  'What percentage of marketplace sales supports Kakuma youth programs?',
  'multiple_choice',
  'platform',
  'easy',
  1,
  '5% of all marketplace sales go directly to supporting youth empowerment programs in Kakuma refugee camp, including music education, environmental projects, and skill training.',
  2,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000102', '2%', FALSE, 1),
  ('00000000-0000-0000-0000-000000000102', '5%', TRUE, 2),
  ('00000000-0000-0000-0000-000000000102', '10%', FALSE, 3),
  ('00000000-0000-0000-0000-000000000102', '15%', FALSE, 4)
ON CONFLICT DO NOTHING;

-- Q3: NFT Role
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000001',
  'What is the primary purpose of NFTs in the Worldbridger ecosystem?',
  'multiple_choice',
  'platform',
  'medium',
  1,
  'NFTs in Worldbridger serve as proof of achievement (battle cards, certificates), unlock features (advanced battles), provide airdrop eligibility, and reward participation - not just speculation.',
  3,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000103', 'Pure speculation and trading', FALSE, 1),
  ('00000000-0000-0000-0000-000000000103', 'Proof of achievement, access to features, and rewards', TRUE, 2),
  ('00000000-0000-0000-0000-000000000103', 'Replacing traditional currency', FALSE, 3),
  ('00000000-0000-0000-0000-000000000103', 'Showing off wealth', FALSE, 4)
ON CONFLICT DO NOTHING;

-- ============================================
-- RAP BATTLE SYSTEM (4 questions)
-- ============================================

-- Q4: Battle Submissions
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000001',
  'What happens when you win a rap battle?',
  'multiple_choice',
  'battles',
  'medium',
  1,
  'Winners of battles automatically mint a commemorative NFT card featuring their rapper persona, earned bling badges, battle stats, and the battle details. This becomes a collectible proof of achievement.',
  4,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000104', 'Nothing special', FALSE, 1),
  ('00000000-0000-0000-0000-000000000104', 'You only get XP points', FALSE, 2),
  ('00000000-0000-0000-0000-000000000104', 'You mint a commemorative card with bling badges', TRUE, 3),
  ('00000000-0000-0000-0000-000000000104', 'You lose your entry stake', FALSE, 4)
ON CONFLICT DO NOTHING;

-- Q5: Rarity Factors
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000105',
  '00000000-0000-0000-0000-000000000001',
  'Which of these factors INCREASES your battle card rarity chance?',
  'multiple_choice',
  'battles',
  'medium',
  1,
  'Card rarity is influenced by win streaks (+5% per win), community vote scores, number of badges earned, and being among the first participants in a battle. Better performance = rarer cards.',
  5,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000105', 'Losing multiple battles in a row', FALSE, 1),
  ('00000000-0000-0000-0000-000000000105', 'Win streaks and high community votes', TRUE, 2),
  ('00000000-0000-0000-0000-000000000105', 'Reporting other users', FALSE, 3),
  ('00000000-0000-0000-0000-000000000105', 'Waiting longer between battles', FALSE, 4)
ON CONFLICT DO NOTHING;

-- Q6: Bling Badges
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000106',
  '00000000-0000-0000-0000-000000000001',
  'What are bling badges?',
  'multiple_choice',
  'battles',
  'easy',
  1,
  'Bling badges (🏆🔥💎⚡👑 etc.) are achievement icons earned through victories, performance milestones, special events, and skill demonstrations. They appear on your battle cards and profile.',
  6,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000106', 'Decorative items you purchase', FALSE, 1),
  ('00000000-0000-0000-0000-000000000106', 'Achievement icons you earn through battles and performance', TRUE, 2),
  ('00000000-0000-0000-0000-000000000106', 'NFTs you can sell', FALSE, 3),
  ('00000000-0000-0000-0000-000000000106', 'Required items to enter battles', FALSE, 4)
ON CONFLICT DO NOTHING;

-- Q7: Battle Etiquette
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000107',
  '00000000-0000-0000-0000-000000000001',
  'What type of content is NOT allowed in rap battles?',
  'multiple_choice',
  'battles',
  'medium',
  1,
  'While creative insults and competitive banter are part of hip-hop culture, hate speech, discrimination based on identity, threats of violence, and harassment are strictly prohibited.',
  7,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000107', 'Creative wordplay and metaphors', FALSE, 1),
  ('00000000-0000-0000-0000-000000000107', 'Boasting about your skills', FALSE, 2),
  ('00000000-0000-0000-0000-000000000107', 'Hate speech, discrimination, or threats', TRUE, 3),
  ('00000000-0000-0000-0000-000000000107', 'References to hip-hop culture', FALSE, 4)
ON CONFLICT DO NOTHING;

-- ============================================
-- MUSIC STUDIO TOOLS (3 questions)
-- ============================================

-- Q8: Moog Parameters
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000108',
  '00000000-0000-0000-0000-000000000001',
  'What do the 4 Moog synthesizer dials control?',
  'multiple_choice',
  'music',
  'medium',
  1,
  'The Moog dials control: Frequency (20-2000 Hz for pitch), Duration (0.1-15s for sound length), Intensity (0-1 for volume), and Modulation (0-200 Hz for FM synthesis depth).',
  8,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000108', 'Volume, bass, treble, effects', FALSE, 1),
  ('00000000-0000-0000-0000-000000000108', 'Frequency, duration, intensity, modulation', TRUE, 2),
  ('00000000-0000-0000-0000-000000000108', 'Pitch, tempo, rhythm, melody', FALSE, 3),
  ('00000000-0000-0000-0000-000000000108', 'Attack, decay, sustain, release', FALSE, 4)
ON CONFLICT DO NOTHING;

-- Q9: Sampler Pads
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000109',
  '00000000-0000-0000-0000-000000000001',
  'How many sampler pads are available in the studio?',
  'multiple_choice',
  'music',
  'easy',
  1,
  'The sampler has 16 pads arranged in a 4x4 grid. Each pad can be triggered by clicking or using keyboard shortcuts (1-4, Q-R, A-F, Z-V).',
  9,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000109', '8 pads', FALSE, 1),
  ('00000000-0000-0000-0000-000000000109', '12 pads', FALSE, 2),
  ('00000000-0000-0000-0000-000000000109', '16 pads', TRUE, 3),
  ('00000000-0000-0000-0000-000000000109', '24 pads', FALSE, 4)
ON CONFLICT DO NOTHING;

-- Q10: Loop Functionality
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000110',
  '00000000-0000-0000-0000-000000000001',
  'What is the purpose of the "Loop" feature in the Moog synthesizer?',
  'multiple_choice',
  'music',
  'easy',
  1,
  'Loop mode continuously replays your synthesized sound at the set duration interval, perfect for creating backing tracks for freestyling or designing evolving soundscapes.',
  10,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000110', 'To save your sound', FALSE, 1),
  ('00000000-0000-0000-0000-000000000110', 'To play the sound repeatedly for backing tracks', TRUE, 2),
  ('00000000-0000-0000-0000-000000000110', 'To share with others', FALSE, 3),
  ('00000000-0000-0000-0000-000000000110', 'To increase volume', FALSE, 4)
ON CONFLICT DO NOTHING;

-- ============================================
-- NFT & CARD SYSTEM (3 questions)
-- ============================================

-- Q11: Card Rarity Tiers
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000111',
  '00000000-0000-0000-0000-000000000001',
  'What is the rarest card tier?',
  'multiple_choice',
  'nft',
  'easy',
  1,
  'The rarity tiers from common to rare are: Common (60%), Rare (25%), Epic (10%), Legendary (4%), and Mythic (1% - the rarest).',
  11,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000111', 'Legendary (4%)', FALSE, 1),
  ('00000000-0000-0000-0000-000000000111', 'Epic (10%)', FALSE, 2),
  ('00000000-0000-0000-0000-000000000111', 'Mythic (1%)', TRUE, 3),
  ('00000000-0000-0000-0000-000000000111', 'Diamond (5%)', FALSE, 4)
ON CONFLICT DO NOTHING;

-- Q12: Airdrop Eligibility
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000112',
  '00000000-0000-0000-0000-000000000001',
  'What primarily determines your airdrop tier eligibility?',
  'multiple_choice',
  'nft',
  'medium',
  1,
  'Airdrop tiers are based on card ownership: Tier 1 (1+ cards), Tier 2 (5+ cards), Tier 3 (10+ cards), Tier 4 (25+ cards), Tier 5 (50+ cards or 1 Mythic).',
  12,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000112', 'Number of battle cards you own', TRUE, 1),
  ('00000000-0000-0000-0000-000000000112', 'Age of your account', FALSE, 2),
  ('00000000-0000-0000-0000-000000000112', 'Number of followers', FALSE, 3),
  ('00000000-0000-0000-0000-000000000112', 'Wallet balance in SOL', FALSE, 4)
ON CONFLICT DO NOTHING;

-- Q13: Marketplace Trading
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000113',
  '00000000-0000-0000-0000-000000000001',
  'When you sell a battle card on the marketplace, who gets a royalty?',
  'multiple_choice',
  'nft',
  'medium',
  1,
  'Secondary sales include 5% royalty to Worldbridger (supporting operations and Kakuma) and 2% to the original battle winner who earned the card.',
  13,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000113', 'Only you get the full amount', FALSE, 1),
  ('00000000-0000-0000-0000-000000000113', 'Worldbridger gets 5%, original battle winner gets 2%', TRUE, 2),
  ('00000000-0000-0000-0000-000000000113', 'Solana network gets 10%', FALSE, 3),
  ('00000000-0000-0000-0000-000000000113', 'No one gets royalties', FALSE, 4)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMUNITY GUIDELINES (2 questions)
-- ============================================

-- Q14: Reporting System
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000114',
  '00000000-0000-0000-0000-000000000001',
  'What should you do if you see inappropriate content or behavior?',
  'multiple_choice',
  'community',
  'easy',
  1,
  'If you encounter content that violates guidelines (hate speech, harassment, spam, etc.), use the report button. Our team reviews all reports and takes appropriate action to maintain a positive community.',
  14,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000114', 'Ignore it and move on', FALSE, 1),
  ('00000000-0000-0000-0000-000000000114', 'Share it with friends', FALSE, 2),
  ('00000000-0000-0000-0000-000000000114', 'Use the report button to flag it', TRUE, 3),
  ('00000000-0000-0000-0000-000000000114', 'Leave the platform', FALSE, 4)
ON CONFLICT DO NOTHING;

-- Q15: Platform Values
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, category, difficulty, points, explanation, order_index, active)
VALUES (
  '00000000-0000-0000-0000-000000000115',
  '00000000-0000-0000-0000-000000000001',
  'Which of these best describes Worldbridger''s community values?',
  'multiple_choice',
  'community',
  'easy',
  1,
  'Worldbridger values: Respect for all users, Creative expression through music and art, Empowerment of underserved communities, and Social impact (supporting Kakuma and education).',
  15,
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_answer_choices (question_id, choice_text, is_correct, order_index)
VALUES
  ('00000000-0000-0000-0000-000000000115', 'Profit at any cost', FALSE, 1),
  ('00000000-0000-0000-0000-000000000115', 'Respect, creativity, empowerment, and social impact', TRUE, 2),
  ('00000000-0000-0000-0000-000000000115', 'Competition above all', FALSE, 3),
  ('00000000-0000-0000-0000-000000000115', 'Exclusivity for elite users', FALSE, 4)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify all questions were inserted
SELECT
  q.category,
  COUNT(*) as question_count,
  COUNT(DISTINCT ac.question_id) as questions_with_choices
FROM quiz_questions q
LEFT JOIN quiz_answer_choices ac ON ac.question_id = q.id
WHERE q.quiz_id = '00000000-0000-0000-0000-000000000001'
GROUP BY q.category
ORDER BY q.category;

-- Show total
SELECT
  COUNT(DISTINCT q.id) as total_questions,
  COUNT(ac.id) as total_choices,
  COUNT(CASE WHEN ac.is_correct THEN 1 END) as correct_answers
FROM quiz_questions q
LEFT JOIN quiz_answer_choices ac ON ac.question_id = q.id
WHERE q.quiz_id = '00000000-0000-0000-0000-000000000001';
