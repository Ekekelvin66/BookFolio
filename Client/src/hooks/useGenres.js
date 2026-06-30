import { useState, useEffect } from "react";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";

export const useGenres = () => {
    const [genres, setGenres] = useState([])
    const [loading, setLoading] = useState(true)
    const { showToast } = useToast()

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const { data } = await api.get('/genres')
                setGenres(data.genres ?? data ?? [])
            } catch (err) {
                showToast(err.response?.data?.error || 'Failed to load genres', 'error')
            } finally {
                setLoading(false)
            }
        }
        fetchGenres()
    }, [])

    return { genres, loading }
}