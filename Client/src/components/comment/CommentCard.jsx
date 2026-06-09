import { useState } from 'react'
import clsx from 'clsx'
import { Heart, MoreHorizontal, Edit2, Trash2 } from 'lucide-react'
import Avatar from '../ui/Avatar'

const CommentCard = ({
  comment = {},
  onReply,
  onEdit,
  onDelete,
  onLike,
  depth = 0,
  className,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const { id, user = {}, body, created_at, like_count = 0, is_liked = false, is_own = false } = comment

  const formatDate = (iso) => {
    if (!iso) return ''
    const date = new Date(iso)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleMenuToggle = (e) => {
    e.stopPropagation()
    setMenuOpen((prev) => !prev)
  }

  const handleEdit = () => {
    setMenuOpen(false)
    onEdit?.(id)
  }

  const handleDelete = () => {
    setMenuOpen(false)
    onDelete?.(id)
  }

  return (
    <div
      className={clsx(
        'comment-card',
        depth === 1 && 'comment-card--reply',
        className
      )}
    >
      {depth === 1 && <div className="comment-card__thread-line" />}

      <div className="comment-card__inner">
        <Avatar
          src={user.image_url}
          name={user.name}
          color={user.avatar_color}
          size="sm"
          className="comment-card__avatar"
        />

        <div className="comment-card__content">
          {/* Header */}
          <div className="comment-card__header">
            <span className="comment-card__name">{user.name ?? 'Unknown'}</span>
            <span className="comment-card__date">{formatDate(created_at)}</span>

            {is_own && (
              <div className="comment-card__menu-wrapper">
                <button
                  type="button"
                  className="comment-card__menu-btn"
                  onClick={handleMenuToggle}
                  aria-label="Comment options"
                >
                  <MoreHorizontal size={14} />
                </button>
                {menuOpen && (
                  <div className="comment-card__menu">
                    <button
                      type="button"
                      className="comment-card__menu-item"
                      onClick={handleEdit}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      className="comment-card__menu-item comment-card__menu-item--danger"
                      onClick={handleDelete}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <p className="comment-card__body">{body}</p>

          <div className="comment-card__footer">
           
            <button
              type="button"
              className={clsx(
                'comment-card__like-btn',
                is_liked && 'comment-card__like-btn--liked'
              )}
              onClick={() => onLike?.(id)}
              aria-label={is_liked ? 'Unlike comment' : 'Like comment'}
            >
              <Heart size={12} fill={is_liked ? 'currentColor' : 'none'} />
              {like_count > 0 && (
                <span className="comment-card__like-count">{like_count}</span>
              )}
            </button>

            {/* Reply — depth 0 only */}
            {depth === 0 && (
              <button
                type="button"
                className="comment-card__reply-btn"
                onClick={() => onReply?.(id)}
              >
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentCard