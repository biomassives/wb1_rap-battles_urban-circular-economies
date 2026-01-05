// /api/profile/upsert.js
// Astro API endpoint to create or update user profile
// Updated for Nile DB

import { neon } from '@neondatabase/serverless';

export async function POST({ request }) {
  try {
    // Check if request has body
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(JSON.stringify({
        error: 'Invalid content type',
        message: 'Request must have Content-Type: application/json'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        return new Response(JSON.stringify({
          error: 'Empty request body',
          message: 'Request body cannot be empty'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      body = JSON.parse(text);
    } catch (parseError) {
      return new Response(JSON.stringify({
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON: ' + parseError.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
    } = body;

    // Validate required fields
    if (!walletAddress) {
      return new Response(JSON.stringify({
        error: 'Wallet address is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    return new Response(JSON.stringify({
      success: true,
      profile: result[0],
      message: 'Profile saved successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to save profile',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
