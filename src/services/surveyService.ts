import {
  addDoc, collection, doc, setDoc as setDocRaw, getDoc, increment, onSnapshot, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'timeout' })), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });

interface SubmitInput {
  id: string;
  answers: Answers;
  contact: Contact | null;
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
  await withTimeout(
    setDocRaw(doc(db, 'responses', id), {
      answers,
      contact,
      source: finalSource,
      isUnimed,
      heardFrom,
      durationSec: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
      createdAt: serverTimestamp(),
    }),
    20000,
  );

  // Public counter. Best-effort: the response is already saved.
  try {
    await setDoc(doc(db, 'stats', 'public'), { responseCount: increment(1) }, { merge: true });
  } catch {
    /* ignore */
  }
}
