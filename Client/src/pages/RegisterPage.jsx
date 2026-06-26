import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import Logo from '../components/ui/Logo'

const Register = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { register, googleLogin, loading } = useAuth()
  const [searchParams]=useSearchParams()
  const redirect = searchParams.get('redirect')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [activeTab, setActiveTab] = useState('google')

  const validate = () => {
    const newErrors = {}

    if (!name.trim())
      newErrors.name = 'Name is required'

    if (!email.trim())
      newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Enter a valid email address'

    if (!password)
      newErrors.password = 'Password is required'
    else if (password.length < 8)
      newErrors.password = 'Password must be at least 8 characters'
    else if (password.trim() !== password)
      newErrors.password = 'Password cannot start or end with spaces'

    if (password !== confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const result = await register(name, email, password)
    if (!result.success) {
      showToast(result.error, 'error')
      return
    }

    showToast('Check your email to verify your account', 'success')
    navigate(`/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirect)}`)
  }

  if (loading) return <Spinner fullPage size='lg'/>

  return (
    <div className="auth">
      <header className="auth-header">
        <Logo className="brand-icon" />
      </header>

      <div className="auth-container">
        <h1>Create your Reading Library</h1>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === 'google' ? 'active' : ''}`}
            onClick={() => setActiveTab('google')}
          >
            Google
          </button>
          <button
            className={`auth-tab ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            Email
          </button>
        </div>

        {activeTab === 'google' && (
          <div className="auth-page-form">
            <p className="panel-desc">Sign up quickly and securely with your Google account.</p>
            <button className="btn btn-google" onClick={googleLogin}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        {activeTab === 'email' && (
          <form className="auth-page__form" onSubmit={handleSubmit}>
            <div className="auth-page__field">
              <label className="auth-page__label" htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                className="auth-page__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
              {errors.name && <p className="auth-page__error">{errors.name}</p>}
            </div>

            <div className="auth-page__field">
              <label className="auth-page__label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="auth-page__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="auth-page__error">{errors.email}</p>}
            </div>

            <div className="auth-page__field">
              <label className="auth-page__label" htmlFor="password">Password</label>
              <div className="auth-page__input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-page__input auth-page__input--icon"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-page__eye"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="auth-page__error">{errors.password}</p>}
            </div>

            <div className="auth-page__field">
              <label className="auth-page__label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="auth-page__input-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className="auth-page__input auth-page__input--icon"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-page__eye"
                  onClick={() => setShowConfirm((p) => !p)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="auth-page__error">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" className="auth-page__submit" disabled={loading}>
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>

            <p className="auth-page__switch">
              Already have an account?{' '}
              <Link to="/login" className="auth-page__switch-link">Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default Register