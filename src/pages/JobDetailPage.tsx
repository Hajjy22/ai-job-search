import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ExternalLink, Sparkles, Send, Save, Archive,
  Check, AlertTriangle,
} from 'lucide-react'
import {
  supabase, formatSalary, formatDate, FREE_APPLICATION_LIMIT,
  type JobPosting, type Application, type ApplicationStage,
} from '../lib/supabase'
import { computeFit } from '../lib/fitEngine'
import { useAuth } from '../context/AuthContext'
import { FitScoreRing, StageBadge, StatusBadge, WorkModeBadge, Spinner } from '../components/ui'
import { useToast } from '../lib/useToast'

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { showToast, toastNode } = useToast()
  const [job, setJob] = useState<JobPosting | null>(null)
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('job_postings')
      .select('*, applications(*)')
      .eq('id', id)
      .maybeSingle()
    setLoading(false)
    if (error || !data) {
      showToast('Job not found', true)
      navigate('/jobs')
      return
    }
    const jobRow = data as JobPosting & { applications: Application[] }
    setJob(jobRow)
    setApplication(jobRow.applications?.[0] || null)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const reasons = useMemo(() => {
    if (!job?.fit_reasons?.length) return []
    return job.fit_reasons
  }, [job])

  const gaps = useMemo(() => {
    if (!job?.fit_gaps?.length) return []
    return job.fit_gaps
  }, [job])

  const scoreJob = async () => {
    if (!job) return
    setScoring(true)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('skills, target_roles, work_mode, years_experience, bio')
      .maybeSingle()
    if (profileError || !profileData) {
      setScoring(false)
      showToast('Could not load your profile for scoring', true)
      return
    }
    const result = computeFit(
      { title: job.title, description: job.description, work_mode: job.work_mode },
      {
        skills: (profileData.skills as string[]) || [],
        target_roles: (profileData.target_roles as string[]) || [],
        work_mode: (profileData.work_mode as string) || null,
        years_experience: (profileData.years_experience as number | null) ?? null,
        bio: (profileData.bio as string | null) ?? null,
      },
    )
    const { error } = await supabase
      .from('job_postings')
      .update({ fit_score: result.score, fit_reasons: result.reasons, fit_gaps: result.gaps })
      .eq('id', job.id)
    setScoring(false)
    if (error) {
      showToast('Scoring failed', true)
      return
    }
    showToast('Fit score updated')
    load()
  }

  const apply = async () => {
    if (!job || application) return
    if (profile?.plan !== 'pro') {
      const { count, error: countError } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .not('stage', 'in', '(rejected,withdrawn,hired)')
      if (!countError && (count || 0) >= FREE_APPLICATION_LIMIT) {
        showToast(`Free plan allows ${FREE_APPLICATION_LIMIT} active applications. Upgrade to Pro for unlimited.`, true)
        return
      }
    }
    const { data, error } = await supabase
      .from('applications')
      .insert({
        job_posting_id: job.id,
        stage: 'applied' as ApplicationStage,
        fit_score: job.fit_score,
        applied_date: new Date().toISOString().slice(0, 10),
      })
      .select()
      .maybeSingle()
    if (error || !data) {
      showToast('Could not create the application', true)
      return
    }
    await supabase.from('job_postings').update({ status: 'applied' }).eq('id', job.id)
    showToast('Application started')
    load()
  }

  const setStatus = async (status: JobPosting['status']) => {
    if (!job) return
    const { error } = await supabase.from('job_postings').update({ status }).eq('id', job.id)
    if (error) {
      showToast('Could not update the job', true)
      return
    }
    showToast(status === 'archived' ? 'Job archived' : 'Job saved')
    load()
  }

  if (loading || !job) return <Spinner />

  return (
    <div>
      {toastNode}
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/jobs')} style={{ marginBottom: 10 }}>
            <ArrowLeft size={14} /> Back to job board
          </button>
          <h1 className="page-title">{job.title}</h1>
          <p className="page-sub">
            {job.company}{job.location ? ` · ${job.location}` : ''} · Added {formatDate(job.created_at)}
          </p>
        </div>
        <div className="page-actions">
          {job.url && (
            <a className="btn btn-secondary" href={job.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={15} /> Original posting
            </a>
          )}
          {!application && job.status !== 'archived' && (
            <button className="btn btn-primary" onClick={apply}>
              <Send size={15} /> Start application
            </button>
          )}
          {application && (
            <StageBadge stage={application.stage} />
          )}
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col">
          <div className="card card-pad">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              <StatusBadge status={job.status} />
              <WorkModeBadge mode={job.work_mode} />
              {formatSalary(job) && <span className="job-salary" style={{ fontSize: '0.9375rem' }}>{formatSalary(job)}</span>}
              {job.source && <span className="badge badge-neutral">via {job.source}</span>}
            </div>
            <h3 className="card-title">Job description</h3>
            {job.description ? (
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {job.description}
              </div>
            ) : (
              <p className="card-sub" style={{ marginBottom: 0 }}>
                No description saved. Edit the job on the board to paste one — it powers your fit score.
              </p>
            )}
          </div>
        </div>

        <div className="dash-col">
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <h3 className="card-title">AI fit score</h3>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 16px' }}>
              <FitScoreRing score={job.fit_score} size={96} />
            </div>
            {reasons.length > 0 && (
              <div style={{ textAlign: 'left', marginBottom: 16 }}>
                {reasons.map((r) => (
                  <div key={r} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '4px 0' }}>
                    <Check size={14} color="var(--success)" /> {r}
                  </div>
                ))}
              </div>
            )}
            {gaps.length > 0 && (
              <div style={{ textAlign: 'left', marginBottom: 16, background: 'var(--warning-soft, #fef6e7)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#92610a', marginBottom: 6 }}>
                  Gaps to consider
                </div>
                {gaps.map((g) => (
                  <div key={g} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '3px 0' }}>
                    <AlertTriangle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} /> {g}
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-primary btn-block" onClick={scoreJob} disabled={scoring}>
              <Sparkles size={15} /> {job.fit_score === null ? 'Score this job' : 'Re-score'}
            </button>
          </div>

          <div className="card card-pad">
            <h3 className="card-title">Quick actions</h3>
            <p className="card-sub">Keep your board tidy.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {job.status !== 'saved' && job.status !== 'archived' && (
                <button className="btn btn-secondary btn-block" onClick={() => setStatus('saved')}>
                  <Save size={15} /> Mark as saved
                </button>
              )}
              {job.status !== 'archived' && (
                <button className="btn btn-secondary btn-block" onClick={() => setStatus('archived')}>
                  <Archive size={15} /> Archive
                </button>
              )}
              <Link to="/applications" className="btn btn-secondary btn-block">
                Open pipeline
              </Link>
            </div>
          </div>

          {application && (
            <div className="card card-pad">
              <h3 className="card-title">Application</h3>
              <p className="card-sub">Applied {formatDate(application.applied_date)}</p>
              {application.next_action && (
                <div style={{ fontSize: '0.875rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                  Next: {application.next_action}
                  {application.next_action_date && ` · due ${formatDate(application.next_action_date)}`}
                </div>
              )}
              <Link to="/applications" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>
                Manage in pipeline
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
