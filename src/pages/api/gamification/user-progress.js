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

    // Get user profile from Vercel Postgres
    const { rows: users } = await sql`
      SELECT * FROM user_profiles 
      WHERE wallet_address = ${walletAddress}
    `;

    if (users.length === 0) {
      // Return default/empty user data
      return new Response(JSON.stringify({
        success: true,
        user: {
          wallet_address: walletAddress,
          username: 'New User',
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
    const currentLevelXP = user.level * 100;
    const nextLevelXP = (user.level + 1) * 100;
    const progressXP = user.xp - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    const progressPercentage = Math.min(100, (progressXP / xpNeeded) * 100);

    // Get user stats (you can expand this with real data later)
    const stats = {
      musical: {
        tracks: 0, // TODO: COUNT from tracks table
        battles: 0, // TODO: COUNT from battles table
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

    // Get achievements (placeholder - you can add achievements table later)
    const achievements = [
      {
        id: 'welcome',
        name: 'Welcome to WorldBridger',
        description: 'Join the community',
        icon: '🌍',
        unlocked: true,
        category: 'general'
      }
    ];

    // Get recent activity (placeholder)
    const recent_activity = [
      {
        type: 'profile_created',
        description: 'Joined WorldBridger One',
        xp_earned: 10,
        timestamp: user.created_at
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      user: {
        wallet_address: user.wallet_address,
        username: user.username || 'User',
        level: user.level || 1,
        xp: user.xp || 0,
        xp_to_next_level: nextLevelXP,
        xp_needed: xpNeeded,
        progress_percentage: progressPercentage,
        avatar_url: user.avatar_url,
        bio: user.bio,
        created_at: user.created_at
      },
      stats,
      achievements,
      recent_activity
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
