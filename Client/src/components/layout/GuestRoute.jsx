import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

const GuestRoute = ({ children }) => {
    const { isAuthenticated } = useAuthContext()
    return isAuthenticated ? <Navigate to='/home' /> : children
}

export default GuestRoute