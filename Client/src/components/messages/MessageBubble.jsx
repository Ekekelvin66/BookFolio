import clsx from 'clsx'
import { CheckCheck, CornerUpLeft } from 'lucide-react'
import Avatar from '../ui/Avatar'


const formatTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const MessageBubble = ({
  message = {},
  isSent = false,
  showSender = false,
  className,
  isGrouped=false,
  onReply,
  onReplyClick
}) => {
  const { id, message_text, created_at, is_read = false, sender_name,avatar_color, replyTo } = message
  
  if (!message_text) return null

  return (
    <div
      id={`message-${id}`}
      className={clsx(
        'message-bubble',
         isSent        && 'message-bubble--sent',
        !isSent       && 'message-bubble--received',
        isGrouped     && 'message-bubble--grouped', 
        className
      )}
    >
      {!isSent && showSender && isGrouped && (
        <Avatar
          name={sender_name}
          color={avatar_color}
          size="sm"
          className="message-bubble__avatar"
        />
      )}
      {!isSent && (!showSender || isGrouped) && (
        <div className="message-bubble__avatar-spacer" />
      )}

      <div className="message-bubble__wrapper">
        {!isSent && showSender && !isGrouped && sender_name && (
          <p className="message-bubble__sender-name">{sender_name}</p>
        )}
        <div className="message-bubble__bubble">
          {replyTo && (
            <div 
              className={clsx(
                'message-bubble__reply-preview',
                isSent ? 'message-bubble__reply-preview--sent' : 'message-bubble__reply-preview--received'
              )}
              onClick={() => onReplyClick?.(replyTo.id)}
            >
              <span className="message-bubble__reply-sender">{replyTo.sender?.name}</span>
              <p className="message-bubble__reply-body">{replyTo.message_text}</p>
            </div>
          )}
          <p className="message-bubble__body">{message_text}</p>
        </div>

        <button className="message-bubble__reply-btn" onClick={onReply} aria-label="Reply">
           <CornerUpLeft size={16} />
        </button>
        
        <div className="message-bubble__meta">
          <span className="message-bubble__time">{formatTime(created_at)}</span>
          {isSent && (
            <span
              className={clsx(
                'message-bubble__read',
                is_read && 'message-bubble__read--seen'
              )}
              aria-label={is_read ? 'Read' : 'Delivered'}
            >
              <CheckCheck size={12} />
              {is_read && <span>Read</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble