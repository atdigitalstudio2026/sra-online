import React, { useState, useEffect } from 'react';
import { AdminUser, AdminRole, AdminAuditLog } from '../../types';
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  getCurrentAdminUser,
  hasPermission,
} from '../../services/adminUserService';
import { getAdminAuditLogs } from '../../services/auditLogService';
import { formatDateTime } from '../../utils/formatters';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../components/common/Toast';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Lock,
  Layers,
  Search,
  X,
  Loader2,
  Users,
} from 'lucide-react';

interface AdminUsersPageProps {
  onNavigate: (path: string) => void;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'audit_logs'>('users');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [currentActor, setCurrentActor] = useState<AdminUser>(getCurrentAdminUser());
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<AdminRole>('admin');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [users, logs] = await Promise.all([
        getAdminUsers(),
        getAdminAuditLogs({ limit: 100 }),
      ]);
      setAdminUsers(users);
      setAuditLogs(logs);
      setCurrentActor(getCurrentAdminUser());
    } catch (e) {
      console.error('Failed loading admin user data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormRole('admin');
    setFormIsActive(true);
    setUserModalOpen(true);
  };

  const handleOpenEditModal = (u: AdminUser) => {
    setEditingUserId(u.id);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormIsActive(u.is_active);
    setUserModalOpen(true);
  };

  const handleSubmitUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      error('Nama dan email wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUserId) {
        await updateAdminUser(
          editingUserId,
          {
            name: formName.trim(),
            role: formRole,
            is_active: formIsActive,
          },
          currentActor
        );
        success('Data admin berhasil diperbarui.');
      } else {
        await createAdminUser({
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
          actor: currentActor,
        });
        success('Admin baru berhasil ditambahkan.');
      }
      setUserModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Gagal menyimpan data pengguna admin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (u: AdminUser) => {
    try {
      await updateAdminUser(u.id, { is_active: !u.is_active }, currentActor);
      success(`Status akun ${u.name} berhasil ${!u.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`);
      loadData();
    } catch (err: any) {
      error(err.message || 'Gagal mengubah status akun.');
    }
  };

  const getRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="bg-purple-100 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>Super Admin</span>
          </span>
        );
      case 'admin':
        return (
          <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Admin Operasional</span>
          </span>
        );
      case 'staff':
        return (
          <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <span>Staff Gudang</span>
          </span>
        );
    }
  };

  const permissionsMatrix = [
    { code: 'products.view', name: 'Lihat Produk', desc: 'Melihat katalog & detail komoditas', super: true, admin: true, staff: true },
    { code: 'products.create', name: 'Tambah Produk', desc: 'Membuat produk baru di katalog', super: true, admin: true, staff: false },
    { code: 'products.update', name: 'Edit Produk', desc: 'Mengubah harga & stok produk', super: true, admin: true, staff: false },
    { code: 'products.delete', name: 'Hapus Produk', desc: 'Menonaktifkan produk komoditas', super: true, admin: false, staff: false },
    { code: 'orders.view', name: 'Lihat Pesanan', desc: 'Melihat daftar & rincian pesanan', super: true, admin: true, staff: true },
    { code: 'orders.update', name: 'Kelola Pesanan', desc: 'Update status pesanan & pengiriman', super: true, admin: true, staff: true },
    { code: 'customers.view', name: 'Lihat Pelanggan', desc: 'Melihat profil & data transaksi', super: true, admin: true, staff: true },
    { code: 'customers.export', name: 'Ekspor Pelanggan', desc: 'Mengunduh data pelanggan ke CSV', super: true, admin: true, staff: false },
    { code: 'inventory.view', name: 'Lihat Inventaris', desc: 'Memantau stok & batas minimum', super: true, admin: true, staff: true },
    { code: 'inventory.adjust', name: 'Penyesuaian Stok', desc: 'Mutasi & opname stok barang', super: true, admin: true, staff: false },
    { code: 'reports.view', name: 'Lihat Laporan', desc: 'Membuka laporan & analitik sales', super: true, admin: true, staff: false },
    { code: 'reports.export', name: 'Ekspor Laporan', desc: 'Unduh laporan ke CSV/Excel', super: true, admin: true, staff: false },
    { code: 'users.manage', name: 'Kelola Admin', desc: 'Menambah & mengatur hak akses admin', super: true, admin: false, staff: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Manajemen Pengguna &amp; Hak Akses (RBAC)</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Otorisasi berbasis peran (Super Admin, Admin, Staff), matriks izin, dan audit log keamanan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Admin Baru</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-stone-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-amber-800 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            Daftar Admin ({adminUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'permissions'
                ? 'bg-amber-800 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            Matriks Izin (Permissions)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit_logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'audit_logs'
                ? 'bg-amber-800 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            Audit Log Aktivitas ({auditLogs.length})
          </button>
        </div>

        {/* Tab 1: Users List (Section 40) */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center">
                <LoadingState message="Memuat daftar pengguna admin..." />
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Nama Pengguna</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Login Terakhir</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {adminUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        {u.name}
                        {u.id === currentActor.id && (
                          <span className="ml-2 text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                            (Anda)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-600">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {u.is_active ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500">
                        {u.last_login_at ? formatDateTime(u.last_login_at) : 'Belum login'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:text-stone-950 border border-stone-200 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        {u.id !== currentActor.id && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className={`px-2.5 py-1 text-[11px] font-semibold border rounded-lg transition-colors ${
                              u.is_active
                                ? 'text-rose-700 border-rose-200 hover:bg-rose-50'
                                : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Permission Matrix (Section 38 & 39) */}
        {activeTab === 'permissions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Kode Izin</th>
                  <th className="py-3 px-4">Nama Izin &amp; Cakupan</th>
                  <th className="py-3 px-4 text-center">Super Admin</th>
                  <th className="py-3 px-4 text-center">Admin</th>
                  <th className="py-3 px-4 text-center">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {permissionsMatrix.map((p) => (
                  <tr key={p.code} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {p.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{p.name}</div>
                      <div className="text-[11px] text-stone-500">{p.desc}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.super ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-stone-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.admin ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-stone-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.staff ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-stone-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Audit Logs (Section 41 & 42) */}
        {activeTab === 'audit_logs' && (
          <div className="overflow-x-auto">
            {auditLogs.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Petugas</th>
                    <th className="py-3 px-4">Aksi Audit</th>
                    <th className="py-3 px-4">Target Entitas</th>
                    <th className="py-3 px-4">Data Nilai Perubahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {log.actor_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[11px] bg-stone-100 px-2 py-0.5 rounded text-stone-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {log.entity_type} ({log.entity_id})
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-700 max-w-sm truncate">
                        {log.new_value ? JSON.stringify(log.new_value) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-stone-400">
                Belum ada aktivitas audit log yang tercatat.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Admin User (Section 40) */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs"
            onClick={() => !isSubmitting && setUserModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-stone-800" />
                <h3 className="font-bold text-stone-900 text-sm">
                  {editingUserId ? 'Edit Pengguna Admin' : 'Tambah Admin Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitUserForm} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formEmail}
                  disabled={!!editingUserId}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="admin@perusahaan.com"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-hidden disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Peran / Akses Wewenang (Role) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-hidden"
                >
                  {/* Security: Only super_admin can assign super_admin (Section 40) */}
                  {currentActor.role === 'super_admin' && (
                    <option value="super_admin">Super Administrator (Akses Penuh)</option>
                  )}
                  <option value="admin">Admin Operasional (Produk, Order, Stok, Laporan)</option>
                  <option value="staff">Staff Gudang &amp; Logistik (Order, Pengiriman)</option>
                </select>
              </div>

              {editingUserId && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-stone-300 text-stone-900"
                  />
                  <label htmlFor="isActiveCheck" className="text-stone-800 font-medium">
                    Akun ini aktif dan dapat mengakses sistem manajemen
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{editingUserId ? 'Simpan Perubahan' : 'Buat Pengguna Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
