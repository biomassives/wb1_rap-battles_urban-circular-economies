// /api/profile/get.js
// Astro API endpoint to retrieve user profile
// Updated for Nile DB

import { neon } from '@neondatabase/serverless';

export async function GET({ request }) {
  // Get wallet address from URL search params
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  // Validate wallet address
  if (!walletAddress) {
    return new Response(JSON.stringify({
      error: 'Wallet address is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
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
      return new Response(JSON.stringify({
        error: 'Profile not found',
        walletAddress
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return user profile
    return new Response(JSON.stringify({
      success: true,
      profile: result[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to retrieve profile',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
