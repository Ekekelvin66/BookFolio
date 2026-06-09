import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Users, MoreHorizontal, BellOff, Bell, Trash2, MoreVertical } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const formatTime = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const ConversationCard = ({
  conversation = {},
  isActive = false,
  onClick,
  onMute,
  onDelete,
  className,
}) => {
  const { id, type = 'private', user = {}, club_name,club_cover_url, member_count, last_message = {}, unread_count = 0, is_muted = false } = conversation
  const isClub = type === 'club'
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [menuOpen])

  const handleMenuClick = (e) => {
    e.stopPropagation()
    setMenuOpen((prev) => !prev)
  }

  const handleMute = (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    onMute?.(id)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    setIsDeleteModalOpen(true)
  }
  
  const confirmDelete = () => {
      setIsDeleteModalOpen(false)
      onDelete?.(id)
  }

  return (
    <>
    <div
      className={clsx(
        'conversation-card',
        isActive && 'conversation-card--active',
        unread_count > 0 && 'conversation-card--unread',
        is_muted && 'conversation-card--muted',
        className
      )}
      onClick={() => onClick?.(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(id)}
    >
      {isClub ? (
        club_cover_url
        ?  <Avatar src={club_cover_url} name={club_name} size="md" className="conversation-card__avatar" />
        :  <div className="conversation-card__club-icon"><Users size={18} /></div>
      ) : (
        <Avatar
          src={user.image_url}
          name={user.name}
          color={user.avatar_color}
          size="md"
          className="conversation-card__avatar"
        />
      )}

      <div className="conversation-card__content">
        <div className="conversation-card__header">
          <span className="conversation-card__name">
            {isClub ? club_name : user.name}
          </span>

          <div className="conversation-card__header-right">
            <span className="conversation-card__time">
              {formatTime(last_message.created_at)}
            </span>

            <div className="conversation-card__menu-wrapper" ref={menuRef}>
              <button
                type="button"
                className="conversation-card__menu-btn"
                onClick={handleMenuClick}
                aria-label="Conversation options"
              >
                <MoreVertical size={14} />
              </button>

              {menuOpen && (
                <div className="conversation-card__menu">
                  <button
                    type="button"
                    className="conversation-card__menu-item"
                    onClick={handleMute}
                  >
                    {is_muted ? <Bell size={13} /> : <BellOff size={13} />}
                    {is_muted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    type="button"
                    className="conversation-card__menu-item conversation-card__menu-item--danger"
                    onClick={handleDelete}
                  >
                    <Trash2 size={13} />
                    Delete chat
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="conversation-card__footer">
          <p className="conversation-card__preview">
            {isClub && last_message.sender_name
              ? `${last_message.sender_name}: ${last_message.body}`
              : last_message.body || 'No messages yet'}
          </p>

          {unread_count > 0 && (
            <span className="conversation-card__badge">
              {unread_count > 99 ? '99+' : unread_count}
            </span>
          )}
        </div>

        {isClub && (
          <p className="conversation-card__member-count">
            {member_count} member{member_count !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
    <Modal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Conversation"
    >
        <p>Are you sure you want to delete this conversation?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
    </Modal>
    </>
  )
}

export default ConversationCard
