import { useState } from "react";
import api from "../utils/api";

export const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleRequest = async (requestFn, fallbackMessage) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await requestFn()
      return { success: true, data }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || fallbackMessage || 'Something went wrong'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const register = (name, email, password) => handleRequest(() => api.post('/register', { name, email, password }), 'Registration failed')
  const login = (email, password) => handleRequest(() => api.post('/login', { email, password }), 'Login failed')
  const googleLogin = () => { window.location.href = `${import.meta.env.VITE_API_URL}/auth/google` }
  const forgotPassword = (email) => handleRequest(() => api.post('/forgot-password', { email }), 'Request failed')
  const resendVerification = (email) => handleRequest(() => api.post('/resend-verification', { email }), 'Resend failed')

  // code-based — sends { email, verific_code } in body
  const verifyUser = (email, verific_code) => handleRequest(() => api.post('/verify', { email, verific_code }), 'Verification failed')

  // code-based — sends { email, code, newPassword } in body
  const resetPassword = (email, code, newPassword) => handleRequest(() => api.post('/reset-password', { email, code, newPassword }), 'Reset failed')

  return { register, login, verifyUser, googleLogin, forgotPassword, resetPassword, resendVerification, loading, error }
}