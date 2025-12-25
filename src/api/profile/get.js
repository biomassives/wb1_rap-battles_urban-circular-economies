// /api/profile/get.js
// Vercel Serverless Function to retrieve user profile
// Updated for Nile DB

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress } = req.query;

  // Validate wallet address
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    // Connect to Nile DB using Neon serverless driver
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.lab_NILEDB_URL);
    
    // Query user profile from database
    const result = await sql`
      SELECT 
        wallet_address,
        username,
        email,
        avatar_url,
        bio,
        favorite_animals,
        owned_nfts,
        created_at,
        updated_at,
        theme_preference,
        notification_settings
      FROM user_profiles
      WHERE wallet_address = ${walletAddress}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({ 
        error: 'Profile not found',
        walletAddress 
      });
    }

    // Return user profile
    return res.status(200).json({
      success: true,
      profile: result[0]
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve profile',
      message: error.message 
    });
  }
}
