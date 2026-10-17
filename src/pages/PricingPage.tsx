import { Link } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { FREE_INVOICE_LIMIT } from '../lib/supabase'

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
    // Checkout flow activates here once Stripe is configured.
    alert('Checkout will open here once Stripe is connected.')
  }

  return (
    <>
      <div className="page-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ margin: '0 auto' }}>
          <h1 className="page-title">Simple pricing</h1>
          <p className="page-sub">Start free. Upgrade when your business grows.</p>
        </div>
      </div>

      <div className="pricing-grid" style={{ marginBottom: 32 }}>
        <div className="card price-card">
          {profile && !isPro && <span className="plan-current-tag">Your plan</span>}
          <h3>Free</h3>
          <div className="price-tag">$0<span>/month</span></div>
          <p className="page-sub">For trying things out and occasional invoicing.</p>
          <ul className="feature-list">
            <li><Check size={16} /> Up to {FREE_INVOICE_LIMIT} invoices</li>
            <li><Check size={16} /> Client management</li>
            <li><Check size={16} /> Printable / PDF-ready invoices</li>
            <li><Check size={16} /> 8 currencies + tax support</li>
          </ul>
          {profile && !isPro && (
            <button className="btn btn-secondary btn-block" disabled>Current plan</button>
          )}
        </div>

        <div className="card price-card featured">
          {isPro && <span className="plan-current-tag">Your plan</span>}
          <h3>
            Pro <Sparkles size={16} style={{ color: 'var(--primary)', verticalAlign: '-2px' }} />
          </h3>
          <div className="price-tag">$9<span>/month</span></div>
          <p className="page-sub">For freelancers and small businesses that invoice regularly.</p>
          <ul className="feature-list">
            <li><Check size={16} /> <strong>Unlimited invoices</strong></li>
            <li><Check size={16} /> Custom logo &amp; branding on invoices</li>
            <li><Check size={16} /> Payment reminders</li>
            <li><Check size={16} /> Recurring invoices</li>
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
          <Link to="/signup">Create a free account</Link> to start invoicing in minutes.
        </p>
      )}
    </>
  )
}
