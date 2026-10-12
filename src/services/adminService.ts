import {
  collection, deleteDoc, doc, getCountFromServer, getDoc, limit, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, Timestamp, where,
} from 'firebase/firestore';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, type User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { Question, Settings, SurveyResponse, EventType } from '@/lib/types';

/* ---------- auth ---------- */
export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);
export const watchAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);

/** An admin is a user with a document at admins/{uid}. */
export async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    const s = await getDoc(doc(db, 'admins', uid));
    return s.exists();
  } catch {
    return false;
  }
}

/* ---------- responses ---------- */
export function subscribeResponses(
  cb: (r: SurveyResponse[]) => void,
  onError: (e: Error) => void,
) {
  const q = query(collection(db, 'responses'), orderBy('createdAt', 'desc'), limit(5000));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => {
          const x = d.data({ serverTimestamps: 'estimate' });
          return {
            id: d.id,
            answers: x.answers ?? {},
            contact: x.contact ?? null,
            source: x.source ?? 'direct',
            isUnimed: x.isUnimed ?? null,
            heardFrom: x.heardFrom ?? null,
            durationSec: x.durationSec ?? 0,
            createdAt: (x.createdAt as Timestamp)?.toDate?.() ?? new Date(),
          } satisfies SurveyResponse;
        }),
      );
    },
    onError,
  );
}

export const deleteResponse = (id: string) => deleteDoc(doc(db, 'responses', id));

export async function countEvents(type: EventType): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, 'events'), where('type', '==', type)));
  return snap.data().count;
}

/* ---------- survey config ---------- */
export const saveQuestions = (questions: Question[]) =>
  setDoc(doc(db, 'config', 'survey'), { questions, updatedAt: serverTimestamp() });

export const saveSettings = (settings: Settings) =>
  setDoc(doc(db, 'config', 'settings'), { ...settings, updatedAt: serverTimestamp() });
