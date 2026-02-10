/**
 * GET /api/music/user-tracks
 * Get all tracks by a user
 *
 * Query Parameters:
 * - walletAddress (required): User's wallet address
 * - status: Filter by status (published, draft, scheduled, all) - default: all
 * - source: Filter by source (created, collected, sample, all) - default: all
 * - featured: If "true", only featured tracks
 * - limit: Number of tracks to return - default: 20
 * - offset: Pagination offset - default: 0
 * - sortBy: Sort field (created_at, plays, likes, title) - default: created_at
 * - sortOrder: Sort order (asc, desc) - default: desc
 */

import { sql } from '../../../lib/db.js';
export const prerender = false;

// Whitelist for safe ORDER BY
const SORT_COLUMNS = { created_at: 'created_at', plays: 'plays', likes: 'likes', title: 'title' };

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    const status = url.searchParams.get('status') || 'all';
    const source = url.searchParams.get('source') || 'all';
    const featured = url.searchParams.get('featured') === 'true';
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ success: false, error: 'walletAddress parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build conditional fragments
    const statusFilter = status !== 'all' ? sql`AND t.status = ${status}` : sql``;
    const sourceFilter = source !== 'all' ? sql`AND t.source = ${source}` : sql``;
    const featuredFilter = featured ? sql`AND t.is_featured = true` : sql``;

    // Safe ORDER BY using whitelist + conditional fragments
    const safeSortBy = SORT_COLUMNS[sortBy] || 'created_at';
    const orderFrag =
      safeSortBy === 'plays' ? sql`ORDER BY t.plays` :
      safeSortBy === 'likes' ? sql`ORDER BY t.likes` :
      safeSortBy === 'title' ? sql`ORDER BY t.title` :
      sql`ORDER BY t.created_at`;
    const dirFrag = sortOrder === 'ASC' ? sql`ASC` : sql`DESC`;

    const tracks = await sql`
      SELECT
        t.id, t.title, t.genre, t.audio_url, t.cover_art_url,
        t.lyrics, t.description, t.duration, t.bpm, t.key,
        t.is_collaboration, t.status, t.plays, t.likes, t.tags,
        t.nft_mint_address, t.nft_metadata_uri,
        t.is_featured, t.source,
        t.created_at, t.updated_at,
        u.username as artist_name, u.avatar_url as artist_avatar
      FROM tracks t
      LEFT JOIN user_profiles u ON t.user_wallet = u.wallet_address
      WHERE t.user_wallet = ${walletAddress}
        ${statusFilter}
        ${sourceFilter}
        ${featuredFilter}
      ${orderFrag} ${dirFrag}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get collaborators for collaboration tracks
    for (const track of tracks) {
      if (track.is_collaboration) {
        const collabs = await sql`
          SELECT tc.collaborator_wallet, tc.role, u.username, u.avatar_url
          FROM track_collaborators tc
          LEFT JOIN user_profiles u ON tc.collaborator_wallet = u.wallet_address
          WHERE tc.track_id = ${track.id}
        `;
        track.collaborators = collabs;
      }
    }

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM tracks t
      WHERE t.user_wallet = ${walletAddress}
        ${statusFilter}
        ${sourceFilter}
        ${featuredFilter}
    `;

    const totalTracks = parseInt(countResult[0].total);
    const stats = {
      totalTracks,
      publishedTracks: tracks.filter(t => t.status === 'published').length,
      totalPlays: tracks.reduce((sum, t) => sum + (t.plays || 0), 0),
      totalLikes: tracks.reduce((sum, t) => sum + (t.likes || 0), 0)
    };

    return new Response(
      JSON.stringify({ success: true, tracks, stats, pagination: { total: totalTracks, limit, offset, hasMore: offset + tracks.length < totalTracks } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching user tracks:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch tracks' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
