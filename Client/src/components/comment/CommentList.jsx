import clsx from 'clsx'
import CommentCard from './CommentCard'
import CommentForm from './CommentForm'
import { useState } from 'react'



const CommentList = ({
  comments = [],
  onReply,
  onEdit,
  onDelete,
  onLike,
  currentUser,
  isLoading = false,
  className,
}) => {
  const [replyingTo, setReplyingTo] = useState(null) // comment id being replied to

  const handleReply = (id) => {
    setReplyingTo((prev) => (prev === id ? null : id)) // toggle
  }

  const handleReplySubmit = (body) => {
    onReply?.(replyingTo, body)
    setReplyingTo(null)
  }

  if (!comments.length) {
    return (
      <div className={clsx('comment-list comment-list--empty', className)}>
        <p className="comment-list__empty-text">No comments yet. Be the first to respond.</p>
      </div>
    )
  }

  return (
    <div className={clsx('comment-list', className)}>
      {comments.map((comment) => (
        <div key={comment.id} className="comment-list__thread">
          {/* Top-level comment */}
          <CommentCard
            comment={comment}
            onReply={handleReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onLike={onLike}
            depth={0}
          />

          {/* Inline reply form */}
          {replyingTo === comment.id && (
            <div className="comment-list__reply-form">
              <CommentForm
                onSubmit={handleReplySubmit}
                onCancel={() => setReplyingTo(null)}
                isLoading={isLoading}
                parentId={replyingTo}
                currentUser={currentUser}
                placeholder={`Replying to ${comment.user?.name ?? 'comment'}…`}
                compact
              />
            </div>
          )}

          {/* Replies */}
          {comment.replies?.length > 0 && (
            <div className="comment-list__replies">
              {comment.replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  depth={1}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default CommentList