import { useState, useRef } from "react";
import api from "../utils/api";
import { useAuthContext } from "../context/AuthContext";

export const useUser = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const abortRef = useRef(null)
    const { updateUser } = useAuthContext()

    const handleRequest = async (requestFn, fallbackMessage) => {
        setLoading(true)
        setError(null)
        if (abortRef.current) {
            abortRef.current.abort()
        }
        const controller = new AbortController()
        abortRef.current = controller
        try {
            const { data } = await requestFn(controller.signal)
            return { success: true, data }
        } catch (err) {
            const msg =err.response?.data?.error|| err.response?.data?.message || err.message || fallbackMessage || 'Something went wrong'
            setError(msg)
            return { success: false, error: msg }
        } finally {
            setLoading(false)
        }
    }

    const getProfile = () => handleRequest((signal) => api.get('/user', { signal }), 'Failed to fetch your profile')
    const getPublicProfile = (userId) => handleRequest((signal) => api.get(`/users/${userId}`, { signal }), 'Failed to fetch user profile')
    const updateProfile = async (fields) => {
        const result = await handleRequest((signal) => api.patch('/user', fields, { signal }), 'Failed to update profile')
          console.log('result.data:', result.data)           // what shape is this?
  console.log('result.data.user:', result.data?.user)
        if (result.success) updateUser(result.data.user??result.data)
        return result
    }
    const getPreferences = () => handleRequest((signal) => api.get('/user/preferences', { signal }), 'Failed to fetch preferences')
    const savePreferences = (genres) => handleRequest((signal) => api.post('/user/preferences', { genres }, { signal }), 'Failed to save preferences')
    const updatePreferences = (genres) => handleRequest((signal) => api.patch('/user/preferences', { genres }, { signal }), 'Failed to update preferences')
    const setReadingGoal = (goal) => handleRequest((signal) => api.post('/user/yearly-goal', { yearly_goal:goal }, { signal }), 'Failed to set reading goal')
    const removeAvatar = async () => {
      const result = await handleRequest(
        (signal) => api.delete('/user/avatar', { signal }),
        'Failed to remove avatar'
      )
      if (result.success) {
        if (result.data.token) {
          localStorage.setItem('token', result.data.token)
        }
        updateUser(result.data.user)
      }
      return result
    }

    return { getProfile,getPublicProfile, updateProfile, removeAvatar, getPreferences, savePreferences, updatePreferences, setReadingGoal, loading, error }
}