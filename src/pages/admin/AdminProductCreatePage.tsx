import React, { useState } from 'react';
import { Category, Brand, ProductFormData } from '../../types';
import { ProductForm } from '../../components/admin/ProductForm';
import { createProduct } from '../../services/productService';
import { useToast } from '../../components/common/Toast';
import { ArrowLeft } from 'lucide-react';

interface AdminProductCreatePageProps {
  categories: Category[];
  brands: Brand[];
  onNavigate: (path: string) => void;
}

export const AdminProductCreatePage: React.FC<AdminProductCreatePageProps> = ({
  categories,
  brands,
  onNavigate,
}) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const created = await createProduct(formData);
      success(`Produk "${created.name}" berhasil ditambahkan.`);
      onNavigate('/admin/products');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan produk.';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h2 className="text-xl font-bold text-stone-900">Tambah Komoditas Produk Baru</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Lengkapi data spesifikasi, harga, stok, dan galeri foto produk untuk katalog.
          </p>
        </div>
      </div>

      <ProductForm
        categories={categories}
        brands={brands}
        onSubmit={handleSubmit}
        onCancel={() => onNavigate('/admin/products')}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
