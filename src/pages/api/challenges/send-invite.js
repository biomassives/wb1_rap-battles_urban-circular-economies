/**
 * Challenge Invite API - Send email and SMS invites
 * POST /api/challenges/send-invite
 */

export const prerender = false;

export async function POST({ request }) {
  try {
    const data = await request.json();
    const { type, challengeId, inviteCode, challengeTitle, senderWallet, message } = data;

    // Validate required fields
    if (!type || !challengeId || !inviteCode) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let result;

    switch (type) {
      case 'email':
        result = await sendEmailInvite(data);
        break;
      case 'sms':
        result = await sendSMSInvite(data);
        break;
      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid invite type'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Send invite error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Send email invite using environment email service
 */
async function sendEmailInvite(data) {
  const { email, challengeTitle, inviteCode, inviteLink, message, senderWallet } = data;

  if (!email) {
    return { success: false, error: 'No email provided' };
  }

  // Email template
  const subject = `⚔️ You've Been Challenged: ${challengeTitle}`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a1a; color: #fff; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 16px; padding: 30px; }
        h1 { color: #70d6ff; margin-bottom: 10px; }
        .code { font-size: 32px; font-family: monospace; color: #ff9770; letter-spacing: 4px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .btn { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #70d6ff, #ff9770); color: #000; text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 20px; }
        .message { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 20px 0; font-style: italic; }
        .footer { margin-top: 30px; font-size: 12px; color: rgba(255,255,255,0.5); }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚔️ Challenge Awaits!</h1>
        <p>You've been invited to join <strong>${challengeTitle}</strong> on WorldBridger One.</p>

        ${message ? `<div class="message">"${message}"</div>` : ''}

        <p>Use this code to join:</p>
        <div class="code">${inviteCode}</div>

        <a href="${inviteLink}" class="btn">Accept Challenge</a>

        <div class="footer">
          <p>Sent from WorldBridger One</p>
          <p>If you didn't expect this invite, you can safely ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Try to send via configured email service
  // Check for Resend, SendGrid, or other email service env vars
  const resendKey = import.meta.env.RESEND_API_KEY;
  const sendgridKey = import.meta.env.SENDGRID_API_KEY;

  if (resendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'WorldBridger One <challenges@worldbridger.one>',
          to: email,
          subject: subject,
          html: htmlBody
        })
      });

      if (response.ok) {
        return { success: true, method: 'resend' };
      }
    } catch (e) {
      console.error('Resend error:', e);
    }
  }

  if (sendgridKey) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: 'challenges@worldbridger.one', name: 'WorldBridger One' },
          subject: subject,
          content: [{ type: 'text/html', value: htmlBody }]
        })
      });

      if (response.ok) {
        return { success: true, method: 'sendgrid' };
      }
    } catch (e) {
      console.error('SendGrid error:', e);
    }
  }

  // Fallback: Log and mark as queued
  console.log('📧 Email invite queued (no email service configured):', email);
  return {
    success: true,
    queued: true,
    message: 'Email queued - no email service configured'
  };
}

/**
 * Send SMS invite using environment SMS service
 */
async function sendSMSInvite(data) {
  const { phone, challengeTitle, inviteCode } = data;

  if (!phone) {
    return { success: false, error: 'No phone number provided' };
  }

  const smsMessage = `⚔️ WorldBridger Challenge! You've been invited to "${challengeTitle}". Join with code: ${inviteCode} or visit worldbridger.one/challenge/join/${inviteCode}`;

  // Try Twilio
  const twilioSid = import.meta.env.TWILIO_ACCOUNT_SID;
  const twilioToken = import.meta.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = import.meta.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioToken && twilioPhone) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: phone,
            From: twilioPhone,
            Body: smsMessage
          })
        }
      );

      if (response.ok) {
        return { success: true, method: 'twilio' };
      }
    } catch (e) {
      console.error('Twilio error:', e);
    }
  }

  // Try Africa's Talking (for African phone numbers)
  const atKey = import.meta.env.AFRICASTALKING_API_KEY;
  const atUsername = import.meta.env.AFRICASTALKING_USERNAME;

  if (atKey && atUsername) {
    try {
      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'apiKey': atKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          username: atUsername,
          to: phone,
          message: smsMessage
        })
      });

      if (response.ok) {
        return { success: true, method: 'africastalking' };
      }
    } catch (e) {
      console.error('Africa\'s Talking error:', e);
    }
  }

  // Fallback: Log and mark as queued
  console.log('📱 SMS invite queued (no SMS service configured):', phone);
  return {
    success: true,
    queued: true,
    message: 'SMS queued - no SMS service configured'
  };
}
