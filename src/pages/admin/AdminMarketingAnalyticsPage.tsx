import React, { useState, useEffect } from 'react';
import { BannerMetrics, CampaignAnalytics } from '../../types';
import { getBannerMetrics } from '../../services/bannerService';
import { getCampaignAnalytics } from '../../services/marketingAnalyticsService';
import { formatRupiah } from '../../utils/formatters';
import {
  TrendingUp,
  Megaphone,
  Eye,
  MousePointerClick,
  Percent,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface AdminMarketingAnalyticsPageProps {
  onNavigate: (path: string) => void;
}

export const AdminMarketingAnalyticsPage: React.FC<AdminMarketingAnalyticsPageProps> = () => {
  const [bannerMetrics, setBannerMetrics] = useState<BannerMetrics[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [bMetrics, camps] = await Promise.all([
          getBannerMetrics(),
          getCampaignAnalytics(),
        ]);
        setBannerMetrics(bMetrics);
        setCampaigns(camps);
      } catch (e) {
        console.warn('Failed loading marketing analytics:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalBannerViews = bannerMetrics.reduce((sum, b) => sum + b.views, 0);
  const totalBannerClicks = bannerMetrics.reduce((sum, b) => sum + b.clicks, 0);
  const averageCtr = totalBannerViews > 0 ? Number(((totalBannerClicks / totalBannerViews) * 100).toFixed(2)) : 0;

  const totalCampaignOrders = campaigns.reduce((sum, c) => sum + c.orders, 0);
  const totalCampaignRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);

  return (
    <div className="space-y-8">
      {/* Top Header Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Total Interaksi Banner</span>
            <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
              {totalBannerClicks} <span className="text-xs font-sans text-stone-400 font-normal">/ {totalBannerViews} tayang</span>
            </div>
            <span className="text-[11px] text-emerald-800 font-semibold mt-0.5 block">
              {averageCtr}% Rata-rata CTR
            </span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-900">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Total Pesanan Atribusi</span>
            <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
              {totalCampaignOrders}
            </div>
            <span className="text-[11px] text-stone-400 font-medium mt-0.5 block">
              Pesanan terlacak UTM
            </span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-900">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Omset Kampanye Terlacak</span>
            <div className="text-2xl font-serif font-bold text-emerald-800 mt-1">
              {formatRupiah(totalCampaignRevenue)}
            </div>
            <span className="text-[11px] text-stone-400 font-medium mt-0.5 block">
              Atribusi pendapatan UTM
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-900">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 1. Banner Analytics & CTR (Section 46, 47) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
            1. Analisis Kinerja Banner Promosi &amp; CTR (Click-Through Rate)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Formula CTR: (Klik / Tayangan) × 100. Nilai CTR 0% jika tayangan = 0.
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Judul Banner</th>
                  <th className="py-3 px-4">Posisi Penempatan</th>
                  <th className="py-3 px-4 text-center">Tayangan (Views)</th>
                  <th className="py-3 px-4 text-center">Klik (Clicks)</th>
                  <th className="py-3 px-4 text-right">Rasio Klik (CTR %)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {bannerMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      Belum ada data interaksi banner yang tercatat.
                    </td>
                  </tr>
                ) : (
                  bannerMetrics.map((b) => (
                    <tr key={b.banner_id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900 max-w-xs truncate">
                        {b.title}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                        {b.position}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-stone-700">
                        {b.views}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-stone-700">
                        {b.clicks}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                        {b.ctr}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Campaign Attribution & UTM Analytics (Section 49, 50, 51) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
            2. Atribusi Kampanye Pemasaran (UTM Source, Medium &amp; Campaign)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Data pesanan dan konversi yang bersumber dari tautan berparameter UTM (misal: utm_campaign=ramadan2027).
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Kampanye (Campaign)</th>
                  <th className="py-3 px-4">Sumber (Source)</th>
                  <th className="py-3 px-4">Media (Medium)</th>
                  <th className="py-3 px-4 text-center">Sesi Kunjungan</th>
                  <th className="py-3 px-4 text-center">Pesanan Selesai</th>
                  <th className="py-3 px-4 text-right">Pendapatan Terlacak</th>
                  <th className="py-3 px-4 text-right">Tingkat Konversi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      Belum ada data atribusi kampanye.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.campaign} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-950">
                        {c.campaign}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {c.source}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {c.medium}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-stone-700">
                        {c.sessions}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-stone-900">
                        {c.orders}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                        {formatRupiah(c.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-900">
                        {c.conversion_rate}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
