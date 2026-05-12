# `admin-users` Edge Function

Wrapper around the Supabase Admin Auth API so the frontend can manage users
(list / create / update role / reset password / delete) without ever holding
the `service_role` key.

## Routes

| Method | Path                            | Body                                  | Returns          |
| ------ | ------------------------------- | ------------------------------------- | ---------------- |
| GET    | `/admin-users`                  | —                                     | `{ users: [] }`  |
| POST   | `/admin-users`                  | `{ email, password, role, nama }`     | `{ user }`       |
| PATCH  | `/admin-users/:id`              | `{ role?, nama?, password? }`         | `{ user }`       |
| DELETE | `/admin-users/:id`              | —                                     | `{ ok: true }`   |
| POST   | `/admin-users/:id/reset`        | `{ redirectTo? }`                     | `{ ok: true }`   |

Every request must include `Authorization: Bearer <user_access_token>`. The
function decodes the JWT and refuses any caller whose `user_metadata.role`
(or `app_metadata.role`) is not `admin`.

## Deploy

### Option A — Supabase CLI (recommended)

```bash
# Install once (https://supabase.com/docs/guides/cli)
npm install -g supabase

# Link to your project (one-time)
supabase login
supabase link --project-ref <your-project-ref>

# Deploy the function (run from repo root)
supabase functions deploy admin-users --no-verify-jwt
```

`--no-verify-jwt` is required because we verify the JWT manually inside the
function so we can return clean 401/403 errors.

### Option B — Supabase Dashboard

1. **Edge Functions → Deploy a new function**
2. Name: `admin-users`
3. Paste the contents of `index.ts` into the editor
4. Toggle **"Verify JWT with legacy secret"** to **OFF**
5. Click **Deploy**

## Environment variables

The function uses two env vars that Supabase auto-injects:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

You do not need to set these manually.

## Local development

```bash
supabase functions serve admin-users --no-verify-jwt
```

Then point your frontend at `http://localhost:54321/functions/v1/admin-users`.
