/**
 * POST /api/music/track/[id]/like
 * Like or unlike a track
 *
 * Features:
 * - Toggle like/unlike
 * - Award XP to artist on milestones
 * - Track who liked what
 * - Prevent self-liking
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

    const { walletAddress } = body;

    if (!id || !walletAddress) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Track ID and walletAddress are required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`❤️ Like action for track ${id} by ${walletAddress}`);

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Check if track exists
    const trackResult = await sql`
      SELECT id, user_wallet, title, likes
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

    // Prevent self-liking
    if (track.user_wallet === walletAddress) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'You cannot like your own track'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user already liked this track
    const existingLike = await sql`
      SELECT *
      FROM track_likes
      WHERE track_id = ${id}
        AND user_wallet = ${walletAddress}
    `;

    let liked = false;
    let newLikeCount;

    if (existingLike.length > 0) {
      // Unlike - remove like
      await sql`
        DELETE FROM track_likes
        WHERE track_id = ${id}
          AND user_wallet = ${walletAddress}
      `;

      // Decrement like count
      const updateResult = await sql`
        UPDATE tracks
        SET
          likes = GREATEST(likes - 1, 0),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING likes
      `;

      newLikeCount = updateResult[0].likes;
      liked = false;

      console.log(`💔 Track unliked. New count: ${newLikeCount}`);

    } else {
      // Like - add like
      await sql`
        INSERT INTO track_likes (
          track_id,
          user_wallet,
          created_at
        ) VALUES (
          ${id},
          ${walletAddress},
          NOW()
        )
      `;

      // Increment like count
      const updateResult = await sql`
        UPDATE tracks
        SET
          likes = likes + 1,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING likes
      `;

      newLikeCount = updateResult[0].likes;
      liked = true;

      console.log(`❤️ Track liked. New count: ${newLikeCount}`);

      // Award XP to artist on milestones (10, 25, 50, 100, etc.)
      const milestones = [10, 25, 50, 100, 250, 500, 1000];
      if (milestones.includes(newLikeCount)) {
        const xpReward = Math.floor(newLikeCount / 10);

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
            ${`Track "${track.title}" reached ${newLikeCount} likes!`},
            ${xpReward},
            ${JSON.stringify({ trackId: id, likes: newLikeCount, milestone: true })},
            NOW()
          )
        `;

        console.log(`🎉 Milestone reached! Awarded ${xpReward} XP`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        liked,
        newLikeCount,
        message: liked ? 'Track liked successfully' : 'Track unliked'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error toggling like:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to toggle like'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
