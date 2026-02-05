// /api/nft/stake/create.js
// Stake an NFT for project support, user sponsorship, or governance

import { neon } from '@neondatabase/serverless';

const STAKE_REWARDS = {
  project_boost: {
    xpMultiplier: 1.5, // 50% bonus XP from project activities
    rewardRate: 0.001 // 0.1% daily rewards
  },
  user_sponsor: {
    xpBonus: 10, // 10 XP per day to sponsored user
    sponsorXP: 5 // 5 XP per day to sponsor
  },
  governance: {
    voteMultiplier: 2, // Double voting power
    proposalBonus: true
  }
};

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      nftMintAddress,
      stakeType, // 'project_boost', 'user_sponsor', 'governance'
      targetId, // project_id or sponsored user wallet
      duration = 30 // days
    } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!nftMintAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'NFT mint address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validStakeTypes = ['project_boost', 'user_sponsor', 'governance'];
    if (!stakeType || !validStakeTypes.includes(stakeType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Stake type is required. Must be one of: ${validStakeTypes.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (['project_boost', 'user_sponsor'].includes(stakeType) && !targetId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Target ID is required for project_boost and user_sponsor stakes'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (duration < 7 || duration > 365) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Duration must be between 7 and 365 days'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Check if NFT exists and belongs to user (simplified - in production would verify on-chain)
    const existingStake = await sql`
      SELECT id FROM nft_stakes
      WHERE nft_mint_address = ${nftMintAddress}
        AND status = 'active'
    `;

    if (existingStake.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This NFT is already staked'
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Validate target if applicable
    if (stakeType === 'project_boost') {
      const project = await sql`
        SELECT id, title FROM project_proposals WHERE id = ${targetId}
      `;
      if (project.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Target project not found'
        }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
    } else if (stakeType === 'user_sponsor') {
      const targetUser = await sql`
        SELECT wallet_address, username FROM user_profiles WHERE wallet_address = ${targetId}
      `;
      if (targetUser.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Target user not found'
        }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Calculate stake end date
    const stakeEnds = new Date();
    stakeEnds.setDate(stakeEnds.getDate() + duration);

    // Calculate expected rewards
    const rewards = STAKE_REWARDS[stakeType];
    let expectedRewards = {};
    if (stakeType === 'project_boost') {
      expectedRewards = {
        xpMultiplier: rewards.xpMultiplier,
        dailyRewardRate: rewards.rewardRate,
        totalEstimatedRewards: duration * rewards.rewardRate * 100 // Simplified estimate
      };
    } else if (stakeType === 'user_sponsor') {
      expectedRewards = {
        sponsoredUserXPPerDay: rewards.xpBonus,
        sponsorXPPerDay: rewards.sponsorXP,
        totalXPForSponsored: duration * rewards.xpBonus,
        totalXPForSponsor: duration * rewards.sponsorXP
      };
    } else if (stakeType === 'governance') {
      expectedRewards = {
        voteMultiplier: rewards.voteMultiplier,
        canCreateProposals: rewards.proposalBonus
      };
    }

    // Create stake record
    const result = await sql`
      INSERT INTO nft_stakes (
        staker_wallet,
        nft_mint_address,
        stake_type,
        target_id,
        duration_days,
        stake_ends_at,
        expected_rewards,
        status
      ) VALUES (
        ${walletAddress},
        ${nftMintAddress},
        ${stakeType},
        ${targetId || null},
        ${duration},
        ${stakeEnds.toISOString()},
        ${JSON.stringify(expectedRewards)},
        'active'
      )
      RETURNING id, created_at
    `;

    const stake = result[0];

    // Award XP for staking
    const stakeXP = 25;
    await sql`
      UPDATE user_profiles
      SET xp = xp + ${stakeXP},
          updated_at = NOW()
      WHERE wallet_address = ${walletAddress}
    `.catch(() => {});

    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
      VALUES (
        ${walletAddress},
        'nft_stake',
        ${stakeXP},
        ${`Staked NFT for ${stakeType.replace('_', ' ')}`},
        ${JSON.stringify({ stake_id: stake.id, stake_type: stakeType, duration })}
      )
    `.catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      stake: {
        id: stake.id,
        nftMintAddress,
        stakeType,
        targetId,
        duration,
        endsAt: stakeEnds.toISOString(),
        status: 'active',
        created_at: stake.created_at
      },
      expectedRewards,
      xpEarned: stakeXP,
      message: `NFT staked for ${duration} days! Earned ${stakeXP} XP. Stake will unlock on ${stakeEnds.toLocaleDateString()}.`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating stake:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create stake: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - Get user's stakes
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');
  const status = url.searchParams.get('status') || 'active';

  if (!walletAddress) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Wallet address is required'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    const stakes = await sql`
      SELECT
        s.id,
        s.nft_mint_address,
        s.stake_type,
        s.target_id,
        s.duration_days,
        s.stake_ends_at,
        s.expected_rewards,
        s.rewards_claimed,
        s.status,
        s.created_at
      FROM nft_stakes s
      WHERE s.staker_wallet = ${walletAddress}
      ${status !== 'all' ? sql`AND s.status = ${status}` : sql``}
      ORDER BY s.created_at DESC
    `;

    // Calculate days remaining for active stakes
    const stakesWithDetails = stakes.map(s => ({
      ...s,
      daysRemaining: s.status === 'active'
        ? Math.max(0, Math.ceil((new Date(s.stake_ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
        : 0
    }));

    // Get summary
    const summary = {
      total: stakes.length,
      active: stakes.filter(s => s.status === 'active').length,
      completed: stakes.filter(s => s.status === 'completed').length,
      byType: stakes.reduce((acc, s) => {
        acc[s.stake_type] = (acc[s.stake_type] || 0) + 1;
        return acc;
      }, {})
    };

    return new Response(JSON.stringify({
      success: true,
      stakes: stakesWithDetails,
      summary
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching stakes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch stakes'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
