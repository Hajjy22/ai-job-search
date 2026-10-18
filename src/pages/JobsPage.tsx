import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Briefcase, Trash as Trash2, Pencil } from 'lucide-react'
import {
  supabase, formatSalary,
  FREE_JOB_LIMIT,
  type JobPosting, type JobStatus, type WorkMode,
} from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FitScoreRing, StatusBadge, WorkModeBadge, Modal, EmptyState, Spinner } from '../components/ui'
import { useToast } from '../lib/useToast'

const emptyForm = {
  title: '',
  company: '',
  location: '',
  work_mode: 'remote' as WorkMode,
  url: '',
  description: '',
  salary_min: '',
  salary_max: '',
  source: '',
  status: 'new' as JobStatus,
}

export default function JobsPage() {
  const { profile } = useAuth()
  const { showToast, toastNode } = useToast()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<JobPosting | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all')
  const [sortBy, setSortBy] = useState<'fit' | 'recent' | 'company'>('fit')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('job_postings')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) showToast('Could not load jobs', true)
    setJobs((data as JobPosting[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    let list = jobs
    if (statusFilter !== 'all') list = list.filter((j) => j.status === statusFilter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          (j.location || '').toLowerCase().includes(q),
      )
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'fit') return (b.fit_score ?? -1) - (a.fit_score ?? -1)
      if (sortBy === 'company') return a.company.localeCompare(b.company)
      return a.created_at < b.created_at ? 1 : -1
    })
  }, [jobs, query, statusFilter, sortBy])

  const isPro = profile?.plan === 'pro'
  const atLimit = !isPro && jobs.filter((j) => j.status !== 'archived').length >= FREE_JOB_LIMIT

  const openAdd = () => {
    if (atLimit) {
      showToast(`Free plan tracks ${FREE_JOB_LIMIT} jobs. Upgrade to Pro for unlimited.`, true)
      return
    }
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (job: JobPosting) => {
    setEditing(job)
    setForm({
      title: job.title,
      company: job.company,
      location: job.location || '',
      work_mode: job.work_mode,
      url: job.url || '',
      description: job.description || '',
      salary_min: job.salary_min?.toString() || '',
      salary_max: job.salary_max?.toString() || '',
      source: job.source || '',
      status: job.status,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim() || null,
      work_mode: form.work_mode,
      url: form.url.trim() || null,
      description: form.description.trim() || null,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
      source: form.source.trim() || null,
      status: form.status,
    }
    const { error } = editing
      ? await supabase.from('job_postings').update(payload).eq('id', editing.id)
      : await supabase.from('job_postings').insert(payload)
    setBusy(false)
    if (error) {
      showToast('Could not save the job', true)
      return
    }
    setShowModal(false)
    showToast(editing ? 'Job updated' : 'Job added')
    load()
  }

  const handleDelete = async (job: JobPosting) => {
    if (!window.confirm(`Delete "${job.title}" at ${job.company}? This cannot be undone.`)) return
    const { error } = await supabase.from('job_postings').delete().eq('id', job.id)
    if (error) {
      showToast('Could not delete the job', true)
      return
    }
    showToast('Job deleted')
    load()
  }

  return (
    <div>
      {toastNode}
      <div className="page-header">
        <div>
          <h1 className="page-title">Job Board</h1>
          <p className="page-sub">
            {jobs.length} job{jobs.length === 1 ? '' : 's'} collected
            {!isPro && ` · ${FREE_JOB_LIMIT} on free plan`}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add job
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="search-grow"
          placeholder="Search title, company, or location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="saved">Saved</option>
          <option value="applied">Applied</option>
          <option value="archived">Archived</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
          <option value="fit">Sort: fit score</option>
          <option value="recent">Sort: newest</option>
          <option value="company">Sort: company</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Briefcase size={24} />}
            title={query || statusFilter !== 'all' ? 'No jobs match your filters' : 'Your job board is empty'}
            subtitle={
              query || statusFilter !== 'all'
                ? 'Try a different search or clear the filters.'
                : 'Add the first posting — paste the details and let Bragit score the fit.'
            }
            action={
              !query && statusFilter === 'all' ? (
                <button className="btn btn-primary" onClick={openAdd}>
                  <Plus size={16} /> Add your first job
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((job) => (
            <div className="card job-card" key={job.id}>
              <FitScoreRing score={job.fit_score} />
              <div className="job-card-main">
                <Link to={`/jobs/${job.id}`} className="job-title-link">{job.title}</Link>
                <div className="job-company">{job.company}{job.location ? ` · ${job.location}` : ''}</div>
                <div className="job-meta">
                  <StatusBadge status={job.status} />
                  <WorkModeBadge mode={job.work_mode} />
                  {formatSalary(job) && <span className="job-salary">{formatSalary(job)}</span>}
                  {job.source && <span className="badge badge-neutral">{job.source}</span>}
                </div>
              </div>
              <div className="job-actions">
                <div className="table-actions">
                  <button className="icon-btn" onClick={() => openEdit(job)} title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(job)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
                <Link to={`/jobs/${job.id}`} className="btn btn-secondary btn-sm">View details</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit job' : 'Add a job'} onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="field">
                <label htmlFor="title">Job title *</label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Senior Frontend Engineer"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="company">Company *</label>
                <input
                  id="company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Acme Inc."
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Berlin, Germany"
                />
              </div>
              <div className="field">
                <label htmlFor="work_mode">Work mode</label>
                <select
                  id="work_mode"
                  value={form.work_mode}
                  onChange={(e) => setForm({ ...form, work_mode: e.target.value as WorkMode })}
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="salary_min">Salary min</label>
                <input
                  id="salary_min"
                  type="number"
                  min={0}
                  value={form.salary_min}
                  onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                  placeholder="80000"
                />
              </div>
              <div className="field">
                <label htmlFor="salary_max">Salary max</label>
                <input
                  id="salary_max"
                  type="number"
                  min={0}
                  value={form.salary_max}
                  onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                  placeholder="110000"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="url">Posting URL</label>
                <input
                  id="url"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://…"
                />
              </div>
              <div className="field">
                <label htmlFor="source">Source</label>
                <input
                  id="source"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="LinkedIn, referral…"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="description">Job description</label>
              <textarea
                id="description"
                rows={6}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Paste the full posting here — the fit scorer reads it against your profile."
              />
              <div className="hint">The more complete the description, the sharper your fit score.</div>
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}
              >
                <option value="new">New</option>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Add job'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
