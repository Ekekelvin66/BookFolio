import clsx from 'clsx'
import BookCard from '../book/BookCard'
import { Link } from 'react-router-dom'

const TOTAL_REVIEWS_NEEDED = 10

const BookStrip = ({ books = [] }) => (
  <div className="rec-section__strip">
    {books.slice(0,6).map((book) => (
      <BookCard key={book.googleBooksId ?? book.id} book={book} variant="minimal" />
    ))}
  </div>
)

const RecommendationSection = ({
  recommendationReady,
  reviewsUntilRecommendations = 0,
  personalised = [],
  recommendations = [],
  className,
}) => {
  return (
    <div className={clsx('rec-section', className)}>

      {!recommendationReady && (
        <div className="rec-section__prompt">
          <p className="rec-section__prompt-text">
            Review <strong>{reviewsUntilRecommendations}</strong> more{' '}
            {reviewsUntilRecommendations === 1 ? 'book' : 'books'} to unlock personalised recommendations
          </p>
          <div className="rec-section__prompt-bar">
            <div
              className="rec-section__prompt-fill"
              style={{
                width: `${((TOTAL_REVIEWS_NEEDED - reviewsUntilRecommendations) / TOTAL_REVIEWS_NEEDED) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {!recommendationReady && personalised.map((row) => (
        <div key={row.genre} className="rec-section__row">
          <p className="rec-section__label">{row.genre}</p>
          <BookStrip books={row.books} />
          <p className='rec-section__view-more'><Link className='rec-section__view-more-link' to={`/genres/${encodeURIComponent(row.genre)}`}>View More</Link></p> 
        </div>
      ))}

      {recommendationReady && recommendations.map((row) => (
        <div key={row.label} className="rec-section__row">
          <p className="rec-section__label">{row.label}</p>
          <BookStrip books={row.books} />
        </div>
      ))}

    </div>
  )
}

export default RecommendationSection