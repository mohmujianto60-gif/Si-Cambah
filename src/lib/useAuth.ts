import { createContext, useContext } from 'react';
import type { User } from '../types/hibah';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  isAdmin: boolean;
  isOperator: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const noop = async (): Promise<{ error: string | null }> => ({ error: null });

export const AuthContext = createContext<AuthContextType>({
  user: null,
  status: 'loading',
  isAdmin: false,
  isOperator: false,
  signInWithPassword: noop,
  signInWithGoogle: noop,
  signOut: async () => {},
  resetPasswordForEmail: noop,
  updatePassword: noop,
});

export function useAuth() {
  return useContext(AuthContext);
}
