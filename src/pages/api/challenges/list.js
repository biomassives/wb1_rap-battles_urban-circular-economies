/**
 * GET /api/challenges/list
 * List challenges with filtering options
 *
 * Query params:
 * - status: 'pending' | 'accepted' | 'in_progress' | 'voting' | 'completed' | 'all' (default: 'all')
 * - type: 'rap_battle' | 'beat_battle' | 'remix_challenge' | 'freestyle' | 'all' (default: 'all')
 * - mode: '1v1' | 'group' | 'open' | 'all' (default: 'all')
 * - limit: number (default: 20, max: 50)
 * - offset: number (default: 0)
 * - walletAddress: string (optional - to get user's challenges)
 * - search: string (optional - search titles)
 * - featured: boolean (optional - only featured)
 */

import { neon } from '@neondatabase/serverless';

export const prerender = false;

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const type = url.searchParams.get('type') || 'all';
    const mode = url.searchParams.get('mode') || 'all';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const walletAddress = url.searchParams.get('walletAddress');
    const search = url.searchParams.get('search');
    const featured = url.searchParams.get('featured') === 'true';

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    const challenges = await sql`
      SELECT
        c.id,
        c.invite_code,
        c.creator_wallet,
        c.title,
        c.description,
        c.type,
        c.mode,
        c.category,
        c.stakes_type,
        c.stakes_amount,
        c.beat_config,
        c.beat_audio_url,
        c.max_participants,
        c.min_participants,
        c.status,
        c.battle_id,
        c.duration_hours,
        c.created_at,
        c.expires_at,
        c.started_at,
        c.voting_ends_at,
        c.completed_at,
        c.is_public,
        c.is_featured,

        -- Creator info
        creator.username as creator_name,
        creator.avatar_url as creator_avatar,
        creator.level as creator_level,

        -- Participant count
        COALESCE(
          (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id AND status = 'accepted'),
          0
        )::int as participant_count,

        -- Submission count
        COALESCE(
          (SELECT COUNT(*) FROM challenge_submissions WHERE challenge_id = c.id),
          0
        )::int as submission_count,

        -- Total votes
        COALESCE(
          (SELECT COUNT(*) FROM challenge_votes WHERE challenge_id = c.id),
          0
        )::int as total_votes

      FROM challenges c
      LEFT JOIN user_profiles creator ON c.creator_wallet = creator.wallet_address
      WHERE c.is_public = true
        AND c.is_flagged = false
        ${status !== 'all' ? sql`AND c.status = ${status}` : sql``}
        ${type !== 'all' ? sql`AND c.type = ${type}` : sql``}
        ${mode !== 'all' ? sql`AND c.mode = ${mode}` : sql``}
        ${featured ? sql`AND c.is_featured = true` : sql``}
        ${search ? sql`AND c.title ILIKE ${'%' + search + '%'}` : sql``}
        ${walletAddress ? sql`AND (
          c.creator_wallet = ${walletAddress}
          OR EXISTS (
            SELECT 1 FROM challenge_participants cp
            WHERE cp.challenge_id = c.id AND cp.wallet_address = ${walletAddress}
          )
        )` : sql``}
      ORDER BY
        CASE c.status
          WHEN 'in_progress' THEN 1
          WHEN 'voting' THEN 2
          WHEN 'pending' THEN 3
          WHEN 'accepted' THEN 4
          ELSE 5
        END,
        c.is_featured DESC,
        c.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*)::int as total
      FROM challenges c
      WHERE c.is_public = true
        AND c.is_flagged = false
        ${status !== 'all' ? sql`AND c.status = ${status}` : sql``}
        ${type !== 'all' ? sql`AND c.type = ${type}` : sql``}
        ${mode !== 'all' ? sql`AND c.mode = ${mode}` : sql``}
        ${featured ? sql`AND c.is_featured = true` : sql``}
        ${search ? sql`AND c.title ILIKE ${'%' + search + '%'}` : sql``}
    `;
    const totalCount = countResult[0]?.total || 0;

    const transformedChallenges = challenges.map(c => ({
      id: c.id,
      inviteCode: c.invite_code,
      title: c.title,
      description: c.description,
      type: c.type,
      mode: c.mode,
      category: c.category,
      stakes: { type: c.stakes_type, amount: c.stakes_amount },
      hasBeat: !!c.beat_config,
      beatAudioUrl: c.beat_audio_url,
      maxParticipants: c.max_participants,
      participantCount: c.participant_count,
      submissionCount: c.submission_count,
      totalVotes: c.total_votes,
      status: c.status,
      battleId: c.battle_id,
      isPublic: c.is_public,
      isFeatured: c.is_featured,
      createdAt: c.created_at,
      expiresAt: c.expires_at,
      startedAt: c.started_at,
      completedAt: c.completed_at,
      joinUrl: `/challenge/join/${c.invite_code}`,
      creator: {
        wallet: c.creator_wallet,
        name: c.creator_name || `User_${c.creator_wallet?.slice(0, 6)}`,
        avatar: c.creator_avatar || c.creator_name?.charAt(0)?.toUpperCase() || 'C',
        level: c.creator_level || 1
      },
      timeRemaining: c.expires_at ? Math.max(0, new Date(c.expires_at) - Date.now()) : null
    }));

    return new Response(JSON.stringify({
      success: true,
      challenges: transformedChallenges,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching challenges:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch challenges',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
