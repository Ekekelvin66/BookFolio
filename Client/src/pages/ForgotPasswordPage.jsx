
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
  const [editingEmail, setEditingEmail] = useState(false)
  const [errors, setErrors] = useState({})

  const validateEmail = () => {
    const newErrors = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email address'
    return newErrors
  }

  const validateReset = () => {
    const newErrors = {}
    if (!code.trim()) newErrors.code = 'Please enter the code from your email'
    else if (code.length !== 6) newErrors.code = 'Code must be 6 digits'
    if (!newPassword) newErrors.newPassword = 'Password is required'
    else if (newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters'
    if (newPassword && confirmPassword && newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    return newErrors
  }

  const handleSendCode = async (e) => {
    e.preventDefault()
    setErrors({})
    const validationError = validateEmail()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }

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
                  ? (
                      <>We'll send a 6-digit verification code to <strong>{email}</strong> so you can set your account password </>
                    )
                  : emailParam
                    ? (
                        <> We'll send a 6-digit reset code to <strong>{email}</strong>.</>
                      )
                    :(
                      "Enter your email and we'll send you a 6-digit reset code."
                    )}
              </p>

              <form className="auth-page__form" onSubmit={handleSendCode}>
                {(emailParam || isSettingPassword) &&!editingEmail ? (    // 👈 also skip input when setting password
                <p className="auth-page__notyou">
                  <Button
                    type="button"
                    variant=''
                    className="auth-page__switch-link"
                    onClick={() => setEditingEmail(true)}
                  >
                    Not your account?
                  </Button>
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
                    error={errors.email}
                  />
                )}
                <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                  {isSettingPassword ? 'Send Code' : 'Send Reset Code'}  
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
               <CodeInput
                  value={code}
                  onChange={setCode}
                  error={errors.code}
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
                   error={errors.newPassword}
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
                  error={errors.confirmPassword}
                />
                <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                  {isSettingPassword?'Set Password':'Reset Password'}
                </Button>
              </form>

              <p className="auth-page__switch">
                <button className="auth-page__switch-link" onClick={() => {setStep(1); setErrors({})}}>
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