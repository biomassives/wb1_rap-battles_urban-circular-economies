// /api/data/environmental/submit.js
// Submit environmental observation data

import { neon } from '@neondatabase/serverless';

// XP values for environmental observations
const XP_VALUES = {
  basic: 25,
  detailed: 50,  // Has photos + GPS + multiple data points
  biodiversity: 75,
  verified_bonus: 50
};

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      observationType,
      title,
      locationName,
      latitude,
      longitude,
      dataPayload,
      mediaUrls = [],
      tags = []
    } = body;

    // Validate required fields
    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!observationType) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Observation type is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validTypes = ['water_quality', 'biodiversity', 'pollution', 'climate', 'soil', 'air_quality', 'wildlife', 'vegetation'];
    if (!validTypes.includes(observationType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid observation type. Must be one of: ${validTypes.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!dataPayload || Object.keys(dataPayload).length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Data payload is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Determine if this is a detailed submission (more XP)
    const isDetailed = mediaUrls.length > 0 && latitude && longitude && Object.keys(dataPayload).length >= 3;
    const isBiodiversity = observationType === 'biodiversity' || observationType === 'wildlife';

    // Calculate base XP
    let baseXP = XP_VALUES.basic;
    if (isBiodiversity) {
      baseXP = XP_VALUES.biodiversity;
    } else if (isDetailed) {
      baseXP = XP_VALUES.detailed;
    }

    // Insert observation
    const result = await sql`
      INSERT INTO environmental_observations (
        wallet_address,
        observation_type,
        title,
        location_name,
        latitude,
        longitude,
        data_payload,
        media_urls,
        tags,
        xp_awarded,
        verification_status
      ) VALUES (
        ${walletAddress},
        ${observationType},
        ${title || null},
        ${locationName || null},
        ${latitude || null},
        ${longitude || null},
        ${JSON.stringify(dataPayload)},
        ${JSON.stringify(mediaUrls)},
        ${tags},
        ${baseXP},
        'pending'
      )
      RETURNING id, created_at
    `;

    const observation = result[0];

    // Award XP to user
    await sql`
      UPDATE user_profiles
      SET xp = xp + ${baseXP},
          updated_at = NOW()
      WHERE wallet_address = ${walletAddress}
    `.catch(() => {
      // User might not have profile yet, that's ok
    });

    // Log XP activity
    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
      VALUES (
        ${walletAddress},
        'environmental_observation',
        ${baseXP},
        ${`Submitted ${observationType} observation`},
        ${JSON.stringify({ observation_id: observation.id, type: observationType })}
      )
    `.catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      observation: {
        id: observation.id,
        type: observationType,
        status: 'pending',
        created_at: observation.created_at
      },
      xpEarned: baseXP,
      message: `Observation submitted! Earned ${baseXP} XP. Additional ${XP_VALUES.verified_bonus} XP when verified.`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error submitting observation:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit observation: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
