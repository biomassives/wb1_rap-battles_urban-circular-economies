// /api/projects/discover.js
// Discover public projects with filtering, sorting, and pagination

import { neon } from '@neondatabase/serverless';

export async function GET({ request }) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');
  const sort = url.searchParams.get('sort') || 'recent';
  const tag = url.searchParams.get('tag');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '12'), 50);
  const offset = (page - 1) * limit;

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Build the query with all public, published projects
    let baseQuery = sql`
      SELECT
        p.id,
        p.slug,
        p.title,
        p.subtitle,
        p.description,
        p.category,
        p.tags,
        p.cover_image,
        p.owner_wallet,
        p.view_count,
        p.like_count,
        p.published_at,
        p.featured,
        up.username as owner_username,
        up.avatar_url as owner_avatar
      FROM user_projects p
      LEFT JOIN user_profiles up ON p.owner_wallet = up.wallet_address
      WHERE p.status = 'published'
      AND p.visibility = 'public'
    `;

    // Apply category filter
    if (category && category !== 'all') {
      baseQuery = sql`${baseQuery} AND p.category = ${category}`;
    }

    // Apply search filter
    if (search) {
      const searchPattern = `%${search}%`;
      baseQuery = sql`${baseQuery} AND (
        p.title ILIKE ${searchPattern}
        OR p.description ILIKE ${searchPattern}
        OR p.subtitle ILIKE ${searchPattern}
      )`;
    }

    // Apply tag filter
    if (tag) {
      baseQuery = sql`${baseQuery} AND ${tag} = ANY(p.tags)`;
    }

    // Apply sorting
    let orderClause;
    switch (sort) {
      case 'popular':
        orderClause = sql`ORDER BY p.like_count DESC, p.view_count DESC`;
        break;
      case 'views':
        orderClause = sql`ORDER BY p.view_count DESC`;
        break;
      case 'recent':
      default:
        orderClause = sql`ORDER BY p.published_at DESC`;
        break;
    }

    // Get total count for pagination
    const countQuery = sql`
      SELECT COUNT(*) as total
      FROM user_projects p
      WHERE p.status = 'published'
      AND p.visibility = 'public'
      ${category && category !== 'all' ? sql`AND p.category = ${category}` : sql``}
    `;

    // Execute queries
    const [projects, countResult] = await Promise.all([
      sql`${baseQuery} ${orderClause} LIMIT ${limit} OFFSET ${offset}`,
      countQuery
    ]);

    const total = parseInt(countResult[0]?.total || 0);
    const hasMore = offset + projects.length < total;

    // Get featured projects for first page
    let featured = [];
    if (page === 1 && !search && !tag && (!category || category === 'all')) {
      featured = await sql`
        SELECT
          p.id,
          p.slug,
          p.title,
          p.subtitle,
          p.description,
          p.category,
          p.cover_image,
          p.owner_wallet,
          p.view_count,
          p.like_count,
          up.username as owner_username
        FROM user_projects p
        LEFT JOIN user_profiles up ON p.owner_wallet = up.wallet_address
        WHERE p.status = 'published'
        AND p.visibility = 'public'
        AND p.featured = true
        ORDER BY p.published_at DESC
        LIMIT 3
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      projects,
      featured,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error discovering projects:', error);

    // Fallback sample projects
    const sampleProjects = getSampleProjects(category, search);

    return new Response(JSON.stringify({
      success: true,
      projects: sampleProjects,
      featured: [],
      pagination: {
        page: 1,
        limit: 12,
        total: sampleProjects.length,
        hasMore: false
      },
      fallback: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function getSampleProjects(category, search) {
  const samples = [
    {
      slug: 'pain-in-the-ghetto',
      title: 'Pain in the Ghetto',
      subtitle: 'A musical journey through urban struggles',
      description: 'An album project exploring the realities of life in marginalized communities.',
      category: 'music',
      owner_username: 'GhettoPoet',
      cover_image: '/images/projects/pain-in-the-ghetto-cover.jpg',
      view_count: 1247,
      like_count: 89,
      featured: true
    },
    {
      slug: 'fana-ke-rap-battle-glitters-and-golds',
      title: 'Fana Ke Rap Battle: Glitters and Golds',
      subtitle: 'The legendary rap battle series',
      description: 'A rap battle competition bringing together the best lyricists from East African refugee camps.',
      category: 'music',
      owner_username: 'FanaKeBattles',
      cover_image: '/images/projects/fana-ke-cover.jpg',
      view_count: 3421,
      like_count: 256,
      featured: true
    },
    {
      slug: 'porefec',
      title: 'POREFEC',
      subtitle: 'Portable Renewable Energy for Communities',
      description: 'Scientific research developing affordable solar energy solutions for refugee camps.',
      category: 'science',
      owner_username: 'SolarInnovator',
      cover_image: '/images/projects/porefec-cover.jpg',
      view_count: 892,
      like_count: 67,
      featured: true
    }
  ];

  let filtered = samples;

  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}
