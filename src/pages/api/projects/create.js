// /api/projects/create.js
// Create a new user project

import { neon } from '@neondatabase/serverless';

// Generate URL-friendly slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      title,
      subtitle,
      description,
      content,
      category = 'general',
      tags = [],
      cover_image,
      media_urls = [],
      links = [],
      collaborators = [],
      visibility = 'public',
      status = 'draft'
    } = body;

    // Validate required fields
    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!title || title.trim().length < 3) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Title is required (minimum 3 characters)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Generate unique slug
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let slugCounter = 0;

    // Check for slug uniqueness
    while (true) {
      const existing = await sql`
        SELECT 1 FROM user_projects WHERE slug = ${slug}
      `;
      if (existing.length === 0) break;
      slugCounter++;
      slug = `${baseSlug}-${slugCounter}`;
    }

    // Determine published_at
    const published_at = status === 'published' ? new Date().toISOString() : null;

    // Insert project
    const result = await sql`
      INSERT INTO user_projects (
        slug,
        owner_wallet,
        title,
        subtitle,
        description,
        content,
        category,
        tags,
        cover_image,
        media_urls,
        links,
        collaborators,
        visibility,
        status,
        published_at
      ) VALUES (
        ${slug},
        ${walletAddress},
        ${title.trim()},
        ${subtitle || null},
        ${description || null},
        ${content || null},
        ${category},
        ${tags},
        ${cover_image || null},
        ${JSON.stringify(media_urls)},
        ${JSON.stringify(links)},
        ${JSON.stringify(collaborators)},
        ${visibility},
        ${status},
        ${published_at}
      )
      RETURNING *
    `;

    return new Response(JSON.stringify({
      success: true,
      project: result[0],
      message: `Project created successfully at /projects/${slug}`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating project:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create project: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
