// POST /api/projects/invite-accept
// Accept a project invite by token, generate wallet for new user

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { sql } from '../../../lib/db.js';
import { notify } from '../../../lib/notify.js';
export const prerender = false;

export async function POST({ request }) {
  try {
    const { token } = await request.json();

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Token is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Look up pending invite
    const invites = await sql`
      SELECT m.*, p.title as project_title, p.owner_wallet
      FROM project_members m
      JOIN user_projects p ON m.project_id = p.id
      WHERE m.invite_token = ${token}
    `;

    if (invites.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid invite token' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const invite = invites[0];

    if (invite.invite_status === 'accepted') {
      return new Response(JSON.stringify({
        success: false,
        error: 'This invite has already been accepted',
        walletAddress: invite.wallet_address,
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Generate Solana wallet
    const keypair = Keypair.generate();
    const walletAddress = keypair.publicKey.toBase58();
    const secretKey = bs58.encode(keypair.secretKey);

    const now = new Date().toISOString();

    // Update invite
    await sql`
      UPDATE project_members
      SET wallet_address = ${walletAddress}, invite_status = 'accepted', accepted_at = ${now}
      WHERE id = ${invite.id}
    `;

    // Upsert user profile
    await sql`
      INSERT INTO user_profiles (wallet_address, username, created_at, updated_at)
      VALUES (${walletAddress}, ${invite.email.split('@')[0]}, ${now}, ${now})
      ON CONFLICT (wallet_address) DO NOTHING
    `;

    // Notify inviter
    await notify(invite.owner_wallet, {
      category: 'project',
      type: 'project_invite_accepted',
      title: 'Invite accepted!',
      message: `${invite.email} accepted your invite to "${invite.project_title}"`,
      icon: '🤝',
      actionUrl: `/profile`,
      actionLabel: 'View Project',
      priority: 'normal',
    }).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      walletAddress,
      secretKey,
      projectTitle: invite.project_title,
      projectId: invite.project_id,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error accepting invite:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
