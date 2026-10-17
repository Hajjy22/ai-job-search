import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, FileStack } from 'lucide-react'
import { supabase, type Client } from '../lib/supabase'

const emptyForm = { name: '', email: '', phone: '', address: '', notes: '' }

export default function ClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data, error: err } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setClients(data as Client[])
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditing(client)
    setForm({
      name: client.name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
      notes: client.notes ?? '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setBusy(true)
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    }
    const { error: err } = editing
      ? await supabase.from('clients').update(payload).eq('id', editing.id)
      : await supabase.from('clients').insert(payload)
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setModalOpen(false)
    load()
  }

  const handleDelete = async (client: Client) => {
    if (!confirm(`Delete ${client.name}? Their past invoices stay but will show no client.`)) return
    const { error: err } = await supabase.from('clients').delete().eq('id', client.id)
    if (err) setError(err.message)
    else load()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-sub">People and companies you bill.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Add client
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="card">
        <div className="table-wrap">
          {clients === null ? (
            <div className="empty"><div className="spinner" /></div>
          ) : clients.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><FileStack size={26} /></div>
              <div className="empty-title">No clients yet</div>
              <div className="empty-sub">Add a client to start invoicing them.</div>
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={18} /> Add your first client
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td style={{ fontWeight: 600 }}>{client.name}</td>
                    <td>{client.email ?? '—'}</td>
                    <td>{client.phone ?? '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-btn"
                          onClick={() => navigate(`/invoices/new?client=${client.id}`)}
                          title="New invoice for this client"
                          aria-label="New invoice for this client"
                        >
                          <Plus size={17} />
                        </button>
                        <button className="icon-btn" onClick={() => openEdit(client)} title="Edit" aria-label="Edit client">
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-btn danger"
                          onClick={() => handleDelete(client)}
                          title="Delete"
                          aria-label="Delete client"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit client' : 'Add client'}</h2>
              <button className="icon-btn" onClick={() => setModalOpen(false)} aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="field">
                <label htmlFor="cName">Name *</label>
                <input
                  id="cName"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="invoice-form-grid">
                <div className="field">
                  <label htmlFor="cEmail">Email</label>
                  <input
                    id="cEmail"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="billing@acme.com"
                  />
                </div>
                <div className="field">
                  <label htmlFor="cPhone">Phone</label>
                  <input
                    id="cPhone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 555 000 1234"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="cAddress">Address</label>
                <input
                  id="cAddress"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="100 Main St, Springfield"
                />
              </div>
              <div className="field">
                <label htmlFor="cNotes">Notes</label>
                <textarea
                  id="cNotes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Anything worth remembering about this client"
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : editing ? 'Save changes' : 'Add client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
