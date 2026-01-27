/**
 * POST /api/music/track/[id]/play
 * Increment play count for a track
 *
 * Features:
 * - Increments play counter
 * - Awards XP to artist (small amount per play)
 * - Logs activity
 * - Rate limiting per user (1 play count per track per hour)
 */

import { neon } from '@neondatabase/serverless';

export async function POST({ params, request }) {
  try {
    const { id } = params;

    // Parse request body
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON: ' + parseError.message
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { listenerWallet } = body;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Track ID is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`▶️ Play count for track ${id}`);

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Check if track exists
    const trackResult = await sql`
      SELECT id, user_wallet, title, plays
      FROM tracks
      WHERE id = ${id}
    `;

    if (trackResult.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Track not found'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const track = trackResult[0];

    // TODO: Implement rate limiting
    // Check if this user already played this track in the last hour
    // This prevents spam and gaming the system
    if (listenerWallet) {
      const recentPlays = await sql`
        SELECT COUNT(*) as count
        FROM track_plays
        WHERE track_id = ${id}
          AND listener_wallet = ${listenerWallet}
          AND created_at > NOW() - INTERVAL '1 hour'
      `;

      if (recentPlays[0].count > 0) {
        // Still return success, but don't increment counter
        return new Response(
          JSON.stringify({
            success: true,
            rateLimited: true,
            message: 'Play already counted recently',
            currentPlays: track.plays
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Log the play
      await sql`
        INSERT INTO track_plays (
          track_id,
          listener_wallet,
          created_at
        ) VALUES (
          ${id},
          ${listenerWallet},
          NOW()
        )
      `;
    }

    // Increment play count
    const updateResult = await sql`
      UPDATE tracks
      SET
        plays = plays + 1,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING plays
    `;

    const newPlayCount = updateResult[0].plays;

    // Award XP to artist (1 XP per 10 plays)
    if (newPlayCount % 10 === 0) {
      const xpReward = 5;
      await sql`
        UPDATE user_profiles
        SET xp = xp + ${xpReward}
        WHERE wallet_address = ${track.user_wallet}
      `;

      // Log activity
      await sql`
        INSERT INTO activity_log (
          user_wallet,
          activity_type,
          description,
          xp_awarded,
          metadata,
          created_at
        ) VALUES (
          ${track.user_wallet},
          'track_milestone',
          ${`Track "${track.title}" reached ${newPlayCount} plays`},
          ${xpReward},
          ${JSON.stringify({ trackId: id, plays: newPlayCount })},
          NOW()
        )
      `;
    }

    console.log(`✅ Play count updated: ${newPlayCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        newPlayCount,
        message: 'Play counted successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error incrementing play count:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to increment play count'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
