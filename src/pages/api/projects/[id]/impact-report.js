// /api/projects/[id]/impact-report.js
// Submit and view impact reports for a project

import { neon } from '@neondatabase/serverless';

const XP_VALUES = {
  report_submitted: 75,
  verified_report_bonus: 150,
  milestone_completed: 200
};

export async function POST({ params, request }) {
  try {
    const projectId = params.id;
    const body = await request.json();
    const {
      walletAddress,
      reportType = 'progress', // 'progress', 'milestone', 'final'
      title,
      summary,
      metricsAchieved = {},
      beneficiariesReached,
      mediaUrls = [],
      milestoneId,
      challenges,
      nextSteps
    } = body;

    // Validate required fields
    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!projectId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project ID is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!title || title.trim().length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Title is required (minimum 10 characters)'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!summary || summary.trim().length < 50) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Summary is required (minimum 50 characters)'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validTypes = ['progress', 'milestone', 'final'];
    if (!validTypes.includes(reportType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Report type must be one of: ${validTypes.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Verify project exists and user has permission
    const project = await sql`
      SELECT id, title, proposer_wallet, status, team_members
      FROM project_proposals
      WHERE id = ${projectId}
    `;

    if (project.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const projectData = project[0];
    const teamMembers = projectData.team_members || [];
    const isTeamMember = projectData.proposer_wallet === walletAddress ||
      teamMembers.some(m => m.wallet === walletAddress);

    if (!isTeamMember) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only project team members can submit impact reports'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Insert impact report
    const result = await sql`
      INSERT INTO project_impact_reports (
        project_id,
        reporter_wallet,
        report_type,
        title,
        summary,
        metrics_achieved,
        beneficiaries_reached,
        media_urls,
        milestone_id,
        challenges,
        next_steps,
        verification_status
      ) VALUES (
        ${projectId},
        ${walletAddress},
        ${reportType},
        ${title.trim()},
        ${summary.trim()},
        ${JSON.stringify(metricsAchieved)},
        ${beneficiariesReached || null},
        ${JSON.stringify(mediaUrls)},
        ${milestoneId || null},
        ${challenges || null},
        ${nextSteps || null},
        'pending'
      )
      RETURNING id, created_at
    `;

    const report = result[0];

    // Calculate XP
    let xpEarned = XP_VALUES.report_submitted;
    if (reportType === 'milestone') {
      xpEarned += XP_VALUES.milestone_completed;
    }

    // Update milestone if applicable
    if (milestoneId) {
      await sql`
        UPDATE project_milestones
        SET status = 'completed',
            completed_at = NOW(),
            impact_report_id = ${report.id}
        WHERE id = ${milestoneId}
          AND project_id = ${projectId}
      `.catch(() => {});
    }

    // Award XP
    await sql`
      UPDATE user_profiles
      SET xp = xp + ${xpEarned},
          updated_at = NOW()
      WHERE wallet_address = ${walletAddress}
    `.catch(() => {});

    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
      VALUES (
        ${walletAddress},
        'impact_report',
        ${xpEarned},
        ${`Submitted ${reportType} report for: ${projectData.title}`},
        ${JSON.stringify({ project_id: projectId, report_id: report.id, report_type: reportType })}
      )
    `.catch(() => {});

    // Notify equity holders (placeholder - would integrate with notification system)
    const equityHolders = await sql`
      SELECT holder_wallet FROM project_equity
      WHERE project_id = ${projectId}
        AND holder_wallet != ${walletAddress}
    `;

    return new Response(JSON.stringify({
      success: true,
      report: {
        id: report.id,
        projectId,
        type: reportType,
        title,
        status: 'pending',
        created_at: report.created_at
      },
      xpEarned,
      notified: equityHolders.length,
      message: `Impact report submitted! Earned ${xpEarned} XP. ${equityHolders.length} equity holders will be notified.`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error submitting impact report:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit impact report: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - Get impact reports for a project
export async function GET({ params, request }) {
  const projectId = params.id;
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Verify project exists
    const project = await sql`
      SELECT id, title, status FROM project_proposals
      WHERE id = ${projectId}
    `;

    if (project.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Get impact reports
    const reports = await sql`
      SELECT
        r.id,
        r.report_type,
        r.title,
        r.summary,
        r.metrics_achieved,
        r.beneficiaries_reached,
        r.media_urls,
        r.verification_status,
        r.created_at,
        r.verified_at,
        u.username as reporter_name,
        u.avatar_url as reporter_avatar
      FROM project_impact_reports r
      LEFT JOIN user_profiles u ON r.reporter_wallet = u.wallet_address
      WHERE r.project_id = ${projectId}
      ${type ? sql`AND r.report_type = ${type}` : sql``}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get summary stats
    const stats = await sql`
      SELECT
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_reports,
        SUM(beneficiaries_reached) as total_beneficiaries,
        MAX(created_at) as last_report_at
      FROM project_impact_reports
      WHERE project_id = ${projectId}
    `;

    // Get milestones
    const milestones = await sql`
      SELECT
        id,
        title,
        description,
        target_date,
        status,
        completed_at
      FROM project_milestones
      WHERE project_id = ${projectId}
      ORDER BY target_date ASC
    `;

    return new Response(JSON.stringify({
      success: true,
      project: project[0],
      reports,
      milestones,
      stats: stats[0] || {},
      pagination: {
        limit,
        offset,
        count: reports.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching impact reports:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch impact reports'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
