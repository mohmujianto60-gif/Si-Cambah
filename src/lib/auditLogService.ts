// Si-CAMBAH audit log service.
//
// audit_log is admin-only-readable via RLS. Operator queries will return [].
// Writes are blocked entirely (only the SECURITY DEFINER trigger can insert);
// this module is read-only.

import { getSupabase } from './supabase';

export type AuditAction =
  | 'insert'
  | 'update'
  | 'delete'
  | 'confirm'
  | 'revert';

export type AuditTable = 'hibah' | 'legalitas';

export interface AuditLogEntry {
  id: number;
  table_name: AuditTable;
  record_id: string;
  action: AuditAction;
  actor_id: string | null;
  actor_email: string | null;
  actor_nama: string | null;
  actor_role: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_at: string;
}

export interface AuditLogFilter {
  table?: AuditTable | null;
  action?: AuditAction | null;
  actorEmail?: string | null;
  recordId?: string | null;
  /** ISO timestamp inclusive */
  startDate?: string | null;
  /** ISO timestamp inclusive */
  endDate?: string | null;
  /** Page size (default 50) */
  limit?: number;
  /** Offset for pagination (default 0) */
  offset?: number;
}

export interface AuditLogPage {
  entries: AuditLogEntry[];
  /** Total count matching the filter (across all pages) */
  total: number;
}

/**
 * Fetch a page of audit log entries.
 *
 * Returns both the entries for the current page AND the total count
 * (so the UI can render pagination controls).
 */
export async function listAuditLog(
  filter: AuditLogFilter = {},
): Promise<AuditLogPage> {
  const sb = getSupabase();
  const {
    table,
    action,
    actorEmail,
    recordId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filter;

  let q = sb
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('changed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (table) q = q.eq('table_name', table);
  if (action) q = q.eq('action', action);
  if (actorEmail) q = q.ilike('actor_email', `%${actorEmail}%`);
  if (recordId) q = q.eq('record_id', recordId);
  if (startDate) q = q.gte('changed_at', startDate);
  if (endDate) q = q.lte('changed_at', endDate);

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);

  return {
    entries: (data ?? []) as AuditLogEntry[],
    total: count ?? 0,
  };
}

/**
 * Fetch the full audit history for a single record (no pagination).
 * Useful for a "history" drawer next to a row in a data table.
 */
export async function listRecordHistory(
  table: AuditTable,
  recordId: string,
): Promise<AuditLogEntry[]> {
  const { entries } = await listAuditLog({
    table,
    recordId,
    limit: 200,
  });
  return entries;
}

// ---------------------------------------------------------------------------
// Diff helpers (used by the UI to render a compact list of changed fields)
// ---------------------------------------------------------------------------

/** Keys we always hide from the diff (noise / always change). */
const HIDDEN_KEYS = new Set(['updated_at', 'created_at']);

export interface FieldDiff {
  key: string;
  before: unknown;
  after: unknown;
}

export function computeDiff(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
): FieldDiff[] {
  const before = oldData ?? {};
  const after = newData ?? {};
  const keys = new Set<string>([
    ...Object.keys(before),
    ...Object.keys(after),
  ]);
  const diffs: FieldDiff[] = [];
  for (const key of keys) {
    if (HIDDEN_KEYS.has(key)) continue;
    const b = before[key];
    const a = after[key];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      diffs.push({ key, before: b, after: a });
    }
  }
  return diffs.sort((a, b) => a.key.localeCompare(b.key));
}

/** Pretty-print a value for the audit UI. */
export function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v || '—';
  if (typeof v === 'number') return v.toString();
  if (typeof v === 'boolean') return v ? 'Ya' : 'Tidak';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}
