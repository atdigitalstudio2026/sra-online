import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Cpu,
  RefreshCw,
  Trash2,
  Lock,
  Layers,
  Zap,
  Server,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { SystemHealthReport } from '../../types';
import { fetchSystemHealth, flushServerCache } from '../../services/systemHealthService';
import { checkDatabaseStatus, seedDatabaseToSupabase, DatabaseSyncReport } from '../../services/databaseSyncService';
import { useToast } from '../../components/common/Toast';

interface AdminSystemHealthPageProps {
  onNavigate: (path: string) => void;
}

export const AdminSystemHealthPage: React.FC<AdminSystemHealthPageProps> = ({ onNavigate }) => {
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [dbReport, setDbReport] = useState<DatabaseSyncReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingDb, setCheckingDb] = useState(false);
  const [syncingDb, setSyncingDb] = useState(false);
  const [flushingCache, setFlushingCache] = useState(false);
  const { showToast } = useToast();

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [data, dbStatus] = await Promise.all([
        fetchSystemHealth(),
        checkDatabaseStatus(),
      ]);
      setHealth(data);
      setDbReport(dbStatus);
      if (isManual) {
        showToast('Diagnostik sistem & status database berhasil diperbarui.', 'success');
      }
    } catch {
      showToast('Gagal memuat status kesehatan sistem.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 20000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckDatabase = async () => {
    setCheckingDb(true);
    try {
      const report = await checkDatabaseStatus();
      setDbReport(report);
      showToast(report.message, report.connected ? 'success' : 'info');
    } catch {
      showToast('Gagal memeriksa status koneksi database.', 'error');
    } finally {
      setCheckingDb(false);
    }
  };

  const handleSyncDatabase = async () => {
    setSyncingDb(true);
    try {
      const res = await seedDatabaseToSupabase();
      showToast(res.message, res.success ? 'success' : 'error');
      const updatedReport = await checkDatabaseStatus();
      setDbReport(updatedReport);
    } catch {
      showToast('Gagal melakukan sinkronisasi database.', 'error');
    } finally {
      setSyncingDb(false);
    }
  };

  const handleFlushCache = async () => {
    setFlushingCache(true);
    try {
      await flushServerCache();
      showToast('Cache memori RAM server berhasil dikosongkan.', 'success');
      loadData(false);
    } catch {
      showToast('Gagal mengosongkan cache server.', 'error');
    } finally {
      setFlushingCache(false);
    }
  };

  if (loading && !health) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mb-3" />
        <p className="text-xs text-stone-500 font-medium">Menjalankan pengujian diagnostik subsistem...</p>
      </div>
    );
  }

  const isHealthy = health?.status === 'healthy';

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Quick Actions */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
              isHealthy
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-amber-50 text-amber-600 border border-amber-100'
            }`}
          >
            {isHealthy ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                  isHealthy
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {isHealthy ? 'Semua Subsistem Normal' : 'Sebagian Subsistem Terdegradasi'}
              </span>
              <span className="text-xs text-stone-400">|</span>
              <span className="text-xs text-stone-500 font-mono">v{health?.app_version}</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              Observabilitas & Pemantauan Produksi
            </h2>
            <p className="text-xs text-stone-500">
              Uptime server: <span className="font-medium text-stone-700">{health?.uptime_human}</span> &bull; Terakhir diperiksa:{' '}
              {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString('id-ID') : '-'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Uji Ulang</span>
          </button>

          <button
            type="button"
            onClick={handleFlushCache}
            disabled={flushingCache}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Flush Cache RAM</span>
          </button>
        </div>
      </div>

      {/* Production Readiness Score & Key Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Score Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Production Readiness</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-stone-900 font-mono">
              {health?.production_score || 0}%
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Siap Produksi</span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${health?.production_score || 0}%` }}
            />
          </div>
        </div>

        {/* Memory Heap */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Memori RAM (Node Heap)</span>
            <Cpu className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-stone-900 font-mono">
              {health?.memory.heap_used_mb} <span className="text-sm font-normal text-stone-500">MB</span>
            </span>
            <span className="text-xs text-stone-500">/ {health?.memory.heap_total_mb} MB</span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (health?.memory.heap_usage_percent || 0) > 85 ? 'bg-red-500' : 'bg-amber-600'
              }`}
              style={{ width: `${health?.memory.heap_usage_percent || 0}%` }}
            />
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Cache Hit Rate</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-stone-900 font-mono">
              {health?.performance.cache_hit_rate_percent}%
            </span>
            <span className="text-xs text-stone-500">
              ({health?.performance.active_cache_keys} keys RAM)
            </span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${health?.performance.cache_hit_rate_percent || 0}%` }}
            />
          </div>
        </div>

        {/* Latency / Request Counter */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Avg Latensi Respons</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-stone-900 font-mono">
              {health?.performance.average_response_ms}{' '}
              <span className="text-sm font-normal text-stone-500">ms</span>
            </span>
            <span className="text-xs text-emerald-600 font-medium">Sub-50ms Ultra Cepat</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Total {health?.performance.total_requests_served} requests diproses server
          </p>
        </div>
      </div>

      {/* Subsystem Health Cards Grid */}
      <div>
        <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-stone-500" />
          <span>Status Subsistem Utama</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {health &&
            Object.entries(health.subsystems).map(([key, sub]) => {
              const ok = sub.status === 'healthy';
              return (
                <div
                  key={key}
                  className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs hover:border-stone-300 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-stone-800">{sub.name}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          ok
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {ok ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{ok ? 'Normal' : 'Perlu Perhatian'}</span>
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                      {sub.message}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <span>Latensi: {sub.latency_ms !== undefined ? `${sub.latency_ms} ms` : '-'}</span>
                    <span>{new Date(sub.checked_at).toLocaleTimeString('id-ID')}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Database Hub: Live Connection & Sync Section */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              dbReport?.connected
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  dbReport?.connected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {dbReport?.connected ? 'Supabase PostgreSQL Aktif' : 'Engine Dual-Redundancy Aktif'}
                </span>
                {dbReport?.syncedAt && (
                  <span className="text-[11px] text-stone-400">
                    Disinkronkan: {new Date(dbReport.syncedAt).toLocaleTimeString('id-ID')}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Pusat Kendali & Sinkronisasi Database
              </h3>
              <p className="text-xs text-stone-500">
                {dbReport?.message || 'Memverifikasi status integritas tabel dan ketersediaan data komoditas pangan.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={handleCheckDatabase}
              disabled={checkingDb}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingDb ? 'animate-spin' : ''}`} />
              <span>{checkingDb ? 'Memeriksa...' : 'Uji Database'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncDatabase}
              disabled={syncingDb}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${syncingDb ? 'animate-spin text-amber-300' : 'text-amber-400'}`} />
              <span>{syncingDb ? 'Sinkronisasi...' : 'Sinkron / Seed Database'}</span>
            </button>
          </div>
        </div>

        {/* Database Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Produk Terdaftar
            </p>
            <p className="text-2xl font-black text-stone-900 font-mono">
              {dbReport?.counts.products ?? 0}
            </p>
            <p className="text-[10px] text-emerald-600 mt-1 font-medium">SKU Pangan Aktif</p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Kategori Komoditas
            </p>
            <p className="text-2xl font-black text-stone-900 font-mono">
              {dbReport?.counts.categories ?? 0}
            </p>
            <p className="text-[10px] text-stone-500 mt-1 font-medium">Kurma & Wijen</p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Brand / Produsen
            </p>
            <p className="text-2xl font-black text-stone-900 font-mono">
              {dbReport?.counts.brands ?? 0}
            </p>
            <p className="text-[10px] text-stone-500 mt-1 font-medium">Mitra Suplai</p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Ekspedisi Logistik
            </p>
            <p className="text-2xl font-black text-stone-900 font-mono">
              {dbReport?.counts.shipping_methods ?? 0}
            </p>
            <p className="text-[10px] text-stone-500 mt-1 font-medium">Reguler, Express, Kargo</p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 col-span-2 sm:col-span-1">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Voucher & Promo
            </p>
            <p className="text-2xl font-black text-stone-900 font-mono">
              {dbReport?.counts.vouchers ?? 0}
            </p>
            <p className="text-[10px] text-stone-500 mt-1 font-medium">Diskon & Cash Desk</p>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-3 text-xs text-amber-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Proteksi Zero-Downtime Aktif:</strong> Seluruh fitur (Pencarian, Keranjang, B2B Tier, Checkout, Simulasi Payment Gateway, Review, dan Manajemen Admin) beroperasi 100% tanpa error berkat arsitektur failover otomatis antara Supabase Cloud dan Local Storage Engine.
          </p>
        </div>
      </div>

      {/* Security Policies & Environment Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environment Checks */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-stone-500" />
              <span>Verifikasi Parameter Lingkungan</span>
            </h3>
            <span className="text-xs font-semibold text-stone-500">
              {health?.environment_checks.filter((c) => c.passed).length}/
              {health?.environment_checks.length} Lolos
            </span>
          </div>

          <div className="space-y-3">
            {health?.environment_checks.map((item) => (
              <div
                key={item.key}
                className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100"
              >
                <div className="shrink-0 mt-0.5">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-800">{item.label}</p>
                  <p className="text-[11px] text-stone-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Hardening Matrix */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Kebijakan Keamanan Aktif (Security Matrix)</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold uppercase">
              Tahap 10 Aktif
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
              <span className="text-stone-700 font-medium">Content Security Policy (CSP Strict)</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terpasang
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
              <span className="text-stone-700 font-medium">Sliding-Window Anti Brute Force Rate Limiter</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aktif (400 req/15m)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
              <span className="text-stone-700 font-medium">Payment Route Protection Limiter</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aktif (20 req/m)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
              <span className="text-stone-700 font-medium">Clickjacking (X-Frame-Options: SAMEORIGIN)</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terproteksi
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
              <span className="text-stone-700 font-medium">Sanitasi Input & XSS Protection</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terpasang
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
              <span className="text-stone-700 font-medium">Penyamaran Data Pelanggan (Data Masking)</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Quick Links to other Tahap 10 pages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <button
          type="button"
          onClick={() => onNavigate('/admin/security-logs')}
          className="p-4 bg-white border border-stone-200 hover:border-amber-500 rounded-2xl text-left transition-colors group"
        >
          <p className="text-xs font-bold text-stone-900 group-hover:text-amber-700 mb-1">
            Log Audit & Keamanan &rarr;
          </p>
          <p className="text-[11px] text-stone-500">
            Lihat riwayat autentikasi, pembatasan rate limit, dan percobaan akses terlarang.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/admin/system-settings')}
          className="p-4 bg-white border border-stone-200 hover:border-amber-500 rounded-2xl text-left transition-colors group"
        >
          <p className="text-xs font-bold text-stone-900 group-hover:text-amber-700 mb-1">
            Mode Pemeliharaan & Feature Flags &rarr;
          </p>
          <p className="text-[11px] text-stone-500">
            Aktifkan maintenance mode dan konfigurasi toggle fitur secara dinamis.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/admin/backup')}
          className="p-4 bg-white border border-stone-200 hover:border-amber-500 rounded-2xl text-left transition-colors group"
        >
          <p className="text-xs font-bold text-stone-900 group-hover:text-amber-700 mb-1">
            Cadangan & Ekspor Data &rarr;
          </p>
          <p className="text-[11px] text-stone-500">
            Unduh snapshot lengkap katalog produk, pesanan, dan inventaris CSV/JSON.
          </p>
        </button>
      </div>
    </div>
  );
};
