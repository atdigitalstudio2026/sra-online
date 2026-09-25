import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { ProductReview } from '../../types';
import {
  getUserReviews,
  getUserPendingReviewProducts,
  submitProductReview,
  uploadReviewImage,
} from '../../services/reviewService';
import { useToast } from '../../components/common/Toast';
import {
  Star,
  CheckCircle2,
  Clock,
  MessageSquare,
  Upload,
  Plus,
  X,
  Package,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface AccountReviewsPageProps {
  onNavigate: (path: string) => void;
}

export const AccountReviewsPage: React.FC<AccountReviewsPageProps> = ({ onNavigate }) => {
  const { user } = useCart();
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending');
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { success, error } = useToast();

  const loadData = async () => {
    if (user?.id) {
      setLoading(true);
      try {
        const [pending, userReviews] = await Promise.all([
          getUserPendingReviewProducts(user.id),
          getUserReviews(user.id),
        ]);
        setPendingProducts(pending);
        setReviews(userReviews);
      } catch (e) {
        console.warn('Failed loading reviews data', e);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('fmcg_reviews_updated', handleUpdate);
    return () => window.removeEventListener('fmcg_reviews_updated', handleUpdate);
  }, [user]);

  const openReviewModal = (item: any) => {
    setSelectedProduct(item);
    setRating(5);
    setTitle('');
    setReviewText('');
    setUploadedPhotos([]);
    setReviewModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      error('Ukuran foto maksimal 3MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const url = await uploadReviewImage(file);
      setUploadedPhotos((prev) => [...prev, url]);
      success('Foto berhasil dilampirkan.');
    } catch {
      error('Gagal mengunggah foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedProduct) return;

    if (!title.trim() || reviewText.trim().length < 10) {
      error('Isi ulasan minimal 10 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitProductReview({
        product_id: selectedProduct.product_id,
        user_id: user.id,
        order_id: selectedProduct.order_id,
        rating,
        title: title.trim(),
        review: reviewText.trim(),
        photos: uploadedPhotos,
        customer_name: user.name || user.email?.split('@')[0],
      });

      if (res.success) {
        success(res.message);
        setReviewModalOpen(false);
        loadData();
        setActiveTab('submitted');
      } else {
        error(res.message);
      }
    } catch {
      error('Gagal mengirimkan ulasan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">Ulasan & Testimoni Produk</h2>
          <p className="text-xs text-stone-500">
            Berikan ulasan untuk komoditas pangan yang telah Anda beli dan nikmati.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Menunggu Ulasan</span>
            {pendingProducts.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-800 text-amber-100 text-[10px] flex items-center justify-center font-bold">
                {pendingProducts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('submitted')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'submitted'
                ? 'bg-amber-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Ulasan Saya</span>
            <span className="text-[11px] font-mono text-stone-400">({reviews.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-stone-200 rounded-2xl" />
          <div className="h-28 bg-stone-200 rounded-2xl" />
        </div>
      ) : activeTab === 'pending' ? (
        // Pending Reviews Tab
        pendingProducts.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
            <h4 className="text-xs font-bold text-stone-800">Semua Produk Sudah Diulas!</h4>
            <p className="text-xs text-stone-400 mt-1 mb-4">
              Terima kasih telah berbagi pengalaman belanja Anda dengan pembeli lain.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/products')}
              className="px-4 py-2 bg-amber-900 text-white rounded-xl text-xs font-semibold"
            >
              Belanja Komoditas Lainnya
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingProducts.map((item) => (
              <div
                key={`${item.order_id}-${item.product_id}`}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-14 h-14 rounded-xl object-cover border border-stone-100 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-stone-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 truncate">
                      {item.product_name}
                    </h4>
                    <p className="text-[11px] text-stone-400 font-mono">
                      Pesanan: {item.order_number}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm mt-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Pembelian Terverifikasi
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openReviewModal(item)}
                  className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs shrink-0 transition-colors"
                >
                  Tulis Ulasan
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        // Submitted Reviews Tab
        reviews.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-400">
            <Star className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <h4 className="text-xs font-bold text-stone-800">Belum Ada Ulasan Diterbitkan</h4>
            <p className="text-xs text-stone-400 mt-1">Ulasan Anda akan muncul di sini setelah dikirimkan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const isApproved = rev.status === 'published';
              const isPending = rev.status === 'pending';

              return (
                <div
                  key={rev.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-stone-900">{rev.product_name}</h4>
                        {rev.is_verified_purchase && (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= rev.rating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-stone-300'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-mono font-bold text-stone-700 ml-1">
                          {rev.rating}.0
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isApproved ? (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Diterbitkan
                        </span>
                      ) : isPending ? (
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Menunggu Moderasi
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-sm">
                          Ditolak
                        </span>
                      )}
                      <span className="text-[11px] text-stone-400 font-mono">
                        {new Date(rev.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-stone-800">{rev.title}</h5>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">{rev.review}</p>
                  </div>

                  {rev.photos && rev.photos.length > 0 && (
                    <div className="flex items-center gap-2 pt-2">
                      {rev.photos.map((imgUrl, i) => (
                        <img
                          key={i}
                          src={imgUrl}
                          alt="Review attachment"
                          className="w-14 h-14 rounded-lg object-cover border border-stone-200"
                        />
                      ))}
                    </div>
                  )}

                  {rev.admin_reply && (
                    <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-xs mt-3">
                      <p className="font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Respon Resmi Penjual</span>
                      </p>
                      <p className="text-stone-600 text-[11px] leading-relaxed">{rev.admin_reply}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Write Review Modal (Rule 28, 29, 30) */}
      {reviewModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-stone-400 hover:text-stone-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-stone-900 mb-1">Beri Ulasan Komoditas</h3>
            <p className="text-xs text-stone-500 mb-4">{selectedProduct.product_name}</p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Star Rating Selector (Rule 28: 1-5 strictly) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Rating Bintang *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-stone-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold font-mono text-stone-800 ml-2">
                    {rating} / 5 Bintang
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Judul Ulasan *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Kualitas kurma sangat legit & higienis"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden focus:bg-white focus:border-amber-900"
                />
              </div>

              {/* Text */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Isi Ulasan (Minimal 10 Karakter) *
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Ceritakan kesegaran komoditas, kemasan pengiriman, rasa, atau kecocokan untuk usaha Anda..."
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-hidden focus:bg-white focus:border-amber-900"
                />
              </div>

              {/* Optional Photo Upload (Rule 30) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Lampirkan Foto Produk (Opsional)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {uploadedPhotos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Thumbnail"
                      className="w-14 h-14 rounded-lg object-cover border border-stone-200"
                    />
                  ))}

                  <label className="w-14 h-14 rounded-lg border-2 border-dashed border-stone-200 hover:border-amber-800 flex flex-col items-center justify-center text-stone-400 hover:text-amber-850 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-[9px] mt-0.5">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || reviewText.trim().length < 10}
                  className="px-6 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
