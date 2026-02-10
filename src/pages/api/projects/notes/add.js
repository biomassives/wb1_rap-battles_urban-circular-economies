// POST /api/projects/notes/add
// Add a note to a project

import { sql } from '../../../../lib/db.js';
export const prerender = false;

export async function POST({ request }) {
  try {
    const { walletAddress, projectId, content, noteType = 'general' } = await request.json();

    if (!walletAddress || !projectId || !content?.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'walletAddress, projectId, and content are required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify caller is owner or accepted member
    const project = await sql`
      SELECT owner_wallet FROM user_projects WHERE id = ${projectId}
    `;
    if (project.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const isOwner = project[0].owner_wallet === walletAddress;
    if (!isOwner) {
      const membership = await sql`
        SELECT id FROM project_members
        WHERE project_id = ${projectId} AND wallet_address = ${walletAddress} AND invite_status = 'accepted'
      `;
      if (membership.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Not authorized' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
    }

    const now = new Date().toISOString();
    const result = await sql`
      INSERT INTO project_notes (project_id, wallet_address, content, note_type, created_at)
      VALUES (${projectId}, ${walletAddress}, ${content.trim()}, ${noteType}, ${now})
      RETURNING *
    `;

    return new Response(JSON.stringify({ success: true, note: result[0] }),
      { status: 201, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error adding note:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
