// src/lib/environmental.js
// Environmental data queries — consolidated from nile/environmental.js
import { sql } from './db.js';
export async function getPillarFeed(pillarType) {
  const pillarMap = {
    education: ['LEARN_CREDIT'],
    ground_truth: ['FIELD_DATA', 'AUDIT_PASS'],
    on_chain: ['ASSET_MINT']
  };

  const types = pillarType ? pillarMap[pillarType] : null;

  if (types) {
    return await sql`
      SELECT * FROM user_activity_events
      WHERE event_type = ANY(${types})
      ORDER BY created_at DESC
    `;
  }
  return await sql`SELECT * FROM user_activity_events ORDER BY created_at DESC`;
}

export async function getGlobalFeed(limit = 20) {
  return await sql`
    SELECT id, wallet_address, event_type, created_at, payload
    FROM user_activity_events
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}

export async function getUserProgress(wallet) {
  const [observations, obsThisMonth, xp, achievements] = await Promise.all([
    sql`SELECT COUNT(*) AS total FROM environmental_observations WHERE wallet_address = ${wallet}`,
    sql`SELECT COUNT(*) AS total FROM environmental_observations WHERE wallet_address = ${wallet} AND created_at >= date_trunc('month', now())`,
    sql`SELECT COALESCE(SUM(amount), 0) AS total_xp FROM user_xp_events WHERE wallet_address = ${wallet}`,
    sql`SELECT achievement_id, unlocked_at, progress, total FROM user_achievements WHERE wallet_address = ${wallet}`
  ]);

  return {
    observations_total: Number(observations[0]?.total || 0),
    observations_this_month: Number(obsThisMonth[0]?.total || 0),
    total_xp: Number(xp[0]?.total_xp || 0),
    achievements: achievements || []
  };
}

export async function recordObservation({ wallet, projectId, qualityScore, details }) {
  // 1. Record the observation
  const obs = await sql`
    INSERT INTO environmental_observations (wallet_address, project_id, quality_score)
    VALUES (${wallet}, ${projectId}, ${qualityScore})
    RETURNING id, created_at
  `;
  const observationId = obs[0].id;

  // 2. Award XP (Quality Score * 100)
  const xpAmount = Math.floor(qualityScore * 100);
  await sql`
    INSERT INTO user_xp_events (wallet_address, amount, source)
    VALUES (${wallet}, ${xpAmount}, ${'observation_' + observationId})
  `;

  // 3. Log the activity event
  await sql`
    INSERT INTO user_activity_events (wallet_address, event_type, event_ref, payload)
    VALUES (${wallet}, 'observation_submitted', ${observationId}, ${JSON.stringify(details)})
  `;

  return { success: true, observationId, xpEarned: xpAmount };
}
