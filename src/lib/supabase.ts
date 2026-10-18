import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Profile {
  id: string
  email: string
  full_name: string | null
  headline: string | null
  location: string | null
  work_mode: string | null
  target_roles: string[] | null
  skills: string[] | null
  years_experience: number | null
  bio: string | null
  plan: 'free' | 'pro'
  created_at: string
  updated_at: string
}

export type JobStatus = 'new' | 'saved' | 'applied' | 'archived'
export type WorkMode = 'remote' | 'hybrid' | 'onsite'
export type ApplicationStage =
  | 'saved'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'final'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn'
export type DocumentType = 'cv' | 'cover_letter' | 'other'

export interface JobPosting {
  id: string
  user_id: string
  title: string
  company: string
  location: string | null
  work_mode: WorkMode
  url: string | null
  description: string | null
  fit_score: number | null
  fit_reasons: string[] | null
  fit_gaps?: string[] | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  source: string | null
  status: JobStatus
  posted_date: string | null
  created_at: string
  updated_at: string
  applications?: Application[]
}

export interface Application {
  id: string
  user_id: string
  job_posting_id: string
  stage: ApplicationStage
  fit_score: number | null
  applied_date: string | null
  next_action: string | null
  next_action_date: string | null
  last_contact_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  job_postings?: JobPosting | null
}

export interface JobDocument {
  id: string
  user_id: string
  doc_type: DocumentType
  title: string
  content: string | null
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export const FREE_JOB_LIMIT = 5
export const FREE_APPLICATION_LIMIT = 10

export const STAGE_ORDER: ApplicationStage[] = [
  'saved',
  'applied',
  'screening',
  'interview',
  'final',
  'offer',
  'hired',
]

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  saved: 'Shortlisted',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  final: 'Final round',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export function formatMoney(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatSalary(job: {
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
}) {
  if (job.salary_min && job.salary_max) {
    return `${formatMoney(job.salary_min, job.salary_currency)} – ${formatMoney(job.salary_max, job.salary_currency)}`
  }
  if (job.salary_min) return `${formatMoney(job.salary_min, job.salary_currency)}+`
  if (job.salary_max) return `Up to ${formatMoney(job.salary_max, job.salary_currency)}`
  return null
}

export function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(date)
}
