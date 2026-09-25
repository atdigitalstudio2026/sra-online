import React, { useState, useEffect } from 'react';
import {
  Download,
  Package,
  ShoppingBag,
  Users,
  Boxes,
  Database,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  HardDriveDownload,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { BackupType, BackupHistoryItem } from '../../types';
import { executeExport, getBackupHistory } from '../../services/backupService';
import { useToast } from '../../components/common/Toast';

interface AdminBackupRestorePageProps {
  onNavigate: (path: string) => void;
}

export const AdminBackupRestorePage: React.FC<AdminBackupRestorePageProps> = () => {
  const [history, setHistory] = useState<BackupHistoryItem[]>([]);
  const [exportingType, setExportingType] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setHistory(getBackupHistory());
  }, []);

  const handleExport = async (type: BackupType, format: 'json' | 'csv') => {
    const key = `${type}-${format}`;
    setExportingType(key);
    try {
      const item = await executeExport(type, format);
      setHistory(getBackupHistory());
      showToast(
        `Ekspor data ${type.toUpperCase()} (${format.toUpperCase()}) berhasil diunduh (${item.record_count} baris).`,
        'success'
      );
    } catch {
      showToast('Gagal melakukan ekspor data.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <HardDriveDownload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Pencadangan Data & Ekspor Bencana (Disaster Recovery)
            </h2>
            <p className="text-xs text-stone-500">
              Unduh salinan berkas komoditas pangan, riwayat pesanan, profil pembeli, dan status gudang ke format CSV atau JSON.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleExport('full', 'json')}
          disabled={exportingType === 'full-json'}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          <Database className="w-4 h-4" />
          <span>{exportingType === 'full-json' ? 'Mengemas...' : 'Unduh Full Snapshot (JSON)'}</span>
        </button>
      </div>

      {/* Export Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Products Catalog */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-stone-900 mb-1">Katalog Produk & SKU</h3>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              Daftar komoditas, varian berat, harga jual, foto, dan status aktif.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => handleExport('catalog', 'csv')}
              disabled={exportingType === 'catalog-csv'}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-medium transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('catalog', 'json')}
              disabled={exportingType === 'catalog-json'}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-medium transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* 2. Orders & Transactions */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-stone-900 mb-1">Pesanan & Transaksi</h3>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              Seluruh riwayat nomor pesanan, metode bayar, total omset, dan kurir.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => handleExport('orders', 'csv')}
              disabled={exportingType === 'orders-csv'}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-medium transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('orders', 'json')}
              disabled={exportingType === 'orders-json'}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-medium transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* 3. Customers */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-stone-900 mb-1">Data Pelanggan (CRM)</h3>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              Nama pelanggan, email, nomor kontak WhatsApp, dan total belanja.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => handleExport('customers', 'csv')}
              disabled={exportingType === 'customers-csv'}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-medium transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('customers', 'json')}
              disabled={exportingType === 'customers-json'}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-medium transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* 4. Inventory */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
              <Boxes className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-stone-900 mb-1">Stok & Inventaris Gudang</h3>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              Tingkat stok fisik komoditas pangan, ambang batas minimum, dan status ketersediaan.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => handleExport('inventory', 'csv')}
              disabled={exportingType === 'inventory-csv'}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-medium transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('inventory', 'json')}
              disabled={exportingType === 'inventory-json'}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-medium transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-500" />
              <span>Riwayat Unduhan Cadangan</span>
            </h3>
            <p className="text-xs text-stone-500">
              Daftar pencadangan data yang pernah diunduh pada sesi peramban ini.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-700 rounded-full font-mono">
            {history.length} berkas
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            <HardDriveDownload className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p>Belum ada riwayat unduhan pencadangan data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Berkas</th>
                  <th className="py-3 px-4">Tipe Data</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Jumlah Baris</th>
                  <th className="py-3 px-4">Ukuran</th>
                  <th className="py-3 px-4">Waktu Ekspor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/80">
                    <td className="py-3 px-4 font-semibold text-stone-800 flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-stone-400" />
                      <span>{item.file_name}</span>
                    </td>
                    <td className="py-3 px-4 uppercase text-stone-600">{item.type}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded font-semibold text-[10px]">
                        {item.format.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-700">{item.record_count} entri</td>
                    <td className="py-3 px-4 text-stone-500">{formatFileSize(item.file_size_bytes)}</td>
                    <td className="py-3 px-4 text-stone-500">
                      {new Date(item.created_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
