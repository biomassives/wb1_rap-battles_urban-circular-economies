/**
 * GET /api/music/user-tracks
 * Get all tracks by a user
 *
 * Query Parameters:
 * - walletAddress (required): User's wallet address
 * - status: Filter by status (published, draft, scheduled, all) - default: published
 * - limit: Number of tracks to return - default: 20
 * - offset: Pagination offset - default: 0
 * - sortBy: Sort field (created_at, plays, likes) - default: created_at
 * - sortOrder: Sort order (asc, desc) - default: desc
 */

import { neon } from '@neondatabase/serverless';

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');
    const status = url.searchParams.get('status') || 'published';
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    if (!walletAddress) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'walletAddress parameter is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔍 Fetching tracks for wallet: ${walletAddress}, status: ${status}`);

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Build query based on status filter
    let tracks;
    if (status === 'all') {
      tracks = await sql`
        SELECT
          t.id,
          t.title,
          t.genre,
          t.audio_url,
          t.cover_art_url,
          t.lyrics,
          t.description,
          t.duration,
          t.bpm,
          t.key,
          t.is_collaboration,
          t.status,
          t.plays,
          t.likes,
          t.tags,
          t.nft_mint_address,
          t.nft_metadata_uri,
          t.created_at,
          t.updated_at,
          u.username as artist_name,
          u.avatar_url as artist_avatar
        FROM tracks t
        LEFT JOIN users u ON t.user_wallet = u.wallet_address
        WHERE t.user_wallet = ${walletAddress}
        ORDER BY ${sql(sortBy)} ${sql.unsafe(sortOrder.toUpperCase())}
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      tracks = await sql`
        SELECT
          t.id,
          t.title,
          t.genre,
          t.audio_url,
          t.cover_art_url,
          t.lyrics,
          t.description,
          t.duration,
          t.bpm,
          t.key,
          t.is_collaboration,
          t.status,
          t.plays,
          t.likes,
          t.tags,
          t.nft_mint_address,
          t.nft_metadata_uri,
          t.created_at,
          t.updated_at,
          u.username as artist_name,
          u.avatar_url as artist_avatar
        FROM tracks t
        LEFT JOIN users u ON t.user_wallet = u.wallet_address
        WHERE t.user_wallet = ${walletAddress}
          AND t.status = ${status}
        ORDER BY ${sql(sortBy)} ${sql.unsafe(sortOrder.toUpperCase())}
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    // Get collaborators for collaboration tracks
    for (const track of tracks) {
      if (track.is_collaboration) {
        const collabs = await sql`
          SELECT
            tc.collaborator_wallet,
            tc.role,
            u.username,
            u.avatar_url
          FROM track_collaborators tc
          LEFT JOIN users u ON tc.collaborator_wallet = u.wallet_address
          WHERE tc.track_id = ${track.id}
        `;
        track.collaborators = collabs;
      }
    }

    // Get total count for pagination
    const countResult = status === 'all'
      ? await sql`
          SELECT COUNT(*) as total
          FROM tracks
          WHERE user_wallet = ${walletAddress}
        `
      : await sql`
          SELECT COUNT(*) as total
          FROM tracks
          WHERE user_wallet = ${walletAddress}
            AND status = ${status}
        `;

    const totalTracks = parseInt(countResult[0].total);

    // Calculate stats
    const stats = {
      totalTracks,
      publishedTracks: tracks.filter(t => t.status === 'published').length,
      totalPlays: tracks.reduce((sum, t) => sum + (t.plays || 0), 0),
      totalLikes: tracks.reduce((sum, t) => sum + (t.likes || 0), 0)
    };

    console.log(`✅ Found ${tracks.length} tracks`);

    return new Response(
      JSON.stringify({
        success: true,
        tracks,
        stats,
        pagination: {
          total: totalTracks,
          limit,
          offset,
          hasMore: offset + tracks.length < totalTracks
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error fetching user tracks:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch tracks'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
