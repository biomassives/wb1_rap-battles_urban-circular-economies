// /api/governance/voting-power.js
// Calculate and retrieve user's voting power

import { neon } from '@neondatabase/serverless';

// Voting power weights
const WEIGHTS = {
  nft: {
    common: 1,
    uncommon: 2,
    rare: 5,
    legendary: 10,
    mythic: 20
  },
  contribution_per_100_usd: 1,
  level_per_10: 1,
  stake_per_day: 0.01
};

export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  if (!walletAddress) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Wallet address is required'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get user profile
    const profile = await sql`
      SELECT xp, level FROM user_profiles
      WHERE wallet_address = ${walletAddress}
    `;

    if (profile.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User profile not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const userLevel = profile[0].level || Math.floor(Math.sqrt((profile[0].xp || 0) / 100)) + 1;

    // Check if governance tokens record exists
    let govTokens = await sql`
      SELECT * FROM governance_tokens
      WHERE wallet_address = ${walletAddress}
    `;

    // Calculate NFT voting power (simplified - would integrate with on-chain data)
    // For now, estimate based on NFT reward claims
    const nftClaims = await sql`
      SELECT
        r.rarity_tier,
        COUNT(*) as count
      FROM nft_reward_claims c
      JOIN nft_reward_rules r ON c.rule_id = r.id
      WHERE c.wallet_address = ${walletAddress}
        AND c.status IN ('claimed', 'minted')
      GROUP BY r.rarity_tier
    `;

    let nftVotingPower = 0;
    const nftBreakdown = {};
    for (const claim of nftClaims) {
      const rarity = (claim.rarity_tier || 'common').toLowerCase();
      const weight = WEIGHTS.nft[rarity] || 1;
      const power = weight * parseInt(claim.count);
      nftVotingPower += power;
      nftBreakdown[rarity] = {
        count: parseInt(claim.count),
        weight,
        power
      };
    }

    // Calculate contribution voting power
    const contributions = await sql`
      SELECT COALESCE(SUM(amount_value), 0) as total_value
      FROM project_contributions
      WHERE contributor_wallet = ${walletAddress}
    `;

    const totalContributionValue = parseFloat(contributions[0]?.total_value || 0);
    const contributionVotingPower = Math.floor(totalContributionValue / 100) * WEIGHTS.contribution_per_100_usd;

    // Calculate level voting power
    const levelVotingPower = Math.floor(userLevel / 10) * WEIGHTS.level_per_10;

    // Calculate stake voting power
    const stakes = await sql`
      SELECT
        COALESCE(SUM(
          EXTRACT(EPOCH FROM (LEAST(stake_ends_at, NOW()) - created_at)) / 86400
        ), 0) as total_stake_days
      FROM nft_stakes
      WHERE staker_wallet = ${walletAddress}
        AND status IN ('active', 'completed')
    `;

    const totalStakeDays = parseFloat(stakes[0]?.total_stake_days || 0);
    const stakeVotingPower = Math.floor(totalStakeDays * WEIGHTS.stake_per_day * 100) / 100;

    // Calculate base voting power
    const baseVotingPower = nftVotingPower + contributionVotingPower + levelVotingPower + stakeVotingPower;

    // Get delegations
    const delegationsReceived = await sql`
      SELECT
        COALESCE(SUM(
          gt.base_voting_power * (vd.delegation_pct / 100)
        ), 0) as total
      FROM vote_delegations vd
      JOIN governance_tokens gt ON vd.delegator_wallet = gt.wallet_address
      WHERE vd.delegate_wallet = ${walletAddress}
        AND vd.is_active = TRUE
    `;

    const delegatedTo = await sql`
      SELECT
        delegate_wallet,
        delegation_pct,
        delegation_scope
      FROM vote_delegations
      WHERE delegator_wallet = ${walletAddress}
        AND is_active = TRUE
    `;

    const receivedPower = parseFloat(delegationsReceived[0]?.total || 0);
    const delegatedOutPct = delegatedTo.length > 0 ? delegatedTo[0].delegation_pct : 0;
    const delegatedOutPower = baseVotingPower * (delegatedOutPct / 100);

    // Calculate effective voting power
    const effectiveVotingPower = baseVotingPower + receivedPower - delegatedOutPower;

    // Update or insert governance tokens record
    await sql`
      INSERT INTO governance_tokens (
        wallet_address,
        base_voting_power,
        nft_voting_power,
        contribution_voting_power,
        stake_voting_power,
        level_voting_power,
        delegations_received,
        effective_voting_power,
        updated_at
      ) VALUES (
        ${walletAddress},
        ${baseVotingPower},
        ${nftVotingPower},
        ${contributionVotingPower},
        ${stakeVotingPower},
        ${levelVotingPower},
        ${receivedPower},
        ${effectiveVotingPower},
        NOW()
      )
      ON CONFLICT (wallet_address) DO UPDATE SET
        base_voting_power = ${baseVotingPower},
        nft_voting_power = ${nftVotingPower},
        contribution_voting_power = ${contributionVotingPower},
        stake_voting_power = ${stakeVotingPower},
        level_voting_power = ${levelVotingPower},
        delegations_received = ${receivedPower},
        effective_voting_power = ${effectiveVotingPower},
        updated_at = NOW()
    `;

    // Get voting stats
    const votingStats = await sql`
      SELECT
        proposals_created,
        proposals_voted,
        last_vote_at,
        governance_reputation
      FROM governance_tokens
      WHERE wallet_address = ${walletAddress}
    `;

    return new Response(JSON.stringify({
      success: true,
      votingPower: {
        effective: effectiveVotingPower,
        base: baseVotingPower,
        breakdown: {
          nft: {
            total: nftVotingPower,
            byRarity: nftBreakdown
          },
          contributions: {
            total: contributionVotingPower,
            contributionValue: totalContributionValue
          },
          level: {
            total: levelVotingPower,
            currentLevel: userLevel
          },
          stake: {
            total: stakeVotingPower,
            totalDays: totalStakeDays
          }
        },
        delegations: {
          received: receivedPower,
          delegatedOut: delegatedOutPower,
          delegatedTo: delegatedTo.length > 0 ? delegatedTo[0].delegate_wallet : null,
          delegationPct: delegatedOutPct
        }
      },
      stats: votingStats[0] || {
        proposals_created: 0,
        proposals_voted: 0,
        governance_reputation: 100
      },
      weights: WEIGHTS,
      message: effectiveVotingPower > 0
        ? `You have ${effectiveVotingPower.toFixed(2)} voting power!`
        : 'Earn NFTs, contribute to projects, or level up to gain voting power.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error calculating voting power:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to calculate voting power'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// POST - Delegate voting power
export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      delegateWallet,
      delegationPct = 100,
      delegationScope = 'all', // 'all', 'funding', 'policy', 'parameter', 'feature'
      revoke = false
    } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!delegateWallet && !revoke) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Delegate wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (walletAddress === delegateWallet) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot delegate to yourself'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (delegationPct < 1 || delegationPct > 100) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Delegation percentage must be between 1 and 100'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    if (revoke) {
      // Revoke all delegations
      await sql`
        UPDATE vote_delegations
        SET is_active = FALSE,
            revoked_at = NOW()
        WHERE delegator_wallet = ${walletAddress}
          AND is_active = TRUE
      `;

      // Update governance tokens
      await sql`
        UPDATE governance_tokens
        SET delegated_to = NULL,
            delegation_pct = 100,
            updated_at = NOW()
        WHERE wallet_address = ${walletAddress}
      `;

      return new Response(JSON.stringify({
        success: true,
        message: 'All delegations revoked. Your voting power is now fully restored.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if delegate exists
    const delegate = await sql`
      SELECT wallet_address, username FROM user_profiles
      WHERE wallet_address = ${delegateWallet}
    `;

    if (delegate.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Delegate wallet not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Revoke existing delegation in same scope
    await sql`
      UPDATE vote_delegations
      SET is_active = FALSE,
          revoked_at = NOW()
      WHERE delegator_wallet = ${walletAddress}
        AND delegation_scope = ${delegationScope}
        AND is_active = TRUE
    `;

    // Create new delegation
    await sql`
      INSERT INTO vote_delegations (
        delegator_wallet,
        delegate_wallet,
        delegation_pct,
        delegation_scope,
        is_active
      ) VALUES (
        ${walletAddress},
        ${delegateWallet},
        ${delegationPct},
        ${delegationScope},
        TRUE
      )
    `;

    // Update governance tokens
    await sql`
      INSERT INTO governance_tokens (wallet_address, delegated_to, delegation_pct)
      VALUES (${walletAddress}, ${delegateWallet}, ${delegationPct})
      ON CONFLICT (wallet_address) DO UPDATE SET
        delegated_to = ${delegateWallet},
        delegation_pct = ${delegationPct},
        updated_at = NOW()
    `;

    // Log action
    await sql`
      INSERT INTO governance_actions (action_type, wallet_address, action_data)
      VALUES (
        'delegation_changed',
        ${walletAddress},
        ${JSON.stringify({ delegate: delegateWallet, pct: delegationPct, scope: delegationScope })}
      )
    `;

    return new Response(JSON.stringify({
      success: true,
      delegation: {
        to: delegateWallet,
        toUsername: delegate[0].username,
        percentage: delegationPct,
        scope: delegationScope
      },
      message: `Delegated ${delegationPct}% of your voting power to ${delegate[0].username || delegateWallet.slice(0, 8)}...`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error managing delegation:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to manage delegation: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
