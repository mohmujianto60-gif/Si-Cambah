import { useState, type ReactNode } from 'react';
import type { User } from '../types/hibah';
import { AuthContext } from './useAuth';

const USERS_KEY = 'sicambah_users';
const SESSION_KEY = 'sicambah_session';

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

function readStoredSession(): User | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredSession());

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
