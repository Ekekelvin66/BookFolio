import Modal from '../components/ui/Modal'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link,useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { useAuthContext } from '../context/AuthContext'
import { useBookClubs } from '../hooks/useClubs'
import { useClubFeed } from '../hooks/useClubFeed'
import { useReviews } from '../hooks/useReviews'
import {useComments} from '../hooks/useComments'
import { useToast } from '../context/ToastContext'
import { FeedItem } from '../components/Club/ClubFeedCards'
import PageWrapper from '../components/layout/PageWrapper'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { Settings, MessageSquare, Users, BookOpen,} from 'lucide-react'


const ClubPage = () => {
  const location =useLocation()
  const { clubId }   = useParams()
  const navigate     = useNavigate()
  const { user,isAuthenticated }     = useAuthContext()
  const { showToast } = useToast()

  const { getClub, joinClub, requestToJoin, leaveClub, loading: clubLoading } = useBookClubs()
  const { getActivityFeed, getBookFeed, loading: feedLoading } = useClubFeed()
  const { likeReview, unlikeReview } = useReviews()
  const {likeComment,unlikeComment} =useComments()

  const [club,        setClub]        = useState(null)
  const [currentBook, setCurrentBook] = useState(null)
  const [members,     setMembers]     = useState([])
  const [readingList, setReadingList] = useState([])
  const [isPreview,   setIsPreview]   = useState(false)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

  const [feedItems,  setFeedItems]  = useState([])
  const [activeFeed, setActiveFeed] = useState('activity')
  const [cursor,     setCursor]     = useState(null)
  const [hasMore,    setHasMore]    = useState(false)
  const [visibleCount,setVisibleCount]=useState(4)
  useEffect(() => {
    const fetchClub = async () => {
      const result = await getClub(clubId)
      if (result.success) {
        setClub(result.data.club)
        setCurrentBook(result.data.current_book ?? null)
        setMembers(result.data.members ?? [])
        setReadingList(result.data.reading_list ?? [])
        setIsPreview(result.data.is_preview ?? false)
      } else if(result.error && !result.error.includes('abort') && result.error !== 'canceled') {
        showToast(result.error, 'error')
        navigate('/clubs')
      }
    }
    fetchClub()
  }, [clubId])
  
  useEffect(() => {
  setVisibleCount(4)
}, [clubId, activeFeed])

  const loadFeed = async (feedType, cursorVal = null) => {
    const result = feedType === 'activity'
      ? await getActivityFeed(clubId, cursorVal)
      : await getBookFeed(clubId, cursorVal)

    if (result.success) {
      const items = result.data.activity
      setFeedItems((prev) => cursorVal ? [...prev, ...items] : items)
      setCursor(result.data.next_cursor)
      setHasMore(result.data.has_more)
    }
  }

  useEffect(() => {
    if (!club?.is_member) return
    setFeedItems([])
    setCursor(null)
    setHasMore(false)
    loadFeed(activeFeed, null)
  }, [clubId, activeFeed, club?.is_member])


  const handleLike = async (item) => {
    const liked = item.is_liked
    let fn   
    let result
    if (item.activity_type === 'review') {
    fn = liked ? unlikeReview : likeReview
     result = await fn(item.id)
    }

    if (item.activity_type === 'comment') {
    fn = liked ? unlikeComment : likeComment
     result = await fn(item.parent.id,item.id)
    }
    

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

 
  const handleJoin = async () => {
    const result = club?.is_private
      ? await requestToJoin(clubId)
      : await joinClub(clubId)

    if (result.success) {
      setClub((prev) => ({
        ...prev,
        is_member:      !club?.is_private,
        request_status: club?.is_private ? 'pending' : null,
      }))
      showToast(club?.is_private ? 'Join request sent!' : 'Joined club!', 'success')
    } else {
      showToast(result.error, 'error')
    }
  }

  const handleLeave = async () => {
    const result = await leaveClub(clubId)
    if (result.success) {
      showToast('Left club', 'success')
      navigate('/clubs')
    } else {
      showToast(result.error, 'error')
    }
  }

  if (clubLoading || !club) return <Spinner fullPage size='lg' />

  const isOwner        = club.my_role === 'owner'
  const isMember       = club.is_member
  const founded        = new Date(club.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const visibleMembers = members.slice(0, 4)
  const extraMembers   = Math.max(0, Number(club.member_count) - 4)

  return (
    <PageWrapper className="club-page">

      <div className="club-page__header">
        <div className="club-page__header-left">
          <div className="club-page__title-row">
            <h1 className="club-page__title">{club.name}</h1>
            {isOwner && (
              <Link to={`/clubs/${clubId}/settings`} className="club-page__settings-btn">
                <Settings size={18} />
              </Link>
            )}
          </div>

          {club.motto && (
            <p className="club-page__motto">"{club.motto}"</p>
          )}

          <div className="club-page__meta">
            <span>{club.member_count} SCHOLARS JOINED</span>
            <span className="club-page__meta-dot">•</span>
            <span>FOUNDED {founded.toUpperCase()}</span>
          </div>
        </div>

        <div className="club-page__header-actions">
          {isMember && (
            <Button
              variant="primary"
              leftIcon={<MessageSquare size={15} />}
              onClick={() => navigate(`/clubs/${clubId}/chat`)}
            >
              Go to Club Chat
            </Button>
          )}
          {!isMember && club.request_status !== 'pending' && (
            <Button variant="primary" onClick={handleJoin}>
              {club.is_private ? 'Request to Join' : 'Join Club'}
            </Button>
          )}
          {!isMember && club.request_status === 'pending' && (
            <Button variant="ghost" disabled>Request Pending</Button>
          )}
        </div>
      </div>

     
      <div className="club-page__body">
        <main className="club-page__main">

          {currentBook && (
            <section className="club-page__section club-page__current-read">
              <p className="club-page__section-label">CURRENT READ</p>
              <div className="club-page__current-book">
                <div className="club-page__current-cover-wrap">
                  {currentBook.cover_url ? (
                    <img
                      src={currentBook.cover_url}
                      alt={currentBook.title}
                      className="club-page__current-cover"
                    />
                  ) : (
                    <div className="club-page__current-cover-fallback">
                      <BookOpen size={32} />
                    </div>
                  )}
                </div>

                <div className="club-page__current-info">
                  <Link to={`/books/${currentBook.id}`}><h2 className="club-page__current-title">{currentBook.title}</h2></Link>
                  <p className="club-page__current-author">by {currentBook.author}</p>
                  {currentBook.current_chapter && (
                    <div className="club-page__progress">
                      <div className="club-page__progress-bar">
                        <div className="club-page__progress-fill" style={{ width: '64%' }} />
                      </div>
                      <div className="club-page__progress-footer">
                        <span className="club-page__chapter">{currentBook.current_chapter}</span>
                        {isMember && (
                          <span className="club-page__live-badge">LIVE CHAT ACTIVE</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {isMember && (
            <section className="club-page__section">
              <div className="club-page__feed-header">
                <h2 className="club-page__section-title">Club Activity</h2>
                <div className="club-page__tabs">
                  <button
                    className={clsx('club-page__tab', activeFeed === 'activity' && 'club-page__tab--active')}
                    onClick={() => setActiveFeed('activity')}
                  >
                    All Activity
                  </button>
                  <button
                    className={clsx('club-page__tab', activeFeed === 'book' && 'club-page__tab--active')}
                    onClick={() => setActiveFeed('book')}
                  >
                    Reading List
                  </button>
                </div>
              </div>

              {feedLoading && feedItems.length === 0 ? (
                  <Spinner />
                ) : feedItems.length === 0 ? (
                  <p className="club-page__empty">
                    No activity yet. Be the first to post a review!
                  </p>
                ) : (
                  <div className="club-page__feed">
                    {/* Slice dynamically using our visibleCount state */}
                    {feedItems.slice(0, visibleCount).map((item) => (
                      <FeedItem
                        key={`${item.activity_type}-${item.id}`}
                        item={item}
                        onLike={handleLike}
                      />
                    ))}

                    {feedItems.length > visibleCount && (
                      <div className="club-page__feed-action">
                        {visibleCount === 4 ? (
                          <Button
                            variant="ghost"
                            onClick={() => setVisibleCount(8)}
                          >
                            View More
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() => navigate(`/clubs/${clubId}/activity`)}
                          >
                            View All
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
            </section>
          )}

          {isPreview && (
            <section className="club-page__section club-page__preview-cta">
              <div className="club-page__preview-inner">
                <Users size={32} className="club-page__preview-icon" />
                <h2 className="club-page__preview-title">Join to see full activity</h2>
                <p className="club-page__preview-sub">
                  {/* {members.slice(0, 3).map((m) => m.name).join(', ')}
                  {members.length > 3 && ` and ${Number(club.member_count) - 3} others`} are discussing great books. */}
                </p>
                <Button variant="primary" onClick={handleJoin}>
                  {club.is_private ? 'Request to Join' : 'Join This Circle'}
                </Button>
              </div>
            </section>
          )}
        </main>

        <aside className="club-page__aside">

          {readingList.length > 0 && (
            <div className="club-page__aside-section">
              <p className="club-page__aside-label">READING LIST</p>
              <div className="club-page__reading-list">
                {readingList.filter((b) => !b.is_current).slice(0, 3).map((book) => (
                  <Link key={book.id} to={`/books/${book.id}`} className="club-page__reading-item">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="club-page__reading-cover" />
                    ) : (
                      <div className="club-page__reading-cover-fallback">
                        <BookOpen size={14} />
                      </div>
                    )}
                    <div className="club-page__reading-info">
                      <p className="club-page__reading-title">{book.title}</p>
                      <p className="club-page__reading-sub">
                        {new Date(book.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="club-page__aside-section">
            <div className="club-page__aside-header">
              <p className="club-page__aside-label">MEMBERS</p>
              <span className="club-page__aside-count">{club.member_count} TOTAL</span>
            </div>
            <div className="club-page__members-row">
              {visibleMembers.map((m) => (
                <Link key={m.id} to={`/profile/${m.id}`}>
                  <Avatar
                    src={m.image_url}
                    name={m.name}
                    color={m.avatar_color}
                    size="md"
                    className="club-page__member-avatar"
                  />
                </Link>
              ))}
              {extraMembers > 0 && (
                <div className="club-page__members-extra">+{extraMembers}</div>
              )}
            </div>
          </div>

          {club.description && (
            <div className="club-page__charter">
              <p className="club-page__charter-eyebrow">ESTABLISHED FOR THE PURSUIT OF SCHOLARLY TRUTH</p>
              <h3 className="club-page__charter-title">Scholarly Charter</h3>
              <p className="club-page__charter-text">"{club.description}"</p>
            </div>
          )}
          {isAuthenticated ? (
            <>
              {isMember && !isOwner && (
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="club-page__leave-btn"
                >
                  Leave Club
                </Button>
              )}
              {!isMember && (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleJoin}
                  className="club-page__join-btn"
                >
                  Join Club
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => navigate('/login?redirect=' + encodeURIComponent(location.pathname))}
              className="club-page__login-prompt-btn"
            >
              Login to Join Club
            </Button>
          )}
        </aside>
      </div>
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Leave Club"
      >
        <p>Are you sure you want to leave this club?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <Button variant="ghost" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleLeave}>Leave Club</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}

export default ClubPage