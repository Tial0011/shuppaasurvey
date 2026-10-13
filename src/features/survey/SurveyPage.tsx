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
import { QuestionField, isAnswered } from './QuestionField';
import { ThankYou } from './ThankYou';

const DONE_KEY = 'shuppaa_done';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SurveyPage() {
  useVisitTracking();
  const { questions, settings, loading } = useSurveyConfig();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState<Contact>({ name: '', phone: '', email: '' });
  const [trap, setTrap] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState<null | { earlyAccess: boolean }>(null);
  const [already, setAlready] = useState(() => {
    try { return localStorage.getItem(DONE_KEY) === '1'; } catch { return false; }
  });
  const startedAt = useRef(Date.now());
  const started = useRef(false);
  const responseId = useRef(newResponseId());
  const submittingRef = useRef(false);

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
    if (trap.trim()) {
      setError('We couldn’t submit this response. Please refresh the page and try again.');
      return;
    }
    if (submittingRef.current) return;

    const name = contact.name.trim();
    const email = contact.email.trim();
    const phone = contact.phone.trim();
    const hasAnyContact = Boolean(name || email || phone);
    const digits = phone.replace(/\D/g, '');
    if (email && (email.length > 120 || !EMAIL_RE.test(email))) {
      setError('That email address doesn’t look right. Check it and try again.');
      return;
    }
    if (phone && (digits.length < 7 || digits.length > 15)) {
      setError('Enter a valid phone number with 7–15 digits, including your country code if needed.');
      return;
    }
    if (hasAnyContact && !email && !phone) {
      setError('To claim early access, please provide an email address or phone number. You can also submit without contact details.');
      return;
    }

    const hasContact = Boolean(email || phone);
    const clean = Object.fromEntries(
      Object.entries(answers).filter(([id]) => questions.some((x) => x.id === id)),
    ) as Answers;

    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      await submitResponse({
        answers: clean,
        contact: hasContact ? { name, phone, email } : null,
        id: responseId.current,
        source: getSource(),
        questions,
        startedAt: startedAt.current,
      });
      try { localStorage.setItem(DONE_KEY, '1'); } catch { /* ignore */ }
      setFinished({ earlyAccess: hasContact });
    } catch (e) {
      const code = (e as { code?: string }).code ?? 'unknown';
      console.error('[Shuppaa] Survey submission failed:', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(`We couldn’t send your answers (${code}). ${message} Check your connection and try again.`);
    } finally {
      submittingRef.current = false;
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
          <h2>Want early access?</h2>
          <p className="q-help">
            Leave your details and we’ll let you know when Shuppaa is ready. The first {settings.earlyAccessLimit} responders get early access.
            Totally optional.
          </p>
          <div className="contact-grid">
            <div className="field"><label htmlFor="c-name">Name</label>
              <input id="c-name" className="input" autoComplete="name" maxLength={80} value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })} /></div>
            <div className="field"><label htmlFor="c-phone">WhatsApp / phone number</label>
              <input id="c-phone" className="input" type="tel" autoComplete="tel" maxLength={25} value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></div>
            <div className="field"><label htmlFor="c-email">Email</label>
              <input id="c-email" className="input" type="email" autoComplete="email" maxLength={120} value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })} /></div>
            <input className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" name="fax_number_2"
              value={trap} onChange={(e) => setTrap(e.target.value)} />
          </div>
          {error && <p className="error-text q-error" role="alert">{error}</p>}
          <div className="q-nav">
            <button className="btn btn-ghost" onClick={back} disabled={submitting}><Icon name="back" size={16} /> Back</button>
            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? 'Sending…' : contact.email || contact.phone || contact.name ? 'Submit & claim early access' : 'Submit without contact'}
            </button>
          </div>
        </div>
      )}
    </>,
  );
}
