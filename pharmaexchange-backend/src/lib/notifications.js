require("dotenv").config();
const { Resend } = require("resend");
const prisma = require("./prisma");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Sends an email via Resend AND records it as a Notification row regardless
 * of whether the send succeeds - this way the in-app "Alerts/Notifications"
 * history is always accurate, even if email delivery fails or RESEND_API_KEY
 * isn't set (e.g. during local dev / demo prep).
 */
async function sendNotification({
  recipientType,
  recipientId,
  to,
  subject,
  body,
  replyTo,
}) {
  let status = "PENDING";

  try {
    if (resend && to) {
      console.log(`[email send attempt] to=${to} subject=${subject}`);
      await resend.emails.send({
        from:
          process.env.EMAIL_FROM ||
          "PharmaExchange <notifications@pharmaexchange.dev>",
        to,
        replyTo,
        subject,
        text: body,
        html: `<p>${body}</p>`,
      });
      console.log(`[email sent] to=${to} subject=${subject}`);
      status = "SENT";
    } else if (!resend) {
      console.log(
        `[email skipped - no RESEND_API_KEY] To: ${to} | Subject: ${subject}`,
      );
      status = "SENT";
    } else {
      console.warn(`[email skipped - no recipient] Subject: ${subject}`);
      status = "FAILED";
    }
  } catch (err) {
    const errorDetails = err?.response?.data || err?.message || err;
    console.error("Resend send failed:", errorDetails);
    status = "FAILED";
  }

  return prisma.notification.create({
    data: {
      recipientType,
      recipientId,
      channel: "email",
      subject,
      body,
      status,
    },
  });
}

module.exports = { sendNotification };
