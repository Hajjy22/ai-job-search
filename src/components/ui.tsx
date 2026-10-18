import { X } from 'lucide-react'
import { STAGE_LABELS, type ApplicationStage, type JobStatus, type WorkMode } from '../lib/supabase'

export function FitScoreRing({ score, size = 44 }: { score: number | null; size?: number }) {
  if (score === null || score === undefined) {
    return (
      <div
        className="fit-ring fit-ring-none"
        style={{ width: size, height: size }}
        title="Not scored yet"
      >
        ?
      </div>
    )
  }
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div
      className="fit-ring"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${score * 3.6}deg, var(--border) 0deg)`,
      }}
      title={`Fit score: ${score}/100`}
    >
      <span style={{ color }}>{score}</span>
    </div>
  )
}

export function StageBadge({ stage }: { stage: ApplicationStage }) {
  const classes: Record<ApplicationStage, string> = {
    saved: 'badge-neutral',
    applied: 'badge-info',
    screening: 'badge-info',
    interview: 'badge-warning',
    final: 'badge-warning',
    offer: 'badge-success',
    hired: 'badge-success',
    rejected: 'badge-danger',
    withdrawn: 'badge-neutral',
  }
  return <span className={`badge ${classes[stage]}`}>{STAGE_LABELS[stage]}</span>
}

export function StatusBadge({ status }: { status: JobStatus }) {
  const labels: Record<JobStatus, string> = {
    new: 'New',
    saved: 'Saved',
    applied: 'Applied',
    archived: 'Archived',
  }
  const classes: Record<JobStatus, string> = {
    new: 'badge-info',
    saved: 'badge-warning',
    applied: 'badge-success',
    archived: 'badge-neutral',
  }
  return <span className={`badge ${classes[status]}`}>{labels[status]}</span>
}

export function WorkModeBadge({ mode }: { mode: WorkMode }) {
  const icon = mode === 'remote' ? '🌐' : mode === 'hybrid' ? '🏢' : '📍'
  return (
    <span className="badge badge-neutral work-mode-badge">
      {icon} {mode.charAt(0).toUpperCase() + mode.slice(1)}
    </span>
  )
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal card"
        style={wide ? { maxWidth: 720 } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Toast({ message, error }: { message: string; error?: boolean }) {
  return <div className={`toast${error ? ' error' : ''}`}>{message}</div>
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  action?: React.ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-sub">{subtitle}</div>
      {action}
    </div>
  )
}

export function Spinner() {
  return <div className="spinner" style={{ margin: '40px auto' }} />
}
