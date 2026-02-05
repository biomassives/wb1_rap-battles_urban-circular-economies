// /api/governance/proposals/[id]/vote.js
// Cast a vote on a governance proposal

import { neon } from '@neondatabase/serverless';

export async function POST({ params, request }) {
  try {
    const proposalId = params.id;
    const body = await request.json();
    const {
      walletAddress,
      voteChoice, // 'for', 'against', 'abstain'
      reason
    } = body;

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
      SELECT
        id,
        proposal_number,
        title,
        status,
        proposer_wallet,
        voting_starts,
        voting_ends,
        required_quorum_pct,
        votes_for,
        votes_against,
        votes_abstain,
        total_voters
      FROM governance_proposals
      WHERE id = ${proposalId}
    `;

    if (proposal.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Proposal not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const proposalData = proposal[0];

    // Check if proposal is in active status
    if (proposalData.status !== 'active') {
      return new Response(JSON.stringify({
        success: false,
        error: `Proposal is not open for voting. Status: ${proposalData.status}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check voting period
    const now = new Date();
    if (proposalData.voting_starts && new Date(proposalData.voting_starts) > now) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Voting period has not started yet',
        votingStarts: proposalData.voting_starts
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (proposalData.voting_ends && new Date(proposalData.voting_ends) < now) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Voting period has ended',
        votingEnded: proposalData.voting_ends
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
      SELECT id, vote_choice FROM governance_votes
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

    // Get user's voting power
    const votingPower = await sql`
      SELECT effective_voting_power, delegated_to
      FROM governance_tokens
      WHERE wallet_address = ${walletAddress}
    `;

    const userVotingPower = votingPower.length > 0
      ? parseFloat(votingPower[0].effective_voting_power || 0)
      : 0;

    if (userVotingPower <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have no voting power. Earn NFTs, contribute to projects, or level up to gain voting power.',
        votingPower: 0
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if voting power is delegated
    if (votingPower[0]?.delegated_to) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Your voting power is delegated. Revoke delegation to vote directly.',
        delegatedTo: votingPower[0].delegated_to
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Cast vote
    const voteResult = await sql`
      INSERT INTO governance_votes (
        proposal_id,
        voter_wallet,
        vote_choice,
        voting_power_used,
        reason
      ) VALUES (
        ${proposalId},
        ${walletAddress},
        ${voteChoice},
        ${userVotingPower},
        ${reason || null}
      )
      RETURNING id, created_at
    `;

    const vote = voteResult[0];

    // Update proposal vote counts
    await sql`
      UPDATE governance_proposals
      SET
        votes_for = votes_for + ${voteChoice === 'for' ? userVotingPower : 0},
        votes_against = votes_against + ${voteChoice === 'against' ? userVotingPower : 0},
        votes_abstain = votes_abstain + ${voteChoice === 'abstain' ? userVotingPower : 0},
        total_voters = total_voters + 1,
        total_voting_power_cast = total_voting_power_cast + ${userVotingPower},
        updated_at = NOW()
      WHERE id = ${proposalId}
    `;

    // Update voter stats
    await sql`
      INSERT INTO governance_tokens (wallet_address, proposals_voted, last_vote_at)
      VALUES (${walletAddress}, 1, NOW())
      ON CONFLICT (wallet_address) DO UPDATE SET
        proposals_voted = governance_tokens.proposals_voted + 1,
        last_vote_at = NOW(),
        updated_at = NOW()
    `;

    // Log action
    await sql`
      INSERT INTO governance_actions (action_type, wallet_address, proposal_id, action_data)
      VALUES (
        'vote_cast',
        ${walletAddress},
        ${proposalId},
        ${JSON.stringify({ vote_choice: voteChoice, voting_power: userVotingPower })}
      )
    `;

    // Award XP for voting
    const xpEarned = 25;
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
        'governance_vote',
        ${xpEarned},
        ${`Voted ${voteChoice} on WB-${String(proposalData.proposal_number).padStart(3, '0')}`},
        ${JSON.stringify({ proposal_id: proposalId, vote_choice: voteChoice })}
      )
    `.catch(() => {});

    // Get updated proposal counts
    const updatedProposal = await sql`
      SELECT
        votes_for,
        votes_against,
        votes_abstain,
        total_voters,
        total_voting_power_cast
      FROM governance_proposals
      WHERE id = ${proposalId}
    `;

    const updated = updatedProposal[0];
    const totalVotes = parseFloat(updated.votes_for || 0) + parseFloat(updated.votes_against || 0);
    const forPct = totalVotes > 0 ? (parseFloat(updated.votes_for || 0) / totalVotes * 100) : 0;

    return new Response(JSON.stringify({
      success: true,
      vote: {
        id: vote.id,
        proposalId,
        choice: voteChoice,
        votingPowerUsed: userVotingPower,
        created_at: vote.created_at
      },
      proposal: {
        id: proposalId,
        displayId: `WB-${String(proposalData.proposal_number).padStart(3, '0')}`,
        title: proposalData.title,
        votesFor: updated.votes_for,
        votesAgainst: updated.votes_against,
        votesAbstain: updated.votes_abstain,
        totalVoters: updated.total_voters,
        currentForPercentage: forPct.toFixed(1)
      },
      xpEarned,
      message: `Vote recorded! Used ${userVotingPower.toFixed(2)} voting power. Earned ${xpEarned} XP.`
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
  const choice = url.searchParams.get('choice');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get proposal
    const proposal = await sql`
      SELECT
        id,
        proposal_number,
        title,
        votes_for,
        votes_against,
        votes_abstain,
        total_voters,
        total_voting_power_cast,
        required_quorum_pct,
        required_majority_pct,
        status
      FROM governance_proposals
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
        v.voting_power_used,
        v.reason,
        v.created_at,
        u.username,
        u.avatar_url
      FROM governance_votes v
      LEFT JOIN user_profiles u ON v.voter_wallet = u.wallet_address
      WHERE v.proposal_id = ${proposalId}
      ${choice ? sql`AND v.vote_choice = ${choice}` : sql``}
      ORDER BY v.voting_power_used DESC, v.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get vote breakdown
    const breakdown = await sql`
      SELECT
        vote_choice,
        COUNT(*) as count,
        SUM(voting_power_used) as total_power
      FROM governance_votes
      WHERE proposal_id = ${proposalId}
      GROUP BY vote_choice
    `;

    const proposalData = proposal[0];
    const totalVotes = parseFloat(proposalData.votes_for || 0) +
      parseFloat(proposalData.votes_against || 0) +
      parseFloat(proposalData.votes_abstain || 0);

    return new Response(JSON.stringify({
      success: true,
      proposal: {
        ...proposalData,
        displayId: `WB-${String(proposalData.proposal_number).padStart(3, '0')}`,
        forPercentage: totalVotes > 0 ? (parseFloat(proposalData.votes_for || 0) / totalVotes * 100).toFixed(1) : 0,
        againstPercentage: totalVotes > 0 ? (parseFloat(proposalData.votes_against || 0) / totalVotes * 100).toFixed(1) : 0
      },
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
