import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/AppLayout'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import InvoicesPage from './pages/InvoicesPage'
import InvoiceEditorPage from './pages/InvoiceEditorPage'
import InvoiceDetailPage from './pages/InvoiceDetailPage'
import ClientsPage from './pages/ClientsPage'
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
          <Route path="/signin" element={<PublicOnly><AuthPage mode="signin" /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><AuthPage mode="signup" /></PublicOnly>} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/invoices" element={<Protected><InvoicesPage /></Protected>} />
          <Route path="/invoices/new" element={<Protected><InvoiceEditorPage mode="create" /></Protected>} />
          <Route path="/invoices/:id" element={<Protected><InvoiceDetailPage /></Protected>} />
          <Route path="/invoices/:id/edit" element={<Protected><InvoiceEditorPage mode="edit" /></Protected>} />
          <Route path="/clients" element={<Protected><ClientsPage /></Protected>} />
          <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
