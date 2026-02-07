/**
 * POST /api/community/mentoring-checkin
 * Log a mentoring session or check-in
 *
 * Body:
 * - walletAddress: string (required)
 * - role: 'mentor' | 'mentee' (required)
 * - sessionType: 'checkin' | 'full_session' | 'group_session' | 'become_mentor' (default: 'checkin')
 * - partnerWallet: string (optional)
 * - notes: string (optional)
 * - durationMinutes: number (optional)
 *
 * XP: 25 (checkin), 50 (full session >30min), 150 (become_mentor one-time)
 */

import { neon } from '@neondatabase/serverless';
import { XP_ACTIVITIES } from '../../../lib/xp-config.js';

export const prerender = false;

export async function POST({ request }) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content-Type must be application/json'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const {
      walletAddress,
      role,
      sessionType = 'checkin',
      partnerWallet = null,
      notes = null,
      durationMinutes = null
    } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'walletAddress is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validRoles = ['mentor', 'mentee'];
    if (!role || !validRoles.includes(role)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'role must be "mentor" or "mentee"'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validTypes = ['checkin', 'full_session', 'group_session', 'become_mentor'];
    if (!validTypes.includes(sessionType)) {
      return new Response(JSON.stringify({
        success: false,
        error: `sessionType must be one of: ${validTypes.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const dbUrl = process.env.DATABASE_URL || process.env.NILE_DATABASE_URL;
    if (!dbUrl) {
      return new Response(JSON.stringify({
        success: true,
        source: 'local_only',
        message: 'Database not configured, session tracked locally',
        xpAwarded: XP_ACTIVITIES.mentoring_checkin
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(dbUrl);

    // Determine XP amount
    let xpAmount = XP_ACTIVITIES.mentoring_checkin; // 25
    let activityType = 'mentoring_checkin';

    if (sessionType === 'become_mentor') {
      // Check if already claimed become_mentor bonus
      const existing = await sql`
        SELECT id FROM mentoring_sessions
        WHERE wallet_address = ${walletAddress} AND session_type = 'become_mentor'
        LIMIT 1
      `;
      if (existing.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'You have already claimed the become-a-mentor bonus'
        }), { status: 409, headers: { 'Content-Type': 'application/json' } });
      }
      xpAmount = XP_ACTIVITIES.become_mentor; // 150
      activityType = 'become_mentor';
    } else if (sessionType === 'full_session' && durationMinutes && durationMinutes >= 30) {
      xpAmount = XP_ACTIVITIES.mentoring_session_complete; // 50
      activityType = 'mentoring_session_complete';
    }

    // Insert session
    const result = await sql`
      INSERT INTO mentoring_sessions (wallet_address, role, session_type, partner_wallet, notes, duration_minutes, xp_earned)
      VALUES (${walletAddress}, ${role}, ${sessionType}, ${partnerWallet}, ${notes}, ${durationMinutes}, ${xpAmount})
      RETURNING id, created_at
    `;

    // Award XP
    try {
      await sql`
        UPDATE user_profiles SET xp = xp + ${xpAmount}, updated_at = NOW()
        WHERE wallet_address = ${walletAddress}
      `;
      await sql`
        INSERT INTO xp_activities (user_wallet, activity_type, xp_earned, description, metadata)
        VALUES (
          ${walletAddress}, ${activityType}, ${xpAmount},
          ${sessionType === 'become_mentor' ? 'Became a mentor' : `Mentoring ${sessionType} as ${role}`},
          ${JSON.stringify({ session_id: result[0].id, role, sessionType, durationMinutes })}
        )
      `;
      await sql`
        INSERT INTO activity_log (wallet_address, activity_type, activity_data, xp_earned)
        VALUES (
          ${walletAddress}, ${activityType},
          ${JSON.stringify({ session_id: result[0].id, role, sessionType, partnerWallet })},
          ${xpAmount}
        )
      `;
    } catch (xpError) {
      console.warn('Failed to award XP for mentoring:', xpError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      session: {
        id: result[0].id,
        walletAddress,
        role,
        sessionType,
        durationMinutes,
        createdAt: result[0].created_at
      },
      xpAwarded: xpAmount,
      message: `Mentoring ${sessionType} logged! +${xpAmount} XP`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Mentoring checkin error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to log mentoring session: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
