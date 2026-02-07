/**
 * POST /api/settings/init-schema
 * Initialize wb1 database schema on a Neon database
 *
 * Body:
 * - connectionString: string (required) - Neon/Postgres connection URL
 * - tables: string[] (optional) - specific table groups to create. Default: all
 *   Valid groups: 'core', 'music', 'battles', 'challenges'
 *
 * Creates tables in dependency order using IF NOT EXISTS (safe to re-run)
 */

import { neon } from '@neondatabase/serverless';

export const prerender = false;

// Schema statements grouped by feature
const SCHEMA_GROUPS = {
  core: {
    label: 'Core (user_profiles, activity_log)',
    statements: [
      `CREATE TABLE IF NOT EXISTS user_profiles (
        wallet_address VARCHAR(44) PRIMARY KEY,
        username VARCHAR(50),
        avatar_url TEXT,
        bio TEXT,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_profiles_username ON user_profiles(username)`,
      `CREATE INDEX IF NOT EXISTS idx_profiles_level ON user_profiles(level DESC)`,

      `CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(44) NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        activity_data JSONB DEFAULT '{}',
        xp_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_activity_wallet ON activity_log(wallet_address)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(activity_type)`,
      `CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC)`
    ]
  },

  music: {
    label: 'Music (tracks, collaborators, likes, plays, comments, playlists)',
    statements: [
      `CREATE TABLE IF NOT EXISTS tracks (
        id SERIAL PRIMARY KEY,
        user_wallet VARCHAR(44) NOT NULL,
        title VARCHAR(200) NOT NULL,
        genre VARCHAR(50) NOT NULL,
        audio_url TEXT NOT NULL,
        cover_art_url TEXT,
        lyrics TEXT,
        description TEXT,
        duration INTEGER,
        bpm INTEGER,
        key VARCHAR(10),
        is_collaboration BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'published',
        scheduled_date TIMESTAMP,
        plays INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        tags JSONB DEFAULT '[]',
        nft_mint_address VARCHAR(44),
        nft_metadata_uri TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_tracks_user_wallet ON tracks(user_wallet)`,
      `CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre)`,
      `CREATE INDEX IF NOT EXISTS idx_tracks_status ON tracks(status)`,
      `CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at DESC)`,

      `CREATE TABLE IF NOT EXISTS track_collaborators (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        collaborator_wallet VARCHAR(44) NOT NULL,
        role VARCHAR(50) DEFAULT 'collaborator',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(track_id, collaborator_wallet)
      )`,

      `CREATE TABLE IF NOT EXISTS track_likes (
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        user_wallet VARCHAR(44) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (track_id, user_wallet)
      )`,

      `CREATE TABLE IF NOT EXISTS track_plays (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        listener_wallet VARCHAR(44),
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS track_comments (
        id SERIAL PRIMARY KEY,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        user_wallet VARCHAR(44) NOT NULL,
        comment TEXT NOT NULL,
        parent_comment_id INTEGER REFERENCES track_comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        user_wallet VARCHAR(44) NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        cover_image_url TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS playlist_tracks (
        id SERIAL PRIMARY KEY,
        playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
        track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        added_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(playlist_id, track_id)
      )`
    ]
  },

  battles: {
    label: 'Battles (battles, submissions, votes)',
    statements: [
      `CREATE TABLE IF NOT EXISTS battles (
        id SERIAL PRIMARY KEY,
        challenger_wallet VARCHAR(44) NOT NULL,
        opponent_wallet VARCHAR(44),
        category VARCHAR(50) NOT NULL DEFAULT 'freestyle',
        rounds INTEGER DEFAULT 3,
        bars_per_round INTEGER DEFAULT 16,
        time_limit VARCHAR(10) DEFAULT '48h',
        stake_amount INTEGER DEFAULT 0,
        stake_currency VARCHAR(10) DEFAULT 'XP',
        theme VARCHAR(200),
        title VARCHAR(200),
        status VARCHAR(20) DEFAULT 'pending',
        winner_wallet VARCHAR(44),
        beat_config JSONB,
        beat_audio_url TEXT,
        challenge_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        completed_at TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status)`,
      `CREATE INDEX IF NOT EXISTS idx_battles_created ON battles(created_at DESC)`,

      `CREATE TABLE IF NOT EXISTS battle_submissions (
        id SERIAL PRIMARY KEY,
        battle_id INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
        user_wallet VARCHAR(44) NOT NULL,
        round INTEGER NOT NULL,
        audio_url TEXT NOT NULL,
        lyrics TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(battle_id, user_wallet, round)
      )`,

      `CREATE TABLE IF NOT EXISTS battle_votes (
        id SERIAL PRIMARY KEY,
        battle_id INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
        voter_wallet VARCHAR(44) NOT NULL,
        winner_wallet VARCHAR(44) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(battle_id, voter_wallet)
      )`
    ]
  },

  challenges: {
    label: 'Challenges (challenges, participants, submissions, votes)',
    statements: [
      `CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        invite_code VARCHAR(6) UNIQUE NOT NULL,
        creator_wallet VARCHAR(44) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        type VARCHAR(30) NOT NULL DEFAULT 'rap_battle',
        mode VARCHAR(20) NOT NULL DEFAULT '1v1',
        category VARCHAR(50) DEFAULT 'freestyle',
        stakes_type VARCHAR(20) DEFAULT 'xp',
        stakes_amount INTEGER DEFAULT 50,
        beat_config JSONB,
        beat_audio_url TEXT,
        max_participants INTEGER DEFAULT 2,
        min_participants INTEGER DEFAULT 2,
        status VARCHAR(20) DEFAULT 'pending',
        battle_id INTEGER REFERENCES battles(id),
        duration_hours INTEGER DEFAULT 72,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        started_at TIMESTAMP,
        voting_ends_at TIMESTAMP,
        completed_at TIMESTAMP,
        is_public BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        is_flagged BOOLEAN DEFAULT FALSE,
        flag_reason TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_challenges_invite_code ON challenges(invite_code)`,
      `CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status)`,
      `CREATE INDEX IF NOT EXISTS idx_challenges_created ON challenges(created_at DESC)`,

      `CREATE TABLE IF NOT EXISTS challenge_participants (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        wallet_address VARCHAR(44) NOT NULL,
        role VARCHAR(20) DEFAULT 'challenger',
        status VARCHAR(20) DEFAULT 'accepted',
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(challenge_id, wallet_address)
      )`,

      `CREATE TABLE IF NOT EXISTS challenge_submissions (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        participant_wallet VARCHAR(44) NOT NULL,
        audio_url TEXT NOT NULL,
        beat_config JSONB,
        description TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        vote_count INTEGER DEFAULT 0,
        UNIQUE(challenge_id, participant_wallet)
      )`,

      `CREATE TABLE IF NOT EXISTS challenge_votes (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        submission_id INTEGER NOT NULL REFERENCES challenge_submissions(id) ON DELETE CASCADE,
        voter_wallet VARCHAR(44) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(challenge_id, voter_wallet)
      )`
    ]
  },

  community: {
    label: 'Community (artist_reviews, mentoring_sessions, citizen_science_data, xp_activities)',
    statements: [
      `CREATE TABLE IF NOT EXISTS artist_reviews (
        id SERIAL PRIMARY KEY,
        reviewer_wallet VARCHAR(44) NOT NULL,
        target_wallet VARCHAR(44),
        track_id INTEGER,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review TEXT NOT NULL,
        xp_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON artist_reviews(reviewer_wallet)`,
      `CREATE INDEX IF NOT EXISTS idx_reviews_target ON artist_reviews(target_wallet)`,

      `CREATE TABLE IF NOT EXISTS mentoring_sessions (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(44) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'mentee',
        session_type VARCHAR(50) DEFAULT 'checkin',
        partner_wallet VARCHAR(44),
        notes TEXT,
        duration_minutes INTEGER,
        xp_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_mentoring_wallet ON mentoring_sessions(wallet_address)`,

      `CREATE TABLE IF NOT EXISTS citizen_science_data (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(44) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        measurements JSONB NOT NULL DEFAULT '{}',
        location_lat DECIMAL(10,7),
        location_lng DECIMAL(10,7),
        location_name VARCHAR(200),
        photo_urls JSONB DEFAULT '[]',
        verified BOOLEAN DEFAULT FALSE,
        verified_by VARCHAR(44),
        xp_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_citizen_science_wallet ON citizen_science_data(wallet_address)`,
      `CREATE INDEX IF NOT EXISTS idx_citizen_science_type ON citizen_science_data(data_type)`,

      `CREATE TABLE IF NOT EXISTS xp_activities (
        id SERIAL PRIMARY KEY,
        user_wallet VARCHAR(44) NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        xp_earned INTEGER DEFAULT 0,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_xp_activities_wallet ON xp_activities(user_wallet)`,
      `CREATE INDEX IF NOT EXISTS idx_xp_activities_type ON xp_activities(activity_type)`
    ]
  }
};

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { connectionString, tables } = body;

    if (!connectionString) {
      return new Response(JSON.stringify({
        success: false,
        error: 'connectionString is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(connectionString);

    // Determine which groups to run
    const groupsToRun = tables && tables.length > 0
      ? tables.filter(t => SCHEMA_GROUPS[t])
      : Object.keys(SCHEMA_GROUPS);

    const results = [];
    let totalStatements = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const groupName of groupsToRun) {
      const group = SCHEMA_GROUPS[groupName];
      const groupResult = {
        group: groupName,
        label: group.label,
        statements: group.statements.length,
        success: 0,
        errors: []
      };

      for (const statement of group.statements) {
        totalStatements++;
        try {
          await sql(statement);
          groupResult.success++;
          successCount++;
        } catch (err) {
          // IF NOT EXISTS means most errors are non-fatal (index already exists, etc.)
          if (err.message.includes('already exists')) {
            groupResult.success++;
            successCount++;
          } else {
            groupResult.errors.push({
              statement: statement.split('\n')[0].trim().substring(0, 80),
              error: err.message
            });
            errorCount++;
          }
        }
      }

      results.push(groupResult);
    }

    // Verify final state - list tables
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    return new Response(JSON.stringify({
      success: errorCount === 0,
      message: errorCount === 0
        ? `Schema initialized successfully! ${successCount} statements executed.`
        : `Schema partially initialized. ${successCount} succeeded, ${errorCount} failed.`,
      results,
      summary: {
        totalStatements,
        successCount,
        errorCount,
        tablesNow: tablesResult.map(t => t.table_name)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to initialize schema',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET: Return available schema groups
export async function GET() {
  const groups = Object.entries(SCHEMA_GROUPS).map(([key, val]) => ({
    id: key,
    label: val.label,
    statementCount: val.statements.length
  }));

  return new Response(JSON.stringify({
    success: true,
    groups
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
