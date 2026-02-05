// /api/contributions/submit.js
// Submit contribution to a project (donation, volunteer, data, resource)

import { neon } from '@neondatabase/serverless';

const XP_VALUES = {
  donation_per_dollar: 10,
  volunteer_per_hour: 50,
  code_contribution: 25,
  mentorship_per_hour: 75,
  resource_contribution: 30,
  data_contribution: 20
};

const EQUITY_THRESHOLDS = {
  donation_usd: 100,   // $100+ donation = 0.1% equity
  volunteer_hours: 10  // 10+ hours = 0.5% equity
};

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      projectId,
      contributionType, // 'donation', 'volunteer', 'code', 'mentorship', 'resource', 'data'
      amount,
      currency = 'USD',
      hours,
      description,
      proofUrls = [],
      isAnonymous = false
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

    const validTypes = ['donation', 'volunteer', 'code', 'mentorship', 'resource', 'data'];
    if (!contributionType || !validTypes.includes(contributionType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Contribution type is required. Must be one of: ${validTypes.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Validate based on contribution type
    if (contributionType === 'donation' && (!amount || amount <= 0)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Donation amount is required and must be positive'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (['volunteer', 'mentorship'].includes(contributionType) && (!hours || hours <= 0)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Hours are required for volunteer/mentorship contributions'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Verify project exists
    const project = await sql`
      SELECT id, title, status, proposer_wallet, funding_goal, funding_raised
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

    // Calculate XP and equity
    let xpEarned = 0;
    let equityEarned = 0;
    let contributionValue = 0;

    switch (contributionType) {
      case 'donation':
        contributionValue = amount;
        xpEarned = Math.floor(amount * XP_VALUES.donation_per_dollar);
        if (amount >= EQUITY_THRESHOLDS.donation_usd) {
          equityEarned = 0.1 * Math.floor(amount / EQUITY_THRESHOLDS.donation_usd);
        }
        break;
      case 'volunteer':
        contributionValue = hours * 25; // ~$25/hour equivalent
        xpEarned = Math.floor(hours * XP_VALUES.volunteer_per_hour);
        if (hours >= EQUITY_THRESHOLDS.volunteer_hours) {
          equityEarned = 0.5 * Math.floor(hours / EQUITY_THRESHOLDS.volunteer_hours);
        }
        break;
      case 'mentorship':
        contributionValue = hours * 50; // ~$50/hour equivalent
        xpEarned = Math.floor(hours * XP_VALUES.mentorship_per_hour);
        equityEarned = 0.25 * Math.floor(hours / 5); // 0.25% per 5 hours
        break;
      case 'code':
        contributionValue = 50; // Base value per contribution
        xpEarned = XP_VALUES.code_contribution;
        break;
      case 'resource':
        contributionValue = amount || 50;
        xpEarned = XP_VALUES.resource_contribution;
        break;
      case 'data':
        contributionValue = 25;
        xpEarned = XP_VALUES.data_contribution;
        break;
    }

    // Cap equity at 5% per contribution
    equityEarned = Math.min(equityEarned, 5);

    // Insert contribution
    const result = await sql`
      INSERT INTO project_contributions (
        project_id,
        contributor_wallet,
        contribution_type,
        amount_value,
        currency,
        hours_contributed,
        description,
        proof_urls,
        xp_awarded,
        equity_earned,
        is_anonymous,
        status
      ) VALUES (
        ${projectId},
        ${walletAddress},
        ${contributionType},
        ${contributionValue},
        ${currency},
        ${hours || null},
        ${description || null},
        ${JSON.stringify(proofUrls)},
        ${xpEarned},
        ${equityEarned},
        ${isAnonymous},
        'verified'
      )
      RETURNING id, created_at
    `;

    const contribution = result[0];

    // Update project funding if donation
    if (contributionType === 'donation') {
      await sql`
        UPDATE project_proposals
        SET funding_raised = COALESCE(funding_raised, 0) + ${amount},
            updated_at = NOW()
        WHERE id = ${projectId}
      `;
    }

    // Record equity if earned
    if (equityEarned > 0) {
      await sql`
        INSERT INTO project_equity (
          project_id,
          holder_wallet,
          equity_pct,
          source,
          contribution_id
        ) VALUES (
          ${projectId},
          ${walletAddress},
          ${equityEarned},
          ${contributionType},
          ${contribution.id}
        )
        ON CONFLICT (project_id, holder_wallet) DO UPDATE SET
          equity_pct = project_equity.equity_pct + ${equityEarned},
          updated_at = NOW()
      `;
    }

    // Award XP to contributor
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
        'project_contribution',
        ${xpEarned},
        ${`${contributionType} contribution to: ${projectData.title}`},
        ${JSON.stringify({
          project_id: projectId,
          contribution_type: contributionType,
          contribution_id: contribution.id,
          equity_earned: equityEarned
        })}
      )
    `.catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      contribution: {
        id: contribution.id,
        projectId,
        type: contributionType,
        value: contributionValue,
        created_at: contribution.created_at
      },
      rewards: {
        xpEarned,
        equityEarned: equityEarned > 0 ? `${equityEarned}%` : null
      },
      project: {
        id: projectId,
        title: projectData.title,
        fundingRaised: contributionType === 'donation'
          ? (parseFloat(projectData.funding_raised || 0) + amount)
          : projectData.funding_raised,
        fundingGoal: projectData.funding_goal
      },
      message: `Contribution recorded! Earned ${xpEarned} XP.${equityEarned > 0 ? ` You now own ${equityEarned}% equity in this project.` : ''}`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error submitting contribution:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit contribution: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - List contributions
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');
  const projectId = url.searchParams.get('projectId');
  const type = url.searchParams.get('type');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    let contributions;

    if (projectId) {
      // Get contributions to a project
      contributions = await sql`
        SELECT
          c.id,
          c.contributor_wallet,
          c.contribution_type,
          c.amount_value,
          c.hours_contributed,
          c.description,
          c.xp_awarded,
          c.equity_earned,
          c.is_anonymous,
          c.created_at,
          u.username,
          u.avatar_url
        FROM project_contributions c
        LEFT JOIN user_profiles u ON c.contributor_wallet = u.wallet_address
        WHERE c.project_id = ${projectId}
        ${type ? sql`AND c.contribution_type = ${type}` : sql``}
        ORDER BY c.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (walletAddress) {
      // Get user's contributions
      contributions = await sql`
        SELECT
          c.id,
          c.project_id,
          c.contribution_type,
          c.amount_value,
          c.hours_contributed,
          c.description,
          c.xp_awarded,
          c.equity_earned,
          c.created_at,
          p.title as project_title,
          p.slug as project_slug
        FROM project_contributions c
        LEFT JOIN project_proposals p ON c.project_id = p.id
        WHERE c.contributor_wallet = ${walletAddress}
        ${type ? sql`AND c.contribution_type = ${type}` : sql``}
        ORDER BY c.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Either walletAddress or projectId is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get totals
    let totals = {};
    if (projectId) {
      const totalResult = await sql`
        SELECT
          COUNT(*) as total_contributions,
          SUM(amount_value) as total_value,
          SUM(hours_contributed) as total_hours,
          COUNT(DISTINCT contributor_wallet) as unique_contributors
        FROM project_contributions
        WHERE project_id = ${projectId}
      `;
      totals = totalResult[0] || {};
    } else if (walletAddress) {
      const totalResult = await sql`
        SELECT
          COUNT(*) as total_contributions,
          SUM(xp_awarded) as total_xp,
          SUM(equity_earned) as total_equity,
          COUNT(DISTINCT project_id) as projects_supported
        FROM project_contributions
        WHERE contributor_wallet = ${walletAddress}
      `;
      totals = totalResult[0] || {};
    }

    return new Response(JSON.stringify({
      success: true,
      contributions,
      totals,
      pagination: {
        limit,
        offset,
        count: contributions.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error listing contributions:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to list contributions'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
