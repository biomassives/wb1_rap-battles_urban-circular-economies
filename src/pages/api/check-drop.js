/**
 * GET /api/check-drop?wallet=...
 * Worldbridger One: Intersectional Airdrop Logic
 *
 * Drops are scheduled based on lattice rhythm (even hour + prime minute).
 * Rarity and quantity are determined by the user's XP-based airdrop tier.
 */

import { sql } from '../../lib/db.js';
import { notifyFromTemplate } from '../../lib/notify.js';
import { getTierForXP, getAdjustedRarityWeights } from '../../lib/xp-config.js';

export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  const wallet = url.searchParams.get('wallet');

  if (!wallet) {
    return new Response(JSON.stringify({ error: 'WALLET_NOT_CONNECTED' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Lattice alignment schedule
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  const isEvenHour = currentHour % 2 === 0;
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
  const isLatticeAligned = primes.includes(currentMinute);

  // Look up user's real XP tier
  let userXP = 0;
  let tierSource = 'default';
  if (!wallet.startsWith('anon_') && !wallet.startsWith('TEST_WALLET_')) {
    try {
      const result = await sql`
        SELECT xp FROM user_profiles WHERE wallet_address = ${wallet} LIMIT 1
      `;
      if (result.length > 0) {
        userXP = result[0].xp || 0;
        tierSource = 'database';
      }
    } catch (e) {
      console.warn('check-drop: DB lookup failed, using default tier');
    }
  }

  const tier = getTierForXP(userXP);
  const rarityWeights = getAdjustedRarityWeights(tier.rarityBoost);

  // Determine if drop is ready
  const is_ready = isEvenHour && isLatticeAligned && tier.tierIndex >= 0;

  // Roll rarity based on tier-adjusted weights
  let dropRarity = 'COMMON';
  if (is_ready) {
    const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
    const roll = Math.random() * totalWeight;
    let cumulative = 0;
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      cumulative += weight;
      if (roll <= cumulative) {
        dropRarity = rarity.toUpperCase();
        break;
      }
    }
  }

  // Notify about claimable airdrop (once per window, skip anon wallets)
  if (is_ready && tierSource === 'database') {
    try {
      const recentNotif = await sql`
        SELECT id FROM user_notifications
        WHERE wallet_address = ${wallet}
          AND notification_type = 'nft_claimable'
          AND created_at > NOW() - INTERVAL '2 hours'
        LIMIT 1
      `.catch(() => []);
      if (recentNotif.length === 0) {
        await notifyFromTemplate(wallet, 'nft_claimable', {
          rarity: dropRarity,
          quantity: tier.dropQuantity
        });
      }
    } catch (notifError) {
      console.warn('Notification failed:', notifError.message);
    }
  }

  return new Response(JSON.stringify({
    status: 'WB1_ORACLE_SUCCESS',
    timestamp: now.toISOString(),
    lattice_coordinates: [currentHour, currentMinute],
    is_ready,
    next_window: is_ready ? 'NOW' : 'T-MINUS_VAR_MINUTES',
    tier: {
      name: tier.name,
      xp: userXP,
      multiplier: tier.multiplier,
      dropQuantity: tier.dropQuantity,
      source: tierSource
    },
    payload_metadata: {
      type: 'BIODIVERSITY_REWARD',
      rarity: dropRarity,
      quantity: is_ready ? tier.dropQuantity : 0,
      token_multiplier: tier.multiplier,
      dimensions_verified: 8
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
