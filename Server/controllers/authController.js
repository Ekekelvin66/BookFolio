import bcrypt from "bcrypt";
import { db } from "../config/db.js";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendResetEmail } from "../utils/sendResetEmail.js";
import { sendVerifyEmail } from "../utils/sendVerifyEmail.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const SaltRounds = 10;

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name,username:user.username, is_admin:user.is_admin, avatar_color:user.avatar_color,image_url:user.image_url, onboarding_complete:user.onboarding_complete },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};


export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.json({ error: 'All fields must be filled' });
  if (password.length < 8) return res.json({ error: 'Password must be at least 8 characters' });

  const result = await db.query("SELECT id from users WHERE email = $1", [email.toLowerCase().trim()]);
  if (result.rows.length > 0) {
    return res.status(400).json({ error: "An account with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, SaltRounds);
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000);

  await db.query(
    "INSERT INTO users (name, email, passwordhash, is_verified, verific_token, verific_token_expiry, onboarding_complete) VALUES ($1, $2, $3, false, $4, $5, false)",
    [name.trim(), email.toLowerCase().trim(), hashedPassword, token, expiry]
  );

  await sendVerifyEmail(email, token);
  res.status(201).json({ message: 'Check your email for a verify link!' });
});


export const verifyUser = asyncHandler(async (req, res) => {
  const token = req.query.token;

  const result = await db.query(
    'SELECT * FROM users WHERE verific_token = $1 AND verific_token_expiry > NOW()',
    [token]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'This Link is invalid or expired' });
  }

  await db.query(
    'UPDATE users SET is_verified = TRUE, verific_token = NULL, verific_token_expiry = NULL WHERE verific_token = $1',
    [token]
  );

  res.status(200).json({ success: true, message: 'Email verified! You can now log in.' });
});


export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await db.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
  const user = result.rows[0];

  if (!user) {
    return res.status(404).json({ error: "No account found with that email." });
  }
  if (user.is_verified) {
    return res.status(400).json({ message: "Account already verified. Please login." });
  }

  const newToken = crypto.randomBytes(32).toString('hex');
  const newExpiry = new Date(Date.now() + 3600000);

  await db.query(
    "UPDATE users SET verific_token = $1, verific_token_expiry = $2 WHERE email = $3",
    [newToken, newExpiry, email.toLowerCase().trim()]
  );

  await sendVerifyEmail(email, newToken);
  res.json({ message: "A new link has been sent to your inbox!" });
});


export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = await db.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'User does not exist. Create account' });
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.passwordhash);

  if (!isMatch) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  if (!user.is_verified) {
    return res.json({
      error: "Your account is not verified yet. Please check your email or request a new link below.",
      email: user.email
    });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      is_admin: user.is_admin,
      username:user.username,
      avatar_color: user.avatar_color,
      image_url:user.image_url,
      onboarding_complete: user.onboarding_complete
    }
  });
});

export const logoutUser = (req, res) => {
  res.json({ message: 'Logout Successful' });
};

export const ForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const foundResult = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  if (foundResult.rows.length === 0) {
    return res.status(404).json({ error: 'User does not exist. Create account' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000);

  await db.query(
    'UPDATE users SET reset_token = $1, token_expiry = $2 WHERE email = $3',
    [token, expiry, email.toLowerCase()]
  );

  await sendResetEmail(email, token);
  res.status(200).json({ message: 'Check your email for a reset link!' });
});

 
export const setNewPassword = asyncHandler(async (req, res) => {
  const token = req.query.token;
  const { newPassword } = req.body;

  if (!newPassword) return res.status(400).json({ error: 'This field is required', token });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters', token });

  const result = await db.query(
    'SELECT * FROM users WHERE reset_token = $1 AND token_expiry > NOW()',
    [token]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Link is invalid.' });
  }

  const user = result.rows[0];
  const isSamePassword = await bcrypt.compare(newPassword, user.passwordhash);
  if (isSamePassword) {
    return res.status(400).json({ error: 'New password cannot be the same as your old password.', token });
  }

  const hashedPassword = await bcrypt.hash(newPassword, SaltRounds);
  await db.query(
    'UPDATE users SET passwordhash = $1, reset_token = NULL, token_expiry = NULL WHERE reset_token = $2',
    [hashedPassword, token]
  );

  res.json({ message: 'Password updated successfully! You can now log in.' });
});
