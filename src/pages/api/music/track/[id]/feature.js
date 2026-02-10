/**
 * POST /api/music/track/[id]/feature
 * Toggle is_featured on a track. Verifies ownership. Max 6 featured per user.
 */

import { sql } from '../../../../../lib/db.js';
export const prerender = false;

export async function POST({ params, request }) {
  try {
    const { id } = params;
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch (parseError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { walletAddress } = body;

    if (!id || !walletAddress) {
      return new Response(
        JSON.stringify({ success: false, error: 'Track ID and walletAddress are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify track exists and user owns it
    const trackResult = await sql`
      SELECT id, user_wallet, title, is_featured FROM tracks WHERE id = ${id}
    `;

    if (trackResult.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Track not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const track = trackResult[0];

    if (track.user_wallet !== walletAddress) {
      return new Response(
        JSON.stringify({ success: false, error: 'You can only feature your own tracks' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const currentlyFeatured = track.is_featured;

    // If trying to feature (not unfeature), check limit
    if (!currentlyFeatured) {
      const countResult = await sql`
        SELECT COUNT(*) as total FROM tracks
        WHERE user_wallet = ${walletAddress} AND is_featured = true
      `;
      if (parseInt(countResult[0].total) >= 6) {
        return new Response(
          JSON.stringify({ success: false, error: 'Maximum 6 featured tracks allowed. Unfeature one first.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Toggle
    const updated = await sql`
      UPDATE tracks
      SET is_featured = ${!currentlyFeatured}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING is_featured
    `;

    return new Response(
      JSON.stringify({
        success: true,
        is_featured: updated[0].is_featured,
        message: updated[0].is_featured ? 'Track featured' : 'Track unfeatured'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error toggling feature:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to toggle feature' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
