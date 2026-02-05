// /api/proposals/create.js
// Create a new project proposal

import { neon } from '@neondatabase/serverless';

const XP_VALUES = {
  proposal_submitted: 100,
  proposal_approved: 500
};

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      title,
      summary,
      description,
      fundingGoal,
      currency = 'USD',
      category,
      milestones = [],
      teamMembers = [],
      impactMetrics = {},
      targetCommunity,
      duration,
      tags = []
    } = body;

    // Validate required fields
    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!title || title.trim().length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Title is required (minimum 10 characters)'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!description || description.trim().length < 100) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Description is required (minimum 100 characters)'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validCategories = ['environmental', 'education', 'health', 'technology', 'community', 'arts', 'infrastructure'];
    if (!category || !validCategories.includes(category)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Category is required. Must be one of: ${validCategories.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (fundingGoal && (fundingGoal < 100 || fundingGoal > 1000000)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Funding goal must be between $100 and $1,000,000'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Check user has enough XP/level to create proposals (level 5+)
    const user = await sql`
      SELECT level, xp FROM user_profiles
      WHERE wallet_address = ${walletAddress}
    `;

    if (user.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User profile not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const userLevel = user[0].level || Math.floor(Math.sqrt((user[0].xp || 0) / 100)) + 1;

    if (userLevel < 5) {
      return new Response(JSON.stringify({
        success: false,
        error: `Must be level 5+ to create proposals. Current level: ${userLevel}`,
        currentLevel: userLevel,
        requiredLevel: 5
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    // Check slug uniqueness
    const existingSlug = await sql`
      SELECT id FROM project_proposals WHERE slug = ${slug}
    `;

    const finalSlug = existingSlug.length > 0 ? `${slug}-${Date.now()}` : slug;

    // Insert proposal
    const result = await sql`
      INSERT INTO project_proposals (
        proposer_wallet,
        slug,
        title,
        summary,
        description,
        funding_goal,
        funding_currency,
        category,
        milestones,
        team_members,
        impact_metrics,
        target_community,
        duration_days,
        tags,
        status
      ) VALUES (
        ${walletAddress},
        ${finalSlug},
        ${title.trim()},
        ${summary || null},
        ${description.trim()},
        ${fundingGoal || null},
        ${currency},
        ${category},
        ${JSON.stringify(milestones)},
        ${JSON.stringify(teamMembers)},
        ${JSON.stringify(impactMetrics)},
        ${targetCommunity || 'coastal and urban youth'},
        ${duration || 90},
        ${tags},
        'draft'
      )
      RETURNING id, slug, created_at
    `;

    const proposal = result[0];

    // Award XP for creating proposal
    await sql`
      UPDATE user_profiles
      SET xp = xp + ${XP_VALUES.proposal_submitted},
          updated_at = NOW()
      WHERE wallet_address = ${walletAddress}
    `.catch(() => {});

    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
      VALUES (
        ${walletAddress},
        'proposal_created',
        ${XP_VALUES.proposal_submitted},
        ${`Created proposal: ${title}`},
        ${JSON.stringify({ proposal_id: proposal.id, category })}
      )
    `.catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      proposal: {
        id: proposal.id,
        slug: proposal.slug,
        title,
        category,
        status: 'draft',
        created_at: proposal.created_at
      },
      xpEarned: XP_VALUES.proposal_submitted,
      message: `Proposal created! Earned ${XP_VALUES.proposal_submitted} XP. Submit for review to start voting.`,
      nextSteps: [
        'Add milestones if not already included',
        'Add team members',
        'Submit for community review'
      ]
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating proposal:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create proposal: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET - List proposals
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');
  const category = url.searchParams.get('category');
  const status = url.searchParams.get('status') || 'active';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    let proposals;

    if (walletAddress) {
      // Get user's own proposals
      proposals = await sql`
        SELECT
          id,
          slug,
          title,
          summary,
          category,
          funding_goal,
          funding_raised,
          status,
          votes_for,
          votes_against,
          created_at
        FROM project_proposals
        WHERE proposer_wallet = ${walletAddress}
        ${category ? sql`AND category = ${category}` : sql``}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Get public proposals
      const validStatuses = ['active', 'voting', 'approved', 'funded', 'completed'];
      const queryStatus = validStatuses.includes(status) ? status : 'active';

      proposals = await sql`
        SELECT
          id,
          slug,
          proposer_wallet,
          title,
          summary,
          category,
          funding_goal,
          funding_raised,
          status,
          votes_for,
          votes_against,
          target_community,
          created_at
        FROM project_proposals
        WHERE status = ${queryStatus}
        ${category ? sql`AND category = ${category}` : sql``}
        ORDER BY votes_for DESC, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM project_proposals
      WHERE ${walletAddress ? sql`proposer_wallet = ${walletAddress}` : sql`status = ${status}`}
      ${category ? sql`AND category = ${category}` : sql``}
    `;

    const total = parseInt(countResult[0]?.total || 0);

    // Get category stats
    const categoryStats = await sql`
      SELECT category, COUNT(*) as count
      FROM project_proposals
      WHERE status IN ('active', 'voting', 'approved', 'funded')
      GROUP BY category
      ORDER BY count DESC
    `;

    return new Response(JSON.stringify({
      success: true,
      proposals,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + proposals.length < total
      },
      categoryStats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error listing proposals:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to list proposals'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
