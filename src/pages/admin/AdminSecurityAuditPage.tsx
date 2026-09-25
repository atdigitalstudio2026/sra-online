import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Info,
  AlertTriangle,
  AlertOctagon,
  Clock,
  User,
  Globe,
} from 'lucide-react';
import { SecurityAuditEntry, SecurityLogLevel, SecurityLogCategory } from '../../types';
import { getSecurityLogs } from '../../services/securityService';
import { systemLogger } from '../../services/security/systemLogger';
import { downloadFile } from '../../services/backupService';
import { useToast } from '../../components/common/Toast';

interface AdminSecurityAuditPageProps {
  onNavigate: (path: string) => void;
}

export const AdminSecurityAuditPage: React.FC<AdminSecurityAuditPageProps> = () => {
  const [logs, setLogs] = useState<SecurityAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<SecurityLogLevel | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<SecurityLogCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState({ total: 0, info: 0, warn: 0, error: 0, security: 0 });
  const { showToast } = useToast();

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Try fetching from server API first
      const res = await fetch(
        `/api/admin/logs?level=${levelFilter}&category=${categoryFilter}&search=${encodeURIComponent(
          searchQuery
        )}`
      );
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
        if (json.counts) setCounts(json.counts);
      } else {
        // Fallback to local systemLogger
        const local = getSecurityLogs({
          level: levelFilter,
          category: categoryFilter,
          search: searchQuery,
        });
        setLogs(local);
        setCounts(systemLogger.getCounts());
      }
    } catch {
      const local = getSecurityLogs({
        level: levelFilter,
        category: categoryFilter,
        search: searchQuery,
      });
      setLogs(local);
      setCounts(systemLogger.getCounts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [levelFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const filename = `security-logs-${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(jsonStr, filename, 'application/json');
    showToast('Log audit berhasil diekspor ke file JSON.', 'success');
  };

  const handleClearLogs = () => {
    if (confirm('Yakin ingin membersihkan riwayat log memori server?')) {
      systemLogger.clear();
      loadLogs();
      showToast('Log memori berhasil dikosongkan.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Counters */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Log Keamanan & Audit Sistem
              </h2>
              <p className="text-xs text-stone-500">
                Pemantauan aktivitas sensitif, pelanggaran batas rate limit, dan jejak audit server.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={handleExportJson}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor JSON</span>
            </button>

            <button
              type="button"
              onClick={handleClearLogs}
              className="p-2 border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-red-600 rounded-xl transition-colors"
              title="Bersihkan log saat ini"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => setLevelFilter('ALL')}
            className={`p-3 rounded-xl border text-left transition-colors ${
              levelFilter === 'ALL'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-70">
              Total Log
            </span>
            <span className="text-xl font-bold font-mono">{counts.total}</span>
          </button>

          <button
            type="button"
            onClick={() => setLevelFilter('SECURITY')}
            className={`p-3 rounded-xl border text-left transition-colors ${
              levelFilter === 'SECURITY'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50/50 hover:bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-70">
              Security Alert
            </span>
            <span className="text-xl font-bold font-mono">{counts.security}</span>
          </button>

          <button
            type="button"
            onClick={() => setLevelFilter('ERROR')}
            className={`p-3 rounded-xl border text-left transition-colors ${
              levelFilter === 'ERROR'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-red-50/50 hover:bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-70">
              Error Server
            </span>
            <span className="text-xl font-bold font-mono">{counts.error}</span>
          </button>

          <button
            type="button"
            onClick={() => setLevelFilter('WARN')}
            className={`p-3 rounded-xl border text-left transition-colors ${
              levelFilter === 'WARN'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-amber-50/30 hover:bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-70">
              Peringatan (Warn)
            </span>
            <span className="text-xl font-bold font-mono">{counts.warn}</span>
          </button>

          <button
            type="button"
            onClick={() => setLevelFilter('INFO')}
            className={`p-3 rounded-xl border text-left transition-colors ${
              levelFilter === 'INFO'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-blue-50/30 hover:bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-70">
              Informasi (Info)
            </span>
            <span className="text-xl font-bold font-mono">{counts.info}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pesan error, path request, atau IP address..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-amber-600 outline-hidden"
          />
        </form>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span>Kategori:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-transparent font-semibold text-stone-800 outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua</option>
              <option value="auth">Autentikasi</option>
              <option value="rate_limit">Rate Limit</option>
              <option value="payment">Pembayaran</option>
              <option value="inventory">Inventaris</option>
              <option value="system">Sistem</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <button
            type="button"
            onClick={loadLogs}
            className="p-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-stone-600 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
            <span>Memuat rekaman log sistem...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-stone-500">
            <ShieldAlert className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p className="text-xs font-semibold text-stone-700">Tidak Ada Log Terpilih</p>
            <p className="text-[11px] text-stone-400">
              Tidak ada aktivitas yang sesuai dengan kriteria filter saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Pesan Kejadian</th>
                  <th className="py-3 px-4">IP / Path</th>
                  <th className="py-3 px-4">Aktor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((entry) => {
                  let badge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                      <Info className="w-3 h-3 text-stone-500" /> INFO
                    </span>
                  );
                  if (entry.level === 'SECURITY') {
                    badge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <ShieldAlert className="w-3 h-3 text-amber-600" /> SECURITY
                      </span>
                    );
                  } else if (entry.level === 'ERROR') {
                    badge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200">
                        <AlertOctagon className="w-3 h-3 text-red-600" /> ERROR
                      </span>
                    );
                  } else if (entry.level === 'WARN') {
                    badge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> WARN
                      </span>
                    );
                  }

                  return (
                    <tr key={entry.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">{badge}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{new Date(entry.timestamp).toLocaleTimeString('id-ID')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-stone-100 rounded-md text-[10px] font-medium text-stone-700 font-mono">
                          {entry.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-stone-800 font-medium leading-snug">{entry.message}</p>
                        {entry.details && (
                          <pre className="mt-1 text-[10px] font-mono text-stone-500 bg-stone-100 p-1 rounded-sm max-w-md overflow-x-auto">
                            {typeof entry.details === 'string'
                              ? entry.details
                              : JSON.stringify(entry.details)}
                          </pre>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-stone-400" />
                          <span>{entry.ip_address}</span>
                        </div>
                        {entry.path && (
                          <div className="text-[10px] text-stone-400 truncate max-w-[150px]">
                            {entry.path}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-stone-600 text-xs">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-stone-400" />
                          <span>{entry.actor_name || 'System'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
