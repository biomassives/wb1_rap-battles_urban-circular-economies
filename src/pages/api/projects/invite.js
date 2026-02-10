// POST /api/projects/invite
// Invite a member to a project by email

import crypto from 'node:crypto';
import { sql } from '../../../lib/db.js';
import { sendEmail } from '../../../lib/email.js';
import { notify } from '../../../lib/notify.js';
export const prerender = false;

export async function POST({ request }) {
  try {
    const { walletAddress, projectId, email, role = 'member', message } = await request.json();

    if (!walletAddress || !projectId || !email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'walletAddress, projectId, and email are required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify ownership
    const project = await sql`
      SELECT id, title, owner_wallet FROM user_projects WHERE id = ${projectId}
    `;
    if (project.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    if (project[0].owner_wallet !== walletAddress) {
      return new Response(JSON.stringify({ success: false, error: 'Only project owner can invite members' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Check duplicate invite
    const existing = await sql`
      SELECT id, invite_status FROM project_members
      WHERE project_id = ${projectId} AND email = ${email}
    `;
    if (existing.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `This email has already been invited (status: ${existing[0].invite_status})`
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();

    await sql`
      INSERT INTO project_members (project_id, email, role, invite_token, invite_status, invited_by, created_at)
      VALUES (${projectId}, ${email}, ${role}, ${inviteToken}, 'pending', ${walletAddress}, ${now})
    `;

    // Build invite URL
    const origin = new URL(request.url).origin;
    const inviteUrl = `${origin}/projects/invite/${inviteToken}`;

    // Get inviter username
    const inviterProfile = await sql`
      SELECT username FROM user_profiles WHERE wallet_address = ${walletAddress}
    `.catch(() => []);
    const inviterName = inviterProfile[0]?.username || walletAddress.slice(0, 8) + '...';

    // Send email
    const personalNote = message ? `<p style="color:#ccc;margin:16px 0;padding:12px;background:#1a1a24;border-radius:8px;border-left:3px solid #10b981;">"${escapeHtml(message)}"</p>` : '';

    const emailResult = await sendEmail({
      to: email,
      subject: `You're invited to "${project[0].title}" on WorldBridger One`,
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:32px 20px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#10b981;margin:0;font-size:24px;">WorldBridger One</h1>
  </div>
  <div style="background:#111118;border-radius:12px;padding:24px;border:1px solid #2a2a3a;">
    <h2 style="color:#e5e5e5;margin:0 0 8px;">You've been invited!</h2>
    <p style="color:#888;margin:0 0 16px;font-size:14px;">
      <strong style="color:#e5e5e5;">${escapeHtml(inviterName)}</strong> invited you to collaborate on:
    </p>
    <div style="background:#0a0a0f;border-radius:8px;padding:16px;margin-bottom:16px;">
      <h3 style="color:#10b981;margin:0 0 4px;">${escapeHtml(project[0].title)}</h3>
      <span style="color:#888;font-size:13px;">Role: ${escapeHtml(role)}</span>
    </div>
    ${personalNote}
    <a href="${inviteUrl}" style="display:block;text-align:center;background:#10b981;color:#000;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;margin-top:16px;">
      Accept Invite
    </a>
    <p style="color:#666;font-size:12px;margin-top:16px;text-align:center;">
      Or copy this link: ${inviteUrl}
    </p>
  </div>
  <p style="color:#444;font-size:11px;text-align:center;margin-top:16px;">
    WorldBridger One — Building bridges, one project at a time
  </p>
</div>
</body>
</html>`,
    });

    // Notify inviter
    await notify(walletAddress, {
      category: 'project',
      type: 'project_invite_sent',
      title: 'Invite sent',
      message: `Invitation sent to ${email} for "${project[0].title}"`,
      icon: '📨',
      priority: 'normal',
    }).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      inviteUrl,
      emailSent: emailResult.sent,
      emailProvider: emailResult.provider,
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error inviting member:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
