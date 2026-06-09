import { useState, useRef } from "react";
import api from "../utils/api";

export const useNotifications = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const abortRef = useRef(null)

    const handleRequest = async (requestFn, fallbackMessage) => {
        setLoading(true)
        setError(null)
        if (abortRef.current) abortRef.current.abort()
        const controller = new AbortController()
        abortRef.current = controller
        try {
            const { data } = await requestFn(controller.signal)
            return { success: true, data }
        } catch (err) {
            const msg = err.response?.data?.message||err.response?.data?.error || err.message || fallbackMessage || 'Something went wrong'
            setError(msg)
            return { success: false, error: msg }
        } finally {
            setLoading(false)
        }
    }

    const getNotifications = () => handleRequest((signal) => api.get('/notifications', { signal }), 'Failed to load notifications')
    const markRead = (notificationId) => handleRequest((signal) => api.patch(`/notifications/${notificationId}/read`, {}, { signal }), 'Failed to mark as read')
    const markAllRead = () => handleRequest((signal) => api.patch('/notifications', {}, { signal }),'Failed to mark all as read')
    const clearAll = () => handleRequest((signal) => api.delete('/notifications', { signal }), 'Failed to clear notifications')

    return { getNotifications, markRead,markAllRead, clearAll, loading, error }
}