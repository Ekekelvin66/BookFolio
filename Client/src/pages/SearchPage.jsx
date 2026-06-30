import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useBooks } from '../hooks/useBooks'
import { useGenres } from '../hooks/useGenres'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import PageWrapper from '../components/layout/PageWrapper'
import BookCard from '../components/book/BookCard'
import SearchBar from '../components/ui/SearchBar'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { searchBooks, loading } = useBooks()
  const { genres } = useGenres()
  const { showToast } = useToast()
  
  // 1. Read page directly from the URL params (default to 1 if missing)
  const queryParam = searchParams.get('query') ?? ''
  const genreParam = searchParams.get('genre') ?? ''
  const pageParam = Math.max(parseInt(searchParams.get('page')) || 1, 1)

  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [textInput, setTextInput] = useState(queryParam)
  const debouncedInput = useDebouncedValue(textInput, 800)

  useEffect(() => { setTextInput(queryParam) }, [queryParam])

  useEffect(() => {
    if (debouncedInput === queryParam) return
    if (debouncedInput.trim().length > 0 && debouncedInput.trim().length < 3) return
    const params = {}
    if (debouncedInput.trim()) params.query = debouncedInput.trim()
    if (genreParam) params.genre = genreParam
    setSearchParams(params)
  }, [debouncedInput])

  const runSearch = async (pageNum) => {
    const result = await searchBooks(queryParam, genreParam, pageNum)
    if (result.success) {
      setResults(result.data.books ?? [])
      setHasNextPage(result.data.hasMore ?? false)
    } else {
      showToast(result.error, 'error')
    }
    setSearched(true)
  }


  useEffect(() => {
    if (!queryParam.trim() && !genreParam) { setResults([]); setSearched(false); return }
    runSearch(pageParam)
  }, [queryParam, genreParam, pageParam])


  const handleSearchSubmit = (query) => {
    const params = {}
    if (query.trim()) params.query = query.trim()
    if (genreParam) params.genre = genreParam
    setSearchParams(params)
  }

  const handleGenreSelect = (genreName) => {
    const params = {}
    if (queryParam.trim()) params.query = queryParam.trim()
    if (genreName !== genreParam) params.genre = genreName
    setSearchParams(params)
  }

  const goToPage = (nextPage) => {
    if (nextPage >= 1) {
      const params = {}
      if (queryParam.trim()) params.query = queryParam.trim()
      if (genreParam) params.genre = genreParam
      if (nextPage > 1) params.page = nextPage
      setSearchParams(params)
    }
  }

  const renderPageNumbers = () => {
    const pages = []
    
    
    if (pageParam > 1) {
      pages.push(pageParam - 1)
    }
    
    pages.push(pageParam)
    
    if (hasNextPage) {
      pages.push(pageParam + 1)
    }

    return pages.map((pageNum) => (
      <button
        key={pageNum}
        type="button"
        onClick={() => goToPage(pageNum)}
        className={clsx(
          'search-page__pagination-number',
          pageNum === pageParam && 'search-page__pagination-number--active'
        )}
        disabled={loading}
      >
        {pageNum}
      </button>
    ))
  }

  return (
    <PageWrapper className="search-page">
      <button onClick={() => navigate(-1)} className="genre-page__back">
        <ArrowLeft size='16' /> Go back
      </button>
      
      <div className="search-page__hero">
        <h1 className="search-page__title">Seek the Infinite</h1>
        <p className="search-page__sub">Explore millions of books from our community and beyond</p>
        <div className="search-page__search-container">
          <SearchBar
            value={textInput}
            placeholder="Search by title or author..."
            className="search-page__combobox"
            onChange={(val) => setTextInput(val)}
            onSearch={(query) => handleSearchSubmit(query)}
          />
        </div>
        <div className="search-page__shelf-wrapper">
          <p className="search-page__shelf-title">Browse Genre Shelves</p>
          <div className="search-page__shelf-row">
            {genres.map((genre) => {
              const isSelected = genre.name === genreParam
              return (
                <button key={genre.id ?? genre.name} type="button" onClick={() => handleGenreSelect(genre.name)}
                  className={clsx('search-page__spine-item', isSelected && 'search-page__spine-item--selected')}>
                  <span className="search-page__spine-label">{genre.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {loading && <Spinner fullPage size='lg' />}

      {!loading && searched && results.length === 0 && (
        <div className="search-page__empty-container">
          <p className="search-page__empty-text">
            No books found{queryParam && ` for "${queryParam}"`}{genreParam && ` in ${genreParam}`}.
          </p>
          <p className="search-page__empty-sub">Try another search or explore another shelf.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <section className="search-page__results-section">
          <p className="search-page__results-meta">
            {results.length} result{results.length !== 1 ? 's' : ''} on this page
            {queryParam && ` for "${queryParam}"`}{genreParam && ` in ${genreParam}`}
          </p>
          
          <div className="search-page__layout-grid">
            {results.map((book) => (
              <BookCard key={(book.source ?? 'x') + '-' + (book.googleBooksId ?? book.id)} book={book} variant="default" />
            ))}
          </div>

          <div className="search-page__pagination">
            <button 
              type="button"
              className="search-page__pagination-arrow"
              onClick={() => goToPage(pageParam - 1)} 
              disabled={pageParam === 1 || loading}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            
            {renderPageNumbers()}
            
            <button 
              type="button"
              className="search-page__pagination-arrow"
              onClick={() => goToPage(pageParam + 1)} 
              disabled={!hasNextPage || loading}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      )}

      {!searched && !loading && (
        <div className="search-page__intro-prompt">
          <p className="search-page__prompt-message">Search for a book or browse a genre shelf to begin.</p>
        </div>
      )}
    </PageWrapper>
  )
}

export default SearchPage