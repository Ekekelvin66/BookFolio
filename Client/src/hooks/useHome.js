import { useState } from "react";
import api from "../utils/api";

export const useHome = () => {
    const [loading, setLoading] = useState(false)
    const [loadingExtended, setLoadingExtended] = useState(false)
    const [error, setError] = useState(null)

    const handleRequest = async (requestFn, fallbackMessage, setLoadingState) => {
        setLoadingState(true)
        setError(null)
        try {
            const { data } = await requestFn()
            return { success: true, data }
        } catch (err) {
            const msg = err.response?.data?.message ||err.response?.data?.error|| err.message || fallbackMessage || 'Something went wrong'
            setError(msg)
            return { success: false, error: msg }
        } finally {
            setLoadingState(false)
        }
    }

    const getGuestHomeEssential = () => handleRequest(() => api.get('/home/guest/essential'), 'Failed to load home', setLoading)
    const getGuestHomeExtended = () => handleRequest(() => api.get('/home/guest/extended'), 'Failed to load home', setLoadingExtended)
    const getAuthHomeEssential = () => handleRequest(() => api.get('/home/user/essential'), 'Failed to load home', setLoading)
    const getAuthHomeExtended = () => handleRequest(() => api.get('/home/user/extended'), 'Failed to load home', setLoadingExtended)

    return { getGuestHomeEssential, getGuestHomeExtended, getAuthHomeEssential, getAuthHomeExtended, loading, loadingExtended, error }
}