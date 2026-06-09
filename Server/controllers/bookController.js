import { db } from '../config/db.js';
import { searchBooks as searchGoogleBooks } from '../services/googleBookCache.js';
import {professionalTitleCase} from '../utils/formatter.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getGoogleBookById } from '../services/googleBooks.js';
import { buildBookResponse } from '../utils/BuildBookResponse.js';
import { matchGenre } from '../utils/genreMatcher.js';

export const searchBooks = asyncHandler(async (req, res) => {
  const { query, genre } = req.query;

  const dbResult = await db.query(
     `SELECT DISTINCT books.* 
      FROM books
      LEFT JOIN book_genres ON book_genres.book_id = books.id
      LEFT JOIN genres ON genres.id = book_genres.genre_id
      WHERE 
      (books.title ILIKE $1 OR books.author ILIKE $1)
      AND ($2::text IS NULL OR genres.name ILIKE $2)`,
    [`%${query}%`, genre ?? null]
  );

  if (dbResult.rows.length >0 ) {
    return res.json({source:'database',books:dbResult.rows})
  }

  const apiResults = await searchGoogleBooks(query, genre);
  res.json({ source: 'api', books: apiResults });
});

export const searchMoreBooks = asyncHandler(async (req, res) => {
  const { query, genre, startIndex, exclude } = req.query
  const start = parseInt(startIndex) || 0
  const excludeIds = exclude
    ? new Set(exclude.split(',').filter(Boolean))
    : new Set()

  const books = await searchGoogleBooks(query ?? '', genre ?? '', start)
  const fresh = books.filter((b) => !excludeIds.has(b.googleBooksId))
  res.json({ books: fresh })
})

export const getAllBooks = asyncHandler(async (req, res) => {
  let apiResults = [];

  const sort = req.query.sort || 'recent';
  const genre = req.query.genre || '';
  const search = req.query.search || '';

  const sortOptions = {
    recent: 'books.created_at DESC',
    highest_rated: 'avg_rating DESC NULLS LAST',
    most_reviewed: 'review_count DESC NULLS LAST',
  };
  const orderBy = sortOptions[sort] || 'books.created_at DESC';

  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(books.title ILIKE $${values.length} OR books.author ILIKE $${values.length})`
    );
  }

  if (genre) {
    const genreRow = await db.query(
      `SELECT id FROM genres WHERE name ILIKE $1`,
      [genre]
    );
    if (genreRow.rows.length > 0) {
      values.push(genreRow.rows[0].id);
      conditions.push(`book_genres.genre_id = $${values.length}`);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await db.query(
    `SELECT books.id, books.title, books.author, books.cover_url, books.created_at,
     ROUND(AVG(reviews.rating),1) AS avg_rating,
     COUNT(reviews.id) AS review_count
     FROM books
     LEFT JOIN reviews ON books.id = reviews.book_id
     LEFT JOIN book_genres ON books.id = book_genres.book_id
     LEFT JOIN genres ON genres.id = book_genres.genre_id
     ${whereClause}
     GROUP BY books.id
     ORDER BY ${orderBy}`,
    values
  );

  if (result.rows.length === 0 && search) {
    apiResults = await searchGoogleBooks(search);
  } else if (genre && genre !== 'All') {
    apiResults = await searchGoogleBooks(search, genre);
  }

  const genresResult = await db.query('SELECT * FROM genres ORDER BY name');
  const allowedGenres = genresResult.rows.map(g => g.name);

  const processedDiscovery = apiResults.map(book => ({
    ...book,
    genre: matchGenre(book.genre, genre, allowedGenres)
  }));

  res.json({
    books: result.rows,
    discovery: processedDiscovery,
    genres: genresResult.rows,
    sort,
    search,
    selectedGenre: genre,
  });
});


export const getBook = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
   const userId =req.user?.id ?? null;
    if(!isNaN(bookId)){
      const bookResult = await db.query(
        `SELECT books.id,books.google_id, books.title, books.author, books.cover_url,
        books.description, books.preview_link, books.average_rating,
        books.ratings_count, books.created_at,books.publish_year,books.publish_date,
        ARRAY_AGG(DISTINCT genres.name) AS genres,
        ROUND(AVG(reviews.rating),1) AS avg_rating,
        COUNT(reviews.id) AS review_count
        FROM books
        LEFT JOIN book_genres ON books.id = book_genres.book_id
        LEFT JOIN genres ON genres.id = book_genres.genre_id
        LEFT JOIN reviews ON books.id = reviews.book_id
        WHERE books.id = $1
        GROUP BY books.id`,
        [bookId]
    );
    if (bookResult.rows[0]) {
      return res.json(await buildBookResponse(bookResult.rows[0], parseInt(bookId),userId))
    }
}

 const byGoogleId = await db.query(
    `SELECT books.id, books.google_id, books.title, books.author,
     books.cover_url, books.description, books.preview_link,
     books.average_rating, books.ratings_count, books.page_count,
     books.publish_year,books.publish_date,
     ARRAY_AGG(DISTINCT genres.name) AS genres,
     ROUND(AVG(reviews.rating),1) AS avg_rating,
     COUNT(reviews.id) AS review_count
     FROM books
     LEFT JOIN book_genres ON books.id = book_genres.book_id
     LEFT JOIN genres ON genres.id = book_genres.genre_id
     LEFT JOIN reviews ON books.id = reviews.book_id
     WHERE books.google_id = $1
     GROUP BY books.id`,
    [bookId]
  )

  if (byGoogleId.rows[0]) {
    return res.json(await buildBookResponse(byGoogleId.rows[0], byGoogleId.rows[0].id, userId))
  }
  const googleBook = await getGoogleBookById(bookId)
  if (!googleBook) return res.status(404).json({ error: 'Book not found' })
  const normalized = {
    id: null,
    googleBooksId: googleBook.googleBooksId,
    title: googleBook.title,
    author: googleBook.author,
    cover_url: googleBook.cover,
    description: googleBook.description,
    genres: googleBook.genre ? [googleBook.genre] : [],
    page_count: googleBook.pageCount,
    average_rating: googleBook.globalRating,
    ratings_count: googleBook.globalRatingsCount,
    preview_link: googleBook.previewLink,
    publish_date:googleBook.publish_date,
    publish_year:googleBook.publish_year
  }
  res.json({ book: normalized, reviews: [], userReview: null, source: 'api' })
});

export const addBook = asyncHandler(async (req, res) => {
  const {
    googleBooksId,
    title,
    author,
    cover,
    description,
    genre,
    previewLink,
    globalRating,
    globalRatingsCount,
    publish_date,publish_year,
    review,
    rating,
    recommendation,
    date_read,
    pageCount
  } = req.body;

  const existingBook = await db.query(
    `SELECT id FROM books WHERE google_id = $1`,
    [googleBooksId]
  );

  let bookId;

  if (existingBook.rows.length > 0) {
    bookId = existingBook.rows[0].id;
  } else {
    const bookResult = await db.query(
      `INSERT INTO books
        (google_id, title, author, cover_url, description, preview_link,
       average_rating, ratings_count,page_count,publish_year,publish_date,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
       RETURNING *`,
      [
        googleBooksId,
        professionalTitleCase(title.trim()),
        professionalTitleCase(author.trim()),
        cover,
        description,
        previewLink,
        globalRating,
        globalRatingsCount,
        pageCount,
        publish_year,
        publish_date
      ]
    );
    bookId = bookResult.rows[0].id;

    const genres = genre ? (Array.isArray(genre) ? genre : [genre]) : [];
    for (const genreId of genres) {
      await db.query(
        'INSERT INTO book_genres (book_id, genre_id) VALUES ($1,$2)',
        [bookId, genreId]
      );
    }
  }

  await db.query(
    `INSERT INTO reviews (review, rating, recommendation, date_read, book_id, user_id)
     VALUES ($1,$2,$3,$4::date,$5,$6)`,
    [review, rating, recommendation, date_read, bookId, req.user.id]
  );

  res.status(201).json({ message: 'Book added successfully', bookId });
});

