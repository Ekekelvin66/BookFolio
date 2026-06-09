import clsx from "clsx";
import { BookOpen } from "lucide-react";
import BookCard from "../book/BookCard";

const ShelfSection=({books=[],onUpdateProgress,onRemove,className})=>{
    if(books.length===0){
        return(
             <div className={clsx('shelf-section shelf-section--empty', className)}>
        <p className="shelf-section__empty">Your shelf is empty.Populate it by reading more books</p>
      </div>
        )
    }
    return(
    <div className={clsx('shelf-section', className)}>
      {books.map((book) => (
        <div key={book.id} className="shelf-section__item">
          <BookCard book={book} variant="compact" progress={book.progress} />
 
          <div className="shelf-section__meta">
            <div className="shelf-section__progress-bar">
              <div
                className="shelf-section__progress-fill"
                style={{ width: `${book.progress ?? 0}%` }}
              />
            </div>
            <span className="shelf-section__pages">
              {book.current_page ?? 0} / {book.total_pages ?? 0} pages
            </span>
          </div>
 
          <div className="shelf-section__actions">
            <button
              className="shelf-section__btn shelf-section__btn--primary"
              onClick={() => onUpdateProgress?.(book.id)}
            >
              Update Progress
            </button>
            <button
              className="shelf-section__btn shelf-section__btn--ghost"
              onClick={() => onRemove?.(book.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>       
    )
  
}
export default ShelfSection