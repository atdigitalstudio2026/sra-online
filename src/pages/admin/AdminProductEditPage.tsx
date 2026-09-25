import React, { useState, useEffect } from 'react';
import { Category, Brand, ProductWithDetails, ProductFormData } from '../../types';
import { ProductForm } from '../../components/admin/ProductForm';
import { getProductById, updateProduct } from '../../services/productService';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../components/common/Toast';
import { ArrowLeft } from 'lucide-react';

interface AdminProductEditPageProps {
  productId: string;
  categories: Category[];
  brands: Brand[];
  onNavigate: (path: string) => void;
}

export const AdminProductEditPage: React.FC<AdminProductEditPageProps> = ({
  productId,
  categories,
  brands,
  onNavigate,
}) => {
  const { success, error } = useToast();
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getProductById(productId);
        if (!data) {
          setLoadError('Produk tidak ditemukan atau telah dihapus.');
        } else {
          setProduct(data);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat data produk.';
        setLoadError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [productId]);

  const handleSubmit = async (formData: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const updated = await updateProduct(productId, formData);
      success(`Produk "${updated.name}" berhasil diperbarui.`);
      onNavigate('/admin/products');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui produk.';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Memuat informasi produk..." fullHeight />;
  }

  if (loadError || !product) {
    return (
      <ErrorState
        title="Gagal Memuat Produk"
        message={loadError || 'Data produk tidak ditemukan.'}
        onRetry={() => onNavigate('/admin/products')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('/admin/products')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Produk</span>
          </button>
          <h2 className="text-xl font-bold text-stone-900">
            Edit Produk: {product.name}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Perbarui data harga, informasi stok, spesifikasi, dan urutan foto produk.
          </p>
        </div>
      </div>

      <ProductForm
        initialData={product}
        categories={categories}
        brands={brands}
        onSubmit={handleSubmit}
        onCancel={() => onNavigate('/admin/products')}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
