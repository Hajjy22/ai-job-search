import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/AppLayout'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import JobsPage from './pages/JobsPage'
import JobDetailPage from './pages/JobDetailPage'
import ApplicationsPage from './pages/ApplicationsPage'
import DocumentsPage from './pages/DocumentsPage'
import SettingsPage from './pages/SettingsPage'
import PricingPage from './pages/PricingPage'

function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="loading-page">
        <div>
          <div className="spinner" />
          Loading…
        </div>
      </div>
    )
  }
  if (!session) return <Navigate to="/signin" replace />
  return <AppLayout>{children}</AppLayout>
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="loading-page">
        <div>
          <div className="spinner" />
          Loading…
        </div>
      </div>
    )
  }
  if (session) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<PublicOnly><AuthPage mode="signin" /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><AuthPage mode="signup" /></PublicOnly>} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/jobs" element={<Protected><JobsPage /></Protected>} />
          <Route path="/jobs/:id" element={<Protected><JobDetailPage /></Protected>} />
          <Route path="/applications" element={<Protected><ApplicationsPage /></Protected>} />
          <Route path="/documents" element={<Protected><DocumentsPage /></Protected>} />
          <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
