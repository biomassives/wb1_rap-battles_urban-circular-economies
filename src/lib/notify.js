/**
 * notify.js — Server-side notification helper
 * Import in API routes to create notifications.
 *
 * Usage:
 *   import { notify, notifyFromTemplate } from '../../lib/notify.js';
 *   await notifyFromTemplate(wallet, 'xp_earned', { amount: 25, description: 'Battle' });
 */

import { sql } from './db.js';

/**
 * Create a notification directly.
 * Checks user preferences before inserting.
 *
 * @param {string} walletAddress
 * @param {Object} opts
 * @param {string} opts.category - xp|nft|project|governance|payout|social|achievement|system
 * @param {string} [opts.type] - Specific type (defaults to category)
 * @param {string} opts.title
 * @param {string} [opts.message]
 * @param {string} [opts.icon='📢']
 * @param {string} [opts.actionUrl]
 * @param {string} [opts.actionLabel]
 * @param {Object} [opts.actionData={}]
 * @param {string} [opts.priority='normal'] - low|normal|high|urgent
 * @param {string} [opts.groupKey]
 * @returns {Promise<{id?: number, created: boolean, skipped?: boolean}>}
 */
export async function notify(walletAddress, opts) {
  if (!walletAddress || !opts.category || !opts.title) {
    return { created: false, error: 'Missing required fields' };
  }

  try {
    // Check user preferences
    const prefs = await sql`
      SELECT * FROM notification_preferences WHERE wallet_address = ${walletAddress}
    `.catch(() => []);

    const userPrefs = prefs[0] || {};
    const prefKey = `notify_${opts.category}`;
    if (userPrefs[prefKey] === false) {
      return { created: false, skipped: true };
    }

    const result = await sql`
      INSERT INTO user_notifications (
        wallet_address, category, notification_type,
        title, message, icon,
        action_url, action_label, action_data,
        priority, group_key
      ) VALUES (
        ${walletAddress},
        ${opts.category},
        ${opts.type || opts.category},
        ${opts.title},
        ${opts.message || null},
        ${opts.icon || '📢'},
        ${opts.actionUrl || null},
        ${opts.actionLabel || null},
        ${opts.actionData ? JSON.stringify(opts.actionData) : '{}'},
        ${opts.priority || 'normal'},
        ${opts.groupKey || null}
      )
      RETURNING id, created_at
    `;

    return { id: result[0].id, created: true };
  } catch (error) {
    console.error('notify() error:', error.message);
    return { created: false, error: error.message };
  }
}

/**
 * Create a notification from a pre-built template.
 * Interpolates {key} placeholders in title/message/url with params.
 *
 * @param {string} walletAddress
 * @param {string} templateId - e.g., 'xp_earned', 'level_up'
 * @param {Object} params - Key-value pairs for {placeholder} interpolation
 * @returns {Promise<{id?: number, created: boolean}>}
 */
export async function notifyFromTemplate(walletAddress, templateId, params = {}) {
  try {
    const templates = await sql`
      SELECT * FROM notification_templates WHERE id = ${templateId} AND is_active = true
    `.catch(() => []);

    if (templates.length === 0) {
      // Fallback: create notification without template
      console.warn(`Notification template '${templateId}' not found, using fallback`);
      return notify(walletAddress, {
        category: 'system',
        type: templateId,
        title: params.title || templateId,
        message: params.description || params.message || null,
        priority: 'normal'
      });
    }

    const tmpl = templates[0];

    // Interpolate {key} placeholders
    const interpolate = (str) => {
      if (!str) return str;
      return str.replace(/\{(\w+)\}/g, (_, key) => params[key] !== undefined ? params[key] : `{${key}}`);
    };

    return notify(walletAddress, {
      category: tmpl.category,
      type: templateId,
      title: interpolate(tmpl.title_template),
      message: interpolate(tmpl.message_template),
      icon: tmpl.icon,
      actionUrl: interpolate(tmpl.action_url_template),
      actionLabel: tmpl.action_label,
      priority: tmpl.default_priority || 'normal'
    });
  } catch (error) {
    console.error('notifyFromTemplate() error:', error.message);
    return { created: false, error: error.message };
  }
}
