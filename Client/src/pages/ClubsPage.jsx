import { useEffect, useState } from 'react'
import { useAuthContext } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useBookClubs } from '../hooks/useClubs'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import PageWrapper from '../components/layout/PageWrapper'
import ClubCard from '../components/Club/ClubCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Users, Plus, Search, BookOpen, MessageSquare } from 'lucide-react'
import clsx from 'clsx'


const MyClubsTab = () => {
  const { getMyClubs, loading } = useBookClubs()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [clubs, setClubs] = useState([])

  useEffect(() => {
    const fetch = async () => {
      const result = await getMyClubs()
      if (result.success) {
        setClubs(result.data.clubs ?? [])
      } else {
        showToast(result.error, 'error')
      }
    }
    fetch()
  }, [])

  if (loading) return <Spinner />

  if (clubs.length === 0) {
    return (
      <div className="clubs-page__empty">
        <Users size={36} />
        <p className="clubs-page__empty-title">You haven't joined any clubs yet</p>
        <p className="clubs-page__empty-sub">
          Discover literary circles and connect with fellow readers.
        </p>
        <Button
          variant="primary"
          leftIcon={<Search size={14} />}
          onClick={() => {/* switch to Discover tab handled by parent */}}
        >
          Discover Clubs
        </Button>
      </div>
    )
  }

  return (
    <div className="clubs-page__my-clubs">
      {clubs.map((club) => (
        <div key={club.id} className="clubs-page__my-club-card">
          <div className="clubs-page__my-club-cover">
            {club.cover_url ? (
              <img src={club.cover_url} alt={club.name} />
            ) : (
              <div className="clubs-page__my-club-cover-fallback">
                <Users size={24} />
              </div>
            )}
          </div>

          <div className="clubs-page__my-club-info">
            <div className="clubs-page__my-club-header">
              <h3 className="clubs-page__my-club-name">{club.name}</h3>
              <span className="clubs-page__my-club-role">{club.role}</span>
              {club.unread_count > 0 && (
                <span className="clubs-page__my-club-unread">
                  {club.unread_count > 99 ? '99+' : club.unread_count}
                </span>
              )}
            </div>

            {club.current_book_title && (
              <p className="clubs-page__my-club-book">
                <BookOpen size={12} />
                Reading: <em>{club.current_book_title}</em>
                {club.current_book_author && ` by ${club.current_book_author}`}
              </p>
            )}

            <p className="clubs-page__my-club-members">
              {club.member_count} member{club.member_count !== 1 ? 's' : ''}
            </p>

            {club.last_message_text && (
              <p className="clubs-page__my-club-last-msg">
                <span className="clubs-page__my-club-last-sender">
                  {club.last_sender_name}:
                </span>{' '}
                {club.last_message_text.length > 60
                  ? `${club.last_message_text.slice(0, 60)}…`
                  : club.last_message_text}
              </p>
            )}
          </div>

          <div className="clubs-page__my-club-actions">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<MessageSquare size={13} />}
              onClick={() => navigate(`/messages/club/${club.id}`)}
            >
              Go to Chat
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/clubs/${club.id}`)}
            >
              Go to Club
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}


const DiscoverTab = () => {
  const { getClubs, getClubGenres, joinClub, requestToJoin, loading } = useBookClubs()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [clubs, setClubs] = useState([])
  const [genres, setGenres] = useState([])
  const [activeGenre, setActiveGenre] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchGenres = async () => {
      const result = await getClubGenres()
      if (result.success) setGenres(result.data.genres ?? [])
    }
    fetchGenres()
  }, [])

  useEffect(() => {
    const delay = setTimeout(async () => {
      const result = await getClubs(activeGenre, searchQuery)
      if (result.success) {
        setClubs(result.data.clubs ?? [])
      } else {
        showToast(result.error, 'error')
      }
    }, 300)
    return () => clearTimeout(delay)
  }, [activeGenre, searchQuery])

  const handleJoin = async (clubId, isPrivate) => {
    if (isPrivate) {
      const result = await requestToJoin(clubId)
      if (result.success) {
        setClubs((prev) =>
          prev.map((c) => c.id === clubId ? { ...c, request_status: 'pending' } : c)
        )
        showToast('Join request sent!', 'success')
      } else {
        showToast(result.error, 'error')
      }
    } else {
      const result = await joinClub(clubId)
      if (result.success) {
        setClubs((prev) =>
          prev.map((c) => c.id === clubId ? { ...c, is_member: true } : c)
        )
        showToast('Joined club!', 'success')
      } else {
        showToast(result.error, 'error')
      }
    }
  }

  

  const featuredClub  = clubs[0] ?? null
  const sideClub      = clubs[1] ?? null
  const gridClubs     = clubs.slice(2)

  return (
    <div className="clubs-page__discover">
      <div className="clubs-page__search-bar">
        <Input
          placeholder="Search clubs..."
          leftIcon={<Search size={15} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="clubs-page__tabs">
        <button
          className={clsx('clubs-page__tab', !activeGenre && 'clubs-page__tab--active')}
          onClick={() => setActiveGenre(null)}
        >
          All
        </button>
        {genres.map((genre) => (
          <button
            key={genre}
            className={clsx('clubs-page__tab', activeGenre === genre && 'clubs-page__tab--active')}
            onClick={() => setActiveGenre(genre === activeGenre ? null : genre)}
          >
            {genre}
          </button>
        ))}
      </div>

      {loading && <Spinner />}

      {!loading && clubs.length === 0 && (
        <div className="clubs-page__empty">
          <Users size={36} />
          <p className="clubs-page__empty-title">No clubs found</p>
          <p className="clubs-page__empty-sub">
            {activeGenre
              ? `No clubs in ${activeGenre} yet.`
              : 'Be the first to create a literary circle.'}
          </p>
          <Button
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={() => navigate('/clubs/new')}
          >
            Create a Club
          </Button>
        </div>
      )}

      {!loading && clubs.length > 0 && (
        <div className="clubs-page__content">
          <div className="clubs-page__main">
            {featuredClub && (
              <ClubCard
                club={featuredClub}
                variant="featured"
                onJoin={handleJoin}
                className="clubs-page__featured"
              />
            )}
            {gridClubs.length > 0 && (
              <div className="clubs-page__grid">
                {gridClubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    variant="default"
                    onJoin={handleJoin}
                  />
                ))}
              </div>
            )}
          </div>

          {sideClub && (
            <aside className="clubs-page__aside">
              <ClubCard
                club={sideClub}
                variant="default"
                onJoin={handleJoin}
              />
            </aside>
          )}
        </div>
      )}
    </div>
  )
}


const TABS = [
  { key: 'my-clubs',  label: 'My Clubs' },
  { key: 'discover',  label: 'Discover' },
]

const ClubsPage = () => {
  const {isAuthenticated}= useAuthContext()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('my-clubs')

  return (
    <PageWrapper className="clubs-page">
      <div className="clubs-page__header">
        <div className="clubs-page__header-left">
          <h1 className="clubs-page__title">Book Clubs</h1>
          <p className="clubs-page__subtitle">
            Your literary circles and communities
          </p>
        </div>
        {isAuthenticated ? (
          <Button onClick={() => navigate('/clubs/new')}>
            Create a Club
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={() => navigate('/login?redirect=/clubs')}
          >
            Sign in to create a club
          </Button>
        )}
      </div>

      
      <div className="clubs-page__main-tabs">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={clsx(
              'clubs-page__main-tab',
              activeTab === key && 'clubs-page__main-tab--active'
            )}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'my-clubs' && <MyClubsTab />}
      {activeTab === 'discover' && <DiscoverTab />}
    </PageWrapper>
  )
}

export default ClubsPage