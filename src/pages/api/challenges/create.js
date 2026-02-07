/**
 * POST /api/challenges/create
 * Create a new challenge with invite code
 *
 * Body:
 * - creatorWallet: string (required)
 * - title: string (required)
 * - description: string (optional)
 * - type: string (default: 'rap_battle')
 * - mode: string (default: '1v1')
 * - category: string (default: 'freestyle')
 * - stakesType: string (default: 'xp')
 * - stakesAmount: number (default: 50)
 * - beatConfig: object (optional - from beat playground)
 * - beatAudioUrl: string (optional - exported mix URL)
 * - maxParticipants: number (default: 2)
 * - durationHours: number (default: 72)
 * - isPublic: boolean (default: true)
 */

import { neon } from '@neondatabase/serverless';

export const prerender = false;

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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
      creatorWallet,
      title,
      description = null,
      type = 'rap_battle',
      mode = '1v1',
      category = 'freestyle',
      stakesType = 'xp',
      stakesAmount = 50,
      beatConfig = null,
      beatAudioUrl = null,
      maxParticipants = 2,
      durationHours = 72,
      isPublic = true
    } = body;

    if (!creatorWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'creatorWallet is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!title || title.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'title is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validTypes = ['rap_battle', 'beat_battle', 'remix_challenge', 'freestyle', 'learning_race', 'eco_challenge'];
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({
        success: false,
        error: `type must be one of: ${validTypes.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validModes = ['1v1', 'group', 'open'];
    if (!validModes.includes(mode)) {
      return new Response(JSON.stringify({
        success: false,
        error: `mode must be one of: ${validModes.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const inviteCode = generateInviteCode();
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    const minParticipants = mode === '1v1' ? 2 : 2;

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    // Insert challenge
    const result = await sql`
      INSERT INTO challenges (
        invite_code, creator_wallet, title, description,
        type, mode, category,
        stakes_type, stakes_amount,
        beat_config, beat_audio_url,
        max_participants, min_participants,
        status, duration_hours,
        expires_at, is_public
      ) VALUES (
        ${inviteCode}, ${creatorWallet}, ${title.trim()}, ${description},
        ${type}, ${mode}, ${category},
        ${stakesType}, ${stakesAmount},
        ${beatConfig ? JSON.stringify(beatConfig) : null}, ${beatAudioUrl},
        ${maxParticipants}, ${minParticipants},
        'pending', ${durationHours},
        ${expiresAt.toISOString()}, ${isPublic}
      )
      RETURNING id, created_at
    `;

    const challengeId = result[0].id;

    // Add creator as first participant
    await sql`
      INSERT INTO challenge_participants (challenge_id, wallet_address, role, status)
      VALUES (${challengeId}, ${creatorWallet}, 'creator', 'accepted')
    `;

    // Get creator info
    const creatorInfo = await sql`
      SELECT username, avatar_url, level
      FROM user_profiles
      WHERE wallet_address = ${creatorWallet}
    `;

    const creator = creatorInfo[0] || {
      username: `User_${creatorWallet.slice(0, 6)}`,
      avatar_url: null,
      level: 1
    };

    // Log activity
    try {
      await sql`
        INSERT INTO activity_log (wallet_address, activity_type, activity_data)
        VALUES (
          ${creatorWallet},
          'challenge_created',
          ${JSON.stringify({
            challenge_id: challengeId,
            invite_code: inviteCode,
            type,
            mode,
            stakes: { type: stakesType, amount: stakesAmount },
            has_beat: !!beatConfig
          })}
        )
      `;
    } catch (logError) {
      console.warn('Failed to log activity:', logError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Challenge created successfully',
      challenge: {
        id: challengeId,
        inviteCode,
        title: title.trim(),
        description,
        type,
        mode,
        category,
        stakes: { type: stakesType, amount: stakesAmount },
        beatConfig,
        beatAudioUrl,
        maxParticipants,
        minParticipants,
        status: 'pending',
        isPublic,
        durationHours,
        createdAt: result[0].created_at,
        expiresAt: expiresAt.toISOString(),
        joinUrl: `/challenge/join/${inviteCode}`,
        creator: {
          wallet: creatorWallet,
          name: creator.username,
          avatar: creator.avatar_url || creator.username?.charAt(0)?.toUpperCase() || 'C',
          level: creator.level
        },
        participantCount: 1
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating challenge:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create challenge',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
