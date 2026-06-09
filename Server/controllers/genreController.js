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

export const getGenre = asyncHandler(async (req, res) => {
  const { genreName } = req.params

  const genreResult = await db.query(
    `SELECT * FROM genres WHERE name ILIKE $1`,
    [genreName]
  )

  if (genreResult.rows.length === 0) {
    return res.status(404).json({ error: 'Genre not found' })
  }

  const genre = genreResult.rows[0]

 
  const booksResult = await db.query(`
    SELECT
      books.id,
      books.title,
      books.author,
      books.cover_url,
      books.description,
      ROUND(AVG(reviews.rating), 1) AS avg_rating,
      COUNT(reviews.id)             AS review_count
    FROM books
    JOIN book_genres ON book_genres.book_id = books.id
    JOIN genres      ON genres.id = book_genres.genre_id
    LEFT JOIN reviews ON reviews.book_id = books.id
    WHERE genres.id = $1
    GROUP BY books.id
    ORDER BY avg_rating DESC NULLS LAST, review_count DESC
    LIMIT 20
  `, [genre.id])

  let discoveryBooks = []
  if (booksResult.rows.length <5 ) {
    const validGenres = await getValidGenres();
    discoveryBooks = await searchGoogleBooks('', genreName)
    discoveryBooks = discoveryBooks.map((b) => ({
      ...b,
      genre: matchGenre(b.genre, genreName, validGenres)
    }));
  }

  res.json({
    genre,
    books: booksResult.rows,
    discovery: discoveryBooks,
  })
})


export const getMoreGenreBooks = asyncHandler(async (req, res) => {
  const { genreName } = req.params
  const page = parseInt(req.query.page) || 1
  const startIndex = (page - 1) * 10
  const excludeIds = req.query.exclude
    ? new Set(req.query.exclude.split(',').filter(Boolean))
    : new Set()

  const validGenres = await getValidGenres();
  let books = await searchGoogleBooks('', genreName, startIndex)
  // Apply filtering
  books = books.map((b) => ({
      ...b,
      genre: matchGenre(b.genre, genreName, validGenres)
  }));
  
  const fresh = books.filter((b) => !excludeIds.has(b.googleBooksId))
  res.json({ books: fresh })
})


