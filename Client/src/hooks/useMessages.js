import { useState, useRef } from "react";
import api from "../utils/api";

export const useMessages = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const abortRef = useRef(null)
    const messagesAbortRef = useRef(null)
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
            const msg = err.response?.data?.message ||err.response?.data?.error || err.message || fallbackMessage || 'Something went wrong'
            setError(msg)
            return { success: false, error: msg }
        } finally {
            setLoading(false)
        }
    }

    const getConversations = () => handleRequest((signal) => api.get('/conversations', { signal }), 'Failed to load conversations')
    const startConversation = (otherUserId) => handleRequest((signal) => api.post('/conversations', { otherUserId }, { signal }), 'Failed to start conversation')
    const getMessages = async (conversationId, before = null) => {
        if (messagesAbortRef.current) messagesAbortRef.current.abort()
        const controller = new AbortController()
        messagesAbortRef.current = controller
        setLoading(true)
        try {
            const { data } = await api.get(`/conversations/${conversationId}`, {
                params: before != null ? { before } : {},
                signal: controller.signal,
            })
            return { success: true, data }
        } catch (err) {
            if (err.name === 'CanceledError' || err.name === 'AbortError') return { success: false, error: 'Cancelled' }
            const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load messages'
            setError(msg)
            return { success: false, error: msg }
        } finally {
            setLoading(false)
        }
    }
    const sendMessage = (conversationId, message_text) => handleRequest((signal) => api.post(`/conversations/${conversationId}/messages`, { message_text }, { signal }), 'Failed to send message')
    const muteConversation   = (conversationId) => handleRequest((signal) => api.post(`/conversations/${conversationId}/mute`, {}, { signal }), 'Failed to mute conversation')
    const unmuteConversation = (conversationId) => handleRequest((signal) => api.delete(`/conversations/${conversationId}/mute`, { signal }), 'Failed to unmute conversation')
    const deleteConversation = (conversationId) => handleRequest((signal) => api.delete(`/conversations/${conversationId}`, { signal}), 'Failed to delete conversation')

    return { getConversations, startConversation, getMessages, sendMessage,muteConversation,unmuteConversation,deleteConversation, loading, error }
}