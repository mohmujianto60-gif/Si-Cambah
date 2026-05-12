import { useCallback, useState } from 'react';
import {
  UserCog,
  Plus,
  Search,
  Edit3,
  Trash2,
  KeyRound,
  ShieldCheck,
  UserCircle2,
  Save,
  AlertTriangle,
  Mail,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { useAsyncData } from '../lib/useAsyncData';
import { useAuth } from '../lib/useAuth';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  sendPasswordResetEmail,
  type ManagedUser,
  type UserRole,
} from '../lib/userManagementService';

interface CreateForm {
  email: string;
  password: string;
  nama: string;
  role: UserRole;
}

interface EditForm {
  nama: string;
  role: UserRole;
  password: string;
}

const emptyCreate: CreateForm = {
  email: '',
  password: '',
  nama: '',
  role: 'operator',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function ManajemenUser() {
  const { user: currentUser, isAdmin } = useAuth();
  const fetcher = useCallback(() => listUsers(), []);
  const { data, loading, error, refresh } = useAsyncData<ManagedUser[]>(
    fetcher,
    [],
    { errorPrefix: 'Gagal memuat user', listenToChanges: false },
  );

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate);
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    nama: '',
    role: 'operator',
    password: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [confirmReset, setConfirmReset] = useState<ManagedUser | null>(null);
  const [resetting, setResetting] = useState(false);

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm p-8 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800">Akses Ditolak</h2>
          <p className="text-sm text-gray-500 mt-2">
            Halaman Manajemen User hanya bisa diakses oleh admin.
          </p>
        </div>
      </div>
    );
  }

  const filtered = data.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.nama.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    if (!createForm.email.trim() || !createForm.password) {
      toast.error('Email & password wajib diisi');
      return;
    }
    setCreating(true);
    try {
      await createUser({
        email: createForm.email.trim(),
        password: createForm.password,
        nama: createForm.nama.trim() || createForm.email.split('@')[0],
        role: createForm.role,
      });
      toast.success(`User ${createForm.email} berhasil ditambahkan`);
      setShowCreate(false);
      setCreateForm(emptyCreate);
      refresh();
    } catch (err) {
      toast.error('Gagal menambah user: ' + (err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (u: ManagedUser) => {
    setEditingUser(u);
    setEditForm({ nama: u.nama, role: u.role, password: '' });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || savingEdit) return;
    setSavingEdit(true);
    try {
      const payload: { nama?: string; role?: UserRole; password?: string } = {};
      if (editForm.nama !== editingUser.nama) payload.nama = editForm.nama;
      if (editForm.role !== editingUser.role) payload.role = editForm.role;
      if (editForm.password) payload.password = editForm.password;
      if (Object.keys(payload).length === 0) {
        toast('Tidak ada perubahan');
        setEditingUser(null);
        return;
      }
      await updateUser(editingUser.id, payload);
      toast.success('User berhasil diperbarui');
      setEditingUser(null);
      refresh();
    } catch (err) {
      toast.error('Gagal update: ' + (err as Error).message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteUser(confirmDelete.id);
      toast.success(`User ${confirmDelete.email} dihapus`);
      setConfirmDelete(null);
      refresh();
    } catch (err) {
      toast.error('Gagal menghapus: ' + (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirmReset || resetting) return;
    setResetting(true);
    try {
      const redirectTo = `${window.location.origin}${window.location.pathname}#/reset-password`;
      await sendPasswordResetEmail(confirmReset.id, redirectTo);
      toast.success(`Link reset password dikirim ke ${confirmReset.email}`);
      setConfirmReset(null);
    } catch (err) {
      toast.error('Gagal kirim email: ' + (err as Error).message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-page-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">
            Manajemen User
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Kelola akun & role pengguna Si-CAMBAH
          </p>
        </div>
        <button
          onClick={() => {
            setCreateForm(emptyCreate);
            setShowCreate(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-sm font-medium shadow-sm shadow-cyan-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari berdasarkan nama, email, atau role..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all shadow-sm"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-semibold">Gagal memuat daftar user</p>
            <p className="mt-1 text-red-700">{error}</p>
            <p className="mt-2 text-xs text-red-600">
              Pastikan Edge Function <code>admin-users</code> sudah di-deploy di
              Supabase. Lihat <code>supabase/functions/admin-users/README.md</code>.
            </p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {search
                ? `Tidak ada user yang cocok dengan "${search}"`
                : 'Belum ada user — klik "Tambah User" untuk mulai'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <div
                  key={u.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        u.role === 'admin'
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                          : 'bg-gradient-to-br from-cyan-400 to-teal-500 text-white'
                      }`}
                    >
                      {u.role === 'admin' ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <UserCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 truncate">
                          {u.nama}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                            Anda
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-cyan-100 text-cyan-700'
                          }`}
                        >
                          {u.role}
                        </span>
                        {u.provider !== 'email' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded font-medium">
                            {u.provider}
                          </span>
                        )}
                        {!u.email_confirmed_at && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-medium">
                            belum verifikasi
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {u.email}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Login:{' '}
                          {formatDate(u.last_sign_in_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setConfirmReset(u)}
                      title="Kirim link reset password"
                      className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startEdit(u)}
                      title="Edit user"
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(u)}
                      disabled={isSelf}
                      title={
                        isSelf
                          ? 'Tidak bisa hapus akun sendiri'
                          : 'Hapus user'
                      }
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tambah User Baru"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={createForm.nama}
              onChange={(e) =>
                setCreateForm({ ...createForm, nama: e.target.value })
              }
              placeholder="Nama lengkap user"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={6}
              value={createForm.password}
              onChange={(e) =>
                setCreateForm({ ...createForm, password: e.target.value })
              }
              placeholder="Minimum 6 karakter"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Password akan ditampilkan saat ini. User bisa ubah sendiri setelah login.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['operator', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCreateForm({ ...createForm, role: r })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    createForm.role === r
                      ? r === 'admin'
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-cyan-50 border-cyan-300 text-cyan-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {r === 'admin' ? 'Admin (akses penuh)' : 'Operator (terbatas)'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm"
            >
              {creating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit User: ${editingUser?.email ?? ''}`}
      >
        {editingUser && (
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nama
              </label>
              <input
                type="text"
                value={editForm.nama}
                onChange={(e) =>
                  setEditForm({ ...editForm, nama: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['operator', 'admin'] as UserRole[]).map((r) => {
                  const disabled =
                    editingUser.id === currentUser?.id && r !== 'admin';
                  return (
                    <button
                      key={r}
                      type="button"
                      disabled={disabled}
                      onClick={() => setEditForm({ ...editForm, role: r })}
                      title={
                        disabled
                          ? 'Tidak bisa menurunkan role diri sendiri'
                          : undefined
                      }
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        editForm.role === r
                          ? r === 'admin'
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-cyan-50 border-cyan-300 text-cyan-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {r === 'admin'
                        ? 'Admin (akses penuh)'
                        : 'Operator (terbatas)'}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password Baru{' '}
                <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm({ ...editForm, password: e.target.value })
                }
                placeholder="Kosongkan untuk tidak ubah password"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Atau pakai tombol kunci untuk kirim link reset ke email user.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm"
              >
                {savingEdit ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Hapus User"
        maxWidth="max-w-md"
      >
        {confirmDelete && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">
                User <strong>{confirmDelete.email}</strong> akan dihapus
                permanen dari Supabase Auth. Data hibah yang dia buat tetap
                ada, tapi <code>created_by</code>-nya jadi <code>null</code>.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm"
              >
                {deleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Ya, Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset password confirm */}
      <Modal
        isOpen={!!confirmReset}
        onClose={() => setConfirmReset(null)}
        title="Kirim Link Reset Password"
        maxWidth="max-w-md"
      >
        {confirmReset && (
          <div className="space-y-4">
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <p className="text-xs text-cyan-800">
                Link reset password akan dikirim ke{' '}
                <strong>{confirmReset.email}</strong>. User bisa klik link itu
                untuk set password baru tanpa kamu tahu password lamanya.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmReset(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm"
              >
                {resetting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Kirim Email
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
