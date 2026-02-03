// /api/projects/update.js
// Update an existing user project

import { neon } from '@neondatabase/serverless';

export async function PUT({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      projectId,
      slug,
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
      status
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

    if (!projectId && !slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project ID or slug is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Verify ownership
    const projectQuery = projectId
      ? sql`SELECT * FROM user_projects WHERE id = ${projectId}`
      : sql`SELECT * FROM user_projects WHERE slug = ${slug}`;

    const projects = await projectQuery;

    if (projects.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Project not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const project = projects[0];

    if (project.owner_wallet !== walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You do not have permission to edit this project'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build update object with only provided fields
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (subtitle !== undefined) updates.subtitle = subtitle;
    if (description !== undefined) updates.description = description;
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (cover_image !== undefined) updates.cover_image = cover_image;
    if (media_urls !== undefined) updates.media_urls = JSON.stringify(media_urls);
    if (links !== undefined) updates.links = JSON.stringify(links);
    if (collaborators !== undefined) updates.collaborators = JSON.stringify(collaborators);
    if (visibility !== undefined) updates.visibility = visibility;

    // Handle status change and published_at
    if (status !== undefined) {
      updates.status = status;
      if (status === 'published' && !project.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }

    // Perform update
    const result = await sql`
      UPDATE user_projects
      SET
        title = COALESCE(${updates.title}, title),
        subtitle = COALESCE(${updates.subtitle}, subtitle),
        description = COALESCE(${updates.description}, description),
        content = COALESCE(${updates.content}, content),
        category = COALESCE(${updates.category}, category),
        tags = COALESCE(${updates.tags}, tags),
        cover_image = COALESCE(${updates.cover_image}, cover_image),
        media_urls = COALESCE(${updates.media_urls}::jsonb, media_urls),
        links = COALESCE(${updates.links}::jsonb, links),
        collaborators = COALESCE(${updates.collaborators}::jsonb, collaborators),
        visibility = COALESCE(${updates.visibility}, visibility),
        status = COALESCE(${updates.status}, status),
        published_at = COALESCE(${updates.published_at}, published_at),
        updated_at = NOW()
      WHERE id = ${project.id}
      RETURNING *
    `;

    return new Response(JSON.stringify({
      success: true,
      project: result[0],
      message: 'Project updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update project: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Also support PATCH for partial updates
export { PUT as PATCH };
