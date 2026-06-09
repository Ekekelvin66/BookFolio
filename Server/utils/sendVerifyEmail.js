
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Use the 16-character App Password
  },
  tls: {
    rejectUnauthorized: false
  }
});
export async function sendVerifyEmail(toEmail, token) {
  const verifyLink = `${process.env.VITE_URL}/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: `"BookFolio" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Email Verification",
    html: `
      <p>Click the link below to verify your email.</p>
      <p><a href="${verifyLink}" style="color:#1B2A4A;font-weight:600">${verifyLink}</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  });
}