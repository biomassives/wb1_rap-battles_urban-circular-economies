---
layout: "../../layouts/DocLayout.astro"
title: "MESSAGING_INTEGRATION_PLAN"
---
<div data-pagefind-filter="type:docs"></div>

# Purple Point - Messaging Integration Plan
**Created**: 2026-01-02
**Status**: Planning Phase

---

## 📬 Overview

This document outlines the integration of three messaging systems for the Purple Point platform:
1. **Mailgun** - Email notifications and campaigns
2. **Twilio** - SMS notifications and alerts
3. **Web3 Messaging** - Decentralized communication (XMTP, Dialect, Push Protocol)

---

## 1. Mailgun Integration (Email)

### Use Cases
- **Transactional Emails**:
  - Welcome emails for new users
  - Course enrollment confirmations
  - Achievement/certification earned notifications
  - Airdrop claim confirmations
  - Password reset emails
  - Referral invitations

- **Marketing Emails**:
  - Weekly progress summaries
  - New course announcements
  - Community highlights
  - Impact reports (Kakuma projects)

- **System Notifications**:
  - Mentor assignment confirmations
  - Observation submission confirmations
  - Battle/collaboration invitations

### API Setup

```javascript
// /src/lib/mailgun.js
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: import.meta.env.MAILGUN_API_KEY,
});

export const sendEmail = async ({
  to,
  subject,
  template,
  variables
}) => {
  try {
    const msg = await mg.messages.create(import.meta.env.MAILGUN_DOMAIN, {
      from: 'Purple Point <notifications@purplepoint.io>',
      to: [to],
      subject: subject,
      template: template,
      'h:X-Mailgun-Variables': JSON.stringify(variables)
    });

    return { success: true, messageId: msg.id };
  } catch (error) {
    console.error('Mailgun error:', error);
    return { success: false, error: error.message };
  }
};
```

### Email Templates

#### 1. Welcome Email
**Template ID**: `welcome-email`
**Variables**: `{username, walletAddress, referralCode}`

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Styles from email-template.astro */
  </style>
</head>
<body>
  <table width="600" cellpadding="0" cellspacing="0">
    <tr>
      <td class="header">
        <img src="https://purplepoint.io/images/email/header-banner.svg" alt="Purple Point" />
      </td>
    </tr>
    <tr>
      <td class="content">
        <h1>Welcome to Purple Point, {{username}}!</h1>
        <p>Your journey starts here. Create music, learn sustainability, and earn rewards.</p>

        <div class="cta-button">
          <a href="https://purplepoint.io/profile">Complete Your Profile</a>
        </div>

        <div class="stats">
          <h3>Your Referral Code: {{referralCode}}</h3>
          <p>Share and earn 100 XP per friend</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
```

#### 2. Achievement Earned
**Template ID**: `achievement-earned`
**Variables**: `{username, achievementName, xpEarned, imageUrl}`

#### 3. Airdrop Available
**Template ID**: `airdrop-available`
**Variables**: `{username, tokenAmount, claimDeadline, claimUrl}`

#### 4. Course Completion
**Template ID**: `course-completion`
**Variables**: `{username, courseName, certificateUrl, nextCourses[]}`

#### 5. Referral Invitation
**Template ID**: `referral-invitation`
**Variables**: `{senderName, message, signupUrl}`

### API Endpoints

```javascript
// /src/pages/api/email/send-welcome.js
export async function POST({ request }) {
  const { walletAddress, email, username } = await request.json();

  const result = await sendEmail({
    to: email,
    subject: 'Welcome to Purple Point!',
    template: 'welcome-email',
    variables: {
      username,
      walletAddress,
      referralCode: generateReferralCode(walletAddress)
    }
  });

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Environment Variables
```env
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=mg.purplepoint.io
MAILGUN_FROM_EMAIL=notifications@purplepoint.io
```

---

## 2. Twilio Integration (SMS)

### Use Cases
- **Critical Alerts**:
  - Airdrop claim deadline reminders (24h before expiry)
  - Security alerts (unusual wallet activity)
  - Mentor direct messages

- **Time-Sensitive Notifications**:
  - Rap battle started/challenge received
  - Live collaboration session invites
  - Course deadline reminders

- **Verification**:
  - Phone number verification (optional)
  - Two-factor authentication

### API Setup

```javascript
// /src/lib/twilio.js
import twilio from 'twilio';

const client = twilio(
  import.meta.env.TWILIO_ACCOUNT_SID,
  import.meta.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async ({ to, message }) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: import.meta.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('Twilio error:', error);
    return { success: false, error: error.message };
  }
};

export const sendWhatsApp = async ({ to, message }) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${import.meta.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('Twilio WhatsApp error:', error);
    return { success: false, error: error.message };
  }
};
```

### SMS Templates

#### 1. Airdrop Reminder
```
Purple Point: Your {tokenAmount} token airdrop expires in 24h!
Claim now: {claimUrl}
```

#### 2. Battle Challenge
```
Purple Point: {username} challenged you to a rap battle!
Join now: {battleUrl}
```

#### 3. Mentor Message
```
Purple Point: Your mentor {mentorName} sent you a message.
View: {messageUrl}
```

### API Endpoints

```javascript
// /src/pages/api/sms/send-notification.js
export async function POST({ request }) {
  const { phone, type, variables } = await request.json();

  // Get template based on type
  const message = getSMSTemplate(type, variables);

  const result = await sendSMS({
    to: phone,
    message
  });

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Environment Variables
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
```

---

## 3. Web3 Messaging Integration

### Why Web3 Messaging?
- **Wallet-to-wallet communication** without email/phone
- **Decentralized**: No central server required
- **Privacy-preserving**: End-to-end encrypted
- **On-chain identity**: Tied to Solana wallet
- **Censorship-resistant**: No platform can block messages

### Platform Comparison

| Feature | XMTP | Dialect | Push Protocol |
|---------|------|---------|---------------|
| **Blockchain** | Ethereum, Polygon | Solana | Ethereum, Polygon |
| **Encryption** | ✅ E2E | ✅ E2E | ✅ E2E |
| **Group Chat** | ⏳ Coming | ✅ Yes | ✅ Yes |
| **Push Notifications** | ✅ Yes | ✅ Yes | ✅ Yes |
| **SDK Size** | ~200kb | ~100kb | ~300kb |
| **Best For** | 1-to-1 messaging | Solana-native | Multi-chain |

**Recommendation**: Use **Dialect** for Solana-native messaging

---

## 3a. Dialect Integration (Solana Web3 Messaging)

### Use Cases
- **Wallet-to-Wallet Messaging**:
  - Direct messages between users
  - Mentor-mentee communication
  - Collaboration team chat
  - Battle trash talk

- **Smart Notification**s:
  - On-chain event notifications (NFT minted, airdrop claimed)
  - Wallet activity alerts
  - DAO governance proposals

- **Dapp Notifications**:
  - New courses available
  - Achievement unlocked
  - Community announcements

### Installation

```bash
npm install @dialectlabs/sdk @dialectlabs/react-ui
```

### API Setup

```javascript
// /src/lib/dialect.js
import { Dialect, DialectSdk } from '@dialectlabs/sdk';
import { PublicKey } from '@solana/web3.js';

let dialectSdk;

export const initializeDialect = async (wallet) => {
  dialectSdk = Dialect.sdk({
    wallet: wallet,
    environment: 'production' // or 'development'
  });

  return dialectSdk;
};

export const sendDialectMessage = async ({
  recipientPublicKey,
  message
}) => {
  try {
    const thread = await dialectSdk.threads.create({
      member: {
        publicKey: new PublicKey(recipientPublicKey)
      }
    });

    await thread.send({ text: message });

    return { success: true, threadId: thread.id };
  } catch (error) {
    console.error('Dialect error:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeToNotifications = async (wallet) => {
  try {
    await dialectSdk.notifications.subscribe({
      wallet: wallet,
      notificationTypes: [
        'achievement_earned',
        'airdrop_available',
        'battle_challenge',
        'mentor_message',
        'course_enrolled'
      ]
    });

    return { success: true };
  } catch (error) {
    console.error('Dialect subscription error:', error);
    return { success: false, error: error.message };
  }
};
```

### React Component Integration

```astro
---
// /src/components/DialectMessaging.astro
---

<div id="dialect-messaging-container"></div>

<script>
  import {
    DialectUiManagementProvider,
    NotificationsButton,
    ChatButton
  } from '@dialectlabs/react-ui';

  // Initialize Dialect UI
  function initDialectUI() {
    const wallet = window.walletManager?.wallet;
    if (!wallet) return;

    // Render notifications button
    const notificationsRoot = document.getElementById('dialect-notifications');
    if (notificationsRoot) {
      ReactDOM.render(
        <DialectUiManagementProvider wallet={wallet}>
          <NotificationsButton />
        </DialectUiManagementProvider>,
        notificationsRoot
      );
    }

    // Render chat button
    const chatRoot = document.getElementById('dialect-chat');
    if (chatRoot) {
      ReactDOM.render(
        <DialectUiManagementProvider wallet={wallet}>
          <ChatButton />
        </DialectUiManagementProvider>,
        chatRoot
      );
    }
  }

  // Initialize when wallet connects
  window.addEventListener('wallet-connected', initDialectUI);
</script>
```

### Integration Points

#### 1. Header Component
Add Dialect notification bell to header:

```astro
<!-- /src/components/Header.astro -->
<div class="header-actions">
  <!-- Existing wallet button -->

  <!-- Dialect Notifications -->
  <div id="dialect-notifications" class="dialect-notifications">
    <!-- Dialect UI will render here -->
  </div>

  <!-- Dialect Chat -->
  <div id="dialect-chat" class="dialect-chat">
    <!-- Dialect UI will render here -->
  </div>
</div>
```

#### 2. User Profile Page
Add direct messaging:

```javascript
// In profile.astro
async function sendDirectMessage(recipientWallet) {
  const result = await sendDialectMessage({
    recipientPublicKey: recipientWallet,
    message: document.getElementById('message-input').value
  });

  if (result.success) {
    showToast('Message sent!', 'success');
  }
}
```

#### 3. Notification Triggers

```javascript
// /src/lib/notifications.js
export const notifyUser = async ({
  walletAddress,
  type,
  message,
  channels = ['dialect', 'email', 'sms']
}) => {
  const results = [];

  // Send via Dialect (Web3)
  if (channels.includes('dialect')) {
    results.push(await sendDialectMessage({
      recipientPublicKey: walletAddress,
      message: message
    }));
  }

  // Send via Email
  if (channels.includes('email')) {
    const userEmail = await getUserEmail(walletAddress);
    if (userEmail) {
      results.push(await sendEmail({
        to: userEmail,
        subject: getSubject(type),
        template: getTemplate(type),
        variables: { message }
      }));
    }
  }

  // Send via SMS
  if (channels.includes('sms')) {
    const userPhone = await getUserPhone(walletAddress);
    if (userPhone) {
      results.push(await sendSMS({
        to: userPhone,
        message: message
      }));
    }
  }

  return results;
};
```

---

## 3b. Alternative: XMTP Integration

### For Multi-Chain Support

```javascript
// /src/lib/xmtp.js
import { Client } from '@xmtp/xmtp-js';

export const initializeXMTP = async (wallet) => {
  const xmtp = await Client.create(wallet);
  return xmtp;
};

export const sendXMTPMessage = async (xmtp, recipientAddress, message) => {
  const conversation = await xmtp.conversations.newConversation(recipientAddress);
  await conversation.send(message);
};
```

---

## 3c. Alternative: Push Protocol Integration

### For Advanced Notifications

```javascript
// /src/lib/push.js
import * as PushAPI from '@pushprotocol/restapi';

export const sendPushNotification = async ({
  signer,
  recipient,
  title,
  body
}) => {
  const apiResponse = await PushAPI.payloads.sendNotification({
    signer: signer,
    type: 3, // Target
    identityType: 2, // Direct payload
    notification: {
      title: title,
      body: body
    },
    payload: {
      title: title,
      body: body,
      cta: '',
      img: ''
    },
    recipients: recipient,
    channel: 'eip155:1:your_channel_address',
    env: 'prod'
  });

  return apiResponse;
};
```

---

## 4. Unified Messaging Service

### Central Notification Manager

```javascript
// /src/lib/messaging/NotificationManager.js
export class NotificationManager {
  constructor() {
    this.channels = {
      email: true,
      sms: false,
      web3: true
    };
  }

  async send({
    userId,
    type,
    message,
    priority = 'normal',
    channels = null
  }) {
    const user = await this.getUserPreferences(userId);
    const enabledChannels = channels || this.getEnabledChannels(user, type, priority);

    const promises = [];

    // Email (Mailgun)
    if (enabledChannels.includes('email') && user.email) {
      promises.push(this.sendEmail(user, type, message));
    }

    // SMS (Twilio)
    if (enabledChannels.includes('sms') && user.phone) {
      promises.push(this.sendSMS(user, type, message));
    }

    // Web3 (Dialect)
    if (enabledChannels.includes('web3') && user.walletAddress) {
      promises.push(this.sendWeb3Message(user, type, message));
    }

    const results = await Promise.allSettled(promises);
    return this.formatResults(results);
  }

  getEnabledChannels(user, type, priority) {
    // Critical alerts: all channels
    if (priority === 'critical') {
      return ['email', 'sms', 'web3'];
    }

    // High priority: email + web3
    if (priority === 'high') {
      return ['email', 'web3'];
    }

    // Normal: based on user preferences
    return user.notificationPreferences[type] || ['web3'];
  }

  async sendEmail(user, type, message) {
    return await sendEmail({
      to: user.email,
      subject: this.getSubject(type),
      template: this.getTemplate(type),
      variables: message
    });
  }

  async sendSMS(user, type, message) {
    return await sendSMS({
      to: user.phone,
      message: this.formatSMS(type, message)
    });
  }

  async sendWeb3Message(user, type, message) {
    return await sendDialectMessage({
      recipientPublicKey: user.walletAddress,
      message: this.formatWeb3(type, message)
    });
  }
}

export const notificationManager = new NotificationManager();
```

### Usage Examples

```javascript
// Achievement earned
await notificationManager.send({
  userId: 'user123',
  type: 'achievement_earned',
  message: {
    achievementName: 'First Beat Created',
    xpEarned: 100,
    imageUrl: 'https://...'
  },
  priority: 'normal',
  channels: ['email', 'web3']
});

// Airdrop expiring soon
await notificationManager.send({
  userId: 'user123',
  type: 'airdrop_expiring',
  message: {
    tokenAmount: 500,
    hoursLeft: 24,
    claimUrl: 'https://...'
  },
  priority: 'high',
  channels: ['email', 'sms', 'web3']
});

// Security alert
await notificationManager.send({
  userId: 'user123',
  type: 'security_alert',
  message: {
    alertType: 'unusual_activity',
    details: 'Login from new device'
  },
  priority: 'critical'
});
```

---

## 5. User Preferences

### Notification Settings Page

Add to `/src/pages/profile.astro`:

```html
<section class="notification-preferences">
  <h3>Notification Preferences</h3>

  <div class="preference-section">
    <h4>Delivery Channels</h4>

    <label class="preference-item">
      <input type="checkbox" name="channel-email" checked />
      <span>Email Notifications</span>
      <input type="email" placeholder="your@email.com" />
    </label>

    <label class="preference-item">
      <input type="checkbox" name="channel-sms" />
      <span>SMS Notifications</span>
      <input type="tel" placeholder="+1234567890" />
    </label>

    <label class="preference-item">
      <input type="checkbox" name="channel-web3" checked />
      <span>Web3 Messages (Dialect)</span>
      <span class="hint">Wallet-to-wallet messaging</span>
    </label>
  </div>

  <div class="preference-section">
    <h4>Notification Types</h4>

    <label class="preference-item">
      <input type="checkbox" name="notif-achievements" checked />
      <span>Achievements & XP</span>
      <select name="notif-achievements-channel">
        <option value="all">All channels</option>
        <option value="email">Email only</option>
        <option value="web3">Web3 only</option>
      </select>
    </label>

    <label class="preference-item">
      <input type="checkbox" name="notif-airdrops" checked />
      <span>Airdrops & Rewards</span>
      <select name="notif-airdrops-channel">
        <option value="all">All channels</option>
      </select>
    </label>

    <label class="preference-item">
      <input type="checkbox" name="notif-courses" checked />
      <span>Course Updates</span>
    </label>

    <label class="preference-item">
      <input type="checkbox" name="notif-social" checked />
      <span>Social (Battles, Collabs)</span>
    </label>

    <label class="preference-item">
      <input type="checkbox" name="notif-marketing" />
      <span>Marketing & Newsletters</span>
    </label>
  </div>

  <button class="btn-primary">Save Preferences</button>
</section>
```

---

## 6. Database Schema

### Notification Preferences Table

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(44) NOT NULL,

  -- Contact info
  email VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT false,

  -- Channel preferences
  channel_email BOOLEAN DEFAULT true,
  channel_sms BOOLEAN DEFAULT false,
  channel_web3 BOOLEAN DEFAULT true,

  -- Notification type preferences
  notif_achievements VARCHAR(10) DEFAULT 'all', -- all, email, web3, none
  notif_airdrops VARCHAR(10) DEFAULT 'all',
  notif_courses VARCHAR(10) DEFAULT 'all',
  notif_social VARCHAR(10) DEFAULT 'all',
  notif_security VARCHAR(10) DEFAULT 'all',
  notif_marketing VARCHAR(10) DEFAULT 'none',

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notif_prefs_wallet ON notification_preferences(wallet_address);
```

### Notification Log Table

```sql
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(44) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL, -- email, sms, web3
  status VARCHAR(20) NOT NULL, -- sent, failed, queued
  message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notif_log_wallet ON notification_log(wallet_address);
CREATE INDEX idx_notif_log_type ON notification_log(notification_type);
```

---

## 7. Implementation Checklist

### Phase 1: Email (Mailgun) ✅ Priority 1
- [ ] Set up Mailgun account and domain
- [ ] Create email templates in Mailgun dashboard
- [ ] Implement `/src/lib/mailgun.js`
- [ ] Create API endpoints for sending emails
- [ ] Add email template designs (using email-template.astro)
- [ ] Test transactional emails
- [ ] Set up DKIM/SPF records

### Phase 2: SMS (Twilio) 🔶 Priority 2
- [ ] Set up Twilio account
- [ ] Purchase phone number
- [ ] Implement `/src/lib/twilio.js`
- [ ] Create SMS templates
- [ ] Add phone verification flow
- [ ] Test SMS delivery
- [ ] Set up WhatsApp Business API (optional)

### Phase 3: Web3 (Dialect) ⭐ Priority 1
- [ ] Install Dialect SDK
- [ ] Implement `/src/lib/dialect.js`
- [ ] Add Dialect UI components to header
- [ ] Create notification subscription flow
- [ ] Test wallet-to-wallet messaging
- [ ] Add group chat for collaborations

### Phase 4: Unified System 🎯 Priority 1
- [ ] Implement NotificationManager class
- [ ] Create notification preferences UI
- [ ] Set up database tables
- [ ] Add user preference APIs
- [ ] Implement quiet hours
- [ ] Add notification history page

### Phase 5: Testing & Monitoring 📊 Priority 2
- [ ] Test all notification paths
- [ ] Set up error monitoring (Sentry)
- [ ] Add delivery rate tracking
- [ ] Implement retry logic
- [ ] Add rate limiting
- [ ] Test spam filters

---

## 8. Cost Estimates

### Mailgun Pricing
- **Free Tier**: 5,000 emails/month
- **Foundation**: $35/month - 50,000 emails
- **Growth**: $80/month - 100,000 emails
- **Est. Monthly Cost**: $35-80 (depending on user base)

### Twilio Pricing
- **SMS**: $0.0079/message (US)
- **WhatsApp**: $0.005/conversation
- **Est. Monthly Cost**: $50-200 (for critical alerts only)

### Dialect Pricing
- **Free**: Unlimited messages
- **Infrastructure**: Self-hosted on Solana
- **Est. Monthly Cost**: $0 (gas fees only)

**Total Est. Monthly Cost**: $85-280

---

## 9. Best Practices

### 1. Respect User Preferences
- Always check user's notification preferences before sending
- Implement easy unsubscribe
- Honor quiet hours
- Never send marketing without opt-in

### 2. Optimize for Deliverability
- Use verified domains
- Maintain good sender reputation
- Avoid spam trigger words
- Include plain text versions
- Add unsubscribe links

### 3. Error Handling
- Retry failed deliveries (max 3 attempts)
- Log all errors
- Fallback to alternative channels
- Alert admins on persistent failures

### 4. Privacy & Security
- Encrypt sensitive data
- Use HTTPS for all webhooks
- Validate webhook signatures
- Don't log message contents
- Comply with GDPR/CCPA

### 5. Performance
- Use job queues for bulk sends
- Implement rate limiting
- Cache user preferences
- Batch notifications when possible

---

## 10. Next Steps

1. **Set up Mailgun** (Week 1)
   - Create account, verify domain
   - Design and upload templates
   - Implement basic transactional emails

2. **Integrate Dialect** (Week 1-2)
   - Install SDK and set up
   - Add UI components
   - Test wallet-to-wallet messaging

3. **Build Notification Manager** (Week 2)
   - Implement unified service
   - Add user preferences
   - Create database tables

4. **Add Twilio** (Week 3)
   - Set up account for SMS
   - Implement critical alerts only
   - Test delivery

5. **Test & Launch** (Week 4)
   - End-to-end testing
   - Monitor delivery rates
   - Gather user feedback
   - Iterate

---

**Status**: Ready for implementation
**Owner**: TBD
**Timeline**: 4 weeks
**Dependencies**: User email/phone collection, Solana wallet integration
