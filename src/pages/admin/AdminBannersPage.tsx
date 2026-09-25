import React, { useState, useEffect } from 'react';
import { Banner, BannerPosition } from '../../types';
import {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../../services/bannerService';
import { useToast } from '../../components/common/Toast';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  X,
  Loader2,
  Check,
  Smartphone,
  Monitor,
} from 'lucide-react';

interface AdminBannersPageProps {
  onNavigate: (path: string) => void;
}

export const AdminBannersPage: React.FC<AdminBannersPageProps> = () => {
  const { success, error } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [buttonText, setButtonText] = useState('Lihat Promo');
  const [position, setPosition] = useState<BannerPosition>('homepage_hero');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await getAllBanners();
      setBanners(data);
    } catch (e) {
      console.warn('Failed loading banners:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setMobileImageUrl('');
    setLinkUrl('/products');
    setButtonText('Belanja Sekarang');
    setPosition('homepage_hero');
    // Default 7 days from now
    const now = new Date();
    setStartAt(now.toISOString().slice(0, 16));
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setEndAt(next7Days.toISOString().slice(0, 16));
    setIsActive(true);
    setSortOrder(banners.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Banner) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setImageUrl(b.image_url);
    setMobileImageUrl(b.mobile_image_url || '');
    setLinkUrl(b.link_url || '');
    setButtonText(b.button_text || '');
    setPosition(b.position);
    setStartAt(new Date(b.start_at).toISOString().slice(0, 16));
    setEndAt(new Date(b.end_at).toISOString().slice(0, 16));
    setIsActive(b.is_active);
    setSortOrder(b.sort_order);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      error('Judul banner dan URL gambar desktop wajib diisi.');
      return;
    }

    if (!startAt || !endAt) {
      error('Tanggal mulai dan tanggal berakhir banner wajib ditentukan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        image_url: imageUrl.trim(),
        mobile_image_url: mobileImageUrl.trim() || null,
        link_url: linkUrl.trim() || null,
        button_text: buttonText.trim() || null,
        position,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        is_active: isActive,
        sort_order: Number(sortOrder) || 1,
      };

      if (editingBanner) {
        await updateBanner(editingBanner.id, payload);
        success('Banner berhasil diperbarui!');
      } else {
        await createBanner(payload);
        success('Banner baru berhasil dibuat!');
      }

      setIsModalOpen(false);
      loadBanners();
    } catch (err: any) {
      error(err.message || 'Gagal menyimpan banner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      await updateBanner(b.id, { is_active: !b.is_active });
      success(`Banner ${!b.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`);
      loadBanners();
    } catch (e: any) {
      error(e.message || 'Gagal mengubah status banner.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus banner ini?')) {
      try {
        await deleteBanner(id);
        success('Banner berhasil dihapus.');
        loadBanners();
      } catch (e: any) {
        error(e.message || 'Gagal menghapus banner.');
      }
    }
  };

  const getScheduleStatus = (b: Banner) => {
    if (!b.is_active) {
      return { label: 'Non-Aktif', color: 'bg-stone-100 text-stone-600' };
    }
    const now = Date.now();
    const start = new Date(b.start_at).getTime();
    const end = new Date(b.end_at).getTime();

    if (now < start) {
      return { label: 'Terjadwal (Belum Mulai)', color: 'bg-blue-100 text-blue-800' };
    }
    if (now > end) {
      return { label: 'Kedaluwarsa (Expired)', color: 'bg-rose-100 text-rose-800' };
    }
    return { label: 'Aktif Tayang', color: 'bg-emerald-100 text-emerald-800 font-bold' };
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
            Daftar Banner Pemasaran
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Mendukung jadwal otomatis (start/end date), posisi strategis, gambar responsif desktop & mobile.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Banner Baru</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pratinjau</th>
                <th className="py-3 px-4">Judul & Keterangan</th>
                <th className="py-3 px-4">Posisi</th>
                <th className="py-3 px-4">Jadwal Tayang</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Urutan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Memuat data banner...
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Belum ada banner yang dibuat. Klik tombol di atas untuk menambah banner baru.
                  </td>
                </tr>
              ) : (
                banners.map((b) => {
                  const schedule = getScheduleStatus(b);
                  return (
                    <tr key={b.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <img
                          src={b.image_url}
                          alt={b.title}
                          className="w-20 h-12 object-cover rounded-lg border border-stone-200 shadow-2xs"
                        />
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-stone-900 truncate">{b.title}</div>
                        {b.subtitle && (
                          <div className="text-[11px] text-stone-500 truncate">{b.subtitle}</div>
                        )}
                        {b.link_url && (
                          <span className="text-[10px] text-amber-900 font-mono block truncate mt-0.5">
                            Link: {b.link_url}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-700">
                        {b.position}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-stone-600">
                        <div>Mulai: {new Date(b.start_at).toLocaleDateString('id-ID')}</div>
                        <div>Selesai: {new Date(b.end_at).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${schedule.color}`}
                        >
                          {schedule.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-stone-700">
                        {b.sort_order}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(b)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold ${
                            b.is_active
                              ? 'text-amber-900 hover:bg-amber-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {b.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="p-1 text-stone-500 hover:text-stone-900"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingBanner ? 'Edit Banner Pemasaran' : 'Tambah Banner Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Judul Utama Banner <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Festival Komoditas Pangan Pilihan"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Sub-judul / Tagline Pendukung
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Contoh: Pasokan Biji Wijen & Kurma Ajwa Mutu Ekspor"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Posisi Banner <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as BannerPosition)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
                  >
                    <option value="homepage_hero">Homepage Hero (Utama)</option>
                    <option value="homepage_secondary">Homepage Secondary (Sekunder)</option>
                    <option value="category">Halaman Kategori</option>
                    <option value="product">Halaman Detail Produk</option>
                    <option value="promotion">Halaman Promosi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Urutan Tampil (Sort Order)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>URL Gambar Desktop <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>URL Gambar Mobile (Opsional, Section 25)</span>
                </label>
                <input
                  type="url"
                  value={mobileImageUrl}
                  onChange={(e) => setMobileImageUrl(e.target.value)}
                  placeholder="URL gambar yang dioptimalkan untuk layar ponsel..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Tautan Tujuan (Link URL)
                  </label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="/products atau /promo/ramadan"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Teks Tombol Aksi (CTA)
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Contoh: Belanja Sekarang"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Schedule Dates (Section 24) */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <span className="font-semibold text-stone-800 block">Jadwal Penayangan Banner (Section 24)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 mb-1">Mulai Tayang (Start At)</label>
                    <input
                      type="datetime-local"
                      required
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1">Berakhir Tayang (End At)</label>
                    <input
                      type="datetime-local"
                      required
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-stone-300 text-amber-900 focus:ring-amber-900"
                />
                <label htmlFor="isActive" className="font-semibold text-stone-800">
                  Banner Aktif
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-stone-600 hover:text-stone-900 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingBanner ? 'Simpan Perubahan' : 'Buat Banner'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
