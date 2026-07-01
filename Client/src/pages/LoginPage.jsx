import { useState } from 'react'
import { Link, useNavigate, useSearchParams,useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthContext } from '../context/AuthContext'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/ui/Spinner'
import Logo from '../components/ui/Logo'

const Login = () => {
  const navigate = useNavigate()
  const { login: setAuth } = useAuthContext()
  const location=useLocation()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const { login, googleLogin, loading } = useAuth()

  const [email, setEmail] = useState(location.state?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [unverified, setUnverified] = useState(null)
  const [googleAccountData, setGoogleAccountData] = useState(null)
  const redirect = searchParams.get('redirect') ?? ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUnverified(null)
    setGoogleAccountData(null)
    const result = await login(email, password)

    if (!result.success) {
      if (result.data?.authMethod === 'google') {
        setGoogleAccountData(result.data)
        return
      }
      showToast(result.error, 'error')
      return
    }

    if (!result.data.token) {
      setUnverified(result.data.email)
      showToast('Please verify your email first', 'warning')
      return
    }

    setAuth(result.data.token)
    if (!result.data.user.onboarding_complete) {
      navigate('/onboarding')
      showToast('Pls complete your onboarding first')
    }
    showToast('Welcome back!', 'success')
    navigate(redirect || '/home', { replace: true })
  }

  if (loading) return <Spinner fullPage size='md' />

  return (
    <div className="auth">
      <header className="auth-header">
        <Logo className="brand-icon" />
      </header>

      <div className="auth-container">
        <div className="auth-card-branch">
          <h1 className="auth-title">Log in to your account</h1>
          <p className="panel-desc">Welcome back! Please enter your details.</p>

          <form className="auth-page__form" onSubmit={handleSubmit}>
            <div className="auth-page__field">
              <label className="auth-page__label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="auth-page__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-page__field">
              <div className="auth-page__label-row">
                <label className="auth-page__label" htmlFor="password">Password</label>
                {email ? (
                  <Link to={`/forgot-password?email=${encodeURIComponent(email)}`} className="auth-page__forgot">
                    Forgot password?
                  </Link>
                ) : (
                  <Link to="/forgot-password" className="auth-page__forgot">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="auth-page__input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-page__input auth-page__input--icon"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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
            </div>

            {unverified && (
              <div className="auth-page__unverified">
                <p>Your account is not verified yet.</p>
                <Link
                  to={`/verify-email?resend=true&email=${encodeURIComponent(unverified)}`}
                  className="auth-page__resend"
                >
                  Resend verification email
                </Link>
              </div>
            )}

            {googleAccountData && (
              <div className="auth-page__google-notice">
                <p className="auth-page__google-notice-text">
                  <strong>{googleAccountData.email}</strong> was registered with Google.
                </p>
                <div className="auth-page__google-notice-actions">
                  <button type='button' className="btn btn-google" onClick={googleLogin}>
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => navigate('/forgot-password', {
                      state: { email: googleAccountData.email, isSettingPassword: true }
                    })}
                  >
                    Set a password instead
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="auth-page__submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          
          <div className="auth-page__divider">or</div>

          <button className="btn btn-google" onClick={googleLogin}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Sign in with Google
          </button>

          <p className="auth-page__switch">
            Don't have an account?{' '}
            <Link to="/register" className="auth-page__switch-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login