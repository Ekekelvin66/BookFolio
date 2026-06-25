import { useEffect, useState } from 'react'
import { useParams, Link,useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import BookCard from '../components/book/BookCard'
import PageWrapper from '../components/layout/PageWrapper'

const GenrePage = () => {
  const navigate= useNavigate()
  const { genreName } = useParams()
  const { showToast } = useToast()
  const [genre, setGenre] = useState(null)
  const [books, setBooks] = useState([])
  const [discovery, setDiscovery] = useState([])
  const [loading, setLoading] = useState(true)
  const [moreBooks, setMoreBooks] = useState([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [morePage, setMorePage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [notFound, setNotFound] = useState(false)


  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setMoreBooks([])
      setMorePage(1)
      setHasMore(true)
      setNotFound(false)

      try {
        const { data } = await api.get(`/genres/${encodeURIComponent(genreName)}`)
        setGenre(data.genre)
        setBooks(data.books ?? [])
        setDiscovery(data.discovery ?? [])
        setMorePage(2)
      } catch (err) { 
        if (err.response?.status === 404) setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [genreName])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const existingIds = [
        ...books.map((b) => b.googleBooksId ?? String(b.id)),
        ...discovery.map((b) => b.googleBooksId ?? String(b.id)),
        ...moreBooks.map((b) => b.googleBooksId ?? String(b.id)),
      ]
        .filter(Boolean)
        .join(',')

      const { data } = await api.get(
        `/genres/${encodeURIComponent(genreName)}/more?page=${morePage}${existingIds ? `&exclude=${existingIds}` : ''}`
      )

      const newBooks = data.books ?? []
      setMoreBooks((prev) => [...prev, ...newBooks])
      setMorePage((prev) => prev + 1)
      setHasMore(newBooks.length > 0)
    } catch {
      showToast('Failed to load more books', 'error')
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) return <Spinner fullPage size='lg' />

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
        <p className="genre-page__sub">
          Top rated {genre?.name} books from our community
        </p>
      </div>

      {books.length > 0 ? (
        <section className="genre-page__section">
          <div className="genre-page__grid">
            {books.map((book) => (
              <BookCard key={book.id} book={book} variant="default" />
            ))}
          </div>
        </section>
      ) : (
        <p className="genre-page__empty">
          No community books for  this genre yet.
        </p>
      )}

      {discovery.length > 0 && (
        <section className="genre-page__section">
          <h2 className="genre-page__section-title">Discover More {genre?.name}</h2>
          <div className="genre-page__grid">
            {discovery.map((book, i) => (
              <BookCard key={book.googleBooksId ?? i} book={book} variant="minimal" />
            ))}
          </div>
        </section>
       )} 

        {moreBooks.length > 0 && (
            <section className="genre-page__section">
              <h2 className="genre-page__section-title">More {genre?.name} Books </h2>
              <div className="genre-page__grid">
                {moreBooks.map((book, i) => (
                  <BookCard key={book.googleBooksId ?? i} book={book} variant="minimal" />
                ))}
              </div>
            </section>
          )}

        {hasMore && (
          <div className="genre-page__load-more">
            <Button
              variant="ghost"
              onClick={handleLoadMore}
              isLoading={loadingMore}
            >
              {moreBooks.length === 0 ? 'Load More Books' : 'Load Even More'}
            </Button>
          </div>
        )}
    </PageWrapper>
  )
}

export default GenrePage