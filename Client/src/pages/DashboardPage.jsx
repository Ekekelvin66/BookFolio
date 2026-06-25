import clsx from "clsx";
import { useEffect,useState } from "react";
import StatsCard from "../components/dashboard/StatsCard";
import GenreChart from "../components/dashboard/GenreChart";
import GoalTracker from "../components/dashboard/GoalTracker";
import ReadingProgress from "../components/dashboard/CurrentlyReadimg";
import Spinner from "../components/ui/Spinner";
import StarRating from "../components/ui/StarRating";
import { useAuthContext } from "../context/AuthContext";
import PageWrapper from "../components/layout/PageWrapper";
import {useDashboard} from '../hooks/useDashboard'
import { Link } from "react-router-dom";
import { useToast } from '../context/ToastContext'
import { BookOpen, FileText, Heart, MessageSquare,MessageCircle } from 'lucide-react'

const QUOTES = [
  { text: 'A reader lives a thousand lives before he dies.', author: 'George R.R. Martin' },
  { text: 'Until I feared I would lose it, I never loved to read.', author: 'Harper Lee' },
  { text: 'There is no friend as loyal as a book.', author: 'Ernest Hemingway' },
  { text: 'Reading is to the mind what exercise is to the body.', author: 'Joseph Addison' },
]

const DashBoardPage=()=>{
    const {user}=useAuthContext()
    const {getDashboard,loading}=useDashboard()
    const {showToast}=useToast()

    const [stats,setStats]=useState([])
    const [activeShelf, setActiveShelf] = useState([])
    const [reviews, setReviews] = useState([])
    const [genres, setGenres] = useState([])
    const [quoteIndex, setQuoteIndex] = useState(0)

    useEffect(()=>{
        const fetchData = async (params) => {
            const result= await getDashboard()
            if(result.success){
               setStats(result.data.stats??null)
               setActiveShelf(result.data.activeShelf ?? [])
               setReviews(result.data.reviews ?? [])
               setGenres(result.data.stats?.genreDiversity ?? [])
            }else{
                showToast(result.error,'error')
            }
        }
         fetchData()
    },[])

    useEffect(() => {
        const interval = setInterval(() => {
             setQuoteIndex((prev) => (prev + 1) % QUOTES.length)
        }, 10000)
        return () => clearInterval(interval)
    }, [])
        
    if (loading) return <Spinner fullPage size='lg'/>
     const currentQuote = QUOTES[quoteIndex]

    return(
     <PageWrapper className="dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <h1 className="dashboard-page__title">
             <span className="dashboard-page__name">{`${user?.name?.split(' ')[0]}'s`} Dashboard</span>
          </h1>
          <p className="dashboard-page__quote">
            "{currentQuote.text}"
            <span className="dashboard-page__quote-author"> — {currentQuote.author}</span>
          </p>
        </div>
        <Link to="/shelves" className="dashboard-page__shelf-link">
          View Shelf
        </Link>
      </div>

      <div className="dashboard-page__stats">
        <StatsCard
          label="Books Read"
          value={`${stats?.completedThisYear ?? 0} this year`}
          icon={BookOpen}
          variant="primary"
        />
        <StatsCard
          label="Pages Read"
          value={stats?.totalPagesRead ?? 0}
          icon={FileText}
        />
        <StatsCard
          label="Reviews Written"
          value={reviews.length}
          icon={MessageSquare}
        />
        <StatsCard
          label="Likes Received"
          value={stats?.totalLikes ?? 0}
          icon={Heart}
          variant="accent"
        />
        
        <StatsCard
          label="Comments Received"
          value={stats?.totalComments ?? 0}
          icon={MessageCircle}
          variant="accent"
        />

      </div>

      <div className="dashboard-page__body">
        <main className="dashboard-page__main">
          <GoalTracker
            current={stats?.completedThisYear ?? 0}
            goal={stats?.yearlyGoal ?? 0}
          />

          <GenreChart genres={genres} className="dashboard-page__genre-chart" />

          {reviews.length > 0 && (
            <section className="dashboard-page__section">
              <h2 className="dashboard-page__section-title">Your Reviews</h2>
              <div className="dashboard-page__reviews">
                {reviews.map((review) => (
                  <Link
                    key={review.id}
                    to={`/books/${review.book_id}`}
                    className="dashboard-page__review-card"
                  >
                    {review.cover_url && (
                      <img
                        src={review.cover_url}
                        alt={review.title}
                        className="dashboard-page__review-cover"
                      />
                    )}
                    <div className="dashboard-page__review-body">
                      <p className="dashboard-page__review-title">{review.title}</p>
                      <p className="dashboard-page__review-author">{review.author}</p>
                      <StarRating value={Number(review.rating)} readOnly size="sm" />
                      {review.review_text && (
                        <p className="dashboard-page__review-excerpt">
                          {review.review_text.length > 120
                            ? `${review.review_text.slice(0, 120)}…`
                            : review.review_text}
                        </p>
                      )}
                      <span className="dashboard-page__review-date">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="dashboard-page__aside">
          <h2 className="dashboard-page__section-title">Currently Reading</h2>
          <ReadingProgress books={activeShelf} />
        </aside>
      </div>
    </PageWrapper>
    )
}
export default DashBoardPage