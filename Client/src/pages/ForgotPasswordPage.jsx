import { useState } from 'react'
import { Link,useSearchParams } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Logo from '../components/ui/Logo'
 
const ForgotPasswordPage=()=>{
    const {forgotPassword,loading}=useAuth()
    const {showToast}=useToast()
    const [searchParams]=useSearchParams()


    const emailParam= searchParams.get('email')
    const [email, setEmail] = useState(emailParam)
    const [sent,setSent]=useState(false)
    const [error,setError]=useState('')

    const validate = () => {
        if (!email.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address'
        return null
}

    const handleSubmit=async (e) => {
        e.preventDefault();
        setError('')
        const validationError=validate()
        if (validationError) {
             setError(validationError)
             return
        }
        const result=await(forgotPassword(email))
        if (!result.success) {
            showToast(result.error, 'error')
            return
        }
        setSent(true)
    }
    return (
    <div className="auth">
      <header className="auth-header">
        <Logo className="brand-icon" />
      </header>
 
      <div className="auth-container">
        {sent ? (
          <div className="auth-card-branch">
            <h1 className="auth-title">Check your inbox</h1>
            <p className="panel-desc">
              We sent a password reset link to <strong>{email}</strong>. Check your spam folder if you don't see it.
            </p>
            <div className="auth-page__success-box">
              ✓ Link sent successfully
            </div>
            <p className="auth-page__switch">
              <Link to="/login" className="auth-page__switch-link">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </p>
          </div>
        ) : (
          <div className="auth-card-branch">
            <h1 className="auth-title">Forgot Password?</h1>
            <p className="panel-desc">
              Enter your email and we'll send you a link to reset your password.
            </p>
 
            <form className="auth-page__form" onSubmit={handleSubmit}>
                {emailParam ? (
                    <p className="panel-desc">
                        Sending reset link to <strong>{email}</strong>
                    </p> 
                ):(
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
                Send Reset Link
              </Button>
            </form>
 
            <p className="auth-page__switch">
              <Link to="/login" className="auth-page__switch-link">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
 
export default ForgotPasswordPage
 


