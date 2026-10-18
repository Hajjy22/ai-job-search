import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Save, Sparkles, LogOut, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const WORK_MODES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [headline, setHeadline] = useState(profile?.headline ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [workMode, setWorkMode] = useState(profile?.work_mode ?? 'remote')
  const [years, setYears] = useState(profile?.years_experience?.toString() ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? [])
  const [skillInput, setSkillInput] = useState('')
  const [roles, setRoles] = useState<string[]>(profile?.target_roles ?? [])
  const [roleInput, setRoleInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  if (!profile) return null

  const addChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    const v = value.trim()
    if (v && !list.some((item) => item.toLowerCase() === v.toLowerCase())) {
      setter([...list, v])
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('saving')
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        headline: headline.trim() || null,
        location: location.trim() || null,
        work_mode: workMode,
        years_experience: years ? Number(years) : null,
        bio: bio.trim() || null,
        skills,
        target_roles: roles,
      })
      .eq('id', profile.id)
    if (error) {
      setStatus('error')
      return
    }
    await refreshProfile()
    setStatus('saved')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Your profile powers the AI fit scores — the richer it is, the sharper they get.</p>
        </div>
      </div>

      <div className="settings-grid" style={{ maxWidth: 960 }}>
        <div className="settings-col">
          <div className="card card-pad">
            <h3 className="card-title">Profile</h3>
            <p className="card-sub">Who you are and where you want to work.</p>
            <form onSubmit={handleSave}>
              <div className="field">
                <label htmlFor="pEmail">Email</label>
                <input id="pEmail" value={profile.email} disabled />
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="pName">Full name</label>
                  <input
                    id="pName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                  />
                </div>
                <div className="field">
                  <label htmlFor="pHeadline">Headline</label>
                  <input
                    id="pHeadline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Full-stack engineer · React & Python"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="pLocation">Location</label>
                  <input
                    id="pLocation"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Berlin, Germany"
                  />
                </div>
                <div className="field">
                  <label htmlFor="pWorkMode">Preferred work mode</label>
                  <select id="pWorkMode" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                    {WORK_MODES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="pYears">Years of experience</label>
                <input
                  id="pYears"
                  type="number"
                  min={0}
                  max={60}
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  placeholder="6"
                />
              </div>
              <div className="field">
                <label htmlFor="pBio">About you</label>
                <textarea
                  id="pBio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short summary of your background and what you are looking for."
                />
              </div>

              {status === 'saved' && <div className="form-success">Profile saved.</div>}
              {status === 'error' && <div className="form-error">Could not save. Please try again.</div>}

              <button type="submit" className="btn btn-primary" disabled={status === 'saving'}>
                <Save size={16} /> {status === 'saving' ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          </div>
        </div>

        <div className="settings-col">
          <div className="card card-pad">
            <h3 className="card-title">Skills</h3>
            <p className="card-sub">The fit scorer matches these against job descriptions.</p>
            <div className="chips-input">
              {skills.map((skill) => (
                <span className="chip" key={skill}>
                  {skill}
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((s) => s !== skill))}
                    aria-label={`Remove ${skill}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addChip(skillInput, skills, setSkills)
                    setSkillInput('')
                  }
                }}
                placeholder="Type a skill and press Enter"
              />
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="card-title">Target roles</h3>
            <p className="card-sub">Job titles you want the scorer to prioritize.</p>
            <div className="chips-input">
              {roles.map((role) => (
                <span className="chip" key={role}>
                  {role}
                  <button
                    type="button"
                    onClick={() => setRoles(roles.filter((r) => r !== role))}
                    aria-label={`Remove ${role}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addChip(roleInput, roles, setRoles)
                    setRoleInput('')
                  }
                }}
                placeholder="Type a role and press Enter"
              />
            </div>
          </div>

          <div className="card card-pad">
            <h3 style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} /> Subscription
            </h3>
            <p className="page-sub" style={{ marginBottom: 16 }}>
              You are on the <strong>{profile.plan === 'pro' ? 'Pro' : 'Free'}</strong> plan.
              {profile.plan !== 'pro' && ' Upgrade for unlimited jobs, applications, and documents.'}
            </p>
            {profile.plan !== 'pro' && (
              <Link to="/pricing" className="btn btn-primary">
                <Sparkles size={16} /> See Pro plan
              </Link>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                await supabase.auth.signOut()
              }}
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
