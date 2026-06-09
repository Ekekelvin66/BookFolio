import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import getSocket from '../socket'
import { useAuthContext } from './AuthContext'
import { useNotifications as useNotificationsHook } from '../hooks/useNotifications'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuthContext()
  const { getNotifications, markRead: markReadRequest,markAllRead:markAllReadRequest, clearAll: clearAllRequest } = useNotificationsHook()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    const result = await getNotifications()
    if (result.success) {
      setNotifications(result.data.notifications ?? [])
      setUnreadCount(result.data.unreadCount ?? 0)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchNotifications()
  }, [isAuthenticated, fetchNotifications])

  useEffect(() => {
    if (!isAuthenticated) return
    const socket = getSocket()

    const handleNewNotification = (newNoti) => {
  if (!newNoti?.id && !newNoti?._id) {
    fetchNotifications()
    return
  }

  const id = newNoti.id || newNoti._id
  const normalized = { ...newNoti, id }

  
  setNotifications((prev) => {
    if (prev.some(n => n.id === id)) return prev
    return [normalized, ...prev]
  })

 
  setUnreadCount((prev) => prev + 1)
}

    socket.on('new_notification', handleNewNotification)

    return () => {
      socket.off('new_notification', handleNewNotification)
    }
  }, [isAuthenticated, fetchNotifications])

  const markRead = useCallback(async (notificationId) => {
    const result = await markReadRequest(notificationId)
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }, [markReadRequest])

  const markAllRead = useCallback(async () => {
    const result = await markAllReadRequest()
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }, [markAllReadRequest])

  const clearAll = useCallback(async () => {
    const result = await clearAllRequest()
    if (result.success) {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [clearAllRequest])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      clearAll,
      refresh: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotificationContext = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotificationContext must be used inside NotificationProvider')
  return ctx
}