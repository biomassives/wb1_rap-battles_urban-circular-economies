// /api/proposals/[id]/vote.js
// Vote on a project proposal

import { neon } from '@neondatabase/serverless';

const XP_VALUES = {
  vote_cast: 10,
  first_vote_bonus: 25
};

export async function POST({ params, request }) {
  try {
    const proposalId = params.id;
    const body = await request.json();
    const {
      walletAddress,
      voteChoice, // 'for', 'against', 'abstain'
      reason
    } = body;

    // Validate required fields
    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!proposalId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Proposal ID is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validChoices = ['for', 'against', 'abstain'];
    if (!voteChoice || !validChoices.includes(voteChoice)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Vote choice is required. Must be one of: ${validChoices.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get proposal
    const proposal = await sql`
      SELECT id, title, status, proposer_wallet, voting_ends
      FROM project_proposals
      WHERE id = ${proposalId}
    `;

    if (proposal.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Proposal not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const proposalData = proposal[0];

    // Check if proposal is in voting status
    if (proposalData.status !== 'voting' && proposalData.status !== 'active') {
      return new Response(JSON.stringify({
        success: false,
        error: `Proposal is not open for voting. Status: ${proposalData.status}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check voting period
    if (proposalData.voting_ends && new Date(proposalData.voting_ends) < new Date()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Voting period has ended'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Cannot vote on own proposal
    if (proposalData.proposer_wallet === walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot vote on your own proposal'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if already voted
    const existingVote = await sql`
      SELECT id, vote_choice FROM proposal_votes
      WHERE proposal_id = ${proposalId}
        AND voter_wallet = ${walletAddress}
    `;

    if (existingVote.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have already voted on this proposal',
        previousVote: existingVote[0].vote_choice
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Get user's voting power (simplified: 1 vote per user, could be enhanced with NFT-based power)
    const user = await sql`
      SELECT level, xp FROM user_profiles
      WHERE wallet_address = ${walletAddress}
    `;

    const userLevel = user.length > 0
      ? (user[0].level || Math.floor(Math.sqrt((user[0].xp || 0) / 100)) + 1)
      : 1;

    // Voting power based on level (1 base + 0.1 per level)
    const votingPower = 1 + (userLevel * 0.1);

    // Insert vote
    const voteResult = await sql`
      INSERT INTO proposal_votes (
        proposal_id,
        voter_wallet,
        vote_choice,
        voting_power,
        reason
      ) VALUES (
        ${proposalId},
        ${walletAddress},
        ${voteChoice},
        ${votingPower},
        ${reason || null}
      )
      RETURNING id, created_at
    `;

    const vote = voteResult[0];

    // Update proposal vote counts
    if (voteChoice === 'for') {
      await sql`
        UPDATE project_proposals
        SET votes_for = votes_for + ${votingPower},
            total_voters = total_voters + 1,
            updated_at = NOW()
        WHERE id = ${proposalId}
      `;
    } else if (voteChoice === 'against') {
      await sql`
        UPDATE project_proposals
        SET votes_against = votes_against + ${votingPower},
            total_voters = total_voters + 1,
            updated_at = NOW()
        WHERE id = ${proposalId}
      `;
    } else {
      await sql`
        UPDATE project_proposals
        SET total_voters = total_voters + 1,
            updated_at = NOW()
        WHERE id = ${proposalId}
      `;
    }

    // Check if this is user's first vote ever
    const previousVotes = await sql`
      SELECT COUNT(*) as count FROM proposal_votes
      WHERE voter_wallet = ${walletAddress}
    `;

    const isFirstVote = parseInt(previousVotes[0]?.count || 0) <= 1;
    const xpEarned = XP_VALUES.vote_cast + (isFirstVote ? XP_VALUES.first_vote_bonus : 0);

    // Award XP for voting
    await sql`
      UPDATE user_profiles
      SET xp = xp + ${xpEarned},
          updated_at = NOW()
      WHERE wallet_address = ${walletAddress}
    `.catch(() => {});

    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
      VALUES (
        ${walletAddress},
        'proposal_vote',
        ${xpEarned},
        ${`Voted ${voteChoice} on: ${proposalData.title}`},
        ${JSON.stringify({ proposal_id: proposalId, vote_choice: voteChoice })}
      )
    `.catch(() => {});

    // Get updated vote counts
    const updatedProposal = await sql`
      SELECT votes_for, votes_against, total_voters
      FROM project_proposals
      WHERE id = ${proposalId}
    `;

    return new Response(JSON.stringify({
      success: true,
      vote: {
        id: vote.id,
        proposalId,
        choice: voteChoice,
        votingPower,
        created_at: vote.created_at
      },
      proposal: {
        id: proposalId,
        title: proposalData.title,
        votesFor: updatedProposal[0]?.votes_for || 0,
        votesAgainst: updatedProposal[0]?.votes_against || 0,
        totalVoters: updatedProposal[0]?.total_voters || 0
      },
      xpEarned,
      isFirstVote,
      message: `Vote recorded! Earned ${xpEarned} XP.${isFirstVote ? ' (Includes first vote bonus!)' : ''}`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error casting vote:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to cast vote: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - Get votes for a proposal
export async function GET({ params, request }) {
  const proposalId = params.id;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get proposal
    const proposal = await sql`
      SELECT id, title, votes_for, votes_against, total_voters, status
      FROM project_proposals
      WHERE id = ${proposalId}
    `;

    if (proposal.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Proposal not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Get votes
    const votes = await sql`
      SELECT
        v.id,
        v.voter_wallet,
        v.vote_choice,
        v.voting_power,
        v.reason,
        v.created_at,
        u.username,
        u.avatar_url
      FROM proposal_votes v
      LEFT JOIN user_profiles u ON v.voter_wallet = u.wallet_address
      WHERE v.proposal_id = ${proposalId}
      ORDER BY v.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get vote breakdown
    const breakdown = await sql`
      SELECT
        vote_choice,
        COUNT(*) as count,
        SUM(voting_power) as total_power
      FROM proposal_votes
      WHERE proposal_id = ${proposalId}
      GROUP BY vote_choice
    `;

    return new Response(JSON.stringify({
      success: true,
      proposal: proposal[0],
      votes,
      breakdown: breakdown.reduce((acc, b) => {
        acc[b.vote_choice] = {
          count: parseInt(b.count),
          power: parseFloat(b.total_power)
        };
        return acc;
      }, {}),
      pagination: {
        limit,
        offset,
        count: votes.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching votes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch votes'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
