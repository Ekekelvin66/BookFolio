import { db } from '../config/db.js';
import { getGoogleBookById } from '../services/googleBooks.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const backfillGenres = async () => {
  console.log("Starting genre backfill...");
  
  // 1. Get all valid genres
  const { rows: allGenres } = await db.query(`SELECT id, name FROM genres`);
  
  // 2. Get all books that have a google_id
  const { rows: books } = await db.query(`SELECT id, google_id FROM books WHERE google_id IS NOT NULL`);
  
  console.log(`Found ${books.length} books to process.`);

  for (const book of books) {
    try {
      console.log(`Processing book ID ${book.id} (${book.google_id})...`);
      
      // 3. Fetch fresh data from Google
      const googleBook = await getGoogleBookById(book.google_id);
      
      // Enforce a small delay to respect rate limits
      await delay(500); 

      if (!googleBook || !googleBook.genre || googleBook.genre.length === 0) {
          console.log(`No genres found for book ID ${book.id}. Skipping.`);
          continue;
      }
      
      // 4. Map and insert genres
      let count = 0;
      for (const cat of googleBook.genre) {
        const match = allGenres.find(g => cat.toLowerCase().includes(g.name.toLowerCase()));
        if (match) {
          await db.query(
            `INSERT INTO book_genres (book_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [book.id, match.id]
          );
          count++;
        }
      }
      console.log(`Successfully processed ${count} genres for book ID ${book.id}.`);
    } catch (err) {
      console.error(`Error processing book ${book.id}:`, err.message);
    }
  }
  console.log("Genre backfill completed.");
  process.exit(0);
};

backfillGenres();
