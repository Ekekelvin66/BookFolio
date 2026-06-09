import { useRef, useState } from 'react'
import clsx from 'clsx'
import { Send, Paperclip, Smile, X } from 'lucide-react'


const MessageInput = ({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = 'Type a message…',
  className,
  replyTo,
  onClearReply
}) => {
  const [body, setBody] = useState('')
  const textareaRef = useRef(null)

  const canSend = body.trim().length > 0 && !isLoading && !disabled

  const handleSend = () => {
    if (!canSend) return
    onSend?.(body.trim())
    setBody('')
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e) => {
    setBody(e.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }
  }

  return (
    <div className={clsx('message-input', disabled && 'message-input--disabled', className)}>
      {replyTo && (
        <div className="message-input__reply-preview">
          <div className="message-input__reply-info">
             <span className="message-input__reply-sender">{replyTo.sender?.name}</span>
             <p className="message-input__reply-body">{replyTo.message_text}</p>
          </div>
          <button onClick={onClearReply} className="message-input__reply-close">
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="message-input__toolbar">
        <button
          type="button"
          className="message-input__tool-btn"
          disabled={disabled}
          aria-label="Attach file"
        >
          <Paperclip size={16} />
        </button>

        <button
          type="button"
          className="message-input__tool-btn"
          disabled={disabled}
          aria-label="Insert emoji"
        >
          <Smile size={16} />
        </button>
      </div>


      <div className="message-input__row">
        <textarea
          ref={textareaRef}
          rows={1}
          autoCapitalize='sentences'
          autoCorrect='on'
          spellCheck='true'
          value={body}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Select a conversation to start messaging' : placeholder}
          className="message-input__textarea"
          disabled={disabled || isLoading}
        />

        <button
          type="button"
          className={clsx(
            'message-input__send-btn',
            !canSend && 'message-input__send-btn--disabled'
          )}
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

export default MessageInput