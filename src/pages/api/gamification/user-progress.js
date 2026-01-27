// src/api/gamification/user-progress.js
// Returns user's XP, level, achievements, and stats

import { neon } from '@neondatabase/serverless';

export const prerender = false;

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Skip database for anonymous/test wallets - return default data
    if (walletAddress.startsWith('anon_') || walletAddress.startsWith('TEST_WALLET_')) {
      console.log('Anonymous wallet detected, returning default progress');
      return new Response(JSON.stringify(getDefaultProgress(walletAddress)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to connect to database
    const dbUrl = process.env.DATABASE_URL || process.env.NILE_DATABASE_URL || process.env.lab_POSTGRES_URL;

    if (!dbUrl) {
      console.warn('No database URL configured, returning default progress');
      return new Response(JSON.stringify(getDefaultProgress(walletAddress)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(dbUrl);

    // Get user profile from database
    let users;
    try {
      users = await sql`
        SELECT * FROM user_profiles
        WHERE wallet_address = ${walletAddress}
      `;
    } catch (dbError) {
      console.error('Database query error:', dbError.message);
      // Return default data if database fails
      return new Response(JSON.stringify(getDefaultProgress(walletAddress)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!users || users.length === 0) {
      // Try to create new user in database
      try {
        await sql`
          INSERT INTO user_profiles (wallet_address, username, level, xp)
          VALUES (${walletAddress}, ${'User_' + walletAddress.substring(0, 6)}, 1, 0)
          ON CONFLICT (wallet_address) DO NOTHING
        `;
      } catch (insertError) {
        console.warn('Error creating user (may already exist):', insertError.message);
      }

      // Return default user data
      return new Response(JSON.stringify(getDefaultProgress(walletAddress)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];

    // Calculate level progress
    const currentLevel = user.level || 1;
    const totalXP = user.xp || 0;
    const currentLevelXP = (currentLevel - 1) * 100;
    const nextLevelXP = currentLevel * 100;
    const progressXP = totalXP - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    const progressPercentage = xpNeeded > 0 ? Math.min(100, Math.max(0, (progressXP / xpNeeded) * 100)) : 0;

    // Determine life stage based on level
    let lifeStage = 'egg';
    let animalMentor = 'chicken';

    if (currentLevel >= 76) {
      lifeStage = 'elder';
      animalMentor = 'rabbit';
    } else if (currentLevel >= 51) {
      lifeStage = 'adult';
      animalMentor = 'dog';
    } else if (currentLevel >= 26) {
      lifeStage = 'juvenile';
      animalMentor = 'pigeon';
    } else if (currentLevel >= 11) {
      lifeStage = 'chick';
      animalMentor = 'goat';
    }

    // Get battle stats - wrap in try/catch in case table doesn't exist
    let battles = { total: 0, wins: 0, losses: 0 };
    try {
      const battleStats = await sql`
        SELECT
          COUNT(*)::int as total,
          COALESCE(SUM(CASE WHEN winner_wallet = ${user.wallet_address} THEN 1 ELSE 0 END), 0)::int as wins,
          COALESCE(SUM(CASE WHEN (challenger_wallet = ${user.wallet_address} OR opponent_wallet = ${user.wallet_address}) AND winner_wallet IS NOT NULL AND winner_wallet != ${user.wallet_address} THEN 1 ELSE 0 END), 0)::int as losses
        FROM battles
        WHERE (challenger_wallet = ${user.wallet_address} OR opponent_wallet = ${user.wallet_address})
        AND status = 'completed'
      `;
      if (battleStats && battleStats[0]) {
        battles = battleStats[0];
      }
    } catch (battleError) {
      console.warn('Could not fetch battle stats:', battleError.message);
    }

    const winRate = battles.total > 0 ? Math.round((battles.wins / battles.total) * 100) : 0;

    // Get achievements (placeholder for now)
    const achievements = {
      total: 1,
      unlocked: [
        {
          id: 'welcome',
          name: 'Welcome to WorldBridger',
          description: 'Join the community',
          icon: '🌍',
          unlocked: true,
          category: 'general'
        }
      ]
    };

    // Get recent activity (placeholder)
    const recentActivity = [
      {
        activity_type: 'profile_created',
        description: 'Joined WorldBridger One',
        xp_earned: 10,
        created_at: user.created_at
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      progression: {
        currentLevel: currentLevel,
        totalXP: totalXP,
        lifeStage: lifeStage,
        animalMentor: animalMentor,
        nextLevel: {
          level: currentLevel + 1,
          xpNeeded: xpNeeded,
          percentComplete: Math.round(progressPercentage)
        }
      },
      user: {
        wallet_address: user.wallet_address,
        username: user.username || 'User_' + walletAddress.substring(0, 6),
        created_at: user.created_at
      },
      music: {
        publishedTracks: 0,
        battles: {
          total: battles.total || 0,
          wins: battles.wins || 0,
          losses: battles.losses || 0,
          winRate: winRate
        }
      },
      environmental: {
        coursesCompleted: 0,
        projectsParticipated: 0
      },
      kakumaImpact: {
        youthImpacted: 0,
        totalActions: 0,
        valueGenerated: 0
      },
      achievements: achievements,
      recentActivity: recentActivity,
      dailyWisdom: {
        topic: 'Getting Started',
        wisdom_text: 'Every journey begins with a single step. Welcome to WorldBridger One!'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('User progress error:', error);

    // Return default progress on error instead of 500
    const walletAddress = new URL(request.url).searchParams.get('walletAddress') || 'unknown';
    return new Response(JSON.stringify(getDefaultProgress(walletAddress)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Returns default progress data when database is unavailable
 */
function getDefaultProgress(walletAddress) {
  return {
    success: true,
    source: 'default', // Indicates this is fallback data
    progression: {
      currentLevel: 1,
      totalXP: 0,
      lifeStage: 'egg',
      animalMentor: 'chicken',
      nextLevel: {
        level: 2,
        xpNeeded: 100,
        percentComplete: 0
      }
    },
    user: {
      wallet_address: walletAddress,
      username: 'User_' + (walletAddress?.substring(0, 6) || 'New'),
      created_at: new Date().toISOString()
    },
    music: {
      publishedTracks: 0,
      battles: {
        total: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      }
    },
    environmental: {
      coursesCompleted: 0,
      projectsParticipated: 0
    },
    kakumaImpact: {
      youthImpacted: 0,
      totalActions: 0,
      valueGenerated: 0
    },
    achievements: {
      total: 0,
      unlocked: []
    },
    recentActivity: [],
    dailyWisdom: {
      topic: 'Getting Started',
      wisdom_text: 'Welcome to WorldBridger One! Connect and explore.'
    }
  };
}
