import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate,Link } from 'react-router-dom'
import { useBooks } from '../hooks/useBooks'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import PageWrapper from '../components/layout/PageWrapper'
import BookCard from '../components/book/BookCard'
import SearchBar from '../components/ui/SearchBar'
import api from '../utils/api'
import clsx from 'clsx'
import Button from '../components/ui/Button'

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const { searchBooks, loading } = useBooks()
  const { showToast } = useToast()
  const queryParam = searchParams.get('query') ?? ''
  const genreParam = searchParams.get('genre') ?? ''

  const [results, setResults] = useState([])
  const [genres, setGenres] = useState([])
  const [searched, setSearched] = useState(false)
  const [googleResults, setGoogleResults] = useState([])
  const [searchPage, setSearchPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreResults, setHasMoreResults] = useState(false)

  const [textInput, setTextInput] = useState(queryParam??'')
  useEffect(() => {
    setTextInput(queryParam??'')
  }, [queryParam])

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const { data } = await api.get('/genres')
        setGenres(data.genres ?? data ?? [])
      } catch (err) {
        console.error('Failed to fetch genres', err)
      }
    }

    fetchGenres()
  }, [])

  useEffect(() => {
    const executeSearch = async () => {
      if (!queryParam.trim() && !genreParam) {
        setResults([])
        setSearched(false)
        return
      }

      const result = await searchBooks(queryParam, genreParam)
      if (result.success) {
        setResults(result.data.books ?? result.data ?? [])
        setGoogleResults([])
        setSearchPage(result.data.source === 'api' ? 2 : 1)
        setHasMoreResults(true)
      } else {
        showToast(result.error, 'error')
      }
      setSearched(true)
    }
    executeSearch()
  }, [queryParam, genreParam])

  const handleSearchSubmit = (query) => {
    const params = {}
    if (query.trim()) {
      params.query = query.trim()
    }
    if (genreParam) {
      params.genre = genreParam
    }
    setSearchParams(params)
  }

  useEffect(() => {
  if (textInput === queryParam) return 

  const timer = setTimeout(() => {
    const safeTextInput = typeof textInput === 'string' ? textInput : ''
    if (safeTextInput.trim().length > 0 && safeTextInput.trim().length < 3) return 
    const params = {}
    if (safeTextInput.trim()) params.query = safeTextInput.trim()
    if (genreParam) params.genre = genreParam
    setSearchParams(params)
  }, 800)

  return () => clearTimeout(timer)
}, [textInput, genreParam])


  const handleGenreSelect = (genreName) => {
    const params = {}

    if (queryParam.trim()) {
      params.query = queryParam.trim()
    }

    if (genreName !== genreParam) {
      params.genre = genreName
    }

    setSearchParams(params)
  }

  const handleLoadMoreSearch = async () => {
    setLoadingMore(true)
    try {
      const existingIds = [
        ...results.map((b) => b.googleBooksId ?? String(b.id)),
        ...googleResults.map((b) => b.googleBooksId ?? String(b.id)),
      ]
        .filter(Boolean)
        .join(',')

      const { data } = await api.get(
        `/books/search/more?query=${encodeURIComponent(queryParam)}&genre=${encodeURIComponent(genreParam)}&startIndex=${(searchPage - 1) * 10}${existingIds ? `&exclude=${existingIds}` : ''}`
      )

      const newBooks = data.books ?? []
      setGoogleResults((prev) => [...prev, ...newBooks])
      setSearchPage((prev) => prev + 1)
      setHasMoreResults(newBooks.length > 0)
    } catch {
      showToast('Failed to load more results', 'error')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <PageWrapper className="search-page">
      <button 
        onClick={()=>navigate('/home')} 
        className="genre-page__back"
        
      >
        Go back
      </button>
      <div className="search-page__hero">
        <h1 className="search-page__title">
          Seek the Infinite
        </h1>

        <p className="search-page__sub">
          Explore millions of books from our community and beyond
        </p>

        <div className="search-page__search-container">
          <SearchBar
            
            value={textInput}
            placeholder="Search by title or author..."
            className="search-page__combobox"
            onChange={(val) => setTextInput(val)}
            onSearch={(query) => {
              handleSearchSubmit(query)
            }}
          />
        </div>

        <div className="search-page__shelf-wrapper">
          <p className="search-page__shelf-title">
            Browse Genre Shelves
          </p>

          <div className="search-page__shelf-row">
            {genres.map((genre) => {
              const isSelected = genre.name === genreParam

              return (
                <button
                  key={genre.id ?? genre.name}
                  type="button"
                  onClick={() => handleGenreSelect(genre.name)}
                  className={clsx(
                    'search-page__spine-item',
                    isSelected && 'search-page__spine-item--selected'
                  )}
                >
                  <span className="search-page__spine-label">
                    {genre.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {loading && <Spinner />}

      {!loading && searched && results.length === 0 && (
        <div className="search-page__empty-container">
          <p className="search-page__empty-text">
            No books found
            {queryParam && ` for "${queryParam}"`}
            {genreParam && ` in ${genreParam}`}
            .
          </p>

          <p className="search-page__empty-sub">
            Try another search or explore another shelf.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <section className="search-page__results-section">
          <p className="search-page__results-meta">
            Found {results.length} result
            {results.length !== 1 ? 's' : ''}
            {queryParam && ` for "${queryParam}"`}
            {genreParam && ` in ${genreParam}`}
          </p>

          <div className="search-page__layout-grid">
            {results.map((book) => (
              <BookCard
                key={'local-' + (book.googleBooksId ?? book.id)}
                book={book}
                variant="default"
              />
            ))}
          </div>
        </section>
      )}

      {googleResults.length > 0 && (
        <section className="search-page__results-section">
          <p className="search-page__results-meta">
            More result
            {googleResults.length !== 1 ? 's' : ''}
            {queryParam && ` for "${queryParam}"`}
            {genreParam && ` in ${genreParam}`}
          </p>
          <div className="search-page__layout-grid">
            {googleResults.map((book) => (
              <BookCard
                 key={'google-' + (book.googleBooksId ?? book.id)} 
                book={book}
                variant="default"
              />
            ))}
          </div>
        </section>
      )}

      {searched && hasMoreResults && (
        <div className="search-page__load-more">
          <Button
            variant="ghost"
            onClick={handleLoadMoreSearch}
            isLoading={loadingMore}
          >
            Load More results
          </Button>
        </div>
      )}

      {!searched && !loading && (
        <div className="search-page__intro-prompt">
          <p className="search-page__prompt-message">
            Search for a book or browse a genre shelf to begin.
          </p>
        </div>
      )}
    </PageWrapper>
  )
}

export default SearchPage