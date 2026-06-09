import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, X, Loader } from 'lucide-react'
import Spinner from './Spinner'
import clsx from 'clsx'
import { useBooks } from '../../hooks/useBooks'

const BookSearchCombobox = ({
  placeholder = 'Search for books...',
  onSelect,
  value,
  onSearchSubmit,
  onChange,
  className,
}) => {
  const navigate = useNavigate()
  const { searchBooks, loading } = useBooks()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef = useRef(null)
  const listRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      const result = await searchBooks(query)
      if (result.success) {
        const books = result.data.books ?? []
        setResults(books.slice(0, 8))
        setOpen(books.length > 0)
        setActiveIndex(-1)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

    useEffect(() => {
    if (value !== undefined) setQuery(value)
  }, [value])

  const handleKeyDown = (e) => {
    if (!open) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex])
      } else {
        handleFullSearch()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
    }
  }

  const handleSelect = (book) => {
    const bookId = book.id ?? book.googleBooksId
    setQuery('')
    setOpen(false)
    setResults([])
    if (onSelect) {
      onSelect(book)
    } else {
      navigate(`/books/${bookId}`)
    }
  }

  const handleFullSearch = () => {
    if (!query.trim()) return
    setOpen(false)
    if(onSearchSubmit){
      onSearchSubmit(query.trim())
    }else{
      navigate(`/search?query=${encodeURIComponent(query.trim())}`)
     }
  }
    

  const handleClear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }
  const handleChange=(e)=>{
    setQuery(e.target.value)
    onChange?.(e.target.value)
  }
  return (
    <div
      ref={wrapperRef}
      className={clsx('book-combobox', className)}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
    >
      <div className="book-combobox__input-wrap">
        <Search size={15} className="book-combobox__icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="book-combobox__input"
          aria-autocomplete="list"
          aria-controls="book-combobox-list"
          autoComplete="off"
          spellCheck="false"
        />
        {loading && (
          <Spinner size='sm' className="book-combobox__spinner" aria-label="Searching..." />
        )}
        {query && !loading && (
          <button
            type="button"
            className="book-combobox__clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <ul
          ref={listRef}
          id="book-combobox-list"
          className="book-combobox__dropdown"
          role="listbox"
          aria-label="Book search results"
        >
          {results.map((book, i) => {
            const bookId = book.id ?? book.googleBooksId
            const cover = book.cover_url ?? book.cover
            const isLocal = Boolean(book.id)

            return (
              <li
                key={bookId ?? i}
                role="option"
                aria-selected={activeIndex === i}
                className={clsx(
                  'book-combobox__item',
                  activeIndex === i && 'book-combobox__item--active'
                )}
                onMouseDown={() => handleSelect(book)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <div className="book-combobox__cover-wrap">
                  {cover ? (
                    <img
                      src={cover}
                      alt={book.title}
                      className="book-combobox__cover"
                    />
                  ) : (
                    <div className="book-combobox__cover-fallback">
                      <BookOpen size={14} />
                    </div>
                  )}
                </div>

                <div className="book-combobox__meta">
                  <p className="book-combobox__title">{book.title}</p>
                  <p className="book-combobox__author">{book.author}</p>
                </div>

                {isLocal && (
                  <span className="book-combobox__badge">In library</span>
                )}
              </li>
            )
          })}

          <li
            className="book-combobox__footer"
            onMouseDown={handleFullSearch}
            role="option"
            aria-selected={false}
          >
            <Search size={13} />
            Search all results for <strong>"{query}"</strong>
          </li>
        </ul>
      )}
    </div>
  )
}

export default BookSearchCombobox
