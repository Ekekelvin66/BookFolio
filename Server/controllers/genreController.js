import { db } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { searchBooks as searchGoogleBooks } from '../services/googleBookCache.js';
import { matchGenre } from '../utils/genreMatcher.js';


let cachedGenres = null;
let lastCacheTime = 0;
const GENRE_CACHE_TTL = 60 * 60 * 1000; 

const getValidGenres = async () => {
  if (cachedGenres && Date.now() - lastCacheTime < GENRE_CACHE_TTL) {
    return cachedGenres;
  }
  const { rows } = await db.query(`SELECT name FROM genres`);
  cachedGenres = rows.map(r => r.name);
  lastCacheTime = Date.now();
  return cachedGenres;
};

export const getGenres = asyncHandler(async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM genres ORDER BY name`)
  res.json({ genres: rows })
})

const PAGE_SIZE = 10

export const getGenre = asyncHandler(async (req, res) => {
  const { genreName } = req.params
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE

  const genreResult = await db.query(`SELECT * FROM genres WHERE name ILIKE $1`, [genreName])
  if (genreResult.rows.length === 0) {
    return res.status(404).json({ error: 'Genre not found' })
  }
  const genre = genreResult.rows[0]

  const countResult = await db.query(`
    SELECT COUNT(DISTINCT books.id) AS total
    FROM books
    JOIN book_genres ON book_genres.book_id = books.id
    WHERE book_genres.genre_id = $1
  `, [genre.id])
  const dbCount = parseInt(countResult.rows[0].total)

  const dbStart = Math.max(start, 0)
  const dbEnd = Math.min(end, dbCount)
  let dbBooks = []

  if (dbStart < dbEnd) {
    const booksResult = await db.query(`
      SELECT books.id, books.title, books.author, books.cover_url, books.description,
        ROUND(AVG(reviews.rating), 1) AS avg_rating,
        COUNT(reviews.id) AS review_count
      FROM books
      JOIN book_genres ON book_genres.book_id = books.id
      LEFT JOIN reviews ON reviews.book_id = books.id
      WHERE book_genres.genre_id = $1
      GROUP BY books.id
      ORDER BY avg_rating DESC NULLS LAST, review_count DESC
      LIMIT $2 OFFSET $3
    `, [genre.id, dbEnd - dbStart, dbStart])
    dbBooks = booksResult.rows.map((b) => ({ ...b, source: 'library' }))
  }

  const apiNeeded = PAGE_SIZE - dbBooks.length
  let apiBooks = []
  if (apiNeeded > 0) {
    const apiStartIndex = Math.max(start - dbCount, 0)
    const validGenres = await getValidGenres()
    const apiResults = await searchGoogleBooks('', genreName, apiStartIndex, apiNeeded)
    apiBooks = apiResults.map((b) => ({
      ...b,
      source: 'api',
      genre: matchGenre(b.genre, genreName, validGenres),
    }))
  }

  const books = [...dbBooks, ...apiBooks]
  res.json({ genre, books, page, hasMore: books.length === PAGE_SIZE })
})


