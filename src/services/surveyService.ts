import {
  addDoc, collection, doc, getDoc, increment, onSnapshot, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { db, firebaseConfig } from '@/lib/firebase';
import type { Answers, Contact, EventType, Question, Settings } from '@/lib/types';
import { DEFAULT_QUESTIONS, DEFAULT_SETTINGS } from '@/config/defaultSurvey';
import { sourceFromAnswer } from '@/utils/source';

export interface SurveyConfig { questions: Question[]; settings: Settings }

export const DEFAULT_CONFIG: SurveyConfig = { questions: DEFAULT_QUESTIONS, settings: DEFAULT_SETTINGS };

/** Live subscription to the survey questions + settings. Falls back to defaults. */
export function subscribeConfig(
  cb: (c: SurveyConfig) => void,
  onError?: (e: Error) => void,
) {
  let questions = DEFAULT_QUESTIONS;
  let settings = DEFAULT_SETTINGS;
  const emit = () => cb({ questions, settings });

  const u1 = onSnapshot(
    doc(db, 'config', 'survey'),
    (s) => {
      const q = s.data()?.questions as Question[] | undefined;
      questions = q && q.length ? q : DEFAULT_QUESTIONS;
      emit();
    },
    (e) => onError?.(e),
  );
  const u2 = onSnapshot(
    doc(db, 'config', 'settings'),
    (s) => {
      settings = { ...DEFAULT_SETTINGS, ...(s.data() as Partial<Settings> | undefined) };
      emit();
    },
    (e) => onError?.(e),
  );
  return () => { u1(); u2(); };
}

/** Public counter used for "spots left". */
export function subscribeResponseCount(cb: (n: number) => void) {
  return onSnapshot(
    doc(db, 'stats', 'public'),
    (s) => cb(Number(s.data()?.responseCount ?? 0)),
    () => cb(0),
  );
}

export async function getResponseCount(): Promise<number> {
  try {
    const s = await getDoc(doc(db, 'stats', 'public'));
    return Number(s.data()?.responseCount ?? 0);
  } catch {
    return 0;
  }
}

export async function trackEvent(type: EventType, source: string) {
  try {
    await addDoc(collection(db, 'events'), {
      type,
      source: source || 'direct',
      createdAt: serverTimestamp(),
    });
  } catch {
    /* tracking must never break the survey */
  }
}

export const newResponseId = () => doc(collection(db, 'responses')).id;

/* ---------------- REST helpers (plain HTTPS, no streaming connection) ---------------- */
type FsValue = Record<string, unknown>;
function enc(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: v.length ? { values: v.map(enc) } : {} };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, enc(x)])) } };
}

export interface RestResult { ok: boolean; status: number; code: string; message: string }

/** Create `collection/id` with a server-set createdAt. Never throws: returns what Firestore said. */
export async function restCreate(col: 'responses' | 'events', id: string, data: Record<string, unknown>): Promise<RestResult> {
  const { projectId, apiKey } = firebaseConfig;
  const base = `projects/${projectId}/databases/(default)/documents`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/${base}:commit?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        writes: [{
          update: { name: `${base}/${col}/${id}`, fields: (enc(data).mapValue as { fields: FsValue }).fields },
          updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
          currentDocument: { exists: false },
        }],
      }),
    });
    if (res.ok) return { ok: true, status: res.status, code: 'ok', message: 'saved' };
    const body = await res.json().catch(() => ({}));
    const status: string = body?.error?.status ?? `http-${res.status}`;
    return {
      // Saved by an earlier attempt we never heard back from: that counts as success.
      ok: status === 'ALREADY_EXISTS',
      status: res.status,
      code: status.toLowerCase().replace(/_/g, '-'),
      message: String(body?.error?.message ?? status).slice(0, 300),
    };
  } catch (e) {
    const aborted = (e as Error).name === 'AbortError';
    return { ok: false, status: 0, code: aborted ? 'timeout' : 'network', message: aborted ? 'No reply within 20s' : String((e as Error).message) };
  } finally {
    clearTimeout(timer);
  }
}

/** Same write through the Firebase SDK, used as a second route if the REST call fails to connect. */
async function sdkCreateResponse(id: string, data: Record<string, unknown>): Promise<RestResult> {
  try {
    await Promise.race([
      setDoc(doc(db, 'responses', id), { ...data, createdAt: serverTimestamp() }),
      new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('No reply within 15s'), { code: 'timeout' })), 15000)),
    ]);
    return { ok: true, status: 200, code: 'ok', message: 'saved via SDK' };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    return { ok: false, status: 0, code: err.code ?? 'sdk-error', message: String(err.message ?? e).slice(0, 300) };
  }
}

/* ---------------- Outbox: a response is never lost, even if the network drops ---------------- */
const OUTBOX = 'shuppaa_outbox';
interface Pending { id: string; data: Record<string, unknown> }
const readOutbox = (): Pending[] => { try { return JSON.parse(localStorage.getItem(OUTBOX) || '[]'); } catch { return []; } };
const writeOutbox = (list: Pending[]) => { try { localStorage.setItem(OUTBOX, JSON.stringify(list)); } catch { /* ignore */ } };

/** Retry anything that failed earlier. Called on page load and whenever the phone comes back online. */
export async function flushOutbox() {
  for (const item of readOutbox()) {
    const r = await restCreate('responses', item.id, item.data);
    // Drop it once saved. A rules rejection will never succeed on retry, so drop that too.
    if (r.ok || r.code === 'permission-denied' || r.code === 'invalid-argument') {
      writeOutbox(readOutbox().filter((x) => x.id !== item.id));
    }
  }
}

interface SubmitInput {
  id: string;
  answers: Answers;
  contact: Contact | null;
  source: string;
  questions: Question[];
  startedAt: number;
}

export class SubmitError extends Error {
  code: string;
  detail: string;
  constructor(code: string, detail: string) { super(detail); this.code = code; this.detail = detail; }
}

export async function submitResponse({ id, answers, contact, source, questions, startedAt }: SubmitInput) {
  const unimedQ = questions.find((q) => q.tag === 'unimed');
  const heardQ = questions.find((q) => q.tag === 'heard');

  let isUnimed: boolean | null = null;
  if (unimedQ && typeof answers[unimedQ.id] === 'string') {
    isUnimed = answers[unimedQ.id] === unimedQ.options?.[0];
  }
  const heardFrom = heardQ && typeof answers[heardQ.id] === 'string' ? (answers[heardQ.id] as string) : null;
  const finalSource = source || sourceFromAnswer(heardFrom) || 'direct';

  const data = {
    answers,
    contact,
    source: finalSource,
    isUnimed,
    heardFrom,
    durationSec: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
  };

  // Route 1: plain HTTPS. Route 2 (only if route 1 couldn't connect): the Firebase SDK.
  let r = await restCreate('responses', id, data);
  let detail = `REST ${r.status} ${r.code}: ${r.message}`;
  if (!r.ok && (r.code === 'network' || r.code === 'timeout')) {
    const r2 = await sdkCreateResponse(id, data);
    detail += ` | SDK ${r2.code}: ${r2.message}`;
    r = r2;
  }

  if (!r.ok) {
    // Keep the answers on the device and retry automatically later (not for rule rejections).
    if (r.code !== 'permission-denied' && r.code !== 'invalid-argument') {
      writeOutbox([...readOutbox().filter((x) => x.id !== id), { id, data }]);
    }
    throw new SubmitError(r.code, detail);
  }

  // Public counter: best-effort and never awaited, so it can't hold up the thank-you screen.
  setDoc(doc(db, 'stats', 'public'), { responseCount: increment(1) }, { merge: true }).catch(() => undefined);
}
