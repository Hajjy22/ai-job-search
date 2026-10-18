import { Link } from 'react-router-dom'
import {
  Target, KanbanSquare, FileText, Check, ArrowRight,
  Search, Gauge, Zap, Menu, X, Star,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const STYLE_PRESETS = [
  'Prism Pro', 'Paper II', 'Prime', 'Elevate', 'Impact II',
  'Sketch', 'Lens', 'Vista', 'Pop', 'Orbit', 'Y2K', 'Form',
]

const features = [
  {
    icon: <Gauge size={22} />,
    title: 'AI fit scoring',
    text: 'Paste a posting, get a 0–100 fit score with the reasons behind it. Stop guessing which roles deserve your energy.',
  },
  {
    icon: <KanbanSquare size={22} />,
    title: 'Pipeline that moves',
    text: 'A drag-and-drop board from shortlist to signed offer. Every card carries its score, next action, and due date.',
  },
  {
    icon: <Zap size={22} />,
    title: 'Follow-ups that land',
    text: 'Bragit surfaces what needs attention today — no more applications going quiet in a spreadsheet graveyard.',
  },
  {
    icon: <FileText size={22} />,
    title: 'Document arsenal',
    text: 'Every CV and cover letter version in one library. Mark the active one, tailor per role, never lose track.',
  },
  {
    icon: <Search size={22} />,
    title: 'One organized board',
    text: 'Salary, work mode, source, and status for every posting you collect — searchable and sortable in a click.',
  },
  {
    icon: <Target size={22} />,
    title: 'Learns your profile',
    text: 'Skills, target roles, and work preferences feed the scorer. The richer your profile, the sharper your matches.',
  },
]

const steps = [
  {
    label: 'Step 1',
    title: 'Build your profile',
    text: 'Drop in your skills, target titles, and work preferences once. This is the brain behind every score.',
  },
  {
    label: 'Step 2',
    title: 'Collect and score jobs',
    text: 'Paste any posting. Bragit scores it against your profile instantly and explains the number.',
  },
  {
    label: 'Step 3',
    title: 'Work the pipeline',
    text: 'Apply, drag cards stage to stage, and set next actions. Interviews and follow-ups stop slipping.',
  },
  {
    label: 'Step 4',
    title: 'Land the offer',
    text: 'Watch your funnel convert. When an offer lands, the whole journey is already documented.',
  },
]

const testimonials = [
  {
    name: 'Maya K.',
    role: 'Product Designer',
    quote: 'I stopped applying to everything and started applying to the right things. Three interviews in two weeks.',
    img: 'https://images.pexels.com/photos/33680700/pexels-photo-33680700.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    name: 'Daniel R.',
    role: 'Backend Engineer',
    quote: 'The fit score is brutally honest, and that is exactly what I needed. Saved me from two bad-fit roles.',
    img: 'https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    name: 'Sofia L.',
    role: 'Data Analyst',
    quote: 'My job search went from a chaos of tabs to one board. The follow-up reminders alone are worth it.',
    img: 'https://images.pexels.com/photos/25651531/pexels-photo-25651531.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
]

const faqs = [
  {
    q: 'How does the fit score work?',
    a: 'Bragit reads the full job description and matches it against your profile — your skills, target roles, and work-mode preference. You get a 0–100 score plus the specific reasons behind it, so the number is never a black box.',
  },
  {
    q: 'Is the free plan really free?',
    a: 'Yes. Track up to 5 jobs and 10 active applications with AI scoring included, no credit card required. Upgrade to Pro when your search gets serious.',
  },
  {
    q: 'Can I import jobs from LinkedIn and other boards?',
    a: 'Just paste the posting details — title, company, description — and Bragit does the rest. Works with any board that lets you copy text.',
  },
  {
    q: 'What happens to my documents?',
    a: 'Your CVs and cover letters live in your private document library, versioned automatically. Mark one active per type and Bragit keeps track of what you sent where.',
  },
  {
    q: 'Can I cancel Pro anytime?',
    a: 'Yes — monthly billing, cancel in one click, keep everything you have created.',
  },
]

export default function LandingPage() {
  const { session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [activeStyle, setActiveStyle] = useState(STYLE_PRESETS[0])

  return (
    <div className="landing">
      <header className={`landing-topbar${menuOpen ? ' open' : ''}`}>
        <div className="container landing-nav">
          <Link to="/" className="landing-logo">
            <img src="/logo.svg" alt="Bragit" width={28} height={28} />
            Bragit
          </Link>
          <nav className="landing-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#testimonials">Loved by hunters</a>
            <Link to="/pricing">Pricing</Link>
          </nav>
          <div className="landing-cta-group">
            {session ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">Open dashboard</Link>
            ) : (
              <>
                <Link to="/signin" className="landing-signin">Sign in</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Start free</Link>
              </>
            )}
            <button className="landing-burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="landing-mobile-menu">
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)}>Loved by hunters</a>
            <Link to="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="container">
            <div className="hero-pill">
              <span className="pulse-dot" /> AI that hunts like a recruiter would.
            </div>
            <h1>
              Land your next role, <br />
              <span className="hero-gradient">without the chaos.</span>
            </h1>
            <p className="hero-sub">
              Paste any job posting and Bragit scores your fit, explains why,
              and tracks the application from first click to signed offer —
              so you spend your energy on interviews, not spreadsheets.
            </p>
            <div className="hero-cta-row">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Start free <ArrowRight size={17} />
              </Link>
              <a href="#how" className="btn btn-ghost btn-lg">See how it works</a>
            </div>
            <p className="hero-note">Free plan · No credit card required</p>

            {/* Style bar */}
            <div className="style-bar no-scrollbar">
              {STYLE_PRESETS.map((styleName) => (
                <button
                  key={styleName}
                  onClick={() => setActiveStyle(styleName)}
                  className={`style-chip${activeStyle === styleName ? ' active' : ''}`}
                >
                  {styleName}
                </button>
              ))}
            </div>

            {/* Product mockup */}
            <div className="hero-mockup">
              <div className="mockup-bar">
                <span className="mockup-dot red" />
                <span className="mockup-dot amber" />
                <span className="mockup-dot green" />
                <span className="mockup-title">app.bragit.xyz — dashboard</span>
              </div>
              <div className="mockup-body">
                <div className="mockup-side">
                  <div className="mockup-nav active">Dashboard</div>
                  <div className="mockup-nav">Job Board</div>
                  <div className="mockup-nav">Pipeline</div>
                  <div className="mockup-nav">Documents</div>
                </div>
                <div className="mockup-main">
                  <div className="mockup-stats">
                    <div className="mockup-stat"><span>Jobs</span><strong>24</strong></div>
                    <div className="mockup-stat"><span>Applied</span><strong>9</strong></div>
                    <div className="mockup-stat"><span>Interviews</span><strong>3</strong></div>
                    <div className="mockup-stat"><span>Avg fit</span><strong>82</strong></div>
                  </div>
                  <div className="mockup-rows">
                    {[
                      { t: 'Senior Product Engineer', c: 'Linear', s: 92, stage: 'Interview' },
                      { t: 'Staff Frontend Engineer', c: 'Vercel', s: 87, stage: 'Applied' },
                      { t: 'Design Engineer', c: 'Stripe', s: 84, stage: 'Screening' },
                      { t: 'Founding Engineer', c: 'Attio', s: 76, stage: 'Saved' },
                    ].map((r) => (
                      <div className="mockup-row" key={r.t}>
                        <div className="mockup-fit" style={{ borderColor: r.s >= 80 ? 'var(--success)' : 'var(--warning)', color: r.s >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                          {r.s}
                        </div>
                        <div className="mockup-job">
                          <span className="mockup-job-title">{r.t}</span>
                          <span className="mockup-job-co">{r.c}</span>
                        </div>
                        <span className="mockup-stage">{r.stage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mockup-statusbar">
                <span>Profile tuned · {activeStyle} preset loaded</span>
                <span className="mockup-status-meta">fit engine v2 · live</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section" id="features">
          <div className="container">
            <div className="section-head">
              <div className="section-kicker">Features</div>
              <h2>Built by job hunters, for job hunters</h2>
              <p>Everything a serious search needs — nothing it doesn't.</p>
            </div>
            <div className="feature-grid">
              {features.map((f) => (
                <div className="feature-tile" key={f.title}>
                  <div className="feature-tile-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="section section-alt" id="how">
          <div className="container">
            <div className="section-head">
              <div className="section-kicker">How it works</div>
              <h2>Four steps to a signed offer</h2>
              <p>From scattered tabs to a pipeline that converts.</p>
            </div>
            <div className="steps-grid">
              {steps.map((s, i) => (
                <div className="step-card" key={s.title}>
                  <div className="step-num">{i + 1}</div>
                  <div>
                    <div className="step-label">{s.label}</div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="section" id="testimonials">
          <div className="container">
            <div className="section-head">
              <div className="section-kicker">Loved by hunters</div>
              <h2>In the words of people who landed roles</h2>
            </div>
            <div className="testi-grid">
              {testimonials.map((t) => (
                <div className="testi-card" key={t.name}>
                  <div className="testi-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="var(--accent)" color="var(--accent)" />
                    ))}
                  </div>
                  <p className="testi-quote">"{t.quote}"</p>
                  <div className="testi-person">
                    <img src={t.img} alt={t.name} loading="lazy" />
                    <div>
                      <div className="testi-name">{t.name}</div>
                      <div className="testi-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <div className="section-kicker">Pricing</div>
              <h2>Get hired, with less effort</h2>
              <p>Start free. Upgrade when your search gets serious.</p>
            </div>
            <div className="home-pricing">
              <div className="home-price-card">
                <div className="home-price-name">Free</div>
                <div className="home-price-tag">$0<span>/mo</span></div>
                <ul>
                  <li><Check size={15} /> 5 tracked jobs</li>
                  <li><Check size={15} /> 10 active applications</li>
                  <li><Check size={15} /> AI fit scoring</li>
                  <li><Check size={15} /> Follow-up reminders</li>
                </ul>
                <Link to="/signup" className="btn btn-ghost btn-block">Try it</Link>
              </div>
              <div className="home-price-card featured">
                <div className="home-price-badge">Most popular</div>
                <div className="home-price-name">Pro</div>
                <div className="home-price-tag">$9<span>/mo</span></div>
                <ul>
                  <li><Check size={15} /> Unlimited jobs &amp; applications</li>
                  <li><Check size={15} /> Unlimited document versions</li>
                  <li><Check size={15} /> Advanced fit insights</li>
                  <li><Check size={15} /> Priority support</li>
                </ul>
                <Link to="/pricing" className="btn btn-primary btn-block">Get started</Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section">
          <div className="container container-narrow">
            <div className="section-head">
              <div className="section-kicker">FAQ</div>
              <h2>Questions, answered</h2>
            </div>
            <div className="faq-list">
              {faqs.map((f, i) => (
                <div className={`faq-item${openFaq === i ? ' open' : ''}`} key={f.q}>
                  <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    {f.q}
                    <span className="faq-chevron">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && <p className="faq-a">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section">
          <div className="container">
            <div className="final-cta">
              <h2>Your next role is one score away</h2>
              <p>Join the hunters who stopped spraying applications and started targeting.</p>
              <Link to="/signup" className="btn btn-light btn-lg">
                Start free today <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <img src="/logo.svg" alt="Bragit" width={22} height={22} />
            <span>Bragit</span>
          </div>
          <div className="footer-links">
            <Link to="/pricing">Pricing</Link>
            <a href="https://bragit.xyz" target="_blank" rel="noopener noreferrer">bragit.xyz</a>
          </div>
          <div className="footer-copy">© {new Date().getFullYear()} Bragit. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
