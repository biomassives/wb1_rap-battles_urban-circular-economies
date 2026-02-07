/**
 * POST /api/challenges/submit
 * Submit an entry to a challenge
 *
 * Body:
 * - challengeId: number (required)
 * - participantWallet: string (required)
 * - audioUrl: string (required)
 * - beatConfig: object (optional)
 * - description: string (optional)
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
    const {
      challengeId,
      participantWallet,
      audioUrl,
      beatConfig = null,
      description = null
    } = body;

    if (!challengeId || !participantWallet || !audioUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'challengeId, participantWallet, and audioUrl are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    // Verify challenge exists and is in a submittable state
    const challenges = await sql`
      SELECT id, status, expires_at FROM challenges WHERE id = ${challengeId}
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

    const challenge = challenges[0];
    const submittableStatuses = ['pending', 'accepted', 'in_progress'];
    if (!submittableStatuses.includes(challenge.status)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Challenge is ${challenge.status}, submissions are closed`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify participant is in the challenge
    const participants = await sql`
      SELECT id FROM challenge_participants
      WHERE challenge_id = ${challengeId}
        AND wallet_address = ${participantWallet}
        AND status = 'accepted'
    `;

    if (participants.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You must join this challenge before submitting'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert submission (UNIQUE constraint prevents duplicates)
    const result = await sql`
      INSERT INTO challenge_submissions (
        challenge_id, participant_wallet, audio_url, beat_config, description
      ) VALUES (
        ${challengeId}, ${participantWallet}, ${audioUrl},
        ${beatConfig ? JSON.stringify(beatConfig) : null}, ${description}
      )
      ON CONFLICT (challenge_id, participant_wallet)
      DO UPDATE SET
        audio_url = ${audioUrl},
        beat_config = ${beatConfig ? JSON.stringify(beatConfig) : null},
        description = ${description},
        submitted_at = NOW()
      RETURNING id, submitted_at
    `;

    // Check if all participants have submitted - if so, move to voting
    const submissionCount = await sql`
      SELECT COUNT(*)::int as count FROM challenge_submissions WHERE challenge_id = ${challengeId}
    `;
    const participantCount = await sql`
      SELECT COUNT(*)::int as count FROM challenge_participants
      WHERE challenge_id = ${challengeId} AND status = 'accepted'
    `;

    if (submissionCount[0].count >= participantCount[0].count && participantCount[0].count >= 2) {
      const votingEndsAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h voting period
      await sql`
        UPDATE challenges
        SET status = 'voting', voting_ends_at = ${votingEndsAt.toISOString()}
        WHERE id = ${challengeId} AND status != 'voting'
      `;
    } else if (challenge.status === 'pending' || challenge.status === 'accepted') {
      await sql`
        UPDATE challenges SET status = 'in_progress', started_at = NOW()
        WHERE id = ${challengeId} AND status IN ('pending', 'accepted')
      `;
    }

    // Award XP for submitting
    const xpAwarded = 30;
    try {
      await sql`
        INSERT INTO activity_log (wallet_address, activity_type, activity_data, xp_earned)
        VALUES (
          ${participantWallet},
          'challenge_submission',
          ${JSON.stringify({ challenge_id: challengeId, submission_id: result[0].id })},
          ${xpAwarded}
        )
      `;
      await sql`
        UPDATE user_profiles SET xp = xp + ${xpAwarded}, updated_at = NOW()
        WHERE wallet_address = ${participantWallet}
      `;
      await sql`
        INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
        VALUES (
          ${participantWallet}, 'challenge_submission', ${xpAwarded},
          'Submitted a challenge entry',
          ${JSON.stringify({ challenge_id: challengeId, submission_id: result[0].id })}
        )
      `;
    } catch (logError) {
      console.warn('Failed to log activity/award XP:', logError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Submission received',
      xpAwarded,
      submission: {
        id: result[0].id,
        challengeId,
        participantWallet,
        audioUrl,
        submittedAt: result[0].submitted_at
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error submitting to challenge:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit entry',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
