import React, { useState, useEffect } from 'react';
import { ProductReview, ReviewStatus } from '../../types';
import { getAdminReviews, moderateReview } from '../../services/reviewService';
import { useToast } from '../../components/common/Toast';
import {
  Star,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck,
  Send,
  X,
  Package,
} from 'lucide-react';

interface AdminReviewsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminReviewsPage: React.FC<AdminReviewsPageProps> = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply modal
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<ProductReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);

  const { success, error } = useToast();

  const loadReviews = async () => {
    setLoading(true);
    try {
      const list = await getAdminReviews({ status: statusFilter, search: searchQuery });
      setReviews(list);
    } catch {
      error('Gagal memuat daftar ulasan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReviews();
  };

  const handleModerate = async (reviewId: string, status: ReviewStatus) => {
    try {
      await moderateReview(reviewId, status);
      success(`Status ulasan berhasil diubah menjadi "${status.toUpperCase()}".`);
      loadReviews();
    } catch {
      error('Gagal memperbarui status ulasan.');
    }
  };

  const openReplyModal = (rev: ProductReview) => {
    setActiveReview(rev);
    setReplyText(rev.admin_reply || '');
    setReplyModalOpen(true);
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReview) return;

    setSaving(true);
    try {
      await moderateReview(activeReview.id, activeReview.status, replyText.trim() || undefined);
      success('Tanggapan penjual berhasil disimpan.');
      setReplyModalOpen(false);
      loadReviews();
    } catch {
      error('Gagal menyimpan tanggapan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            Moderasi Ulasan Produk & Testimoni
          </h2>
          <p className="text-xs text-stone-500">
            Setujui, tolak, atau balas ulasan dari pembeli komoditas pangan.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReviews}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ulasan, nama pelanggan, atau nama produk..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-amber-900 outline-hidden"
          />
        </form>

        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'pending', label: 'Menunggu Moderasi' },
            { id: 'published', label: 'Diterbitkan' },
            { id: 'rejected', label: 'Ditolak' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-800" />
            <span>Memuat ulasan pelanggan...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            <Star className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p>Tidak ada ulasan yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">Customer & Rating</th>
                  <th className="py-3 px-4">Isi Ulasan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4 text-right">Aksi Moderasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-stone-50/60">
                    <td className="py-3.5 px-4 font-semibold text-stone-900 max-w-[160px] truncate">
                      {rev.product_name}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                        <span>{rev.customer_name || 'Pelanggan'}</span>
                        {rev.is_verified_purchase && (
                          <span title="Pembeli Terverifikasi">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-200'
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-stone-800 text-[11px] truncate">{rev.title}</p>
                      <p className="text-stone-600 line-clamp-2 text-[11px]">{rev.review}</p>
                      {rev.admin_reply && (
                        <p className="text-[10px] text-amber-800 mt-1 bg-amber-50 p-1.5 rounded-md">
                          Balasan: {rev.admin_reply}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {rev.status === 'published' ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                          Diterbitkan
                        </span>
                      ) : rev.status === 'rejected' ? (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-sm">
                          Ditolak
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-sm">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-stone-400 font-mono">
                      {new Date(rev.created_at).toLocaleDateString('id-ID')}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {rev.status !== 'published' && (
                          <button
                            type="button"
                            onClick={() => handleModerate(rev.id, 'published')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-lg transition-colors"
                          >
                            Setujui
                          </button>
                        )}

                        {rev.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleModerate(rev.id, 'rejected')}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold rounded-lg transition-colors"
                          >
                            Tolak
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openReplyModal(rev)}
                          className="px-2.5 py-1 border border-stone-200 hover:bg-stone-50 text-stone-700 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3 text-stone-400" />
                          <span>Balas</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Reply Modal (Rule 33) */}
      {replyModalOpen && activeReview && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-stone-900 mb-1">
              Tanggapan Resmi Toko (Admin Reply)
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Ulasan: "{activeReview.title}" oleh {activeReview.customer_name}
            </p>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Pesan Tanggapan Penjual
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Terima kasih atas ulasannya... Kami akan terus meningkatkan kualitas komoditas."
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden focus:bg-white focus:border-amber-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Balasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
