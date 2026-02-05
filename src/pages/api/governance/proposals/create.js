// /api/governance/proposals/create.js
// Create a new governance proposal

import { neon } from '@neondatabase/serverless';

const MIN_VOTING_POWER_TO_PROPOSE = 100;
const DEFAULT_VOTING_DAYS = 7;
const EXECUTION_DELAY_HOURS = 48;

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      proposalType, // 'funding', 'policy', 'parameter', 'feature', 'grant', 'emergency', 'community'
      title,
      summary,
      description,
      discussionUrl,
      // For funding proposals
      fundingAmount,
      fundingCurrency = 'USD',
      fundingRecipient,
      // Execution
      executionPayload,
      // Custom parameters
      votingDurationDays = DEFAULT_VOTING_DAYS,
      requiredQuorumPct = 10,
      requiredMajorityPct = 50,
      tags = []
    } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!title || title.trim().length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Title is required (minimum 10 characters)'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!description || description.trim().length < 100) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Description is required (minimum 100 characters)'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validTypes = ['funding', 'policy', 'parameter', 'feature', 'grant', 'emergency', 'community'];
    if (!proposalType || !validTypes.includes(proposalType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Proposal type is required. Must be one of: ${validTypes.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (proposalType === 'funding' && (!fundingAmount || fundingAmount <= 0)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Funding amount is required for funding proposals'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Check user's voting power
    const govTokens = await sql`
      SELECT effective_voting_power, proposals_created, last_proposal_at
      FROM governance_tokens
      WHERE wallet_address = ${walletAddress}
    `;

    const votingPower = govTokens.length > 0 ? parseFloat(govTokens[0].effective_voting_power || 0) : 0;

    if (votingPower < MIN_VOTING_POWER_TO_PROPOSE) {
      return new Response(JSON.stringify({
        success: false,
        error: `Minimum ${MIN_VOTING_POWER_TO_PROPOSE} voting power required to create proposals`,
        currentPower: votingPower,
        required: MIN_VOTING_POWER_TO_PROPOSE
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Check proposal cooldown (7 days between proposals)
    const lastProposal = govTokens[0]?.last_proposal_at;
    if (lastProposal) {
      const daysSinceLastProposal = (Date.now() - new Date(lastProposal).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastProposal < 7) {
        return new Response(JSON.stringify({
          success: false,
          error: `Must wait 7 days between proposals. Days remaining: ${Math.ceil(7 - daysSinceLastProposal)}`,
          nextAllowed: new Date(new Date(lastProposal).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }), { status: 429, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Check max active proposals
    const activeProposals = await sql`
      SELECT COUNT(*) as count FROM governance_proposals
      WHERE status = 'active'
    `;

    if (parseInt(activeProposals[0]?.count || 0) >= 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Maximum number of active proposals (10) reached. Wait for some to complete.'
      }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    // Get next proposal number
    const lastProposalNum = await sql`
      SELECT MAX(proposal_number) as max_num FROM governance_proposals
    `;

    const proposalNumber = (lastProposalNum[0]?.max_num || 0) + 1;

    // Calculate voting period
    const votingStarts = new Date();
    const votingEnds = new Date(votingStarts.getTime() + votingDurationDays * 24 * 60 * 60 * 1000);

    // Create proposal
    const result = await sql`
      INSERT INTO governance_proposals (
        proposal_number,
        proposer_wallet,
        proposal_type,
        title,
        summary,
        description,
        discussion_url,
        funding_amount,
        funding_currency,
        funding_recipient,
        execution_payload,
        execution_delay_hours,
        required_quorum_pct,
        required_majority_pct,
        voting_starts,
        voting_ends,
        voting_duration_days,
        tags,
        status
      ) VALUES (
        ${proposalNumber},
        ${walletAddress},
        ${proposalType},
        ${title.trim()},
        ${summary || null},
        ${description.trim()},
        ${discussionUrl || null},
        ${fundingAmount || null},
        ${fundingCurrency},
        ${fundingRecipient || null},
        ${executionPayload ? JSON.stringify(executionPayload) : null},
        ${EXECUTION_DELAY_HOURS},
        ${requiredQuorumPct},
        ${requiredMajorityPct},
        ${votingStarts.toISOString()},
        ${votingEnds.toISOString()},
        ${votingDurationDays},
        ${tags},
        'active'
      )
      RETURNING id, proposal_number, created_at
    `;

    const proposal = result[0];

    // Update proposer stats
    await sql`
      INSERT INTO governance_tokens (wallet_address, proposals_created, last_proposal_at)
      VALUES (${walletAddress}, 1, NOW())
      ON CONFLICT (wallet_address) DO UPDATE SET
        proposals_created = governance_tokens.proposals_created + 1,
        last_proposal_at = NOW(),
        updated_at = NOW()
    `;

    // Log action
    await sql`
      INSERT INTO governance_actions (action_type, wallet_address, proposal_id, action_data)
      VALUES (
        'proposal_created',
        ${walletAddress},
        ${proposal.id},
        ${JSON.stringify({ proposal_number: proposalNumber, type: proposalType })}
      )
    `;

    // Award XP for creating proposal
    const xpEarned = 100;
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
        'governance_proposal',
        ${xpEarned},
        ${`Created governance proposal: ${title}`},
        ${JSON.stringify({ proposal_id: proposal.id, proposal_number: proposalNumber })}
      )
    `.catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      proposal: {
        id: proposal.id,
        number: proposalNumber,
        displayId: `WB-${String(proposalNumber).padStart(3, '0')}`,
        type: proposalType,
        title,
        status: 'active',
        votingStarts: votingStarts.toISOString(),
        votingEnds: votingEnds.toISOString(),
        votingDays: votingDurationDays,
        quorumRequired: requiredQuorumPct,
        majorityRequired: requiredMajorityPct,
        created_at: proposal.created_at
      },
      xpEarned,
      message: `Proposal WB-${String(proposalNumber).padStart(3, '0')} created! Voting is now open for ${votingDurationDays} days.`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating proposal:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create proposal: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - List governance proposals
export async function GET({ request }) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const proposerWallet = url.searchParams.get('proposer');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    const proposals = await sql`
      SELECT
        p.id,
        p.proposal_number,
        p.proposer_wallet,
        p.proposal_type,
        p.title,
        p.summary,
        p.funding_amount,
        p.funding_currency,
        p.votes_for,
        p.votes_against,
        p.votes_abstain,
        p.total_voters,
        p.required_quorum_pct,
        p.required_majority_pct,
        p.quorum_reached,
        p.passed,
        p.status,
        p.voting_starts,
        p.voting_ends,
        p.tags,
        p.created_at,
        u.username as proposer_name,
        u.avatar_url as proposer_avatar
      FROM governance_proposals p
      LEFT JOIN user_profiles u ON p.proposer_wallet = u.wallet_address
      WHERE 1=1
      ${status ? sql`AND p.status = ${status}` : sql``}
      ${type ? sql`AND p.proposal_type = ${type}` : sql``}
      ${proposerWallet ? sql`AND p.proposer_wallet = ${proposerWallet}` : sql``}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Enhance with calculated fields
    const enhancedProposals = proposals.map(p => {
      const totalVotes = parseFloat(p.votes_for || 0) + parseFloat(p.votes_against || 0) + parseFloat(p.votes_abstain || 0);
      const forPct = totalVotes > 0 ? (parseFloat(p.votes_for || 0) / totalVotes * 100) : 0;
      const againstPct = totalVotes > 0 ? (parseFloat(p.votes_against || 0) / totalVotes * 100) : 0;
      const timeRemaining = p.voting_ends ? Math.max(0, new Date(p.voting_ends) - new Date()) : 0;

      return {
        ...p,
        displayId: `WB-${String(p.proposal_number).padStart(3, '0')}`,
        totalVotingPower: totalVotes,
        forPercentage: forPct.toFixed(1),
        againstPercentage: againstPct.toFixed(1),
        timeRemainingMs: timeRemaining,
        timeRemainingDays: Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))
      };
    });

    // Get status counts
    const statusCounts = await sql`
      SELECT status, COUNT(*) as count
      FROM governance_proposals
      GROUP BY status
    `;

    return new Response(JSON.stringify({
      success: true,
      proposals: enhancedProposals,
      statusCounts: statusCounts.reduce((acc, s) => {
        acc[s.status] = parseInt(s.count);
        return acc;
      }, {}),
      pagination: {
        limit,
        offset,
        count: proposals.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching proposals:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch proposals'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
