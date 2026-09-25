import React, { useState, useEffect, useRef } from 'react';
import { ProductFormData, Category, Brand, ProductWithDetails } from '../../types';
import { slugify } from '../../utils/formatters';
import { siteConfig } from '../../config/site';
import {
  Upload,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  AlertCircle,
  Plus,
  Loader2,
  Check,
} from 'lucide-react';
import { ProductImageFallback } from '../common/ProductImageFallback';

interface ProductFormProps {
  initialData?: ProductWithDetails | null;
  categories: Category[];
  brands: Brand[];
  onSubmit: (formData: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  brands,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  // Form State
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(Boolean(initialData));
  const [sku, setSku] = useState(initialData?.sku || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || (categories[0]?.id || ''));
  const [brandId, setBrandId] = useState(initialData?.brand_id || '');
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || '');
  const [description, setDescription] = useState(initialData?.description || '');

  // Pricing & Inventory
  const [price, setPrice] = useState<number | string>(initialData?.price ?? '');
  const [comparePrice, setComparePrice] = useState<number | string>(initialData?.compare_price ?? '');
  const [costPrice, setCostPrice] = useState<number | string>(initialData?.cost_price ?? '');
  const [weight, setWeight] = useState<number | string>(initialData?.weight ?? 1);
  const [unit, setUnit] = useState<string>(initialData?.unit || siteConfig.catalog.defaultUnit);
  const [stock, setStock] = useState<number | string>(initialData?.stock ?? 100);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(
    initialData?.low_stock_threshold ?? 10
  );

  // Flags
  const [isActive, setIsActive] = useState<boolean>(initialData?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState<boolean>(initialData?.is_featured ?? false);
  const [isBestSeller, setIsBestSeller] = useState<boolean>(initialData?.is_best_seller ?? false);

  // SEO Fields (Section 3, 6)
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description || '');
  const [seoKeywords, setSeoKeywords] = useState(initialData?.seo_keywords || '');
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonical_url || '');

  // Images state
  const [images, setImages] = useState<ProductFormData['images']>(
    initialData?.images?.map((img, idx) => ({
      id: img.id,
      image_url: img.image_url,
      alt_text: img.alt_text || '',
      sort_order: img.sort_order || idx + 1,
      is_primary: img.is_primary,
    })) || []
  );

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update slug automatically when name changes (if not manually overridden)
  useEffect(() => {
    if (!isSlugManuallyEdited && name) {
      setSlug(slugify(name));
    }
  }, [name, isSlugManuallyEdited]);

  // Set default category if not selected
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  // Handle Image File Uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const newImages: ProductFormData['images'] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          images: 'Format file harus JPG, JPEG, PNG, atau WEBP.',
        }));
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          images: 'Ukuran file per gambar maksimal 5 MB.',
        }));
        continue;
      }

      // Generate object URL for instant preview
      const previewUrl = URL.createObjectURL(file);
      const isFirst = images.length === 0 && newImages.length === 0;

      newImages.push({
        id: crypto.randomUUID(),
        image_url: previewUrl,
        alt_text: name || file.name,
        sort_order: images.length + newImages.length + 1,
        is_primary: isFirst,
        file,
      });
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.images;
        return next;
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add Image via Direct URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    try {
      new URL(imageUrlInput);
    } catch {
      setErrors((prev) => ({ ...prev, images: 'URL gambar tidak valid.' }));
      return;
    }

    const isFirst = images.length === 0;
    setImages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        image_url: imageUrlInput.trim(),
        alt_text: name,
        sort_order: prev.length + 1,
        is_primary: isFirst,
      },
    ]);
    setImageUrlInput('');
    setErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });
  };

  // Primary image selector
  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        is_primary: idx === index,
      }))
    );
  };

  // Move image up/down
  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated.map((img, idx) => ({ ...img, sort_order: idx + 1 }));
    });
  };

  // Delete image
  const handleDeleteImage = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      // If deleted image was primary, set first as primary
      if (updated.length > 0 && !updated.some((i) => i.is_primary)) {
        updated[0].is_primary = true;
      }
      return updated.map((img, idx) => ({ ...img, sort_order: idx + 1 }));
    });
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Nama produk wajib diisi.';
    if (!sku.trim()) newErrors.sku = 'SKU produk wajib diisi.';
    if (!categoryId) newErrors.categoryId = 'Kategori produk wajib dipilih.';

    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = 'Harga wajib diisi dengan nominal lebih dari 0.';
    }

    const numStock = Number(stock);
    if (stock === '' || isNaN(numStock) || numStock < 0) {
      newErrors.stock = 'Stok tidak boleh bernilai negatif.';
    }

    const numWeight = Number(weight);
    if (weight === '' || isNaN(numWeight) || numWeight <= 0) {
      newErrors.weight = 'Berat produk wajib lebih dari 0.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: ProductFormData = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      sku: sku.trim().toUpperCase(),
      category_id: categoryId,
      brand_id: brandId || '',
      short_description: shortDescription.trim(),
      description: description.trim(),
      price: Number(price),
      compare_price: comparePrice ? Number(comparePrice) : null,
      cost_price: costPrice ? Number(costPrice) : null,
      weight: Number(weight),
      unit: unit.trim() || 'kg',
      stock: Number(stock),
      low_stock_threshold: Number(lowStockThreshold || 10),
      is_active: isActive,
      is_featured: isFeatured,
      is_best_seller: isBestSeller,
      seo_title: seoTitle.trim() || undefined,
      seo_description: seoDescription.trim() || undefined,
      seo_keywords: seoKeywords.trim() || undefined,
      canonical_url: canonicalUrl.trim() || undefined,
      images,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Informasi Utama */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
          1. Informasi Utama Produk
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nama Produk */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Nama Produk <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kurma Ajwa Madinah 500g, Bawang Putih Kating 1kg..."
              className={`w-full px-3.5 py-2 text-sm bg-stone-50/50 border rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.name
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-stone-200 focus:border-stone-400 focus:ring-stone-900/5'
              }`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* SKU */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="KRM-AJW-500"
              className={`w-full px-3.5 py-2 text-sm font-mono bg-stone-50/50 border rounded-lg uppercase focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.sku
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-stone-200 focus:border-stone-400 focus:ring-stone-900/5'
              }`}
            />
            {errors.sku && <p className="text-xs text-rose-500 mt-1">{errors.sku}</p>}
          </div>

          {/* Slug URL */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Slug URL Produk
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setIsSlugManuallyEdited(true);
                setSlug(e.target.value);
              }}
              placeholder="kurma-ajwa-madinah-500g"
              className="w-full px-3.5 py-2 text-sm font-mono bg-stone-50/50 border border-stone-200 rounded-lg text-stone-700 focus:bg-white focus:outline-hidden focus:border-stone-400"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Otomatis dihasilkan dari nama produk (dapat disesuaikan jika perlu).
            </p>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Kategori <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-hidden focus:ring-2 ${
                errors.categoryId
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-stone-200 focus:border-stone-400 focus:ring-stone-900/5'
              }`}
            >
              <option value="">Pilih Kategori Produk</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-xs text-rose-500 mt-1">{errors.categoryId}</p>
            )}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Brand / Produsen
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-400"
            >
              <option value="">Tanpa Brand / Polos</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Deskripsi Singkat */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Deskripsi Singkat (Ringkasan Katalog)
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Contoh: Kurma Ajwa Al-Madinah asli kemasan higienis, tekstur lembut dan manis legit alami."
              className="w-full px-3.5 py-2 text-sm bg-stone-50/50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-stone-400"
            />
          </div>

          {/* Deskripsi Lengkap */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Deskripsi Lengkap & Spesifikasi Produk
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan spesifikasi produk, asal komoditas, standar mutu, petunjuk penyimpanan, atau informasi pengiriman grosir..."
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50/50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-stone-400 leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* 2. Harga & Berat */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
          2. Harga & Spesifikasi Fisik
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Harga Jual */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Harga Jual (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="45000"
              className={`w-full px-3.5 py-2 text-sm tabular-nums bg-stone-50/50 border rounded-lg focus:bg-white focus:outline-hidden ${
                errors.price
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-stone-200 focus:border-stone-400'
              }`}
            />
            {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price}</p>}
          </div>

          {/* Harga Coret */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Harga Coret (Sebelum Diskon)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={comparePrice}
              onChange={(e) => setComparePrice(e.target.value)}
              placeholder="55000 (opsional)"
              className="w-full px-3.5 py-2 text-sm tabular-nums bg-stone-50/50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-stone-400"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Kosongkan jika produk tidak memiliki harga promo.
            </p>
          </div>

          {/* Harga Modal */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Harga Modal (HPP Internal)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="32000 (opsional)"
              className="w-full px-3.5 py-2 text-sm tabular-nums bg-stone-50/50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-stone-400"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Hanya terlihat di dashboard admin.
            </p>
          </div>

          {/* Berat */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Berat <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="1"
              className={`w-full px-3.5 py-2 text-sm tabular-nums bg-stone-50/50 border rounded-lg focus:bg-white focus:outline-hidden ${
                errors.weight
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-stone-200 focus:border-stone-400'
              }`}
            />
            {errors.weight && <p className="text-xs text-rose-500 mt-1">{errors.weight}</p>}
          </div>

          {/* Satuan */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Satuan Berat / Kemasan
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-400"
            >
              {siteConfig.catalog.units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Manajemen Stok & Status */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
          3. Manajemen Stok & Visibilitas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Stok Tersedia */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Jumlah Stok Tersedia <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="100"
              className={`w-full px-3.5 py-2 text-sm tabular-nums bg-stone-50/50 border rounded-lg focus:bg-white focus:outline-hidden ${
                errors.stock
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-stone-200 focus:border-stone-400'
              }`}
            />
            {errors.stock && <p className="text-xs text-rose-500 mt-1">{errors.stock}</p>}
          </div>

          {/* Batas Minimum Stok */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Batas Peringatan Stok Rendah
            </label>
            <input
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              placeholder="10"
              className="w-full px-3.5 py-2 text-sm tabular-nums bg-stone-50/50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-stone-400"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Admin akan diperingatkan jika stok tersisa sama atau kurang dari nilai ini.
            </p>
          </div>
        </div>

        {/* Status Switches */}
        <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-amber-900 border-stone-300 focus:ring-amber-900"
            />
            <div>
              <span className="text-xs font-semibold text-stone-800 block">Produk Aktif</span>
              <span className="text-[11px] text-stone-500">Tampil di katalog pembeli</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded text-amber-900 border-stone-300 focus:ring-amber-900"
            />
            <div>
              <span className="text-xs font-semibold text-stone-800 block">Produk Unggulan</span>
              <span className="text-[11px] text-stone-500">Tampil di Featured Beranda</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="w-4 h-4 rounded text-amber-900 border-stone-300 focus:ring-amber-900"
            />
            <div>
              <span className="text-xs font-semibold text-stone-800 block">Best Seller</span>
              <span className="text-[11px] text-stone-500">Tampil di Terlaris Beranda</span>
            </div>
          </label>
        </div>
      </div>

      {/* 4. Manajemen Foto Produk */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
              4. Foto & Galeri Produk
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Upload foto langsung ke Supabase Storage atau masukkan URL gambar.
            </p>
          </div>
          <span className="text-xs text-stone-400 tabular-nums">
            {images.length} foto terpilih
          </span>
        </div>

        {/* Upload inputs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* File upload button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              id="product-file-upload"
            />
            <label
              htmlFor="product-file-upload"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4 text-stone-600" />
              <span>Upload Gambar dari Perangkat</span>
            </label>

            {/* Direct URL input */}
            <div className="flex-1 flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Atau masukkan tautan URL gambar (https://...)"
                className="flex-1 px-3 py-2 text-xs bg-stone-50/50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-stone-400"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg transition-colors shrink-0"
              >
                Tambah URL
              </button>
            </div>
          </div>

          {errors.images && (
            <div className="flex items-center gap-2 text-xs text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.images}</span>
            </div>
          )}

          {/* List of uploaded / configured images */}
          {images.length === 0 ? (
            <div className="border border-dashed border-stone-200 rounded-xl p-8 text-center bg-stone-50/50">
              <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-500 font-medium">
                Belum ada foto produk yang ditambahkan.
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Format yang didukung: JPG, PNG, WEBP (maks. 5MB per file).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {images.map((img, index) => (
                <div
                  key={img.id || index}
                  className={`flex flex-col border rounded-xl overflow-hidden bg-white shadow-2xs transition-all ${
                    img.is_primary ? 'border-amber-900 ring-2 ring-amber-900/10' : 'border-stone-200'
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-stone-100">
                    <ProductImageFallback
                      src={img.image_url}
                      alt={img.alt_text || name}
                      aspectRatio="4/3"
                    />

                    {img.is_primary && (
                      <span className="absolute top-2 left-2 bg-amber-900 text-white text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm shadow-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Foto Utama
                      </span>
                    )}
                  </div>

                  <div className="p-3 flex items-center justify-between gap-2 border-t border-stone-100 bg-stone-50/40 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(index)}
                      disabled={img.is_primary}
                      className={`text-[11px] font-medium transition-colors ${
                        img.is_primary
                          ? 'text-amber-900 font-semibold'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      {img.is_primary ? 'Utama' : 'Jadikan Utama'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 'up')}
                        disabled={index === 0}
                        title="Geser ke kiri/atas"
                        className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 'down')}
                        disabled={index === images.length - 1}
                        title="Geser ke kanan/bawah"
                        className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(index)}
                        title="Hapus foto"
                        className="p-1 text-rose-500 hover:text-rose-700 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Optimasi SEO & Metadata Mesin Pencari (Section 3, 6, 7) */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
              5. Optimasi SEO & Metadata Mesin Pencari
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Kustomisasi tag judul, deskripsi pencarian, dan tautan kanonikal untuk mesin pencari Google.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const selectedBrand = brands.find((b) => b.id === brandId);
              setSeoTitle(`${name} | ${selectedBrand ? selectedBrand.name : siteConfig.name}`);
              setSeoDescription(shortDescription || description.slice(0, 150));
              setCanonicalUrl(`/products/${slug || slugify(name)}`);
            }}
            className="text-xs text-amber-900 hover:text-amber-950 font-semibold underline"
          >
            Auto-Generate dari Data Produk
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              SEO Title (Tag Judul Mesin Pencari)
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder={`${name || 'Nama Produk'} | ${siteConfig.name}`}
              className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Jika dikosongkan, sistem otomatis menggunakan: [Nama Produk] + [Brand].
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              SEO Meta Description (Deskripsi Cuplikan Hasil Pencarian)
            </label>
            <textarea
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Deskripsi ringkas yang menarik calon pembeli saat muncul di hasil pencarian..."
              className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Disarankan 120-160 karakter untuk keterbacaan optimal di Google.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Kata Kunci (Keywords, pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="kurma ajwa, kurma madinah asli, grosir kurma"
                className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Canonical URL
              </label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder={`/products/${slug || 'slug-produk'}`}
                className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Real-time Google SERP Snippet Preview */}
          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 mt-4 space-y-1">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
              Pratinjau Hasil Pencarian Google
            </span>
            <div className="text-xs text-emerald-800 font-mono">
              https://sra-store.id/products/{slug || 'nama-produk'}
            </div>
            <div className="text-sm font-medium text-blue-800 hover:underline cursor-pointer">
              {seoTitle || (name ? `${name} | ${siteConfig.name}` : `Nama Produk | ${siteConfig.name}`)}
            </div>
            <div className="text-xs text-stone-600 line-clamp-2">
              {seoDescription || shortDescription || 'Beli komoditas pangan pilihan berkualitas tinggi dengan harga grosir dan retail terbaik.'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-5 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Perbarui Produk' : 'Simpan Produk Baru'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
