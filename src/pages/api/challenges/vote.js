/**
 * POST /api/challenges/vote
 * Vote on a challenge submission
 *
 * Body:
 * - challengeId: number (required)
 * - submissionId: number (required)
 * - voterWallet: string (required)
 */

import { neon } from '@neondatabase/serverless';

export const prerender = false;

export async function POST({ request }) {
  try {
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
    const { challengeId, submissionId, voterWallet } = body;

    if (!challengeId || !submissionId || !voterWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'challengeId, submissionId, and voterWallet are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    // Verify challenge is in voting state
    const challenges = await sql`
      SELECT id, status FROM challenges WHERE id = ${challengeId}
    `;

    if (challenges.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Challenge not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (challenges[0].status !== 'voting') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Challenge is not in voting phase'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify submission belongs to this challenge
    const submissions = await sql`
      SELECT id, participant_wallet FROM challenge_submissions
      WHERE id = ${submissionId} AND challenge_id = ${challengeId}
    `;

    if (submissions.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Submission not found in this challenge'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prevent self-voting
    if (submissions[0].participant_wallet === voterWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot vote for your own submission'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert vote (UNIQUE constraint prevents double voting)
    try {
      await sql`
        INSERT INTO challenge_votes (challenge_id, submission_id, voter_wallet)
        VALUES (${challengeId}, ${submissionId}, ${voterWallet})
      `;
    } catch (e) {
      if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'You have already voted in this challenge'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw e;
    }

    // Update vote count on submission
    await sql`
      UPDATE challenge_submissions
      SET vote_count = (
        SELECT COUNT(*) FROM challenge_votes WHERE submission_id = ${submissionId}
      )
      WHERE id = ${submissionId}
    `;

    // Get updated vote counts for all submissions
    const voteCounts = await sql`
      SELECT cs.id, cs.participant_wallet, cs.vote_count,
        u.username as participant_name
      FROM challenge_submissions cs
      LEFT JOIN user_profiles u ON cs.participant_wallet = u.wallet_address
      WHERE cs.challenge_id = ${challengeId}
      ORDER BY cs.vote_count DESC
    `;

    // Award XP for voting
    const xpAwarded = 15;
    try {
      await sql`
        INSERT INTO activity_log (wallet_address, activity_type, activity_data, xp_earned)
        VALUES (
          ${voterWallet},
          'challenge_vote',
          ${JSON.stringify({ challenge_id: challengeId, submission_id: submissionId })},
          ${xpAwarded}
        )
      `;
      await sql`
        UPDATE user_profiles SET xp = xp + ${xpAwarded}, updated_at = NOW()
        WHERE wallet_address = ${voterWallet}
      `;
      await sql`
        INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
        VALUES (
          ${voterWallet}, 'challenge_vote', ${xpAwarded},
          'Voted on a challenge submission',
          ${JSON.stringify({ challenge_id: challengeId, submission_id: submissionId })}
        )
      `;
    } catch (logError) {
      console.warn('Failed to log activity/award XP:', logError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Vote recorded',
      xpAwarded,
      voteCounts: voteCounts.map(v => ({
        submissionId: v.id,
        participantWallet: v.participant_wallet,
        participantName: v.participant_name || `User_${v.participant_wallet?.slice(0, 6)}`,
        votes: v.vote_count
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error voting on challenge:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to record vote',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
