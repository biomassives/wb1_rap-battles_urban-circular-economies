/**
 * email.js — Email sender with Mailgun priority
 *
 * Priority chain: Mailgun -> Resend -> SendGrid -> queued (console log)
 *
 * Env vars:
 *   MAILGUN_API_KEY, MAILGUN_DOMAIN  (primary)
 *   RESEND_API_KEY                    (fallback 1)
 *   SENDGRID_API_KEY                  (fallback 2)
 */

/**
 * Send an email using the first available provider.
 *
 * @param {Object} opts
 * @param {string} opts.to       - Recipient email
 * @param {string} opts.subject  - Email subject
 * @param {string} opts.html     - HTML body
 * @param {string} [opts.from]   - Sender (defaults to noreply@MAILGUN_DOMAIN)
 * @returns {Promise<{sent: boolean, provider?: string, error?: string}>}
 */
export async function sendEmail({ to, subject, html, from }) {
  if (!to || !subject || !html) {
    return { sent: false, error: 'Missing required fields: to, subject, html' };
  }

  // 1. Mailgun
  const mgKey = process.env.MAILGUN_API_KEY;
  const mgDomain = process.env.MAILGUN_DOMAIN;
  if (mgKey && mgDomain) {
    try {
      const sender = from || `WorldBridger One <noreply@${mgDomain}>`;
      const formBody = new URLSearchParams({ from: sender, to, subject, html });

      const res = await fetch(`https://api.mailgun.net/v3/${mgDomain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`api:${mgKey}`),
        },
        body: formBody,
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[email] Mailgun sent to ${to}: ${data.id}`);
        return { sent: true, provider: 'mailgun', id: data.id };
      }

      const errText = await res.text();
      console.warn(`[email] Mailgun failed (${res.status}): ${errText}`);
    } catch (err) {
      console.warn(`[email] Mailgun error: ${err.message}`);
    }
  }

  // 2. Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const sender = from || 'WorldBridger One <noreply@worldbridger.one>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: sender, to, subject, html }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[email] Resend sent to ${to}: ${data.id}`);
        return { sent: true, provider: 'resend', id: data.id };
      }

      const errText = await res.text();
      console.warn(`[email] Resend failed (${res.status}): ${errText}`);
    } catch (err) {
      console.warn(`[email] Resend error: ${err.message}`);
    }
  }

  // 3. SendGrid
  const sgKey = process.env.SENDGRID_API_KEY;
  if (sgKey) {
    try {
      const sender = from || 'noreply@worldbridger.one';
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sgKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: sender },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });

      if (res.ok || res.status === 202) {
        console.log(`[email] SendGrid sent to ${to}`);
        return { sent: true, provider: 'sendgrid' };
      }

      const errText = await res.text();
      console.warn(`[email] SendGrid failed (${res.status}): ${errText}`);
    } catch (err) {
      console.warn(`[email] SendGrid error: ${err.message}`);
    }
  }

  // 4. No provider available — queue (log)
  console.log(`[email] QUEUED (no provider configured) — to: ${to}, subject: ${subject}`);
  return { sent: false, provider: 'queued', error: 'No email provider configured' };
}
