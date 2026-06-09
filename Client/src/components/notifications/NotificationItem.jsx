import clsx from 'clsx'
import { Mail, Heart, BookOpen } from 'lucide-react'
import Avatar from '../ui/Avatar'

const TYPE_ICONS = {
  message: Mail,
  like:    Heart,
}

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

const NotificationItem = ({
  notification = {},
  onRead,
  className,
}) => {
  const { id, type, is_read = false, created_at, actor = {}, meta = {} } = notification

  const handleClick = () => onRead?.(id, meta)

  const useAvatar = type === 'reply'  || type === 'like'
  const Icon = TYPE_ICONS[type]

  const renderContent = () => {
    switch (type) {
      case 'reply':
        return (
          <>
            <p className="notification-item__message">
              <span className="notification-item__actor">{actor.name}</span>
              {' '}replied to your {meta.target_type === 'comment' ? 'comment' : 'review'}
              {meta.book_title && <> on <em className="notification-item__book">{meta.book_title}</em></>}
            </p>
            {meta.quote && (
              <blockquote className="notification-item__quote">"{meta.quote}"</blockquote>
            )}
          </>
        )

      case 'like':
        return (
          <p className="notification-item__message">
            <span className="notification-item__actor">{actor.name}</span>
            {' '}liked your {meta.target === 'review'?'review' : 'comment'}
            {meta.book_title && <> on <em className="notification-item__book">{meta.book_title}</em></>}
          </p>
        )

      case 'message':
        return (
          <>
            <p className="notification-item__message">
              <span className="notification-item__actor">{actor.name}</span>
              {' '}sent you a message
            </p>
            {meta.preview && (
              <p className="notification-item__preview">"{meta.preview}"</p>
            )}
          </>
        )

        case 'club':
  return (
    <p className="notification-item__message">
      <span className="notification-item__actor">{actor.name}</span>
      {' '}
      {meta.entity_type === 'club_review' && (
        <>
          posted a review
          {meta.book_title && (
            <> on <em className="notification-item__book">{meta.book_title}</em></>
          )}
        </>
      )}
      {meta.entity_type === 'club_message' && 'sent a message in your club'}
      {meta.entity_type === 'club_join_approved' && 'approved your join request'}
      {meta.entity_type === 'club_join_rejected' && 'rejected your join request'}
    </p>
  )

      default:
        return null
    }
  }

  return (
    <div
      className={clsx(
        'notification-item',
        `notification-item--${type}`,
        !is_read && 'notification-item--unread',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {!is_read && <span className="notification-item__dot" />}

      {useAvatar ? (
        <Avatar
          src={actor.image_url}
          name={actor.name}
          color={actor.avatar_color}
          size="sm"
          className="notification-item__avatar"
        />
      ) : (
        Icon && (
          <div className="notification-item__icon">
            <Icon size={15} />
          </div>
        )
      )}

      <div className="notification-item__content">
        {renderContent()}
        <span className="notification-item__time">{formatTime(created_at)}</span>
      </div>

      {type === 'message' && (
        <button
          type="button"
          className="notification-item__read-btn"
          onClick={handleClick}
        >
          Read
        </button>
      )}
    </div>
  )
}

export default NotificationItem