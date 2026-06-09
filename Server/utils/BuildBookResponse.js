import { db } from "../config/db.js"
export const buildBookResponse = async (book, bookId, userId) => {
  const reviewResult = await db.query(`
  SELECT
    reviews.id,
    reviews.review,
    reviews.rating,
    reviews.book_id,
    reviews.recommendation,
    reviews.date_read,
    reviews.created_at,
    reviews.user_id,
    users.name AS reviewer_name,
    users.avatar_color,
    users.image_url,
    COUNT(DISTINCT review_comments.id) AS reply_count,
    COUNT(DISTINCT rh.id) AS helpful_count,
    CASE WHEN hl.user_id IS NOT NULL THEN true ELSE false END AS is_helpful,
    COUNT(DISTINCT rl.id) AS like_count,
    CASE WHEN lk.user_id IS NOT NULL THEN true ELSE false END AS is_liked
  FROM reviews
  JOIN users ON users.id = reviews.user_id
  LEFT JOIN review_comments ON review_comments.review_id = reviews.id
  LEFT JOIN review_helpful rh ON rh.review_id = reviews.id
  LEFT JOIN review_helpful hl ON hl.review_id = reviews.id AND hl.user_id = $2
  LEFT JOIN review_likes rl ON rl.review_id=reviews.id AND rl.user_id=$2
  LEFT JOIN review_likes lk ON lk.review_id=reviews.id and lk.user_id=$2
  WHERE reviews.book_id = $1
  GROUP BY reviews.id, users.name, users.avatar_color,users.image_url, hl.user_id,rl.user_id,lk.user_id
  ORDER BY reviews.created_at DESC
`, [bookId, userId]
  )

  const reviews = reviewResult.rows.map((r)=>({
    id: r.id,
    review: r.review,
    user_id:parseInt(r.user_id),
    rating: r.rating,
    recommendation: r.recommendation,
    date_read: r.date_read,
    created_at: r.created_at,
    book_id:r.book_id,
    reviewer_name: r.reviewer_name,
    avatar_color: r.avatar_color,
    image_url:r.image_url,
    reply_count: parseInt(r.reply_count),
    helpful_count: parseInt(r.helpful_count),
    is_helpful: r.is_helpful,
    like_count:parseInt(r.like_count),
    is_liked:r.is_liked
  }))
  const userReview = userId ? reviews.find(r => parseInt(r.user_id) === parseInt(userId))??null : null

  const shelfResult = userId
  ? await db.query(
    `SELECT status FROM user_shelves WHERE book_id = $1 AND user_id = $2`,
    [bookId, userId]
)
:{rows:[]}
  const shelfStatus = shelfResult.rows[0]?.status ?? null
  
  const normalizedBook = {
    id: book.id,
    googleBooksId: book.google_id,
    title: book.title,
    author: book.author,
    cover_url: book.cover_url,
    description: book.description,
    genres: book.genres ?? [],
    page_count: book.page_count,
    average_rating: book.average_rating,
    ratings_count: book.ratings_count,
    preview_link: book.preview_link,
  }

  

return { book: normalizedBook, reviews, userReview, shelfStatus, source: 'database' }


}