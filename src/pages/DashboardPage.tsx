import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, Send, TrendingUp, Crown, Sparkles,
  ArrowRight, Plus, Check,
} from 'lucide-react'
import { supabase, STAGE_ORDER, STAGE_LABELS, type Application, type JobPosting } from '../lib/supabase'
import { computeFit, type FitProfileInput } from '../lib/fitEngine'
import { useAuth } from '../context/AuthContext'
import { FitScoreRing, StageBadge, Spinner, EmptyState } from '../components/ui'
import { formatDate, timeAgo } from '../lib/supabase'
import { useToast } from '../lib/useToast'

interface ActivityEntry {
  id: string
  kind: 'job' | 'application' | 'stage'
  title: string
  detail: string
  date: string
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { showToast, toastNode } = useToast()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)

  const load = async () => {
    setLoading(true)
    const [jobsRes, appsRes] = await Promise.all([
      supabase.from('job_postings').select('*').order('created_at', { ascending: false }),
      supabase
        .from('applications')
        .select('*, job_postings(id, title, company, fit_score)')
        .order('updated_at', { ascending: false }),
    ])
    if (jobsRes.error) showToast('Could not load your jobs', true)
    if (appsRes.error) showToast('Could not load your applications', true)
    setJobs((jobsRes.data as JobPosting[]) || [])
    setApplications((appsRes.data as Application[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    const active = applications.filter((a) => !['hired', 'rejected', 'withdrawn'].includes(a.stage))
    const interviews = applications.filter((a) =>
      ['interview', 'final', 'offer', 'hired'].includes(a.stage),
    )
    const followed = applications.filter((a) => a.next_action_date)
    const upcoming = followed
      .filter((a) => a.next_action_date && new Date(a.next_action_date) <= new Date(Date.now() + 7 * 86400000))
      .sort((a, b) => (a.next_action_date! < b.next_action_date! ? -1 : 1))
    const scored = jobs.filter((j) => j.fit_score !== null)
    const avgFit = scored.length
      ? Math.round(scored.reduce((sum, j) => sum + (j.fit_score || 0), 0) / scored.length)
      : null
    return {
      trackedJobs: jobs.filter((j) => j.status !== 'archived').length,
      activeApplications: active.length,
      interviewCount: interviews.length,
      upcoming,
      avgFit,
    }
  }, [jobs, applications])

  const funnel = useMemo(() => {
    const byStage = new Map<string, number>()
    for (const stage of STAGE_ORDER) byStage.set(stage, 0)
    for (const a of applications) {
      byStage.set(a.stage, (byStage.get(a.stage) || 0) + 1)
    }
    const active = STAGE_ORDER.map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      count: byStage.get(stage) || 0,
    }))
    const max = Math.max(1, ...active.map((s) => s.count))
    return { rows: active, max }
  }, [applications])

  const activity = useMemo<ActivityEntry[]>(() => {
    const entries: ActivityEntry[] = []
    for (const j of jobs.slice(0, 10)) {
      entries.push({
        id: `job-${j.id}`,
        kind: 'job',
        title: j.title,
        detail: `Added ${j.company} to your job board`,
        date: j.created_at,
      })
    }
    for (const a of applications) {
      const jobTitle = a.job_postings?.title || 'a job'
      const company = a.job_postings?.company || ''
      entries.push({
        id: `app-${a.id}`,
        kind: 'stage',
        title: `${jobTitle}${company ? ` · ${company}` : ''}`,
        detail: `Moved to ${STAGE_LABELS[a.stage]}`,
        date: a.updated_at,
      })
    }
    return entries.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8)
  }, [jobs, applications])

  const unscored = useMemo(() => jobs.filter((j) => j.fit_score === null && j.status !== 'archived'), [jobs])

  const checklist = useMemo(() => {
    const hasProfile = (profile?.skills?.length || 0) > 0 || !!profile?.headline
    const hasJobs = jobs.length > 0
    const hasScored = jobs.some((j) => j.fit_score !== null)
    const hasApplied = applications.length > 0
    const items = [
      { key: 'profile', label: 'Fill in your profile', href: '/settings', done: hasProfile },
      { key: 'job', label: 'Add your first job', href: '/jobs', done: hasJobs },
      { key: 'score', label: 'Get your first fit score', href: '/jobs', done: hasScored },
      { key: 'apply', label: 'Start an application', href: '/jobs', done: hasApplied },
    ]
    return { items, doneCount: items.filter((i) => i.done).length }
  }, [profile, jobs, applications])

  const scoreAll = async () => {
    if (unscored.length === 0) return
    setScoring(true)
    const fitProfile: FitProfileInput = {
      skills: profile?.skills || [],
      target_roles: profile?.target_roles || [],
      work_mode: profile?.work_mode || null,
      years_experience: profile?.years_experience ?? null,
      bio: profile?.bio ?? null,
    }
    const updated = unscored.map((job) => {
      const result = computeFit(
        { title: job.title, description: job.description, work_mode: job.work_mode },
        fitProfile,
      )
      return { id: job.id, fit_score: result.score, fit_reasons: result.reasons, fit_gaps: result.gaps }
    })
    const { error } = await supabase.from('job_postings').upsert(updated)
    if (error) {
      showToast('Scoring failed — please try again', true)
    } else {
      showToast(`Scored ${updated.length} job${updated.length === 1 ? '' : 's'}`)
      await load()
    }
    setScoring(false)
  }

  if (loading) return <Spinner />

  const isPro = profile?.plan === 'pro'

  return (
    <div>
      {toastNode}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good luck hunting{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="page-sub">Here is where your search stands today.</p>
        </div>
        <div className="page-actions">
          <Link to="/jobs" className="btn btn-primary">
            <Plus size={16} /> Add a job
          </Link>
        </div>
      </div>

      {!isPro && (
        <div className="upgrade-banner">
          <div>
            <h3>You are on the Free plan</h3>
            <p>Free tracks up to 5 jobs. Go Pro for unlimited jobs, documents, and priority AI scoring.</p>
          </div>
          <Link to="/pricing" className="btn btn-sm">
            <Crown size={14} /> Upgrade to Pro
          </Link>
        </div>
      )}

      {checklist.doneCount < checklist.items.length && (
        <div className="card card-pad onboarding-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>Get started with Bragit</h3>
            <span className="badge badge-info">{checklist.doneCount}/{checklist.items.length} done</span>
          </div>
          <div className="onboarding-steps">
            {checklist.items.map((item) => (
              <Link
                key={item.key}
                to={item.done ? '#' : item.href}
                className={`onboarding-step${item.done ? ' done' : ''}`}
                onClick={(e) => { if (item.done) e.preventDefault() }}
              >
                <span className="onboarding-check">{item.done ? <Check size={13} /> : ''}</span>
                <span style={{ color: item.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: 'none' }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon green"><Briefcase size={20} /></div>
          <div>
            <div className="stat-label">Jobs tracked</div>
            <div className="stat-value">{stats.trackedJobs}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon blue"><Send size={20} /></div>
          <div>
            <div className="stat-label">Active applications</div>
            <div className="stat-value">{stats.activeApplications}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon amber"><TrendingUp size={20} /></div>
          <div>
            <div className="stat-label">Interview stage or beyond</div>
            <div className="stat-value">{stats.interviewCount}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon red"><Sparkles size={20} /></div>
          <div>
            <div className="stat-label">Average fit score</div>
            <div className="stat-value">{stats.avgFit !== null ? stats.avgFit : '—'}</div>
          </div>
        </div>
      </div>

      {unscored.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h3 className="card-title"><Sparkles size={16} style={{ verticalAlign: '-2px', color: 'var(--primary)' }} /> {unscored.length} job{unscored.length === 1 ? '' : 's'} waiting for a fit score</h3>
              <p className="card-sub">Score them against your profile to see which ones deserve your effort.</p>
            </div>
            <button className="btn btn-primary" onClick={scoreAll} disabled={scoring}>
              {scoring ? 'Scoring…' : 'Score them now'}
            </button>
          </div>
        </div>
      )}

      <div className="dash-grid">
        <div className="dash-col">
          <div className="card card-pad">
            <h3 className="card-title">Application funnel</h3>
            <p className="card-sub">Where everything currently sits.</p>
            {applications.length === 0 ? (
              <EmptyState
                icon={<Send size={24} />}
                title="No applications yet"
                subtitle="Save a job from your board and apply to start the funnel."
                action={<Link to="/jobs" className="btn btn-primary btn-sm">Browse job board</Link>}
              />
            ) : (
              funnel.rows.map(({ stage, label, count }) => (
                <div className="funnel-row" key={stage}>
                  <span className="funnel-label">{label}</span>
                  <div className="funnel-bar-track">
                    <div
                      className="funnel-bar"
                      style={{
                        width: `${(count / funnel.max) * 100}%`,
                        background:
                          stage === 'hired' || stage === 'offer'
                            ? 'var(--success)'
                            : stage === 'rejected' || stage === 'withdrawn'
                              ? 'var(--danger)'
                              : 'var(--primary)',
                      }}
                    />
                  </div>
                  <span className="funnel-count">{count}</span>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="card-pad" style={{ paddingBottom: 8 }}>
              <h3 className="card-title">Needs attention</h3>
              <p className="card-sub">Upcoming follow-ups in the next 7 days.</p>
            </div>
            {stats.upcoming.length === 0 ? (
              <div style={{ padding: '0 20px 20px' }}>
                <p className="card-sub" style={{ marginBottom: 0 }}>Nothing due — set next actions on your applications to stay on top of follow-ups.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Job</th>
                      <th>Next action</th>
                      <th>Due</th>
                      <th>Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.upcoming.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <Link to="/applications" className="job-title-link" style={{ fontSize: '0.875rem' }}>
                            {a.job_postings?.title || 'Untitled job'}
                          </Link>
                          <div className="job-company" style={{ marginBottom: 0 }}>{a.job_postings?.company}</div>
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>{a.next_action || 'Follow up'}</td>
                        <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{formatDate(a.next_action_date)}</td>
                        <td><StageBadge stage={a.stage} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="dash-col">
          <div className="card card-pad">
            <h3 className="card-title">Recent activity</h3>
            <p className="card-sub">Latest jobs and pipeline moves.</p>
            {activity.length === 0 ? (
              <p className="card-sub" style={{ marginBottom: 0 }}>
                Add your first job to get started.
              </p>
            ) : (
              activity.map((item) => (
                <div className="activity-item" key={item.id}>
                  <div className="activity-dot" />
                  <div>
                    <div className="activity-title">{item.title}</div>
                    <div className="activity-meta">{item.detail} · {timeAgo(item.date)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card card-pad">
            <h3 className="card-title">Top matches</h3>
            <p className="card-sub">Highest-scoring jobs on your board.</p>
            {jobs.filter((j) => j.fit_score !== null).length === 0 ? (
              <p className="card-sub" style={{ marginBottom: 0 }}>Score your jobs to see your best matches here.</p>
            ) : (
              [...jobs]
                .filter((j) => j.fit_score !== null)
                .sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0))
                .slice(0, 4)
                .map((job) => (
                  <div
                    key={job.id}
                    style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}
                  >
                    <FitScoreRing score={job.fit_score} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/jobs/${job.id}`} className="job-title-link" style={{ fontSize: '0.875rem' }}>
                        {job.title}
                      </Link>
                      <div className="job-company" style={{ marginBottom: 0 }}>{job.company}</div>
                    </div>
                    <ArrowRight size={16} color="var(--text-muted)" />
                  </div>
                ))
            )}
          </div>

          <div className="card card-pad">
            <h3 className="card-title">Tip of the day</h3>
            <p className="card-sub" style={{ marginBottom: 0 }}>
              Applications with a scheduled next action are far more likely to get a reply.
              Open your pipeline and give every active application a next step.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
