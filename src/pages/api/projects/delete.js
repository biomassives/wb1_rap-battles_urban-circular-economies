// /api/projects/delete.js
// Delete a user project

import { neon } from '@neondatabase/serverless';

export async function DELETE({ request }) {
  try {
    const body = await request.json();
    const { walletAddress, projectId, slug } = body;

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
        error: 'You do not have permission to delete this project'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the project (likes will cascade due to FK constraint)
    await sql`DELETE FROM user_projects WHERE id = ${project.id}`;

    return new Response(JSON.stringify({
      success: true,
      message: 'Project deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete project: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
