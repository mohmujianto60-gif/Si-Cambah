import { createContext, useContext } from 'react';
import type { User } from '../types/hibah';

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  isOperator: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
  isAdmin: false,
  isOperator: false,
});

export function useAuth() {
  return useContext(AuthContext);
}
