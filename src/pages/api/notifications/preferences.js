// /api/notifications/preferences.js
// Manage notification preferences

import { neon } from '@neondatabase/serverless';

// GET - Get user's notification preferences
export async function GET({ request }) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  if (!walletAddress) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Wallet address is required'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    const prefs = await sql`
      SELECT * FROM notification_preferences
      WHERE wallet_address = ${walletAddress}
    `;

    // Return defaults if no preferences set
    const defaults = {
      notify_xp: true,
      notify_nft: true,
      notify_project: true,
      notify_governance: true,
      notify_payout: true,
      notify_social: true,
      notify_achievement: true,
      notify_system: true,
      show_in_app: true,
      email_enabled: false,
      email_frequency: 'instant',
      group_similar: true,
      auto_dismiss_read_after_days: 7,
      max_visible: 50,
      quiet_hours_enabled: false
    };

    return new Response(JSON.stringify({
      success: true,
      preferences: prefs.length > 0 ? prefs[0] : defaults,
      hasCustomPreferences: prefs.length > 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching preferences:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch preferences'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// POST - Update notification preferences
export async function POST({ request }) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      // Category toggles
      notifyXp,
      notifyNft,
      notifyProject,
      notifyGovernance,
      notifyPayout,
      notifySocial,
      notifyAchievement,
      notifySystem,
      // Delivery
      showInApp,
      emailEnabled,
      emailAddress,
      emailFrequency,
      // Display
      groupSimilar,
      autoDismissReadAfterDays,
      maxVisible,
      // Quiet hours
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd
    } = body;

    if (!walletAddress) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Wallet address is required'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.lab_POSTGRES_URL || process.env.DATABASE_URL);

    await sql`
      INSERT INTO notification_preferences (
        wallet_address,
        notify_xp,
        notify_nft,
        notify_project,
        notify_governance,
        notify_payout,
        notify_social,
        notify_achievement,
        notify_system,
        show_in_app,
        email_enabled,
        email_address,
        email_frequency,
        group_similar,
        auto_dismiss_read_after_days,
        max_visible,
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end,
        updated_at
      ) VALUES (
        ${walletAddress},
        ${notifyXp !== false},
        ${notifyNft !== false},
        ${notifyProject !== false},
        ${notifyGovernance !== false},
        ${notifyPayout !== false},
        ${notifySocial !== false},
        ${notifyAchievement !== false},
        ${notifySystem !== false},
        ${showInApp !== false},
        ${emailEnabled || false},
        ${emailAddress || null},
        ${emailFrequency || 'instant'},
        ${groupSimilar !== false},
        ${autoDismissReadAfterDays || 7},
        ${maxVisible || 50},
        ${quietHoursEnabled || false},
        ${quietHoursStart || null},
        ${quietHoursEnd || null},
        NOW()
      )
      ON CONFLICT (wallet_address) DO UPDATE SET
        notify_xp = COALESCE(${notifyXp}, notification_preferences.notify_xp),
        notify_nft = COALESCE(${notifyNft}, notification_preferences.notify_nft),
        notify_project = COALESCE(${notifyProject}, notification_preferences.notify_project),
        notify_governance = COALESCE(${notifyGovernance}, notification_preferences.notify_governance),
        notify_payout = COALESCE(${notifyPayout}, notification_preferences.notify_payout),
        notify_social = COALESCE(${notifySocial}, notification_preferences.notify_social),
        notify_achievement = COALESCE(${notifyAchievement}, notification_preferences.notify_achievement),
        notify_system = COALESCE(${notifySystem}, notification_preferences.notify_system),
        show_in_app = COALESCE(${showInApp}, notification_preferences.show_in_app),
        email_enabled = COALESCE(${emailEnabled}, notification_preferences.email_enabled),
        email_address = COALESCE(${emailAddress}, notification_preferences.email_address),
        email_frequency = COALESCE(${emailFrequency}, notification_preferences.email_frequency),
        group_similar = COALESCE(${groupSimilar}, notification_preferences.group_similar),
        auto_dismiss_read_after_days = COALESCE(${autoDismissReadAfterDays}, notification_preferences.auto_dismiss_read_after_days),
        max_visible = COALESCE(${maxVisible}, notification_preferences.max_visible),
        quiet_hours_enabled = COALESCE(${quietHoursEnabled}, notification_preferences.quiet_hours_enabled),
        quiet_hours_start = COALESCE(${quietHoursStart}, notification_preferences.quiet_hours_start),
        quiet_hours_end = COALESCE(${quietHoursEnd}, notification_preferences.quiet_hours_end),
        updated_at = NOW()
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Notification preferences updated'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update preferences'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
