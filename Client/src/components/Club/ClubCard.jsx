import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Users, BookOpen, Lock } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'

const ClubCard = ({
  club = {},
  onJoin,
  onRequest,
  variant = 'default',
  className,
}) => {
  const {
    id,
    name,
    _motto,
    description,
    cover_url,
    member_count = 0,
    is_private = false,
    is_member = false,
    request_status,
    current_book_title,
    current_book_author,
  } = club

  const handleJoinClick = (e) => {
    e.preventDefault()
     onJoin?.(id,is_private)
  }

  const joinLabel = () => {
    if (is_member) return null
    if (request_status === 'pending') return 'Requested'
    if (request_status === 'rejected') return 'Rejected'
    return is_private ? 'Request to Join' : 'Join Club'
  }

  if (variant === 'featured') {
    return (
      <div className={clsx('club-card', 'club-card--featured', className)}>
        <div className="club-card__featured-cover">
          {cover_url ? (
            <img src={cover_url} alt={name} className="club-card__cover-img" />
          ) : (
            <div className="club-card__cover-fallback">
              <BookOpen size={32} />
            </div>
          )}
          <span className="club-card__featured-badge">FEATURED</span>
        </div>

        <div className="club-card__featured-body">
          <div className="club-card__featured-header">
            <h2 className="club-card__featured-name">{name}</h2>
            <div className="club-card__featured-members">
              <Users size={13} />
              <span>{Number(member_count).toLocaleString()} Members</span>
            </div>
          </div>

          {description && (
            <p className="club-card__featured-desc">{description}</p>
          )}

          {current_book_title && (
            <div className="club-card__current-read">
              <span className="club-card__current-label">CURRENTLY READING</span>
              <p className="club-card__current-title">
                {current_book_author} — <em>{current_book_title}</em>
              </p>
            </div>
          )}

          <div className="club-card__featured-actions">
            {!is_member && joinLabel() && (
              <Button
                variant="primary"
                onClick={handleJoinClick}
                disabled={request_status === 'pending' || request_status === 'rejected'}
              >
                {joinLabel()}
              </Button>
            )}
         
            <Link to={`/clubs/${id}`}>
               <Button variant="ghost" >View Detail</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

 
  return (
    <Link
      to={`/clubs/${id}`}
      className={clsx('club-card', 'club-card--default', className)}
    >
      <div className="club-card__cover-wrap">
        {cover_url ? (
          <img src={cover_url} alt={name} className="club-card__cover-img" />
        ) : (
          <div className="club-card__cover-fallback">
            <BookOpen size={24} />
          </div>
        )}
        {is_private && (
          <span className="club-card__private-badge">
            <Lock size={10} /> Private
          </span>
        )}
      </div>

      <div className="club-card__body">
        <h3 className="club-card__name">{name}</h3>
        {description && (
          <p className="club-card__desc">
            {description.length > 80 ? `${description.slice(0, 80)}…` : description}
          </p>
        )}

        <div className="club-card__footer">
          {current_book_title && (
            <div className="club-card__reading">
              <span className="club-card__reading-label">Reading:</span>
              <span className="club-card__reading-title">
                <em>{current_book_title}</em>
              </span>
            </div>
          )}

          {!is_member && joinLabel() && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleJoinClick}
              disabled={request_status === 'pending' || request_status === 'rejected'}
            >
              {is_private ? <Lock size={11} /> : null}
              {joinLabel()}
            </Button>
          )}

          {is_member && (
            <span className="club-card__member-badge">Member</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ClubCard