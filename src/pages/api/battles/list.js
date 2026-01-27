/**
 * GET /api/battles/list
 * List battles with filtering options
 *
 * Query params:
 * - status: 'pending' | 'active' | 'voting' | 'completed' | 'all' (default: 'voting')
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 * - walletAddress: string (optional, to check user's votes)
 */

import { neon } from '@neondatabase/serverless';

export const prerender = false;

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'voting';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const walletAddress = url.searchParams.get('walletAddress');

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    // Build status filter
    let statusFilter = '';
    if (status !== 'all') {
      statusFilter = `WHERE b.status = '${status}'`;
    }

    // Get battles with contestant info and vote counts
    const battles = await sql`
      SELECT
        b.id,
        b.challenger_wallet,
        b.opponent_wallet,
        b.category,
        b.rounds,
        b.bars_per_round,
        b.time_limit,
        b.status,
        b.stake_amount,
        b.stake_currency,
        b.winner_wallet,
        b.created_at,
        b.expires_at,
        b.completed_at,

        -- Challenger info
        challenger.username as challenger_name,
        challenger.avatar_url as challenger_avatar,

        -- Opponent info
        opponent.username as opponent_name,
        opponent.avatar_url as opponent_avatar,

        -- Vote counts
        COALESCE(
          (SELECT COUNT(*) FROM battle_votes WHERE battle_id = b.id AND winner_wallet = b.challenger_wallet),
          0
        )::int as challenger_votes,
        COALESCE(
          (SELECT COUNT(*) FROM battle_votes WHERE battle_id = b.id AND winner_wallet = b.opponent_wallet),
          0
        )::int as opponent_votes,
        COALESCE(
          (SELECT COUNT(*) FROM battle_votes WHERE battle_id = b.id),
          0
        )::int as total_votes,

        -- Submission counts
        COALESCE(
          (SELECT COUNT(*) FROM battle_submissions WHERE battle_id = b.id),
          0
        )::int as submission_count

      FROM battles b
      LEFT JOIN user_profiles challenger ON b.challenger_wallet = challenger.wallet_address
      LEFT JOIN user_profiles opponent ON b.opponent_wallet = opponent.wallet_address
      ${status !== 'all' ? sql`WHERE b.status = ${status}` : sql``}
      ORDER BY
        CASE b.status
          WHEN 'voting' THEN 1
          WHEN 'active' THEN 2
          WHEN 'pending' THEN 3
          ELSE 4
        END,
        b.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // If wallet provided, get user's votes
    let userVotes = {};
    if (walletAddress) {
      const votes = await sql`
        SELECT battle_id, winner_wallet
        FROM battle_votes
        WHERE voter_wallet = ${walletAddress}
      `;

      votes.forEach(vote => {
        userVotes[vote.battle_id] = vote.winner_wallet;
      });
    }

    // Get total count for pagination
    const countResult = await sql`
      SELECT COUNT(*)::int as total
      FROM battles
      ${status !== 'all' ? sql`WHERE status = ${status}` : sql``}
    `;
    const totalCount = countResult[0]?.total || 0;

    // Transform battles for frontend
    const transformedBattles = battles.map(battle => ({
      id: battle.id,
      title: `${battle.challenger_name || 'Challenger'} vs ${battle.opponent_name || 'Opponent'}`,
      category: battle.category,
      status: battle.status,
      rounds: battle.rounds,
      barsPerRound: battle.bars_per_round,
      timeLimit: battle.time_limit,
      stake: battle.stake_amount ? {
        amount: battle.stake_amount,
        currency: battle.stake_currency
      } : null,
      winner: battle.winner_wallet,
      createdAt: battle.created_at,
      expiresAt: battle.expires_at,
      completedAt: battle.completed_at,
      contestantA: {
        wallet: battle.challenger_wallet,
        name: battle.challenger_name || `User_${battle.challenger_wallet?.slice(0, 6)}`,
        avatar: battle.challenger_avatar || battle.challenger_name?.charAt(0)?.toUpperCase() || 'C'
      },
      contestantB: battle.opponent_wallet ? {
        wallet: battle.opponent_wallet,
        name: battle.opponent_name || `User_${battle.opponent_wallet?.slice(0, 6)}`,
        avatar: battle.opponent_avatar || battle.opponent_name?.charAt(0)?.toUpperCase() || 'O'
      } : null,
      votes: {
        A: battle.challenger_votes,
        B: battle.opponent_votes,
        total: battle.total_votes
      },
      submissionCount: battle.submission_count,
      userVote: userVotes[battle.id] ?
        (userVotes[battle.id] === battle.challenger_wallet ? 'A' : 'B') : null
    }));

    return new Response(JSON.stringify({
      success: true,
      battles: transformedBattles,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching battles:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch battles',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
