import { Link } from 'react-router-dom'
import {
  Target, KanbanSquare, FileText, Check, ArrowRight, Play,
  Search, Gauge, Zap, Menu, X, Star,
  MessageSquare, LayoutGrid, Scissors, Palette, FolderOpen,
  Sparkles, Paperclip, ArrowUp, Download,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

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

const bentoCards = [
  {
    title: 'Dynamic fit breakdowns',
    desc: 'Every score comes with a transparent breakdown — matched skills, gaps, and salary alignment — rendered as clean, animated captions.',
    visual: 'captions',
  },
  {
    title: 'Side-by-side role compare',
    desc: 'Stack two postings next to each other and watch Bragit highlight where you fit stronger and where you need to stretch.',
    visual: 'split',
  },
  {
    title: 'Application rhythm',
    desc: 'A scrubable timeline of your search cadence — when you applied, followed up, and heard back — so you never lose momentum.',
    visual: 'waveform',
  },
  {
    title: 'Pipeline that tells a story',
    desc: 'From saved to signed, every stage is visual. Drag a card and the whole funnel reshuffles in real time.',
    visual: 'pipeline',
  },
  {
    title: 'One number that means something',
    desc: 'The fit score isn\'t a black box. It\'s a weighted read of your skills, experience, and preferences against the posting in front of you.',
    visual: 'score',
  },
]

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'AI Studio', href: '#studio' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Pricing', to: '/pricing' },
]

export default function LandingPage() {
  const { session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="landing">
      {/* Step 2: Floating Glass Pill Navbar */}
      <nav className="glass-nav" aria-label="Primary">
        <Link to="/" className="landing-logo" style={{ flexShrink: 0 }}>
          <img src="/logo.svg" alt="Bragit" width={26} height={26} />
          Bragit
        </Link>
        <div className="glass-nav-links">
          {navLinks.map((l) =>
            l.href ? (
              <a key={l.label} href={l.href}>{l.label}</a>
            ) : (
              <Link key={l.label} to={l.to!}>{l.label}</Link>
            )
          )}
        </div>
        <div className="glass-nav-right">
          {session ? (
            <Link to="/dashboard" className="glass-nav-cta shimmer">Open dashboard</Link>
          ) : (
            <>
              <Link to="/signin" className="glass-nav-login">Log in</Link>
              <Link to="/signup" className="glass-nav-cta shimmer">Start free</Link>
            </>
          )}
          <button
            className="glass-burger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="glass-nav-mobile">
          {navLinks.map((l) =>
            l.href ? (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
            ) : (
              <Link key={l.label} to={l.to!} onClick={() => setMenuOpen(false)}>{l.label}</Link>
            )
          )}
          {!session && (
            <Link to="/signin" onClick={() => setMenuOpen(false)} style={{ fontWeight: 600 }}>Log in</Link>
          )}
        </div>
      )}

      <main>
        {/* Step 3: Editorial Hero */}
        <section className="editorial-hero">
          <div className="hero-orb hero-orb-violet" aria-hidden="true" />
          <div className="hero-orb hero-orb-cyan" aria-hidden="true" />
          <div className="hero-announce" style={{ position: 'relative' }}>
            <span className="hero-announce-badge">New</span>
            The job search copilot that learns your style
          </div>
          <h1 className="editorial-headline">
            Land your next role with<br />
            a search that <span className="hand-accent">thinks</span> ahead
          </h1>
          <p className="editorial-sub">
            Paste any job posting and Bragit scores your fit, explains why,
            and tracks the application from first click to signed offer —
            so you spend your energy on interviews, not spreadsheets.
          </p>
          <div className="editorial-cta-row">
            <Link to="/signup" className="btn-pill-dark">
              Start free <ArrowRight size={16} />
            </Link>
            <a href="#studio" className="btn-pill-frost">
              <Play size={15} /> Watch 1-min demo
            </a>
          </div>
        </section>

        {/* Step 4: Obsidian AI Studio */}
        <section id="studio" className="studio-wrap" style={{ marginTop: 8, marginBottom: 16 }}>
          <div className="studio-frame">
            <div className="studio-shell">
              <div className="studio-header">
                <div className="studio-header-left">
                  <FileText size={14} />
                  <span>Bragit Search Session.md</span>
                  <span className="studio-status-dot" />
                  <span className="studio-status-label">Agent Active</span>
                </div>
                <button className="studio-export">
                  <Download size={12} /> Export
                </button>
              </div>
              <div className="studio-body">
                {/* Left: AI Assistant Panel */}
                <div className="studio-left">
                  <div className="studio-dock">
                    <button className="studio-dock-btn active"><MessageSquare size={16} />Chat</button>
                    <button className="studio-dock-btn"><LayoutGrid size={16} />Storyboard</button>
                    <button className="studio-dock-btn"><Scissors size={16} />Cuts</button>
                    <button className="studio-dock-btn"><Palette size={16} />Styles</button>
                    <button className="studio-dock-btn"><FolderOpen size={16} />Assets</button>
                  </div>
                  <div className="studio-chat">
                    <div className="studio-bubble-agent">
                      Score this Senior Product Engineer posting against my profile, flag gaps, and draft a tailored cover letter intro.
                    </div>
                    <div className="studio-bubble-status">
                      Bragit scored the role at 87/100 — strong skill match, one gap in Rust. Drafted 4 targeted intro variations and queued a follow-up reminder for Thursday.
                    </div>
                  </div>
                  <div className="studio-input">
                    <Sparkles size={14} />
                    <span className="studio-input-spacer">Ask Bragit to score, draft, or triage…</span>
                    <Paperclip size={14} />
                    <button className="studio-input-submit" aria-label="Send"><ArrowUp size={14} /></button>
                  </div>
                </div>
                {/* Right: Video + Timeline */}
                <div className="studio-right">
                  <div className="studio-video">
                    <span className="studio-video-label">Live preview</span>
                    <div className="studio-cursor">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#36B5A2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4l7 16 2-7 7-2z" />
                      </svg>
                      <span className="studio-cursor-pill">Bragit AI</span>
                    </div>
                  </div>
                  <div className="studio-timeline">
                    <div className="studio-tl-top">
                      <button className="studio-play" aria-label="Play"><Play size={13} fill="currentColor" /></button>
                      <span className="studio-time tabular-nums">00:04.2 / 00:15.0</span>
                    </div>
                    <div className="studio-tracks">
                      <div className="studio-track-row">
                        <span className="studio-track-label">Video</span>
                        <div className="studio-track-lane">
                          <div className="studio-seg studio-seg-video" style={{ left: '0%', width: '38%' }} />
                          <div className="studio-seg studio-seg-video" style={{ left: '42%', width: '28%' }} />
                          <div className="studio-seg studio-seg-video" style={{ left: '74%', width: '24%' }} />
                        </div>
                      </div>
                      <div className="studio-track-row">
                        <span className="studio-track-label">Graphics</span>
                        <div className="studio-track-lane">
                          <div className="studio-seg studio-seg-graphics" style={{ left: '6%', width: '62%' }} />
                          <div className="studio-seg studio-seg-graphics" style={{ left: '72%', width: '24%' }} />
                        </div>
                      </div>
                      <div className="studio-track-row">
                        <span className="studio-track-label">Captions</span>
                        <div className="studio-track-lane">
                          <div className="studio-seg studio-seg-captions" style={{ left: '4%', width: '40%' }} />
                          <div className="studio-seg studio-seg-captions" style={{ left: '50%', width: '46%' }} />
                        </div>
                      </div>
                      <div className="studio-playhead" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 5: Bento Feature Grid */}
        <section id="showcase" className="bento-section">
          <div className="bento-head">
            <h2 className="bento-title">Crafted for hunters who refuse to spreadsheet-grind</h2>
            <p className="bento-sub">Every tool a serious search needs, rendered with the care of a studio app — not a cluttered ATS.</p>
          </div>
          <div className="bento-row1">
            {bentoCards.slice(0, 3).map((c) => (
              <BentoCard key={c.title} {...c} />
            ))}
          </div>
          <div className="bento-row2">
            {bentoCards.slice(3).map((c) => (
              <BentoCard key={c.title} {...c} />
            ))}
          </div>
        </section>

        {/* Features (existing) */}
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
                <div className="home-price-tag tabular-nums">$0<span>/mo</span></div>
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
                <div className="home-price-tag tabular-nums">$9<span>/mo</span></div>
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

function BentoCard({ title, desc, visual }: { title: string; desc: string; visual: string }) {
  return (
    <div className="bento-card">
      <div>
        <h3 className="bento-card-title">{title}</h3>
        <p className="bento-card-desc">{desc}</p>
      </div>
      <div className="bento-visual">
        {visual === 'captions' && (
          <div className="bento-caps">
            <span className="bento-cap-pill">Python</span>
            <span className="bento-cap-pill active">FastAPI</span>
            <span className="bento-cap-pill">PostgreSQL</span>
            <span className="bento-cap-pill">Docker</span>
            <span className="bento-cap-pill">AWS</span>
          </div>
        )}
        {visual === 'split' && (
          <div className="bento-split">
            <div className="bento-split-pane" />
            <div className="bento-split-pane" />
          </div>
        )}
        {visual === 'waveform' && (
          <div className="bento-waveform">
            {[20, 40, 30, 60, 80, 45, 70, 90, 55, 35, 65, 50, 75, 40, 85, 30, 60, 45, 70, 25, 55, 80, 40, 65].map((h, i) => (
              <div
                key={i}
                className={`bento-wave-bar${i >= 8 && i <= 14 ? ' active' : ''}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        )}
        {visual === 'pipeline' && (
          <div className="bento-pipeline">
            <span className="bento-pipe-step done">Saved</span>
            <span className="bento-pipe-arrow">→</span>
            <span className="bento-pipe-step done">Applied</span>
            <span className="bento-pipe-arrow">→</span>
            <span className="bento-pipe-step">Interview</span>
            <span className="bento-pipe-arrow">→</span>
            <span className="bento-pipe-step">Offer</span>
          </div>
        )}
        {visual === 'score' && (
          <div>
            <div className="bento-score">
              <span className="bento-score-num tabular-nums">87</span>
              <span className="bento-score-label">/ 100 fit score</span>
            </div>
            <div className="bento-score-bar">
              <div className="bento-score-fill" style={{ width: '87%' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
