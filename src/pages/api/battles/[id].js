/**
 * GET /api/battles/[id]
 * Get detailed battle information including submissions
 *
 * Query params:
 * - walletAddress: string (optional, to check if user voted)
 */

import { neon } from '@neondatabase/serverless';

export const prerender = false;

export async function GET({ params, request }) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Battle ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    // Get battle details
    const battles = await sql`
      SELECT
        b.*,
        challenger.username as challenger_name,
        challenger.avatar_url as challenger_avatar,
        challenger.level as challenger_level,
        opponent.username as opponent_name,
        opponent.avatar_url as opponent_avatar,
        opponent.level as opponent_level
      FROM battles b
      LEFT JOIN user_profiles challenger ON b.challenger_wallet = challenger.wallet_address
      LEFT JOIN user_profiles opponent ON b.opponent_wallet = opponent.wallet_address
      WHERE b.id = ${id}
    `;

    if (battles.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Battle not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const battle = battles[0];

    // Get submissions for this battle
    const submissions = await sql`
      SELECT
        bs.*,
        u.username,
        u.avatar_url
      FROM battle_submissions bs
      LEFT JOIN user_profiles u ON bs.user_wallet = u.wallet_address
      WHERE bs.battle_id = ${id}
      ORDER BY bs.round, bs.submitted_at
    `;

    // Get vote counts
    const voteCounts = await sql`
      SELECT
        winner_wallet,
        COUNT(*)::int as count
      FROM battle_votes
      WHERE battle_id = ${id}
      GROUP BY winner_wallet
    `;

    const votes = {
      A: 0,
      B: 0,
      total: 0
    };

    voteCounts.forEach(vc => {
      if (vc.winner_wallet === battle.challenger_wallet) {
        votes.A = vc.count;
      } else if (vc.winner_wallet === battle.opponent_wallet) {
        votes.B = vc.count;
      }
      votes.total += vc.count;
    });

    // Check if user has voted
    let userVote = null;
    if (walletAddress) {
      const userVoteResult = await sql`
        SELECT winner_wallet
        FROM battle_votes
        WHERE battle_id = ${id} AND voter_wallet = ${walletAddress}
      `;

      if (userVoteResult.length > 0) {
        userVote = userVoteResult[0].winner_wallet === battle.challenger_wallet ? 'A' : 'B';
      }
    }

    // Organize submissions by contestant
    const contestantASubmissions = submissions.filter(s => s.user_wallet === battle.challenger_wallet);
    const contestantBSubmissions = submissions.filter(s => s.user_wallet === battle.opponent_wallet);

    // Build timeline (interleaved submissions)
    const timeline = [];
    const maxRounds = Math.max(
      contestantASubmissions.length,
      contestantBSubmissions.length
    );

    for (let i = 0; i < maxRounds; i++) {
      if (contestantASubmissions[i]) {
        timeline.push({
          ...contestantASubmissions[i],
          contestant: 'A',
          contestantName: battle.challenger_name || `User_${battle.challenger_wallet?.slice(0, 6)}`
        });
      }
      if (contestantBSubmissions[i]) {
        timeline.push({
          ...contestantBSubmissions[i],
          contestant: 'B',
          contestantName: battle.opponent_name || `User_${battle.opponent_wallet?.slice(0, 6)}`
        });
      }
    }

    // Transform response
    const response = {
      id: battle.id,
      title: `${battle.challenger_name || 'Challenger'} vs ${battle.opponent_name || 'Opponent'}`,
      category: battle.category,
      status: battle.status,
      rounds: battle.rounds,
      currentRound: Math.ceil(submissions.length / 2),
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
        avatar: battle.challenger_avatar || battle.challenger_name?.charAt(0)?.toUpperCase() || 'C',
        level: battle.challenger_level || 1,
        entries: contestantASubmissions.map(s => ({
          id: s.id,
          round: s.round,
          audioUrl: s.audio_url,
          lyrics: s.lyrics,
          submittedAt: s.submitted_at
        }))
      },

      contestantB: battle.opponent_wallet ? {
        wallet: battle.opponent_wallet,
        name: battle.opponent_name || `User_${battle.opponent_wallet?.slice(0, 6)}`,
        avatar: battle.opponent_avatar || battle.opponent_name?.charAt(0)?.toUpperCase() || 'O',
        level: battle.opponent_level || 1,
        entries: contestantBSubmissions.map(s => ({
          id: s.id,
          round: s.round,
          audioUrl: s.audio_url,
          lyrics: s.lyrics,
          submittedAt: s.submitted_at
        }))
      } : null,

      timeline: timeline.map(t => ({
        id: t.id,
        contestant: t.contestant,
        contestantName: t.contestantName,
        round: t.round,
        audioUrl: t.audio_url,
        lyrics: t.lyrics,
        submittedAt: t.submitted_at
      })),

      votes,
      userVote,

      // Voting eligibility
      canVote: walletAddress &&
               battle.status === 'voting' &&
               walletAddress !== battle.challenger_wallet &&
               walletAddress !== battle.opponent_wallet &&
               !userVote
    };

    return new Response(JSON.stringify({
      success: true,
      battle: response
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching battle:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch battle',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
