// /api/notifications/index.js
// Get and manage user notifications

import { neon } from '@neondatabase/serverless';

// GET - Fetch user notifications
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');
  const category = url.searchParams.get('category');
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  if (!walletAddress) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Wallet address is required'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    // Get notifications
    const notifications = await sql`
      SELECT
        id,
        category,
        notification_type,
        title,
        message,
        icon,
        action_url,
        action_label,
        action_data,
        priority,
        is_read,
        group_key,
        created_at
      FROM user_notifications
      WHERE wallet_address = ${walletAddress}
        AND is_dismissed = FALSE
        AND (expires_at IS NULL OR expires_at > NOW())
        ${category ? sql`AND category = ${category}` : sql``}
        ${unreadOnly ? sql`AND is_read = FALSE` : sql``}
      ORDER BY
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get unread counts by category
    const unreadCounts = await sql`
      SELECT category, COUNT(*) as count
      FROM user_notifications
      WHERE wallet_address = ${walletAddress}
        AND is_read = FALSE
        AND is_dismissed = FALSE
      GROUP BY category
    `;

    const totalUnread = unreadCounts.reduce((sum, c) => sum + parseInt(c.count), 0);

    // Get user preferences
    const prefs = await sql`
      SELECT * FROM notification_preferences
      WHERE wallet_address = ${walletAddress}
    `;

    return new Response(JSON.stringify({
      success: true,
      notifications,
      unreadCounts: unreadCounts.reduce((acc, c) => {
        acc[c.category] = parseInt(c.count);
        return acc;
      }, {}),
      totalUnread,
      preferences: prefs[0] || null,
      pagination: { limit, offset, count: notifications.length }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch notifications'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// POST - Create notification (internal use) or mark as read
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { action, walletAddress, notificationIds, category } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    if (action === 'markRead') {
      // Mark specific notifications as read
      if (notificationIds && notificationIds.length > 0) {
        await sql`
          UPDATE user_notifications
          SET is_read = TRUE, read_at = NOW()
          WHERE wallet_address = ${walletAddress}
            AND id = ANY(${notificationIds})
        `;
      } else if (category) {
        // Mark all in category as read
        await sql`
          UPDATE user_notifications
          SET is_read = TRUE, read_at = NOW()
          WHERE wallet_address = ${walletAddress}
            AND category = ${category}
            AND is_read = FALSE
        `;
      } else {
        // Mark all as read
        await sql`
          UPDATE user_notifications
          SET is_read = TRUE, read_at = NOW()
          WHERE wallet_address = ${walletAddress}
            AND is_read = FALSE
        `;
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Notifications marked as read'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else if (action === 'dismiss') {
      // Dismiss notifications
      if (notificationIds && notificationIds.length > 0) {
        await sql`
          UPDATE user_notifications
          SET is_dismissed = TRUE
          WHERE wallet_address = ${walletAddress}
            AND id = ANY(${notificationIds})
        `;
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Notifications dismissed'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else if (action === 'create') {
      // Create new notification (internal use)
      const {
        category: notifCategory,
        notificationType,
        title,
        message,
        icon,
        actionUrl,
        actionLabel,
        actionData,
        priority = 'normal',
        groupKey
      } = body;

      if (!notifCategory || !title) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Category and title are required'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Check user preferences
      const prefs = await sql`
        SELECT * FROM notification_preferences
        WHERE wallet_address = ${walletAddress}
      `;

      const userPrefs = prefs[0] || {};
      const categoryKey = `notify_${notifCategory}`;

      // Skip if user disabled this category
      if (userPrefs[categoryKey] === false) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Notification skipped (user preference)',
          created: false
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      const result = await sql`
        INSERT INTO user_notifications (
          wallet_address,
          category,
          notification_type,
          title,
          message,
          icon,
          action_url,
          action_label,
          action_data,
          priority,
          group_key
        ) VALUES (
          ${walletAddress},
          ${notifCategory},
          ${notificationType || notifCategory},
          ${title},
          ${message || null},
          ${icon || '📢'},
          ${actionUrl || null},
          ${actionLabel || null},
          ${actionData ? JSON.stringify(actionData) : '{}'},
          ${priority},
          ${groupKey || null}
        )
        RETURNING id, created_at
      `;

      return new Response(JSON.stringify({
        success: true,
        notification: result[0],
        created: true
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error managing notifications:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to manage notifications'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
