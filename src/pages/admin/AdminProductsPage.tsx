import React, { useState, useEffect, useCallback } from 'react';
import { ProductWithDetails, Category } from '../../types';
import {
  getProducts,
  deleteProduct,
  toggleProductActive,
  toggleProductFeatured,
  toggleProductBestSeller,
} from '../../services/productService';
import { formatRupiah, formatWeight } from '../../utils/formatters';
import { ProductImageFallback } from '../../components/common/ProductImageFallback';
import { Pagination } from '../../components/common/Pagination';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../components/common/Toast';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  Flame,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface AdminProductsPageProps {
  categories: Category[];
  onNavigate: (path: string) => void;
}

export const AdminProductsPage: React.FC<AdminProductsPageProps> = ({
  categories,
  onNavigate,
}) => {
  const { success, error } = useToast();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<ProductWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeFilter =
        selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined;

      const res = await getProducts({
        page,
        limit,
        search,
        category_id: selectedCategory || undefined,
        is_active: activeFilter,
        sort_by: 'created_at',
        sort_order: 'desc',
      });

      setProducts(res.data);
      setTotal(res.total);
    } catch (err) {
      error('Gagal mengambil daftar produk.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, selectedCategory, selectedStatus, error]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Toggle Active
  const handleToggleActive = async (product: ProductWithDetails) => {
    try {
      const newStatus = await toggleProductActive(product.id, product.is_active);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: newStatus } : p))
      );
      success(
        `Produk "${product.name}" sekarang ${newStatus ? 'aktif' : 'dinonaktifkan'}.`
      );
    } catch (err) {
      error('Gagal mengubah status aktif produk.');
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (product: ProductWithDetails) => {
    try {
      const newStatus = await toggleProductFeatured(product.id, product.is_featured);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_featured: newStatus } : p))
      );
      success(
        `Status unggulan produk "${product.name}" ${newStatus ? 'diaktifkan' : 'dihapus'}.`
      );
    } catch (err) {
      error('Gagal mengubah status produk unggulan.');
    }
  };

  // Toggle Best Seller
  const handleToggleBestSeller = async (product: ProductWithDetails) => {
    try {
      const newStatus = await toggleProductBestSeller(product.id, product.is_best_seller);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_best_seller: newStatus } : p))
      );
      success(
        `Status Best Seller produk "${product.name}" ${newStatus ? 'diaktifkan' : 'dihapus'}.`
      );
    } catch (err) {
      error('Gagal mengubah status best seller.');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      success(`Produk "${productToDelete.name}" berhasil dihapus.`);
      setProductToDelete(null);
      fetchList();
    } catch (err) {
      error('Gagal menghapus produk.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Manajemen Produk</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Daftar lengkap katalog produk, harga, kuantitas stok, dan status publikasi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/admin/products/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari berdasarkan nama atau SKU produk..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-400"
          />
        </div>

        {/* Category filter */}
        <div className="w-full sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-hidden focus:border-stone-400"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="w-full sm:w-40">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as any);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-hidden focus:border-stone-400"
          >
            <option value="all">Semua Status</option>
            <option value="active">Hanya Aktif</option>
            <option value="inactive">Hanya Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <LoadingState message="Memuat daftar produk..." />
        ) : products.length === 0 ? (
          <EmptyState
            title="Tidak ada produk ditemukan."
            description="Coba ubah kata kunci pencarian atau sesuaikan filter untuk melihat produk lainnya."
            actionLabel="Reset Pencarian"
            onAction={() => {
              setSearch('');
              setSelectedCategory('');
              setSelectedStatus('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Harga Jual</th>
                  <th className="py-3 px-4">Stok</th>
                  <th className="py-3 px-4 text-center">Aktif</th>
                  <th className="py-3 px-4 text-center">Featured</th>
                  <th className="py-3 px-4 text-center">Best Seller</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {products.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = !isOutOfStock && p.stock <= p.low_stock_threshold;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Product Name & Thumbnail */}
                      <td className="py-3 px-4 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-100">
                          <ProductImageFallback
                            src={p.primary_image}
                            alt={p.name}
                            aspectRatio="square"
                            categorySlug={p.category?.slug}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-stone-900 block truncate max-w-[200px] sm:max-w-xs">
                            {p.name}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            {formatWeight(p.weight, p.unit)}
                          </span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-stone-600">{p.sku}</td>

                      {/* Kategori */}
                      <td className="py-3 px-4 text-stone-600">{p.category?.name || '-'}</td>

                      {/* Harga */}
                      <td className="py-3 px-4 font-semibold text-stone-900 tabular-nums">
                        {formatRupiah(p.price)}
                      </td>

                      {/* Stok */}
                      <td className="py-3 px-4 tabular-nums">
                        {isOutOfStock ? (
                          <span className="text-rose-600 font-semibold">0 (Habis)</span>
                        ) : isLowStock ? (
                          <span className="text-amber-700 font-semibold">{p.stock} (Rendah)</span>
                        ) : (
                          <span className="text-stone-700">{p.stock}</span>
                        )}
                      </td>

                      {/* Status Aktif Switch */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          title={p.is_active ? 'Nonaktifkan produk' : 'Aktifkan produk'}
                          className={`p-1 rounded-md transition-colors ${
                            p.is_active
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5 fill-current/20" />
                        </button>
                      </td>

                      {/* Featured Switch */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(p)}
                          title={p.is_featured ? 'Hapus dari featured' : 'Jadikan featured'}
                          className={`p-1 rounded-md transition-colors ${
                            p.is_featured
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${p.is_featured ? 'fill-amber-500' : ''}`} />
                        </button>
                      </td>

                      {/* Best Seller Switch */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleBestSeller(p)}
                          title={p.is_best_seller ? 'Hapus dari Best Seller' : 'Tandai Best Seller'}
                          className={`p-1 rounded-md transition-colors ${
                            p.is_best_seller
                              ? 'text-rose-500 hover:bg-rose-50'
                              : 'text-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          <Flame className={`w-4 h-4 ${p.is_best_seller ? 'fill-rose-500' : ''}`} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onNavigate(`/admin/products/${p.id}/edit`)}
                            title="Edit Produk"
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(p)}
                            title="Hapus Produk"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-5">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit) || 1}
            totalItems={total}
            limit={limit}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Konfirmasi Hapus Produk</h3>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus produk{' '}
              <strong className="text-stone-900">{productToDelete.name}</strong> (SKU:{' '}
              {productToDelete.sku})? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
