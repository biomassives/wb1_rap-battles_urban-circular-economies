// /api/data/review/queue.js
// Get pending reviews for qualified reviewers

import { neon } from '@neondatabase/serverless';

export async function GET({ request }) {
  const url = new URL(request.url);
  const reviewerWallet = url.searchParams.get('reviewerWallet');
  const dataType = url.searchParams.get('dataType'); // 'environmental', 'health', 'community'
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  if (!reviewerWallet) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Reviewer wallet address is required'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Check if user is a qualified reviewer
    const reviewer = await sql`
      SELECT * FROM data_reviewers
      WHERE wallet_address = ${reviewerWallet}
        AND is_active = TRUE
    `;

    if (reviewer.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Not a qualified reviewer. Reach level 10+ to become a reviewer.',
        canBecomeReviewer: true
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const reviewerData = reviewer[0];
    const specializations = reviewerData.specializations || [];

    let pendingItems = [];
    let totalCount = 0;

    // Get pending environmental observations
    if (!dataType || dataType === 'environmental') {
      const envItems = await sql`
        SELECT
          id,
          'environmental' as data_type,
          wallet_address as submitter,
          observation_type as item_type,
          title,
          location_name,
          data_payload,
          media_urls,
          created_at
        FROM environmental_observations
        WHERE verification_status = 'pending'
          AND wallet_address != ${reviewerWallet}
        ORDER BY created_at ASC
        LIMIT ${limit}
      `;
      pendingItems = pendingItems.concat(envItems);
    }

    // Get pending community research
    if (!dataType || dataType === 'community') {
      const communityItems = await sql`
        SELECT
          id,
          'community' as data_type,
          wallet_address as submitter,
          research_type as item_type,
          title,
          location_name,
          content as data_payload,
          media_urls,
          created_at
        FROM community_research
        WHERE verification_status = 'pending'
          AND wallet_address != ${reviewerWallet}
        ORDER BY created_at ASC
        LIMIT ${limit}
      `;
      pendingItems = pendingItems.concat(communityItems);
    }

    // Sort by created_at and apply pagination
    pendingItems.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const paginatedItems = pendingItems.slice(offset, offset + limit);

    // Get reviewer stats
    const reviewerStats = await sql`
      SELECT
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as reviews_this_week,
        AVG(quality_score) as avg_quality_given
      FROM data_reviews
      WHERE reviewer_wallet = ${reviewerWallet}
    `;

    // Get count of items this reviewer has already reviewed (to avoid duplicates)
    const alreadyReviewed = await sql`
      SELECT submission_id, submission_type
      FROM data_reviews
      WHERE reviewer_wallet = ${reviewerWallet}
    `;

    const reviewedIds = new Set(
      alreadyReviewed.map(r => `${r.submission_type}-${r.submission_id}`)
    );

    // Filter out already reviewed items
    const filteredItems = paginatedItems.filter(
      item => !reviewedIds.has(`${item.data_type}-${item.id}`)
    );

    return new Response(JSON.stringify({
      success: true,
      reviewer: {
        wallet: reviewerWallet,
        specializations,
        reputation: reviewerData.reputation_score,
        totalReviews: reviewerData.total_reviews
      },
      stats: reviewerStats[0] || {},
      queue: filteredItems,
      pagination: {
        total: pendingItems.length,
        limit,
        offset,
        hasMore: offset + limit < pendingItems.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching review queue:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch review queue'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// POST - Register as a reviewer
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { walletAddress, specializations = [] } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Check user level
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

    if (userLevel < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: `Must be level 10+ to become a reviewer. Current level: ${userLevel}`,
        currentLevel: userLevel,
        requiredLevel: 10
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Register as reviewer
    const validSpecializations = ['water_quality', 'biodiversity', 'pollution', 'climate', 'community', 'health'];
    const filteredSpecs = specializations.filter(s => validSpecializations.includes(s));

    await sql`
      INSERT INTO data_reviewers (
        wallet_address,
        specializations,
        is_active
      ) VALUES (
        ${walletAddress},
        ${filteredSpecs},
        TRUE
      )
      ON CONFLICT (wallet_address) DO UPDATE SET
        specializations = ${filteredSpecs},
        is_active = TRUE,
        updated_at = NOW()
    `;

    // Award XP for becoming a reviewer
    await sql`
      UPDATE user_profiles
      SET xp = xp + 100,
          updated_at = NOW()
      WHERE wallet_address = ${walletAddress}
    `.catch(() => {});

    await sql`
      INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description)
      VALUES (
        ${walletAddress},
        'become_reviewer',
        100,
        'Registered as a data reviewer'
      )
    `.catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully registered as a reviewer! Earned 100 XP.',
      specializations: filteredSpecs,
      xpEarned: 100
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error registering reviewer:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to register as reviewer'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
