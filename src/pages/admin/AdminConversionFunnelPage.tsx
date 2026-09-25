import React, { useState, useEffect } from 'react';
import { ConversionFunnelReport } from '../../types';
import { getConversionFunnelReport } from '../../services/marketingAnalyticsService';
import {
  Filter,
  Users,
  Eye,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  TrendingDown,
  ArrowDown,
} from 'lucide-react';

interface AdminConversionFunnelPageProps {
  onNavigate: (path: string) => void;
}

export const AdminConversionFunnelPage: React.FC<AdminConversionFunnelPageProps> = () => {
  const [report, setReport] = useState<ConversionFunnelReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getConversionFunnelReport();
        setReport(data);
      } catch (e) {
        console.warn('Failed loading conversion funnel:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'visitors':
        return <Users className="w-5 h-5 text-blue-800" />;
      case 'product_views':
        return <Eye className="w-5 h-5 text-indigo-800" />;
      case 'add_to_cart':
        return <ShoppingCart className="w-5 h-5 text-amber-800" />;
      case 'checkout_started':
        return <CreditCard className="w-5 h-5 text-orange-800" />;
      case 'orders':
        return <Filter className="w-5 h-5 text-purple-800" />;
      case 'paid_orders':
        return <CheckCircle2 className="w-5 h-5 text-emerald-800" />;
      default:
        return <Filter className="w-5 h-5 text-stone-700" />;
    }
  };

  const getStageColor = (idx: number) => {
    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-amber-600',
      'bg-orange-600',
      'bg-purple-600',
      'bg-emerald-600',
    ];
    return colors[idx] || 'bg-stone-600';
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
          Corong Konversi E-Commerce (Conversion Funnel - Section 52)
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Visualisasi penurunan (drop-off) dari pengunjung hingga pembayaran berhasil diselesaikan secara nyata.
        </p>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">Checkout Conversion Rate</span>
          <div className="text-3xl font-serif font-bold text-stone-900 mt-1">
            {report?.checkout_conversion_rate || 0}%
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">
            Formula: (Orders / Checkout Started) × 100
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">Product View to Order Rate</span>
          <div className="text-3xl font-serif font-bold text-stone-900 mt-1">
            {report?.product_conversion_rate || 0}%
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">
            Formula: (Orders / Product Views) × 100
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-stone-500 font-medium">Overall End-to-End Conversion</span>
          <div className="text-3xl font-serif font-bold text-emerald-800 mt-1">
            {report?.overall_conversion_rate || 0}%
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">
            Formula: (Paid Orders / Visitors) × 100
          </span>
        </div>
      </div>

      {/* Funnel Visual Bars */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">
          Tahapan Corong Konversi Pelanggan
        </h3>

        {loading || !report ? (
          <div className="py-16 text-center text-xs text-stone-400">
            Menghitung metrik corong konversi...
          </div>
        ) : (
          <div className="space-y-4">
            {report.stages.map((st, idx) => {
              const maxVal = report.visitors || 100;
              const widthPct = Math.max(10, Math.round((st.count / maxVal) * 100));

              return (
                <div key={st.stage} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-stone-100">
                        {getStageIcon(st.stage)}
                      </div>
                      <span className="font-bold text-stone-900">
                        {idx + 1}. {st.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-stone-500 font-mono">
                      <span className="font-bold text-stone-900 text-sm">
                        {st.count.toLocaleString('id-ID')}
                      </span>
                      {idx > 0 && (
                        <span className="text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          ↓ {st.drop_rate}% drop
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-stone-100 rounded-xl h-9 overflow-hidden flex items-center p-1 relative">
                    <div
                      className={`h-full rounded-lg ${getStageColor(idx)} transition-all duration-700 flex items-center px-3 text-white text-xs font-bold justify-between`}
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="truncate">{st.count}</span>
                      {widthPct > 25 && <span>{widthPct}%</span>}
                    </div>
                  </div>

                  {idx < report.stages.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <ArrowDown className="w-3.5 h-3.5 text-stone-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
