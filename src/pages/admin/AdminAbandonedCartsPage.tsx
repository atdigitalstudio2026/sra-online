import React, { useState, useEffect } from 'react';
import { AbandonedCartSummary } from '../../types';
import { getAbandonedCarts, generateRecoveryLink } from '../../services/abandonedCartService';
import { formatRupiah } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';
import {
  ShoppingCart,
  Clock,
  Link as LinkIcon,
  Copy,
  Check,
  Filter,
  User,
  AlertTriangle,
  Mail,
  Phone,
  X,
} from 'lucide-react';

interface AdminAbandonedCartsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminAbandonedCartsPage: React.FC<AdminAbandonedCartsPageProps> = () => {
  const { success, error } = useToast();
  const [carts, setCarts] = useState<AbandonedCartSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState<number>(7);

  // Recovery modal state
  const [selectedRecoveryUrl, setSelectedRecoveryUrl] = useState<string | null>(null);
  const [selectedRecoveryToken, setSelectedRecoveryToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadCarts = async () => {
    setLoading(true);
    try {
      const data = await getAbandonedCarts(filterDays);
      setCarts(data);
    } catch (e) {
      console.warn('Failed loading abandoned carts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCarts();
  }, [filterDays]);

  const handleGenerateLink = async (cartId: string) => {
    try {
      const { token, url } = await generateRecoveryLink(cartId);
      setSelectedRecoveryToken(token);
      setSelectedRecoveryUrl(url);
    } catch (err: any) {
      error(err.message || 'Gagal menghasilkan tautan pemulihan.');
    }
  };

  const handleCopyLink = () => {
    if (selectedRecoveryUrl && typeof window !== 'undefined') {
      navigator.clipboard.writeText(selectedRecoveryUrl);
      setCopied(true);
      success('Tautan pemulihan keranjang berhasil disalin!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
            Keranjang Terabaikan (Abandoned Carts - Section 34 & 37)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Daftar keranjang aktif dengan produk yang tidak beraktivitas lebih dari 24 jam tanpa penyelesaian pesanan.
          </p>
        </div>

        {/* Filter Period Buttons (Section 37) */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-stone-200 text-xs">
          <span className="text-stone-500 px-2 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Periode:
          </span>
          {[1, 3, 7, 30].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setFilterDays(days)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterDays === days
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {days} Hari
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pelanggan & Kontak</th>
                <th className="py-3 px-4">Item Produk di Keranjang</th>
                <th className="py-3 px-4 text-right">Nilai Keranjang</th>
                <th className="py-3 px-4">Aktivitas Terakhir</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Tautan Pemulihan (Section 38)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    Memuat data keranjang terabaikan...
                  </td>
                </tr>
              ) : carts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    Tidak ada keranjang terabaikan dalam rentang {filterDays} hari terakhir.
                  </td>
                </tr>
              ) : (
                carts.map((c) => (
                  <tr key={c.cart_id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{c.customer_name || 'Pelanggan Tamu'}</div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                        {c.customer_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-400" />
                            {c.customer_email}
                          </span>
                        )}
                        {c.customer_phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-stone-400" />
                            {c.customer_phone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-semibold text-[10px] mb-1">
                        {c.item_count} macam produk
                      </span>
                      <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                        {c.items_summary}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                      {formatRupiah(c.cart_value)}
                    </td>

                    <td className="py-3 px-4 text-[11px] text-stone-500">
                      <div className="flex items-center gap-1 text-stone-700 font-medium">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {new Date(c.last_activity).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <span className="text-[10px] text-stone-400 block mt-0.5">
                        Dibuat: {new Date(c.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        Terabaikan (&gt;24 Jam)
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleGenerateLink(c.cart_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Buat Tautan Pulihkan</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recovery Link Modal (Section 38, 39) */}
      {selectedRecoveryUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2 text-stone-900">
                <LinkIcon className="w-5 h-5 text-amber-900" />
                <h3 className="font-serif text-base font-bold">Tautan Pemulihan Keranjang Aman</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecoveryUrl(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Tautan ini dibuat menggunakan token acak terenkripsi (Section 38 &amp; 39) yang aman dan berlaku selama 7 hari. Pelanggan yang membuka tautan ini akan langsung mendapatkan kembali seluruh produk di keranjang belanja mereka:
            </p>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="font-mono text-xs text-amber-950 break-all select-all font-medium">
                {selectedRecoveryUrl}
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                Token Kriptografi: {selectedRecoveryToken}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-stone-500">
                Kadaluarsa: 7 Hari ke depan
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Tautan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
