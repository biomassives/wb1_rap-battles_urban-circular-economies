/**
 * POST /api/projects/transfer
 * Transfer, make claimable, or claim a project
 *
 * Body:
 * - walletAddress: string (required) - requesting user's wallet
 * - projectId: number (required) - project ID
 * - action: 'transfer' | 'claimable' | 'claim'
 * - targetWallet: string (required for 'transfer')
 */

import { sql } from '../../../lib/db.js';
export const prerender = false;

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { walletAddress, projectId, action, targetWallet } = body;

    if (!walletAddress || !projectId || !action) {
      return new Response(JSON.stringify({
        success: false,
        error: 'walletAddress, projectId, and action are required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validActions = ['transfer', 'claimable', 'claim'];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'action must be one of: transfer, claimable, claim'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'transfer') {
      if (!targetWallet) {
        return new Response(JSON.stringify({
          success: false, error: 'targetWallet is required for transfer'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Verify ownership
      const project = await sql`
        SELECT id, owner_wallet, title FROM user_projects WHERE id = ${projectId}
      `;
      if (project.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Project not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      if (project[0].owner_wallet !== walletAddress) {
        return new Response(JSON.stringify({ success: false, error: 'Not the project owner' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } });
      }

      await sql`
        UPDATE user_projects
        SET owner_wallet = ${targetWallet}, updated_at = NOW()
        WHERE id = ${projectId}
      `;

      return new Response(JSON.stringify({
        success: true,
        message: `Project "${project[0].title}" transferred to ${targetWallet.slice(0, 6)}...`
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'claimable') {
      const project = await sql`
        SELECT id, owner_wallet, title FROM user_projects WHERE id = ${projectId}
      `;
      if (project.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Project not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      if (project[0].owner_wallet !== walletAddress) {
        return new Response(JSON.stringify({ success: false, error: 'Not the project owner' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } });
      }

      await sql`
        UPDATE user_projects
        SET owner_wallet = NULL, status = 'claimable', updated_at = NOW()
        WHERE id = ${projectId}
      `;

      return new Response(JSON.stringify({
        success: true,
        message: `Project "${project[0].title}" is now claimable by anyone`
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'claim') {
      const project = await sql`
        SELECT id, title, status, owner_wallet FROM user_projects WHERE id = ${projectId}
      `;
      if (project.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Project not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      if (project[0].status !== 'claimable' || project[0].owner_wallet !== null) {
        return new Response(JSON.stringify({ success: false, error: 'Project is not claimable' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      await sql`
        UPDATE user_projects
        SET owner_wallet = ${walletAddress}, status = 'published', updated_at = NOW()
        WHERE id = ${projectId}
      `;

      return new Response(JSON.stringify({
        success: true,
        message: `You now own project "${project[0].title}"`
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('Project transfer error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
