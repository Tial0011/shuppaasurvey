import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SurveyResponse } from '@/lib/types';
import { countEvents, subscribeResponses } from '@/services/adminService';

interface Ctx {
  responses: SurveyResponse[];
  loading: boolean;
  error: string | null;
  visits: number;
  starts: number;
}
const ResponsesContext = createContext<Ctx>({
  responses: [], loading: true, error: null, visits: 0, starts: 0,
});

/** Only mounted inside the admin area, so public visitors never load responses. */
export function ResponsesProvider({ children }: { children: ReactNode }) {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visits, setVisits] = useState(0);
  const [starts, setStarts] = useState(0);

  useEffect(() => {
    return subscribeResponses(
      (r) => { setResponses(r.filter((x) => x.source !== 'diagnostic')); setLoading(false); setError(null); },
      (e) => { setError(e.message); setLoading(false); },
    );
  }, []);

  // Funnel counts refresh whenever the number of responses changes.
  useEffect(() => {
    countEvents('visit').then(setVisits).catch(() => undefined);
    countEvents('start').then(setStarts).catch(() => undefined);
  }, [responses.length]);

  return (
    <ResponsesContext.Provider value={{ responses, loading, error, visits, starts }}>
      {children}
    </ResponsesContext.Provider>
  );
}

export const useResponses = () => useContext(ResponsesContext);
