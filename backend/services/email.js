import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// ✅ Verify right after creating transporter
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP Error:', error);
    } else {
      console.log('SMTP server is ready to take messages');
    }
  });
}

export const sendEmail = async (to, subject, text) => {
  if (!transporter) {
    // No email configuration provided; skip sending
    return;
  }
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };
  await transporter.sendMail(mailOptions);
};
