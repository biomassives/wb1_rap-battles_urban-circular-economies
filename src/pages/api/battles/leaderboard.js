/**
 * GET /api/battles/leaderboard
 * Get battle leaderboard rankings
 *
 * Query params:
 * - period: 'week' | 'month' | 'all' (default: 'week')
 * - limit: number (default: 10)
 * - category: string (optional - filter by category)
 */

import { neon } from '@neondatabase/serverless';

export const prerender = false;

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'week';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const category = url.searchParams.get('category');

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    // Calculate date filter
    let dateFilter = '';
    const now = new Date();
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = weekAgo.toISOString();
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = monthAgo.toISOString();
    }

    // Build category filter
    const categoryCondition = category ? sql`AND b.category = ${category}` : sql``;
    const dateCondition = dateFilter ? sql`AND b.completed_at >= ${dateFilter}` : sql``;

    // Get battle stats for each user
    const leaderboard = await sql`
      WITH battle_stats AS (
        SELECT
          u.wallet_address,
          u.username,
          u.avatar_url,
          u.level,
          COUNT(DISTINCT CASE WHEN b.winner_wallet = u.wallet_address THEN b.id END)::int as wins,
          COUNT(DISTINCT CASE
            WHEN b.status = 'completed'
            AND (b.challenger_wallet = u.wallet_address OR b.opponent_wallet = u.wallet_address)
            AND b.winner_wallet != u.wallet_address
            THEN b.id
          END)::int as losses,
          COUNT(DISTINCT CASE
            WHEN b.status = 'completed'
            AND (b.challenger_wallet = u.wallet_address OR b.opponent_wallet = u.wallet_address)
            THEN b.id
          END)::int as total_battles,
          COUNT(DISTINCT bs.id)::int as total_submissions,
          COALESCE(SUM(CASE WHEN b.winner_wallet = u.wallet_address THEN b.stake_amount ELSE 0 END), 0) as total_winnings
        FROM user_profiles u
        LEFT JOIN battles b ON (
          (b.challenger_wallet = u.wallet_address OR b.opponent_wallet = u.wallet_address)
          AND b.status = 'completed'
          ${dateCondition}
          ${categoryCondition}
        )
        LEFT JOIN battle_submissions bs ON bs.user_wallet = u.wallet_address
        GROUP BY u.wallet_address, u.username, u.avatar_url, u.level
        HAVING COUNT(DISTINCT CASE
          WHEN b.status = 'completed'
          AND (b.challenger_wallet = u.wallet_address OR b.opponent_wallet = u.wallet_address)
          THEN b.id
        END) > 0
      )
      SELECT
        wallet_address,
        username,
        avatar_url,
        level,
        wins,
        losses,
        total_battles,
        total_submissions,
        total_winnings,
        CASE WHEN total_battles > 0
          THEN ROUND((wins::numeric / total_battles::numeric) * 100, 1)
          ELSE 0
        END as win_rate,
        -- Calculate a score: wins * 3 + (win_rate * 0.5)
        (wins * 3 + CASE WHEN total_battles > 0
          THEN (wins::numeric / total_battles::numeric) * 50
          ELSE 0
        END)::int as score
      FROM battle_stats
      ORDER BY score DESC, wins DESC, total_battles DESC
      LIMIT ${limit}
    `;

    // Add ranks
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      wallet: entry.wallet_address,
      name: entry.username || `User_${entry.wallet_address?.slice(0, 6)}`,
      avatar: entry.avatar_url || entry.username?.charAt(0)?.toUpperCase() || 'U',
      level: entry.level || 1,
      wins: entry.wins,
      losses: entry.losses,
      totalBattles: entry.total_battles,
      winRate: parseFloat(entry.win_rate),
      totalSubmissions: entry.total_submissions,
      totalWinnings: entry.total_winnings,
      score: entry.score
    }));

    // Get some overall stats
    const statsResult = await sql`
      SELECT
        COUNT(DISTINCT id)::int as total_battles,
        COUNT(DISTINCT CASE WHEN status = 'voting' THEN id END)::int as active_voting,
        COUNT(DISTINCT CASE WHEN status = 'active' THEN id END)::int as active_battles,
        COUNT(DISTINCT challenger_wallet)::int + COUNT(DISTINCT opponent_wallet)::int as unique_battlers
      FROM battles
      ${dateFilter ? sql`WHERE created_at >= ${dateFilter}` : sql``}
    `;

    const stats = statsResult[0] || {
      total_battles: 0,
      active_voting: 0,
      active_battles: 0,
      unique_battlers: 0
    };

    return new Response(JSON.stringify({
      success: true,
      period,
      category: category || 'all',
      leaderboard: rankedLeaderboard,
      stats: {
        totalBattles: stats.total_battles,
        activeVoting: stats.active_voting,
        activeBattles: stats.active_battles,
        uniqueBattlers: stats.unique_battlers
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch leaderboard',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
