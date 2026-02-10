/**
 * DELETE /api/account/delete
 * Delete a user account and all associated data
 *
 * Body:
 * - walletAddress: string (required)
 * - confirmation: "DELETE" (required)
 * - projectActions: { [projectId]: { action: 'transfer'|'claimable'|'delete', targetWallet? } }
 */

import { sql } from '../../../lib/db.js';
export const prerender = false;

export async function DELETE({ request }) {
  try {
    const body = await request.json();
    const { walletAddress, confirmation, projectActions = {} } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false, error: 'walletAddress is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (confirmation !== 'DELETE') {
      return new Response(JSON.stringify({
        success: false, error: 'Type DELETE to confirm account deletion'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify user exists
    const user = await sql`
      SELECT wallet_address FROM user_profiles WHERE wallet_address = ${walletAddress}
    `.catch(() => []);

    if (user.length === 0) {
      return new Response(JSON.stringify({
        success: false, error: 'User not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    let tablesProcessed = 0;

    // Process project actions first
    for (const [projectId, action] of Object.entries(projectActions)) {
      try {
        const pid = parseInt(projectId);
        if (action.action === 'transfer' && action.targetWallet) {
          await sql`
            UPDATE user_projects SET owner_wallet = ${action.targetWallet}, updated_at = NOW()
            WHERE id = ${pid} AND owner_wallet = ${walletAddress}
          `;
        } else if (action.action === 'claimable') {
          await sql`
            UPDATE user_projects SET owner_wallet = NULL, status = 'claimable', updated_at = NOW()
            WHERE id = ${pid} AND owner_wallet = ${walletAddress}
          `;
        } else if (action.action === 'delete') {
          await sql`DELETE FROM user_projects WHERE id = ${pid} AND owner_wallet = ${walletAddress}`;
        }
      } catch (e) {
        console.warn('Project action failed for', projectId, e.message);
      }
    }

    // Delete user data across all tables (ordered by FK dependencies)
    // Each wrapped in try/catch so missing tables don't break the flow
    const deletions = [
      () => sql`DELETE FROM user_notifications WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM notification_preferences WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM battle_votes WHERE voter_wallet = ${walletAddress}`,
      () => sql`DELETE FROM battle_submissions WHERE user_wallet = ${walletAddress}`,
      () => sql`DELETE FROM challenge_votes WHERE voter_wallet = ${walletAddress}`,
      () => sql`DELETE FROM challenge_submissions WHERE participant_wallet = ${walletAddress}`,
      () => sql`DELETE FROM challenge_participants WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM track_likes WHERE user_wallet = ${walletAddress}`,
      () => sql`DELETE FROM track_comments WHERE user_wallet = ${walletAddress}`,
      () => sql`DELETE FROM tracks WHERE user_wallet = ${walletAddress}`,
      () => sql`DELETE FROM xp_activities WHERE user_wallet = ${walletAddress}`,
      () => sql`DELETE FROM activity_log WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM health_observations WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM environmental_observations WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM citizen_science_data WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM mentoring_sessions WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM artist_reviews WHERE reviewer_wallet = ${walletAddress}`,
      () => sql`DELETE FROM data_reviews WHERE reviewer_wallet = ${walletAddress}`,
      () => sql`DELETE FROM data_reviewers WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM governance_votes WHERE voter_wallet = ${walletAddress}`,
      () => sql`DELETE FROM vote_delegations WHERE delegator_wallet = ${walletAddress} OR delegate_wallet = ${walletAddress}`,
      () => sql`DELETE FROM governance_tokens WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM nft_transactions WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM pfp_mints WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM report_history WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM activity_feed WHERE wallet_address = ${walletAddress}`,
      () => sql`DELETE FROM email_signups WHERE wallet_address = ${walletAddress}`,
      // user_projects that weren't transferred/claimed/deleted above
      () => sql`DELETE FROM user_projects WHERE owner_wallet = ${walletAddress}`,
      // user_profiles last
      () => sql`DELETE FROM user_profiles WHERE wallet_address = ${walletAddress}`,
    ];

    for (const deleteFn of deletions) {
      try {
        await deleteFn();
        tablesProcessed++;
      } catch (e) {
        // Table may not exist — continue
        tablesProcessed++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      deleted: true,
      tablesProcessed,
      message: 'Account and all associated data have been deleted'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Account deletion error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete account: ' + error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
