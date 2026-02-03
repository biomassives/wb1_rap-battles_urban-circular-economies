// /api/projects/user.js
// Get projects by user wallet address

import { neon } from '@neondatabase/serverless';

export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');
  const viewerWallet = url.searchParams.get('viewerWallet');
  const status = url.searchParams.get('status'); // 'all', 'draft', 'published', 'archived'
  const category = url.searchParams.get('category');

  if (!walletAddress) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Wallet address is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    const isOwner = walletAddress === viewerWallet;

    // Build query based on viewer permissions
    let projects;

    if (isOwner) {
      // Owner can see all their projects
      if (status && status !== 'all') {
        projects = await sql`
          SELECT * FROM user_projects
          WHERE owner_wallet = ${walletAddress}
          AND status = ${status}
          ${category ? sql`AND category = ${category}` : sql``}
          ORDER BY updated_at DESC
        `;
      } else {
        projects = await sql`
          SELECT * FROM user_projects
          WHERE owner_wallet = ${walletAddress}
          ${category ? sql`AND category = ${category}` : sql``}
          ORDER BY updated_at DESC
        `;
      }
    } else {
      // Non-owners can only see published public projects
      projects = await sql`
        SELECT * FROM user_projects
        WHERE owner_wallet = ${walletAddress}
        AND status = 'published'
        AND visibility = 'public'
        ${category ? sql`AND category = ${category}` : sql``}
        ORDER BY published_at DESC
      `;
    }

    // Get stats
    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'published') as published_count,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
        COUNT(*) as total_count,
        COALESCE(SUM(view_count), 0) as total_views,
        COALESCE(SUM(like_count), 0) as total_likes
      FROM user_projects
      WHERE owner_wallet = ${walletAddress}
    `;

    return new Response(JSON.stringify({
      success: true,
      projects,
      count: projects.length,
      stats: isOwner ? stats[0] : {
        published_count: stats[0].published_count,
        total_views: stats[0].total_views,
        total_likes: stats[0].total_likes
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching user projects:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch projects',
      projects: [],
      count: 0
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
