import type { Hibah, KategoriHibah, Legalitas, DuplicateWarning, BansosMasyarakat, LembagaReguler, HibahKelompok } from '../types/hibah';

const HIBAH_KEY = 'sicambah_hibah';
const LEGALITAS_KEY = 'sicambah_legalitas';
export const DATA_CHANGE_EVENT = 'sicambah:data-change';

function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DATA_CHANGE_EVENT));
  }
}

function generateId(): string {
  return crypto.randomUUID();
}

function getAllHibah(): Hibah[] {
  const data = localStorage.getItem(HIBAH_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAllHibah(data: Hibah[]): void {
  localStorage.setItem(HIBAH_KEY, JSON.stringify(data));
  notifyChange();
}

export function getHibahList(kategori?: KategoriHibah, tahun?: number, search?: string): Hibah[] {
  let list = getAllHibah();
  if (kategori) list = list.filter((h) => h.kategori === kategori);
  if (tahun) list = list.filter((h) => h.tahun === tahun);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((h) => {
      const searchable = JSON.stringify(h).toLowerCase();
      return searchable.includes(q);
    });
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function checkDuplicates(newData: Partial<Hibah>): DuplicateWarning[] {
  const all = getAllHibah();
  const warnings: DuplicateWarning[] = [];

  if (newData.kategori === 'bansos_masyarakat') {
    const d = newData as Partial<BansosMasyarakat>;
    if (d.nik) {
      const dup = all.find(
        (h) => h.kategori === 'bansos_masyarakat' && (h as BansosMasyarakat).nik === d.nik && h.id !== d.id
      );
      if (dup) {
        warnings.push({
          type: 'nik',
          message: `NIK ${d.nik} sudah terdaftar sebagai penerima bansos atas nama "${(dup as BansosMasyarakat).nama}"`,
          existingData: dup,
        });
      }
    }
  }

  if (newData.kategori === 'lembaga_reguler') {
    const d = newData as Partial<LembagaReguler>;
    if (d.nama_lembaga && d.alamat) {
      const dup = all.find(
        (h) =>
          h.kategori === 'lembaga_reguler' &&
          (h as LembagaReguler).nama_lembaga.toLowerCase() === d.nama_lembaga!.toLowerCase() &&
          (h as LembagaReguler).alamat.toLowerCase() === d.alamat!.toLowerCase() &&
          h.id !== d.id
      );
      if (dup) {
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
      const dup = all.find(
        (h) =>
          h.kategori === 'hibah_kelompok' &&
          (h as HibahKelompok).nama_kelompok.toLowerCase() === d.nama_kelompok!.toLowerCase() &&
          (h as HibahKelompok).alamat.toLowerCase() === d.alamat!.toLowerCase() &&
          (h as HibahKelompok).kategori_kelompok === d.kategori_kelompok &&
          h.id !== d.id
      );
      if (dup) {
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

export function createHibah(input: Omit<Hibah, 'id' | 'created_at' | 'updated_at'>): Hibah {
  const now = new Date().toISOString();
  const newHibah = {
    ...input,
    id: generateId(),
    created_at: now,
    updated_at: now,
  } as Hibah;
  const list = getAllHibah();
  list.push(newHibah);
  saveAllHibah(list);
  return newHibah;
}

export function updateHibah(id: string, input: Partial<Hibah>): Hibah {
  const list = getAllHibah();
  const index = list.findIndex((h) => h.id === id);
  if (index === -1) throw new Error('Data tidak ditemukan');
  list[index] = { ...list[index], ...input, updated_at: new Date().toISOString() } as Hibah;
  saveAllHibah(list);
  return list[index];
}

export function deleteHibah(id: string): void {
  const list = getAllHibah().filter((h) => h.id !== id);
  saveAllHibah(list);
}

export function confirmHibah(id: string): Hibah {
  return updateHibah(id, { status: 'confirmed' });
}

export function revertHibah(id: string): Hibah {
  return updateHibah(id, { status: 'draft' });
}

export function importHibah(items: Omit<Hibah, 'id' | 'created_at' | 'updated_at'>[]): { imported: number; duplicates: number } {
  let imported = 0;
  let duplicates = 0;
  for (const item of items) {
    const dups = checkDuplicates(item as Partial<Hibah>);
    if (dups.length > 0) {
      duplicates++;
    }
    createHibah(item);
    imported++;
  }
  return { imported, duplicates };
}

export function getStats(): {
  byKategori: Record<string, number>;
  byTahun: Record<number, number>;
  byKategoriTahun: Record<string, Record<number, number>>;
  total: number;
} {
  const all = getAllHibah();
  const byKategori: Record<string, number> = {};
  const byTahun: Record<number, number> = {};
  const byKategoriTahun: Record<string, Record<number, number>> = {};

  for (const h of all) {
    byKategori[h.kategori] = (byKategori[h.kategori] || 0) + 1;
    byTahun[h.tahun] = (byTahun[h.tahun] || 0) + 1;
    if (!byKategoriTahun[h.kategori]) byKategoriTahun[h.kategori] = {};
    byKategoriTahun[h.kategori][h.tahun] = (byKategoriTahun[h.kategori][h.tahun] || 0) + 1;
  }

  return { byKategori, byTahun, byKategoriTahun, total: all.length };
}

export function getAvailableYears(): number[] {
  const all = getAllHibah();
  const years = [...new Set(all.map((h) => h.tahun))];
  return years.sort((a, b) => b - a);
}

// Legalitas
function getAllLegalitas(): Legalitas[] {
  const data = localStorage.getItem(LEGALITAS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAllLegalitas(data: Legalitas[]): void {
  localStorage.setItem(LEGALITAS_KEY, JSON.stringify(data));
  notifyChange();
}

export function getLegalitasList(search?: string): Legalitas[] {
  let list = getAllLegalitas();
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (l) =>
        l.nomor_sk.toLowerCase().includes(q) ||
        l.judul.toLowerCase().includes(q) ||
        l.keterangan.toLowerCase().includes(q)
    );
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function createLegalitas(input: Omit<Legalitas, 'id' | 'created_at' | 'updated_at'>): Legalitas {
  const now = new Date().toISOString();
  const item: Legalitas = { ...input, id: generateId(), created_at: now, updated_at: now };
  const list = getAllLegalitas();
  list.push(item);
  saveAllLegalitas(list);
  return item;
}

export function updateLegalitas(id: string, input: Partial<Legalitas>): Legalitas {
  const list = getAllLegalitas();
  const idx = list.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error('Data tidak ditemukan');
  list[idx] = { ...list[idx], ...input, updated_at: new Date().toISOString() };
  saveAllLegalitas(list);
  return list[idx];
}

export function deleteLegalitas(id: string): void {
  const list = getAllLegalitas().filter((l) => l.id !== id);
  saveAllLegalitas(list);
}
