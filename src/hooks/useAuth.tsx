import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { checkIsAdmin, watchAuth } from '@/services/adminService';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}
const AuthContext = createContext<AuthState>({ user: null, isAdmin: false, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isAdmin: false, loading: true });

  useEffect(() => {
    return watchAuth(async (user) => {
      if (!user) return setState({ user: null, isAdmin: false, loading: false });
      setState({ user, isAdmin: false, loading: true });
      const isAdmin = await checkIsAdmin(user.uid);
      setState({ user, isAdmin, loading: false });
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
