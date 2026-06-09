import { db } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notifyClubsOfReview } from "./bookClubController.js";
import { getGoogleBookById } from "../services/googleBooks.js";


export const addReview = asyncHandler(async (req, res) => {
  const { review, recommendation, rating, date_read } = req.body;
  const { bookId } = req.params;
  const user_id = req.user.id;

  let localBookId;

  if (!isNaN(bookId)) {
    const existing = await db.query(
      `SELECT id FROM books WHERE id = $1`, [bookId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    localBookId = parseInt(bookId);

  } else {
    const existing = await db.query(
      `SELECT id FROM books WHERE google_id = $1`, [bookId]
    );

    if (existing.rows.length > 0) {
      localBookId = existing.rows[0].id;

    } else {
      const googleBook = await getGoogleBookById(bookId);
      if (!googleBook) {
        return res.status(404).json({ error: 'Book not found on Google Books' });
      }

      const inserted = await db.query(
        `INSERT INTO books 
          (google_id, title, author, cover_url, description,
           preview_link, average_rating, ratings_count, page_count,publish_year,publish_date,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
         RETURNING id`,
        [
          bookId,
          googleBook.title,
          googleBook.author,
          googleBook.cover ?? googleBook.cover_url,
          googleBook.description,
          googleBook.previewLink,
          googleBook.globalRating,
          googleBook.globalRatingsCount,
          googleBook.pageCount,
          googleBook.publish_year,
          googleBook.publish_date,
        ]
      );
      localBookId = inserted.rows[0].id;
      
     
      const allGenres = await db.query(`SELECT id, name FROM genres`);
      for (const cat of googleBook.genre) {
          const match = allGenres.rows.find(g => cat.toLowerCase().includes(g.name.toLowerCase()));
          if (match) {
              await db.query(
                  `INSERT INTO book_genres (book_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                  [localBookId, match.id]
              );
          }
      }
    }
  }
  const result = await db.query(
    `INSERT INTO reviews 
      (review, rating, recommendation, date_read, created_at, book_id, user_id)
     VALUES ($1,$2,$3,$4::date,NOW(),$5,$6)
     RETURNING *`,
    [review, rating, recommendation, date_read, localBookId, user_id]
  );

  const reviewId = result.rows[0].id;
  await notifyClubsOfReview(user_id, reviewId);

  res.status(201).json({ message: 'Review added successfully', review: result.rows[0] });
});

export const editReview = asyncHandler(async (req, res) => {
  const { review, recommendation, rating } = req.body;
  const { reviewId } = req.params;
  const userId = req.user.id;

  const check = await db.query(
    `SELECT id, created_at FROM reviews WHERE id = $1 AND user_id = $2`,
    [reviewId, userId]
  )

  if (check.rows.length === 0) {
    return res.status(404).json({ error: 'Review not found' })
  }

  const daysSincePost = (Date.now() - new Date(check.rows[0].created_at)) / (1000 * 60 * 60 * 24);

if (daysSincePost > 7) {
  return res.status(403).json({ 
    error: 'Reviews can only be edited within 7 days of posting' 
  });
}

  await db.query(
    `UPDATE reviews
     SET rating = COALESCE($1, rating), 
         review = COALESCE($2, review), 
         recommendation = COALESCE($3, recommendation), 
         updated_at = NOW()
     WHERE id = $4 AND user_id = $5`,
    [rating ?? null, review ?? null, recommendation ?? null, reviewId, userId]
  );

  res.status(200).json({ message: 'Review edited successfully' });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  const deletedResult = await db.query(
    `DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *`,
    [reviewId, userId]
  );

  if (deletedResult.rows.length === 0) {
    return res.status(404).json({ error: 'Your review not found' });
  }

  await db.query(
    `DELETE FROM notifications WHERE entity_id = $1 AND entity_type IN ('review_like', 'review_comment')`,
    [reviewId]
  );

  res.status(200).json({ message: 'Review deleted successfully' });
});


export const toggleHelpful = asyncHandler(async (req, res) => {
  const { reviewId } = req.params
  const userId = req.user.id

  const reviewResult = await db.query(
    `SELECT user_id FROM reviews WHERE id = $1`,
    [reviewId]
  )

  if (reviewResult.rows.length === 0) {
    return res.status(404).json({ error: 'Review not found' })
  }

  if (reviewResult.rows[0].user_id === userId) {
    return res.status(400).json({ error: 'Cannot mark your own review as helpful' })
  }

  const existing = await db.query(
    `SELECT id FROM review_helpful WHERE review_id = $1 AND user_id = $2`,
    [reviewId, userId]
  )

  let isHelpful = false

  if (existing.rows.length > 0) {
    await db.query(
      `DELETE FROM review_helpful WHERE review_id = $1 AND user_id = $2`,
      [reviewId, userId]
    )
    isHelpful = false
  } else {
    await db.query(
      `INSERT INTO review_helpful (review_id, user_id) VALUES ($1, $2)`,
      [reviewId, userId]
    )
    isHelpful = true
  }

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS helpful_count FROM review_helpful WHERE review_id = $1`,
    [reviewId]
  )
  
  const helpfulCount = countResult.rows[0].helpful_count

  res.status(200).json({ 
    message: isHelpful ? 'Marked as helpful' : 'Removed helpful', 
    helpful: isHelpful,
    helpful_count: helpfulCount 
  })
})