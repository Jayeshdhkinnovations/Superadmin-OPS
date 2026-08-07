import { createTransport } from 'nodemailer';
import { BRAND_NAME } from './emailTemplates.js';

// The console has no mail infrastructure of its own - it reuses the same
// SMTP account the OpenSign side sends from, passed in through the container
// env. If SMTP isn't configured, sends become no-ops rather than throwing:
// approving a company must never fail because a notification couldn't go out.
let cachedTransport;
let transportResolved = false;

function getTransport() {
  if (transportResolved) return cachedTransport;
  transportResolved = true;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USERNAME || process.env.SMTP_USER_EMAIL;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.log('mailer: SMTP not configured, notification emails disabled');
    cachedTransport = null;
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 465);
  cachedTransport = createTransport({
    host,
    port,
    // 465 is implicit TLS; 587 upgrades via STARTTLS and must NOT set secure.
    secure: String(process.env.SMTP_SECURE ?? (port === 465)) === 'true',
    auth: { user, pass },
  });
  return cachedTransport;
}

/**
 * Sends one of the templates from emailTemplates.js. Resolves either way -
 * callers treat mail as best-effort and should not await it on a critical
 * path.
 */
export async function sendMail(recipient, mail) {
  const transport = getTransport();
  if (!transport || !recipient) return { status: 'skipped' };

  const from = process.env.SMTP_USER_EMAIL || process.env.SMTP_USERNAME;
  try {
    await transport.sendMail({
      from: `${BRAND_NAME} <${from}>`,
      to: recipient,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return { status: 'success' };
  } catch (err) {
    console.log('mailer: send failed:', err?.message || err);
    return { status: 'error' };
  }
}
