/**
 * GET /api/music/metadata/[id]
 * Get Metaplex-compatible NFT metadata for a track
 *
 * Returns NFT metadata in Metaplex standard format
 * Used when minting track as NFT
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

    console.log(`📋 Fetching NFT metadata for track ${id}`);

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get track details
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
        t.plays,
        t.likes,
        t.tags,
        t.created_at,
        u.username as artist_name
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
    let collaborators = [];
    if (track.is_collaboration) {
      const collabs = await sql`
        SELECT
          tc.collaborator_wallet,
          tc.role,
          u.username
        FROM track_collaborators tc
        LEFT JOIN users u ON tc.collaborator_wallet = u.wallet_address
        WHERE tc.track_id = ${id}
      `;
      collaborators = collabs;
    }

    // Build Metaplex-compatible metadata
    const metadata = {
      name: track.title,
      symbol: 'WBMUS',
      description: track.description || `${track.title} - A WorldBridger One music NFT`,
      seller_fee_basis_points: 500, // 5% royalty
      image: track.cover_art_url || 'https://worldbridgerone.com/default-track-cover.png',
      animation_url: track.audio_url,
      external_url: `https://worldbridgerone.com/music/track/${id}`,

      // Attributes (traits)
      attributes: [
        {
          trait_type: 'Artist',
          value: track.artist_name || track.user_wallet.substring(0, 8) + '...'
        },
        {
          trait_type: 'Genre',
          value: track.genre
        },
        {
          trait_type: 'Type',
          value: 'Music Track'
        },
        {
          trait_type: 'Duration',
          value: track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : 'Unknown'
        },
        {
          trait_type: 'BPM',
          value: track.bpm || 'Unknown',
          display_type: 'number'
        },
        {
          trait_type: 'Key',
          value: track.key || 'Unknown'
        },
        {
          trait_type: 'Plays',
          value: track.plays,
          display_type: 'number'
        },
        {
          trait_type: 'Likes',
          value: track.likes,
          display_type: 'number'
        },
        {
          trait_type: 'Release Date',
          value: new Date(track.created_at).toISOString().split('T')[0]
        }
      ],

      // Properties (Metaplex standard)
      properties: {
        category: 'audio',
        files: [
          {
            uri: track.audio_url,
            type: 'audio/mp3'
          },
          {
            uri: track.cover_art_url || 'https://worldbridgerone.com/default-track-cover.png',
            type: 'image/png'
          }
        ],
        creators: [
          {
            address: track.user_wallet,
            share: collaborators.length > 0 ? 60 : 100
          },
          ...collaborators.map((collab, index) => ({
            address: collab.collaborator_wallet,
            share: Math.floor(40 / collaborators.length)
          }))
        ]
      },

      // Collection info
      collection: {
        name: 'WorldBridger Music Collection',
        family: 'WorldBridger One'
      }
    };

    // Add lyrics if available (as separate property)
    if (track.lyrics) {
      metadata.properties.lyrics = track.lyrics;
    }

    // Add tags if available
    if (track.tags && track.tags.length > 0) {
      metadata.properties.tags = track.tags;
    }

    console.log(`✅ NFT metadata generated for: ${track.title}`);

    return new Response(
      JSON.stringify(metadata),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      }
    );

  } catch (error) {
    console.error('❌ Error generating NFT metadata:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate NFT metadata'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
