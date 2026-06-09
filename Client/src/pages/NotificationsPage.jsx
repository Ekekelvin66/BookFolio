import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificationContext } from '../context/NotificationContext'
import PageWrapper from '../components/layout/PageWrapper'
import NotificationItem from '../components/notifications/NotificationItem'
import { CheckCheck, Trash2 } from 'lucide-react'
import clsx from 'clsx'

const TABS = ['All', 'Unread']

const NotificationsPage = () => {
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotificationContext()
  const [activeTab, setActiveTab] = useState('All')

  const displayed = activeTab === 'Unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications

  const handleRead = (id, meta) => {
    markRead(id)

    const routeMap = {
      'club_message': `/messages/club/${meta?.club_id}`,
      'club_review': `/books/${meta?.book_id}`,
      'message': `/messages/${meta?.conversation_id}`,
    };

  
    if (routeMap[meta?.entity_type]) {
      return navigate(routeMap[meta.entity_type]);
    }

    
    if (meta?.entity_type?.startsWith('club_') && meta?.club_id) {
      return navigate(`/clubs/${meta.club_id}`);
    }

    if (meta?.book_id) {
      return navigate(`/books/${meta.book_id}`);
    }

    if (meta?.conversation_id) {
      return navigate(`/messages/${meta.conversation_id}`);
    }
  }

  return (
    <PageWrapper className="notifications-page">
      <div className="notifications-page__header">
        <div>
          <h1 className="notifications-page__title">Notifications</h1>
          {unreadCount > 0 && (
            <p className="notifications-page__sub">{unreadCount} unread</p>
          )}
        </div>
        <div className="notifications-page__header-actions">
          {unreadCount > 0 && (
            <button className="notifications-page__mark-all" onClick={markAllRead}>
              <CheckCheck size={15} /> Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="notifications-page__clear-all" onClick={clearAll}>
              <Trash2 size={15} /> Clear all
            </button>
          )}
        </div>
      </div>

      <div className="notifications-page__tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={clsx('notifications-page__tab', activeTab === tab && 'notifications-page__tab--active')}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === 'Unread' && unreadCount > 0 && (
              <span className="notifications-page__tab-badge">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="notifications-page__list">
        {displayed.length === 0 ? (
          <div className="notifications-page__empty">
            <p>{activeTab === 'Unread' ? 'No unread notifications.' : 'No notifications yet.'}</p>
          </div>
        ) : (
          displayed.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={handleRead}
            />
          ))
        )}
      </div>
    </PageWrapper>
  )
}

export default NotificationsPage