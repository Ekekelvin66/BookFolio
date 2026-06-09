import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthContext()

  if (!isAuthenticated) return <Navigate to="/login" />
  if (user?.onboarding_complete) return <Navigate to="/home" />

  return children
}

export default OnboardingRoute