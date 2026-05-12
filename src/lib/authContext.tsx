import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import type { User, UserRole } from '../types/hibah';
import { AuthContext, type AuthStatus } from './useAuth';

function deriveRole(supaUser: SupabaseUser | null): UserRole {
  if (!supaUser) return 'operator';
  const meta = (supaUser.user_metadata || {}) as Record<string, unknown>;
  const appMeta = (supaUser.app_metadata || {}) as Record<string, unknown>;
  const candidate = (appMeta.role ?? meta.role ?? '').toString().toLowerCase();
  return candidate === 'admin' ? 'admin' : 'operator';
}

function deriveNama(supaUser: SupabaseUser): string {
  const meta = (supaUser.user_metadata || {}) as Record<string, unknown>;
  return (
    (meta.nama as string | undefined) ||
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    supaUser.email ||
    'Pengguna'
  );
}

function deriveAvatar(supaUser: SupabaseUser): string | null {
  const meta = (supaUser.user_metadata || {}) as Record<string, unknown>;
  return (meta.avatar_url as string | undefined) || (meta.picture as string | undefined) || null;
}

function toAppUser(session: Session | null): User | null {
  if (!session?.user) return null;
  const supaUser = session.user;
  return {
    id: supaUser.id,
    email: supaUser.email || '',
    nama: deriveNama(supaUser),
    role: deriveRole(supaUser),
    avatar_url: deriveAvatar(supaUser),
    created_at: supaUser.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const supabase = getSupabase();
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        const u = toAppUser(data.session);
        setUser(u);
        setStatus(u ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setStatus('unauthenticated');
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = toAppUser(session);
      setUser(u);
      setStatus(u ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAdmin: user?.role === 'admin',
      isOperator: user?.role === 'operator',
      signInWithPassword: async (email: string, password: string) => {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signInWithGoogle: async () => {
        const { error } = await getSupabase().auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + window.location.pathname,
          },
        });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        await getSupabase().auth.signOut();
      },
      resetPasswordForEmail: async (email: string) => {
        const redirectTo =
          window.location.origin + window.location.pathname + '#/reset-password';
        const { error } = await getSupabase().auth.resetPasswordForEmail(email, { redirectTo });
        return { error: error?.message ?? null };
      },
      updatePassword: async (newPassword: string) => {
        const { error } = await getSupabase().auth.updateUser({ password: newPassword });
        return { error: error?.message ?? null };
      },
    }),
    [user, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
