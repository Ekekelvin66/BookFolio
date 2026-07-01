import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import Logo from '../ui/Logo'

const OnboardingLayout = ({ children }) => {
  const navigate = useNavigate()
  const { logout } = useAuthContext()

  const handleLogout = () => {
    const finished = logout()
    if (finished) {
      setTimeout(() => navigate('/', { replace: true }), 0)
    }
  }

  return (
    <div className="onboarding-layout">
      <header className="onboarding-layout__header">
        <Logo className="brand-icon" />
        <button className="onboarding-layout__logout" onClick={handleLogout}>
          <LogOut size={15} /> Log out
        </button>
      </header>
      <main className="onboarding-layout__main">
        <div className="onboarding-layout__container">
          {children}
        </div>
      </main>
    </div>
  )
}

export default OnboardingLayout
