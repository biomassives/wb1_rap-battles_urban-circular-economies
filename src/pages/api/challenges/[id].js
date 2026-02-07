/**
 * GET /api/challenges/[id]
 * Get full challenge details with participants, submissions, and votes
 *
 * Query params:
 * - walletAddress: string (optional - to check if user has voted)
 */

import { neon } from '@neondatabase/serverless';

export const prerender = false;

export async function GET({ params, request }) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');

    const sql = neon(process.env.DATABASE_URL || process.env.NILE_DATABASE_URL);

    // Get challenge
    const challenges = await sql`
      SELECT
        c.*,
        creator.username as creator_name,
        creator.avatar_url as creator_avatar,
        creator.level as creator_level
      FROM challenges c
      LEFT JOIN user_profiles creator ON c.creator_wallet = creator.wallet_address
      WHERE c.id = ${id}
    `;

    if (challenges.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Challenge not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const challenge = challenges[0];

    // Get participants
    const participants = await sql`
      SELECT
        cp.wallet_address,
        cp.role,
        cp.status,
        cp.joined_at,
        u.username,
        u.avatar_url,
        u.level
      FROM challenge_participants cp
      LEFT JOIN user_profiles u ON cp.wallet_address = u.wallet_address
      WHERE cp.challenge_id = ${id}
      ORDER BY cp.joined_at ASC
    `;

    // Get submissions with vote counts
    const submissions = await sql`
      SELECT
        cs.id,
        cs.participant_wallet,
        cs.audio_url,
        cs.beat_config,
        cs.description,
        cs.submitted_at,
        cs.vote_count,
        u.username,
        u.avatar_url,
        u.level
      FROM challenge_submissions cs
      LEFT JOIN user_profiles u ON cs.participant_wallet = u.wallet_address
      WHERE cs.challenge_id = ${id}
      ORDER BY cs.vote_count DESC, cs.submitted_at ASC
    `;

    // Check if user has voted
    let userVote = null;
    if (walletAddress) {
      const votes = await sql`
        SELECT submission_id FROM challenge_votes
        WHERE challenge_id = ${id} AND voter_wallet = ${walletAddress}
      `;
      if (votes.length > 0) {
        userVote = votes[0].submission_id;
      }
    }

    // Check if user is a participant
    const isParticipant = walletAddress
      ? participants.some(p => p.wallet_address === walletAddress)
      : false;

    return new Response(JSON.stringify({
      success: true,
      challenge: {
        id: challenge.id,
        inviteCode: challenge.invite_code,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        mode: challenge.mode,
        category: challenge.category,
        stakes: { type: challenge.stakes_type, amount: challenge.stakes_amount },
        beatConfig: challenge.beat_config,
        beatAudioUrl: challenge.beat_audio_url,
        maxParticipants: challenge.max_participants,
        minParticipants: challenge.min_participants,
        status: challenge.status,
        battleId: challenge.battle_id,
        durationHours: challenge.duration_hours,
        isPublic: challenge.is_public,
        isFeatured: challenge.is_featured,
        createdAt: challenge.created_at,
        expiresAt: challenge.expires_at,
        startedAt: challenge.started_at,
        votingEndsAt: challenge.voting_ends_at,
        completedAt: challenge.completed_at,
        joinUrl: `/challenge/join/${challenge.invite_code}`,
        creator: {
          wallet: challenge.creator_wallet,
          name: challenge.creator_name || `User_${challenge.creator_wallet?.slice(0, 6)}`,
          avatar: challenge.creator_avatar || challenge.creator_name?.charAt(0)?.toUpperCase() || 'C',
          level: challenge.creator_level || 1
        },
        participants: participants.map(p => ({
          wallet: p.wallet_address,
          name: p.username || `User_${p.wallet_address?.slice(0, 6)}`,
          avatar: p.avatar_url || p.username?.charAt(0)?.toUpperCase() || 'P',
          level: p.level || 1,
          role: p.role,
          status: p.status,
          joinedAt: p.joined_at
        })),
        submissions: submissions.map(s => ({
          id: s.id,
          participantWallet: s.participant_wallet,
          participantName: s.username || `User_${s.participant_wallet?.slice(0, 6)}`,
          participantAvatar: s.avatar_url || s.username?.charAt(0)?.toUpperCase() || 'P',
          audioUrl: s.audio_url,
          beatConfig: s.beat_config,
          description: s.description,
          submittedAt: s.submitted_at,
          voteCount: s.vote_count
        })),
        userVote,
        isParticipant,
        timeRemaining: challenge.expires_at ? Math.max(0, new Date(challenge.expires_at) - Date.now()) : null
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching challenge:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch challenge',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
