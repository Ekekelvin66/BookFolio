import { useState,useRef } from "react";
import api from "../utils/api";

export const useDashboard = () => {
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

    const getDashboard = () => handleRequest((signal) => api.get('/dashboard',{signal}), 'Failed to load dashboard')
    const getShelves = () => handleRequest((signal) => api.get('/shelves',{signal}), 'Failed to load your Reading shelf')

    return { getDashboard, getShelves, loading, error }
}