/**
 * Join Challenge by Invite Code
 * GET /api/challenges/join/[code] - Get challenge info by invite code
 * POST /api/challenges/join/[code] - Join a challenge
 *
 * POST Body:
 * - wallet: string (required)
 */

import { neon } from '@neondatabase/serverless';

export const prerender = false;

export async function POST({ params, request }) {
  try {
    const { code } = params;
    const data = await request.json();
    const { wallet } = data;

    if (!code) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid invite code'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!wallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);
    const inviteCode = code.toUpperCase();

    // Look up challenge by invite code
    const challenges = await sql`
      SELECT c.*,
        (SELECT COUNT(*)::int FROM challenge_participants WHERE challenge_id = c.id AND status = 'accepted') as participant_count,
        creator.username as creator_name,
        creator.avatar_url as creator_avatar
      FROM challenges c
      LEFT JOIN user_profiles creator ON c.creator_wallet = creator.wallet_address
      WHERE c.invite_code = ${inviteCode}
    `;

    if (challenges.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Challenge not found. Check the invite code and try again.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const challenge = challenges[0];

    // Check if expired
    if (challenge.expires_at && new Date(challenge.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This challenge has expired'
      }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if already full
    if (challenge.participant_count >= challenge.max_participants) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This challenge is full'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if challenge is in a joinable state
    const joinableStatuses = ['pending', 'accepted'];
    if (!joinableStatuses.includes(challenge.status)) {
      return new Response(JSON.stringify({
        success: false,
        error: `This challenge is already ${challenge.status}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if already a participant
    const existing = await sql`
      SELECT id FROM challenge_participants
      WHERE challenge_id = ${challenge.id} AND wallet_address = ${wallet}
    `;

    if (existing.length > 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Already joined this challenge',
        challenge: formatChallenge(challenge),
        alreadyJoined: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add participant
    await sql`
      INSERT INTO challenge_participants (challenge_id, wallet_address, role, status)
      VALUES (${challenge.id}, ${wallet}, 'challenger', 'accepted')
    `;

    // If we've met minimum participants, update status to accepted
    const newCount = challenge.participant_count + 1;
    if (newCount >= challenge.min_participants && challenge.status === 'pending') {
      await sql`
        UPDATE challenges SET status = 'accepted' WHERE id = ${challenge.id}
      `;
      challenge.status = 'accepted';
    }

    // Log activity
    try {
      await sql`
        INSERT INTO activity_log (wallet_address, activity_type, activity_data)
        VALUES (
          ${wallet},
          'challenge_joined',
          ${JSON.stringify({ challenge_id: challenge.id, invite_code: inviteCode })}
        )
      `;
    } catch (logError) {
      console.warn('Failed to log activity:', logError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully joined the challenge!',
      challenge: formatChallenge(challenge),
      participantCount: newCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Join challenge error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to join challenge',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET({ params }) {
  try {
    const { code } = params;
    const inviteCode = code?.toUpperCase();

    if (!inviteCode) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid invite code'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    const challenges = await sql`
      SELECT c.*,
        (SELECT COUNT(*)::int FROM challenge_participants WHERE challenge_id = c.id AND status = 'accepted') as participant_count,
        creator.username as creator_name,
        creator.avatar_url as creator_avatar,
        creator.level as creator_level
      FROM challenges c
      LEFT JOIN user_profiles creator ON c.creator_wallet = creator.wallet_address
      WHERE c.invite_code = ${inviteCode}
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

    return new Response(JSON.stringify({
      success: true,
      challenge: formatChallenge(challenges[0])
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get challenge error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch challenge',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function formatChallenge(c) {
  return {
    id: c.id,
    inviteCode: c.invite_code,
    title: c.title,
    description: c.description,
    type: c.type,
    mode: c.mode,
    category: c.category,
    stakes: { type: c.stakes_type, amount: c.stakes_amount },
    hasBeat: !!c.beat_config,
    beatAudioUrl: c.beat_audio_url,
    maxParticipants: c.max_participants,
    participantCount: c.participant_count,
    status: c.status,
    isPublic: c.is_public,
    createdAt: c.created_at,
    expiresAt: c.expires_at,
    joinUrl: `/challenge/join/${c.invite_code}`,
    creator: {
      wallet: c.creator_wallet,
      name: c.creator_name || `User_${c.creator_wallet?.slice(0, 6)}`,
      avatar: c.creator_avatar || c.creator_name?.charAt(0)?.toUpperCase() || 'C'
    },
    timeRemaining: c.expires_at ? Math.max(0, new Date(c.expires_at) - Date.now()) : null
  };
}
