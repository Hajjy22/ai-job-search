import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Sparkles, TrendingUp, Clock, CircleCheck, FileStack } from 'lucide-react'
import { supabase, FREE_INVOICE_LIMIT, type Invoice } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatMoney, formatDate, invoiceTotals, statusLabel } from '../lib/format'

interface DashboardData {
  outstanding: number
  paidThisMonth: number
  overdueCount: number
  invoiceCount: number
  recent: Invoice[]
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data: invoices, error: err } = await supabase
      .from('invoices')
      .select('*, clients(id, name, email, address)')
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
      return
    }
    const list = (invoices ?? []) as Invoice[]
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let outstanding = 0
    let paidThisMonth = 0
    let overdueCount = 0

    for (const inv of list) {
      const { total } = invoiceTotals(inv.invoice_items ?? [], inv.tax_rate)
      if (inv.status === 'paid') {
        if (inv.paid_at && new Date(inv.paid_at) >= monthStart) paidThisMonth += total
      } else {
        outstanding += total
        if (statusLabel(inv) === 'overdue') overdueCount += 1
      }
    }

    setData({
      outstanding,
      paidThisMonth,
      overdueCount,
      invoiceCount: list.length,
      recent: list.slice(0, 5),
    })
  }

  if (error) return <div className="form-error">{error}</div>
  if (!data) {
    return (
      <div className="loading-page" style={{ minHeight: 300 }}>
        <div>
          <div className="spinner" />
          Loading your dashboard…
        </div>
      </div>
    )
  }

  const isFree = profile?.plan !== 'pro'
  const remaining = FREE_INVOICE_LIMIT - data.invoiceCount

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Here is how your business is doing.</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary">
          <Plus size={18} /> New invoice
        </Link>
      </div>

      {isFree && (
        <div className="upgrade-banner">
          <div>
            <h3>You are on the Free plan</h3>
            <p>
              {remaining > 0
                ? `${remaining} of ${FREE_INVOICE_LIMIT} free invoices left.`
                : 'You have used all free invoices.'}{' '}
              Upgrade to Pro for unlimited invoices, custom branding and more.
            </p>
          </div>
          <Link to="/pricing" className="btn">
            <Sparkles size={16} /> Upgrade to Pro
          </Link>
        </div>
      )}

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value">{formatMoney(data.outstanding, 'USD')}</div>
          <div className="stat-note">Awaiting payment</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Paid this month</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {formatMoney(data.paidThisMonth, 'USD')}
          </div>
          <div className="stat-note">
            <TrendingUp size={12} style={{ verticalAlign: '-1px' }} /> Collected revenue
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value" style={{ color: data.overdueCount > 0 ? 'var(--danger)' : undefined }}>
            {data.overdueCount}
          </div>
          <div className="stat-note">
            <Clock size={12} style={{ verticalAlign: '-1px' }} /> Needs a reminder
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total invoices</div>
          <div className="stat-value">{data.invoiceCount}</div>
          <div className="stat-note">
            <CircleCheck size={12} style={{ verticalAlign: '-1px' }} />
            {isFree ? ` ${remaining} left on Free` : ' Unlimited on Pro'}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          {data.recent.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><FileStack size={26} /></div>
              <div className="empty-title">No invoices yet</div>
              <div className="empty-sub">Create your first invoice and get paid faster.</div>
              <Link to="/invoices/new" className="btn btn-primary">
                <Plus size={18} /> Create your first invoice
              </Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Due date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((inv) => {
                  const { total } = invoiceTotals(inv.invoice_items ?? [], inv.tax_rate)
                  const label = statusLabel(inv)
                  return (
                    <tr key={inv.id}>
                      <td>
                        <Link to={`/invoices/${inv.id}`} style={{ fontWeight: 600 }}>
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td>{inv.clients?.name ?? '—'}</td>
                      <td><span className={`badge badge-${label}`}>{label}</span></td>
                      <td>{formatDate(inv.due_date)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatMoney(total, inv.currency)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
