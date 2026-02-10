// GET /api/projects/notes/list?projectId=...&walletAddress=...
// List notes for a project

import { sql } from '../../../../lib/db.js';
export const prerender = false;

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const walletAddress = url.searchParams.get('walletAddress');

    if (!projectId || !walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'projectId and walletAddress are required'
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

    const notes = await sql`
      SELECT n.*, COALESCE(u.username, 'Anonymous') as author_name
      FROM project_notes n
      LEFT JOIN user_profiles u ON n.wallet_address = u.wallet_address
      WHERE n.project_id = ${projectId}
      ORDER BY n.created_at DESC
    `;

    return new Response(JSON.stringify({ success: true, notes }),
      { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error listing notes:', error);
    return new Response(JSON.stringify({ success: false, error: error.message, notes: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
