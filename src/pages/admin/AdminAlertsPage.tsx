import React, { useState, useEffect } from 'react';
import { StockAlert, PriceAlert } from '../../types';
import { getAllStockAlerts, getAllPriceAlerts } from '../../services/alertService';
import { formatRupiah } from '../../utils/formatters';
import {
  Bell,
  Box,
  TrendingDown,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface AdminAlertsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminAlertsPage: React.FC<AdminAlertsPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'stock' | 'price'>('stock');
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [stocks, prices] = await Promise.all([
          getAllStockAlerts(),
          getAllPriceAlerts(),
        ]);
        setStockAlerts(stocks);
        setPriceAlerts(prices);
      } catch (e) {
        console.warn('Failed loading alerts:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
          Pengingat Pelanggan: Stok &amp; Penurunan Harga (Section 41-44)
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Daftar permintaan notifikasi otomatis saat komoditas habis di-restok atau harga produk turun mencapai target.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'stock'
              ? 'bg-amber-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Pengingat Restok (Back in Stock) ({stockAlerts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('price')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'price'
              ? 'bg-amber-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Pengingat Turun Harga (Price Drop) ({priceAlerts.length})</span>
        </button>
      </div>

      {/* Table Content */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {activeTab === 'stock' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Produk Komoditas</th>
                  <th className="py-3 px-4">Kontak Pelanggan</th>
                  <th className="py-3 px-4">Tanggal Mendaftar</th>
                  <th className="py-3 px-4">Status Pengingat</th>
                  <th className="py-3 px-4">Waktu Terkirim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      Memuat data pengingat stok...
                    </td>
                  </tr>
                ) : stockAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      Belum ada permintaan pengingat stok produk saat ini.
                    </td>
                  </tr>
                ) : (
                  stockAlerts.map((a) => (
                    <tr key={a.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {a.product?.name || `Produk ID: ${a.product_id}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-stone-800">
                          <Mail className="w-3 h-3 text-stone-400" />
                          <span>{a.email}</span>
                        </div>
                        {a.phone && (
                          <div className="flex items-center gap-1.5 text-stone-500 font-mono text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{a.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-500">
                        {new Date(a.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {a.status === 'notified' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Telah Dinotifikasi
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Menunggu Restok
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                        {a.notified_at ? new Date(a.notified_at).toLocaleString('id-ID') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Produk Komoditas</th>
                  <th className="py-3 px-4">Harga Sekarang</th>
                  <th className="py-3 px-4">Target Harga Diinginkan</th>
                  <th className="py-3 px-4">Tanggal Mendaftar</th>
                  <th className="py-3 px-4">Status Pengingat</th>
                  <th className="py-3 px-4">Waktu Terkirim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      Memuat data pengingat harga...
                    </td>
                  </tr>
                ) : priceAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      Belum ada permintaan pengingat harga.
                    </td>
                  </tr>
                ) : (
                  priceAlerts.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {p.product?.name || `Produk ID: ${p.product_id}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-700">
                        {p.product ? formatRupiah(p.product.price) : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        {formatRupiah(p.target_price)}
                      </td>
                      <td className="py-3 px-4 text-stone-500">
                        {new Date(p.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {p.status === 'triggered' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Tercapai &amp; Dinotifikasi
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Menunggu Penurunan
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                        {p.triggered_at ? new Date(p.triggered_at).toLocaleString('id-ID') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
