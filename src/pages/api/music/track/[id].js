/**
 * GET /api/music/track/[id]
 * Get single track details with full metadata
 *
 * Features:
 * - Full track metadata
 * - Artist info
 * - Collaborator info
 * - Play/like counts
 * - Comments (if implemented)
 * - NFT data if minted
 */

import { neon } from '@neondatabase/serverless';

export async function GET({ params }) {
  try {
    const { id } = params;

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

    console.log(`🔍 Fetching track details for ID: ${id}`);

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get track with artist info
    const trackResult = await sql`
      SELECT
        t.id,
        t.user_wallet,
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
        u.avatar_url as artist_avatar,
        u.bio as artist_bio
      FROM tracks t
      LEFT JOIN users u ON t.user_wallet = u.wallet_address
      WHERE t.id = ${id}
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

    // Get collaborators if collaboration
    if (track.is_collaboration) {
      const collabs = await sql`
        SELECT
          tc.collaborator_wallet,
          tc.role,
          u.username,
          u.avatar_url
        FROM track_collaborators tc
        LEFT JOIN users u ON tc.collaborator_wallet = u.wallet_address
        WHERE tc.track_id = ${id}
      `;
      track.collaborators = collabs;
    }

    // Get like status for requesting user if provided
    // TODO: Implement if walletAddress is passed in query

    // Get NFT metadata if track was minted
    if (track.nft_mint_address) {
      track.nft = {
        mintAddress: track.nft_mint_address,
        metadataUri: track.nft_metadata_uri,
        explorerUrl: `https://explorer.solana.com/address/${track.nft_mint_address}?cluster=testnet`
      };
    }

    // Format response
    const response = {
      success: true,
      track: {
        id: track.id,
        title: track.title,
        genre: track.genre,
        audioUrl: track.audio_url,
        coverArtUrl: track.cover_art_url,
        lyrics: track.lyrics,
        description: track.description,
        duration: track.duration,
        bpm: track.bpm,
        key: track.key,
        tags: track.tags,
        isCollaboration: track.is_collaboration,
        collaborators: track.collaborators || [],
        status: track.status,
        stats: {
          plays: track.plays || 0,
          likes: track.likes || 0
        },
        artist: {
          wallet: track.user_wallet,
          name: track.artist_name || track.user_wallet.substring(0, 8) + '...',
          avatar: track.artist_avatar,
          bio: track.artist_bio
        },
        nft: track.nft || null,
        createdAt: track.created_at,
        updatedAt: track.updated_at
      }
    };

    console.log(`✅ Track details fetched for: ${track.title}`);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error fetching track details:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch track details'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
