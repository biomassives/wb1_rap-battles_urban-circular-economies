// /api/nft/rewards/check-eligibility.js
// Check what NFT rewards a user is eligible to claim

import { neon } from '@neondatabase/serverless';

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

    // Get user profile and stats
    const user = await sql`
      SELECT
        wallet_address,
        xp,
        level,
        achievements,
        created_at
      FROM user_profiles
      WHERE wallet_address = ${walletAddress}
    `;

    if (user.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User profile not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const userData = user[0];
    const userLevel = userData.level || Math.floor(Math.sqrt((userData.xp || 0) / 100)) + 1;

    // Get all active reward rules
    const rules = await sql`
      SELECT * FROM nft_reward_rules
      WHERE is_active = TRUE
      ORDER BY min_threshold ASC
    `;

    // Get user's already claimed rewards
    const claimedRewards = await sql`
      SELECT rule_id FROM nft_reward_claims
      WHERE wallet_address = ${walletAddress}
        AND status IN ('claimed', 'minted')
    `;

    const claimedRuleIds = new Set(claimedRewards.map(c => c.rule_id));

    // Get contribution stats
    const contributionStats = await sql`
      SELECT
        COUNT(*) as total_contributions,
        SUM(amount_value) as total_value,
        SUM(hours_contributed) as total_hours
      FROM project_contributions
      WHERE contributor_wallet = ${walletAddress}
    `;

    // Get data submission stats
    const dataStats = await sql`
      SELECT
        (SELECT COUNT(*) FROM environmental_observations WHERE wallet_address = ${walletAddress}) as environmental_count,
        (SELECT COUNT(*) FROM community_research WHERE wallet_address = ${walletAddress}) as community_count,
        (SELECT COUNT(*) FROM data_reviews WHERE reviewer_wallet = ${walletAddress}) as reviews_count
    `;

    // Get referral count
    const referralCount = await sql`
      SELECT COUNT(*) as count FROM user_profiles
      WHERE referred_by = ${walletAddress}
    `;

    // Build user metrics for eligibility checking
    const userMetrics = {
      xp: userData.xp || 0,
      level: userLevel,
      totalContributions: parseInt(contributionStats[0]?.total_contributions || 0),
      totalContributionValue: parseFloat(contributionStats[0]?.total_value || 0),
      totalVolunteerHours: parseFloat(contributionStats[0]?.total_hours || 0),
      environmentalObservations: parseInt(dataStats[0]?.environmental_count || 0),
      communityResearch: parseInt(dataStats[0]?.community_count || 0),
      dataReviews: parseInt(dataStats[0]?.reviews_count || 0),
      referrals: parseInt(referralCount[0]?.count || 0),
      accountAgeDays: Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24))
    };

    // Check eligibility for each rule
    const eligibleRewards = [];
    const pendingRewards = [];
    const claimedRewardsList = [];

    for (const rule of rules) {
      const conditions = rule.trigger_conditions || {};
      let isEligible = true;
      let progress = 0;
      let requirement = 0;

      // Check trigger type and conditions
      switch (rule.trigger_type) {
        case 'xp_threshold':
          requirement = rule.min_threshold;
          progress = userMetrics.xp;
          isEligible = userMetrics.xp >= rule.min_threshold;
          break;

        case 'level_reached':
          requirement = rule.min_threshold;
          progress = userMetrics.level;
          isEligible = userMetrics.level >= rule.min_threshold;
          break;

        case 'contributions_count':
          requirement = rule.min_threshold;
          progress = userMetrics.totalContributions;
          isEligible = userMetrics.totalContributions >= rule.min_threshold;
          break;

        case 'contribution_value':
          requirement = rule.min_threshold;
          progress = userMetrics.totalContributionValue;
          isEligible = userMetrics.totalContributionValue >= rule.min_threshold;
          break;

        case 'data_submissions':
          requirement = rule.min_threshold;
          progress = userMetrics.environmentalObservations + userMetrics.communityResearch;
          isEligible = progress >= rule.min_threshold;
          break;

        case 'referrals':
          requirement = rule.min_threshold;
          progress = userMetrics.referrals;
          isEligible = userMetrics.referrals >= rule.min_threshold;
          break;

        case 'reviews_completed':
          requirement = rule.min_threshold;
          progress = userMetrics.dataReviews;
          isEligible = userMetrics.dataReviews >= rule.min_threshold;
          break;

        default:
          isEligible = false;
      }

      const rewardInfo = {
        ruleId: rule.id,
        name: rule.rule_name,
        description: rule.description,
        triggerType: rule.trigger_type,
        rarityTier: rule.rarity_tier,
        collection: rule.collection_name,
        progress,
        requirement,
        progressPct: Math.min(100, Math.round((progress / requirement) * 100))
      };

      if (claimedRuleIds.has(rule.id)) {
        claimedRewardsList.push({ ...rewardInfo, status: 'claimed' });
      } else if (isEligible) {
        eligibleRewards.push({ ...rewardInfo, status: 'eligible' });
      } else {
        pendingRewards.push({ ...rewardInfo, status: 'pending' });
      }
    }

    // Sort pending by progress percentage (closest to completion first)
    pendingRewards.sort((a, b) => b.progressPct - a.progressPct);

    return new Response(JSON.stringify({
      success: true,
      wallet: walletAddress,
      metrics: userMetrics,
      rewards: {
        eligible: eligibleRewards,
        pending: pendingRewards.slice(0, 5), // Top 5 closest to completion
        claimed: claimedRewardsList
      },
      summary: {
        eligibleCount: eligibleRewards.length,
        pendingCount: pendingRewards.length,
        claimedCount: claimedRewardsList.length
      },
      message: eligibleRewards.length > 0
        ? `You have ${eligibleRewards.length} NFT reward(s) ready to claim!`
        : 'Keep contributing to unlock NFT rewards!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking NFT eligibility:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to check NFT eligibility'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
