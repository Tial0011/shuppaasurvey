import { Link } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { useSurveyConfig } from '@/hooks/useSurveyConfig';
import { useEffect, useState } from 'react';
import { subscribeResponseCount } from '@/services/surveyService';
import { useVisitTracking } from '@/hooks/useVisitTracking';

export default function Landing() {
  useVisitTracking();
  const { settings } = useSurveyConfig();
  const [count, setCount] = useState(0);

  useEffect(() => subscribeResponseCount(setCount), []);

  const left = Math.max(0, settings.earlyAccessLimit - count);
  const pct = Math.min(100, Math.round((count / Math.max(1, settings.earlyAccessLimit)) * 100));
  const closed = !settings.isOpen;

  return (
    <>
      <header className="site-header">
        <div className="container">
          <Logo />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/admin/login" className="btn btn-ghost btn-sm">Admin login</Link>
            <Link to="/survey" className="btn btn-primary btn-sm">Take the survey</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <span className="pill pill-teal">Built with students, not just for them</span>
              <h1>
                Small business.<br />
                <span className="accent">Big-business habits.</span>
              </h1>
              <p className="lead">
                Ever wonder why big companies record everything? Because records protect the business.
                Shuppaa helps small sellers do the same: stock, sales proof and suppliers, all in one place.
              </p>
              <div className="hero-actions">
                <Link to="/survey" className="btn btn-primary btn-lg">
                  {closed ? 'See the survey' : 'Take the survey'} <Icon name="arrow" size={18} />
                </Link>
                <span className="hero-note">
                  <span className="pill">About {BRAND.surveyMinutes} minutes</span>
                </span>
              </div>
            </div>

            <aside className="spots-card" aria-label="Early access progress">
              <h3>Early access spots</h3>
              <div className="spots-number">{left}</div>
              <p className="muted">left of {settings.earlyAccessLimit} for the first responders</p>
              <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar" style={{ width: `${pct}%` }} />
              </div>
              <ul className="spots-list">
                {['Takes about 3 minutes', 'Your answers decide what we build first', 'We share the results back with you'].map((t) => (
                  <li key={t}><span className="tick"><Icon name="check" /></span>{t}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="section alt">
          <div className="container">
            <div className="section-head">
              <span className="pill">What we’re building</span>
              <h2>Three habits that protect your business</h2>
              <p>Shuppaa is at the idea stage. We’re sharing the thinking, and the people it’s built for get to shape it.</p>
            </div>
            <div className="pillars">
              {BRAND.pillars.map((p) => (
                <article className="card pillar" key={p.title}>
                  <div className="pillar-icon"><Icon name={p.icon} /></div>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="pill pill-teal">Sound familiar?</span>
              <h2>Running a small business is hard enough</h2>
            </div>
            <div className="problems">
              {BRAND.problems.map((t) => (
                <blockquote className="card problem" key={t} style={{ margin: 0 }}>“{t}”</blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="section alt">
          <div className="container">
            <div className="section-head">
              <span className="pill">How it works</span>
              <h2>Your voice, in three simple steps</h2>
            </div>
            <div className="steps">
              <div className="card step"><h3>Answer a few questions</h3><p>Short, easy questions about how you sell today. No right or wrong answers.</p></div>
              <div className="card step"><h3>Claim early access</h3><p>Leave your contact at the end and you’re on the list for when Shuppaa launches.</p></div>
              <div className="card step"><h3>See what we build</h3><p>We share the survey results and progress, so you can see your input at work.</p></div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="cta-band">
              <h2>Help shape Shuppaa</h2>
              <p>{closed ? 'The survey is closed right now. Follow us to hear what’s next.' : 'Three minutes. Real impact. The first responders get early access.'}</p>
              <Link to="/survey" className="btn btn-lg">{closed ? 'Learn more' : 'Start the survey'} <Icon name="arrow" size={18} /></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <span>© {new Date().getFullYear()} {BRAND.name}. {BRAND.tagline}</span>
          <span>Follow us {BRAND.handle} · <Link to="/admin/login">Admin login</Link></span>
        </div>
      </footer>
    </>
  );
}
