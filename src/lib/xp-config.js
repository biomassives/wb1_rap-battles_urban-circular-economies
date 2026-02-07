/**
 * xp-config.js — Central source of truth for XP values and airdrop tiers
 *
 * Every XP-earning activity and its base amount is defined here.
 * Airdrop tiers map cumulative XP to drop rarity, quantity, and multipliers.
 */

// XP amounts by activity type
export const XP_ACTIVITIES = {
  // Battles & Challenges
  battle_submission: 25,
  battle_vote: 10,
  battle_win: 150,
  battle_loss: 50,
  challenge_submission: 30,
  challenge_vote: 15,
  challenge_win: 100,

  // Music
  track_upload: 100,
  track_lyrics_bonus: 25,
  track_cover_bonus: 15,
  track_collab_bonus: 30,
  track_description_bonus: 10,

  // Reviews & Community
  artist_review: 20,
  artist_review_detailed: 35,

  // Mentoring
  mentoring_checkin: 25,
  mentoring_session_complete: 50,
  become_mentor: 150,

  // Citizen Science & Eco
  environmental_observation: 25,
  environmental_detailed: 50,
  environmental_biodiversity: 75,
  environmental_verified_bonus: 50,
  citizen_science_submission: 40,
  citizen_science_verified: 75,

  // DAO Governance
  governance_vote: 25,
  governance_proposal_create: 50,
  governance_delegation: 10,
  dao_participation: 20,

  // Health & Wellness
  health_log: 10,
  health_exercise: 15,
  health_streak_bonus: 5,

  // NFT & Profile
  nft_claim: 50,
  profile_created: 10,
};

// Airdrop tiers — XP thresholds determine drop rarity and quantity
export const AIRDROP_TIERS = [
  { name: 'Bronze',   minXP: 0,     maxXP: 499,      multiplier: 1.0,  rarityBoost: 0,   dropQuantity: 1 },
  { name: 'Silver',   minXP: 500,   maxXP: 1999,     multiplier: 1.25, rarityBoost: 5,   dropQuantity: 1 },
  { name: 'Gold',     minXP: 2000,  maxXP: 4999,     multiplier: 1.5,  rarityBoost: 10,  dropQuantity: 2 },
  { name: 'Platinum', minXP: 5000,  maxXP: 14999,    multiplier: 2.0,  rarityBoost: 20,  dropQuantity: 3 },
  { name: 'Diamond',  minXP: 15000, maxXP: 49999,    multiplier: 3.0,  rarityBoost: 35,  dropQuantity: 4 },
  { name: 'Mythic',   minXP: 50000, maxXP: Infinity,  multiplier: 5.0,  rarityBoost: 50,  dropQuantity: 5 },
];

// Base rarity weights (before tier boost is applied)
export const BASE_RARITY_WEIGHTS = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  mythic: 1,
};

/**
 * Get the airdrop tier for a given XP total
 * @param {number} xp - User's total XP
 * @returns {object} Tier object with name, multiplier, rarityBoost, dropQuantity, progress
 */
export function getTierForXP(xp) {
  const total = Math.max(0, xp || 0);
  let tier = AIRDROP_TIERS[0];

  for (const t of AIRDROP_TIERS) {
    if (total >= t.minXP && total <= t.maxXP) {
      tier = t;
      break;
    }
  }

  const tierIndex = AIRDROP_TIERS.indexOf(tier);
  const nextTier = tierIndex < AIRDROP_TIERS.length - 1 ? AIRDROP_TIERS[tierIndex + 1] : null;
  const progressInTier = tier.maxXP === Infinity
    ? 1.0
    : (total - tier.minXP) / (tier.maxXP - tier.minXP + 1);

  return {
    ...tier,
    tierIndex,
    xp: total,
    progressInTier: Math.min(1, progressInTier),
    nextTier: nextTier ? { name: nextTier.name, minXP: nextTier.minXP, xpNeeded: nextTier.minXP - total } : null,
  };
}

/**
 * Calculate adjusted rarity weights based on tier boost
 * Higher tiers shift probability toward rarer drops
 * @param {number} rarityBoost - Tier's rarityBoost percentage
 * @returns {object} Adjusted rarity weights
 */
export function getAdjustedRarityWeights(rarityBoost) {
  const boost = Math.max(0, rarityBoost || 0);
  // Shift weight from common toward higher rarities proportionally
  const shiftFromCommon = Math.min(BASE_RARITY_WEIGHTS.common - 10, boost);
  return {
    common: BASE_RARITY_WEIGHTS.common - shiftFromCommon,
    rare: BASE_RARITY_WEIGHTS.rare + shiftFromCommon * 0.4,
    epic: BASE_RARITY_WEIGHTS.epic + shiftFromCommon * 0.3,
    legendary: BASE_RARITY_WEIGHTS.legendary + shiftFromCommon * 0.2,
    mythic: BASE_RARITY_WEIGHTS.mythic + shiftFromCommon * 0.1,
  };
}

/**
 * Level formula (same as award-xp.js)
 * @param {number} xp
 * @returns {number} Level 1-120
 */
export function calculateLevel(xp) {
  return Math.min(120, Math.floor(Math.sqrt((xp || 0) / 100)) + 1);
}
