import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Spinner from "../components/ui/Spinner";
import Skeleton from "../components/ui/Skeleton";
import { useHome } from '../hooks/useHome'
import Button from "../components/ui/Button";
import { useAuthContext } from "../context/AuthContext";
import { useBooks } from '../hooks/useBooks'
import { useToast } from "../context/ToastContext";
import ShelfSection from '../components/dashboard/ShelfSection'
import RecommendationSection from '../components/dashboard/recommendationSection'
import StarRating from '../components/ui/StarRating'
import Avatar from '../components/ui/Avatar'
import PageWrapper from '../components/layout/PageWrapper'
import { Users, BookOpen } from "lucide-react";
import Input from "../components/ui/Input";

const QUOTES = [
  { text: 'A reader lives a thousand lives before he dies.', author: 'George R.R. Martin' },
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
  { text: 'A room without books is like a body without a soul.', author: 'Marcus Tullius Cicero' },
  { text: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
  { text: 'One must always be careful of books, and what is inside them.', author: 'Cassandra Clare' },
  { text: "It is what you read when you don't have to that determines what you will be.", author: 'Oscar Wilde' },
]

const HomePage = () => {
  const { user } = useAuthContext()
  const { getAuthHomeEssential, getAuthHomeExtended, loading, loadingExtended } = useHome()
  const { removeFromShelf, updateProgress } = useBooks()
  const { showToast } = useToast()

  const [currentlyReading, setCurrentlyReading] = useState([])
  const [personalised, setPersonalised] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [recommendationReady, setRecommendationReady] = useState(false)
  const [reviewsUntilRecommendations, setReviewsUntilRecommendations] = useState(0)
  const [communityFeed, setCommunityFeed] = useState([])
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [progressBookId, setProgressBookId] = useState(null)
  const [progressInput, setProgressInput] = useState('')
  const [myClubs, setMyClubs] = useState([])
  const [userGenres, setUserGenres] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const essential = await getAuthHomeEssential()
      if (essential.success) {
        setCurrentlyReading(essential.data.currentlyReading ?? [])
        setMyClubs(essential.data.myClubs ?? [])
        setUserGenres(essential.data.userGenres ?? [])
      }
      
      const extended = await getAuthHomeExtended()
      if (extended.success) {
        setPersonalised(extended.data.personalised ?? [])
        setRecommendations(extended.data.recommendations ?? [])
        setRecommendationReady(extended.data.recommendationReady ?? false)
        setReviewsUntilRecommendations(extended.data.reviewsUntilRecommendations ?? 0)
        setCommunityFeed(extended.data.communityFeed ?? [])
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleRemove = async (bookId) => {
    const result = await removeFromShelf(bookId)
    if (result.success) {
      setCurrentlyReading((prev) => prev.filter((b) => b.id !== bookId))
      showToast('Removed from shelf', 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleOpenProgress = (bookId) => {
    const book = currentlyReading.find((b) => b.id === bookId)
    setProgressBookId(bookId)
    setProgressInput(book?.current_page ?? '')
  }

  const handleSubmitProgress = async (bookId) => {
    const page = parseInt(progressInput)
    const book = currentlyReading.find((b) => b.id === bookId)

    if (isNaN(page) || page < 0) {
      showToast('Enter a valid page number', 'error')
      return
    }
    if (book?.total_pages && page > book.total_pages) {
      showToast(`Page cannot exceed ${book.total_pages}`, 'error')
      return
    }

    const result = await updateProgress(bookId, page)
    if (result.success) {
      setCurrentlyReading((prev) =>
        prev.map((b) =>
          b.id === bookId
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

  const currentQuote = QUOTES[quoteIndex]

  return (
    <PageWrapper>
      <div className="home-page__layout">

        <main className="home-page__main">
          <div className="home-page__header">
            <h1 className="home-page__title">
              Welcome back, <span className="home-page__name">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="home-page__quote">
              "{currentQuote.text}"
              <span className="home-page__quote-author"> — {currentQuote.author}</span>
            </p>
          </div>

          {currentlyReading.length > 0 && (
            <section className="home-page__section">
              <h2 className="home-page__section-title">Continue Reading</h2>
              <ShelfSection
                books={currentlyReading}
                onUpdateProgress={handleOpenProgress}
                onRemove={handleRemove}
              />
              {progressBookId && (
                <div className="home-page__progress-input">
                  <p className="home-page__progress-label">
                    Update page for{' '}
                    <strong>{currentlyReading.find((b) => b.id === progressBookId)?.title}</strong>
                  </p>
                  <div className="home-page__progress-row">
                    <Input
                        type="number"
                        value={progressInput}
                        onChange={(e) => setProgressInput(e.target.value)}
                        placeholder="Current page"
                        min={0}
                        max={currentlyReading.find((b) => b.id === progressBookId)?.total_pages}
                    />
                    <Button variant="primary" size="sm" onClick={() => handleSubmitProgress(progressBookId)}>
                        Save
                    </Button>
                    
                    <Button variant="ghost" size="sm" onClick={() => { setProgressBookId(null); setProgressInput('') }}>
                        Cancel
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {loadingExtended ? (
              <section className="home-page__section">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="home-page__clubs-strip">
                      {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-32" />)}
                  </div>
              </section>
          ) : myClubs.length > 0 && (
            <section className="home-page__section">
              <div className="home-page__section-header">
                <h2 className="home-page__section-title">My Book Clubs</h2>
                <Link to="/clubs" className="home-page__section-link">View All</Link>
              </div>
              <div className="home-page__clubs-strip">
                {myClubs.map((club) => (
                  <Link
                    key={club.id}
                    to={`/clubs/${club.id}`}
                    className="home-page__club-card"
                  >
                    <div className="home-page__club-cover">
                      {club.cover_url
                        ? <img src={club.cover_url} alt={club.name} />
                        : <Users size={20} />
                      }
                      {club.unread_count > 0 && (
                        <span className="home-page__club-unread">
                          {club.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="home-page__club-name">{club.name}</p>
                    {club.current_book_title && (
                      <p className="home-page__club-book">{club.current_book_title}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {loadingExtended ? (
              <section className="home-page__section">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="home-page__genres-list">
                      {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-24" />)}
                  </div>
              </section>
          ) : userGenres.length > 0 && (
            <section className="home-page__section">
              <h2 className="home-page__section-title">Your Favorite Genres</h2>
              <div className="home-page__genres-list">
                {userGenres.map((genre) => (
                  <Link
                    key={genre}
                    to={`/genres/${genre}`}
                    className="home-page__genre-item"
                  >
                    <BookOpen size={16} className="home-page__genre-icon" />
                    {genre}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="home-page__section">
            <h2 className="home-page__section-title">Curated For You</h2>
            {loadingExtended ? (
                <Skeleton className="h-64 w-full" />
            ) : (
                <RecommendationSection
                    recommendationReady={recommendationReady}
                    reviewsUntilRecommendations={reviewsUntilRecommendations}
                    personalised={personalised}
                    recommendations={recommendations}
                />
            )}
          </section>

          {loadingExtended ? (
              <section className="home-page__section">
                  <Skeleton className="h-8 w-48 mb-4" />
                  {[1,2].map(i => <Skeleton key={i} className="h-40 w-full mb-4" />)}
              </section>
          ) : communityFeed.length > 0 && (
            <section className="home-page__section">
              <h2 className="home-page__section-title">Community Reviews</h2>
              <div className="home-page__feed">
                {communityFeed.slice(0,5).map((item, i) => (
                  <div key={i} className="home-page__feed-card">
                    <div className="home-page__feed-book">
                      {item.cover_url && (
                        <img
                          src={item.cover_url}
                          alt={item.title}
                          className="home-page__feed-cover"
                        />
                      )}
                      <div className="home-page__feed-meta">
                       <Link to={`/books/${encodeURIComponent(item.book_id)}`}><p className="home-page__feed-title">{item.title}</p></Link> 
                        <p className="home-page__feed-author">by {item.author}</p>
                        <StarRating value={Number(item.rating)} readOnly size="sm" />
                      </div>
                    </div>
                    <p className="home-page__feed-review">
                      {item.review?.length > 150
                        ? `${item.review.slice(0, 150)}…`
                        : item.review}
                    </p>
                    <div className="home-page__feed-footer">
                      <Link to={`/profile/${item.reviewer_id}`}>
                      <Avatar src={item.reviewer_image} name={item.reviewer_name} size="sm" />
                      <span className="home-page__feed-reviewer">{item.reviewer_name}</span>
                      </Link>
                      <span className="home-page__feed-date">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </PageWrapper>
  )
}

export default HomePage
