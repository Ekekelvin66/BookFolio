import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Logo from '../components/ui/Logo'
import CodeInput from '../components/ui/CodeInput'

const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { verifyUser, resendVerification, loading } = useAuth()
  const { showToast } = useToast()

  const emailParam = searchParams.get('email') ?? ''
  const redirect = searchParams.get('redirect') ?? '/'

  const [email, setEmail] = useState(emailParam)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle')
  const [errors, setErrors] = useState({})
  const [resendSent, setResendSent] = useState(false)

  const handleVerify = async (e, codeOverride) => {
    e?.preventDefault()
    setErrors({})

    const codeToUse = codeOverride ?? code
    const newErrors = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    if (codeToUse.length !== 6) newErrors.code = 'Enter the 6-digit code from your email'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    const result = await verifyUser(email, codeToUse)
    if (!result.success) {
      setErrors({ code: result.error })
      return
    }
    setStatus('success')
  }

  const handleResend = async () => {
    if (!email.trim()) { showToast('Enter your email first', 'error'); return }
    const result = await resendVerification(email)
    if (!result.success) { showToast(result.error, 'error'); return }
    setResendSent(true)
    showToast('A new code has been sent!', 'success')
  }

  if (status === 'success') {
    return (
      <div className="auth">
        <header className="auth-header">
          <Logo className="brand-icon" />
        </header>
        <div className="auth-container">
          <div className="auth-card-branch">
            <h1 className="auth-title auth-title--success">
              <CheckCircle size={28} /> Email Verified!
            </h1>
            <p className="panel-desc">Your account has been successfully verified.</p>
            <div className="auth-page__success-box">
              ✓ You can now log in to your account.
            </div>
            <Button variant="primary" fullWidth onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`,{state:{email}})}>
              Go to Login
            </Button>
            <p className="auth-page__switch">
              <Link to="/" className="auth-page__switch-link">
                <ArrowLeft size={14} /> Back to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth">
      <header className="auth-header">
        <Logo className="brand-icon" />
      </header>

      <div className="auth-container">
        <div className="auth-card-branch">
          <h1 className="auth-title">Verify your Email</h1>
          <p className="panel-desc">
            {emailParam
              ? <>We sent a 6-digit code to <strong>{emailParam}</strong>. Enter it below.</>
              : "Enter your email and the 6-digit code we sent you."}
          </p>

          <form className="auth-page__form" onSubmit={handleVerify}>
            {!emailParam && (
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

                <CodeInput
                  value={code}
                  onChange={setCode}
                  onComplete={(fullCode) => handleVerify(undefined, fullCode)}
                  error={errors.code}
                />
            <Button type="submit" variant="primary" fullWidth isLoading={loading}>
              Verify Email
            </Button>
          </form>

          <p className="panel-desc" style={{ marginTop: '1rem' }}>
            {resendSent ? '✓ New code sent — check your inbox.' : (
              <>
                Didn't get a code?{' '}
                <button
                  type="button"
                  className="auth-page__switch-link"
                  onClick={handleResend}
                  disabled={loading}
                >
                  Resend code
                </button>
              </>
            )}
          </p>

          <p className="auth-page__switch">
            Already verified?{' '}
            <Link to="/login" className="auth-page__switch-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage