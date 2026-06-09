import { db } from '../config/db.js';

export const getUserReviews = async (userId, limit = 100) => {
  const res = await db.query(`
    SELECT r.id,
           r.rating,
           r.recommendation,
           r.review AS review,
           r.created_at,
           r.book_id,
           b.title,
           b.author,
           b.cover_url,
           COALESCE((SELECT COUNT(*) FROM review_likes rl WHERE rl.review_id = r.id), 0) AS helpful_count,
           COALESCE((SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id), 0) AS comment_count
    FROM reviews r
    JOIN books b ON b.id = r.book_id
    WHERE r.user_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2
  `, [userId, limit]);

  return res.rows.map((r) => ({
    id: r.id,
    title: r.title,
    author: r.author,
    cover_url: r.cover_url,
    rating: r.rating,
    review: r.review,
    review_text: r.review,
    helpful_count: Number(r.helpful_count || 0),
    comment_count: Number(r.comment_count || 0),
    created_at: r.created_at,
    book_id: r.book_id,
  }));
};
