import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import BookCard from '../components/book/BookCard'
import PageWrapper from '../components/layout/PageWrapper'
import clsx from 'clsx'

const GenrePage = () => {
  const navigate = useNavigate()
  const { genreName } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()

  const pageParam = Math.max(parseInt(searchParams.get('page')) || 1, 1)

  const [genre, setGenre] = useState(null)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const runFetch = async (pageNum) => {
    setLoading(true)
    setNotFound(false)
    try {
      const { data } = await api.get(`/genres/${encodeURIComponent(genreName)}?page=${pageNum}`)
      setGenre(data.genre)
      setBooks(data.books ?? [])
      setHasNextPage(data.hasMore ?? false)
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true)
      else showToast('Failed to load genre', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runFetch(pageParam)
  }, [genreName, pageParam])

  const goToPage = (nextPage) => {
    if (nextPage < 1) return
    const params = {}
    if (nextPage > 1) params.page = nextPage
    setSearchParams(params)
  }

  const renderPageNumbers = () => {
    const pages = []
    if (pageParam > 1) pages.push(pageParam - 1)
    pages.push(pageParam)
    if (hasNextPage) pages.push(pageParam + 1)

    return pages.map((pageNum) => (
      <button
        key={pageNum}
        type="button"
        onClick={() => goToPage(pageNum)}
        className={clsx(
          'genre-page__pagination-number',
          pageNum === pageParam && 'genre-page__pagination-number--active'
        )}
        disabled={loading}
      >
        {pageNum}
      </button>
    ))
  }

  if (loading && books.length === 0) return <Spinner fullPage size='lg' />

  if (notFound) {
    return (
      <PageWrapper>
        <div className="genre-page__not-found">
          <p>Genre not found.</p>
          <button onClick={() => navigate(-1)} className="genre-page__back">
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="genre-page">
      <div className="genre-page__hero">
        <button onClick={() => navigate(-1)} className="genre-page__back">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="genre-page__title">{genre?.name}</h1>
        <p className='genre-page__sub'>{genre?.description}</p>
      </div>

      {books.length > 0 ? (
        <section className="genre-page__section">
          {loading ? <Spinner size='md' fullPage /> : (
            <div className="genre-page__grid">
              {books.map((book) => (
                <BookCard
                  key={(book.source ?? 'x') + '-' + (book.googleBooksId ?? book.id)}
                  book={book}
                  variant="default"
                />
              ))}
            </div>
          )}

          <div className="genre-page__pagination">
            <button
              type="button"
              className="genre-page__pagination-arrow"
              onClick={() => goToPage(pageParam - 1)}
              disabled={pageParam === 1 || loading}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {renderPageNumbers()}

            <button
              type="button"
              className="genre-page__pagination-arrow"
              onClick={() => goToPage(pageParam + 1)}
              disabled={!hasNextPage || loading}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      ) : (
        <p className="genre-page__empty">No books found for this genre yet.</p>
      )}
    </PageWrapper>
  )
}

export default GenrePage