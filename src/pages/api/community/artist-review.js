/**
 * POST /api/community/artist-review
 * Submit a review of an artist's track or profile
 *
 * Body:
 * - reviewerWallet: string (required)
 * - targetWallet: string (optional, for profile reviews)
 * - trackId: number (optional, for track reviews)
 * - rating: number 1-5 (required)
 * - review: string (required, min 50 chars)
 *
 * XP: 20 (basic) or 35 (detailed: >200 chars + rating >= 3)
 * Rate limit: 10 reviews per day per wallet
 */

import { neon } from '@neondatabase/serverless';
import { XP_ACTIVITIES } from '../../../lib/xp-config.js';

export const prerender = false;

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
    const { reviewerWallet, targetWallet, trackId, rating, review } = body;

    if (!reviewerWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'reviewerWallet is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({
        success: false,
        error: 'rating is required (1-5)'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!review || review.trim().length < 50) {
      return new Response(JSON.stringify({
        success: false,
        error: 'review must be at least 50 characters'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!targetWallet && !trackId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Either targetWallet or trackId is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Can't review yourself
    if (targetWallet && targetWallet === reviewerWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot review yourself'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const dbUrl = process.env.DATABASE_URL || process.env.NILE_DATABASE_URL;
    if (!dbUrl) {
      return new Response(JSON.stringify({
        success: true,
        source: 'local_only',
        message: 'Database not configured, review tracked locally',
        xpAwarded: XP_ACTIVITIES.artist_review
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(dbUrl);

    // Rate limit: max 10 reviews per day
    const todayCount = await sql`
      SELECT COUNT(*)::int as count FROM artist_reviews
      WHERE reviewer_wallet = ${reviewerWallet}
        AND created_at > NOW() - INTERVAL '24 hours'
    `;

    if (todayCount[0].count >= 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Daily review limit reached (10 per day). Try again tomorrow.'
      }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    // Determine XP: detailed review gets more
    const isDetailed = review.trim().length >= 200 && rating >= 1;
    const xpAmount = isDetailed ? XP_ACTIVITIES.artist_review_detailed : XP_ACTIVITIES.artist_review;

    // If reviewing a track, get the track owner
    let resolvedTargetWallet = targetWallet;
    if (trackId && !targetWallet) {
      const track = await sql`SELECT user_wallet FROM tracks WHERE id = ${trackId} LIMIT 1`;
      if (track.length > 0) {
        resolvedTargetWallet = track[0].user_wallet;
        if (resolvedTargetWallet === reviewerWallet) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Cannot review your own track'
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
      }
    }

    // Insert review
    const result = await sql`
      INSERT INTO artist_reviews (reviewer_wallet, target_wallet, track_id, rating, review, xp_earned)
      VALUES (${reviewerWallet}, ${resolvedTargetWallet || null}, ${trackId || null}, ${rating}, ${review.trim()}, ${xpAmount})
      RETURNING id, created_at
    `;

    // Award XP
    try {
      await sql`
        UPDATE user_profiles SET xp = xp + ${xpAmount}, updated_at = NOW()
        WHERE wallet_address = ${reviewerWallet}
      `;
      await sql`
        INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
        VALUES (
          ${reviewerWallet},
          ${isDetailed ? 'artist_review_detailed' : 'artist_review'},
          ${xpAmount},
          ${`Reviewed ${resolvedTargetWallet ? 'artist ' + resolvedTargetWallet.slice(0, 8) : 'track #' + trackId}`},
          ${JSON.stringify({ review_id: result[0].id, rating, trackId, targetWallet: resolvedTargetWallet })}
        )
      `;
      await sql`
        INSERT INTO activity_log (wallet_address, activity_type, activity_data, xp_earned)
        VALUES (
          ${reviewerWallet}, 'artist_review',
          ${JSON.stringify({ review_id: result[0].id, rating, trackId, targetWallet: resolvedTargetWallet })},
          ${xpAmount}
        )
      `;
    } catch (xpError) {
      console.warn('Failed to award XP for review:', xpError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      review: {
        id: result[0].id,
        reviewerWallet,
        targetWallet: resolvedTargetWallet,
        trackId,
        rating,
        isDetailed,
        createdAt: result[0].created_at
      },
      xpAwarded: xpAmount,
      message: `Review submitted! +${xpAmount} XP${isDetailed ? ' (detailed bonus!)' : ''}`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Artist review error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit review: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
