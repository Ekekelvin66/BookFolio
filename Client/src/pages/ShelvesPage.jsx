import { useEffect, useState,useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import { useBooks } from '../hooks/useBooks'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import PageWrapper from '../components/layout/PageWrapper'
import BookCard from '../components/book/BookCard'
import Input from '../components/ui/Input'
import { Edit2, Trash2, RotateCcw,MoreVertical,Search,ArrowRight } from 'lucide-react'
import Button from '../components/ui/Button'

const ShelvesPage = () => {
  const { getShelves, loading } = useDashboard()
  const { removeFromShelf, updateProgress, updateShelf } = useBooks()
  const { showToast } = useToast()

  const [currentlyReading, setCurrentlyReading] = useState([])
  const [wantToRead, setWantToRead] = useState([])
  const [finished, setFinished] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [progressBookId, setProgressBookId] = useState(null)
  const [progressInput, setProgressInput] = useState('')
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showAllWant, setShowAllWant] = useState(false)
  const [showAllFinished, setShowAllFinished] = useState(false)
  const dropdownRef=useRef(null)
  const LIMIT = 6

  

  useEffect(() => {
    const fetchData = async () => {
      const result = await getShelves()
      if (result.success) {
        setCurrentlyReading(result.data.shelves?.reading ?? [])
        setWantToRead(result.data.shelves?.want_to_read ?? [])
        setFinished(result.data.shelves?.completed ?? [])
      } else {
        showToast(result.error, 'error')
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
      const handleOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setActionsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleOutside)
      return () => document.removeEventListener('mousedown', handleOutside)
    }, [])

  const filterBooks = (books) => {
    if (!searchQuery.trim()) return books
    const q = searchQuery.toLowerCase()
    return books.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q)
    )
  }

  const handleRemove = async (bookId, shelf) => {
    const result = await removeFromShelf(bookId)
    if (result.success) {
      const setter = shelf === 'reading' ? setCurrentlyReading
        : shelf === 'want' ? setWantToRead
        : setFinished
      setter((prev) => prev.filter((b) => b.id !== bookId))
      showToast('Removed from shelf', 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleMoveToReading = async (bookId) => {
    const result = await updateShelf(bookId, 'reading')
    if (result.success) {
      const book = wantToRead.find((b) => b.id === bookId)
      setWantToRead((prev) => prev.filter((b) => b.id !== bookId))
      setCurrentlyReading((prev) => [...prev, { ...book, status: 'reading' }])
      showToast('Moved to Currently Reading', 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleMarkFinished = async (bookId) => {
    const result = await updateShelf(bookId, 'completed')
    if (result.success) {
        const book = currentlyReading.find((b) => b.id === bookId)
        setCurrentlyReading((prev) => prev.filter((b) => b.id !== bookId))
        setFinished((prev) => [...prev, { ...book, status: 'completed' }])
        showToast('Marked as finished', 'success')
    } else {
    showToast(result.error, 'error')
    }
  }
const handleReadAgain = async (bookId) => {
  const result = await updateShelf(bookId, 'reading')
    if (result.success) {
        const book = finished.find((b) => b.id === bookId)
        setFinished((prev) => prev.filter((b) => b.id !== bookId))
        setCurrentlyReading((prev) => [...prev, { ...book, status: 'reading' }])
        showToast('Added back to Currently Reading', 'success')
    } else {
    showToast(result.error, 'error')
  }
}


  const handleOpenProgress = (bookId) => {
    const book = currentlyReading.find((b) => b.id === bookId)
    setProgressBookId(bookId)
    setProgressInput(book?.current_page ?? '')
  }

  const handleSubmitProgress = async () => {
    const page = parseInt(progressInput)
    const book = currentlyReading.find((b) => b.id === progressBookId)

    if (isNaN(page) || page < 0) {
      showToast('Enter a valid page number', 'error')
      return
    }
    if (book?.total_pages && page > book.total_pages) {
      showToast(`Page cannot exceed ${book.total_pages}`, 'error')
      return
    }

    const result = await updateProgress(progressBookId, page)
    if (result.success) {
      setCurrentlyReading((prev) =>
        prev.map((b) =>
          b.id === progressBookId
            ? { ...b, current_page: result.data.current_page, progress: result.data.progress }
            : b
        )
      )
      showToast('Progress updated!', 'success')
      setProgressBookId(null)
      setProgressInput('')
    } else {
      showToast(result.error, 'error')
    }
  }

  if (loading) return <Spinner fullPage size='lg' />

  const filteredReading = filterBooks(currentlyReading)
  const filteredWant = filterBooks(wantToRead)
  const filteredFinished = filterBooks(finished)

  const visibleWant = showAllWant ? filteredWant : filteredWant.slice(0, LIMIT)
  const visibleFinished = showAllFinished ? filteredFinished : filteredFinished.slice(0, LIMIT)

  return (
    <PageWrapper className="shelves-page">
      <div className="shelves-page__header">
        <h1 className="shelves-page__title">My Shelf</h1>
        <Input
          placeholder="Search within your shelf..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={15} />}
          className="shelves-page__search"
        />
      </div>

      <section className="shelves-page__section">
        <div className="shelves-page__section-header">
          <h2 className="shelves-page__section-title">Currently Reading</h2>
          <span className="shelves-page__count">{filteredReading.length} active</span>
          
        </div>

        {filteredReading.length === 0 ? (
          <p className="shelves-page__empty">No books in progress.</p>
        ) : (
          <div className="shelves-page__reading-grid">
            {filteredReading.map((book) => (
              <div key={book.id} className="shelves-page__reading-card">
                <BookCard book={book} variant="compact" />
                <div className="shelves-page__progress-bar">
                  <div
                    className="shelves-page__progress-fill"
                    style={{ width: `${book.progress ?? 0}%` }}
                  />
                </div>
                <div className="shelves-page__reading-meta">
                  <span className="shelves-page__pages">
                    {book.current_page ?? 0} / {book.total_pages ?? 0} pages
                  </span>
                  <span className="shelves-page__pct">{book.progress ?? 0}%</span>
                </div>

                {progressBookId === book.id ? (
                  <div className="shelves-page__progress-input">
                    <Input
                      type="number"
                      value={progressInput}
                      onChange={(e) => setProgressInput(e.target.value)}
                      placeholder="Current page"
                      min={0}
                      max={book.total_pages}
                    />
                    <div className="shelves-page__progress-btns">
                      <button className="shelves-page__btn shelves-page__btn--primary" onClick={handleSubmitProgress}>
                        Save
                      </button>
                      <button className="shelves-page__btn shelves-page__btn--ghost" onClick={() => { setProgressBookId(null); setProgressInput('') }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="shelves-page__reading-actions">
                    <button
                      className="shelves-page__btn shelves-page__btn--primary"
                      onClick={() => handleOpenProgress(book.id)}
                    >
                      Update Progress
                    </button>
                    <button
                     className="shelves-page__btn shelves-page__btn--success"
                      onClick={() => handleMarkFinished(book.id)}
                    >
                      Mark Finished
                      
                    </button>
                    <button
                      className="shelves-page__btn shelves-page__btn--ghost"
                      onClick={() => handleRemove(book.id, 'reading')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="shelves-page__section">
        <div className="shelves-page__section-header">
          <h2 className="shelves-page__section-title">Want to Read</h2>
          <span className="shelves-page__count">{filteredWant.length} books</span>
          {filteredWant.length > LIMIT && (
            <Button onClick={()=>setShowAllWant(p=>!p)}
            rightIcon={<ArrowRight/>}
            >
                {showAllWant ? 'Show Less' : `View All (${filteredWant.length})`}
            </Button>
)}
        </div>

        {filteredWant.length === 0 ? (
          <p className="shelves-page__empty">No books in your reading list.</p>
        ) : (
          <div className="shelves-page__want-grid">
            {visibleWant.map((book) => (
              <div key={book.id} className="shelves-page__want-card">
                <div className="shelves-page__want-cover-wrap">
                  <BookCard book={book} variant="minimal" />
                  <div className="shelves-page__want-overlay">
                    <button
                      className="shelves-page__overlay-btn"
                      onClick={() => handleMoveToReading(book.id)}
                    >
                      Start Reading
                    </button>
                    <button
                      className="shelves-page__overlay-btn shelves-page__overlay-btn--ghost"
                      onClick={() => handleRemove(book.id, 'want')}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="shelves-page__section">
        <div className="shelves-page__section-header">
          <h2 className="shelves-page__section-title">Finished</h2>
          <span className="shelves-page__count">{filteredFinished.length} books</span>
           {filteredFinished.length > LIMIT && (
            <Button onClick={()=>setShowAllFinished(p=>!p)}
                rightIcon={<ArrowRight/>}
            >
                {showAllFinished ? 'Show Less' : `View All (${filteredFinished.length})`}
            </Button>
           )}
        </div>

        {filteredFinished.length === 0 ? (
          <p className="shelves-page__empty">No finished books yet.</p>
        ) : (
          <div className="shelves-page__finished-grid">
            {visibleFinished.map((book) => (
              <div key={book.id} className="shelves-page__finished-card">
                {(book.cover_url || book.cover) && (
                  <img
                    src={book.cover_url ?? book.cover}
                    alt={book.title}
                    className="shelves-page__finished-cover"
                  />
                )}
                <div className="shelves-page__finished-info">
                    <p className="shelves-page__finished-title">{book.title}</p>
                    <p className="shelves-page__finished-author">{book.author}</p>
                    
                    
                    <div ref={dropdownRef} className="shelves-page__dropdown-container">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shelves-page__dropdown-toggle"
                        onClick={() => setActionsOpen(!actionsOpen)}
                        leftIcon={<MoreVertical size={16} />}
                      >
                        Actions
                      </Button>

                      {actionsOpen && (
                        <div className="shelves-page__dropdown-menu">
                          
                          <Link
                            to={`/reviews/new?bookId=${book.id}`}
                            className="shelves-page__dropdown-item"
                            onClick={() => setActionsOpen(false)}
                          >
                            <Edit2 size={14} />
                            Write Review
                          </Link>

                          <button
                            className="shelves-page__dropdown-item shelves-page__dropdown-item--danger"
                            onClick={() => {
                              handleRemove(book.id, 'finished');
                              setActionsOpen(false);
                            }}
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>

                          <button 
                            className="shelves-page__dropdown-item"
                            onClick={() => {
                              handleReadAgain(book.id);
                              setActionsOpen(false);
                            }}
                          >
                            <RotateCcw size={14} />
                            Read Again
                          </button>

                        </div>
                      )}
                    </div>
                  </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageWrapper>
  )
}

export default ShelvesPage
