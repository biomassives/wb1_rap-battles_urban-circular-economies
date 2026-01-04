// /api/gamification/award-xp.js
// Award XP to user and handle level ups
// Updated for Nile DB

import { sql } from '@vercel/postgres';

// Mark as server-rendered
export const prerender = false;

export async function POST({ request }) {
  const body = await request.json();

  const {
    walletAddress,
    xpAmount,
    activityType,
    description,
    metadata
  } = body;

  if (!walletAddress || !xpAmount || !activityType) {
    return new Response(JSON.stringify({
      error: 'Missing required fields: walletAddress, xpAmount, activityType'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (xpAmount < 0) {
    return new Response(JSON.stringify({
      error: 'XP amount must be positive'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get current user stats
    const { rows: userResult } = await sql`
      SELECT total_xp, current_level, current_animal_mentor, life_stage
      FROM user_profiles
      WHERE wallet_address = ${walletAddress}
      LIMIT 1
    `;

    if (userResult.length === 0) {
      return new Response(JSON.stringify({
        error: 'User not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = userResult[0];
    const oldXP = user.total_xp || 0;
    const oldLevel = user.current_level || 1;
    const newXP = oldXP + xpAmount;

    // Calculate new level (formula: sqrt(xp / 50) + 1, max 100)
    const newLevel = Math.min(100, Math.floor(Math.sqrt(newXP / 50)) + 1);
    const leveledUp = newLevel > oldLevel;

    // Determine life stage based on level
    let lifeStage = 'egg';
    let animalMentor = 'chicken';
    
    if (newLevel >= 76) {
      lifeStage = 'elder';
      animalMentor = 'rabbit';
    } else if (newLevel >= 51) {
      lifeStage = 'adult';
      animalMentor = 'dog';
    } else if (newLevel >= 26) {
      lifeStage = 'juvenile';
      animalMentor = 'pigeon';
    } else if (newLevel >= 11) {
      lifeStage = 'chick';
      // Keep their chosen mentor (cat or goat)
      animalMentor = user.current_animal_mentor || 'cat';
    } else {
      lifeStage = 'egg';
      animalMentor = 'chicken';
    }

    // Update user profile
    await sql`
      UPDATE user_profiles
      SET 
        total_xp = ${newXP},
        current_level = ${newLevel},
        current_animal_mentor = ${animalMentor},
        life_stage = ${lifeStage},
        updated_at = NOW(),
        last_active_at = NOW()
      WHERE wallet_address = ${walletAddress}
    `;

    // Log XP activity
    await sql`
      INSERT INTO xp_activities (
        user_wallet,
        activity_type,
        xp_earned,
        description,
        metadata,
        created_at
      ) VALUES (
        ${walletAddress},
        ${activityType},
        ${xpAmount},
        ${description || ''},
        ${metadata ? JSON.stringify(metadata) : '{}'}::jsonb,
        NOW()
      )
    `;

    // If leveled up, create notification
    if (leveledUp) {
      await sql`
        INSERT INTO notifications (
          user_wallet,
          notification_type,
          title,
          message,
          created_at
        ) VALUES (
          ${walletAddress},
          'level_up',
          ${`Level ${newLevel} Reached!`},
          ${`Congratulations! You've reached level ${newLevel}. Your mentor is now ${animalMentor}.`},
          NOW()
        )
      `;
    }

    // Check for achievements (simple checks, can be expanded)
    const achievements = [];

    // Check total XP milestones
    if (newXP >= 1000 && oldXP < 1000) {
      await grantAchievement(sql, walletAddress, '1K XP Club');
      achievements.push('1K XP Club');
    }

    if (newXP >= 10000 && oldXP < 10000) {
      await grantAchievement(sql, walletAddress, '10K XP Club');
      achievements.push('10K XP Club');
    }

    // Check level milestones
    if (newLevel === 100 && oldLevel < 100) {
      await grantAchievement(sql, walletAddress, 'Legend Status');
      achievements.push('Legend Status');
    }

    return new Response(JSON.stringify({
      success: true,
      xp: {
        previous: oldXP,
        earned: xpAmount,
        total: newXP
      },
      level: {
        previous: oldLevel,
        current: newLevel,
        leveledUp: leveledUp
      },
      progression: {
        lifeStage: lifeStage,
        animalMentor: animalMentor
      },
      achievementsUnlocked: achievements,
      message: leveledUp
        ? `Level up! You're now level ${newLevel} (${lifeStage} stage).`
        : `+${xpAmount} XP earned!`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Award XP error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to award XP',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to grant achievements
async function grantAchievement(sql, walletAddress, achievementName) {
  try {
    // Get achievement ID
    const achResult = await sql`
      SELECT achievement_id, xp_reward
      FROM achievements
      WHERE achievement_name = ${achievementName}
      LIMIT 1
    `;

    if (achResult.length === 0) return;

    const achievement = achResult[0];

    // Check if already earned
    const existingResult = await sql`
      SELECT id FROM user_achievements
      WHERE user_wallet = ${walletAddress}
      AND achievement_id = ${achievement.achievement_id}
    `;

    if (existingResult.length > 0) return; // Already has it

    // Grant achievement
    await sql`
      INSERT INTO user_achievements (
        user_wallet,
        achievement_id,
        progress,
        earned_at
      ) VALUES (
        ${walletAddress},
        ${achievement.achievement_id},
        100,
        NOW()
      )
    `;

    // Create notification
    await sql`
      INSERT INTO notifications (
        user_wallet,
        notification_type,
        title,
        message,
        created_at
      ) VALUES (
        ${walletAddress},
        'achievement',
        'Achievement Unlocked!',
        ${`You've earned: ${achievementName}`},
        NOW()
      )
    `;

  } catch (error) {
    console.error('Grant achievement error:', error);
  }
}
