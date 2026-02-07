/**
 * POST /api/settings/test-db
 * Test a database connection string
 *
 * Body:
 * - connectionString: string (required) - Neon/Postgres connection URL
 *
 * Returns connection status, server version, and existing table list
 */

import { neon } from '@neondatabase/serverless';

export const prerender = false;

export async function POST({ request }) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content-Type must be application/json'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { connectionString } = body;

    if (!connectionString) {
      return new Response(JSON.stringify({
        success: false,
        error: 'connectionString is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Basic URL format validation
    if (!connectionString.startsWith('postgres://') && !connectionString.startsWith('postgresql://')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Connection string must start with postgres:// or postgresql://'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(connectionString);
    const startTime = Date.now();

    // Test basic connectivity
    const versionResult = await sql`SELECT version()`;
    const latency = Date.now() - startTime;

    // Get database name
    const dbResult = await sql`SELECT current_database() as db_name, current_user as db_user`;

    // List existing tables
    const tablesResult = await sql`
      SELECT table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public')::int as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    // Check which wb1 tables exist
    const wb1Tables = [
      'user_profiles', 'tracks', 'battles', 'battle_submissions', 'battle_votes',
      'challenges', 'challenge_participants', 'challenge_submissions', 'challenge_votes',
      'activity_log', 'playlists', 'playlist_tracks', 'track_likes', 'track_plays',
      'track_comments', 'track_collaborators'
    ];

    const existingTableNames = tablesResult.map(t => t.table_name);
    const wb1Status = wb1Tables.map(name => ({
      table: name,
      exists: existingTableNames.includes(name)
    }));

    const wb1TablesFound = wb1Status.filter(t => t.exists).length;

    return new Response(JSON.stringify({
      success: true,
      connection: {
        status: 'connected',
        latency: `${latency}ms`,
        version: versionResult[0]?.version?.split(' ').slice(0, 2).join(' ') || 'Unknown',
        database: dbResult[0]?.db_name || 'Unknown',
        user: dbResult[0]?.db_user || 'Unknown'
      },
      tables: {
        total: tablesResult.length,
        list: tablesResult.map(t => ({ name: t.table_name, columns: t.column_count })),
        wb1Status,
        wb1TablesFound,
        wb1TablesTotal: wb1Tables.length,
        schemaReady: wb1TablesFound >= 6 // Core tables present
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Parse common connection errors for user-friendly messages
    let userMessage = error.message;
    let hint = '';

    if (error.message.includes('SASL') || error.message.includes('password')) {
      userMessage = 'Authentication failed';
      hint = 'Check your username and password in the connection string.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      userMessage = 'Server not found';
      hint = 'Check the hostname in your connection string. It should end with .neon.tech';
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      userMessage = 'Connection timed out';
      hint = 'The database server may be sleeping. Neon free tier databases suspend after inactivity - try again in a few seconds.';
    } else if (error.message.includes('does not exist')) {
      userMessage = 'Database not found';
      hint = 'The database name in your connection string may be wrong. Check your Neon dashboard.';
    } else if (error.message.includes('SSL')) {
      userMessage = 'SSL connection error';
      hint = 'Try adding ?sslmode=require to the end of your connection string.';
    }

    return new Response(JSON.stringify({
      success: false,
      error: userMessage,
      hint,
      details: error.message
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET: Test the currently configured database
export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL || process.env.NILE_DATABASE_URL;

    if (!dbUrl) {
      return new Response(JSON.stringify({
        success: false,
        configured: false,
        error: 'No DATABASE_URL or NILE_DATABASE_URL configured'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(dbUrl);
    const startTime = Date.now();
    const result = await sql`SELECT current_database() as db_name, current_user as db_user`;
    const latency = Date.now() - startTime;

    // Mask the connection string for display
    const masked = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');

    return new Response(JSON.stringify({
      success: true,
      configured: true,
      connection: {
        status: 'connected',
        latency: `${latency}ms`,
        database: result[0]?.db_name,
        user: result[0]?.db_user,
        url: masked
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      configured: true,
      error: error.message
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
