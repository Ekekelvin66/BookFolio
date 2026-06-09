import clsx from 'clsx'
import BookCard from './BookCard'

const BookGrid=({ books, variant = 'default', className, emptyMessage = 'No books found.' })=>{
  if (!books || books.length === 0) {
    return (
      <div className="book-grid__empty">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={clsx('book-grid', `book-grid--${variant}`, className)}>
      {books.map((book) => (
        <BookCard
          key={book.googleBooksId || book.id}
          book={book}
          variant={variant}
          progress={book.progress}
        />
      ))}
    </div>
  )
}

export default BookGrid
