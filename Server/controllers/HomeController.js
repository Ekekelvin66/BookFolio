import { db } from '../config/db.js';
import { searchBooks } from '../services/googleBookCache.js';  
import { asyncHandler } from '../utils/asyncHandler.js';

const RECOMMENDATION_THRESHOLD = 10;


export const getGuestHomeEssential = asyncHandler(async (req, res) => {
  const communityBooks = await db.query(`
    SELECT books.id, books.title, books.author, books.cover_url,
      ROUND(AVG(reviews.rating),1) AS avg_rating,
      COUNT(reviews.id) AS review_count
    FROM books
    LEFT JOIN reviews ON books.id = reviews.book_id
    GROUP BY books.id
    ORDER BY COUNT(reviews.id) DESC, ROUND(AVG(reviews.rating), 1) DESC
    LIMIT 3
  `);

  res.json({
    communityBooks: communityBooks.rows,
  });
});

export const getGuestHomeExtended = asyncHandler(async (req, res) => {
  const genres = ['Fiction', 'Thriller', 'Horror', 'Romance', 'Science Fiction', 'Comedy','Education'];
  const randomGenre = genres[Math.floor(Math.random() * genres.length)];

  const [trendingBooks, bestsellers] = await Promise.all([
      searchBooks('', randomGenre),
      searchBooks('', 'bestsellers')
  ]);

  res.json({
    trendingBooks,
    trendingGenre: randomGenre,
    bestsellers,
  });
});

export const getAuthHomeEssential = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const [currentlyReadingResult, userGenresResult, myClubsResult] = await Promise.all([
    db.query(`
      SELECT books.id, books.title, books.author, books.cover_url,
        books.preview_link, user_shelves.current_page, user_shelves.total_pages,
        CASE WHEN user_shelves.total_pages > 0
          THEN ROUND((user_shelves.current_page::decimal / user_shelves.total_pages) * 100)
          ELSE 0
        END AS progress
      FROM user_shelves
      JOIN books ON books.id = user_shelves.book_id
      WHERE user_shelves.user_id = $1 AND user_shelves.status = 'reading'
    `, [userId]),
    db.query(`
      SELECT genres.name FROM user_preferences
      JOIN genres ON genres.id = user_preferences.genre_id
      WHERE user_preferences.user_id = $1
    `, [userId]),
    db.query(`
      SELECT 
        bc.id,
        bc.name,
        bc.cover_url,
        bc.genre,
        cm.role,
        COUNT (DISTINCT cm_all.user_id) AS member_count,
        (
          SELECT COUNT(*) FROM club_messages
          WHERE club_id = bc.id
            AND sender_id != $1
            AND is_read = FALSE
        ) AS unread_count,
        b.title as current_book_title
      FROM club_members cm
      JOIN book_clubs bc ON bc.id = cm.club_id
      LEFT JOIN club_members cm_all ON cm_all.club_id = bc.id
      LEFT JOIN club_reading_list crl ON crl.club_id = bc.id AND crl.is_current = TRUE
      LEFT JOIN books b ON b.id = crl.book_id
      WHERE cm.user_id = $1
      GROUP BY bc.id, cm.role, bc.name, bc.cover_url, bc.genre, b.title, bc.created_at
      ORDER BY bc.created_at DESC
      LIMIT 4
    `, [userId]),
  ]);

  res.json({
    currentlyReading: currentlyReadingResult.rows,
    userGenres: userGenresResult.rows.map(g => g.name),
    myClubs: myClubsResult.rows,
  });
});

export const getAuthHomeExtended = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [reviewCountResult, communityFeedResult] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total FROM reviews WHERE user_id = $1`, [userId]),
    db.query(`
      SELECT books.id AS book_id, books.title, books.author, books.cover_url,
        reviews.review, reviews.rating, reviews.created_at,
        users.name AS reviewer_name, users.image_url AS reviewer_image,users.id AS reviewer_id
      FROM reviews
      JOIN books ON books.id = reviews.book_id
      JOIN users ON users.id = reviews.user_id
      WHERE reviews.user_id != $1
      ORDER BY reviews.created_at DESC
      LIMIT 10
    `, [userId]),
  ]);

  const totalReviews      = parseInt(reviewCountResult.rows[0].total);
  const userGenresResult = await db.query(`
      SELECT genres.name FROM user_preferences
      JOIN genres ON genres.id = user_preferences.genre_id
      WHERE user_preferences.user_id = $1
    `, [userId]);
  const userGenres = userGenresResult.rows.map(g => g.name);
  const recommendationReady = totalReviews >= RECOMMENDATION_THRESHOLD;

  if (!recommendationReady) {
    const personalised = await Promise.all(
      userGenres.slice(0, 4).map(async (genreName) => {
        const books = await searchBooks('', genreName);
        return { genre: genreName, books };
      })
    );

    return res.json({
      personalised,
      recommendations:           [],
      communityFeed:             communityFeedResult.rows,
      recommendationReady:       false,
      reviewsUntilRecommendations: RECOMMENDATION_THRESHOLD - totalReviews,
    });
  }

  const [genrePattern, authorPattern] = await Promise.all([
    db.query(`
      SELECT genres.name, COUNT(*) AS frequency,
        ROUND(AVG(reviews.rating), 1) AS avg_rating
      FROM reviews
      JOIN books ON books.id = reviews.book_id
      JOIN book_genres ON book_genres.book_id = books.id
      JOIN genres ON genres.id = book_genres.genre_id
      WHERE reviews.user_id = $1 AND reviews.rating >= 4
      GROUP BY genres.name
      ORDER BY frequency DESC, avg_rating DESC
      LIMIT 3
    `, [userId]),

    db.query(`
      SELECT books.author, COUNT(*) AS frequency,
        ROUND(AVG(reviews.rating), 1) AS avg_rating
      FROM reviews
      JOIN books ON books.id = reviews.book_id
      WHERE reviews.user_id = $1 AND reviews.rating >= 4
      GROUP BY books.author
      ORDER BY frequency DESC, avg_rating DESC
      LIMIT 3
    `, [userId]),
  ]);

  const [genreRows, authorRows] = await Promise.all([
    Promise.all(genrePattern.rows.map(async (g) => {
      const books = await searchBooks('', g.name);
      return { label: `Because you love ${g.name}`, type: 'genre', books };
    })),
    Promise.all(authorPattern.rows.map(async (a) => {
      const books = await searchBooks(`inauthor:${a.author}`, '');
      return { label: `More by ${a.author}`, type: 'author', books };
    }))
  ]);

  res.json({
    recommendations:         [...genreRows, ...authorRows],
    communityFeed:           communityFeedResult.rows,
    recommendationReady:     true,
    reviewsUntilRecommendations: 0,
  });
});
