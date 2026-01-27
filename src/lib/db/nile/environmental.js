// src/lib/db/nile/environmental.js
import { nileQuery } from './client.js';

export async function getPillarFeed(pillarType) {
  // Mapping pillars to event types for cleaner frontend use
  const pillarMap = {
    education: ['LEARN_CREDIT'],
    ground_truth: ['FIELD_DATA', 'AUDIT_PASS'],
    on_chain: ['ASSET_MINT']
  };

  const types = pillarType ? pillarMap[pillarType] : null;

  const query = types 
    ? `SELECT * FROM user_activity_events WHERE event_type = ANY($1) ORDER BY created_at DESC`
    : `SELECT * FROM user_activity_events ORDER BY created_at DESC`;

  const params = types ? [types] : [];
  return (await nileQuery(query, params)).rows;
}


export async function getGlobalFeed(limit = 20) {
  try {
    const result = await nileQuery(
      `SELECT 
          id, 
          wallet_address, 
          event_type, 
          created_at, 
          payload
       FROM user_activity_events 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );

    return result.rows || []; // Always return an array, even if empty
  } catch (error) {
    // If table doesn't exist yet, this catches it
    throw new Error(`Query Error: ${error.message}`);
  }
}


export async function getUserProgress(wallet) {
  const [
    observations,
    obsThisMonth,
    xp,
    achievements
  ] = await Promise.all([
    nileQuery(
      `SELECT COUNT(*) AS total
       FROM environmental_observations
       WHERE wallet_address = $1`,
      [wallet]
    ),

    nileQuery(
      `SELECT COUNT(*) AS total
       FROM environmental_observations
       WHERE wallet_address = $1
       AND created_at >= date_trunc('month', now())`,
      [wallet]
    ),

    nileQuery(
      `SELECT COALESCE(SUM(amount), 0) AS total_xp
       FROM user_xp_events
       WHERE wallet_address = $1`,
      [wallet]
    ),

    nileQuery(
      `SELECT achievement_id, unlocked_at, progress, total
       FROM user_achievements
       WHERE wallet_address = $1`,
      [wallet]
    )
  ]);

  return {
    observations_total: Number(observations.rows[0]?.total || 0),
    observations_this_month: Number(obsThisMonth.rows[0]?.total || 0),
    total_xp: Number(xp.rows[0].total_xp || 0),
    achievements: achievements.rows || []
  };
}

export async function recordObservation({ wallet, projectId, qualityScore, details }) {
  // In a production environment, you'd wrap these in a BEGIN/COMMIT transaction
  // For now, we'll run them sequentially to keep the "accessible tech" flow clear
  
  // 1. Record the actual observation
  const obs = await nileQuery(
    `INSERT INTO environmental_observations (wallet_address, project_id, quality_score)
     VALUES ($1, $2, $3)
     RETURNING id, created_at`,
    [wallet, projectId, qualityScore]
  );

  const observationId = obs.rows[0].id;

  // 2. Award XP (Logic: Quality Score * 100)
  const xpAmount = Math.floor(qualityScore * 100);
  await nileQuery(
    `INSERT INTO user_xp_events (wallet_address, amount, source)
     VALUES ($1, $2, $3)`,
    [wallet, xpAmount, `observation_${observationId}`]
  );

  // 3. Log the Global Activity Event (The "Fact" for the transparency feed)
  await nileQuery(
    `INSERT INTO user_activity_events (wallet_address, event_type, event_ref, payload)
     VALUES ($1, $2, $3, $4)`,
    [wallet, 'observation_submitted', observationId, JSON.stringify(details)]
  );

  return {
    success: true,
    observationId,
    xpEarned: xpAmount
  };
}