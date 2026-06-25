import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useBooks } from '../hooks/useBooks'
import { useReviews } from '../hooks/useReviews'
import { useComments } from '../hooks/useComments'
import { useAuthContext } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import PageWrapper from '../components/layout/PageWrapper'
import Avatar from '../components/ui/Avatar'
import StarRating from '../components/ui/StarRating'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import CommentList from '../components/comment/CommentList'
import CommentForm from '../components/comment/CommentForm'
import { BookOpen, ChevronDown, ThumbsUp, MessageSquare, Edit, Trash2, ExternalLink, Heart } from 'lucide-react'

const SHELF_OPTIONS = [
  { value: 'reading',      label: 'Currently Reading' },
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'completed',    label: 'Finished' },
]

const BookPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { bookId } = useParams()
  const { user, isAuthenticated } = useAuthContext()
  const { getBook, addToShelf, updateShelf, loading } = useBooks()
  const { deleteReview, likeReview, unlikeReview, toggleHelpful, editReview } = useReviews()
  const { getReviewComments, addReviewComment, deleteReviewComment, likeComment, unlikeComment, replyComment } = useComments()
  const { showToast } = useToast()

  const canEditReview = (createdAt) => {
  if (!createdAt) return false
  const daysSincePost = (Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24)
  return daysSincePost <= 7
}

  const [book, setBook]               = useState(null)
  const [reviews, setReviews]         = useState([])
  const [userReview, setUserReview]   = useState(null)
  const [shelfStatus, setShelfStatus] = useState(null)
  const [dbBookId, setDbBookId]       = useState(null)
  const [canEdit, setCanEdit]         = useState(false)

  const [shelfOpen, setShelfOpen]     = useState(false)
  const [openComments, setOpenComments] = useState(null)
  const [commentsMap, setCommentsMap] = useState({})
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editForm, setEditForm]       = useState({ rating: 0, review: '' })

  const shelfRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      const result = await getBook(bookId)
      if (result.success) {
        setBook(result.data.book)
        setDbBookId(result.data.book.id ?? null)
        setReviews(result.data.reviews ?? [])
        setUserReview(result.data.userReview ?? null)
        setShelfStatus(result.data.shelfStatus ?? null)
      } else {
        showToast(result.error, 'error')
      }
    }
    fetchData()
  }, [bookId])

 useEffect(() => {
  if (!userReview?.created_at) {
    setCanEdit(false)
    return
  }
  
  setCanEdit(canEditReview(userReview.created_at))

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
  const msRemaining = SEVEN_DAYS_MS - (Date.now() - new Date(userReview.created_at))
  if (msRemaining <= 0) return

  const timer = setTimeout(() => setCanEdit(false), msRemaining)
  return () => clearTimeout(timer)
}, [userReview?.created_at])
  const handleShelfSelect = async (status) => {
    setShelfOpen(false)
    let result
    if (shelfStatus) {
      result = await updateShelf(dbBookId, status)
    } else {
      result = await addToShelf({
        bookId:             book.id ?? null,
        googleBooksId:      book.googleBooksId,
        title:              book.title,
        author:             book.author,
        cover:              book.cover_url,
        description:        book.description,
        previewLink:        book.preview_link,
        globalRating:       book.average_rating,
        globalRatingsCount: book.ratings_count,
        pageCount:          book.page_count,
        publishDate:        book.publish_date,
        publishYear:        book.publish_year,
        status,
      })
      
      if (result.success) {
        setDbBookId(result.data.bookId)
      }
    }
    if (result.success) {
      setShelfStatus(status)
      showToast(`Added to ${SHELF_OPTIONS.find(o => o.value === status)?.label}`, 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleDeleteReview = async () => {
    if (!userReview) return
    const result = await deleteReview(bookId, userReview.id)
    if (result.success) {
      setUserReview(null)
      setReviews((prev) => prev.filter((r) => r.id !== userReview.id))
      showToast('Review deleted', 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleLike = async (review) => {
    if (review.user_id === user?.id) return
    const result = review.is_liked
      ? await unlikeReview(review.id)
      : await likeReview(review.id)

    if (result.success) {
      const updatedFields = {
        is_liked: !review.is_liked,
        like_count: review.is_liked ? review.like_count - 1 : review.like_count + 1
      }
      
      if (userReview && review.id === userReview.id) {
        setUserReview(prev => ({ ...prev, ...updatedFields }))
      }
      setReviews((prev) =>
        prev.map((r) => r.id === review.id ? { ...r, ...updatedFields } : r)
      )
    }
  }

  const handleHelpful = async (review) => {
    if (review.user_id === user?.id) return
    const result = await toggleHelpful(review.id)
    if (result.success) {
      const { helpful, helpful_count } = result.data
      
      if (userReview && review.id === userReview.id) {
        setUserReview(prev => ({ ...prev, is_helpful: helpful, helpful_count }))
      }
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id
            ? { ...r, is_helpful: helpful, helpful_count: helpful_count }
            : r
        )
      )
    }
  }

  const handleEditReview = async () => {
    const result = await editReview(bookId, userReview.id, editForm)
    if (result.success) {
      setUserReview((prev) => ({ ...prev, ...editForm }))
      setReviews((prev) =>
        prev.map((r) => r.id === userReview.id ? { ...r, ...editForm } : r)
      )
      setEditingReviewId(null)
      showToast('Review updated', 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleToggleComments = async (reviewId) => {
    if (openComments === reviewId) {
      setOpenComments(null)
      return
    }
    setOpenComments(reviewId)
    if (!commentsMap[reviewId]) {
      const result = await getReviewComments(reviewId)
      if (result.success) {
        setCommentsMap((prev) => ({ ...prev, [reviewId]: result.data.comments ?? [] }))
      }
    }
  }

  const handleAddComment = async (reviewId, comment_text) => {
    const result = await addReviewComment(reviewId, comment_text)
    if (result.success) {
      const refreshed = await getReviewComments(reviewId)
      if (refreshed.success) {
        setCommentsMap((prev) => ({ ...prev, [reviewId]: refreshed.data.comments ?? [] }))
        
        const countUpdate = (prev) => prev.map(r => r.id === reviewId ? { ...r, reply_count: (r.reply_count ?? 0) + 1 } : r)
        setReviews(countUpdate)
        if (userReview && reviewId === userReview.id) {
          setUserReview(prev => ({ ...prev, reply_count: (prev.reply_count ?? 0) + 1 }))
        }
      }
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleDeleteComment = async (reviewId, commentId) => {
    const result = await deleteReviewComment(commentId)
    if (result.success) {
      setCommentsMap((prev) => ({
        ...prev,
        [reviewId]: prev[reviewId].filter((c) => c.id !== commentId),
      }))
      
      const countUpdate = (prev) => prev.map(r => r.id === reviewId ? { ...r, reply_count: Math.max(0, (r.reply_count ?? 1) - 1) } : r)
      setReviews(countUpdate)
      if (userReview && reviewId === userReview.id) {
        setUserReview(prev => ({ ...prev, reply_count: Math.max(0, (prev.reply_count ?? 1) - 1) }))
      }
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleLikeComment = async (reviewId, commentId) => {
    const comments = commentsMap[reviewId] ?? []
    const comment  = comments.find((c) => c.id === commentId)
    const result   = comment?.is_liked
      ? await unlikeComment(reviewId, commentId)
      : await likeComment(reviewId, commentId)

    if (result.success) {
      setCommentsMap((prev) => ({
        ...prev,
        [reviewId]: prev[reviewId].map((c) =>
          c.id === commentId
            ? {
                ...c,
                is_liked:   !c.is_liked,
                like_count: c.is_liked ? c.like_count - 1 : c.like_count + 1,
              }
            : c
        ),
      }))
    }
  }

  const handleReply = async (reviewId, commentId, body) => {
    const result = await replyComment(reviewId, commentId, body)
    if (result.success) {
      const refreshed = await getReviewComments(reviewId)
      if (refreshed.success) {
        setCommentsMap((prev) => ({ ...prev, [reviewId]: refreshed.data.comments ?? [] }))
      }
    } else {
      showToast(result.error, 'error')
    }
  }
if (loading) return <Spinner fullPage size='lg' />
  if (!book)   return <PageWrapper><p className="book-page__not-found">Book not found.</p></PageWrapper>

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length).toFixed(1)
    : null

  return (
    <PageWrapper className="book-page">
      <div className="book-page__hero">
        <div className="book-page__cover-wrap">
          {book.cover_url && (
            <img src={book.cover_url} alt={book.title} className="book-page__cover" />
          )}
          {!book.cover_url && (
            <div className="book-page__cover-fallback">
              <BookOpen size={40} />
            </div>
          )}
        </div>

        <div className="book-page__hero-info">
          {book.genres?.length > 0 && (
            <div className="book-page__genres">
              {book.genres.map((g) => (
                <Badge key={g} variant="default" className="book-page__genre-badge">
                  {g}
                </Badge>
              ))}
            </div>
          )}

          <h1 className="book-page__title">{book.title}</h1>
          <p className="book-page__author">by {book.author}</p>

          {avgRating && (
            <div className="book-page__rating">
              <StarRating value={Number(avgRating)} readOnly size="md" />
              <span className="book-page__rating-text">
                {avgRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}

          <div className="book-page__actions">
            {book.preview_link && (
              <Button
                variant="primary"
                leftIcon={<BookOpen size={15} />}
                onClick={() => window.open(book.preview_link, '_blank', 'noreferrer')}
              >
                Preview Book
              </Button>
            )}

            {isAuthenticated ? (
              <div className="book-page__shelf-wrap" ref={shelfRef}>
                <Button
                  variant="ghost"
                  rightIcon={<ChevronDown size={14} />}
                  onClick={() => setShelfOpen((p) => !p)}
                >
                  {shelfStatus
                    ? SHELF_OPTIONS.find(o => o.value === shelfStatus)?.label
                    : 'Add to Shelf'}
                </Button>
                {shelfOpen && (
                  <div className="book-page__shelf-dropdown">
                    {SHELF_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={shelfStatus === opt.value ? 'primary' : 'ghost'}
                        onClick={() => handleShelfSelect(opt.value)}
                        fullWidth
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
              >
                Sign in to add to shelf
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="book-page__body">
        <main className="book-page__main">
          <section className="book-page__section">
            <p className="book-page__section-label">Synopsis</p>
            <p className="book-page__description">{book.description}</p>
          </section>

          <section className="book-page__section">
            <p className="book-page__section-label">Book Details</p>
            <div className="book-page__meta-grid">
              {book.page_count && (
                <div className="book-page__meta-item">
                  <span className="book-page__meta-key">Pages</span>
                  <span className="book-page__meta-val">{book.page_count}</span>
                </div>
              )}
              <div className="book-page__meta-item">
                <span className="book-page__meta-key">Language</span>
                <span className="book-page__meta-val">English</span>
              </div>
              { book.publish_year && (
                <div className="book-page__meta-item">
                  <span className="book-page__meta-key">Published in</span>
                  <span className="book-page__meta-val">{book.publish_year}</span>
                </div>
              )}

              {book.average_rating > 0 && (
                <div className="book-page__meta-item">
                  <span className="book-page__meta-key">
                    Global Rating via{' '}
                    <a href="https://books.google.com" target="_blank" rel="noreferrer">
                      Google Books
                    </a>
                  </span>
                  <span className="book-page__meta-val">{book.average_rating}</span>
                </div>
              )}
              {book.ratings_count > 0 && (
                <div className="book-page__meta-item">
                  <span className="book-page__meta-key">Rated by</span>
                  <span className="book-page__meta-val">{book.ratings_count.toLocaleString()}</span>
                </div>
              )}
            </div>
          </section>

          <section className="book-page__reviews">
            <div className="book-page__reviews-header">
              <h2 className="book-page__reviews-title">Community Reviews</h2>
              {isAuthenticated ? (
                <div>
                  {!userReview && (
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/reviews/new?bookId=${bookId}`)}
                    >
                      Write a Review
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  <Button 
                    variant='primary'
                    onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
                  >
                    Login to write a review
                  </Button>
                </div>
              )}
            </div>

            {userReview && (
              <div className="book-page__review book-page__review--own">
                <div className="book-page__review-header">
                  <Avatar src={user?.image_url} name={user?.name} color={user?.avatar_color} size="sm" />
                  <div>
                    <p className="book-page__review-author-name">
                      {user?.name} <span className="book-page__review-you">(You)</span>
                    </p>
                    <StarRating value={Number(userReview.rating)} readOnly size="sm" />
                  </div>
                  
                  <div className="book-page__review-actions">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Edit size={14} />}
                        onClick={() => {
                          setEditingReviewId(userReview.id)
                          setEditForm({ rating: userReview.rating, review: userReview.review })
                        }}
                      >
                        Edit
                      </Button> 
                    )}
                    
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 size={14} />}
                      onClick={handleDeleteReview}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {editingReviewId === userReview.id ? (
                  <div className="book-page__review-edit">
                    <StarRating
                      value={editForm.rating}
                      onChange={(val) => setEditForm((p) => ({ ...p, rating: val }))}
                      size="md"
                    />
                    <textarea
                      className="book-page__review-edit-textarea"
                      value={editForm.review}
                      onChange={(e) => setEditForm((p) => ({ ...p, review: e.target.value }))}
                      rows={5}
                      autoFocus
                    />
                    <div className="book-page__review-edit-actions">
                      <Button variant="ghost" size="sm" onClick={() => setEditingReviewId(null)}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleEditReview}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="book-page__review-text">{userReview.review}</p>
                )}

                <div className="book-page__review-footer">
                  <Button
                    variant={userReview.is_liked ? 'primary' : 'ghost'}
                    size="sm"
                    leftIcon={<Heart size={13} />}
                    disabled={true}
                    title="You cannot like your own review"
                  >
                    {userReview.like_count ?? 0} {userReview.like_count === 1 ? 'Like' : 'Likes'}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<ThumbsUp size={13} />}
                    disabled={true}
                    title="You cannot mark your own review as helpful"
                  >
                    {userReview.helpful_count === 0 ? (
                      'Helpful'
                    ) : (
                      <>
                        {userReview.helpful_count} {userReview.helpful_count === 1 ? 'person' : 'people'} found this helpful
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<MessageSquare size={13} />}
                    onClick={() => handleToggleComments(userReview.id)}
                  >
                    {userReview.reply_count ?? 0} {userReview.reply_count === 1 ? 'Comment' : 'Comments'}
                  </Button>
                </div>

                {openComments === userReview.id && (
                  <div className="book-page__comments">
                    <CommentList
                      comments={commentsMap[userReview.id] ?? []}
                      currentUser={user}
                      onLike={(commentId) => handleLikeComment(userReview.id, commentId)}
                      onDelete={(commentId) => handleDeleteComment(userReview.id, commentId)}
                      onReply={(commentId, body) => handleReply(userReview.id, commentId, body)}
                    />
                    <CommentForm
                      currentUser={user}
                      onSubmit={(body) => handleAddComment(userReview.id, body)}
                      placeholder="Add a comment to your review..."
                    />
                  </div>
                )}
              </div>
            )}

            {reviews.filter((r) => r.user_id !== user?.id).map((review) => (
              <div key={review.id} className="book-page__review">
                <div className="book-page__review-header">
                  <Avatar src={review.image_url} name={review.reviewer_name} color={review.avatar_color} size="sm" />
                  <div>
                    <p className="book-page__review-author-name">{review.reviewer_name}</p>
                    <StarRating value={Number(review.rating)} readOnly size="sm" />
                  </div>
                  <span className="book-page__review-date">
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>

                {review.review && (
                  <p className="book-page__review-text">{review.review}</p>
                )}

                <div className="book-page__review-footer">
                  {isAuthenticated ? (
                    <>
                      <Button
                        variant={review.is_liked ? 'primary' : 'ghost'}
                        size="sm"
                        leftIcon={<Heart size={13} />}
                        onClick={() => handleLike(review)}
                      >
                        {review.like_count ?? 0} {review.like_count === 1 ? 'Like' : 'Likes'}
                      </Button>

                      <Button
                        variant={review.is_helpful ? 'primary' : 'ghost'}
                        size="sm"
                        leftIcon={<ThumbsUp size={13} />}
                        onClick={() => handleHelpful(review)}
                      >
                        {review.helpful_count === 0 ? (
                          'Helpful'
                        ) : (
                          <>
                            {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<MessageSquare size={13} />}
                        onClick={() => handleToggleComments(review.id)}
                      >
                        {review.reply_count ?? 0} {review.reply_count === 1 ? 'Comment' : 'Comments'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="book-page__review-stat">
                        <Heart size={13} /> {review.like_count ?? 0} {review.like_count === 1 ? 'Like' : 'Likes'}
                      </span>
                      <span className="book-page__review-stat">
                        <ThumbsUp size={13} />  {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful
                      </span>
                      <span className="book-page__review-stat">
                        <MessageSquare size={13} /> {review.reply_count ?? 0} {review.reply_count === 1 ? 'Comment' : 'Comments'}
                      </span>
                    </>
                  )}
                </div>

                {openComments === review.id && (
                  <div className="book-page__comments">
                    <CommentList
                      comments={commentsMap[review.id] ?? []}
                      currentUser={user}
                      onLike={isAuthenticated ? (commentId) => handleLikeComment(review.id, commentId) : null}
                      onDelete={isAuthenticated ? (commentId) => handleDeleteComment(review.id, commentId) : null}
                      onReply={isAuthenticated ? (commentId, body) => handleReply(review.id, commentId, body) : null}
                    />
                    {isAuthenticated ? (
                      <CommentForm
                        currentUser={user}
                        onSubmit={(body) => handleAddComment(review.id, body)}
                        placeholder="Add a comment..."
                      />
                    ) : (
                      <p className="book-page__comment-prompt">
                        <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`}>
                          Sign in
                        </Link> to join the discussion
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {reviews.length === 0 && !userReview && (
              <p className="book-page__reviews-empty">
                No reviews yet. Be the first to share your thoughts.
              </p>
            )}
          </section>
        </main>

        <aside className="book-page__aside">
          {book.preview_link && (
            <a
              href={book.preview_link}
              target="_blank"
              rel="noreferrer"
              className="book-page__preview-link"
            >
              <ExternalLink size={14} /> Read Preview on Google Books
            </a>
          )}

          {book.genres?.length > 0 && (
            <div className="book-page__aside-section">
              <p className="book-page__aside-label">Genres</p>
              <div className="book-page__genre-tags">
                {book.genres.map((genre) => (
                  <Link
                    key={genre}
                    to={`/genres/${encodeURIComponent(genre)}`}
                    className="book-page__genre-tag"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </PageWrapper>
  )
}

export default BookPage