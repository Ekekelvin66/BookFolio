import { db } from '../config/db.js';
import jwt from 'jsonwebtoken' 
import { asyncHandler } from '../utils/asyncHandler.js';
import { getUserReviews } from '../utils/getUserReviews.js';
import { uploadAvatar,deleteImage } from '../config/cloudinary.js';
import { generateToken } from './authController.js';


export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [userResult, reviewsList, statsResult, preferencesResult] = await Promise.all([
    db.query(
      `SELECT id, name, username, email, bio,image_url,avatar_color, onboarding_complete, created_at, yearly_goal
       FROM users WHERE id = $1`,
      [userId]
    ),
    getUserReviews(userId, 100),
    db.query(`
      SELECT
        (SELECT COUNT(*) FROM reviews WHERE user_id = $1) AS total_reviews,
        (SELECT COUNT(DISTINCT book_id) FROM user_shelves WHERE user_id = $1 AND status = 'completed') AS books_finished,
        (SELECT COALESCE(SUM(b.page_count),0) FROM user_shelves us JOIN books b ON b.id = us.book_id WHERE us.user_id = $1 AND us.status = 'completed') AS total_pages_read,
        (SELECT COUNT(*) FROM review_likes rl JOIN reviews r ON r.id = rl.review_id WHERE r.user_id = $1) AS total_likes,
        (SELECT COUNT(DISTINCT book_id) FROM user_shelves WHERE user_id = $1 AND status = 'reading') AS total_reading,
        (SELECT COUNT(DISTINCT book_id) FROM user_shelves WHERE user_id = $1 AND status = 'want_to_read') AS total_want_to_read
      `, [userId]),
    db.query(`
      SELECT genres.id, genres.name FROM user_preferences
      JOIN genres ON genres.id = user_preferences.genre_id
      WHERE user_preferences.user_id = $1
    `, [userId]),
  ]);
  const reviews = reviewsList || [];

  const s = statsResult.rows[0] || {};
  res.json({
    user: userResult.rows[0],
    stats: {
      booksFinished: Number(s.books_finished || 0),
      totalPagesRead: Number(s.total_pages_read || 0),
      reviews: Number(s.total_reviews || 0),
      totalLikes: Number(s.total_likes || 0),
      totalReading: Number(s.total_reading || 0),
      totalWantToRead: Number(s.total_want_to_read || 0),
    },
    reviews,
    preferences: preferencesResult.rows,
  });
});

export const getPublicProfile = asyncHandler(async (req, res) => {
  const targetId = parseInt(req.params.userId, 10);
  if (Number.isNaN(targetId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  
  const userResult = await db.query(
    `SELECT id, name, username, bio, avatar_color,image_url, created_at FROM users WHERE id = $1`,
    [targetId]
  );
  if (userResult.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
const[statsResult,reviewsList]=await Promise.all([

  db.query(`
    SELECT
      (SELECT COUNT(*) FROM reviews WHERE user_id = $1) AS total_reviews,
      (SELECT COUNT(DISTINCT book_id) FROM user_shelves WHERE user_id = $1 AND status = 'completed') AS books_finished,
      (SELECT COALESCE(SUM(b.page_count),0) FROM user_shelves us JOIN books b ON b.id = us.book_id WHERE us.user_id = $1 AND us.status = 'completed') AS total_pages_read,
      (SELECT COUNT(*) FROM review_likes rl JOIN reviews r ON r.id = rl.review_id WHERE r.user_id = $1) AS total_likes
    `, [targetId]),

     getUserReviews(targetId, 40),
])
   
  const s = statsResult.rows[0] || {};

  const reviews=reviewsList || []


  res.json({
    user: userResult.rows[0],
    stats: {
      booksFinished: Number(s.books_finished || 0),
      totalPagesRead: Number(s.total_pages_read || 0),
      reviews: Number(s.total_reviews || 0),
      totalLikes: Number(s.total_likes || 0),
    },
    reviews,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name,username,bio, avatar_color } = req.body;


  if (username) {
    const existing = await db.query(
      `SELECT id FROM users WHERE username = $1 AND id != $2`,
      [username, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }
  }

  let uploadedImageUrl = null;
  let uploadedImagePublicId = null;

  if (req.file) {
    uploadedImageUrl = req.file.path;
    uploadedImagePublicId = req.file.filename;

    const oldImageQuery = await db.query(
      `SELECT image_public_id FROM users WHERE id = $1`, 
      [userId]
    );
    const oldPublicId = oldImageQuery.rows[0]?.image_public_id;

    if (oldPublicId) {
      await deleteImage(oldPublicId);
    }
  }
  const result = await db.query(
    `UPDATE users SET 
    bio = COALESCE($1,bio), 
    avatar_color = COALESCE($2,avatar_color),
    name =COALESCE($3,name),
    username=COALESCE($4,username),
    image_url = COALESCE($5, image_url),
    image_public_id = COALESCE($6, image_public_id)
     WHERE id = $7 RETURNING *`,
    [bio??null, avatar_color??null,name??null,username??null,uploadedImageUrl, 
      uploadedImagePublicId,userId]
  );


  const freshUser = result.rows[0]
  const newToken = generateToken(freshUser)

  res.json({ user: freshUser, token: newToken })
});

export const removeAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id

  const existing = await db.query(
    `SELECT image_public_id FROM users WHERE id = $1`,
    [userId]
  )

  const publicId = existing.rows[0]?.image_public_id
  if (publicId) {
    await deleteImage(publicId)
  }

  const result = await db.query(
    `UPDATE users SET image_url = NULL, image_public_id = NULL
     WHERE id = $1 RETURNING *`,
    [userId]
  )

  const freshUser = result.rows[0]
  const newToken = generateToken(freshUser)

  res.json({ user: freshUser, token: newToken })
})

export const savePreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { genres } = req.body;

  await db.query(`DELETE FROM user_preferences WHERE user_id = $1`, [userId]);

  for (const genreId of genres) {
    await db.query(
      `INSERT INTO user_preferences (user_id, genre_id) VALUES ($1,$2)`,
      [userId, genreId]
    );
  }

  await db.query(
    `UPDATE users SET onboarding_complete = true WHERE id = $1`, [userId]
  );

  const userResult = await db.query(`
    SELECT * FROM users WHERE id=$1
 `,[userId])

 const freshUser=userResult.rows[0]
 const newToken =generateToken(freshUser)

  res.json({ message: 'Preferences saved', onboarding_complete: true , token:newToken});
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { genres } = req.body;

  await db.query(`DELETE FROM user_preferences WHERE user_id = $1`, [userId]);

  for (const genreId of genres) {
    await db.query(
      `INSERT INTO user_preferences (user_id, genre_id) VALUES ($1,$2)`,
      [userId, genreId]
    );
  }

  res.json({ message: 'Preferences updated' });
});

export const getPreferences = asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT genres.id, genres.name FROM user_preferences
    JOIN genres ON genres.id = user_preferences.genre_id
    WHERE user_preferences.user_id = $1
  `, [req.user.id]);

  res.json({ preferences: result.rows });
});

export const setReadingGoal = asyncHandler(async (req, res) => {
  const { yearly_goal } = req.body;
  const userId = req.user.id;

  const goal = parseInt(yearly_goal);
  if (goal > 0) {
    await db.query(
      `UPDATE users SET yearly_goal = $1 WHERE id = $2`,
      [goal, userId]
    );
    res.json({ message: 'Reading goal set', yearly_goal });
  } else {
    res.status(400).json({ error: 'Yearly goal must be greater than 0' });
  }
});

