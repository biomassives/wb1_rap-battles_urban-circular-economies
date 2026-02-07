/**
 * POST /api/battles/create
 * Create a new battle
 *
 * Body:
 * - challengerWallet: string (required)
 * - opponentWallet: string (optional - null for open challenge)
 * - category: string (default: 'freestyle')
 * - rounds: number (default: 1)
 * - barsPerRound: number (default: 16)
 * - timeLimit: string (default: '24h')
 * - stakeAmount: number (optional)
 * - stakeCurrency: 'XP' | 'SOL' (default: 'XP')
 * - title: string (optional - custom battle title)
 * - beatConfig: object (optional - beat playground config)
 * - beatAudioUrl: string (optional - exported mix audio URL)
 * - challengeId: number (optional - linked challenge ID)
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
      challengerWallet,
      opponentWallet = null,
      category = 'freestyle',
      rounds = 1,
      barsPerRound = 16,
      timeLimit = '24h',
      stakeAmount = null,
      stakeCurrency = 'XP',
      title = null,
      beatConfig = null,
      beatAudioUrl = null,
      challengeId = null
    } = body;

    // Validate required fields
    if (!challengerWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'challengerWallet is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate category
    const validCategories = ['conscious', 'wordplay', 'flow', 'freestyle', 'storytelling'];
    if (!validCategories.includes(category)) {
      return new Response(JSON.stringify({
        success: false,
        error: `category must be one of: ${validCategories.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate rounds
    if (rounds < 1 || rounds > 5) {
      return new Response(JSON.stringify({
        success: false,
        error: 'rounds must be between 1 and 5'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate expiry
    const timeLimitHours = parseInt(timeLimit) || 24;
    const expiresAt = new Date(Date.now() + timeLimitHours * 60 * 60 * 1000);

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    // Create battle
    const result = await sql`
      INSERT INTO battles (
        challenger_wallet,
        opponent_wallet,
        category,
        rounds,
        bars_per_round,
        time_limit,
        stake_amount,
        stake_currency,
        status,
        expires_at,
        beat_config,
        beat_audio_url,
        challenge_id,
        title
      ) VALUES (
        ${challengerWallet},
        ${opponentWallet},
        ${category},
        ${rounds},
        ${barsPerRound},
        ${timeLimit},
        ${stakeAmount},
        ${stakeCurrency},
        ${opponentWallet ? 'pending' : 'pending'},
        ${expiresAt.toISOString()},
        ${beatConfig ? JSON.stringify(beatConfig) : null},
        ${beatAudioUrl},
        ${challengeId},
        ${title}
      )
      RETURNING id, created_at
    `;

    const battleId = result[0].id;
    const createdAt = result[0].created_at;

    // Get challenger info
    const challengerInfo = await sql`
      SELECT username, avatar_url, level
      FROM user_profiles
      WHERE wallet_address = ${challengerWallet}
    `;

    const challenger = challengerInfo[0] || {
      username: `User_${challengerWallet.slice(0, 6)}`,
      avatar_url: null,
      level: 1
    };

    // Log activity
    try {
      await sql`
        INSERT INTO activity_log (wallet_address, activity_type, activity_data)
        VALUES (
          ${challengerWallet},
          'battle_created',
          ${JSON.stringify({
            battle_id: battleId,
            category,
            rounds,
            opponent: opponentWallet,
            stake: stakeAmount ? { amount: stakeAmount, currency: stakeCurrency } : null
          })}
        )
      `;
    } catch (logError) {
      console.warn('Failed to log activity:', logError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Battle created successfully',
      battle: {
        id: battleId,
        title: title || `${challenger.username} Battle Challenge`,
        challengerWallet,
        opponentWallet,
        category,
        rounds,
        barsPerRound,
        timeLimit,
        stake: stakeAmount ? { amount: stakeAmount, currency: stakeCurrency } : null,
        status: 'pending',
        createdAt,
        expiresAt: expiresAt.toISOString(),
        challenger: {
          wallet: challengerWallet,
          name: challenger.username,
          avatar: challenger.avatar_url || challenger.username?.charAt(0)?.toUpperCase() || 'C',
          level: challenger.level
        }
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating battle:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create battle',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
