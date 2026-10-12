import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_CONFIG, subscribeConfig, type SurveyConfig } from '@/services/surveyService';

interface Ctx extends SurveyConfig { loading: boolean }
const ConfigContext = createContext<Ctx>({ ...DEFAULT_CONFIG, loading: true });

export function SurveyConfigProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<Ctx>({ ...DEFAULT_CONFIG, loading: true });
  useEffect(() => {
    return subscribeConfig(
      (c) => setValue({ ...c, loading: false }),
      () => setValue((v) => ({ ...v, loading: false })),
    );
  }, []);
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export const useSurveyConfig = () => useContext(ConfigContext);
