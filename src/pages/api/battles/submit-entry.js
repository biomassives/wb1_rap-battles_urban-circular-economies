/**
 * POST /api/battles/submit-entry
 * Submit a battle entry (verse/round submission)
 *
 * Body:
 * - battleId: string (required)
 * - userWallet: string (required)
 * - round: number (required) - 1, 2, 3, etc.
 * - audioUrl: string (required) - URL to audio file
 * - lyrics: string (optional) - Lyrics text
 * - roundType: string (optional) - 'opener', 'verse1', 'rebuttal', 'closer', etc.
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
    const {
      battleId,
      userWallet,
      round,
      audioUrl,
      lyrics = null,
      roundType = 'verse'
    } = body;

    // Validate required fields
    if (!battleId || !userWallet || !round || !audioUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'battleId, userWallet, round, and audioUrl are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    // Get battle to verify it exists and user is a participant
    const battles = await sql`
      SELECT id, challenger_wallet, opponent_wallet, status, rounds
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

    // Check if user is a participant
    if (userWallet !== battle.challenger_wallet && userWallet !== battle.opponent_wallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only battle participants can submit entries'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check battle status allows submissions
    if (!['pending', 'active'].includes(battle.status)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot submit to battle with status: ${battle.status}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check round is valid
    if (round < 1 || round > battle.rounds) {
      return new Response(JSON.stringify({
        success: false,
        error: `Round must be between 1 and ${battle.rounds}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user already submitted for this round
    const existingSubmission = await sql`
      SELECT id FROM battle_submissions
      WHERE battle_id = ${battleId} AND user_wallet = ${userWallet} AND round = ${round}
    `;

    if (existingSubmission.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have already submitted for this round'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert submission
    const result = await sql`
      INSERT INTO battle_submissions (battle_id, user_wallet, round, audio_url, lyrics)
      VALUES (${battleId}, ${userWallet}, ${round}, ${audioUrl}, ${lyrics})
      RETURNING id, submitted_at
    `;

    const submissionId = result[0].id;
    const submittedAt = result[0].submitted_at;

    // Count submissions to check if battle should become active or move to voting
    const allSubmissions = await sql`
      SELECT user_wallet, round FROM battle_submissions
      WHERE battle_id = ${battleId}
    `;

    const challengerSubmissions = allSubmissions.filter(s => s.user_wallet === battle.challenger_wallet);
    const opponentSubmissions = allSubmissions.filter(s => s.user_wallet === battle.opponent_wallet);

    let newStatus = battle.status;
    let statusMessage = null;

    // If both have submitted at least once, make battle active
    if (battle.status === 'pending' &&
        challengerSubmissions.length > 0 &&
        opponentSubmissions.length > 0) {
      newStatus = 'active';
      statusMessage = 'Battle is now active!';
    }

    // If all rounds completed by both, move to voting
    if (challengerSubmissions.length >= battle.rounds &&
        opponentSubmissions.length >= battle.rounds) {
      newStatus = 'voting';
      statusMessage = 'All rounds complete! Battle is now open for voting.';
    }

    // Update battle status if changed
    if (newStatus !== battle.status) {
      await sql`
        UPDATE battles
        SET status = ${newStatus}, updated_at = NOW()
        WHERE id = ${battleId}
      `;
    }

    // Award XP for submission (25 XP)
    try {
      await sql`
        INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
        VALUES (
          ${userWallet},
          'battle_submission',
          25,
          'Submitted a battle verse',
          ${JSON.stringify({ battleId, round, roundType })}
        )
      `;

      await sql`
        UPDATE user_profiles
        SET xp = xp + 25, updated_at = NOW()
        WHERE wallet_address = ${userWallet}
      `;
    } catch (xpError) {
      console.warn('Failed to award XP:', xpError.message);
    }

    // Log activity
    try {
      await sql`
        INSERT INTO activity_log (wallet_address, activity_type, activity_data)
        VALUES (
          ${userWallet},
          'battle_submission',
          ${JSON.stringify({
            battle_id: battleId,
            submission_id: submissionId,
            round,
            round_type: roundType,
            has_lyrics: !!lyrics
          })}
        )
      `;
    } catch (logError) {
      console.warn('Failed to log activity:', logError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Entry submitted successfully',
      submission: {
        id: submissionId,
        battleId,
        round,
        roundType,
        audioUrl,
        hasLyrics: !!lyrics,
        submittedAt
      },
      battleStatus: newStatus,
      statusMessage,
      xpAwarded: 25
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error submitting entry:', error);

    // Handle unique constraint violation
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have already submitted for this round'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
