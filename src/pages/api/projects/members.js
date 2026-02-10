// GET /api/projects/members?projectId=...&walletAddress=...
// List members/invites for a project

import { sql } from '../../../lib/db.js';
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
      SELECT owner_wallet, title FROM user_projects WHERE id = ${projectId}
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

    const members = await sql`
      SELECT m.*, COALESCE(u.username, 'Pending') as username, u.avatar_url
      FROM project_members m
      LEFT JOIN user_profiles u ON m.wallet_address = u.wallet_address
      WHERE m.project_id = ${projectId}
      ORDER BY m.created_at ASC
    `;

    return new Response(JSON.stringify({
      success: true,
      members,
      isOwner,
      projectTitle: project[0].title
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error listing members:', error);
    return new Response(JSON.stringify({ success: false, error: error.message, members: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
