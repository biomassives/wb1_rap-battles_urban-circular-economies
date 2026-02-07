/**
 * GET /api/airdrop/tier?walletAddress=...
 * Returns the user's current airdrop tier based on their XP
 *
 * Response includes:
 * - Current tier (name, multiplier, rarityBoost, dropQuantity)
 * - Progress to next tier
 * - Adjusted rarity weights for this tier
 * - Recent XP activity summary (last 7 days)
 */

import { neon } from '@neondatabase/serverless';
import { getTierForXP, getAdjustedRarityWeights, AIRDROP_TIERS } from '../../../lib/xp-config.js';

export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  if (!walletAddress) {
    return new Response(JSON.stringify({
      success: false,
      error: 'walletAddress query parameter is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Anonymous/test wallets get default Bronze tier
  if (walletAddress.startsWith('anon_') || walletAddress.startsWith('TEST_WALLET_')) {
    const tier = getTierForXP(0);
    return new Response(JSON.stringify({
      success: true,
      source: 'local_only',
      tier,
      rarityWeights: getAdjustedRarityWeights(tier.rarityBoost),
      allTiers: AIRDROP_TIERS.filter(t => t.maxXP !== Infinity).concat([{ ...AIRDROP_TIERS[5], maxXP: '50000+' }]),
      recentActivity: []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const dbUrl = process.env.DATABASE_URL || process.env.NILE_DATABASE_URL || process.env.lab_POSTGRES_URL;

  if (!dbUrl) {
    const tier = getTierForXP(0);
    return new Response(JSON.stringify({
      success: true,
      source: 'local_only',
      message: 'Database not configured',
      tier,
      rarityWeights: getAdjustedRarityWeights(tier.rarityBoost),
      allTiers: AIRDROP_TIERS,
      recentActivity: []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const sql = neon(dbUrl);

    // Get user XP
    const userResult = await sql`
      SELECT xp, level FROM user_profiles
      WHERE wallet_address = ${walletAddress}
      LIMIT 1
    `;

    const xp = userResult.length > 0 ? (userResult[0].xp || 0) : 0;
    const tier = getTierForXP(xp);
    const rarityWeights = getAdjustedRarityWeights(tier.rarityBoost);

    // Get recent activity summary (last 7 days)
    let recentActivity = [];
    try {
      recentActivity = await sql`
        SELECT activity_type, COUNT(*)::int as count, COALESCE(SUM(xp_earned), 0)::int as total_xp
        FROM activity_log
        WHERE wallet_address = ${walletAddress}
          AND created_at > NOW() - INTERVAL '7 days'
        GROUP BY activity_type
        ORDER BY total_xp DESC
        LIMIT 10
      `;
    } catch (e) {
      // activity_log may not have xp_earned column in all setups
      try {
        recentActivity = await sql`
          SELECT activity_type, COUNT(*)::int as count, 0 as total_xp
          FROM activity_log
          WHERE wallet_address = ${walletAddress}
            AND created_at > NOW() - INTERVAL '7 days'
          GROUP BY activity_type
          ORDER BY count DESC
          LIMIT 10
        `;
      } catch (_) {
        // Table may not exist
      }
    }

    return new Response(JSON.stringify({
      success: true,
      source: 'database',
      tier,
      rarityWeights,
      allTiers: AIRDROP_TIERS.map(t => ({
        ...t,
        maxXP: t.maxXP === Infinity ? null : t.maxXP
      })),
      recentActivity
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Airdrop tier error:', error);
    const tier = getTierForXP(0);
    return new Response(JSON.stringify({
      success: true,
      source: 'local_only',
      message: 'Database query failed',
      tier,
      rarityWeights: getAdjustedRarityWeights(tier.rarityBoost),
      allTiers: AIRDROP_TIERS,
      recentActivity: []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
