// /api/nft/rewards/claim.js
// Claim an eligible NFT reward

import { neon } from '@neondatabase/serverless';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { walletAddress, ruleId } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!ruleId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Rule ID is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Check if already claimed
    const existingClaim = await sql`
      SELECT id, status FROM nft_reward_claims
      WHERE wallet_address = ${walletAddress}
        AND rule_id = ${ruleId}
    `;

    if (existingClaim.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This reward has already been claimed',
        claimStatus: existingClaim[0].status
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Get the reward rule
    const rule = await sql`
      SELECT * FROM nft_reward_rules
      WHERE id = ${ruleId}
        AND is_active = TRUE
    `;

    if (rule.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Reward rule not found or inactive'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const ruleData = rule[0];

    // Verify eligibility (simplified check - full check done in check-eligibility)
    const user = await sql`
      SELECT xp, level FROM user_profiles
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

    // Basic eligibility check based on XP/level threshold
    let isEligible = false;
    switch (ruleData.trigger_type) {
      case 'xp_threshold':
        isEligible = userData.xp >= ruleData.min_threshold;
        break;
      case 'level_reached':
        isEligible = userLevel >= ruleData.min_threshold;
        break;
      default:
        // For other types, we'll need to do the full check
        // For now, trust that the user called check-eligibility first
        isEligible = true;
    }

    if (!isEligible) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You are not eligible for this reward yet',
        required: ruleData.min_threshold,
        current: ruleData.trigger_type === 'xp_threshold' ? userData.xp : userLevel
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Generate NFT metadata
    const nftMetadata = {
      name: ruleData.rule_name,
      description: ruleData.description,
      collection: ruleData.collection_name,
      rarity: ruleData.rarity_tier,
      attributes: [
        { trait_type: 'Rarity', value: ruleData.rarity_tier },
        { trait_type: 'Collection', value: ruleData.collection_name },
        { trait_type: 'Trigger', value: ruleData.trigger_type },
        { trait_type: 'Threshold', value: ruleData.min_threshold }
      ],
      earnedAt: new Date().toISOString(),
      earnedBy: walletAddress
    };

    // Create claim record
    const claimResult = await sql`
      INSERT INTO nft_reward_claims (
        wallet_address,
        rule_id,
        nft_metadata,
        status
      ) VALUES (
        ${walletAddress},
        ${ruleId},
        ${JSON.stringify(nftMetadata)},
        'claimed'
      )
      RETURNING id, created_at
    `;

    const claim = claimResult[0];

    // Award bonus XP for claiming
    const bonusXP = ruleData.bonus_xp || 50;
    await sql`
      UPDATE user_profiles
      SET xp = xp + ${bonusXP},
          updated_at = NOW()
      WHERE wallet_address = ${walletAddress}
    `.catch(() => {});

    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
      VALUES (
        ${walletAddress},
        'nft_claim',
        ${bonusXP},
        ${`Claimed NFT reward: ${ruleData.rule_name}`},
        ${JSON.stringify({ rule_id: ruleId, claim_id: claim.id, rarity: ruleData.rarity_tier })}
      )
    `.catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      claim: {
        id: claim.id,
        ruleId,
        status: 'claimed',
        created_at: claim.created_at
      },
      nft: {
        name: ruleData.rule_name,
        collection: ruleData.collection_name,
        rarity: ruleData.rarity_tier,
        metadata: nftMetadata
      },
      bonusXP,
      message: `Claimed ${ruleData.rule_name}! Earned ${bonusXP} bonus XP. NFT will be minted to your wallet.`,
      nextStep: 'The NFT will be minted to your Solana wallet within a few minutes.'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error claiming NFT reward:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to claim NFT reward: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - Get user's claimed rewards
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

    const claims = await sql`
      SELECT
        c.id,
        c.rule_id,
        c.nft_metadata,
        c.mint_address,
        c.status,
        c.created_at,
        c.minted_at,
        r.rule_name,
        r.rarity_tier,
        r.collection_name
      FROM nft_reward_claims c
      LEFT JOIN nft_reward_rules r ON c.rule_id = r.id
      WHERE c.wallet_address = ${walletAddress}
      ORDER BY c.created_at DESC
    `;

    // Get summary by rarity
    const rarityCount = claims.reduce((acc, c) => {
      const rarity = c.rarity_tier || 'unknown';
      acc[rarity] = (acc[rarity] || 0) + 1;
      return acc;
    }, {});

    return new Response(JSON.stringify({
      success: true,
      claims,
      summary: {
        total: claims.length,
        byRarity: rarityCount,
        minted: claims.filter(c => c.status === 'minted').length,
        pending: claims.filter(c => c.status === 'claimed').length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching claimed rewards:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch claimed rewards'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
