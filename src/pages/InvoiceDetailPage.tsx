import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, Pencil, CircleCheck } from 'lucide-react'
import { supabase, type Invoice } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatMoney, formatDate, invoiceTotals, statusLabel } from '../lib/format'

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data, error: err } = await supabase
        .from('invoices')
        .select('*, clients(id, name, email, address), invoice_items(*)')
        .eq('id', id)
        .maybeSingle()
      if (err || !data) {
        setError(err?.message ?? 'Invoice not found.')
        return
      }
      setInvoice(data as Invoice)
    })()
  }, [id])

  const markPaid = async () => {
    if (!invoice) return
    const { error: err } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoice.id)
    if (err) {
      setError(err.message)
      return
    }
    setInvoice({ ...invoice, status: 'paid', paid_at: new Date().toISOString() })
  }

  if (error) return <div className="form-error">{error}</div>
  if (!invoice) {
    return (
      <div className="loading-page" style={{ minHeight: 300 }}>
        <div><div className="spinner" /> Loading invoice…</div>
      </div>
    )
  }

  const items = [...(invoice.invoice_items ?? [])].sort((a, b) => a.position - b.position)
  const { subtotal, tax, total } = invoiceTotals(items, invoice.tax_rate)
  const label = statusLabel(invoice)
  const business = profile?.business_name || profile?.full_name || 'Your business'

  return (
    <>
      <div className="page-header no-print">
        <div>
          <Link to="/invoices" className="page-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Back to invoices
          </Link>
          <h1 className="page-title" style={{ marginTop: 6 }}>Invoice {invoice.invoice_number}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {invoice.status !== 'paid' && (
            <button className="btn btn-secondary" onClick={markPaid}>
              <CircleCheck size={16} /> Mark as paid
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print / PDF
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
            <Pencil size={16} /> Edit
          </button>
        </div>
      </div>

      <div className="invoice-doc">
        <div className="invoice-doc-header">
          <div>
            <div className="invoice-doc-title">Invoice</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{invoice.invoice_number}</div>
            <span className={`badge badge-${label}`} style={{ marginTop: 10 }}>{label}</span>
          </div>
          <div className="invoice-doc-meta">
            <div><strong>{business}</strong></div>
            <div>Issued: {formatDate(invoice.issue_date)}</div>
            <div>Due: {formatDate(invoice.due_date)}</div>
            {invoice.paid_at && <div style={{ color: 'var(--success)' }}>Paid: {formatDate(invoice.paid_at.slice(0, 10))}</div>}
          </div>
        </div>

        <div className="invoice-doc-parties">
          <div>
            <div className="party-label">From</div>
            <div style={{ fontWeight: 600 }}>{business}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{profile?.email}</div>
          </div>
          <div>
            <div className="party-label">Bill to</div>
            {invoice.clients ? (
              <>
                <div style={{ fontWeight: 600 }}>{invoice.clients.name}</div>
                {invoice.clients.email && <div style={{ color: 'var(--text-secondary)' }}>{invoice.clients.email}</div>}
                {invoice.clients.address && <div style={{ color: 'var(--text-secondary)' }}>{invoice.clients.address}</div>}
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No client</div>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit price</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id ?? item.position}>
                  <td>{item.description}</td>
                  <td style={{ textAlign: 'right' }}>{Number(item.quantity)}</td>
                  <td style={{ textAlign: 'right' }}>{formatMoney(Number(item.unit_price), invoice.currency)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {formatMoney(Number(item.quantity) * Number(item.unit_price), invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="totals-box">
          <div className="totals-row">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal, invoice.currency)}</span>
          </div>
          <div className="totals-row">
            <span>Tax ({Number(invoice.tax_rate)}%)</span>
            <span>{formatMoney(tax, invoice.currency)}</span>
          </div>
          <div className="totals-row grand">
            <span>Total</span>
            <span>{formatMoney(total, invoice.currency)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div className="party-label">Notes</div>
            <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{invoice.notes}</div>
          </div>
        )}
      </div>
    </>
  )
}
