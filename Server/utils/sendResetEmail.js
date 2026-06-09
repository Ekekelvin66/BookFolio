import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, 
  },
  tls: {
    rejectUnauthorized: false
  }
});
export async function sendResetEmail(toEmail, token) {
  const resetLink = `${process.env.VITE_URL}/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: `"BookFolio" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset Request",
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetLink}" style="color:#1B2A4A;font-weight:600">${resetLink}</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  });
}
