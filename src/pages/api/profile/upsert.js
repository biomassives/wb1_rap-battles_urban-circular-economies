// /api/profile/upsert.js
// Vercel Serverless Function to create or update user profile
// Updated for Nile DB

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    walletAddress,
    username,
    email,
    avatarUrl,
    bio,
    favoriteAnimals,
    themePreference,
    notificationSettings
  } = req.body;

  // Validate required fields
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    // Connect to Nile DB using Neon serverless driver
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.lab_NILEDB_URL);
    
    // Use PostgreSQL UPSERT (INSERT ... ON CONFLICT ... UPDATE)
    const result = await sql`
      INSERT INTO user_profiles (
        wallet_address,
        username,
        email,
        avatar_url,
        bio,
        favorite_animals,
        theme_preference,
        notification_settings,
        created_at,
        updated_at
      ) VALUES (
        ${walletAddress},
        ${username || null},
        ${email || null},
        ${avatarUrl || null},
        ${bio || null},
        ${favoriteAnimals || '[]'}::jsonb,
        ${themePreference || 'meadow'},
        ${notificationSettings || '{"email": false, "browser": false}'}::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (wallet_address) 
      DO UPDATE SET
        username = COALESCE(${username}, user_profiles.username),
        email = COALESCE(${email}, user_profiles.email),
        avatar_url = COALESCE(${avatarUrl}, user_profiles.avatar_url),
        bio = COALESCE(${bio}, user_profiles.bio),
        favorite_animals = COALESCE(${favoriteAnimals}::jsonb, user_profiles.favorite_animals),
        theme_preference = COALESCE(${themePreference}, user_profiles.theme_preference),
        notification_settings = COALESCE(${notificationSettings}::jsonb, user_profiles.notification_settings),
        updated_at = NOW()
      RETURNING *
    `;

    return res.status(200).json({
      success: true,
      profile: result[0],
      message: 'Profile saved successfully'
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Failed to save profile',
      message: error.message 
    });
  }
}
