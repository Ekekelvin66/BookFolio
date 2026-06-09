import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Star, BookOpen } from 'lucide-react'
import Badge from '../ui/Badge'

const BookCard=({ book, variant = 'default', progress = null, className })=>{
  const {
    id,
    googleBooksId,
    title,
    author,
    cover_url,
    genre,
    average_rating,
    _pageCount,
  } = book

    const bookId = id ?? googleBooksId
  if (variant === 'default') {
    return (
      <Link
        to={`/books/${bookId}`}
        className={clsx('book-card', 'book-card--default', className)}
      >
        <div className="book-card__cover-wrap">
          {cover_url ? (
            <img
              src={cover_url}
              alt={title}
              className="book-card__cover"
            />
          ) : (
            <div className="book-card__cover-fallback">
              <BookOpen size={28} />
            </div>
          )}
          {genre && (
            <Badge variant="default" size="sm" className="book-card__genre">
              {genre}
            </Badge>
          )}
        </div>
        <div className="book-card__info">
          <p className="book-card__title">{title}</p>
          <p className="book-card__author">{author}</p>
          {average_rating > 0 && (
            <div className="book-card__rating">
              <Star size={12} className="book-card__star" />
              <span>{average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  // ─── Compact variant ───────────────────────────────────
  if (variant === 'compact') {
    const progressPercent = Math.min(Math.max(progress ?? 0, 0), 100)

    return (
      <Link
        to={`/books/${bookId}`}
        className={clsx('book-card', 'book-card--compact', className)}
      >
        <div className="book-card__cover-wrap book-card__cover-wrap--sm">
          {cover_url ? (
            <img
              src={cover_url}
              alt={title}
              className="book-card__cover"
            />
          ) : (
            <div className="book-card__cover-fallback book-card__cover-fallback--sm">
              <BookOpen size={16} />
            </div>
          )}
        </div>
        <div className="book-card__info">
          <p className="book-card__title">{title}</p>
          <p className="book-card__author">{author}</p>
          {progress !== null && (
            <div className="book-card__progress">
              <div className="book-card__progress-bar">
                <div
                  className="book-card__progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="book-card__progress-label">
                {progressPercent}%
              </span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  // ─── Minimal variant ───────────────────────────────────
  if (variant === 'minimal') {
    return (
      <Link
        to={`/books/${bookId}`}
        className={clsx('book-card', 'book-card--minimal', className)}
      >
        <div className="book-card__cover-wrap">
          {cover_url ? (
            <img
              src={cover_url}
              alt={title}
              className="book-card__cover"
            />
          ) : (
            <div className="book-card__cover-fallback">
              <BookOpen size={24} />
            </div>
          )}
        </div>
        <p className="book-card__title">{title}</p>
      </Link>
    )
  }

  return null
}

export default BookCard