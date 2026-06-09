import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Logo from '../components/ui/Logo'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword, loading } = useAuth()
  const { showToast } = useToast()

  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    if (!newPassword) return 'Password is required'
    if (newPassword.length < 8) return 'Password must be at least 8 characters'
    if (newPassword !== confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!token) {
      showToast('Invalid reset link', 'error')
      return
    }

    const result = await resetPassword(token, newPassword)
    if (!result.success) {
      showToast(result.error, 'error')
      return
    }

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
          <h1 className="auth-title">Reset Password</h1>
          <p className="panel-desc">Enter your new password below.</p>

          <form className="auth-page__form" onSubmit={handleSubmit}>
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              error={error}
              fullWidth
              rightIcon={
                <button
                  type="button"
                  className="auth-page__eye"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
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
              error={error}
              fullWidth
              rightIcon={
                <button
                  type="button"
                  className="auth-page__eye"
                  onClick={() => setShowConfirm((p) => !p)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Button type="submit" variant="primary" fullWidth isLoading={loading}>
              Reset Password
            </Button>
          </form>

          <p className="auth-page__switch">
            <Link to="/login" className="auth-page__switch-link">
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage