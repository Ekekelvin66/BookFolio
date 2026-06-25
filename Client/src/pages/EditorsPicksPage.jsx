import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, BookOpen, ArrowRight, Quote } from 'lucide-react'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'

const CRITERIA = [
  {
    label: 'Literary Merit',
    desc: 'Writing quality, originality, and lasting contribution to its genre.',
  },
  {
    label: 'Reader Impact',
    desc: 'Books that consistently resonate — reflected in community ratings and reviews.',
  },
  {
    label: 'Breadth of Voice',
    desc: 'A deliberate mix of authors, eras, and perspectives to represent diverse reading experiences.',
  },
]

const EditorsPicksPage = () => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/editors-picks')
      .then(res => setBooks(res.data.books ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner fullPage size="lg" />

  return (
    <div className="editors-picks">

      {/* Editorial Header */}
      <div className="editors-picks__hero">
        <p className="editors-picks__eyebrow">Curated Reading</p>
        <h1 className="editors-picks__title">Editor's Picks</h1>
        <p className="editors-picks__sub">
          Every book on this list was selected by the BookFolio team — not by an algorithm.
          We read, we debated, and we chose the titles we believe every serious reader should encounter.
        </p>
      </div>

      {/* Selection Philosophy */}
      <div className="editors-picks__philosophy">
        <div className="editors-picks__quote-wrap">
          <Quote size={32} className="editors-picks__quote-icon" />
          <blockquote className="editors-picks__quote">
            A great book doesn't just tell a story — it changes how you see the world
            after you've closed the cover. These are the books that did that for us.
          </blockquote>
          <p className="editors-picks__quote-attr">— The BookFolio Team</p>
        </div>

        <div className="editors-picks__criteria">
          <h2 className="editors-picks__criteria-title">How We Select</h2>
          <p className="editors-picks__criteria-intro">
            Our picks are updated periodically and reviewed as a team. No book is added 
            without deliberate consideration against three core criteria:
          </p>
          <div className="editors-picks__criteria-list">
            {CRITERIA.map((c, i) => (
              <div key={c.label} className="editors-picks__criterion">
                <span className="editors-picks__criterion-num">0{i + 1}</span>
                <div>
                  <p className="editors-picks__criterion-label">{c.label}</p>
                  <p className="editors-picks__criterion-desc">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="editors-picks__divider">
        <span>This Month's Selection</span>
      </div>

      {/* Book Grid */}
      <div className="editors-picks__grid">
        {books.map((book, i) => {
          const rating = book.community_rating ?? book.google_rating
          const reviewCount = Number(book.review_count)

          return (
            <div key={book.id} className="picks-card">
              <span className="picks-card__index">{String(i + 1).padStart(2, '0')}</span>

              <Link to={`/books/${book.id}`} className="picks-card__cover-wrap">
                {book.cover_url
                  ? <img src={book.cover_url} alt={book.title} className="picks-card__cover" />
                  : <div className="picks-card__cover-placeholder"><BookOpen size={32} /></div>
                }
              </Link>

              <div className="picks-card__body">
                <Link to={`/books/${book.id}`} className="picks-card__title">
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
                  {book.publish_year && (
                    <span className="picks-card__pill">{book.publish_year}</span>
                  )}
                  {book.page_count && (
                    <span className="picks-card__pill">{book.page_count} pages</span>
                  )}
                </div>

                <Link to={`/books/${book.id}`} className="picks-card__btn">
                  View Book <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div className="editors-picks__footer-note">
        <p>
            Our picks are reviewed and refreshed every month.
        </p>
      </div>

    </div>
  )
}

export default EditorsPicksPage