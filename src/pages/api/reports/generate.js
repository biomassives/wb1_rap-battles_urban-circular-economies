/**
 * POST /api/reports/generate
 * Generate report data for a given template + date range + sections
 *
 * Body:
 * - walletAddress: string (required)
 * - templateId: string (required)
 * - dateFrom: string (YYYY-MM-DD)
 * - dateTo: string (YYYY-MM-DD)
 * - sections: string[] (section IDs to include)
 */

import { sql } from '../../../lib/db.js';
import { getTemplate } from '../../../lib/report-templates.js';
import { getTierForXP } from '../../../lib/xp-config.js';

export const prerender = false;

// ── Query Functions ──────────────────────────────────────────────

async function battleOverview(dateFrom, dateTo) {
  const stats = await sql`
    SELECT
      COUNT(*)::int as total_battles,
      COUNT(*) FILTER (WHERE status = 'completed')::int as completed,
      COUNT(*) FILTER (WHERE status = 'active')::int as active,
      COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
      COUNT(*) FILTER (WHERE status = 'voting')::int as voting,
      SUM(CASE WHEN stake_currency = 'XP' THEN stake_amount ELSE 0 END)::int as total_xp_staked
    FROM battles
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
  `;
  const categories = await sql`
    SELECT category, COUNT(*)::int as count
    FROM battles
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY category ORDER BY count DESC
  `;
  return { stats: stats[0], categories };
}

async function battleResults(dateFrom, dateTo) {
  return await sql`
    SELECT b.id, b.title, b.category, b.rounds, b.status,
           b.challenger_wallet, b.opponent_wallet, b.winner_wallet,
           b.stake_amount, b.stake_currency, b.created_at, b.completed_at,
           (SELECT COUNT(*)::int FROM battle_submissions WHERE battle_id = b.id) as submissions,
           (SELECT COUNT(*)::int FROM battle_votes WHERE battle_id = b.id) as votes
    FROM battles b
    WHERE b.created_at >= ${dateFrom} AND b.created_at < ${dateTo}::date + 1
    ORDER BY b.created_at DESC
    LIMIT 200
  `;
}

async function battleParticipants(dateFrom, dateTo) {
  const topParticipants = await sql`
    SELECT bs.user_wallet as wallet, COUNT(*)::int as submissions,
           up.username
    FROM battle_submissions bs
    JOIN battles b ON bs.battle_id = b.id
    LEFT JOIN user_profiles up ON bs.user_wallet = up.wallet_address
    WHERE b.created_at >= ${dateFrom} AND b.created_at < ${dateTo}::date + 1
    GROUP BY bs.user_wallet, up.username ORDER BY submissions DESC LIMIT 20
  `;
  return topParticipants;
}

async function battleXP(dateFrom, dateTo) {
  return await sql`
    SELECT activity_type, COUNT(*)::int as count, SUM(xp_earned)::int as total_xp
    FROM xp_activities
    WHERE activity_type IN ('battle_submission', 'battle_vote', 'battle_win', 'battle_loss')
      AND created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY activity_type ORDER BY total_xp DESC
  `;
}

async function challengeSummary(dateFrom, dateTo) {
  const stats = await sql`
    SELECT
      COUNT(*)::int as total_challenges,
      COUNT(*) FILTER (WHERE status = 'completed')::int as completed,
      COUNT(*) FILTER (WHERE is_public = true)::int as public_count,
      COUNT(DISTINCT type)::int as unique_types
    FROM challenges
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
  `;
  const byType = await sql`
    SELECT type, COUNT(*)::int as count
    FROM challenges
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY type ORDER BY count DESC
  `;
  return { stats: stats[0], byType };
}

async function healthOverview(dateFrom, dateTo) {
  const stats = await sql`
    SELECT
      COUNT(*)::int as total_observations,
      COUNT(DISTINCT wallet_address)::int as unique_participants,
      SUM(xp_awarded)::int as total_xp
    FROM health_observations
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
  `;
  return stats[0];
}

async function healthTypes(dateFrom, dateTo) {
  return await sql`
    SELECT observation_type, COUNT(*)::int as count, SUM(xp_awarded)::int as xp
    FROM health_observations
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY observation_type ORDER BY count DESC
  `;
}

async function mentoringSessions(dateFrom, dateTo) {
  const byType = await sql`
    SELECT session_type, COUNT(*)::int as count,
           SUM(duration_minutes)::int as total_minutes,
           SUM(xp_earned)::int as total_xp
    FROM mentoring_sessions
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY session_type ORDER BY count DESC
  `;
  const totals = await sql`
    SELECT
      COUNT(*)::int as total_sessions,
      COUNT(DISTINCT wallet_address)::int as unique_users,
      SUM(duration_minutes)::int as total_minutes,
      SUM(xp_earned)::int as total_xp
    FROM mentoring_sessions
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
  `;
  return { totals: totals[0], byType };
}

async function healthStreaks(dateFrom, dateTo) {
  return await sql`
    SELECT wallet_address as wallet, COUNT(*)::int as observations,
           SUM(xp_awarded)::int as total_xp,
           MIN(created_at)::date as first_observation,
           MAX(created_at)::date as last_observation
    FROM health_observations
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY wallet_address
    ORDER BY observations DESC LIMIT 25
  `;
}

async function healthXP(dateFrom, dateTo) {
  return await sql`
    SELECT activity_type, COUNT(*)::int as count, SUM(xp_earned)::int as total_xp
    FROM xp_activities
    WHERE activity_type IN ('health_log', 'health_streak', 'mentoring_checkin', 'mentoring_session', 'become_mentor')
      AND created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY activity_type ORDER BY total_xp DESC
  `;
}

async function waterOverview(dateFrom, dateTo) {
  const stats = await sql`
    SELECT
      COUNT(*)::int as total_submissions,
      COUNT(*) FILTER (WHERE verified = true)::int as verified,
      COUNT(DISTINCT wallet_address)::int as contributors,
      COUNT(DISTINCT location_name) FILTER (WHERE location_name IS NOT NULL)::int as locations,
      SUM(xp_earned)::int as total_xp
    FROM citizen_science_data
    WHERE data_type = 'water_quality'
      AND created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
  `;
  return stats[0];
}

async function waterQualityData(dateFrom, dateTo) {
  return await sql`
    SELECT id, wallet_address, measurements, location_name,
           location_lat, location_lng, verified, created_at
    FROM citizen_science_data
    WHERE data_type = 'water_quality'
      AND created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    ORDER BY created_at DESC LIMIT 100
  `;
}

async function environmentalObservations(dateFrom, dateTo) {
  return await sql`
    SELECT observation_type, COUNT(*)::int as count,
           COUNT(*) FILTER (WHERE verification_status = 'verified')::int as verified,
           SUM(xp_awarded)::int as xp
    FROM environmental_observations
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY observation_type ORDER BY count DESC
  `;
}

async function citizenScienceSummary(dateFrom, dateTo) {
  return await sql`
    SELECT data_type, COUNT(*)::int as count,
           COUNT(*) FILTER (WHERE verified = true)::int as verified,
           COUNT(DISTINCT wallet_address)::int as contributors,
           SUM(xp_earned)::int as total_xp
    FROM citizen_science_data
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY data_type ORDER BY count DESC
  `;
}

async function locationBreakdown(dateFrom, dateTo) {
  return await sql`
    SELECT location_name, COUNT(*)::int as submissions,
           COUNT(DISTINCT data_type)::int as data_types,
           COUNT(DISTINCT wallet_address)::int as contributors
    FROM citizen_science_data
    WHERE location_name IS NOT NULL
      AND created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY location_name ORDER BY submissions DESC LIMIT 50
  `;
}

async function communityOverview(dateFrom, dateTo) {
  const [users, activeUsers, xp] = await Promise.all([
    sql`SELECT COUNT(*)::int as total FROM user_profiles`,
    sql`SELECT COUNT(DISTINCT user_wallet)::int as active FROM xp_activities
        WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1`,
    sql`SELECT SUM(xp_earned)::int as total FROM xp_activities
        WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1`
  ]);
  return {
    totalUsers: users[0]?.total || 0,
    activeUsersInPeriod: activeUsers[0]?.active || 0,
    totalXPInPeriod: xp[0]?.total || 0
  };
}

async function artistReviews(dateFrom, dateTo) {
  const stats = await sql`
    SELECT
      COUNT(*)::int as total_reviews,
      ROUND(AVG(rating), 2)::float as avg_rating,
      COUNT(DISTINCT reviewer_wallet)::int as unique_reviewers,
      COUNT(DISTINCT target_wallet)::int as artists_reviewed,
      SUM(xp_earned)::int as total_xp
    FROM artist_reviews
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
  `;
  return stats[0];
}

async function governanceActivity(dateFrom, dateTo) {
  const proposals = await sql`
    SELECT
      COUNT(*)::int as total_proposals,
      COUNT(*) FILTER (WHERE status = 'passed' OR passed = true)::int as passed,
      COUNT(*) FILTER (WHERE status = 'failed' OR passed = false)::int as failed,
      COUNT(*) FILTER (WHERE status = 'active')::int as active
    FROM governance_proposals
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
  `;
  const votes = await sql`
    SELECT COUNT(*)::int as total_votes, COUNT(DISTINCT voter_wallet)::int as unique_voters
    FROM governance_votes
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
  `;
  return { proposals: proposals[0], votes: votes[0] };
}

async function musicActivity(dateFrom, dateTo) {
  const stats = await sql`
    SELECT
      COUNT(*)::int as tracks_uploaded,
      SUM(plays)::int as total_plays,
      SUM(likes)::int as total_likes
    FROM tracks
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
  `;
  return stats[0];
}

async function xpDistribution(dateFrom, dateTo) {
  return await sql`
    SELECT activity_type, COUNT(*)::int as count, SUM(xp_earned)::int as total_xp
    FROM xp_activities
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY activity_type ORDER BY total_xp DESC
  `;
}

async function platformStats(dateFrom, dateTo) {
  const [users, battles, challenges, tracks, xp] = await Promise.all([
    sql`SELECT COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1)::int as new_in_period
        FROM user_profiles`,
    sql`SELECT COUNT(*)::int as total FROM battles
        WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1`,
    sql`SELECT COUNT(*)::int as total FROM challenges
        WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1`,
    sql`SELECT COUNT(*)::int as total FROM tracks
        WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1`,
    sql`SELECT SUM(xp_earned)::int as total FROM xp_activities
        WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1`
  ]);
  return {
    total_users: users[0]?.total || 0,
    new_users: users[0]?.new_in_period || 0,
    battles: battles[0]?.total || 0,
    challenges: challenges[0]?.total || 0,
    tracks: tracks[0]?.total || 0,
    total_xp: xp[0]?.total || 0
  };
}

async function userGrowth(dateFrom, dateTo) {
  return await sql`
    SELECT DATE_TRUNC('week', created_at)::date as week, COUNT(*)::int as new_users
    FROM user_profiles
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY week ORDER BY week
  `;
}

async function tierDistribution() {
  const users = await sql`SELECT xp FROM user_profiles WHERE xp > 0`;
  const tiers = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0, Diamond: 0, Mythic: 0 };
  for (const u of users) {
    const t = getTierForXP(u.xp || 0);
    if (t && t.name) tiers[t.name] = (tiers[t.name] || 0) + 1;
  }
  return Object.entries(tiers).map(([tier, count]) => ({ tier, count }));
}

async function topContributors(dateFrom, dateTo) {
  return await sql`
    SELECT xa.user_wallet as wallet, SUM(xa.xp_earned)::int as total_xp,
           COUNT(*)::int as activities, up.username
    FROM xp_activities xa
    LEFT JOIN user_profiles up ON xa.user_wallet = up.wallet_address
    WHERE xa.created_at >= ${dateFrom} AND xa.created_at < ${dateTo}::date + 1
    GROUP BY xa.user_wallet, up.username ORDER BY total_xp DESC LIMIT 25
  `;
}

async function activityHeatmap(dateFrom, dateTo) {
  return await sql`
    SELECT activity_type, COUNT(*)::int as count
    FROM xp_activities
    WHERE created_at >= ${dateFrom} AND created_at < ${dateTo}::date + 1
    GROUP BY activity_type ORDER BY count DESC
  `;
}

// ── Query map ────────────────────────────────────────────────────

const QUERY_FUNCTIONS = {
  battleOverview, battleResults, battleParticipants, battleXP, challengeSummary,
  healthOverview, healthTypes, mentoringSessions, healthStreaks, healthXP,
  waterOverview, waterQualityData, environmentalObservations, citizenScienceSummary, locationBreakdown,
  communityOverview, artistReviews, governanceActivity, musicActivity, xpDistribution,
  platformStats, userGrowth, tierDistribution, topContributors, activityHeatmap
};

// ── Main Handler ─────────────────────────────────────────────────

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { walletAddress, templateId, dateFrom, dateTo, sections } = body;

    if (!walletAddress || !templateId || !dateFrom || !dateTo) {
      return new Response(JSON.stringify({
        success: false,
        error: 'walletAddress, templateId, dateFrom, and dateTo are required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const template = getTemplate(templateId);
    if (!template) {
      return new Response(JSON.stringify({
        success: false, error: 'Unknown template: ' + templateId
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Role check
    let userRole = 'member';
    try {
      const users = await sql`
        SELECT role FROM user_profiles WHERE wallet_address = ${walletAddress}
      `;
      userRole = users[0]?.role || 'member';
    } catch (e) {
      // role column may not exist yet
    }

    if (!template.requiredRoles.includes(userRole)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions. Required role: ' + template.requiredRoles.join(' or ')
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Resolve sections
    const enabledSections = sections && sections.length > 0
      ? template.sections.filter(s => sections.includes(s.id) || !s.optional)
      : template.sections.filter(s => s.defaultEnabled);

    // Run queries for each section
    const reportSections = {};
    for (const section of enabledSections) {
      const queryFn = QUERY_FUNCTIONS[section.queryKey];
      if (!queryFn) {
        reportSections[section.id] = { title: section.title, data: null, error: 'No query defined' };
        continue;
      }
      try {
        const data = await queryFn(dateFrom, dateTo);
        reportSections[section.id] = { title: section.title, data };
      } catch (err) {
        console.warn(`Report query ${section.queryKey} failed:`, err.message);
        reportSections[section.id] = { title: section.title, data: null, note: 'Table not available' };
      }
    }

    // Log report generation
    try {
      await sql`
        INSERT INTO report_history (wallet_address, template_id, template_name, date_from, date_to, sections_included, generated_at)
        VALUES (${walletAddress}, ${templateId}, ${template.name}, ${dateFrom}, ${dateTo},
                ${JSON.stringify(enabledSections.map(s => s.id))}, NOW())
      `;
    } catch (e) {
      // Table may not exist yet
    }

    return new Response(JSON.stringify({
      success: true,
      report: {
        templateId,
        templateName: template.name,
        templateIcon: template.icon,
        dateFrom,
        dateTo,
        generatedAt: new Date().toISOString(),
        generatedBy: walletAddress,
        sections: reportSections
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Report generation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate report: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
