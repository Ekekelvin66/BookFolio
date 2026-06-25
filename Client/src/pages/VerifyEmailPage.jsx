// import { useEffect, useState,useRef } from 'react'
// import { Link, useSearchParams,useNavigate } from 'react-router-dom'
// import { Mail, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
// import { useAuth } from '../hooks/useAuth'
// import { useToast } from '../context/ToastContext'
// import Button from '../components/ui/Button'
// import Input from '../components/ui/Input'
// import Spinner from '../components/ui/Spinner'
// import Logo from '../components/ui/Logo'

// const VerifyEmailPage = () => {
//   const navigate=useNavigate()
//   const [searchParams] = useSearchParams()
//   const { verifyUser, resendVerification, loading } = useAuth()
//   const { showToast } = useToast()
//   const verifiedRef = useRef(false) 

//   const token = searchParams.get('token')
//   const redirect = searchParams.get('redirect')
//   const emailParam = searchParams.get('email') ?? ''
//   const justRegistered = searchParams.get('resend') === 'true'

//   const [status, setStatus] = useState('idle') 
//   const [email, setEmail] = useState(emailParam)
//   const [resendSent, setResendSent] = useState(false)
  
//     useEffect(() => {
//     if (token) {
//       if (verifiedRef.current) return 
//       verifiedRef.current = true
//       setStatus('verifying')
//       verifyUser(token).then((result) => {
//         setStatus(result.success ? 'success' : 'error')
//       })
//     } else if (justRegistered) {
//       setStatus('sent') 
//     } else {
//       setStatus('resend')
//     }
//   }, [])

//   const handleResend = async (e) => {
//     e.preventDefault()
//     const result = await resendVerification(email)
//     if (!result.success) {
//       showToast(result.error, 'error')
//       return
//     }
//     setResendSent(true)
//     setStatus('sent')
//     showToast('Verification email sent!', 'success')
//   }

//   return (
//     <div className="auth">
//       <header className="auth-header">
//         <Logo className="brand-icon" />
//       </header>

//       <div className="auth-container">

//         {status === 'verifying' && (
//           <div className="auth-status">
//             <Spinner fullPage size='lg' />
//             <p className="panel-desc panel-desc--loading">Verifying your email…</p>
//           </div>
//         )}


//         {status === 'sent' && (
//           <div className="auth-card-branch">
//             <h1 className="auth-title">Check your inbox</h1>
//             <p className="panel-desc">
//               We sent a verification link to <strong>{email}</strong>.
//               Click the link in the email to verify your account.
//             </p>
//             <div className="auth-page__success-box">
//               ✓ Verification email sent
//             </div>
//             <p className="panel-desc">
//               Didn't get it?{' '}
//               <button
//                 className="auth-page__switch-link"
//                 onClick={() => setStatus('resend')}
//               >
//                 Resend the link
//               </button>
//             </p>
//             <p className="auth-page__switch">
//               <Link to="/login" className="auth-page__switch-link">
//                 <ArrowLeft size={14} /> Back to Login
//               </Link>
//             </p>
//           </div>
//         )}



//         {status === 'success' && (
//           <div className="auth-card-branch">
//             <h1 className="auth-title auth-title--success">
//               <CheckCircle size={28} /> Email Verified!
//             </h1>
//             <p className="panel-desc">Your account has been successfully verified.</p>
//             <div className="auth-page__success-box">
//               ✓ You can now log in to your account.
//             </div>
//             <Button variant="primary" fullWidth onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`)}>
//               Go to Login
//             </Button>
//             <p className="auth-page__switch">
//               <Link to="/" className="auth-page__switch-link">
//                 <ArrowLeft size={14} /> Back to Home
//               </Link>
//             </p>
//           </div>
//         )}

//         {status === 'error' && (
//           <div className="auth-card-branch">
//             <h1 className="auth-title auth-title--error">
//               <AlertTriangle size={28} /> Link Expired
//             </h1>
//             <p className="panel-desc">This verification link is invalid or has expired.</p>
//             <Button variant="primary" fullWidth onClick={() => setStatus('resend')}>
//               Resend Verification Email
//             </Button>
//             <p className="auth-page__switch">
//               <Link to="/login" className="auth-page__switch-link">Back to Login</Link>
//             </p>
//           </div>
//         )}

//         {status === 'resend' && (
//           <div className="auth-card-branch">
//             <h1 className="auth-title">Verify your Email</h1>
//             <p className="panel-desc">
//               {resendSent
//                 ? 'A new link has been sent. Check your inbox and spam folder.'
//                 : 'Enter your email and we\'ll send you a fresh verification link.'}
//             </p>

//             {!resendSent && (
//               <form className="auth-page__form" onSubmit={handleResend}>
//                 <Input
//                   id="email"
//                   type="email"
//                   label="Email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="you@example.com"
//                   leftIcon={<Mail size={16} />}
//                   fullWidth
//                 />
//                 <Button type="submit" variant="primary" fullWidth isLoading={loading}>
//                   Resend Link
//                 </Button>
//               </form>
//             )}

//             <p className="auth-page__switch">
//               Already verified?{' '}
//               <Link to="/login" className="auth-page__switch-link">Login</Link>
//             </p>
//           </div>
//         )}

//       </div>
//     </div>
//   )
// }

// export default VerifyEmailPage
import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Logo from '../components/ui/Logo'

const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { verifyUser, resendVerification, loading } = useAuth()
  const { showToast } = useToast()

  const emailParam = searchParams.get('email') ?? ''
  const redirect = searchParams.get('redirect') ?? '/'

  const [email, setEmail] = useState(emailParam)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle') // idle | success
  const [error, setError] = useState('')
  const [resendSent, setResendSent] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('Email is required'); return }
    if (code.length !== 6) { setError('Enter the 6-digit code from your email'); return }

    const result = await verifyUser(email, code)
    if (!result.success) {
      setError(result.error)
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
            <Button variant="primary" fullWidth onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`)}>
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
              />
            )}

            <Input
              id="code"
              type="text"
              label="Verification Code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              fullWidth
              error={error}
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