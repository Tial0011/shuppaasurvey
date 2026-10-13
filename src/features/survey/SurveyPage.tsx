import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';
import { useSurveyConfig } from '@/hooks/useSurveyConfig';
import { useVisitTracking } from '@/hooks/useVisitTracking';
import { getSource } from '@/utils/source';
import { newResponseId, submitResponse, trackEvent } from '@/services/surveyService';
import type { AnswerValue, Answers, Contact } from '@/lib/types';
import { validateContact, type ContactErrors } from '@/utils/validation';
import { QuestionField, isAnswered } from './QuestionField';
import { ThankYou } from './ThankYou';

const DONE_KEY = 'shuppaa_done';

export default function SurveyPage() {
  useVisitTracking();
  const { questions, settings, loading } = useSurveyConfig();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState<Contact>({ name: '', phone: '', email: '' });
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [trap, setTrap] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [finished, setFinished] = useState<null | { earlyAccess: boolean }>(null);
  const [already, setAlready] = useState(() => {
    try { return localStorage.getItem(DONE_KEY) === '1'; } catch { return false; }
  });
  const startedAt = useRef(Date.now());
  const started = useRef(false);
  const responseId = useRef(newResponseId());

  // Count one "start" per session, the first time the survey is actually shown.
  useEffect(() => {
    if (loading || !settings.isOpen || already || started.current) return;
    started.current = true;
    try {
      if (sessionStorage.getItem('shuppaa_start')) return;
      sessionStorage.setItem('shuppaa_start', '1');
    } catch { /* ignore */ }
    trackEvent('start', getSource());
  }, [loading, settings.isOpen, already]);

  // Bring each new question into view (important on phones, where the card can be taller than the screen).
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const total = questions.length;
  const onContactStep = step >= total;
  const progress = useMemo(() => Math.round((step / (total + 1)) * 100), [step, total]);
  const q = questions[step];

  const shell = (children: React.ReactNode) => (
    <div className="survey-shell">
      <div className="survey-top">
        <Logo />
        <Link to="/" className="btn btn-ghost btn-sm">Exit</Link>
      </div>
      <main className="survey-main">{children}</main>
    </div>
  );

  if (loading) return shell(<Spinner />);

  if (!settings.isOpen) {
    return shell(
      <div className="card thanks">
        <h2>The survey is closed</h2>
        <p>Thanks for your interest. Follow us to hear what we build next.</p>
        <div className="thanks-actions"><Link className="btn btn-primary" to="/">Back to home</Link></div>
      </div>,
    );
  }

  if (saved && !finished) {
    return shell(
      <div className="card thanks" role="status" aria-live="polite">
        <div className="thanks-icon"><Icon name="check" /></div>
        <h2>Submitted successfully</h2>
        <p>Your answers and details have been saved.</p>
      </div>,
    );
  }

  if (finished) return shell(<ThankYou earlyAccess={finished.earlyAccess} />);
  if (already) return shell(<ThankYou earlyAccess={false} alreadyDone onAnother={() => setAlready(false)} />);

  const setAnswer = (id: string, v: AnswerValue, advance?: boolean) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setError('');
    // Auto-advance only if the person is still on the question they just answered,
    // so tapping "Next" quickly never skips a question.
    const from = step;
    if (advance) setTimeout(() => setStep((s) => (s === from ? Math.min(s + 1, total) : s)), 260);
  };

  const next = () => {
    if (q.required && !isAnswered(q, answers[q.id])) {
      setError('Please answer this question to continue.');
      return;
    }
    setError('');
    setStep((s) => s + 1);
  };
  const back = () => { setError(''); setStep((s) => Math.max(0, s - 1)); };

  const submit = async () => {
    const missing = questions.find((question) => question.required && !isAnswered(question, answers[question.id]));
    if (missing) {
      setError(`Please answer the required question: ${missing.label || 'required question'}.`);
      const missingIndex = questions.findIndex((question) => question.id === missing.id);
      if (missingIndex >= 0) setStep(missingIndex);
      return;
    }
    // Name, email and phone are all required.
    const check = validateContact(contact);
    setContactErrors(check.errors);
    if (!check.valid) {
      setError('Please fix the highlighted fields to finish.');
      return;
    }

    const clean = Object.fromEntries(
      Object.entries(answers).filter(([id]) => questions.some((x) => x.id === id)),
    ) as Answers;

    setSubmitting(true);
    setError('');
    console.info('[Shuppaa] Submitting survey…', { responseId: responseId.current });
    try {
      // Keep the "Submitting…" state on screen for at least a moment so it never feels instant.
      const minimumWait = new Promise((resolve) => setTimeout(resolve, 900));
      if (!trap) {
        await Promise.all([minimumWait, submitResponse({
          answers: clean,
          contact: check.value,
          id: responseId.current,
          source: getSource(),
          questions,
          startedAt: startedAt.current,
        })]);
      }
      console.log(
        '%c[Shuppaa] ✅ Survey submitted successfully',
        'color:#0bb9b7;font-weight:bold;font-size:13px',
        { responseId: responseId.current, answers: Object.keys(clean).length, source: getSource() || 'direct' },
      );
      try { localStorage.setItem(DONE_KEY, '1'); } catch { /* ignore */ }
      // Show a clear "saved" confirmation before moving to the thank-you screen.
      setSaved(true);
      await new Promise((resolve) => setTimeout(resolve, 1400));
      setFinished({ earlyAccess: true });
    } catch (e) {
      const code = (e as { code?: string }).code ?? 'unknown';
      console.error('[Shuppaa] Survey submission failed:', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(`We couldn’t send your answers (${code}). ${message} Check your connection and try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  return shell(
    <>
      <div className="survey-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${Math.max(progress, 4)}%` }} />
      </div>
      <div className="survey-count">
        <span>{onContactStep ? 'Last step' : `Question ${step + 1} of ${total}`}</span>
        <span>{settings.surveyTitle}</span>
      </div>

      {step === 0 && !onContactStep && settings.surveyIntro && (
        <p className="muted" style={{ marginBottom: 16 }}>{settings.surveyIntro}</p>
      )}

      {!onContactStep && q && (
        <div className="card q-card" key={q.id}>
          <h2>{q.label}{!q.required && <span className="muted" style={{ fontWeight: 600, fontSize: 15 }}> (optional)</span>}</h2>
          {q.help && <p className="q-help">{q.help}</p>}
          <QuestionField question={q} value={answers[q.id]} onChange={(v, adv) => setAnswer(q.id, v, adv)} />
          {error && <p className="error-text q-error" role="alert">{error}</p>}
          <div className="q-nav">
            <button className="btn btn-ghost" onClick={back} disabled={step === 0}><Icon name="back" size={16} /> Back</button>
            <button className="btn btn-primary" onClick={next}>
              {step === total - 1 ? 'Continue' : 'Next'} <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      )}

      {onContactStep && (
        <div className="card q-card" key="contact">
          <h2>Last step: where can we reach you?</h2>
          <p className="q-help">
            Add your name, email and WhatsApp number to finish. We’ll use them to get in touch about early access
            (the first {settings.earlyAccessLimit} responders).
          </p>
          <div className="contact-grid" aria-busy={submitting}>
            {([
              { key: 'name', label: 'Full name', type: 'text', auto: 'name', max: 80, mode: undefined },
              { key: 'email', label: 'Email address', type: 'email', auto: 'email', max: 120, mode: 'email' },
              { key: 'phone', label: 'WhatsApp / phone number', type: 'tel', auto: 'tel', max: 25, mode: 'tel' },
            ] as const).map((f) => (
              <div className="field" key={f.key}>
                <label htmlFor={`c-${f.key}`}>{f.label} <span style={{ color: 'var(--danger)' }} aria-hidden="true">*</span></label>
                <input
                  id={`c-${f.key}`} className="input" type={f.type} readOnly={submitting} autoComplete={f.auto} maxLength={f.max}
                  inputMode={f.mode} required aria-required="true" aria-invalid={Boolean(contactErrors[f.key])}
                  aria-describedby={contactErrors[f.key] ? `c-${f.key}-err` : undefined}
                  style={contactErrors[f.key] ? { borderColor: 'var(--danger)' } : undefined}
                  value={contact[f.key]}
                  onChange={(e) => {
                    const next = { ...contact, [f.key]: e.target.value };
                    setContact(next);
                    // Once someone has tried to submit, re-check as they type so errors clear immediately.
                    if (Object.keys(contactErrors).length) setContactErrors(validateContact(next).errors);
                  }}
                  enterKeyHint={f.key === 'phone' ? 'send' : 'next'}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    // Enter moves to the next field; only the last field submits.
                    const order = ['name', 'email', 'phone'];
                    const nextId = order[order.indexOf(f.key) + 1];
                    if (nextId) document.getElementById(`c-${nextId}`)?.focus();
                    else if (!submitting) submit();
                  }}
                />
                {contactErrors[f.key] && <span id={`c-${f.key}-err`} className="error-text" role="alert">{contactErrors[f.key]}</span>}
              </div>
            ))}
            <input className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" name="fax_number_2"
              value={trap} onChange={(e) => setTrap(e.target.value)} />
          </div>
          {error && <p className="error-text q-error" role="alert">{error}</p>}
          <div className="q-nav">
            <button className="btn btn-ghost" onClick={back} disabled={submitting}><Icon name="back" size={16} /> Back</button>
            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? (<><span className="btn-spinner" aria-hidden="true" /> Submitting…</>) : 'Submit survey'}
            </button>
          </div>
        </div>
      )}
    </>,
  );
}
