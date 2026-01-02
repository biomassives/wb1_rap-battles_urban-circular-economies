// src/api/gamification/user-progress.js
// Returns user's XP, level, achievements, and stats

import { sql } from '@vercel/postgres';

export async function GET({ url }) {
  try {
    const walletAddress = url.searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return new Response(JSON.stringify({
        error: 'Wallet address required'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user profile from Supabase (users table has level/xp)
    const { rows: users } = await sql`
      SELECT * FROM users
      WHERE wallet_address = ${walletAddress}
    `;

    if (users.length === 0) {
      // Create new user in database
      try {
        await sql`
          INSERT INTO users (wallet_address, username, level, xp)
          VALUES (${walletAddress}, ${'User_' + walletAddress.substring(0, 6)}, 1, 0)
        `;
      } catch (insertError) {
        console.error('Error creating user:', insertError);
      }

      // Return default/empty user data
      return new Response(JSON.stringify({
        success: true,
        user: {
          wallet_address: walletAddress,
          username: 'User_' + walletAddress.substring(0, 6),
          level: 1,
          xp: 0,
          xp_to_next_level: 100,
          progress_percentage: 0
        },
        stats: {
          musical: { tracks: 0, battles: 0, collabs: 0 },
          environmental: { observations: 0, courses: 0, projects: 0 },
          community: { votes: 0, comments: 0, shares: 0 },
          kakuma: { donations: 0, impact_score: 0 }
        },
        achievements: [],
        recent_activity: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];

    // Calculate level progress
    const currentLevel = user.level || 1;
    const totalXP = user.xp || 0;
    const currentLevelXP = currentLevel * 100;
    const nextLevelXP = (currentLevel + 1) * 100;
    const progressXP = totalXP - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    const progressPercentage = Math.min(100, Math.max(0, (progressXP / xpNeeded) * 100));

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
      animalMentor = 'goat'; // or 'cat'
    }

    // Get battle stats from battles table
    const { rows: battleStats } = await sql`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN winner_id = ${user.id} THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN (challenger_id = ${user.id} OR opponent_id = ${user.id}) AND winner_id IS NOT NULL AND winner_id != ${user.id} THEN 1 ELSE 0 END) as losses
      FROM battles
      WHERE (challenger_id = ${user.id} OR opponent_id = ${user.id})
      AND status = 'COMPLETED'
    `;

    const battles = battleStats[0] || { total: 0, wins: 0, losses: 0 };
    const winRate = battles.total > 0 ? Math.round((battles.wins / battles.total) * 100) : 0;

    // Get user stats
    const stats = {
      musical: {
        tracks: 0, // TODO: COUNT from tracks table
        battles: parseInt(battles.total) || 0,
        collabs: 0
      },
      environmental: {
        observations: 0, // TODO: COUNT from observations table
        courses: 0,
        projects: 0
      },
      community: {
        votes: 0,
        comments: 0,
        shares: 0
      },
      kakuma: {
        donations: 0,
        impact_score: 0
      }
    };

    // Get achievements (placeholder)
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
        username: user.username || 'User',
        created_at: user.created_at
      },
      music: {
        publishedTracks: 0,
        battles: {
          total: parseInt(battles.total) || 0,
          wins: parseInt(battles.wins) || 0,
          losses: parseInt(battles.losses) || 0,
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
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
