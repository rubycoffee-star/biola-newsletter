const nodemailer = require('nodemailer');

function getConfig() {
  const user = (process.env.GMAIL_USER || '').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  const to = (process.env.NEWSLETTER_TO || '').trim() || user;
  if (!user || !pass) {
    throw new Error('Missing GMAIL_USER or GMAIL_APP_PASSWORD in your .env file.');
  }
  return { user, pass, to };
}

async function sendNewsletter({ subject, html, text }) {
  const { user, pass, to } = getConfig();
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"The Daily Grind" <${user}>`,
      to,
      subject,
      html,
      text,
    });
  } catch (err) {
    if (err.code === 'EAUTH') {
      throw new Error('Gmail rejected the login. Double-check GMAIL_USER and that GMAIL_APP_PASSWORD is a 16-character App Password (not your normal password).');
    }
    throw err;
  }
  return to;
}

module.exports = { sendNewsletter };
