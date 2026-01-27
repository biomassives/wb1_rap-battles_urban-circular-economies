// src/pages/api/environmental/user-progress.js
// Returns user's environmental progress and observations
import { neon } from '@neondatabase/serverless';

export const prerender = false;

/**
 * Returns default environmental progress when database is unavailable
 */
function getDefaultEnvironmentalProgress(walletAddress) {
  return {
    success: true,
    source: 'default',
    enrolled_courses: [],
    completed_courses: [],
    active_projects: [],
    observations: {
      total: 0,
      this_month: 0,
      by_project: []
    },
    achievements: [],
    stats: {
      total_xp_earned: 0,
      observations_submitted: 0,
      courses_completed: 0,
      projects_joined: 0,
      data_quality_average: 0
    }
  };
}

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ success: false, error: 'Wallet address required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Skip database for anonymous/test wallets
    if (walletAddress.startsWith('anon_') || walletAddress.startsWith('TEST_WALLET_')) {
      console.log('Anonymous wallet detected, returning default environmental progress');
      return new Response(JSON.stringify(getDefaultEnvironmentalProgress(walletAddress)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to connect to database
    const dbUrl = process.env.DATABASE_URL || process.env.NILE_DATABASE_URL || process.env.lab_POSTGRES_URL;

    if (!dbUrl) {
      console.warn('No database URL configured, returning default environmental progress');
      return new Response(JSON.stringify(getDefaultEnvironmentalProgress(walletAddress)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(dbUrl);

    // Query observations count
    let observationsTotal = 0;
    let observationsThisMonth = 0;
    let totalXP = 0;
    let achievements = [];

    try {
      // Get total observations
      const obsResult = await sql`
        SELECT COUNT(*) AS total
        FROM environmental_observations
        WHERE wallet_address = ${walletAddress}
      `;
      observationsTotal = Number(obsResult[0]?.total || 0);

      // Get observations this month
      const obsMonthResult = await sql`
        SELECT COUNT(*) AS total
        FROM environmental_observations
        WHERE wallet_address = ${walletAddress}
        AND created_at >= date_trunc('month', now())
      `;
      observationsThisMonth = Number(obsMonthResult[0]?.total || 0);

      // Get total XP from environmental activities
      const xpResult = await sql`
        SELECT COALESCE(SUM(amount), 0) AS total_xp
        FROM user_xp_events
        WHERE wallet_address = ${walletAddress}
      `;
      totalXP = Number(xpResult[0]?.total_xp || 0);

      // Get achievements
      const achievementsResult = await sql`
        SELECT achievement_id, unlocked_at, progress, total
        FROM user_achievements
        WHERE wallet_address = ${walletAddress}
      `;
      achievements = achievementsResult || [];

    } catch (dbError) {
      console.error('Database query error:', dbError.message);
      // Return default data if database fails
      return new Response(JSON.stringify(getDefaultEnvironmentalProgress(walletAddress)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const progress = {
      success: true,
      source: 'database',
      enrolled_courses: [],
      completed_courses: [],
      active_projects: [],
      observations: {
        total: observationsTotal,
        this_month: observationsThisMonth,
        by_project: []
      },
      achievements: achievements.map(a => ({
        id: a.achievement_id,
        unlocked: !!a.unlocked_at,
        progress: a.progress,
        total: a.total
      })),
      stats: {
        total_xp_earned: totalXP,
        observations_submitted: observationsTotal,
        courses_completed: 0,
        projects_joined: 0,
        data_quality_average: 0
      }
    };

    return new Response(JSON.stringify(progress), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Environmental progress error:', error);

    // Return default progress on error instead of 500
    const walletAddress = new URL(request.url).searchParams.get('walletAddress') || 'unknown';
    return new Response(JSON.stringify(getDefaultEnvironmentalProgress(walletAddress)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
