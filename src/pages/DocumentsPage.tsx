import { useEffect, useState, type FormEvent } from 'react'
import { FileText, Plus, Trash2, CheckCircle2, Eye, Pencil } from 'lucide-react'
import { supabase, type JobDocument, type DocumentType } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Modal, EmptyState, Spinner } from '../components/ui'
import { useToast } from '../lib/useToast'
import { formatDate } from '../lib/supabase'

const DOC_LABELS: Record<DocumentType, string> = {
  cv: 'CV / Resume',
  cover_letter: 'Cover letter',
  other: 'Other',
}

export default function DocumentsPage() {
  const { profile } = useAuth()
  const { showToast, toastNode } = useToast()
  const [docs, setDocs] = useState<JobDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<JobDocument | null>(null)
  const [viewing, setViewing] = useState<JobDocument | null>(null)
  const [form, setForm] = useState({ doc_type: 'cv' as DocumentType, title: '', content: '' })
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) showToast('Could not load documents', true)
    setDocs((data as JobDocument[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isPro = profile?.plan === 'pro'
  const cvCount = docs.filter((d) => d.doc_type === 'cv').length
  const letterCount = docs.filter((d) => d.doc_type === 'cover_letter').length
  const atLimit = !isPro && cvCount + letterCount >= 3

  const openAdd = () => {
    if (atLimit) {
      showToast('Free plan stores 3 documents. Upgrade to Pro for unlimited.', true)
      return
    }
    setEditing(null)
    setForm({ doc_type: 'cv', title: '', content: '' })
    setShowModal(true)
  }

  const openEdit = (doc: JobDocument) => {
    setEditing(doc)
    setForm({ doc_type: doc.doc_type, title: doc.title, content: doc.content || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const payload = {
      doc_type: form.doc_type,
      title: form.title.trim(),
      content: form.content.trim() || null,
    }
    let error
    if (editing) {
      ({ error } = await supabase
        .from('documents')
        .update({ ...payload, version: editing.version + 1 })
        .eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('documents').insert(payload))
    }
    setBusy(false)
    if (error) {
      showToast('Could not save the document', true)
      return
    }
    setShowModal(false)
    showToast(editing ? 'Document updated' : 'Document added')
    load()
  }

  const setActive = async (doc: JobDocument) => {
    const updates = docs.filter((d) => d.doc_type === doc.doc_type)
    // Deactivate siblings of the same type, then activate this one.
    const deactivateIds = updates.filter((d) => d.is_active && d.id !== doc.id).map((d) => d.id)
    if (deactivateIds.length) {
      await supabase.from('documents').update({ is_active: false }).in('id', deactivateIds)
    }
    const { error } = await supabase.from('documents').update({ is_active: true }).eq('id', doc.id)
    if (error) {
      showToast('Could not set the active document', true)
      return
    }
    showToast(`${doc.title} is now your active ${DOC_LABELS[doc.doc_type].toLowerCase()}`)
    load()
  }

  const handleDelete = async (doc: JobDocument) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return
    const { error } = await supabase.from('documents').delete().eq('id', doc.id)
    if (error) {
      showToast('Could not delete the document', true)
      return
    }
    showToast('Document deleted')
    load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      {toastNode}
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-sub">{cvCount} CV{cvCount === 1 ? '' : 's'} · {letterCount} cover letter{letterCount === 1 ? '' : 's'}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add document
          </button>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText size={24} />}
            title="No documents yet"
            subtitle="Add your master CV and a cover letter template — mark one of each as active."
            action={
              <button className="btn btn-primary" onClick={openAdd}>
                <Plus size={16} /> Add your first document
              </button>
            }
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {docs.map((doc) => (
            <div className="card job-card" key={doc.id}>
              <div className="job-card-main">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="job-title-link" style={{ cursor: 'default' }}>{doc.title}</span>
                  <span className="badge badge-info">{DOC_LABELS[doc.doc_type]}</span>
                  {doc.is_active && (
                    <span className="badge badge-success"><CheckCircle2 size={12} /> Active</span>
                  )}
                  <span className="badge badge-neutral">v{doc.version}</span>
                </div>
                <div className="job-company" style={{ marginTop: 6 }}>
                  Updated {formatDate(doc.updated_at)}
                  {doc.content ? ` · ${(doc.content.length / 1000).toFixed(1)}k characters` : ' · empty'}
                </div>
              </div>
              <div className="job-actions">
                <div className="table-actions">
                  <button className="icon-btn" onClick={() => setViewing(doc)} title="Preview">
                    <Eye size={16} />
                  </button>
                  <button className="icon-btn" onClick={() => openEdit(doc)} title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(doc)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
                {!doc.is_active && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setActive(doc)}>
                    Set active
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit document' : 'Add document'} onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="field">
                <label htmlFor="dType">Type</label>
                <select
                  id="dType"
                  value={form.doc_type}
                  onChange={(e) => setForm({ ...form, doc_type: e.target.value as DocumentType })}
                >
                  <option value="cv">CV / Resume</option>
                  <option value="cover_letter">Cover letter</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="dTitle">Title *</label>
                <input
                  id="dTitle"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={form.doc_type === 'cv' ? 'Master CV 2026' : 'Cover letter — tech roles'}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="dContent">Content</label>
              <textarea
                id="dContent"
                rows={12}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Paste your CV or cover letter text here."
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Saving…' : editing ? 'Save new version' : 'Add document'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.title} onClose={() => setViewing(null)} wide>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {viewing.content || 'This document is empty.'}
          </div>
        </Modal>
      )}
    </div>
  )
}
