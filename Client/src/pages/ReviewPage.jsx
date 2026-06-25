import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useReviews } from '../hooks/useReviews'
import { useBooks } from '../hooks/useBooks'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import PageWrapper from '../components/layout/PageWrapper'
import StarRating from '../components/ui/StarRating'
import { ArrowLeft, Send, Info, ThumbsUp, ThumbsDown } from 'lucide-react'
import api from '../utils/api'

const SHELF_OPTIONS = [
  { value: 'completed', label: 'Finished' },
  { value: 'reading', label: 'Currently Reading' },
  { value: 'want_to_read', label: 'Want to Read' },
]

const ReviewPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const bookId = searchParams.get('bookId')

  
  const { addReview, loading } = useReviews()
  const { addToShelf } = useBooks()
  const { showToast } = useToast()

  const [book, setBook] = useState(null)
  const [bookLoading, setBookLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [recommend, setRecommend] = useState(null)
  const [addToShelfChecked, setAddToShelfChecked] = useState(false)
  const [shelfStatus, setShelfStatus] = useState('completed')
  const [reviewText, setReviewText] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) {
        setBookLoading(false)
        return
      }
      setBookLoading(true)
      try {
        const { data } = await api.get(`/books/${bookId}`)
        setBook(data.book)
      } catch {
        showToast('Failed to load book data', 'error')
      } finally {
        setBookLoading(false)
      }
    }
    fetchBook()
  }, [bookId])

  const validate = () => {
    const newErrors = {}
    if (!rating) newErrors.rating = 'Please select a rating'
    if (!reviewText.trim()) newErrors.reviewText = 'Review text is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const reviewData = {
      rating,
      recommendation: recommend,
      review: reviewText,
    }

    const result = await addReview(bookId, reviewData)

    if (result.success) {
      if (addToShelfChecked) {
        const shelfPayload = book?.id
          ? { bookId: book.id, status: shelfStatus }
          : {
              googleBooksId: book?.googleBooksId,
              title: book?.title,
              author: book?.author,
              cover: book?.cover_url,
              description: book?.description,
              previewLink: book?.preview_link,
              globalRating: book?.average_rating,
              globalRatingsCount: book?.ratings_count,
              pageCount: book?.page_count,
              status: shelfStatus,
            }

        const shelfResult = await addToShelf(shelfPayload)
        if (!shelfResult.success) {
          showToast(shelfResult.error, 'error')
        }
      }

      showToast('Review submitted!', 'success')
      navigate(`/books/${bookId}`)
    } else {
      
      showToast(result.error, 'error')
    }
  }

  if (bookLoading) return <Spinner fullPage size='lg' />
  if(!bookId) return(
    <PageWrapper>
        <p>No book selected. <Link to='/search'>Find a book to review</Link></p>
    </PageWrapper>
  )

  return (
    <PageWrapper className="review-page">
      <div className="review-page__container">
        <Link to={`/books/${bookId}`} className="review-page__back">
          <ArrowLeft size={14} /> Back to Book
        </Link>

        <div className="review-page__header">
          <h1 className="review-page__title">
            Reviewing <em className="review-page__book-title">{book?.title}</em>
          </h1>
          {book?.author && (
            <p className="review-page__subtitle">
              By {book.author} — Share your thoughts with the sanctuary of scholars.
            </p>
          )}
        </div>

        <form className="review-page__form" onSubmit={handleSubmit}>
          <div className="review-page__field">
            <label className="review-page__label">Scholar's Merit</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
            {errors.rating && <p className="review-page__error">{errors.rating}</p>}
          </div>

          <div className="review-page__row">
            <div className="review-page__field">
              <label className="review-page__label">Would You Recommend?</label>
              <div className="review-page__recommend">
                <button
                  type="button"
                  className={`review-page__recommend-btn ${recommend === true ? 'review-page__recommend-btn--active' : ''}`}
                  onClick={() => setRecommend(recommend === true ? null : true)}
                >
                  <ThumbsUp size={15} /> Yes
                </button>
                <button
                  type="button"
                  className={`review-page__recommend-btn review-page__recommend-btn--no ${recommend === false ? 'review-page__recommend-btn--active' : ''}`}
                  onClick={() => setRecommend(recommend === false ? null : false)}
                >
                  <ThumbsDown size={15} /> No
                </button>
              </div>
            </div>
          </div>

          <div className="review-page__field">
            <label className="review-page__label">
              <input
                type="checkbox"
                checked={addToShelfChecked}
                onChange={(e) => setAddToShelfChecked(e.target.checked)}
              />
              {' '}Add this book to my shelf
            </label>
          </div>

          {addToShelfChecked && (
            <div className="review-page__field">
              <label className="review-page__label">Library Placement</label>
              <select
                className="review-page__select"
                value={shelfStatus}
                onChange={(e) => setShelfStatus(e.target.value)}
              >
                {SHELF_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}


          <div className="review-page__field">
            <label className="review-page__label">Detailed Critique</label>
            <textarea
              className="review-page__textarea"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your scholarly analysis. What themes stood out? How did it compare to others in the genre? Would you recommend it to a fellow reader?"
              rows={10}
            />
            {errors.reviewText && <p className="review-page__error">{errors.reviewText}</p>}
          </div>

          <div className="review-page__actions">
            <Link to={`/books/${bookId}`} className="review-page__cancel">
              Cancel
            </Link>
            <button
              type="submit"
              className="review-page__submit"
              disabled={loading}
            >
              {loading ? 'Submitting…' : (
                <>Submit Review <Send size={14} /></>
              )}
            </button>
          </div>

          <p className="review-page__disclaimer">
            <Info size={12} />
            Your contribution follows the Library Ethics code. Reviews are subject to community moderation.
          </p>
        </form>
      </div>
    </PageWrapper>
  )
}

export default ReviewPage