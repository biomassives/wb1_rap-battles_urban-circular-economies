/**
 * POST /api/data/citizen-science
 * Submit citizen science field data
 *
 * Body:
 * - walletAddress: string (required)
 * - dataType: string (required) — water_quality, species_count, weather_observation, soil_health, air_quality
 * - measurements: object (required) — JSONB of key/value measurements
 * - locationLat: number (optional)
 * - locationLng: number (optional)
 * - locationName: string (optional)
 * - photoUrls: string[] (optional)
 *
 * XP: 40 (submission) or 75 (verified by peer)
 */

import { neon } from '@neondatabase/serverless';
import { XP_ACTIVITIES } from '../../../lib/xp-config.js';

export const prerender = false;

const VALID_DATA_TYPES = [
  'water_quality',
  'species_count',
  'weather_observation',
  'soil_health',
  'air_quality',
  'biodiversity_survey',
  'pollution_report',
  'habitat_assessment'
];

export async function POST({ request }) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content-Type must be application/json'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const {
      walletAddress,
      dataType,
      measurements,
      locationLat = null,
      locationLng = null,
      locationName = null,
      photoUrls = []
    } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'walletAddress is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!dataType || !VALID_DATA_TYPES.includes(dataType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `dataType must be one of: ${VALID_DATA_TYPES.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!measurements || typeof measurements !== 'object' || Object.keys(measurements).length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'measurements must be a non-empty object of key/value data'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const dbUrl = process.env.DATABASE_URL || process.env.NILE_DATABASE_URL;
    if (!dbUrl) {
      return new Response(JSON.stringify({
        success: true,
        source: 'local_only',
        message: 'Database not configured, data tracked locally',
        xpAwarded: XP_ACTIVITIES.citizen_science_submission
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(dbUrl);

    const xpAmount = XP_ACTIVITIES.citizen_science_submission; // 40

    // Insert data
    const result = await sql`
      INSERT INTO citizen_science_data (
        wallet_address, data_type, measurements, location_lat, location_lng,
        location_name, photo_urls, xp_earned
      ) VALUES (
        ${walletAddress}, ${dataType}, ${JSON.stringify(measurements)},
        ${locationLat}, ${locationLng}, ${locationName},
        ${JSON.stringify(photoUrls)}, ${xpAmount}
      )
      RETURNING id, created_at
    `;

    // Award XP
    try {
      await sql`
        UPDATE user_profiles SET xp = xp + ${xpAmount}, updated_at = NOW()
        WHERE wallet_address = ${walletAddress}
      `;
      await sql`
        INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
        VALUES (
          ${walletAddress}, 'citizen_science_submission', ${xpAmount},
          ${`Submitted ${dataType.replace(/_/g, ' ')} data`},
          ${JSON.stringify({ data_id: result[0].id, dataType, locationName, measurementCount: Object.keys(measurements).length })}
        )
      `;
      await sql`
        INSERT INTO activity_log (wallet_address, activity_type, activity_data, xp_earned)
        VALUES (
          ${walletAddress}, 'citizen_science_submission',
          ${JSON.stringify({ data_id: result[0].id, dataType, locationName })},
          ${xpAmount}
        )
      `;
    } catch (xpError) {
      console.warn('Failed to award XP for citizen science:', xpError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: result[0].id,
        walletAddress,
        dataType,
        measurementCount: Object.keys(measurements).length,
        locationName,
        verified: false,
        createdAt: result[0].created_at
      },
      xpAwarded: xpAmount,
      message: `Citizen science data submitted! +${xpAmount} XP. Data may earn +${XP_ACTIVITIES.citizen_science_verified} XP when verified by a peer.`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Citizen science submission error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit data: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// POST /api/data/citizen-science?action=verify — Verify another user's submission
export async function PUT({ request }) {
  try {
    const body = await request.json();
    const { verifierWallet, dataId } = body;

    if (!verifierWallet || !dataId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'verifierWallet and dataId are required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const dbUrl = process.env.DATABASE_URL || process.env.NILE_DATABASE_URL;
    if (!dbUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(dbUrl);

    // Get the submission
    const data = await sql`
      SELECT id, wallet_address, verified, data_type FROM citizen_science_data WHERE id = ${dataId}
    `;

    if (data.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Data submission not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    if (data[0].wallet_address === verifierWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot verify your own submission'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (data[0].verified) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This submission has already been verified'
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Mark as verified
    await sql`
      UPDATE citizen_science_data SET verified = TRUE, verified_by = ${verifierWallet}
      WHERE id = ${dataId}
    `;

    // Award verification bonus XP to original submitter
    const bonusXP = XP_ACTIVITIES.citizen_science_verified; // 75
    try {
      await sql`
        UPDATE user_profiles SET xp = xp + ${bonusXP}, updated_at = NOW()
        WHERE wallet_address = ${data[0].wallet_address}
      `;
      await sql`
        INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
        VALUES (
          ${data[0].wallet_address}, 'citizen_science_verified', ${bonusXP},
          'Citizen science data verified by peer',
          ${JSON.stringify({ data_id: dataId, verified_by: verifierWallet })}
        )
      `;
    } catch (e) {
      console.warn('Failed to award verification XP:', e.message);
    }

    // Award small XP to verifier for community contribution
    const verifierXP = 10;
    try {
      await sql`
        UPDATE user_profiles SET xp = xp + ${verifierXP}, updated_at = NOW()
        WHERE wallet_address = ${verifierWallet}
      `;
      await sql`
        INSERT INTO activity_log (wallet_address, activity_type, activity_data, xp_earned)
        VALUES (${verifierWallet}, 'citizen_science_verify', ${JSON.stringify({ data_id: dataId })}, ${verifierXP})
      `;
    } catch (e) {
      console.warn('Failed to award verifier XP:', e.message);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Data verified! Original submitter earns +${bonusXP} XP. You earned +${verifierXP} XP.`,
      submitterXpAwarded: bonusXP,
      verifierXpAwarded: verifierXP
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Citizen science verify error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to verify data: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
