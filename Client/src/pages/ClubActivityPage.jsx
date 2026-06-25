import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useClubFeed } from '../hooks/useClubFeed'
import { useReviews } from '../hooks/useReviews'
import { useComments } from '../hooks/useComments'
import { FeedItem } from '../components/Club/ClubFeedCards'
import PageWrapper from '../components/layout/PageWrapper'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { ArrowLeft } from 'lucide-react'

const ClubActivityPage = () => {
  const { clubId } = useParams()
  const { getActivityFeed, loading } = useClubFeed()
  const { likeReview, unlikeReview } = useReviews()
  const { likeComment, unlikeComment } = useComments()

  const [feedItems, setFeedItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)

  const loadFeed = async (cursorVal = null) => {
    const result = await getActivityFeed(clubId, cursorVal)
    if (result.success) {
      const items = result.data.activity
      setFeedItems((prev) => (cursorVal ? [...prev, ...items] : items))
      setCursor(result.data.next_cursor)
      setHasMore(result.data.has_more)
    }
  }

  useEffect(() => {
    loadFeed(null)
  }, [clubId])

  const handleLike = async (item) => {
    const liked = item.is_liked
    let fn = item.activity_type === 'review' 
      ? (liked ? unlikeReview : likeReview)
      : (liked ? unlikeComment : likeComment)
    
    const result = item.activity_type === 'review'
      ? await fn(item.id)
      : await fn(item.parent.id, item.id)

    if (result.success) {
      setFeedItems((prev) =>
        prev.map((f) =>
          f.id === item.id && f.activity_type === item.activity_type
            ? { ...f, is_liked: !liked, like_count: liked ? f.like_count - 1 : f.like_count + 1 }
            : f
        )
      )
    }
  }

  return (
    <PageWrapper className="club-activity-page">
      <div className="club-activity-page__header">
        <Link to={`/clubs/${clubId}`} className="club-activity-page__back">
          <ArrowLeft size={16} /> Back to Club
        </Link>
        <h1 className="club-activity-page__title">Club Activity Feed</h1>
      </div>

      <div className="club-activity-page__body">
        {loading && feedItems.length === 0 ? (
          <Spinner size='md' />
        ) : (
          <div className="club-activity-page__feed">
            {feedItems.map((item) => (
              <FeedItem
                key={`${item.activity_type}-${item.id}`}
                item={item}
                onLike={handleLike}
              />
            ))}

            {hasMore && (
              <div className="club-activity-page__load-more">
                <Button
                  variant="ghost"
                  onClick={() => loadFeed(cursor)}
                  isLoading={loading}
                >
                  Load Older Archives
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

export default ClubActivityPage