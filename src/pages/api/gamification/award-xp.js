/**
 * POST /api/gamification/award-xp
 * Awards XP to a user and updates their level
 *
 * Body:
 * - walletAddress: string (required)
 * - xpAmount: number (required)
 * - activityType: string (required)
 * - description: string (optional)
 * - metadata: object (optional)
 */

import { neon } from '@neondatabase/serverless';

export const prerender = false;

export async function POST({ request }) {
  try {
    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content-Type must be application/json'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const {
      walletAddress,
      xpAmount,
      activityType,
      description = '',
      metadata = {}
    } = body;

    // Validate required fields
    if (!walletAddress || xpAmount === undefined || !activityType) {
      return new Response(JSON.stringify({
        success: false,
        error: 'walletAddress, xpAmount, and activityType are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (xpAmount < 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'XP amount must be positive'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Skip database for anonymous/test wallets - just return success
    if (walletAddress.startsWith('anon_') || walletAddress.startsWith('TEST_WALLET_')) {
      console.log('Anonymous wallet, skipping DB sync');
      return new Response(JSON.stringify({
        success: true,
        source: 'local_only',
        message: 'Anonymous wallet XP tracked locally',
        xp: { earned: xpAmount },
        level: { leveledUp: false }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to connect to database
    const dbUrl = process.env.DATABASE_URL || process.env.NILE_DATABASE_URL || process.env.lab_POSTGRES_URL;

    if (!dbUrl) {
      console.warn('No database URL configured');
      return new Response(JSON.stringify({
        success: true,
        source: 'local_only',
        message: 'Database not configured, XP tracked locally',
        xp: { earned: xpAmount },
        level: { leveledUp: false }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(dbUrl);

    // Get current user stats (or create if not exists)
    let userResult;
    try {
      userResult = await sql`
        SELECT wallet_address, xp, level
        FROM user_profiles
        WHERE wallet_address = ${walletAddress}
        LIMIT 1
      `;
    } catch (dbError) {
      console.warn('Could not query user:', dbError.message);
      return new Response(JSON.stringify({
        success: true,
        source: 'local_only',
        message: 'Database query failed, XP tracked locally',
        xp: { earned: xpAmount },
        level: { leveledUp: false }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let oldXP = 0;
    let oldLevel = 1;

    if (userResult.length === 0) {
      // Create new user
      try {
        await sql`
          INSERT INTO user_profiles (wallet_address, username, level, xp, created_at, updated_at)
          VALUES (
            ${walletAddress},
            ${'User_' + walletAddress.substring(0, 6)},
            1,
            0,
            NOW(),
            NOW()
          )
          ON CONFLICT (wallet_address) DO NOTHING
        `;
      } catch (insertError) {
        console.warn('Could not create user:', insertError.message);
      }
    } else {
      oldXP = userResult[0].xp || 0;
      oldLevel = userResult[0].level || 1;
    }

    const newXP = oldXP + xpAmount;

    // Calculate new level (formula: sqrt(xp / 100) + 1, max 120)
    const newLevel = Math.min(120, Math.floor(Math.sqrt(newXP / 100)) + 1);
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
      animalMentor = 'goat';
    }

    // Update user profile
    try {
      await sql`
        UPDATE user_profiles
        SET
          xp = ${newXP},
          level = ${newLevel},
          updated_at = NOW()
        WHERE wallet_address = ${walletAddress}
      `;
    } catch (updateError) {
      console.warn('Could not update user XP:', updateError.message);
    }

    // Log XP activity
    try {
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
          ${description},
          ${JSON.stringify(metadata)}::jsonb,
          NOW()
        )
      `;
    } catch (activityError) {
      // Table might not exist, continue anyway
      console.warn('Could not log XP activity:', activityError.message);
    }

    // Check for achievements (simple checks)
    const achievementsUnlocked = [];

    // Check total XP milestones
    if (newXP >= 1000 && oldXP < 1000) {
      achievementsUnlocked.push({
        id: '1k_xp_club',
        name: '1K XP Club',
        description: 'Earned 1,000 total XP',
        xp_bonus: 100
      });
    }

    if (newXP >= 10000 && oldXP < 10000) {
      achievementsUnlocked.push({
        id: '10k_xp_club',
        name: '10K XP Club',
        description: 'Earned 10,000 total XP',
        xp_bonus: 500
      });
    }

    // Check level milestones
    if (newLevel >= 10 && oldLevel < 10) {
      achievementsUnlocked.push({
        id: 'dedicated_learner',
        name: 'Dedicated Learner',
        description: 'Reached Level 10',
        xp_bonus: 250
      });
    }

    if (newLevel >= 50 && oldLevel < 50) {
      achievementsUnlocked.push({
        id: 'master_artist',
        name: 'Master Artist',
        description: 'Reached Level 50',
        xp_bonus: 1000
      });
    }

    return new Response(JSON.stringify({
      success: true,
      source: 'database',
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
      achievementsUnlocked,
      message: leveledUp
        ? `Level up! You're now level ${newLevel} (${lifeStage} stage).`
        : `+${xpAmount} XP earned!`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Award XP error:', error);

    // Return success anyway - XP was already awarded locally by the client
    return new Response(JSON.stringify({
      success: true,
      source: 'local_only',
      message: 'Database sync failed, XP tracked locally',
      error: error.message,
      xp: { earned: 0 },
      level: { leveledUp: false }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
