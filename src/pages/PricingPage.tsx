import { Link } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { FREE_JOB_LIMIT, FREE_APPLICATION_LIMIT } from '../lib/supabase'

const proPriceId = import.meta.env.VITE_STRIPE_PRO_PRICE_ID as string | undefined
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined

export default function PricingPage() {
  const { profile } = useAuth()
  const isPro = profile?.plan === 'pro'

  const handleUpgrade = () => {
    if (!stripePublishableKey || !proPriceId) {
      alert(
        'Online checkout is not switched on yet. Stripe needs to be connected for this project — once it is, this button will open secure checkout.'
      )
      return
    }
    alert('Checkout will open here once Stripe is connected.')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container landing-nav">
          <Link to="/" className="topbar-logo">
            <img src="/logo.svg" alt="Bragit" width={28} height={28} />
            Bragit
          </Link>
          <div className="topbar-right">
            {profile ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">Open dashboard</Link>
            ) : (
              <>
                <Link to="/signin" className="topbar-link">Sign in</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Start free</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="page">
        <div className="container">
          <div className="page-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ margin: '0 auto' }}>
              <h1 className="page-title">Simple pricing</h1>
              <p className="page-sub">Start free. Upgrade when the offers start rolling in.</p>
            </div>
          </div>

          <div className="pricing-grid" style={{ marginBottom: 32 }}>
            <div className="card price-card">
              {profile && !isPro && <span className="plan-current-tag">Your plan</span>}
              <div className="price-name">Free</div>
              <div className="price-tag">$0<span>/month</span></div>
              <p className="page-sub">For getting organized and testing the waters.</p>
              <ul className="feature-list">
                <li><Check size={16} /> Track up to {FREE_JOB_LIMIT} jobs</li>
                <li><Check size={16} /> {FREE_APPLICATION_LIMIT} active applications</li>
                <li><Check size={16} /> AI fit scoring</li>
                <li><Check size={16} /> Follow-up reminders</li>
              </ul>
              {profile && !isPro && (
                <button className="btn btn-secondary btn-block" disabled>Current plan</button>
              )}
              {!profile && (
                <Link to="/signup" className="btn btn-secondary btn-block">Start free</Link>
              )}
            </div>

            <div className="card price-card featured">
              {isPro && <span className="plan-current-tag">Your plan</span>}
              <div className="price-name">
                Pro <Sparkles size={16} style={{ color: 'var(--primary)', verticalAlign: '-2px' }} />
              </div>
              <div className="price-tag">$9<span>/month</span></div>
              <p className="page-sub">For serious hunters running a full pipeline.</p>
              <ul className="feature-list">
                <li><Check size={16} /> <strong>Unlimited jobs &amp; applications</strong></li>
                <li><Check size={16} /> Unlimited document versions</li>
                <li><Check size={16} /> Advanced fit insights</li>
                <li><Check size={16} /> Priority scoring</li>
                <li><Check size={16} /> Priority support</li>
              </ul>
              {isPro ? (
                <button className="btn btn-primary btn-block" disabled>Current plan</button>
              ) : (
                <button className="btn btn-primary btn-block" onClick={handleUpgrade}>
                  Upgrade to Pro — $9/mo
                </button>
              )}
            </div>
          </div>

          {!profile && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Link to="/signup">Create a free account</Link> and land your next role faster.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
