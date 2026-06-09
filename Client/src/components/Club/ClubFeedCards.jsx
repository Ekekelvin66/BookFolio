import { Link } from 'react-router-dom'
import { Heart, MessageSquare, CornerDownRight, ExternalLink } from 'lucide-react'
import clsx from 'clsx'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import StarRating from '../ui/StarRating'

const formatTime = (iso) => {
  if (!iso) return ''
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const truncate = (text, max = 100) =>
  text?.length > max ? `${text.slice(0, max)}…` : text


// ── REVIEW CARD ────────────────────────────────────────────────────────────

export const ReviewActivityCard = ({ item, onLike }) => (
  <div className={clsx('activity-card', 'activity-card--review')}>
    <span className="activity-card__badge activity-card__badge--review">Review</span>

    <div className="activity-card__header">
      <Avatar
      src={item.actor.image_url}
        name={item.actor.name}
        color={item.actor.avatar_color}
        size="sm"
        className="activity-card__avatar"
      />
      <div className="activity-card__header-text">
        <Link to={`/profile/${item.actor.id}`} className="activity-card__actor">
          {item.actor.name}
        </Link>
        <span className="activity-card__action"> reviewed </span>
        <Link to={`/books/${item.book.id}`} className="activity-card__book">
          <em>{item.book.title}</em>
        </Link>
      </div>
      <span className="activity-card__time">{formatTime(item.created_at)}</span>
    </div>

    {item.rating && (
      <StarRating value={item.rating} readOnly size="sm" className="activity-card__rating" />
    )}

    <p className="activity-card__content">{item.content}</p>

    <div className="activity-card__actions">
      <Button
        variant={item.is_liked ? 'primary' : 'ghost'}
        size="sm"
        leftIcon={<Heart size={12} />}
        onClick={() => onLike(item)}
      >
        {item.like_count} {item.like_count === 1 ? 'Like' : 'Likes'}
      </Button>

      {/* Comments — redirect to book page with review anchor */}
      <Link
        to={`/books/${item.book.id}?review=${item.id}`}
        className="activity-card__comments-link"
        title="View full discussion on book page"
      >
        <MessageSquare size={12} />
        <span>{item.comment_count} {item.comment_count === 1 ? 'Comment' : 'Comments'}</span>
        <ExternalLink size={10} className="activity-card__comments-link-icon" />
      </Link>
    </div>
  </div>
)


// ── COMMENT CARD ───────────────────────────────────────────────────────────

export const CommentActivityCard = ({ item, onLike }) => (
  <div className={clsx('activity-card', 'activity-card--comment')}>
    <span className="activity-card__badge activity-card__badge--comment">Comment</span>

    <div className="activity-card__header">
      <Avatar
      src={item.actor.image_url}
        name={item.actor.name}
        color={item.actor.avatar_color}
        size="sm"
        className="activity-card__avatar"
      />
      <div className="activity-card__header-text">
        <Link to={`/profile/${item.actor.id}`} className="activity-card__actor">
          {item.actor.name}
        </Link>
        <span className="activity-card__action"> commented on </span>
        <Link to={`/books/${item.book.id}`} className="activity-card__book">
          <em>{item.book.title}</em>
        </Link>
      </div>
      <span className="activity-card__time">{formatTime(item.created_at)}</span>
    </div>

    {item.parent?.snippet && (
      <blockquote className="activity-card__parent">
        <span className="activity-card__parent-label">On review: </span>
        {truncate(item.parent.snippet)}
      </blockquote>
    )}

    <p className="activity-card__content">{item.content}</p>

    <div className="activity-card__actions">
      <Button
        variant={item.is_liked ? 'primary' : 'ghost'}
        size="sm"
        leftIcon={<Heart size={12} />}
        onClick={() => onLike(item)}
      >
        {item.like_count} {item.like_count === 1 ? 'Like' : 'Likes'}
      </Button>

      {/* Reply — redirect with tooltip warning */}
      <div className="activity-card__reply-wrap">
        <Link
          to={`/books/${item.book.id}?review=${item.parent?.id}`}
          className="activity-card__reply-link"
        >
          <CornerDownRight size={12} />
          <span>Reply</span>
          <ExternalLink size={10} className="activity-card__comments-link-icon" />
        </Link>
        <span className="activity-card__reply-tooltip">
          You'll be taken to the full conversation on the book page
        </span>
      </div>
    </div>
  </div>
)


// ── REPLY CARD ─────────────────────────────────────────────────────────────

export const ReplyActivityCard = ({ item }) => (
  <div className={clsx('activity-card', 'activity-card--reply')}>
    <span className="activity-card__badge activity-card__badge--reply">Reply</span>

    <div className="activity-card__header">
      <Avatar
      src={item.actor.image_url}
        name={item.actor.name}
        color={item.actor.avatar_color}
        size="sm"
        className="activity-card__avatar"
      />
      <div className="activity-card__header-text">
        <Link to={`/profile/${item.actor.id}`} className="activity-card__actor">
          {item.actor.name}
        </Link>
        <span className="activity-card__action"> replied on </span>
        <Link to={`/books/${item.book.id}`} className="activity-card__book">
          <em>{item.book.title}</em>
        </Link>
      </div>
      <span className="activity-card__time">{formatTime(item.created_at)}</span>
    </div>

    {item.parent?.snippet && (
      <blockquote className="activity-card__parent">
        <span className="activity-card__parent-label">Replying to: </span>
        {truncate(item.parent.snippet)}
      </blockquote>
    )}

    <p className="activity-card__content">{item.content}</p>

    {/* View full thread link */}
    <Link
      to={`/books/${item.book.id}?review=${item.parent?.id}`}
      className="activity-card__thread-link"
    >
      <ExternalLink size={11} />
      View full thread on book page
    </Link>
  </div>
)



export const FeedItem = ({ item, onLike }) => {
  switch (item.activity_type) {
    case 'review':
      return <ReviewActivityCard item={item} onLike={onLike} />
    case 'comment':
      return <CommentActivityCard item={item} onLike={onLike} />
    case 'reply':
      return <ReplyActivityCard item={item} />
    default:
      return null
  }
}