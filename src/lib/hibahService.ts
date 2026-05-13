// Si-CAMBAH data service — backed by Supabase (single `hibah` table + JSONB
// `details` column for category-specific fields). Legalitas lives in its own
// table.
//
// `DATA_CHANGE_EVENT` is dispatched after every successful mutation so any
// listener (Dashboard, page lists) can re-fetch.

import { getSupabase } from './supabase';
import type {
  Hibah,
  KategoriHibah,
  Legalitas,
  DuplicateWarning,
  BansosMasyarakat,
  LembagaReguler,
  HibahKelompok,
} from '../types/hibah';

export const DATA_CHANGE_EVENT = 'sicambah:data-change';

function notifyChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DATA_CHANGE_EVENT));
  }
}

// ---------------------------------------------------------------------------
// DB row shapes
// ---------------------------------------------------------------------------

interface HibahRow {
  id: string;
  kategori: KategoriHibah;
  tahun: number;
  keterangan: string;
  status: 'draft' | 'confirmed';
  details: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface LegalitasRow {
  id: string;
  nomor_sk: string;
  judul: string;
  tanggal: string | null;
  link_gdrive: string;
  keterangan: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const BASE_HIBAH_KEYS = new Set([
  'id',
  'kategori',
  'tahun',
  'keterangan',
  'status',
  'created_by',
  'created_at',
  'updated_at',
]);

function flattenHibah(row: HibahRow): Hibah {
  return {
    id: row.id,
    kategori: row.kategori,
    tahun: row.tahun,
    keterangan: row.keterangan,
    status: row.status,
    created_by: row.created_by ?? '',
    created_at: row.created_at,
    updated_at: row.updated_at,
    ...(row.details ?? {}),
  } as Hibah;
}

function splitDetails(input: Partial<Hibah>): {
  base: Partial<HibahRow>;
  details: Record<string, unknown>;
  hasDetails: boolean;
} {
  const base: Partial<HibahRow> = {};
  const details: Record<string, unknown> = {};
  let hasDetails = false;
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (BASE_HIBAH_KEYS.has(key)) {
      (base as Record<string, unknown>)[key] = value;
    } else {
      details[key] = value;
      hasDetails = true;
    }
  }
  return { base, details, hasDetails };
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  return user?.id ?? null;
}

// ---------------------------------------------------------------------------
// Hibah CRUD
// ---------------------------------------------------------------------------

export async function getHibahList(
  kategori?: KategoriHibah,
  tahun?: number,
  search?: string,
): Promise<Hibah[]> {
  let query = getSupabase()
    .from('hibah')
    .select('*')
    .order('created_at', { ascending: false });
  if (kategori) query = query.eq('kategori', kategori);
  if (tahun) query = query.eq('tahun', tahun);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let list = (data as HibahRow[]).map(flattenHibah);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((h) => JSON.stringify(h).toLowerCase().includes(q));
  }
  return list;
}

export async function getHibahById(id: string): Promise<Hibah | null> {
  const { data, error } = await getSupabase()
    .from('hibah')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? flattenHibah(data as HibahRow) : null;
}

export async function checkDuplicates(
  newData: Partial<Hibah>,
): Promise<DuplicateWarning[]> {
  const supabase = getSupabase();
  const warnings: DuplicateWarning[] = [];
  const ignoreId = newData.id ?? '00000000-0000-0000-0000-000000000000';

  if (newData.kategori === 'bansos_masyarakat') {
    const d = newData as Partial<BansosMasyarakat>;
    if (d.nik) {
      const { data } = await supabase
        .from('hibah')
        .select('*')
        .eq('kategori', 'bansos_masyarakat')
        .eq('details->>nik', d.nik)
        .neq('id', ignoreId)
        .limit(1);
      if (data && data.length > 0) {
        const dup = flattenHibah(data[0] as HibahRow) as BansosMasyarakat;
        warnings.push({
          type: 'nik',
          message: `NIK ${d.nik} sudah terdaftar sebagai penerima bansos atas nama "${dup.nama}"`,
          existingData: dup,
        });
      }
    }
  }

  if (newData.kategori === 'lembaga_reguler') {
    const d = newData as Partial<LembagaReguler>;
    if (d.nama_lembaga && d.alamat) {
      const { data } = await supabase
        .from('hibah')
        .select('*')
        .eq('kategori', 'lembaga_reguler')
        .ilike('details->>nama_lembaga', d.nama_lembaga)
        .ilike('details->>alamat', d.alamat)
        .neq('id', ignoreId)
        .limit(1);
      if (data && data.length > 0) {
        const dup = flattenHibah(data[0] as HibahRow) as LembagaReguler;
        warnings.push({
          type: 'nama_alamat',
          message: `Lembaga "${d.nama_lembaga}" di "${d.alamat}" sudah pernah menerima hibah (tahun ${dup.tahun})`,
          existingData: dup,
        });
      }
    }
  }

  if (newData.kategori === 'hibah_kelompok') {
    const d = newData as Partial<HibahKelompok>;
    if (d.nama_kelompok && d.alamat && d.kategori_kelompok) {
      const { data } = await supabase
        .from('hibah')
        .select('*')
        .eq('kategori', 'hibah_kelompok')
        .ilike('details->>nama_kelompok', d.nama_kelompok)
        .ilike('details->>alamat', d.alamat)
        .eq('details->>kategori_kelompok', d.kategori_kelompok)
        .neq('id', ignoreId)
        .limit(1);
      if (data && data.length > 0) {
        const dup = flattenHibah(data[0] as HibahRow) as HibahKelompok;
        warnings.push({
          type: 'kelompok',
          message: `Kelompok "${d.nama_kelompok}" (${d.kategori_kelompok}) di "${d.alamat}" sudah pernah menerima hibah (tahun ${dup.tahun})`,
          existingData: dup,
        });
      }
    }
  }

  return warnings;
}

export type CreateHibahInput = Omit<
  Hibah,
  'id' | 'created_at' | 'updated_at' | 'created_by'
>;

export async function createHibah(
  input: CreateHibahInput,
): Promise<Hibah> {
  const { base, details } = splitDetails(input as Partial<Hibah>);
  const created_by = await getCurrentUserId();
  if (!created_by) {
    throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');
  }

  const { data, error } = await getSupabase()
    .from('hibah')
    .insert({
      kategori: base.kategori,
      tahun: base.tahun,
      keterangan: base.keterangan ?? '',
      status: base.status ?? 'draft',
      details,
      created_by,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  notifyChange();
  return flattenHibah(data as HibahRow);
}

export async function updateHibah(
  id: string,
  input: Partial<Hibah>,
): Promise<Hibah> {
  const { base, details: newDetails, hasDetails } = splitDetails(input);
  const update: Partial<HibahRow> = { ...base };
  delete (update as { id?: string }).id;
  delete (update as { created_at?: string }).created_at;
  delete (update as { updated_at?: string }).updated_at;
  delete (update as { created_by?: string | null }).created_by;

  if (hasDetails) {
    // Merge with existing details so partial updates don't clobber other keys.
    const { data: existing, error: fetchErr } = await getSupabase()
      .from('hibah')
      .select('details')
      .eq('id', id)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);
    update.details = {
      ...((existing as { details?: Record<string, unknown> } | null)?.details ?? {}),
      ...newDetails,
    };
  }

  const { data, error } = await getSupabase()
    .from('hibah')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  notifyChange();
  return flattenHibah(data as HibahRow);
}

export async function deleteHibah(id: string): Promise<void> {
  const { error } = await getSupabase().from('hibah').delete().eq('id', id);
  if (error) throw new Error(error.message);
  notifyChange();
}

export async function confirmHibah(id: string): Promise<Hibah> {
  return updateHibah(id, { status: 'confirmed' });
}

export async function revertHibah(id: string): Promise<Hibah> {
  return updateHibah(id, { status: 'draft' });
}

/**
 * Bulk delete multiple hibah rows by id. Returns the number of rows
 * actually deleted (may be less than ids.length if RLS hides some rows
 * from the current user).
 */
export async function bulkDeleteHibah(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const { data, error } = await getSupabase()
    .from('hibah')
    .delete()
    .in('id', ids)
    .select('id');
  if (error) throw new Error(error.message);
  notifyChange();
  return (data ?? []).length;
}

/**
 * Bulk update status for multiple hibah rows. Returns the number of
 * rows actually updated.
 */
export async function bulkUpdateStatus(
  ids: string[],
  status: 'draft' | 'confirmed',
): Promise<number> {
  if (ids.length === 0) return 0;
  const { data, error } = await getSupabase()
    .from('hibah')
    .update({ status })
    .in('id', ids)
    .select('id');
  if (error) throw new Error(error.message);
  notifyChange();
  return (data ?? []).length;
}

export async function importHibah(
  items: CreateHibahInput[],
): Promise<{ imported: number; duplicates: number }> {
  let imported = 0;
  let duplicates = 0;
  for (const item of items) {
    const dups = await checkDuplicates(item as Partial<Hibah>);
    if (dups.length > 0) duplicates++;
    await createHibah(item);
    imported++;
  }
  return { imported, duplicates };
}

// ---------------------------------------------------------------------------
// Stats / aggregations
// ---------------------------------------------------------------------------

export interface HibahStats {
  byKategori: Record<string, number>;
  byTahun: Record<number, number>;
  byKategoriTahun: Record<string, Record<number, number>>;
  total: number;
}

export async function getStats(): Promise<HibahStats> {
  const { data, error } = await getSupabase()
    .from('hibah')
    .select('kategori, tahun');
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Pick<HibahRow, 'kategori' | 'tahun'>[];
  const byKategori: Record<string, number> = {};
  const byTahun: Record<number, number> = {};
  const byKategoriTahun: Record<string, Record<number, number>> = {};

  for (const h of rows) {
    byKategori[h.kategori] = (byKategori[h.kategori] || 0) + 1;
    byTahun[h.tahun] = (byTahun[h.tahun] || 0) + 1;
    if (!byKategoriTahun[h.kategori]) byKategoriTahun[h.kategori] = {};
    byKategoriTahun[h.kategori][h.tahun] =
      (byKategoriTahun[h.kategori][h.tahun] || 0) + 1;
  }

  return { byKategori, byTahun, byKategoriTahun, total: rows.length };
}

export async function getAvailableYears(): Promise<number[]> {
  const { data, error } = await getSupabase()
    .from('hibah')
    .select('tahun');
  if (error) throw new Error(error.message);
  const years = [...new Set((data ?? []).map((r) => (r as { tahun: number }).tahun))];
  return years.sort((a, b) => b - a);
}

// ---------------------------------------------------------------------------
// Legalitas CRUD
// ---------------------------------------------------------------------------

function flattenLegalitas(row: LegalitasRow): Legalitas {
  return {
    id: row.id,
    nomor_sk: row.nomor_sk,
    judul: row.judul,
    tanggal: row.tanggal ?? '',
    link_gdrive: row.link_gdrive,
    keterangan: row.keterangan,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getLegalitasList(search?: string): Promise<Legalitas[]> {
  const { data, error } = await getSupabase()
    .from('legalitas')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  let list = (data as LegalitasRow[]).map(flattenLegalitas);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (l) =>
        l.nomor_sk.toLowerCase().includes(q) ||
        l.judul.toLowerCase().includes(q) ||
        l.keterangan.toLowerCase().includes(q),
    );
  }
  return list;
}

export type CreateLegalitasInput = Omit<
  Legalitas,
  'id' | 'created_at' | 'updated_at'
>;

export async function createLegalitas(
  input: CreateLegalitasInput,
): Promise<Legalitas> {
  const created_by = await getCurrentUserId();
  if (!created_by) {
    throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');
  }
  const { data, error } = await getSupabase()
    .from('legalitas')
    .insert({
      nomor_sk: input.nomor_sk,
      judul: input.judul,
      tanggal: input.tanggal || null,
      link_gdrive: input.link_gdrive ?? '',
      keterangan: input.keterangan ?? '',
      created_by,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  notifyChange();
  return flattenLegalitas(data as LegalitasRow);
}

export async function updateLegalitas(
  id: string,
  input: Partial<Legalitas>,
): Promise<Legalitas> {
  const update: Partial<LegalitasRow> = {};
  if (input.nomor_sk !== undefined) update.nomor_sk = input.nomor_sk;
  if (input.judul !== undefined) update.judul = input.judul;
  if (input.tanggal !== undefined) update.tanggal = input.tanggal || null;
  if (input.link_gdrive !== undefined) update.link_gdrive = input.link_gdrive;
  if (input.keterangan !== undefined) update.keterangan = input.keterangan;

  const { data, error } = await getSupabase()
    .from('legalitas')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  notifyChange();
  return flattenLegalitas(data as LegalitasRow);
}

export async function deleteLegalitas(id: string): Promise<void> {
  const { error } = await getSupabase().from('legalitas').delete().eq('id', id);
  if (error) throw new Error(error.message);
  notifyChange();
}
