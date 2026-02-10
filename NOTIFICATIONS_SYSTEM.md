# WorldBridger One — Notification System

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  API Routes  │────▶│  src/lib/notify.js │────▶│ user_notifications│
│  (triggers)  │     │  (server helper)   │     │    (Neon DB)       │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                       │
                    ┌──────────────────┐               │
                    │ NotificationManager│◀──── poll ───┘
                    │  (client-side)     │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  UFO Mothership   │
                    │  Bell + Panel UI  │
                    └──────────────────┘
```

**Flow:**
1. An API route (e.g., `award-xp.js`) calls `notify()` or `notifyFromTemplate()` from `src/lib/notify.js`
2. The helper checks user preferences, then INSERTs into `user_notifications`
3. The client-side `NotificationManager` polls every 60s for unread count
4. When the user clicks the UFO mothership icon, the panel slides open and loads full notifications
5. Users can filter by category, mark as read, dismiss, or click through to action URLs

---

## Database Schema

### `user_notifications` — Main notification storage

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | SERIAL PRIMARY KEY | auto | Unique ID |
| wallet_address | VARCHAR(44) | required | Recipient wallet |
| category | VARCHAR(30) | required | xp, nft, project, governance, payout, social, achievement, system |
| notification_type | VARCHAR(50) | required | Specific type (e.g., 'xp_earned', 'level_up') |
| title | VARCHAR(255) | required | Display title |
| message | TEXT | null | Detail message |
| icon | VARCHAR(10) | '📢' | Emoji icon |
| action_url | TEXT | null | Where clicking navigates |
| action_label | VARCHAR(50) | null | Button text (e.g., 'View Profile') |
| action_data | JSONB | '{}' | Extra data for client |
| priority | VARCHAR(10) | 'normal' | low, normal, high, urgent |
| is_read | BOOLEAN | FALSE | Read status |
| is_dismissed | BOOLEAN | FALSE | Dismissed/hidden |
| group_key | VARCHAR(100) | null | Group similar notifications |
| created_at | TIMESTAMP | NOW() | Creation time |
| read_at | TIMESTAMP | null | When marked read |
| expires_at | TIMESTAMP | null | Auto-expire time |

**Indexes:** wallet_address, (wallet_address, is_read) WHERE is_read=FALSE, (wallet_address, category), created_at DESC

### `notification_preferences` — Per-user settings

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| wallet_address | VARCHAR(44) PK | - | User wallet |
| notify_xp | BOOLEAN | TRUE | XP notifications |
| notify_nft | BOOLEAN | TRUE | NFT notifications |
| notify_project | BOOLEAN | TRUE | Project notifications |
| notify_governance | BOOLEAN | TRUE | Governance notifications |
| notify_payout | BOOLEAN | TRUE | Payout notifications |
| notify_social | BOOLEAN | TRUE | Social notifications |
| notify_achievement | BOOLEAN | TRUE | Achievement notifications |
| notify_system | BOOLEAN | TRUE | System notifications |
| show_in_app | BOOLEAN | TRUE | Show in-app notifications |
| group_similar | BOOLEAN | TRUE | Group similar items |
| auto_dismiss_read_after_days | INTEGER | 7 | Auto-cleanup |
| max_visible | INTEGER | 50 | Max in panel |
| updated_at | TIMESTAMP | NOW() | Last update |

### `notification_templates` — Pre-built message templates

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) PK | Template ID (e.g., 'xp_earned') |
| category | VARCHAR(30) | Category |
| title_template | VARCHAR(255) | Title with {placeholders} |
| message_template | TEXT | Message with {placeholders} |
| icon | VARCHAR(10) | Default icon |
| default_priority | VARCHAR(10) | Default priority |
| action_url_template | TEXT | URL with {placeholders} |
| action_label | VARCHAR(50) | Button text |
| is_active | BOOLEAN | Enable/disable |

### `activity_feed` — Public activity timeline

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Unique ID |
| wallet_address | VARCHAR(44) | Actor wallet |
| activity_type | VARCHAR(50) | Activity type |
| title | VARCHAR(255) | Display title |
| description | TEXT | Detail |
| reference_type | VARCHAR(30) | 'project', 'nft', etc. |
| reference_id | VARCHAR(100) | ID of referenced item |
| is_public | BOOLEAN | Public visibility |
| likes_count | INTEGER | Engagement |
| comments_count | INTEGER | Engagement |
| created_at | TIMESTAMP | Time |

---

## API Reference

### GET `/api/notifications`

Fetch notifications for a user.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| walletAddress | string | required | User wallet |
| category | string | null | Filter by category |
| unreadOnly | 'true' | false | Only unread |
| limit | number | 20 | Max results (max 100) |
| offset | number | 0 | Pagination offset |

**Response:**
```json
{
  "success": true,
  "notifications": [...],
  "unreadCounts": { "xp": 3, "social": 1 },
  "totalUnread": 4,
  "preferences": { ... },
  "pagination": { "limit": 20, "offset": 0, "count": 4 }
}
```

### POST `/api/notifications`

Create, mark-read, or dismiss notifications.

**Actions:**

#### `action: "create"`
```json
{
  "action": "create",
  "walletAddress": "...",
  "category": "xp",
  "notificationType": "xp_earned",
  "title": "Earned 25 XP",
  "message": "Battle submission",
  "icon": "⚡",
  "actionUrl": "/profile",
  "actionLabel": "View Progress",
  "priority": "normal",
  "groupKey": "xp_2024_01_15"
}
```

#### `action: "markRead"`
```json
{
  "action": "markRead",
  "walletAddress": "...",
  "notificationIds": [1, 2, 3]
}
```
Or mark all in a category: `{ "action": "markRead", "walletAddress": "...", "category": "xp" }`
Or mark all: `{ "action": "markRead", "walletAddress": "..." }`

#### `action: "dismiss"`
```json
{
  "action": "dismiss",
  "walletAddress": "...",
  "notificationIds": [1, 2]
}
```

### GET/POST `/api/notifications/preferences`

Get or update notification preferences for a user.

---

## Notification Categories & Templates

### XP
| Template ID | Title | Icon | Priority |
|------------|-------|------|----------|
| xp_earned | Earned {amount} XP | ⚡ | normal |
| level_up | Level Up! Now Level {level} | 🎉 | high |
| streak_bonus | {days}-Day Streak! | 🔥 | normal |

### NFT
| Template ID | Title | Icon | Priority |
|------------|-------|------|----------|
| nft_claimable | NFT Ready to Claim | 🎁 | high |
| nft_received | NFT Received | 💎 | normal |
| nft_sold | NFT Sold! | 💰 | high |
| stake_complete | Stake Complete | 🔓 | normal |

### Project
| Template ID | Title | Icon | Priority |
|------------|-------|------|----------|
| contribution_received | New Contribution | 🤝 | normal |
| proposal_approved | Proposal Approved | ✅ | high |
| milestone_reached | Milestone Reached | 🏆 | normal |
| impact_report | New Impact Report | 📊 | normal |

### Governance
| Template ID | Title | Icon | Priority |
|------------|-------|------|----------|
| new_proposal | New Proposal | 📜 | normal |
| vote_reminder | Vote Ending Soon | ⏰ | high |
| proposal_passed | Proposal Passed | ✅ | normal |
| delegation_received | Votes Delegated to You | 🗳️ | normal |

### Payout
| Template ID | Title | Icon | Priority |
|------------|-------|------|----------|
| payout_complete | Payout Complete | 💸 | high |
| payout_failed | Payout Failed | ❌ | urgent |
| gift_card_ready | Gift Card Ready | 🎟️ | high |
| balance_threshold | Balance Milestone | 💰 | normal |

### Social
| Template ID | Title | Icon | Priority |
|------------|-------|------|----------|
| new_follower | New Follower | 👤 | low |
| mention | You Were Mentioned | 💬 | normal |
| project_like | Project Liked | ❤️ | low |

### Achievement
| Template ID | Title | Icon | Priority |
|------------|-------|------|----------|
| achievement_unlocked | Achievement Unlocked | ⭐ | normal |
| badge_earned | New Badge | 🏅 | normal |

### System
| Template ID | Title | Icon | Priority |
|------------|-------|------|----------|
| welcome | Welcome to WorldBridger One | 🌍 | normal |
| maintenance | Scheduled Maintenance | 🔧 | high |
| update | New Features Available | 🆕 | normal |

---

## Role & Tier Visibility Matrix

### User Roles
Added to `user_profiles.role` column:
- **member** (default) — Standard user
- **mentor** — Trusted community member, can see project notifications
- **moderator** — Community moderator, bypasses tier restrictions
- **admin** — Full access, bypasses all restrictions

### XP Tiers (from `src/lib/xp-config.js`)
- **Bronze**: 0-499 XP
- **Silver**: 500-1,999 XP
- **Gold**: 2,000-4,999 XP
- **Platinum**: 5,000-14,999 XP
- **Diamond**: 15,000-49,999 XP
- **Mythic**: 50,000+ XP

### Visibility Rules

| Category | Min Tier | Min Role | Notes |
|----------|----------|----------|-------|
| xp | Bronze | member | Everyone |
| achievement | Bronze | member | Everyone |
| social | Bronze | member | Everyone |
| nft | Bronze | member | Everyone |
| system | Bronze | member | Everyone |
| payout | Silver | member | Requires some engagement |
| governance | Gold | member | Requires community investment |
| project | Bronze | mentor | Role-gated, not tier-gated |

**Overrides:** `moderator` and `admin` roles bypass ALL tier restrictions and see everything.

---

## Client-Side NotificationManager

Located in `BaseLayout.astro` `<script is:inline>` block.

### Methods

```javascript
window.notificationManager = {
  init()                    // Start polling (called on DOMContentLoaded)
  poll()                    // Fetch unread count, update badge
  toggle()                  // Open/close notification panel
  load(category)            // Fetch full notification list
  render()                  // Render notifications into panel HTML
  markRead(ids)             // Mark specific notifications as read
  markAllRead()             // Mark all as read
  dismiss(ids)              // Dismiss specific notifications
  updateBadge(count)        // Update UFO animation + badge number
  filterCategory(category)  // Switch category tab
  shouldShow(notif)         // Role/tier visibility check
  timeAgo(date)             // Relative time formatting
}
```

### Polling Behavior
- Polls every **60 seconds** when wallet is connected
- Only fetches **unread count** (lightweight) during polling
- Full notification list fetched only when **panel is opened**
- Stops polling when no wallet connected

---

## Server-Side Helper: `src/lib/notify.js`

### `notify(walletAddress, options)`

Creates a notification directly.

```javascript
import { notify } from '../../lib/notify.js';

await notify(walletAddress, {
  category: 'xp',
  type: 'xp_earned',
  title: 'Earned 25 XP',
  message: 'Battle submission reward',
  icon: '⚡',
  actionUrl: '/profile',
  actionLabel: 'View Progress',
  priority: 'normal',
  groupKey: null
});
```

### `notifyFromTemplate(walletAddress, templateId, params)`

Uses a pre-built template with placeholder interpolation.

```javascript
import { notifyFromTemplate } from '../../lib/notify.js';

await notifyFromTemplate(walletAddress, 'level_up', {
  level: 5
});
// Produces: title="Level Up! Now Level 5", icon="🎉", priority="high"
```

### Adding a New Trigger

1. Import the helper in your API route:
   ```javascript
   import { notify, notifyFromTemplate } from '../../../lib/notify.js';
   ```

2. Call after the main action succeeds:
   ```javascript
   // In your POST handler, after the main logic:
   await notifyFromTemplate(walletAddress, 'xp_earned', {
     amount: xpAwarded,
     description: 'Completed a challenge'
   });
   ```

3. For custom (non-template) notifications:
   ```javascript
   await notify(opponentWallet, {
     category: 'social',
     type: 'battle_invite',
     title: 'Battle Challenge!',
     message: `${challengerName} challenged you to a rap battle`,
     icon: '⚔️',
     actionUrl: `/rap-battle?id=${battleId}`,
     actionLabel: 'Accept Battle',
     priority: 'high'
   });
   ```

---

## UFO Mothership Icon

The notification bell is a CSS pixel-art rendition of the Space Invaders UFO/mothership (the bonus ship that flies across the top of the screen).

### Design
- Built with CSS `box-shadow` pixel technique on a tiny element
- Fits within the existing 28x28px `.nav-icon-btn` container
- Green (#00ff00) color scheme matching retro theme

### Animation States
- **No unread (static):** UFO sits still, subtle green outline
- **Unread > 0 (active):** UFO glides side-to-side (like the arcade flyby), badge pulses, green glow

### CSS Classes
- `.notif-bell` — Container for UFO icon
- `.ufo-icon` — The pixel-art UFO element
- `.ufo-active` — Added when unread > 0 (triggers animation)
- `.ufo-beam` — Optional love beam particle effect
- `.retro-badge` — Red count badge (existing class, reused)

---

## Wired Triggers

| API Route | Event | Template/Notification |
|-----------|-------|----------------------|
| `api/gamification/award-xp.js` | XP awarded | `xp_earned` |
| `api/gamification/award-xp.js` | Level increased | `level_up` (HIGH) |
| `api/battles/create.js` | Battle created | Custom battle invite to opponent |
| `api/challenges/submit.js` | Challenge submission | Custom to challenge creator |
| `api/music/track/[id]/like.js` | Track liked | Custom social notification to artist |
| `api/nft/mint.js` | NFT minted | `nft_received` |
| `api/check-drop.js` | Airdrop available | `nft_claimable` |

---

## File Reference

| File | Purpose |
|------|---------|
| `database/migrations/006_notifications.sql` | Original migration (tables + templates) |
| `src/pages/api/notifications/index.js` | GET/POST notification API |
| `src/pages/api/notifications/preferences.js` | Preference API |
| `src/lib/notify.js` | Server-side helper (notify, notifyFromTemplate) |
| `src/lib/xp-config.js` | XP activities and tier definitions |
| `src/layouts/BaseLayout.astro` | UFO bell, panel UI, NotificationManager class |
| `src/pages/api/settings/init-schema.js` | Schema init (includes notification tables) |
