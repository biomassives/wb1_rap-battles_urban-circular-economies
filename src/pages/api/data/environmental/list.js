// /api/data/environmental/list.js
// List environmental observations with filtering

import { neon } from '@neondatabase/serverless';

export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status') || 'verified';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    let observations;

    if (walletAddress) {
      // Get user's own observations (can see all statuses)
      observations = await sql`
        SELECT
          id,
          observation_type,
          title,
          location_name,
          latitude,
          longitude,
          data_payload,
          media_urls,
          verification_status,
          quality_score,
          xp_awarded,
          tags,
          created_at,
          verified_at
        FROM environmental_observations
        WHERE wallet_address = ${walletAddress}
        ${type ? sql`AND observation_type = ${type}` : sql``}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Get public verified observations
      observations = await sql`
        SELECT
          id,
          wallet_address,
          observation_type,
          title,
          location_name,
          latitude,
          longitude,
          data_payload,
          media_urls,
          quality_score,
          tags,
          created_at,
          verified_at
        FROM environmental_observations
        WHERE verification_status = ${status}
        ${type ? sql`AND observation_type = ${type}` : sql``}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM environmental_observations
      WHERE ${walletAddress ? sql`wallet_address = ${walletAddress}` : sql`verification_status = ${status}`}
      ${type ? sql`AND observation_type = ${type}` : sql``}
    `;

    const total = parseInt(countResult[0]?.total || 0);

    // Get type breakdown
    const typeStats = await sql`
      SELECT observation_type, COUNT(*) as count
      FROM environmental_observations
      WHERE verification_status = 'verified'
      GROUP BY observation_type
      ORDER BY count DESC
    `;

    return new Response(JSON.stringify({
      success: true,
      observations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + observations.length < total
      },
      typeStats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error listing observations:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to list observations',
      observations: [],
      pagination: { total: 0, limit, offset, hasMore: false }
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
