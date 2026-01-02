// /api/profile/update-nfts.js
// Astro API endpoint to update user's owned NFTs
// Updated for Nile DB

import { neon } from '@neondatabase/serverless';

export async function POST({ request }) {
  try {
    // Parse request body
    const body = await request.json();
    const { walletAddress, nftTokens } = body;

    // Validate required fields
    if (!walletAddress) {
      return new Response(JSON.stringify({
        error: 'Wallet address is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!Array.isArray(nftTokens)) {
      return new Response(JSON.stringify({
        error: 'nftTokens must be an array'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Connect to Nile DB using Neon serverless driver
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.lab_NILEDB_URL);

    // Update owned NFTs for the user
    const result = await sql`
      UPDATE user_profiles
      SET
        owned_nfts = ${JSON.stringify(nftTokens)}::jsonb,
        updated_at = NOW()
      WHERE wallet_address = ${walletAddress}
      RETURNING wallet_address, owned_nfts, updated_at
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({
        error: 'Profile not found. Create profile first.',
        walletAddress
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      walletAddress: result[0].wallet_address,
      ownedNfts: result[0].owned_nfts,
      updatedAt: result[0].updated_at,
      message: 'NFT collection updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update NFT collection',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
