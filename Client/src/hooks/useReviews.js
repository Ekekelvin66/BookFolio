import { useState, useRef } from "react";
import api from "../utils/api";

export const useReviews = () => {
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
            const msg = err.response?.data?.message ||err.response?.data?.error|| err.message || fallbackMessage || 'Something went wrong'
            setError(msg)
            return { success: false, error: msg }
        } finally {
            setLoading(false)
        }
    }

    const addReview = (bookId, reviewData) => handleRequest((signal) => api.post(`/books/${bookId}/reviews`, reviewData, { signal }), 'Failed to add review')
    const editReview = (bookId, reviewId, reviewData) => handleRequest((signal) => api.patch(`/books/${bookId}/reviews/${reviewId}`, reviewData, { signal }), 'Failed to edit review')
    const deleteReview = (bookId, reviewId) => handleRequest((signal) => api.delete(`/books/${bookId}/reviews/${reviewId}`, { signal }), 'Failed to delete review')
    const likeReview = (reviewId) => handleRequest((signal) => api.post(`/reviews/${reviewId}/like`, {}, { signal }), 'Failed to like review')
    const unlikeReview = (reviewId) => handleRequest((signal) => api.delete(`/reviews/${reviewId}/like`, { signal }), 'Failed to unlike review')
    const toggleHelpful =(reviewId)=>handleRequest((signal)=>api.post(`reviews/${reviewId}/helpful`,{signal}),'Failed to set helpful')

    return { addReview, editReview, deleteReview, likeReview, unlikeReview, toggleHelpful, loading, error }
}