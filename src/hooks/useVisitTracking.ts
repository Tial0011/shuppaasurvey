import { useEffect } from 'react';
import { captureSource } from '@/utils/source';
import { trackEvent } from '@/services/surveyService';

/** Captures ?src= and records one "visit" per browser session (counts as a survey link click). */
export function useVisitTracking() {
  useEffect(() => {
    const src = captureSource();
    try {
      if (sessionStorage.getItem('shuppaa_visit')) return;
      sessionStorage.setItem('shuppaa_visit', '1');
    } catch { /* storage blocked: still count it */ }
    trackEvent('visit', src);
  }, []);
}
