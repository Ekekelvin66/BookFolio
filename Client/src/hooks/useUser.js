import { useState, useRef } from "react";
import api from "../utils/api";
import { useAuthContext } from "../context/AuthContext";

export const useUser = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const abortRefs = useRef({})
    const { updateUser } = useAuthContext()

    const handleRequest = async (requestFn, fallbackMessage, key = 'default') => {
        setLoading(true)
        setError(null)
        if (abortRefs.current[key]) {
            abortRefs.current[key].abort()
        }
        const controller = new AbortController()
        abortRefs.current[key] = controller
        try {
            const { data } = await requestFn(controller.signal)
            return { success: true, data }
        } catch (err) {
            if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                return null
            }
            const msg =err.response?.data?.error|| err.response?.data?.message || err.message || fallbackMessage || 'Something went wrong'
            setError(msg)
            return { success: false, error: msg }
        } finally {
            if (abortRefs.current[key] === controller) {
                setLoading(false)
            }
        }
    }

    const getProfile = () => handleRequest((signal) => api.get('/user', { signal }), 'Failed to fetch your profile', 'profile')
    const getPublicProfile = (userId) => handleRequest((signal) => api.get(`/users/${userId}`, { signal }), 'Failed to fetch user profile', `public_profile_${userId}`)
    const checkUsername = (username) => handleRequest(
        (signal) => api.get('/user/check-username', { params: { username }, signal }),
        'Failed to check username',
        'check_username'
    )
    const updateProfile = async (fields) => {
        const result = await handleRequest((signal) => api.patch('/user', fields, { signal }), 'Failed to update profile', 'update_profile')
        if (result.success) updateUser(result.data.user??result.data)
        return result
    }
    const getPreferences = () => handleRequest((signal) => api.get('/user/preferences', { signal }), 'Failed to fetch preferences', 'preferences')
    const savePreferences = (genres) => handleRequest((signal) => api.post('/user/preferences', { genres }, { signal }), 'Failed to save preferences', 'save_preferences')
    const updatePreferences = (genres) => handleRequest((signal) => api.patch('/user/preferences', { genres }, { signal }), 'Failed to update preferences', 'update_preferences')
    const setReadingGoal = (goal) => handleRequest((signal) => api.post('/user/yearly-goal', { yearly_goal:goal }, { signal }), 'Failed to set reading goal', 'reading_goal')
    const removeAvatar = async () => {
      const result = await handleRequest(
        (signal) => api.delete('/user/avatar', { signal }),
        'Failed to remove avatar',
        'remove_avatar'
      )
      if (result.success) {
        if (result.data.token) {
          localStorage.setItem('token', result.data.token)
        }
        updateUser(result.data.user)
      }
      return result
    }

    return { getProfile,getPublicProfile, updateProfile, removeAvatar, getPreferences, savePreferences, updatePreferences, setReadingGoal,checkUsername, loading, error }
}