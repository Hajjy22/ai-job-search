import { NavLink, Link, useNavigate } from 'react-router-dom'
import { LogOut, Crown } from 'lucide-react'
import { useAuth, signOut } from '../context/AuthContext'

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/jobs', label: 'Job Board' },
  { to: '/applications', label: 'Pipeline' },
  { to: '/documents', label: 'Documents' },
  { to: '/settings', label: 'Settings' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, profile } = useAuth()
  const navigate = useNavigate()

  const initial = (profile?.full_name || session?.user?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/dashboard" className="topbar-logo">
            <img src="/logo.svg" alt="Bragit" width={28} height={28} />
            Bragit
          </Link>
          <nav className="topbar-nav">
            {nav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="topbar-right">
            <Link
              to="/pricing"
              className={`plan-pill${profile?.plan === 'pro' ? ' pro' : ''}`}
              title="View plans"
            >
              {profile?.plan === 'pro' ? (
                <>
                  <Crown size={13} /> Pro
                </>
              ) : (
                'Free'
              )}
            </Link>
            <div className="avatar" title={session?.user?.email || ''}>
              {initial}
            </div>
            <button className="icon-btn" onClick={handleSignOut} title="Sign out">
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
