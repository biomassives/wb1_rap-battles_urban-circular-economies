-- Database Migration: Add Gamification Fields
-- Run this migration if you already have an existing database with user_profiles table

-- Add gamification columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Update existing users to have default values
UPDATE user_profiles
SET level = 1, xp = 0
WHERE level IS NULL OR xp IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.level IS 'User current level (1-120)';
COMMENT ON COLUMN user_profiles.xp IS 'User total experience points';
