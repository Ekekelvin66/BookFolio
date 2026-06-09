import { useState } from 'react'
import clsx from 'clsx'
import { MessageSquare, Users, Search } from 'lucide-react'
import ConversationCard from './ConversationCard'
import Spinner from '../ui/Spinner'

const TABS = [
  { key: 'private', label: 'Private',    icon: MessageSquare },
  { key: 'club',    label: 'Book Clubs', icon: Users },
]

const EMPTY_MESSAGES = {
  private: 'No private conversations yet.',
  club:    "You haven't joined any book clubs yet.",
}

const ConversationList = ({
  conversations = [],
  activeId,
  activeType,
  isLoading = false,
  onSelect,
  className,
  onMute,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState('private')
  const [query, setQuery] = useState('')

  const unreadPrivate = conversations
    .filter((c) => c.type === 'private')
    .reduce((sum, c) => sum + (c.unread_count ?? 0), 0)

  const unreadClub = conversations
    .filter((c) => c.type === 'club')
    .reduce((sum, c) => sum + (c.unread_count ?? 0), 0)

  const unreadByTab = { private: unreadPrivate, club: unreadClub }

  const filtered = conversations
    .filter((c) => c.type === activeTab)
    .filter((c) => {
      if (!query.trim()) return true
      const target = c.type === 'club' ? c.club_name : c.user?.name
      return target?.toLowerCase().includes(query.toLowerCase())
    })

  return (
    <div className={clsx('conversation-list', className)}>

      
      <div className="conversation-list__tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={clsx(
              'conversation-list__tab',
              activeTab === key && 'conversation-list__tab--active'
            )}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={14} />
            {label}
            {unreadByTab[key] > 0 && (
              <span className="conversation-list__tab-badge">
                {unreadByTab[key] > 99 ? '99+' : unreadByTab[key]}
              </span>
            )}
          </button>
        ))}
      </div>

     
      <div className="conversation-list__search">
        <Search size={14} className="conversation-list__search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            activeTab === 'club'
              ? 'Search book clubs…'
              : 'Search conversations…'
          }
          className="conversation-list__search-input"
        />
      </div>

      <div className="conversation-list__items">
        {isLoading ? (
          <div className="conversation-list__loading">
            <Spinner size="sm" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="conversation-list__empty">
            {query.trim()
              ? 'No conversations match your search.'
              : EMPTY_MESSAGES[activeTab]}
          </p>
        ) : (
          filtered.map((conversation) => (
            <ConversationCard
              key={`${conversation.type}-${conversation.id}`}
              conversation={conversation}
              isActive={
                conversation.id === activeId &&
                conversation.type === activeType
              }
              onClick={(id) => onSelect(id, conversation.type)}
              onMute={(id)=> onMute(id,conversation.type)}
              onDelete={(id)=>onDelete(id,conversation.type)}
            />
          ))
        )}
      </div>

    </div>
  )
}

export default ConversationList