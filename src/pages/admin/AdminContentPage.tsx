import React, { useState, useEffect } from 'react';
import { Content, ContentType, ContentStatus } from '../../types';
import { getContents, updateContent, deleteContent } from '../../services/contentService';
import { useToast } from '../../components/common/Toast';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Archive,
  Calendar,
  User,
  Filter,
} from 'lucide-react';

interface AdminContentPageProps {
  onNavigate: (path: string) => void;
}

export const AdminContentPage: React.FC<AdminContentPageProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');

  const loadContents = async () => {
    setLoading(true);
    try {
      const data = await getContents({
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
      });
      setContents(data);
    } catch (e) {
      console.warn('Failed loading contents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContents();
  }, [statusFilter, typeFilter]);

  const handleTogglePublish = async (item: Content) => {
    const newStatus: ContentStatus = item.status === 'published' ? 'draft' : 'published';
    const now = new Date().toISOString();
    try {
      await updateContent(item.id, {
        status: newStatus,
        published_at: newStatus === 'published' ? (item.published_at || now) : null,
      });
      success(`Status konten diubah menjadi ${newStatus}.`);
      loadContents();
    } catch (err: any) {
      error(err.message || 'Gagal mengubah status publikasi.');
    }
  };

  const handleArchive = async (item: Content) => {
    try {
      await updateContent(item.id, { status: 'archived' });
      success('Konten telah diarsipkan.');
      loadContents();
    } catch (err: any) {
      error(err.message || 'Gagal mengarsipkan konten.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus artikel ini?')) {
      try {
        await deleteContent(id);
        success('Konten berhasil dihapus.');
        loadContents();
      } catch (err: any) {
        error(err.message || 'Gagal menghapus konten.');
      }
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Terbit (Published)</span>;
      case 'draft':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">Draf (Draft)</span>;
      case 'archived':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600">Arsip (Archived)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
            Sistem Manajemen Konten (CMS)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Publikasikan artikel, panduan memilih komoditas, ulasan bahan pangan, dan tautkan produk terkait.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/admin/content/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Konten Baru</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-stone-200 text-xs">
        <span className="font-semibold text-stone-700 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter Status:
        </span>
        <div className="flex items-center gap-1.5">
          {(['all', 'published', 'draft', 'archived'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-amber-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st === 'all' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Judul Artikel & Slug</th>
                <th className="py-3 px-4">Tipe Konten</th>
                <th className="py-3 px-4">Penulis</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tanggal Publikasi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    Memuat daftar konten...
                  </td>
                </tr>
              ) : contents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    Belum ada konten yang tersedia.
                  </td>
                </tr>
              ) : (
                contents.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-bold text-stone-900 truncate">{c.title}</div>
                      <div className="font-mono text-[11px] text-stone-400 truncate">
                        /blog/{c.slug}
                      </div>
                    </td>
                    <td className="py-3 px-4 uppercase font-semibold text-[10px] text-stone-600 tracking-wider">
                      {c.content_type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {c.author_name || 'Admin'}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-[11px]">
                      {c.published_at
                        ? new Date(c.published_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {c.status === 'published' && (
                        <button
                          type="button"
                          onClick={() => onNavigate(`/blog/${c.slug}`)}
                          className="p-1 text-stone-500 hover:text-stone-900"
                          title="Lihat Pratinjau Publik"
                        >
                          <Eye className="w-3.5 h-3.5 inline" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(c)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold ${
                          c.status === 'published'
                            ? 'text-amber-800 hover:bg-amber-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {c.status === 'published' ? 'Jadikan Draf' : 'Terbitkan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate(`/admin/content/${c.id}/edit`)}
                        className="p-1 text-stone-500 hover:text-stone-900"
                        title="Edit Konten"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      {c.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() => handleArchive(c)}
                          className="p-1 text-stone-400 hover:text-stone-600"
                          title="Arsipkan"
                        >
                          <Archive className="w-3.5 h-3.5 inline" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="p-1 text-rose-500 hover:text-rose-700"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
