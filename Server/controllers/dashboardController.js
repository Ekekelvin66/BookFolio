import { db } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const pagesResult = await db.query(`
    SELECT COALESCE(SUM(user_shelves.total_pages), 0) AS total_pages_read
    FROM user_shelves
    WHERE user_id = $1 AND status = 'completed'
  `, [userId]);

  const goalResult = await db.query(`
    SELECT
      users.yearly_goal,
      COUNT(DISTINCT CASE
        WHEN user_shelves.status = 'completed'
        AND EXTRACT(YEAR FROM user_shelves.added_at) = EXTRACT(YEAR FROM NOW())
        THEN user_shelves.book_id
      END) AS completed_this_year
    FROM users
    LEFT JOIN user_shelves ON user_shelves.user_id = users.id
    WHERE users.id = $1
    GROUP BY users.yearly_goal
  `, [userId]);

  const activeShelfResult = await db.query(`
    SELECT books.id, books.title, books.author, books.cover_url,
      books.preview_link, user_shelves.current_page,
      user_shelves.total_pages,
      CASE
        WHEN user_shelves.total_pages > 0
        THEN ROUND((user_shelves.current_page::decimal / user_shelves.total_pages) * 100)
        ELSE 0
      END AS progress
    FROM user_shelves
    JOIN books ON books.id = user_shelves.book_id
    WHERE user_shelves.user_id = $1 AND user_shelves.status = 'reading'
  `, [userId]);

  const commentsResult = await db.query(`
    SELECT COUNT(review_comments.id) AS total_comments
    FROM review_comments
    JOIN reviews ON reviews.id = review_comments.review_id
    WHERE reviews.user_id = $1
  `, [userId]);

  const likesResult = await db.query(`
    SELECT COUNT(review_likes.id) AS total_likes
    FROM review_likes
    JOIN reviews ON reviews.id = review_likes.review_id
    WHERE reviews.user_id = $1
  `, [userId]);

  const genreResult = await db.query(`
    SELECT genres.name,
      COUNT(*) AS book_count,
      ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 1) AS percentage
    FROM reviews
    JOIN books ON books.id = reviews.book_id
    JOIN book_genres ON book_genres.book_id = books.id
    JOIN genres ON genres.id = book_genres.genre_id
    WHERE reviews.user_id = $1
    GROUP BY genres.name
    ORDER BY book_count DESC
  `, [userId]);

  const reviewsResult = await db.query(`
    SELECT books.id AS book_id, books.title, books.author, books.cover_url,
      reviews.id AS review_id, reviews.review, reviews.rating, reviews.recommendation,
      reviews.date_read, reviews.created_at
    FROM reviews
    JOIN books ON books.id = reviews.book_id
    WHERE reviews.user_id = $1
    ORDER BY reviews.created_at DESC
  `, [userId]);

  res.json({
    stats: {
      totalPagesRead: pagesResult.rows[0].total_pages_read,
      yearlyGoal: goalResult.rows[0]?.yearly_goal || 0,
      completedThisYear: goalResult.rows[0]?.completed_this_year || 0,
      totalComments: commentsResult.rows[0].total_comments,
      totalLikes: likesResult.rows[0].total_likes,
      genreDiversity: genreResult.rows,
    },
    activeShelf: activeShelfResult.rows,
    reviews: reviewsResult.rows,
  });
});

export const getShelves = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await db.query(`
    SELECT books.id, books.title, books.author, books.cover_url,
      user_shelves.status, user_shelves.added_at,user_shelves.current_page, user_shelves.total_pages,
      CASE WHEN user_shelves.total_pages > 0
          THEN ROUND((user_shelves.current_page::decimal / user_shelves.total_pages) * 100)
          ELSE 0
        END AS progress,
      ROUND(AVG(reviews.rating),1) AS avg_rating
    FROM user_shelves
    JOIN books ON books.id = user_shelves.book_id
    LEFT JOIN reviews ON books.id = reviews.book_id
    WHERE user_shelves.user_id = $1
    GROUP BY books.id, user_shelves.status, user_shelves.added_at,user_shelves.current_page,user_shelves.total_pages
    ORDER BY user_shelves.added_at DESC
  `, [userId]);

  const shelves = {
    want_to_read: result.rows.filter(b => b.status === 'want_to_read'),
    reading: result.rows.filter(b => b.status === 'reading'),
    completed: result.rows.filter(b => b.status === 'completed'),
  };

  res.json({ shelves });
});

export const addToShelf = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    bookId,
    googleBooksId,
    title,
    author,
    cover,
    description,
    previewLink,
    globalRating,
    globalRatingsCount,
    status,
    pageCount,
    publishDate,
    publishYear
  } = req.body;

  let bookResult;
  if (bookId) {
    bookResult = await db.query(`SELECT id FROM books WHERE id = $1`, [bookId]);
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
  } else if (googleBooksId) {
    bookResult = await db.query(`SELECT id FROM books WHERE google_id = $1`, [googleBooksId]);
  } else {
    return res.status(400).json({ error: 'Missing book identifier' });
  }

  let shelfBookId;
  if (bookResult.rows.length === 0) {
    const newBook = await db.query(
      `INSERT INTO books
        (google_id, title, author, cover_url, description,
         preview_link, average_rating, ratings_count, page_count,publish_date,publish_year, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING id`,
      [googleBooksId, title, author, cover, description, previewLink, globalRating, globalRatingsCount, pageCount, publishDate,publishYear]
    );
    shelfBookId = newBook.rows[0].id;
  } else {
    shelfBookId = bookResult.rows[0].id;
  }

  await db.query(
    `INSERT INTO user_shelves (user_id, book_id, status, total_pages)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, book_id) DO UPDATE SET status = $3, total_pages = $4`,
    [userId, shelfBookId, status, pageCount || null]
  );

  res.status(201).json({ message: 'Added to shelf', bookId: shelfBookId });
});

export const updateShelfStatus = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  await db.query(
    `UPDATE user_shelves SET status = $1 WHERE user_id = $2 AND book_id = $3`,
    [status, userId, bookId]
  );

  res.json({ message: 'Shelf status updated' });
});

export const removeFromShelf = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const userId = req.user.id;

  await db.query(
    `DELETE FROM user_shelves WHERE user_id = $1 AND book_id = $2`,
    [userId, bookId]
  );

  res.json({ message: 'Removed from shelf' });
});

export const UpdateProgress = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const userId = req.user.id;
  const { current_page } = req.body;

  const result = await db.query(`
    UPDATE user_shelves
    SET current_page = $1
    WHERE book_id = $2 AND user_id = $3
    RETURNING current_page, total_pages
  `, [current_page, bookId, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Shelf entry not found' });
  }

  const { current_page: cp, total_pages: tp } = result.rows[0];
  const progress = tp > 0 ? Math.round((cp / tp) * 100) : 0;

  res.json({ current_page: cp, total_pages: tp, progress });
});
