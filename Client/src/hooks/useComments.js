// useComments.js
import { useState, useRef } from "react";
import api from "../utils/api";

export const useComments = () => {
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
            const msg = err.response?.data?.message ||err.response?.data?.error || err.message || fallbackMessage || 'Something went wrong'
            setError(msg)
            return { success: false, error: msg }
        } finally {
            setLoading(false)
        }
    }

    const getReviewComments = (reviewId) => handleRequest((signal) => api.get(`/reviews/${reviewId}/comments`, { signal }), 'Failed to load comments')
    const addReviewComment = (reviewId, comment_text) => handleRequest((signal) => api.post(`/reviews/${reviewId}/comment`, { comment_text }, { signal }), 'Failed to add comment')
    const deleteReviewComment = (commentId) => handleRequest((signal) => api.delete(`/comments/${commentId}`, { signal }), 'Failed to delete comment')
    const likeComment = (reviewId, commentId) => handleRequest((signal) => api.post(`/reviews/${reviewId}/comments/${commentId}/like`, {}, { signal }), 'Failed to like comment')
    const unlikeComment = (reviewId, commentId) => handleRequest((signal) => api.delete(`/reviews/${reviewId}/comments/${commentId}/like`, { signal }), 'Failed to unlike comment')
    const replyComment = (reviewId, commentId, comment_text) => handleRequest((signal) => api.post(`/reviews/${reviewId}/comments/${commentId}/reply`, { comment_text }, { signal }), 'Failed to reply')
    const getReplies = (reviewId, commentId) => handleRequest((signal) => api.get(`/reviews/${reviewId}/comments/${commentId}/replies`, { signal }), 'Failed to load replies')
    const deleteReply = (reviewId,commentId)=>handleRequest(()=>api.delete(`/reviews/${reviewId}/comments/${commentId}`),'Failed to delete reply')

    return {deleteReply, getReviewComments, addReviewComment, deleteReviewComment, likeComment, unlikeComment, replyComment, getReplies, loading, error }
}
 

