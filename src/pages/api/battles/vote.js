/**
 * POST /api/battles/vote
 * Submit a vote for a battle
 *
 * Body:
 * - battleId: string (required)
 * - voterWallet: string (required)
 * - vote: 'A' | 'B' (required) - A = challenger, B = opponent
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
    const { battleId, voterWallet, vote } = body;

    // Validate required fields
    if (!battleId || !voterWallet || !vote) {
      return new Response(JSON.stringify({
        success: false,
        error: 'battleId, voterWallet, and vote are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['A', 'B'].includes(vote)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'vote must be either "A" or "B"'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    // Get battle to verify it exists and is in voting status
    const battles = await sql`
      SELECT id, challenger_wallet, opponent_wallet, status
      FROM battles
      WHERE id = ${battleId}
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

    // Check battle status
    if (battle.status !== 'voting') {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot vote on battle with status: ${battle.status}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check voter is not a participant
    if (voterWallet === battle.challenger_wallet || voterWallet === battle.opponent_wallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Participants cannot vote on their own battle'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine winner wallet based on vote
    const winnerWallet = vote === 'A' ? battle.challenger_wallet : battle.opponent_wallet;

    // Check if user already voted (will be caught by unique constraint, but check anyway)
    const existingVote = await sql`
      SELECT id FROM battle_votes
      WHERE battle_id = ${battleId} AND voter_wallet = ${voterWallet}
    `;

    if (existingVote.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have already voted on this battle'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert vote
    await sql`
      INSERT INTO battle_votes (battle_id, voter_wallet, winner_wallet)
      VALUES (${battleId}, ${voterWallet}, ${winnerWallet})
    `;

    // Get updated vote counts
    const voteCounts = await sql`
      SELECT
        winner_wallet,
        COUNT(*)::int as count
      FROM battle_votes
      WHERE battle_id = ${battleId}
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

    // Award XP for voting (10 XP)
    try {
      await sql`
        INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
        VALUES (
          ${voterWallet},
          'battle_vote',
          10,
          'Voted on a rap battle',
          ${JSON.stringify({ battleId, vote })}
        )
      `;

      // Update user XP
      await sql`
        UPDATE user_profiles
        SET xp = xp + 10, updated_at = NOW()
        WHERE wallet_address = ${voterWallet}
      `;
    } catch (xpError) {
      // XP award is optional, don't fail the vote
      console.warn('Failed to award XP:', xpError.message);
    }

    // Log activity
    try {
      await sql`
        INSERT INTO activity_log (wallet_address, activity_type, activity_data)
        VALUES (
          ${voterWallet},
          'battle_vote',
          ${JSON.stringify({
            battle_id: battleId,
            vote,
            winner_wallet: winnerWallet,
            timestamp: new Date().toISOString()
          })}
        )
      `;
    } catch (logError) {
      console.warn('Failed to log activity:', logError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Vote recorded successfully',
      votes,
      xpAwarded: 10
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error submitting vote:', error);

    // Handle unique constraint violation
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have already voted on this battle'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit vote',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
