// /api/profile/update-nfts.js
// Vercel Serverless Function to update user's owned NFTs
// Updated for Nile DB

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress, nftTokens } = req.body;

  // Validate required fields
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  if (!Array.isArray(nftTokens)) {
    return res.status(400).json({ error: 'nftTokens must be an array' });
  }

  try {
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
      return res.status(404).json({ 
        error: 'Profile not found. Create profile first.',
        walletAddress 
      });
    }

    return res.status(200).json({
      success: true,
      walletAddress: result[0].wallet_address,
      ownedNfts: result[0].owned_nfts,
      updatedAt: result[0].updated_at,
      message: 'NFT collection updated successfully'
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Failed to update NFT collection',
      message: error.message 
    });
  }
}
