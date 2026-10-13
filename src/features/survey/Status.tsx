import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { firebaseConfig } from '@/lib/firebase';
import { restCreate, newResponseId, type RestResult } from '@/services/surveyService';

declare const __BUILD__: string;

interface Step { name: string; r?: RestResult }

/** Self-test: tells you exactly which part of the connection to Firestore is failing. */
export default function Status() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    const out: Step[] = [];
    const push = (s: Step) => { out.push(s); setSteps([...out]); };

    // 1. Can this device reach Firestore at all? (public read of the settings doc; 404 is fine too)
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/config/settings?key=${firebaseConfig.apiKey}`);
      push({ name: '1. Reach Firestore + read settings', r: { ok: res.status === 200 || res.status === 404, status: res.status, code: res.statusText || String(res.status), message: res.status === 404 ? 'Reachable (no settings saved yet)' : 'Reachable' } });
    } catch (e) {
      push({ name: '1. Reach Firestore + read settings', r: { ok: false, status: 0, code: 'network', message: String((e as Error).message) } });
    }
    // 2. Write a funnel event
    push({ name: '2. Write an event', r: await restCreate('events', newResponseId(), { type: 'start', source: 'diagnostic' }) });
    // 3. Write a response exactly like the survey does (flagged "diagnostic", hidden from the dashboard)
    push({ name: '3. Write a response', r: await restCreate('responses', newResponseId(), {
      answers: { q_test: 'status check' }, contact: null, source: 'diagnostic', isUnimed: null, heardFrom: null, durationSec: 0,
    }) });
    setRunning(false);
  };

  return (
    <div className="survey-shell">
      <div className="survey-top"><Logo /><Link to="/" className="btn btn-ghost btn-sm">Home</Link></div>
      <main className="survey-main">
        <div className="card q-card">
          <h2>Connection check</h2>
          <p className="q-help">Runs three quick tests against Firestore from this device. Send a screenshot of the result if anything fails.</p>
          <div className="q-body">
            {steps.map((s) => (
              <div key={s.name} className="card" style={{ padding: 14, borderColor: s.r?.ok ? 'var(--teal)' : 'var(--danger)' }}>
                <b>{s.r?.ok ? '✓' : '✗'} {s.name}</b>
                <div className="hint" style={{ wordBreak: 'break-word' }}>HTTP {s.r?.status} · {s.r?.code} · {s.r?.message}</div>
              </div>
            ))}
          </div>
          <div className="q-nav"><span className="hint">Build {__BUILD__} · {window.location.host}</span>
            <button className="btn btn-primary" onClick={run} disabled={running}>{running ? 'Testing…' : 'Run test'}</button></div>
        </div>
      </main>
    </div>
  );
}
