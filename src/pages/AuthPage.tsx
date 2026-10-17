import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AuthPage({ mode }: { mode: 'signin' | 'signup' }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setBusy(true)

    if (isSignup) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, business_name: businessName },
        },
      })
      if (signUpError) {
        setError(
          signUpError.message === 'User already registered'
            ? 'An account with this email already exists. Try signing in.'
            : signUpError.message
        )
        setBusy(false)
        return
      }
      // Ensure profile exists (trigger covers it; this backfills name fields)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email ?? email,
            full_name: fullName || null,
            business_name: businessName || null,
          }, { onConflict: 'id' })
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError(
          signInError.message.includes('Invalid login')
            ? 'Incorrect email or password.'
            : signInError.message
        )
        setBusy(false)
        return
      }
    }

    setBusy(false)
    navigate('/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-logo">
          <FileText size={26} />
          InvoiceFlow
        </div>
        <p className="auth-sub">
          {isSignup
            ? 'Create your free account — no credit card needed.'
            : 'Welcome back. Sign in to manage your invoices.'}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <div className="field">
                <label htmlFor="fullName">Your name</label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  autoComplete="name"
                />
              </div>
              <div className="field">
                <label htmlFor="businessName">Business name (optional)</label>
                <input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Rivera Design Studio"
                  autoComplete="organization"
                />
              </div>
            </>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create free account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-alt">
          {isSignup ? (
            <>Already have an account? <Link to="/signin">Sign in</Link></>
          ) : (
            <>New to InvoiceFlow? <Link to="/signup">Create a free account</Link></>
          )}
        </p>
      </div>
    </div>
  )
}
