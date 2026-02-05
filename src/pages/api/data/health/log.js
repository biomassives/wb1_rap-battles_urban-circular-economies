// /api/data/health/log.js
// Log health/biometric observations (privacy-first)

import { neon } from '@neondatabase/serverless';

const XP_VALUES = {
  activity: 10,
  wellness: 15,
  nutrition: 10,
  sleep: 10,
  exercise: 15,
  daily_streak_bonus: 5
};

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      observationType,
      dataPayload,
      privacyLevel = 'private',
      dataSource = 'manual',
      recordedDate
    } = body;

    // Validate required fields
    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validTypes = ['activity', 'wellness', 'nutrition', 'sleep', 'mental_health', 'vitals', 'exercise'];
    if (!observationType || !validTypes.includes(observationType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid observation type. Must be one of: ${validTypes.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validPrivacy = ['private', 'anonymous_aggregate', 'research_consent'];
    if (!validPrivacy.includes(privacyLevel)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid privacy level. Must be one of: ${validPrivacy.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!dataPayload || Object.keys(dataPayload).length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Data payload is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Calculate XP
    let xpEarned = XP_VALUES[observationType] || 10;

    // Check for daily streak bonus
    const lastLog = await sql`
      SELECT recorded_date
      FROM health_observations
      WHERE wallet_address = ${walletAddress}
      ORDER BY recorded_date DESC
      LIMIT 1
    `;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (lastLog.length > 0) {
      const lastDate = lastLog[0].recorded_date;
      if (lastDate === yesterday) {
        xpEarned += XP_VALUES.daily_streak_bonus;
      }
    }

    // Insert observation
    const result = await sql`
      INSERT INTO health_observations (
        wallet_address,
        observation_type,
        data_payload,
        privacy_level,
        data_source,
        xp_awarded,
        recorded_date
      ) VALUES (
        ${walletAddress},
        ${observationType},
        ${JSON.stringify(dataPayload)},
        ${privacyLevel},
        ${dataSource},
        ${xpEarned},
        ${recordedDate || today}
      )
      RETURNING id, created_at
    `;

    const observation = result[0];

    // Award XP
    await sql`
      UPDATE user_profiles
      SET xp = xp + ${xpEarned},
          updated_at = NOW()
      WHERE wallet_address = ${walletAddress}
    `.catch(() => {});

    // Log activity
    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description)
      VALUES (
        ${walletAddress},
        'health_log',
        ${xpEarned},
        ${`Logged ${observationType} data`}
      )
    `.catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      observation: {
        id: observation.id,
        type: observationType,
        privacyLevel,
        created_at: observation.created_at
      },
      xpEarned,
      message: `Health data logged! Earned ${xpEarned} XP.`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error logging health data:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to log health data'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - Retrieve user's health data summary
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  if (!walletAddress) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Wallet address is required'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get summary stats
    const stats = await sql`
      SELECT
        observation_type,
        COUNT(*) as count,
        SUM(xp_awarded) as total_xp,
        MAX(recorded_date) as last_logged
      FROM health_observations
      WHERE wallet_address = ${walletAddress}
      GROUP BY observation_type
    `;

    // Get recent entries (last 7 days)
    const recent = await sql`
      SELECT
        id,
        observation_type,
        data_payload,
        recorded_date,
        created_at
      FROM health_observations
      WHERE wallet_address = ${walletAddress}
        AND recorded_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY recorded_date DESC, created_at DESC
    `;

    // Calculate streak
    const dates = await sql`
      SELECT DISTINCT recorded_date
      FROM health_observations
      WHERE wallet_address = ${walletAddress}
      ORDER BY recorded_date DESC
      LIMIT 30
    `;

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (dates[i]?.recorded_date === expectedStr) {
        streak++;
      } else {
        break;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      stats,
      recent,
      streak,
      message: streak > 0 ? `You're on a ${streak}-day streak!` : 'Start logging to build your streak!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching health data:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch health data'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
