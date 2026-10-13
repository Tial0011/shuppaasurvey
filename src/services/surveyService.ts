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

type FsValue = Record<string, unknown>;
function enc(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: v.length ? { values: v.map(enc) } : {} };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, enc(x)])) } };
}

/**
 * Saves the response with a plain HTTPS request to the Firestore REST API instead of the SDK's
 * streaming connection. It is far more reliable on flaky mobile networks, and it is covered by
 * the same security rules. Throws an Error whose `code` mirrors the SDK's (e.g. permission-denied).
 */
async function restCreateResponse(id: string, data: Record<string, unknown>): Promise<boolean> {
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
          update: { name: `${base}/responses/${id}`, fields: (enc(data).mapValue as { fields: FsValue }).fields },
          updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
          currentDocument: { exists: false },
        }],
      }),
    });
    if (res.ok) return true;
    const body = await res.json().catch(() => ({}));
    const status: string = body?.error?.status ?? `HTTP_${res.status}`;
    // A retry can arrive after Firestore committed the first request but the client
    // lost its response. The create-only precondition makes this idempotent.
    if (status === 'ALREADY_EXISTS' || status === 'FAILED_PRECONDITION') return false;
    const message = typeof body?.error?.message === 'string' ? body.error.message : status;
    throw Object.assign(new Error(message), {
      code: status.toLowerCase().replace(/_/g, '-'),
      httpStatus: res.status,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw Object.assign(new Error('timeout'), { code: 'timeout' });
    if (!(e as { code?: string }).code) throw Object.assign(e as Error, { code: 'network' });
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

interface SubmitInput {
  id: string;
  answers: Answers;
  contact: Contact;
  source: string;
  questions: Question[];
  startedAt: number;
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

  // Stable id => a retry can never create a duplicate response.
  const created = await restCreateResponse(id, {
    answers,
    contact,
    source: finalSource,
    isUnimed,
    heardFrom,
    durationSec: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
  });

  // Increment only for a newly created response. A retry of an already-saved
  // response must not inflate the public count.
  if (created) {
    setDoc(doc(db, 'stats', 'public'), { responseCount: increment(1) }, { merge: true })
      .catch((e) => console.warn('[Shuppaa] Response saved, but public counter update failed:', e));
  }
}
