import React, { useState, useEffect } from 'react';
import { MarketingDashboardMetrics } from '../../types';
import { getMarketingDashboardMetrics } from '../../services/marketingAnalyticsService';
import {
  Megaphone,
  BookOpen,
  ShoppingCart,
  TrendingUp,
  Filter,
  Bell,
  ArrowRight,
  Eye,
  MousePointerClick,
  Percent,
  Sparkles,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface AdminMarketingHubPageProps {
  onNavigate: (path: string) => void;
}

export const AdminMarketingHubPage: React.FC<AdminMarketingHubPageProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<MarketingDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMarketingDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.warn('Failed loading marketing metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const modules = [
    {
      title: 'Marketing Banners',
      description: 'Kelola banner promo berjadwal, hero desktop & mobile, dan pantau CTR.',
      path: '/admin/banners',
      icon: Megaphone,
      stats: `${metrics?.active_banners || 0} Aktif (${metrics?.total_banners || 0} Total)`,
      badge: `${metrics?.average_banner_ctr || 0}% Rata-rata CTR`,
      color: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    {
      title: 'Konten & Panduan (CMS)',
      description: 'Publikasikan artikel edukasi, panduan mutu komoditas, dan produk terkait.',
      path: '/admin/content',
      icon: BookOpen,
      stats: `${metrics?.published_articles || 0} Terbit (${metrics?.total_articles || 0} Total)`,
      badge: 'SEO Friendly',
      color: 'bg-blue-50 text-blue-900 border-blue-200',
    },
    {
      title: 'Keranjang Terabaikan (Abandoned Cart)',
      description: 'Deteksi cart pasif >24 jam dan buat tautan pemulihan aman dengan token berbatas waktu.',
      path: '/admin/marketing/abandoned-carts',
      icon: ShoppingCart,
      stats: `${metrics?.abandoned_carts_count || 0} Terdeteksi`,
      badge: `${metrics?.recovery_rate || 0}% Terpulihkan`,
      color: 'bg-rose-50 text-rose-900 border-rose-200',
    },
    {
      title: 'Conversion Funnel',
      description: 'Analisis tingkat konversi dari Pengunjung hingga Pesanan Terbayar.',
      path: '/admin/analytics/funnel',
      icon: Filter,
      stats: '6 Tahapan Pelanggan',
      badge: 'Real Event Tracking',
      color: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    },
    {
      title: 'Kampanye & Atribusi UTM',
      description: 'Pantau kinerja traffic media sosial, WhatsApp blast, dan omset per kampanye.',
      path: '/admin/analytics/marketing',
      icon: TrendingUp,
      stats: 'UTM Source & Medium',
      badge: 'Attribution Tracking',
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    },
    {
      title: 'Pengingat Stok & Harga (Alerts)',
      description: 'Daftar pelanggan yang meminta pemberitahuan saat restok atau harga turun.',
      path: '/admin/marketing/alerts',
      icon: Bell,
      stats: `${metrics?.total_active_stock_alerts || 0} Stok + ${metrics?.total_active_price_alerts || 0} Harga`,
      badge: 'Auto Notification',
      color: 'bg-purple-50 text-purple-900 border-purple-200',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Tayangan Banner</span>
            <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
              {metrics?.total_banner_views?.toLocaleString('id-ID') || 0}
            </div>
            <span className="text-[11px] text-stone-400">Total views sesi</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-900">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Klik Banner (Clicks)</span>
            <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
              {metrics?.total_banner_clicks?.toLocaleString('id-ID') || 0}
            </div>
            <span className="text-[11px] text-stone-400">Interaksi banner</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-900">
            <MousePointerClick className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Rata-rata CTR Banner</span>
            <div className="text-2xl font-serif font-bold text-emerald-800 mt-1">
              {metrics?.average_banner_ctr || 0}%
            </div>
            <span className="text-[11px] text-stone-400">Formula Clicks/Views</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-900">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium">Cart Terabaikan</span>
            <div className="text-2xl font-serif font-bold text-rose-800 mt-1">
              {metrics?.abandoned_carts_count || 0}
            </div>
            <span className="text-[11px] text-stone-400">Pasif &gt; 24 jam</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-900">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Hub Modules Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
          Modul Pemasaran, Konten & Konversi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                onClick={() => onNavigate(m.path)}
                className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl border ${m.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700">
                      {m.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                    {m.title}
                  </h3>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-700">{m.stats}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-900 group-hover:text-amber-950">
                    <span>Kelola</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
