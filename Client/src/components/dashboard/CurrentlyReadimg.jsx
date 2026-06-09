import clsx from 'clsx'
import { BookOpen } from 'lucide-react'

const ReadingProgress = ({ books = [], className }) => {
  if (!books.length) {
    return (
      <div className={clsx('reading-progress reading-progress--empty', className)}>
        <BookOpen size={18} />
        <p className="reading-progress__empty">No books in progress.</p>
      </div>
    )
  }

  return (
    <div className={clsx('reading-progress', className)}>
      <p className="reading-progress__title">Currently Reading</p>
      {books.map((book) => {
        const pct = Number(book.progress) || 0
        const pagesLeft = (book.total_pages || 0) - (book.current_page || 0)
        const minsLeft = Math.round(pagesLeft * 2)

        return (
          <div key={book.id} className="reading-progress__item">
            <div className="reading-progress__book-info">
              {book.cover_url && (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="reading-progress__cover"
                />
              )}
              <div className="reading-progress__meta">
                <p className="reading-progress__book-title">{book.title}</p>
                <p className="reading-progress__author">{book.author}</p>
                <p className="reading-progress__pages">
                  {book.current_page} / {book.total_pages} pages
                </p>
              </div>
            </div>

            <div className="reading-progress__track">
              <div
                className="reading-progress__fill"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            <div className="reading-progress__footer">
              <span className="reading-progress__pct">{pct}% complete</span>
              {pagesLeft > 0 && (
                <span className="reading-progress__time">~{minsLeft} mins left</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ReadingProgress