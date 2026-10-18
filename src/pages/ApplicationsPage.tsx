import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SquareKanban as KanbanSquare, Send } from 'lucide-react'
import {
  supabase, STAGE_LABELS, formatDate,
  FREE_APPLICATION_LIMIT,
  type Application, type ApplicationStage,
} from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FitScoreRing, Modal, EmptyState, Spinner } from '../components/ui'
import { useToast } from '../lib/useToast'

const TRACKED_STAGES: ApplicationStage[] = ['saved', 'applied', 'screening', 'interview', 'final', 'offer', 'hired']
const CLOSED_STAGES: ApplicationStage[] = ['rejected', 'withdrawn']

export default function ApplicationsPage() {
  const { profile } = useAuth()
  const { showToast, toastNode } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [detail, setDetail] = useState<Application | null>(null)
  const [notes, setNotes] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('applications')
      .select('*, job_postings(id, title, company, work_mode, fit_score)')
      .order('updated_at', { ascending: false })
    if (error) showToast('Could not load your pipeline', true)
    setApplications((data as Application[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const byStage = useMemo(() => {
    const map = new Map<ApplicationStage, Application[]>()
    for (const stage of [...TRACKED_STAGES, ...CLOSED_STAGES]) map.set(stage, [])
    for (const app of applications) {
      map.get(app.stage)?.push(app)
    }
    return map
  }, [applications])

  const isPro = profile?.plan === 'pro'
  const activeCount = applications.filter((a) => !CLOSED_STAGES.includes(a.stage)).length

  const moveStage = async (appId: string, stage: ApplicationStage) => {
    const app = applications.find((a) => a.id === appId)
    if (!app || app.stage === stage) return
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, stage } : a)))
    const updates: Partial<Application> = { stage, updated_at: new Date().toISOString() }
    if (stage === 'applied' && !app.applied_date) updates.applied_date = new Date().toISOString().slice(0, 10)
    const { error } = await supabase.from('applications').update(updates).eq('id', appId)
    if (error) {
      showToast('Could not move the application', true)
      load()
      return
    }
    if (app.job_posting_id) {
      await supabase
        .from('job_postings')
        .update({ status: CLOSED_STAGES.includes(stage) ? 'archived' : 'applied' })
        .eq('id', app.job_posting_id)
    }
    showToast(`Moved to ${STAGE_LABELS[stage]}`)
  }

  const openDetail = (app: Application) => {
    setDetail(app)
    setNotes(app.notes || '')
    setNextAction(app.next_action || '')
    setNextActionDate(app.next_action_date || '')
  }

  const saveDetail = async () => {
    if (!detail) return
    const { error } = await supabase
      .from('applications')
      .update({
        notes: notes.trim() || null,
        next_action: nextAction.trim() || null,
        next_action_date: nextActionDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', detail.id)
    if (error) {
      showToast('Could not save', true)
      return
    }
    setDetail(null)
    showToast('Application updated')
    load()
  }

  if (loading) return <Spinner />

  return (
    <div>
      {toastNode}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pipeline</h1>
          <p className="page-sub">
            {activeCount} active application{activeCount === 1 ? '' : 's'}
            {!isPro && ` · ${FREE_APPLICATION_LIMIT} on free plan`} · drag cards between stages
          </p>
        </div>
        <div className="page-actions">
          <Link to="/jobs" className="btn btn-primary">
            <Send size={15} /> Apply from job board
          </Link>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<KanbanSquare size={24} />}
            title="No applications yet"
            subtitle="Start an application from any job on your board and it will appear here."
            action={<Link to="/jobs" className="btn btn-primary">Go to job board</Link>}
          />
        </div>
      ) : (
        <div className="board">
          {TRACKED_STAGES.map((stage) => {
            const cards = byStage.get(stage) || []
            return (
              <div
                className={`board-col${dragOverStage === stage ? ' drag-over' : ''}`}
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverStage(stage)
                }}
                onDragLeave={() => setDragOverStage((cur) => (cur === stage ? null : cur))}
                onDrop={() => {
                  if (dragging) moveStage(dragging, stage)
                  setDragging(null)
                  setDragOverStage(null)
                }}
              >
                <div className="board-col-header">
                  <span className="board-col-title">{STAGE_LABELS[stage]}</span>
                  <span className="board-count">{cards.length}</span>
                </div>
                {cards.map((app) => {
                  const job = app.job_postings
                  return (
                    <div
                      key={app.id}
                      className={`board-card${dragging === app.id ? ' dragging' : ''}`}
                      draggable
                      onDragStart={() => setDragging(app.id)}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => openDetail(app)}
                    >
                      <div className="board-card-title">{job?.title || 'Untitled job'}</div>
                      <div className="board-card-company">{job?.company}</div>
                      <div className="board-card-footer">
                        {app.next_action_date ? (
                          <span>Due {formatDate(app.next_action_date)}</span>
                        ) : (
                          <span>No follow-up</span>
                        )}
                        <FitScoreRing score={app.fit_score ?? job?.fit_score ?? null} size={28} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {(byStage.get('rejected') || []).length + (byStage.get('withdrawn') || []).length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-pad" style={{ paddingBottom: 4 }}>
            <h3 className="card-title">Closed</h3>
            <p className="card-sub">Rejected or withdrawn — kept for your records.</p>
            {[...CLOSED_STAGES].flatMap((stage) =>
              (byStage.get(stage) || []).map((app) => (
                <div
                  key={app.id}
                  className="activity-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => openDetail(app)}
                >
                  <div className="activity-dot" style={{ background: 'var(--danger)' }} />
                  <div>
                    <div className="activity-title">
                      {app.job_postings?.title || 'Untitled job'} · {app.job_postings?.company}
                    </div>
                    <div className="activity-meta">{STAGE_LABELS[app.stage]}</div>
                  </div>
                </div>
              )),
            )}
          </div>
        </div>
      )}

      {detail && (
        <Modal title={detail.job_postings?.title || 'Application'} onClose={() => setDetail(null)} wide>
          <div className="form-row" style={{ marginBottom: 8 }}>
            <div className="field">
              <label>Stage</label>
              <select
                value={detail.stage}
                onChange={(e) => {
                  const stage = e.target.value as ApplicationStage
                  setDetail({ ...detail, stage })
                  moveStage(detail.id, stage)
                }}
              >
                {[...TRACKED_STAGES, ...CLOSED_STAGES].map((s) => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Next action date</label>
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Next action</label>
            <input
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="Follow up with recruiter"
            />
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interviewer names, feedback, salary discussed…"
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setDetail(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveDetail}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
