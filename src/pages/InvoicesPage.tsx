import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, FileStack, Sparkles } from 'lucide-react'
import { supabase, FREE_INVOICE_LIMIT, type Invoice } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatMoney, formatDate, invoiceTotals, statusLabel } from '../lib/format'

export default function InvoicesPage() {
  const { profile } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data, error: err } = await supabase
      .from('invoices')
      .select('*, clients(id, name, email, address), invoice_items(*)')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setInvoices((data ?? []) as Invoice[])
  }

  const handleDelete = async (invoice: Invoice) => {
    if (!confirm(`Delete invoice ${invoice.invoice_number}? This cannot be undone.`)) return
    const { error: err } = await supabase.from('invoices').delete().eq('id', invoice.id)
    if (err) setError(err.message)
    else load()
  }

  const setStatus = async (invoice: Invoice, status: Invoice['status']) => {
    const { error: err } = await supabase.from('invoices').update({ status }).eq('id', invoice.id)
    if (err) setError(err.message)
    else load()
  }

  const isFree = profile?.plan !== 'pro'
  const invoiceCount = invoices?.length ?? 0
  const atLimit = isFree && invoiceCount >= FREE_INVOICE_LIMIT

  const filtered = (invoices ?? []).filter((inv) => {
    if (filter === 'all') return true
    if (filter === 'overdue') return statusLabel(inv) === 'overdue'
    return inv.status === filter
  })

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-sub">
            {isFree
              ? `${invoiceCount} of ${FREE_INVOICE_LIMIT} free invoices used`
              : `${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link
          to={atLimit ? '/pricing' : '/invoices/new'}
          className="btn btn-primary"
          title={atLimit ? 'Free limit reached — upgrade to continue' : undefined}
        >
          {atLimit ? <><Sparkles size={18} /> Upgrade to create more</> : <><Plus size={18} /> New invoice</>}
        </Link>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize' }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          {invoices === null ? (
            <div className="empty"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><FileStack size={26} /></div>
              <div className="empty-title">
                {invoices.length === 0 ? 'No invoices yet' : 'No invoices match this filter'}
              </div>
              {invoices.length === 0 && (
                <>
                  <div className="empty-sub">Create your first invoice and get paid faster.</div>
                  <Link to="/invoices/new" className="btn btn-primary">
                    <Plus size={18} /> Create your first invoice
                  </Link>
                </>
              )}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Issue date</th>
                  <th>Due date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
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
                      <td>{formatDate(inv.issue_date)}</td>
                      <td>{formatDate(inv.due_date)}</td>
                      <td>
                        {inv.status === 'sent' ? (
                          <select
                            value="sent"
                            onChange={(e) => setStatus(inv, e.target.value as Invoice['status'])}
                            style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8125rem' }}
                            aria-label="Change invoice status"
                          >
                            <option value="sent">Sent</option>
                            <option value="draft">Draft</option>
                            <option value="paid">Paid</option>
                          </select>
                        ) : (
                          <span className={`badge badge-${label}`}>{label}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatMoney(total, inv.currency)}
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/invoices/${inv.id}`} className="icon-btn" title="View" aria-label="View invoice">
                            <Eye size={16} />
                          </Link>
                          <Link to={`/invoices/${inv.id}/edit`} className="icon-btn" title="Edit" aria-label="Edit invoice">
                            <Pencil size={16} />
                          </Link>
                          <button
                            className="icon-btn danger"
                            onClick={() => handleDelete(inv)}
                            title="Delete"
                            aria-label="Delete invoice"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
