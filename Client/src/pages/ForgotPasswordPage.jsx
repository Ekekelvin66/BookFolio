
import { useState } from 'react'
import { Link, useNavigate, useSearchParams,useLocation } from 'react-router-dom'
import { Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Logo from '../components/ui/Logo'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const { forgotPassword, resetPassword, loading } = useAuth()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const isSettingPassword = location.state?.isSettingPassword ?? false

  const emailParam = searchParams.get('email')
  const [step, setStep] = useState(1) // 1: email, 2: code + new password
  const [email, setEmail] = useState(location.state?.email || emailParam || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const validateEmail = () => {
    if (!email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address'
    return null
  }

  const validateReset = () => {
    if (!code.trim()) return 'Please enter the code from your email'
    if (code.length !== 6) return 'Code must be 6 digits'
    if (!newPassword) return 'Password is required'
    if (newPassword.length < 8) return 'Password must be at least 8 characters'
    if (newPassword !== confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleSendCode = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validateEmail()
    if (validationError) { setError(validationError); return }

    const result = await forgotPassword(email)
    if (!result.success) { showToast(result.error, 'error'); return }
    setStep(2)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validateReset()
    if (validationError) { setError(validationError); return }

    const result = await resetPassword(email, code, newPassword)
    if (!result.success) { showToast(result.error, 'error'); return }

    showToast('Password reset successfully!', 'success')
    navigate('/login')
  }

  return (
    <div className="auth">
      <header className="auth-header">
        <Logo className="brand-icon" />
      </header>

      <div className="auth-container">
        <div className="auth-card-branch">

          {step === 1 && (
            <>
             <h1 className="auth-title">
                {isSettingPassword ? 'Set a Password' : 'Forgot Password?'}   {/* 👈 */}
              </h1>
              <p className="panel-desc">
                {isSettingPassword
                  ? "We'll send a 6-digit code to your email so you can set a password for your account."
                  : "Enter your email and we'll send you a 6-digit reset code."
                }
              </p>

              <form className="auth-page__form" onSubmit={handleSendCode}>
                {(emailParam || isSettingPassword) ? (    // 👈 also skip input when setting password
                  <p className="panel-desc">
                    Sending code to <strong>{email}</strong>
                  </p>
                ) : (
                  <Input
                    id="email"
                    type="email"
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    leftIcon={<Mail size={16} />}
                    fullWidth
                    error={error}
                  />
                )}
                <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                  {isSettingPassword ? 'Send Code' : 'Send Reset Code'}   {/* 👈 */}
                </Button>
              </form>

              <p className="auth-page__switch">
                <Link to="/login" className="auth-page__switch-link">
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="auth-title">{isSettingPassword?'Set Your Password' : 'Reset Password'}</h1>
              <p className="panel-desc">
                Enter the 6-digit code sent to <strong>{email}</strong> and 
                {isSettingPassword?'set a password for your account':'choose a new password'}
              </p>

              <form className="auth-page__form" onSubmit={handleResetPassword}>
                <Input
                  id="code"
                  type="text"
                  label="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  fullWidth
                  error={error}
                />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  fullWidth
                  rightIcon={
                    <button type="button" className="auth-page__eye" onClick={() => setShowPassword(p => !p)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  fullWidth
                  error={error}
                  rightIcon={
                    <button type="button" className="auth-page__eye" onClick={() => setShowConfirm(p => !p)}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                  {isSettingPassword?'Set Password':'Reset Password'}
                </Button>
              </form>

              <p className="auth-page__switch">
                <button className="auth-page__switch-link" onClick={() => setStep(1)}>
                  <ArrowLeft size={14} /> Use a different email
                </button>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage