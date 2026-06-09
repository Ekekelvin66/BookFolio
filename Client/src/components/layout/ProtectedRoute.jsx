import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useLocation } from 'react-router-dom'
const ProtectedRoute = ({ children }) => {
    const location = useLocation()
    const { isAuthenticated,user } = useAuthContext()
    if (!isAuthenticated){
        return (
            <Navigate 
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`} 
        replace />
        )
    } 
    if (user && !user.onboarding_complete) return <Navigate to="/onboarding" />
    return children

}

export default ProtectedRoute