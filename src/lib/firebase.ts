import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const env = import.meta.env;

export const firebaseConfig = {
  // Web config is public by design (security comes from firestore.rules), so the
  // fallbacks keep the site working on Netlify even if env vars aren't set there.
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyCK5_DrlAlBkL7bxFyZEGjVSJNIjO4PpdY',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'shuppaa-survey.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'shuppaa-survey',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'shuppaa-survey.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1070776935809',
  appId: env.VITE_FIREBASE_APP_ID || '1:1070776935809:web:d2b47994454f49abbe3480',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-JGLCYRH3JV',
};

export const app = initializeApp(firebaseConfig);
// Force long polling: avoids the streaming connection that breaks on networks where
// QUIC/HTTP3 or proxies misbehave (ERR_QUIC_PROTOCOL_ERROR).
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const auth = getAuth(app);

// Analytics only works in supported browsers (and not when blocked by extensions).
export let analytics: Analytics | null = null;
isSupported()
  .then((ok) => {
    if (ok) analytics = getAnalytics(app);
  })
  .catch(() => undefined);
