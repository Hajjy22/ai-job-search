export interface FitProfileInput {
  skills: string[]
  target_roles: string[]
  work_mode: string | null
  years_experience: number | null
  bio: string | null
}

export interface FitResult {
  score: number
  reasons: string[]
  gaps: string[]
}

// Common skill synonyms so "Postgres" matches "PostgreSQL", "JS" matches "JavaScript", etc.
const SKILL_ALIASES: Record<string, string[]> = {
  js: ['javascript', 'node', 'nodejs', 'es6'],
  javascript: ['js', 'typescript', 'node'],
  ts: ['typescript'],
  typescript: ['ts', 'javascript'],
  react: ['reactjs', 'react.js', 'frontend'],
  postgres: ['postgresql', 'sql', 'postgres'],
  postgresql: ['postgres', 'sql'],
  python: ['django', 'flask', 'fastapi'],
  aws: ['amazon web services', 'cloud', 'lambda', 's3'],
  gcp: ['google cloud'],
  k8s: ['kubernetes'],
  kubernetes: ['k8s', 'docker', 'containers'],
  docker: ['containers', 'kubernetes'],
  seo: ['search engine optimization'],
  ui: ['ux', 'design', 'figma'],
  ux: ['ui', 'design', 'figma'],
  ml: ['machine learning', 'ai'],
  'machine learning': ['ml', 'ai', 'python'],
  excel: ['spreadsheets', 'google sheets'],
  figma: ['ui', 'ux', 'design'],
}

// Skills so generic they should not count toward the score on their own.
const GENERIC_SKILLS = new Set([
  'communication', 'teamwork', 'leadership', 'problem solving', 'hard working',
  'motivated', 'passionate', 'fast learner', 'team player', 'english',
  'microsoft office', 'word', 'outlook', 'time management', 'creativity',
])

function occurrences(haystack: string, needle: string): number {
  let count = 0
  let idx = haystack.indexOf(needle)
  while (idx !== -1) {
    count += 1
    idx = haystack.indexOf(needle, idx + needle.length)
  }
  return count
}

function skillTextVariants(skill: string): string[] {
  const s = skill.toLowerCase().trim()
  const variants = new Set<string>([s])
  for (const alias of SKILL_ALIASES[s] || []) variants.add(alias)
  // Also match aliases pointing back at this skill
  for (const [key, aliases] of Object.entries(SKILL_ALIASES)) {
    if (aliases.includes(s)) variants.add(key)
  }
  return [...variants]
}

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function computeFit(job: {
  title: string
  description: string | null
  work_mode: string
}, profile: FitProfileInput): FitResult {
  const text = `${job.title} ${job.description || ''}`.toLowerCase()
  const reasons: string[] = []
  const gaps: string[] = []

  // --- Skills (0–45) ---
  const matchedSkills: string[] = []
  const missingSkills: string[] = []
  let skillHits = 0
  for (const skill of profile.skills || []) {
    const clean = skill.toLowerCase().trim()
    if (!clean || GENERIC_SKILLS.has(clean)) continue
    const variants = skillTextVariants(clean)
    const count = variants.reduce((max, v) => Math.max(max, occurrences(text, v)), 0)
    if (count > 0) {
      skillHits += Math.min(3, count)
      matchedSkills.push(clean)
    } else {
      missingSkills.push(clean)
    }
  }
  const skillScore = Math.min(45, skillHits * 6)

  // --- Target role match (0–20) ---
  let roleScore = 0
  const titleLower = job.title.toLowerCase()
  for (const role of profile.target_roles || []) {
    const words = role.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
    const hits = words.filter((w) => titleLower.includes(w)).length
    if (words.length > 0 && hits / words.length >= 0.5) {
      roleScore = 20
      reasons.push(`"${job.title}" closely matches your target role "${role}"`)
      break
    }
    if (hits > 0) roleScore = Math.max(roleScore, 10)
  }
  if (roleScore === 20) {
    // already reported
  } else if (roleScore === 10) {
    reasons.push('Title partially overlaps your target roles')
  }

  // --- Work mode (0–10) ---
  let modeScore = 0
  const preferred = (profile.work_mode || 'remote').toLowerCase()
  if (job.work_mode === preferred) {
    modeScore = 10
    reasons.push(`${titleCase(job.work_mode)} matches your work-mode preference`)
  } else if (preferred === 'remote' && job.work_mode === 'hybrid') {
    modeScore = 5
  }

  // --- Seniority vs. your experience (0–15) ---
  let seniorityScore = 8 // neutral default
  const senior = /senior|sr\.?|staff|principal|lead|head of|director|manager|iv|v\b/.test(titleLower)
  const junior = /junior|jr\.?|entry|graduate|intern|trainee|assistant|associate\b/.test(titleLower)
  const years = profile.years_experience ?? null
  if (junior) {
    if (years !== null && years <= 3) {
      seniorityScore = 15
      reasons.push('Entry-level role fits your experience')
    } else {
      seniorityScore = 4
    }
  } else if (senior) {
    if (years === null) {
      seniorityScore = 8
    } else if (years >= 5) {
      seniorityScore = 15
      reasons.push(`Seniority level fits your ${years} years of experience`)
    } else if (years >= 3) {
      seniorityScore = 9
      gaps.push('Role is senior-level; your stated experience is below the usual bar')
    } else {
      seniorityScore = 3
      gaps.push('Senior role — this is likely a stretch for your experience today')
    }
  }

  // --- Description depth / bio overlap (0–10) ---
  let depthScore = 4
  if (profile.bio) {
    const bioWords = profile.bio.toLowerCase().split(/\W+/).filter((w) => w.length > 4)
    const unique = [...new Set(bioWords)]
    const bioHits = unique.filter((w) => text.includes(w)).length
    if (unique.length > 0 && bioHits / unique.length >= 0.3) {
      depthScore = 10
      reasons.push('Description echoes themes from your background')
    } else if (bioHits > 3) {
      depthScore = 7
    }
  }

  const raw = skillScore + roleScore + modeScore + seniorityScore + depthScore

  // Highlight up to 2 matched skills explicitly
  for (const m of matchedSkills.slice(0, 2)) {
    reasons.push(`Your ${m} experience is relevant here`)
  }

  // Gaps: missing profile skills that the posting demands most
  const demandGaps = missingSkills.slice(0, 2).map((s) => `Posting likely wants ${s} — not in your profile`)
  gaps.push(...demandGaps)

  // If the posting itself lists must-have tech the profile lacks, surface the strongest ones
  if (gaps.length === 0 && matchedSkills.length === 0) {
    gaps.push('Little overlap found — check that your profile skills are up to date')
  }

  const score = Math.max(5, Math.min(98, Math.round(raw)))
  return {
    score,
    reasons: reasons.slice(0, 4),
    gaps: gaps.slice(0, 4),
  }
}
