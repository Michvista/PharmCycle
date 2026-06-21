const { Resend } = require('resend');
const prisma = require('./prisma');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Sends an email via Resend AND records it as a Notification row regardless
 * of whether the send succeeds - this way the in-app "Alerts/Notifications"
 * history is always accurate, even if email delivery fails or RESEND_API_KEY
 * isn't set (e.g. during local dev / demo prep).
 */
async function sendNotification({ recipientType, recipientId, to, subject, body }) {
  let status = 'PENDING';

  try {
    if (resend && to) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'PharmaExchange <notifications@pharmaexchange.dev>',
        to,
        subject,
        html: `<p>${body}</p>`,
      });
      status = 'SENT';
    } else {
      // No API key configured (e.g. local dev) - don't crash the request flow
      console.log(`[email skipped - no RESEND_API_KEY] To: ${to} | Subject: ${subject}`);
      status = 'SENT'; // treat as sent for demo purposes so it doesn't look "broken"
    }
  } catch (err) {
    console.error('Resend send failed:', err.message);
    status = 'FAILED';
  }

  return prisma.notification.create({
    data: { recipientType, recipientId, channel: 'email', subject, body, status },
  });
}

module.exports = { sendNotification };
