import clsx from 'clsx'
import { Trash, Pen, ThumbsUp,ThumbsDown, MessageSquare } from 'lucide-react'
import StarRating from '../ui/StarRating'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'

const ReviewCard = ({
  reviewData,
  variant,
  isOwn,
  onEdit,
  onDelete,
  onHelpful,
  onReadReplies,
  onReply,
  className,
}) => {
  const {
    review_text,
    review_title,
    rating,
    recommendation,
    helpful_count,
    reply_count,
    created_at,
    reviewer_name,
    avatar_color,
  } = reviewData

  return (
    <div className={clsx('review-card', variant && `review-card--${variant}`, className)}>
      <div className="review-card__header">
        <Avatar name={reviewer_name} color={avatar_color} size="sm" />
        <div className="review-card__header-main">
          <p className="review-card__reviewer">
            {reviewer_name}
            {isOwn && <span className="review-card__you"> (You)</span>}
          </p>
          <StarRating size="sm" value={Number(rating)} readOnly />
        </div>
        <p className="review-card__date">
          {new Date(created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {recommendation !== null && recommendation !== undefined && (
        <span className={clsx(
          'review-card__recommendation',
          recommendation ? 'review-card__recommendation--yes' : 'review-card__recommendation--no'
        )}>
          {recommendation 
          ? <><ThumbsUp size={13} /> Recommends</>
           : <><ThumbsDown size={13} /> Doesn't Recommend</>}
        </span>
      )}

      {review_title && (
        <p className="review-card__title">{review_title}</p>
      )}

      <p className="review-card__text">{review_text}</p>

      <div className="review-card__actions">
        {isOwn ? (
          <div className="review-card__own-actions">
            <Button onClick={onEdit} variant="secondary" leftIcon={<Pen size={15} />}>
              Edit
            </Button>
            <Button onClick={onDelete} variant="danger" leftIcon={<Trash size={15} />}>
              Delete
            </Button>
          </div>
        ) : (
          <div className="review-card__other-actions">
            <Button onClick={onHelpful} variant="ghost" leftIcon={<ThumbsUp size={15} />}>
              {helpful_count || 0} Helpful
            </Button>
            <Button onClick={onReadReplies} variant="ghost" leftIcon={<MessageSquare size={15} />}>
              {reply_count || 0} {reply_count === 1 ? 'Reply' : 'Replies'}
            </Button>
            <Button onClick={onReply} variant="primary" leftIcon={<MessageSquare size={15} />}>
              Reply
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewCard