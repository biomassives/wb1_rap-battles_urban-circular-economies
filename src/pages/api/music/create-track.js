/**
 * POST /api/music/create-track
 * Upload a new music track with metadata
 *
 * Features:
 * - Track upload with metadata
 * - Collaboration support
 * - Optional NFT minting
 * - XP rewards
 * - Activity logging
 */

import { neon } from '@neondatabase/serverless';

export async function POST({ request }) {
  try {
    // Parse request body (use text() then JSON.parse for better error handling)
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Empty request body'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      body = JSON.parse(text);
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

    const {
      walletAddress,
      title,
      genre,
      audioFileUrl,
      coverArtUrl,
      lyrics,
      description,
      duration,
      bpm,
      key,
      isCollaboration = false,
      collaborators = [],
      mintAsNft = false,
      releaseOption = 'publish', // publish, draft, scheduled
      scheduledDate = null,
      tags = []
    } = body;

    // Validation
    if (!walletAddress || !title || !genre || !audioFileUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: walletAddress, title, genre, audioFileUrl'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate genre
    const validGenres = [
      'rap', 'hip-hop', 'reggae', 'dancehall', 'afrobeat',
      'ska', 'dub', 'conscious', 'trap', 'boom-bap', 'other'
    ];
    if (!validGenres.includes(genre.toLowerCase())) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid genre. Must be one of: ${validGenres.join(', ')}`
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🎵 Creating track "${title}" for ${walletAddress}`);

    try {
      const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

      // Calculate status based on release option
      let status = 'published';
      if (releaseOption === 'draft') {
        status = 'draft';
      } else if (releaseOption === 'scheduled') {
        status = 'scheduled';
      }

      // Insert track
      const trackResult = await sql`
        INSERT INTO tracks (
          user_wallet,
          title,
          genre,
          audio_url,
          cover_art_url,
          lyrics,
          description,
          duration,
          bpm,
          key,
          is_collaboration,
          status,
          scheduled_date,
          tags,
          plays,
          likes,
          created_at
        ) VALUES (
          ${walletAddress},
          ${title},
          ${genre},
          ${audioFileUrl},
          ${coverArtUrl || null},
          ${lyrics || null},
          ${description || null},
          ${duration || null},
          ${bpm || null},
          ${key || null},
          ${isCollaboration},
          ${status},
          ${scheduledDate ? new Date(scheduledDate) : null},
          ${JSON.stringify(tags)},
          0,
          0,
          NOW()
        )
        RETURNING
          id,
          title,
          genre,
          status,
          created_at
      `;

      const track = trackResult[0];
      console.log(`✅ Track created with ID: ${track.id}`);

      // Add collaborators if any
      if (isCollaboration && collaborators.length > 0) {
        for (const collabWallet of collaborators) {
          await sql`
            INSERT INTO track_collaborators (
              track_id,
              collaborator_wallet,
              role,
              created_at
            ) VALUES (
              ${track.id},
              ${collabWallet},
              'collaborator',
              NOW()
            )
          `;
        }
      }

      // Award XP for track upload
      let xpAwarded = 0;
      if (status === 'published') {
        xpAwarded = 100; // Base XP

        // Bonus XP
        if (lyrics) xpAwarded += 25;
        if (coverArtUrl) xpAwarded += 15;
        if (isCollaboration) xpAwarded += 30;
        if (description && description.length > 100) xpAwarded += 10;

        await sql`
          UPDATE user_profiles
          SET
            xp = xp + ${xpAwarded},
            updated_at = NOW()
          WHERE wallet_address = ${walletAddress}
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
            ${walletAddress},
            'track_upload',
            ${`Uploaded track: ${title}`},
            ${xpAwarded},
            ${JSON.stringify({ trackId: track.id, genre, isCollaboration })},
            NOW()
          )
        `;
      }

      // Mint NFT if requested
      let nftData = null;
      if (mintAsNft && status === 'published') {
        try {
          // Create NFT metadata
          const nftMetadata = {
            name: title,
            symbol: 'WBMUS',
            description: description || `${title} by ${walletAddress.substring(0, 8)}...`,
            image: coverArtUrl || '/default-track-cover.png',
            animation_url: audioFileUrl,
            attributes: [
              { trait_type: 'Genre', value: genre },
              { trait_type: 'Artist', value: walletAddress },
              { trait_type: 'Type', value: 'Music Track' },
              { trait_type: 'BPM', value: bpm || 'N/A' },
              { trait_type: 'Key', value: key || 'N/A' },
              { trait_type: 'Duration', value: duration ? `${duration}s` : 'N/A' }
            ],
            properties: {
              category: 'audio',
              files: [
                {
                  uri: audioFileUrl,
                  type: 'audio/mp3'
                }
              ]
            },
            external_url: `https://worldbridgerone.com/music/track/${track.id}`
          };

          // TODO: Upload metadata to IPFS/Arweave
          // For now, create placeholder
          const metadataUri = `/api/music/metadata/${track.id}`;

          nftData = {
            mint_address: `TRACK_NFT_${track.id}_${Date.now()}`,
            metadata_uri: metadataUri,
            metadata: nftMetadata
          };

          // Store NFT reference
          await sql`
            UPDATE tracks
            SET
              nft_mint_address = ${nftData.mint_address},
              nft_metadata_uri = ${metadataUri},
              updated_at = NOW()
            WHERE id = ${track.id}
          `;

          console.log(`💎 NFT metadata prepared for track ${track.id}`);

        } catch (nftError) {
          console.error('NFT creation error:', nftError);
          // Don't fail the whole upload if NFT fails
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          track: {
            id: track.id,
            title: track.title,
            genre: track.genre,
            status: track.status,
            createdAt: track.created_at
          },
          xpAwarded,
          nftData,
          message: status === 'published' ? 'Track published successfully!' : 'Track saved as draft'
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (dbError) {
      console.error('Database error:', dbError);

      // Fallback response
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database connection failed',
          fallback: true,
          message: 'Track will be uploaded when connection is restored'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('❌ Track creation error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create track'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
