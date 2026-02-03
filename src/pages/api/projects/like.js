// /api/projects/like.js
// Like or unlike a project

import { neon } from '@neondatabase/serverless';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { walletAddress, projectId, slug, action = 'toggle' } = body;

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

    // Get project
    const projectQuery = projectId
      ? sql`SELECT id, like_count FROM user_projects WHERE id = ${projectId}`
      : sql`SELECT id, like_count FROM user_projects WHERE slug = ${slug}`;

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

    // Check if already liked
    const existingLike = await sql`
      SELECT 1 FROM user_project_likes
      WHERE project_id = ${project.id} AND wallet_address = ${walletAddress}
    `;

    const isLiked = existingLike.length > 0;
    let newLikeCount = project.like_count;

    if (action === 'like' || (action === 'toggle' && !isLiked)) {
      // Add like
      if (!isLiked) {
        await sql`
          INSERT INTO user_project_likes (project_id, wallet_address)
          VALUES (${project.id}, ${walletAddress})
        `;
        newLikeCount++;
        await sql`
          UPDATE user_projects
          SET like_count = ${newLikeCount}
          WHERE id = ${project.id}
        `;
      }
    } else if (action === 'unlike' || (action === 'toggle' && isLiked)) {
      // Remove like
      if (isLiked) {
        await sql`
          DELETE FROM user_project_likes
          WHERE project_id = ${project.id} AND wallet_address = ${walletAddress}
        `;
        newLikeCount = Math.max(0, newLikeCount - 1);
        await sql`
          UPDATE user_projects
          SET like_count = ${newLikeCount}
          WHERE id = ${project.id}
        `;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      liked: action === 'like' || (action === 'toggle' && !isLiked),
      like_count: newLikeCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update like'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
