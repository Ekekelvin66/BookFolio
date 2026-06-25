import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import { jwtDecode } from 'jwt-decode'

const OAuthCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuthContext()
  const { showToast } = useToast()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      login(token)
      const decoded = jwtDecode(token)
      showToast('Welcome!', 'success')
      navigate(decoded.onboarding_complete ? '/home' : '/onboarding')
    } else {
      showToast('Google login failed. Please try again.', 'error')
      navigate('/login')
    }
  }, [])

  return <Spinner fullPage size='lg'/>
}

export default OAuthCallback