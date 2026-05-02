import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types/hibah';

const USERS_KEY = 'sicambah_users';
const SESSION_KEY = 'sicambah_session';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  isOperator: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
  isAdmin: false,
  isOperator: false,
});

function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    const defaults: User[] = [
      {
        id: 'admin-001',
        username: 'admin',
        password: 'admin123',
        nama: 'Administrator',
        role: 'admin',
        created_at: new Date().toISOString(),
      },
      {
        id: 'operator-001',
        username: 'operator',
        password: 'operator123',
        nama: 'Operator',
        role: 'operator',
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const users = getUsers();
    const found = users.find((u) => u.username === username && u.password === password);
    if (found) {
      setUser(found);
      localStorage.setItem(SESSION_KEY, JSON.stringify(found));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isOperator: user?.role === 'operator',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
