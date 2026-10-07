const nodemailer = require("nodemailer");

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getAppOrigin = () =>
  (process.env.APP_URL || process.env.ALLOWED_ORIGIN || "http://localhost:5173")
    .split(",")[0]
    .trim();

const getTransporter = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendPasswordResetEmail = async (to, rawToken) => {
  const resetUrl = `${getAppOrigin()}/reset-password?token=${rawToken}`;

  if (!isSmtpConfigured()) {
    return { sent: false, resetUrl };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your TaskFlow password",
    text: [
      "You requested a password reset for your TaskFlow account.",
      "",
      `Open this link to choose a new password (expires in 15 minutes):`,
      resetUrl,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <p>You requested a password reset for your TaskFlow account.</p>
      <p><a href="${resetUrl}">Reset your password</a> (expires in 15 minutes).</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });

  return { sent: true, resetUrl };
};

module.exports = { isSmtpConfigured, sendPasswordResetEmail, getAppOrigin };
