// One-shot helper for users who already have data in localStorage from
// pre-PR3 versions of Si-CAMBAH. After importing, the localStorage keys are
// renamed (not deleted) so the data can be recovered if migration fails.

import {
  createHibah,
  createLegalitas,
  type CreateHibahInput,
  type CreateLegalitasInput,
} from './hibahService';
import type { Hibah, Legalitas } from '../types/hibah';

const HIBAH_KEY = 'sicambah_hibah';
const LEGALITAS_KEY = 'sicambah_legalitas';
const HIBAH_ARCHIVE_KEY = 'sicambah_hibah_archived';
const LEGALITAS_ARCHIVE_KEY = 'sicambah_legalitas_archived';

export interface MigrationStatus {
  hibahCount: number;
  legalitasCount: number;
  alreadyArchived: boolean;
}

export function getLocalDataStatus(): MigrationStatus {
  let hibahCount = 0;
  let legalitasCount = 0;
  try {
    const hibahRaw = localStorage.getItem(HIBAH_KEY);
    if (hibahRaw) hibahCount = (JSON.parse(hibahRaw) as Hibah[]).length;
  } catch {
    // ignore
  }
  try {
    const legalitasRaw = localStorage.getItem(LEGALITAS_KEY);
    if (legalitasRaw) legalitasCount = (JSON.parse(legalitasRaw) as Legalitas[]).length;
  } catch {
    // ignore
  }
  const alreadyArchived =
    Boolean(localStorage.getItem(HIBAH_ARCHIVE_KEY)) ||
    Boolean(localStorage.getItem(LEGALITAS_ARCHIVE_KEY));
  return { hibahCount, legalitasCount, alreadyArchived };
}

export interface MigrationResult {
  hibahImported: number;
  hibahFailed: number;
  legalitasImported: number;
  legalitasFailed: number;
  errors: string[];
}

export async function migrateLocalStorage(
  onProgress?: (done: number, total: number) => void,
): Promise<MigrationResult> {
  const result: MigrationResult = {
    hibahImported: 0,
    hibahFailed: 0,
    legalitasImported: 0,
    legalitasFailed: 0,
    errors: [],
  };

  let hibahList: Hibah[] = [];
  let legalitasList: Legalitas[] = [];

  try {
    const raw = localStorage.getItem(HIBAH_KEY);
    if (raw) hibahList = JSON.parse(raw) as Hibah[];
  } catch (e) {
    result.errors.push('Gagal parse data hibah lokal: ' + (e as Error).message);
  }
  try {
    const raw = localStorage.getItem(LEGALITAS_KEY);
    if (raw) legalitasList = JSON.parse(raw) as Legalitas[];
  } catch (e) {
    result.errors.push('Gagal parse data legalitas lokal: ' + (e as Error).message);
  }

  const total = hibahList.length + legalitasList.length;
  let done = 0;

  for (const item of hibahList) {
    try {
      // Strip server-managed fields so the service can re-generate them.
      const {
        id: _id,
        created_at: _ca,
        updated_at: _ua,
        created_by: _cb,
        ...rest
      } = item;
      void _id;
      void _ca;
      void _ua;
      void _cb;
      await createHibah(rest as CreateHibahInput);
      result.hibahImported++;
    } catch (e) {
      result.hibahFailed++;
      result.errors.push(`Hibah "${(item as { id?: string }).id ?? '(no id)'}": ${(e as Error).message}`);
    }
    done++;
    onProgress?.(done, total);
  }

  for (const item of legalitasList) {
    try {
      const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = item;
      void _id;
      void _ca;
      void _ua;
      await createLegalitas(rest as CreateLegalitasInput);
      result.legalitasImported++;
    } catch (e) {
      result.legalitasFailed++;
      result.errors.push(`Legalitas "${item.nomor_sk}": ${(e as Error).message}`);
    }
    done++;
    onProgress?.(done, total);
  }

  // Archive the original data so it's not lost, but stop the migration prompt
  // from appearing again on next load.
  if (hibahList.length > 0) {
    localStorage.setItem(HIBAH_ARCHIVE_KEY, localStorage.getItem(HIBAH_KEY) ?? '');
    localStorage.removeItem(HIBAH_KEY);
  }
  if (legalitasList.length > 0) {
    localStorage.setItem(
      LEGALITAS_ARCHIVE_KEY,
      localStorage.getItem(LEGALITAS_KEY) ?? '',
    );
    localStorage.removeItem(LEGALITAS_KEY);
  }

  return result;
}
