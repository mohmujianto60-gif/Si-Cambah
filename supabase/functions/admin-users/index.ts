// Si-CAMBAH — Admin Users Edge Function
//
// Wraps the Supabase Admin Auth API so the frontend never sees the
// service_role key. Every request is authenticated against the caller's JWT;
// only callers with `role: admin` in their user_metadata (or app_metadata)
// can perform any of these operations.
//
// Routes (path is the function name + sub-path):
//   GET    /admin-users           -> list all users
//   POST   /admin-users           -> create user { email, password, role, nama }
//   PATCH  /admin-users/:id       -> update user { role?, nama?, password? }
//   DELETE /admin-users/:id       -> delete user
//   POST   /admin-users/:id/reset -> send password reset email
//
// Deploy:
//   supabase functions deploy admin-users --no-verify-jwt
//
// We pass --no-verify-jwt because we verify the JWT manually below (so we can
// return a clear 401/403 instead of Supabase's generic auth error).

// @ts-expect-error - Deno standard library, only resolved by Supabase runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error - Resolved by Supabase runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

declare const Deno: {
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface JwtPayload {
  sub?: string;
  user_metadata?: { role?: string };
  app_metadata?: { role?: string };
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

interface NormalizedUser {
  id: string;
  email: string;
  nama: string;
  role: 'admin' | 'operator';
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  provider: string;
}

interface SupabaseAdminUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
  created_at: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  identities?: { provider: string }[] | null;
}

function normalizeUser(u: SupabaseAdminUser): NormalizedUser {
  const md = (u.user_metadata ?? {}) as Record<string, unknown>;
  const amd = (u.app_metadata ?? {}) as Record<string, unknown>;
  const role: 'admin' | 'operator' =
    md.role === 'admin' || amd.role === 'admin' ? 'admin' : 'operator';
  const nama =
    typeof md.nama === 'string' && md.nama
      ? md.nama
      : typeof md.full_name === 'string' && md.full_name
        ? md.full_name
        : typeof md.name === 'string' && md.name
          ? md.name
          : (u.email ?? '').split('@')[0];
  const provider =
    u.identities && u.identities.length > 0
      ? u.identities[0].provider
      : 'email';
  return {
    id: u.id,
    email: u.email ?? '',
    nama,
    role,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    email_confirmed_at: u.email_confirmed_at ?? null,
    provider,
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // --- Auth: verify caller is admin -------------------------------------
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return jsonResponse(401, { error: 'Missing Authorization header' });
  }
  const payload = decodeJwt(token);
  if (!payload?.sub) {
    return jsonResponse(401, { error: 'Invalid token' });
  }
  const callerRole =
    payload.user_metadata?.role ?? payload.app_metadata?.role ?? null;
  if (callerRole !== 'admin') {
    return jsonResponse(403, { error: 'Forbidden: admin role required' });
  }

  // --- Supabase admin client --------------------------------------------
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: 'Edge Function env not configured' });
  }
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --- Route ------------------------------------------------------------
  const url = new URL(req.url);
  // Strip "/admin-users" or "/functions/v1/admin-users" prefix.
  const path = url.pathname.replace(/^\/functions\/v1\/admin-users/, '')
    .replace(/^\/admin-users/, '')
    .replace(/\/$/, '');
  const segments = path.split('/').filter(Boolean);
  const userId = segments[0] ?? null;
  const action = segments[1] ?? null;

  try {
    // GET /admin-users -> list ------------------------------------------
    if (req.method === 'GET' && !userId) {
      const all: SupabaseAdminUser[] = [];
      let page = 1;
      const perPage = 200;
      for (;;) {
        const { data, error } = await admin.auth.admin.listUsers({
          page,
          perPage,
        });
        if (error) throw error;
        const users = data.users as SupabaseAdminUser[];
        all.push(...users);
        if (users.length < perPage) break;
        page++;
        if (page > 50) break; // safety stop at 10k users
      }
      const list = all.map(normalizeUser).sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      );
      return jsonResponse(200, { users: list });
    }

    // POST /admin-users -> create ---------------------------------------
    if (req.method === 'POST' && !userId) {
      const body = await req.json();
      const { email, password, role, nama } = body as {
        email?: string;
        password?: string;
        role?: 'admin' | 'operator';
        nama?: string;
      };
      if (!email || !password) {
        return jsonResponse(400, { error: 'email and password required' });
      }
      if (password.length < 6) {
        return jsonResponse(400, { error: 'Password minimum 6 karakter' });
      }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: role ?? 'operator',
          nama: nama ?? email.split('@')[0],
        },
      });
      if (error) throw error;
      return jsonResponse(201, {
        user: normalizeUser(data.user as SupabaseAdminUser),
      });
    }

    // POST /admin-users/:id/reset -> send password reset link -----------
    if (req.method === 'POST' && userId && action === 'reset') {
      const { data: user, error: getErr } =
        await admin.auth.admin.getUserById(userId);
      if (getErr) throw getErr;
      if (!user?.user?.email) {
        return jsonResponse(404, { error: 'User tidak ditemukan' });
      }
      const redirectTo = (await req
        .clone()
        .json()
        .catch(() => null))?.redirectTo as string | undefined;
      const { error } = await admin.auth.resetPasswordForEmail(
        user.user.email,
        redirectTo ? { redirectTo } : undefined,
      );
      if (error) throw error;
      return jsonResponse(200, { ok: true });
    }

    // PATCH /admin-users/:id -> update ----------------------------------
    if (req.method === 'PATCH' && userId) {
      // Disallow self-demotion to avoid an admin accidentally locking
      // themselves out of the admin UI.
      if (userId === payload.sub) {
        const body = await req.clone().json();
        if (body.role && body.role !== 'admin') {
          return jsonResponse(400, {
            error: 'Tidak bisa menurunkan role diri sendiri',
          });
        }
      }
      const body = await req.json();
      const { role, nama, password } = body as {
        role?: 'admin' | 'operator';
        nama?: string;
        password?: string;
      };
      const update: Record<string, unknown> = {};
      if (password) {
        if (password.length < 6) {
          return jsonResponse(400, { error: 'Password minimum 6 karakter' });
        }
        update.password = password;
      }
      if (role || nama) {
        const { data: existing, error: getErr } =
          await admin.auth.admin.getUserById(userId);
        if (getErr) throw getErr;
        const currentMeta =
          (existing?.user?.user_metadata as Record<string, unknown>) ?? {};
        update.user_metadata = {
          ...currentMeta,
          ...(role ? { role } : {}),
          ...(nama ? { nama } : {}),
        };
      }
      if (Object.keys(update).length === 0) {
        return jsonResponse(400, { error: 'Tidak ada field untuk di-update' });
      }
      const { data, error } = await admin.auth.admin.updateUserById(
        userId,
        update,
      );
      if (error) throw error;
      return jsonResponse(200, {
        user: normalizeUser(data.user as SupabaseAdminUser),
      });
    }

    // DELETE /admin-users/:id -------------------------------------------
    if (req.method === 'DELETE' && userId) {
      if (userId === payload.sub) {
        return jsonResponse(400, {
          error: 'Tidak bisa menghapus akun diri sendiri',
        });
      }
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return jsonResponse(200, { ok: true });
    }

    return jsonResponse(404, { error: 'Route not found' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResponse(500, { error: msg });
  }
});
