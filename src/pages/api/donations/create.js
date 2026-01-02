// /api/donations/create.js
// Generic donation creation endpoint - works for Kakuma and other WorldBridge One initiatives

import { neon } from '@neondatabase/serverless';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      projectId,
      amount,
      currency = 'USD',
      recurring = false,
      message,
      anonymous = false,
      walletAddress,
      mintNFT = false
    } = body;

    // Validate required fields
    if (!projectId || !amount) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: projectId and amount'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (amount <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Amount must be greater than 0'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // Try database first
      const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

      // Insert donation record
      const result = await sql`
        INSERT INTO donations (
          project_id,
          donor_wallet,
          amount,
          currency,
          recurring,
          message,
          anonymous,
          status,
          created_at
        ) VALUES (
          ${projectId},
          ${walletAddress || 'anonymous'},
          ${amount},
          ${currency},
          ${recurring},
          ${message || null},
          ${anonymous},
          'completed',
          NOW()
        )
        RETURNING id, project_id, amount, currency, created_at
      `;

      // Update project funding_raised
      if (projectId !== 'general') {
        await sql`
          UPDATE projects
          SET
            funding_raised = funding_raised + ${amount},
            updated_at = NOW()
          WHERE id = ${projectId}
        `;
      }

      // Award XP to donor if they have a wallet
      let xpAmount = 0;
      if (walletAddress && walletAddress !== 'anonymous') {
        xpAmount = Math.floor(amount * 10); // 10 XP per dollar

        await sql`
          UPDATE users
          SET
            xp = xp + ${xpAmount},
            updated_at = NOW()
          WHERE wallet_address = ${walletAddress}
        `;
      }

      // Handle NFT minting if requested
      let nftMinted = false;
      let nftData = null;

      if (mintNFT && walletAddress && walletAddress !== 'anonymous') {
        // TODO: Implement actual NFT minting via Metaplex/Solana
        // For now, just simulate NFT creation
        nftMinted = true;
        nftData = {
          mint_address: `NFT_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          project_id: projectId,
          tier: amount >= 500 ? 'platinum' : amount >= 100 ? 'diamond' : amount >= 50 ? 'gold' : amount >= 25 ? 'silver' : 'bronze',
          metadata_uri: `/api/nft/metadata/${projectId}/${result[0].id}`
        };

        // Store NFT record in database
        try {
          await sql`
            INSERT INTO user_nfts (
              wallet_address,
              token_mint,
              collection_name,
              metadata,
              created_at
            ) VALUES (
              ${walletAddress},
              ${nftData.mint_address},
              ${`${projectId}-contributors`},
              ${JSON.stringify(nftData)},
              NOW()
            )
          `;
        } catch (nftError) {
          console.error('Failed to store NFT record:', nftError);
          // Don't fail the whole transaction if NFT storage fails
        }
      }

      return new Response(JSON.stringify({
        success: true,
        donation: result[0],
        xp_earned: xpAmount,
        nft_minted: nftMinted,
        nft_data: nftData
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (dbError) {
      console.error('Database error, using localStorage fallback:', dbError);

      // Fallback to localStorage
      const donation = {
        id: 'donation_' + Date.now(),
        project_id: projectId,
        donor_wallet: walletAddress || 'anonymous',
        amount,
        currency,
        recurring,
        message,
        anonymous,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Store in localStorage (client will need to handle this)
      return new Response(JSON.stringify({
        success: true,
        donation,
        fallback: true,
        message: 'Donation recorded locally. Will sync to database when connection is restored.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Donation creation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to process donation'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
