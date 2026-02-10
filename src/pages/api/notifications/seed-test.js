/**
 * POST /api/notifications/seed-test
 * Creates a batch of test notifications for a wallet address
 * Body: { walletAddress }
 */

import { sql } from '../../../lib/db.js';
export const prerender = false;

export async function POST({ request }) {
  try {
    const { walletAddress } = await request.json();
    if (!walletAddress) {
      return new Response(JSON.stringify({ success: false, error: 'walletAddress required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const now = new Date();
    const notifications = [
      {
        category: 'xp',
        notification_type: 'xp_earned',
        title: 'Earned 40 XP',
        message: 'Citizen science water quality submission',
        icon: '⚡',
        action_url: '/profile',
        action_label: 'View Progress',
        priority: 'normal',
        created_at: new Date(now - 2 * 60000)
      },
      {
        category: 'xp',
        notification_type: 'level_up',
        title: 'Level Up! Now Level 3',
        message: 'Keep going — next level at 900 XP',
        icon: '🎉',
        action_url: '/profile',
        action_label: 'View Profile',
        priority: 'high',
        created_at: new Date(now - 5 * 60000)
      },
      {
        category: 'social',
        notification_type: 'battle_invite',
        title: 'Battle Challenge!',
        message: 'Someone challenged you to a freestyle rap battle',
        icon: '⚔️',
        action_url: '/rap-battle',
        action_label: 'Accept Battle',
        priority: 'high',
        created_at: new Date(now - 12 * 60000)
      },
      {
        category: 'social',
        notification_type: 'track_liked',
        title: 'Track Liked!',
        message: 'Someone liked your track in the music library',
        icon: '❤️',
        action_url: '/music',
        action_label: 'View Track',
        priority: 'low',
        created_at: new Date(now - 30 * 60000)
      },
      {
        category: 'nft',
        notification_type: 'nft_claimable',
        title: 'NFT Ready to Claim',
        message: 'A Rare animal spirit airdrop is waiting for you',
        icon: '🎁',
        action_url: '/nft-gallery',
        action_label: 'Claim NFT',
        priority: 'high',
        created_at: new Date(now - 45 * 60000)
      },
      {
        category: 'nft',
        notification_type: 'nft_received',
        title: 'NFT Minted Successfully',
        message: 'Your animal spirit NFT has been minted on devnet',
        icon: '💎',
        action_url: '/nft-gallery',
        action_label: 'View Collection',
        priority: 'normal',
        created_at: new Date(now - 2 * 3600000)
      },
      {
        category: 'achievement',
        notification_type: 'achievement_unlocked',
        title: 'Achievement Unlocked: First Steps',
        message: 'Completed your first platform activity',
        icon: '⭐',
        action_url: '/achievements',
        action_label: 'View Achievements',
        priority: 'normal',
        created_at: new Date(now - 3 * 3600000)
      },
      {
        category: 'governance',
        notification_type: 'new_proposal',
        title: 'New Proposal: Community Music Fund',
        message: 'A new funding proposal needs your vote',
        icon: '📜',
        action_url: '/governance',
        action_label: 'Vote Now',
        priority: 'normal',
        created_at: new Date(now - 5 * 3600000)
      },
      {
        category: 'system',
        notification_type: 'welcome',
        title: 'Welcome to WorldBridger One',
        message: 'Start by exploring the beat playground and challenge arena',
        icon: '🌍',
        action_url: '/welcome',
        action_label: 'Get Started',
        priority: 'normal',
        created_at: new Date(now - 8 * 3600000)
      },
      {
        category: 'system',
        notification_type: 'update',
        title: 'New: Status Report Portal',
        message: 'Generate PDF reports for battles, healthcare, and water systems',
        icon: '🆕',
        action_url: '/reports',
        action_label: 'Try Reports',
        priority: 'normal',
        created_at: new Date(now - 10 * 3600000)
      },
      {
        category: 'social',
        notification_type: 'challenge_submission',
        title: 'New Challenge Submission',
        message: 'A participant submitted to the challenge arena',
        icon: '🎵',
        action_url: '/challenge-arena',
        action_label: 'View Submission',
        priority: 'normal',
        created_at: new Date(now - 6 * 3600000)
      },
      {
        category: 'xp',
        notification_type: 'xp_earned',
        title: 'Earned 25 XP',
        message: 'Battle submission reward',
        icon: '⚡',
        action_url: '/leaderboard',
        action_label: 'View Leaderboard',
        priority: 'normal',
        created_at: new Date(now - 24 * 3600000)
      }
    ];

    let created = 0;
    for (const n of notifications) {
      try {
        await sql`
          INSERT INTO user_notifications (
            wallet_address, category, notification_type, title, message,
            icon, action_url, action_label, priority, is_read, created_at
          ) VALUES (
            ${walletAddress}, ${n.category}, ${n.notification_type}, ${n.title}, ${n.message},
            ${n.icon}, ${n.action_url}, ${n.action_label}, ${n.priority}, false, ${n.created_at.toISOString()}
          )
        `;
        created++;
      } catch (e) {
        console.warn('Failed to insert notification:', e.message);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      created,
      total: notifications.length,
      message: `Created ${created} test notifications for ${walletAddress.slice(0, 6)}...`
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false, error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
