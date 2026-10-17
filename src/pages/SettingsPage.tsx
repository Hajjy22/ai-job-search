import { useState, type FormEvent } from 'react'
import { Save, Sparkles, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [businessName, setBusinessName] = useState(profile?.business_name ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setStatus('saving')
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        business_name: businessName.trim() || null,
      })
      .eq('id', profile.id)
    if (error) {
      setStatus('error')
      return
    }
    await refreshProfile()
    setStatus('saved')
  }

  if (!profile) return null

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Your details appear on every invoice you send.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 28, maxWidth: 640 }}>
        <form onSubmit={handleSave}>
          <div className="field">
            <label htmlFor="sEmail">Email</label>
            <input id="sEmail" value={profile.email} disabled />
          </div>
          <div className="settings-grid">
            <div className="field">
              <label htmlFor="sName">Your name</label>
              <input
                id="sName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivera"
              />
            </div>
            <div className="field">
              <label htmlFor="sBusiness">Business name</label>
              <input
                id="sBusiness"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Rivera Design Studio"
              />
            </div>
          </div>

          {status === 'saved' && <div className="form-success">Settings saved.</div>}
          {status === 'error' && <div className="form-error">Could not save settings. Please try again.</div>}

          <button type="submit" className="btn btn-primary" disabled={status === 'saving'}>
            <Save size={16} /> {status === 'saving' ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 28, maxWidth: 640, marginTop: 20 }}>
        <h3 style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} style={{ color: 'var(--primary)' }} /> Subscription
        </h3>
        <p className="page-sub" style={{ marginBottom: 16 }}>
          You are on the <strong>{profile.plan === 'pro' ? 'Pro' : 'Free'}</strong> plan.
          {profile.plan !== 'pro' && ' Upgrade for unlimited invoices and extras.'}
        </p>
        {profile.plan !== 'pro' && (
          <Link to="/pricing" className="btn btn-primary">
            <Sparkles size={16} /> See Pro plan
          </Link>
        )}
      </div>

      <div style={{ maxWidth: 640, marginTop: 24, textAlign: 'right' }}>
        <button
          className="btn btn-secondary"
          onClick={async () => {
            await supabase.auth.signOut()
          }}
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </>
  )
}
