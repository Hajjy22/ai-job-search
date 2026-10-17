import { NavLink, Link, useNavigate } from 'react-router-dom'
import { FileText, LogOut, LayoutDashboard, Users, FileStack, Settings, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  const email = profile?.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/dashboard" className="topbar-logo">
            <FileText size={22} />
            InvoiceFlow
          </Link>
          <nav className="topbar-nav">
            <NavLink to="/dashboard" className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>
              <LayoutDashboard size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Dashboard
            </NavLink>
            <NavLink to="/invoices" className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>
              <FileStack size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Invoices
            </NavLink>
            <NavLink to="/clients" className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>
              <Users size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Clients
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}>
              <Settings size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Settings
            </NavLink>
          </nav>
          <div className="topbar-right">
            <span className={`plan-pill${profile?.plan === 'pro' ? ' pro' : ''}`}>
              {profile?.plan === 'pro' && <Sparkles size={13} />}
              {profile?.plan === 'pro' ? 'Pro' : 'Free'}
            </span>
            <div className="avatar" title={email}>{initials}</div>
            <button className="icon-btn" onClick={handleSignOut} title="Sign out" aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="page">
        <div className="container">{children}</div>
      </main>
    </div>
  )
}
