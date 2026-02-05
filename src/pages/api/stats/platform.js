/**
 * Platform Stats API
 * GET /api/stats/platform
 *
 * Returns aggregate platform statistics:
 * - Total battles
 * - Total players (unique users)
 * - Active battles
 * - Total submissions
 */

import { neon } from '@neondatabase/serverless';

export const prerender = false;

export async function GET({ request }) {
  try {
    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    // Get battle counts
    const battleStats = await sql`
      SELECT
        COUNT(*) as total_battles,
        COUNT(*) FILTER (WHERE status = 'active') as active_battles,
        COUNT(*) FILTER (WHERE status = 'voting') as voting_battles,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_battles,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_battles
      FROM battles
    `;

    // Get unique player count from multiple sources
    const playerStats = await sql`
      SELECT COUNT(DISTINCT wallet) as total_players FROM (
        -- Users who created battles
        SELECT challenger_wallet as wallet FROM battles
        UNION
        -- Users who joined battles as opponents
        SELECT opponent_wallet as wallet FROM battles WHERE opponent_wallet IS NOT NULL
        UNION
        -- Users who submitted verses
        SELECT user_wallet as wallet FROM battle_submissions
        UNION
        -- Users who voted
        SELECT voter_wallet as wallet FROM battle_votes
        UNION
        -- Users with profiles
        SELECT wallet_address as wallet FROM user_profiles
      ) all_wallets
      WHERE wallet IS NOT NULL
    `;

    // Get submission count
    const submissionStats = await sql`
      SELECT COUNT(*) as total_submissions FROM battle_submissions
    `;

    // Get vote count
    const voteStats = await sql`
      SELECT COUNT(*) as total_votes FROM battle_votes
    `;

    const stats = {
      battles: {
        total: parseInt(battleStats[0]?.total_battles || 0),
        active: parseInt(battleStats[0]?.active_battles || 0),
        voting: parseInt(battleStats[0]?.voting_battles || 0),
        completed: parseInt(battleStats[0]?.completed_battles || 0),
        pending: parseInt(battleStats[0]?.pending_battles || 0)
      },
      players: {
        total: parseInt(playerStats[0]?.total_players || 0)
      },
      submissions: {
        total: parseInt(submissionStats[0]?.total_submissions || 0)
      },
      votes: {
        total: parseInt(voteStats[0]?.total_votes || 0)
      },
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      stats
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    });

  } catch (error) {
    console.error('Platform stats error:', error);

    // Return zeros if database is unavailable
    return new Response(JSON.stringify({
      success: true,
      stats: {
        battles: { total: 0, active: 0, voting: 0, completed: 0, pending: 0 },
        players: { total: 0 },
        submissions: { total: 0 },
        votes: { total: 0 },
        lastUpdated: new Date().toISOString(),
        error: 'Database unavailable - showing defaults'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
