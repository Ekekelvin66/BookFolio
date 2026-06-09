import { useRef, useState } from 'react'
import clsx from 'clsx'
import { Send } from 'lucide-react'
import Avatar from '../ui/Avatar'


const CommentForm = ({
  parentId,
  placeholder = 'Share your thoughts…',
  onSubmit,
  isLoading = false,
  currentUser,
  compact = false,
  className,
}) => {
  const [body, setBody] = useState('')
  const textareaRef = useRef(null)

  const handleSubmit = () => {
    const trimmed = body.trim()
    if (!trimmed || isLoading) return
    onSubmit?.(trimmed, parentId)
    setBody('')
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className={clsx(
        'comment-form',
        compact && 'comment-form--compact',
        className
      )}
    >
      {!compact && currentUser && (
        <Avatar
          src={currentUser.image_url}
          name={currentUser.name}
          color={currentUser.avatar_color}
          size="sm"
          className="comment-form__avatar"
        />
      )}

      <div className="comment-form__input-wrapper">
        <textarea
          ref={textareaRef}
          rows={compact ? 2 : 3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoCapitalize='sentences'
          autoCorrect='on'
          spellCheck='true'
          className="comment-form__textarea"
          disabled={isLoading}
        />

        <button
          className={clsx(
            'comment-form__submit',
            !body.trim() && 'comment-form__submit--disabled'
          )}
          onClick={handleSubmit}
          disabled={!body.trim() || isLoading}
          aria-label="Submit comment"
        >
          <Send size={compact ? 14 : 16} />
        </button>
      </div>

      {!compact && (
        <p className="comment-form__hint">
          Ctrl + Enter to submit
        </p>
      )}
    </div>
  )
}

export default CommentForm