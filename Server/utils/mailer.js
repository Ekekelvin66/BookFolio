import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "BookFolio <no-reply@bookfolio.name.ng>";

export async function sendVerifyEmail(toEmail, code) {

  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "Verify your BookFolio email",
    html: `
      <p>Enter this code to verify your email</p>
      <h2 style="letter-spacing:8px;font-size:32px;color:#1B2A4A">${code}</h2>
      <p>This code expires in 1 hour.</p>
    `,
  });

  if (error) throw new Error(`Verification email failed: ${error.message}`);
}

export async function sendResetEmail(toEmail, code) { // ← renamed token → code
  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "Password reset request",
    html: `
      <p>You requested a password reset. Enter this code:</p>
      <h2 style="letter-spacing:8px;font-size:32px;color:#1B2A4A">${code}</h2>
      <p>This code expires in 1 hour.</p>
    `,
  });

  if (error) throw new Error(`Reset email failed: ${error.message}`);
}