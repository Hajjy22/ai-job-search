import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { Trash2, Plus, Save, ArrowLeft, Sparkles } from 'lucide-react'
import { supabase, type Client, type InvoiceItem } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatMoney, invoiceTotals } from '../lib/format'

const blankItem = (position: number): InvoiceItem => ({
  description: '',
  quantity: 1,
  unit_price: 0,
  position,
})

const today = () => new Date().toISOString().slice(0, 10)
const inDays = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)

export default function InvoiceEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()

  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState<string>('')
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid'>('draft')
  const [issueDate, setIssueDate] = useState(today())
  const [dueDate, setDueDate] = useState(inDays(14))
  const [currency, setCurrency] = useState('USD')
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([blankItem(0)])
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(mode === 'edit')

  const loadClients = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    if (!err) {
      const list = (data ?? []) as Client[]
      setClients(list)
      const preset = searchParams.get('client')
      if (preset && list.some((c) => c.id === preset)) setClientId(preset)
    }
  }, [searchParams])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  useEffect(() => {
    if (mode !== 'edit' || !id) return
    ;(async () => {
      const { data, error: err } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', id)
        .maybeSingle()
      if (err || !data) {
        setError(err?.message ?? 'Invoice not found.')
        setLoading(false)
        return
      }
      setClientId(data.client_id ?? '')
      setStatus(data.status === 'overdue' ? 'sent' : data.status)
      setIssueDate(data.issue_date)
      setDueDate(data.due_date)
      setCurrency(data.currency)
      setTaxRate(Number(data.tax_rate))
      setNotes(data.notes ?? '')
      setInvoiceNumber(data.invoice_number)
      const loaded = (data.invoice_items ?? []) as InvoiceItem[]
      setItems(loaded.length ? loaded : [blankItem(0)])
      setLoading(false)
    })()
  }, [mode, id])

  const updateItem = (index: number, patch: Partial<InvoiceItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const addItem = () => setItems((prev) => [...prev, blankItem(prev.length)])

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? [blankItem(0)] : prev.filter((_, i) => i !== index)))
  }

  const handleSave = async (saveStatus?: 'draft' | 'sent') => {
    setError(null)
    const finalStatus = saveStatus ?? status
    const cleanedItems = items.filter((item) => item.description.trim())

    if (cleanedItems.length === 0) {
      setError('Add at least one line item with a description.')
      return
    }
    if (finalStatus === 'sent' && !clientId) {
      setError('Pick a client before sending the invoice.')
      return
    }

    setBusy(true)
    const invoicePayload = {
      client_id: clientId || null,
      status: finalStatus,
      issue_date: issueDate,
      due_date: dueDate,
      currency,
      tax_rate: taxRate,
      notes: notes.trim() || null,
    }

    let invoiceId = id
    if (mode === 'create') {
      const { data, error: err } = await supabase
        .from('invoices')
        .insert(invoicePayload)
        .select('id')
        .maybeSingle()
      if (err || !data) {
        setError(
          err?.message.includes('Free plan limit')
            ? 'You have reached the free plan limit of 3 invoices. Upgrade to Pro for unlimited invoices.'
            : err?.message ?? 'Failed to create the invoice.'
        )
        setBusy(false)
        return
      }
      invoiceId = data.id
    } else {
      const { error: err } = await supabase
        .from('invoices')
        .update(invoicePayload)
        .eq('id', id)
      if (err) {
        setError(err.message)
        setBusy(false)
        return
      }
    }

    if (!invoiceId) {
      setError('Something went wrong. Please try again.')
      setBusy(false)
      return
    }

    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)
    const { error: itemsError } = await supabase.from('invoice_items').insert(
      cleanedItems.map((item, index) => ({
        invoice_id: invoiceId,
        description: item.description.trim(),
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
        position: index,
      }))
    )

    setBusy(false)
    if (itemsError) {
      setError(itemsError.message)
      return
    }
    navigate(`/invoices/${invoiceId}`)
  }

  if (loading) {
    return (
      <div className="loading-page" style={{ minHeight: 300 }}>
        <div><div className="spinner" /> Loading invoice…</div>
      </div>
    )
  }

  const { subtotal, tax, total } = invoiceTotals(items, taxRate)
  const isFree = profile?.plan !== 'pro'
  const atLimit = isFree && mode === 'create'

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/invoices" className="page-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Back to invoices
          </Link>
          <h1 className="page-title" style={{ marginTop: 6 }}>
            {mode === 'create' ? 'New invoice' : `Edit ${invoiceNumber}`}
          </h1>
        </div>
      </div>

      {atLimit && (
        <div className="upgrade-banner">
          <div>
            <h3>Free plan limit reached</h3>
            <p>You can preview this invoice, but upgrade to Pro to save more than 3 invoices.</p>
          </div>
          <Link to="/pricing" className="btn"><Sparkles size={16} /> Upgrade to Pro</Link>
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      <div className="card" style={{ padding: 28 }}>
        <div className="invoice-form-grid">
          <div className="field">
            <label htmlFor="client">Client</label>
            <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">— No client —</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            {clients.length === 0 && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 6 }}>
                No clients yet — <Link to="/clients">add one first</Link> (optional).
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'sent' | 'paid')}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="issueDate">Issue date</label>
            <input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="dueDate">Due date</label>
            <input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="currency">Currency</label>
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="taxRate">Tax rate (%)</label>
            <input
              id="taxRate"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="items-editor" style={{ marginTop: 24 }}>
          <label>Line items</label>
          <div className="item-row" style={{ marginBottom: 6 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Description</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Qty</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Unit price</div>
            <div className="item-total" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Amount</div>
            <div className="item-remove" />
          </div>
          {items.map((item, index) => (
            <div className="item-row" key={index}>
              <input
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="e.g. Website design — 10 pages"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                aria-label="Quantity"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={item.unit_price}
                onChange={(e) => updateItem(index, { unit_price: Number(e.target.value) })}
                aria-label="Unit price"
              />
              <div className="item-total" style={{ fontWeight: 600 }}>
                {formatMoney((Number(item.quantity) || 0) * (Number(item.unit_price) || 0), currency)}
              </div>
              <button
                type="button"
                className="icon-btn danger item-remove"
                onClick={() => removeItem(index)}
                title="Remove line"
                aria-label="Remove line item"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
            <Plus size={15} /> Add line
          </button>

          <div className="totals-box">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, currency)}</span>
            </div>
            <div className="totals-row">
              <span>Tax ({taxRate}%)</span>
              <span>{formatMoney(tax, currency)}</span>
            </div>
            <div className="totals-row grand">
              <span>Total</span>
              <span>{formatMoney(total, currency)}</span>
            </div>
          </div>
        </div>

        <div className="field" style={{ marginTop: 24 }}>
          <label htmlFor="notes">Notes for the client</label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment details, thank-you note, late fee terms…"
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Link to="/invoices" className="btn btn-secondary">Cancel</Link>
          <button className="btn btn-secondary" disabled={busy} onClick={() => handleSave('draft')}>
            <Save size={16} /> Save as draft
          </button>
          <button className="btn btn-primary" disabled={busy} onClick={() => handleSave('sent')}>
            Save &amp; mark as sent
          </button>
        </div>
      </div>
    </>
  )
}
