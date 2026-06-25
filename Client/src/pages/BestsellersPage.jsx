import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, BookOpen, ArrowRight, Quote } from 'lucide-react'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'

const BestsellersPage = () => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Assuming there's an endpoint to get all bestsellers
    api.get('/bestsellers')
      .then(res => setBooks(res.data.bestsellers ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner fullPage size="lg" />

  return (
    <div className="bestsellers-page">

      <div className="bestsellers-page__hero">
        <h1 className="bestsellers-page__title">Global Bestsellers</h1>
        <p className="bestsellers-page__sub">
          A definitive ranking of world literature, updated regularly to reflect
          the books shaping conversations globally.
        </p>
      </div>

      <div className="bestsellers-page__grid">
        {books.map((book, i) => {
          const rating = book.community_rating ?? book.google_rating
          const reviewCount = Number(book.review_count)

          return (
            <div key={book.googleBooksId ?? book.id} className="picks-card">
              <span className="picks-card__index">{String(i + 1).padStart(2, '0')}</span>

              <Link to={`/books/${book.googleBooksId ?? book.id}`} className="picks-card__cover-wrap">
                {book.cover_url ?? book.cover
                  ? <img src={book.cover_url ?? book.cover} alt={book.title} className="picks-card__cover" />
                  : <div className="picks-card__cover-placeholder"><BookOpen size={32} /></div>
                }
              </Link>

              <div className="picks-card__body">
                <Link to={`/books/${book.googleBooksId ?? book.id}`} className="picks-card__title">
                  {book.title}
                </Link>
                <p className="picks-card__author">{book.author}</p>

                <div className="picks-card__meta">
                  {rating && (
                    <span className="picks-card__rating">
                      <Star size={13} />
                      {Number(rating).toFixed(1)}
                      {reviewCount > 0 && (
                        <span className="picks-card__review-count">
                          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                        </span>
                      )}
                    </span>
                  )}
                  {book.genre && (
                    <span className="picks-card__pill">{book.genre}</span>
                  )}
                </div>

                <Link to={`/books/${book.googleBooksId ?? book.id}`} className="picks-card__btn">
                  View Book <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="bestsellers-page__footer-note">
        <p>
            Rankings are updated based on global sales data from the new york times and community engagement.
        </p>
      </div>

    </div>
  )
}

export default BestsellersPage
