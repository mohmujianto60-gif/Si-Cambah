// Si-CAMBAH — frontend client for the `admin-users` Supabase Edge Function.
//
// Uses `supabase.functions.invoke()` which automatically attaches the
// caller's access token. The Edge Function rejects any non-admin caller
// with 403, so this module assumes pages calling it have already checked
// `isAdmin` from useAuth().

import { getSupabase } from './supabase';

export type UserRole = 'admin' | 'operator';

export interface ManagedUser {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  provider: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  nama: string;
}

export interface UpdateUserInput {
  role?: UserRole;
  nama?: string;
  password?: string;
}

interface FunctionError {
  error: string;
}

function isErrorPayload(value: unknown): value is FunctionError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as { error: unknown }).error === 'string'
  );
}

async function invoke<T>(
  path: string,
  init: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
  } = { method: 'GET' },
): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke<T>(
    `admin-users${path}`,
    {
      method: init.method,
      body: init.body,
    },
  );
  if (error) {
    // Supabase wraps the JSON body inside `error.context` (Response object).
    // We try to extract the {error: "..."} payload for a friendlier message.
    let detail = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        const payload = await ctx.json();
        if (isErrorPayload(payload)) detail = payload.error;
      }
    } catch {
      /* keep generic message */
    }
    throw new Error(detail);
  }
  if (isErrorPayload(data)) {
    throw new Error(data.error);
  }
  return data as T;
}

export async function listUsers(): Promise<ManagedUser[]> {
  const data = await invoke<{ users: ManagedUser[] }>('', { method: 'GET' });
  return data.users;
}

export async function createUser(input: CreateUserInput): Promise<ManagedUser> {
  const data = await invoke<{ user: ManagedUser }>('', {
    method: 'POST',
    body: { ...input },
  });
  return data.user;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<ManagedUser> {
  const data = await invoke<{ user: ManagedUser }>(`/${id}`, {
    method: 'PATCH',
    body: { ...input },
  });
  return data.user;
}

export async function deleteUser(id: string): Promise<void> {
  await invoke<{ ok: true }>(`/${id}`, { method: 'DELETE' });
}

export async function sendPasswordResetEmail(
  id: string,
  redirectTo?: string,
): Promise<void> {
  await invoke<{ ok: true }>(`/${id}/reset`, {
    method: 'POST',
    body: redirectTo ? { redirectTo } : {},
  });
}
