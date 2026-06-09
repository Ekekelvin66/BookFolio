import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import {getSocket} from '../socket'
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            try {
                const decoded = jwtDecode(token)
                if (decoded.exp * 1000 > Date.now()) {
                    setUser(decoded)
                    setIsAuthenticated(true)
                    const s = getSocket()
                    if (s) {
                        s.auth = { userId: decoded.id }
                        s.connect()
                    }
                } else {
                    localStorage.removeItem('token')
                }
            } catch {
                localStorage.removeItem('token')
            }
        }
        setLoading(false)
    }, [])

    const login = (token) => {
        localStorage.setItem('token', token)
        const decoded = jwtDecode(token)
        setUser(decoded)
        setIsAuthenticated(true)
        const s = getSocket()
        if (s) {
            s.auth = { userId: decoded.id }
            console.log('[AuthContext] Connecting socket with userId:', decoded.id)
            s.connect()
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
        setIsAuthenticated(false)
        const s = getSocket()
        if (s) {
            s.auth = { userId: null }
            s.disconnect()
        }
        return true
    }

    const updateUser = (updatedFields) => {
        setUser(prev => ({ ...prev, ...updatedFields }))
    }

    if (loading) return null

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuthContext = () => useContext(AuthContext)
