import React, { useState, useEffect } from 'react';
import { Content, ContentType, ContentStatus, ProductWithDetails } from '../../types';
import {
  getContentBySlug,
  getContents,
  createContent,
  updateContent,
} from '../../services/contentService';
import { getProducts } from '../../services/productService';
import { slugify } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';
import { siteConfig } from '../../config/site';
import {
  ArrowLeft,
  Check,
  Loader2,
  BookOpen,
  Package,
  Sparkles,
  Eye,
} from 'lucide-react';

interface AdminContentEditPageProps {
  contentId?: string;
  onNavigate: (path: string) => void;
}

export const AdminContentEditPage: React.FC<AdminContentEditPageProps> = ({
  contentId,
  onNavigate,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(Boolean(contentId));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [contentType, setContentType] = useState<ContentType>('article');
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [authorName, setAuthorName] = useState('Tim Ahli Pangan');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Available & Selected Products
  const [allProducts, setAllProducts] = useState<ProductWithDetails[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Load existing content if editing
  useEffect(() => {
    async function loadInitial() {
      // 1. Load catalog products for relation picker
      try {
        const pRes = await getProducts({ limit: 50 });
        setAllProducts(pRes.data);
      } catch {}

      // 2. Load content if editing
      if (contentId) {
        setLoading(true);
        try {
          const list = await getContents();
          const item = list.find((c) => c.id === contentId);
          if (item) {
            setTitle(item.title);
            setSlug(item.slug);
            setIsSlugManual(true);
            setExcerpt(item.excerpt || '');
            setBodyContent(item.content || '');
            setFeaturedImage(item.featured_image || '');
            setContentType(item.content_type);
            setStatus(item.status);
            setAuthorName(item.author_name || 'Admin');
            setSeoTitle(item.seo_title || '');
            setSeoDescription(item.seo_description || '');

            // Load linked related products
            const detailed = await getContentBySlug(item.slug);
            if (detailed?.related_products) {
              setSelectedProductIds(detailed.related_products.map((p) => p.id));
            }
          }
        } catch (e) {
          console.warn('Failed loading content for edit:', e);
        } finally {
          setLoading(false);
        }
      }
    }
    loadInitial();
  }, [contentId]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugManual) {
      setSlug(slugify(val));
    }
  };

  const handleToggleProduct = (pid: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bodyContent.trim()) {
      error('Judul artikel dan isi konten wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        excerpt: excerpt.trim(),
        content: bodyContent.trim(),
        featured_image: featuredImage.trim() || null,
        content_type: contentType,
        status,
        author_name: authorName.trim(),
        published_at: status === 'published' ? now : null,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
      };

      if (contentId) {
        await updateContent(contentId, payload, selectedProductIds);
        success('Konten berhasil diperbarui!');
      } else {
        await createContent(payload, selectedProductIds);
        success('Konten baru berhasil dibuat!');
      }

      onNavigate('/admin/content');
    } catch (err: any) {
      error(err.message || 'Gagal menyimpan konten.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-stone-400">Memuat editor konten...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <button
          type="button"
          onClick={() => onNavigate('/admin/content')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Manajemen Konten</span>
        </button>

        <h1 className="font-serif text-lg font-bold text-stone-900">
          {contentId ? 'Edit Konten Artikel' : 'Tulis Artikel & Panduan Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 text-xs">
        {/* 1. Informasi Utama */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
            1. Konten Utama
          </h2>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Judul Artikel <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Contoh: Panduan Memilih Kurma Ajwa Grade A"
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm font-medium focus:ring-1 focus:ring-amber-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Slug URL (Otomatis SEO-Friendly)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManual(true);
                }}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-amber-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Tipe Konten
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
              >
                <option value="buying_guide">Panduan Belanja (Buying Guide)</option>
                <option value="product_guide">Karakteristik Produk (Product Guide)</option>
                <option value="article">Artikel Edukasi (Article)</option>
                <option value="news">Berita & Informasi Pasar (News)</option>
                <option value="promotion_landing">Halaman Khusus Promosi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Ringkasan / Excerpt (Lead Paragraph)
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Ringkasan singkat isi artikel untuk tampilan katalog dan cuplikan media sosial..."
              className="w-full px-3.5 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Isi Konten Lengkap (Mendukung Subheading ## dan List *) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={12}
              required
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
              placeholder="Tulis artikel lengkap di sini..."
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg font-sans text-xs focus:ring-1 focus:ring-amber-900 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                URL Gambar Utama (Featured Image)
              </label>
              <input
                type="url"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Nama Penulis / Kontributor
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Produk Terkait Artikel (Section 20) */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
              2. Kaitan Produk Komoditas Terkait (Related Products - Section 20)
            </h2>
            <p className="text-stone-500 mt-0.5">
              Pilih komoditas yang relevan dengan bahasan artikel ini untuk ditampilkan di bagian bawah halaman.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-2 border border-stone-200 rounded-xl bg-stone-50/50">
            {allProducts.map((p) => {
              const isChecked = selectedProductIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-white border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleProduct(p.id)}
                    className="rounded text-amber-900 focus:ring-amber-900"
                  />
                  <div className="truncate">
                    <span className="font-semibold text-stone-900 block truncate">{p.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">SKU: {p.sku}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* 3. Metadata SEO Mesin Pencari */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
            3. Optimasi SEO Mesin Pencari (Google)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                SEO Title (Tag Judul)
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={`${title || 'Judul Artikel'} | ${siteConfig.name}`}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                SEO Meta Description
              </label>
              <textarea
                rows={2}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder={excerpt || 'Deskripsi cuplikan di Google...'}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-900 focus:outline-none"
              />
            </div>

            {/* Google Preview */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                Pratinjau Hasil Pencarian Google
              </span>
              <div className="text-xs text-emerald-800 font-mono">
                https://sra-store.id/blog/{slug || 'judul-artikel'}
              </div>
              <div className="text-sm font-medium text-blue-800 hover:underline cursor-pointer">
                {seoTitle || (title ? `${title} | ${siteConfig.name}` : `Judul Artikel | ${siteConfig.name}`)}
              </div>
              <div className="text-xs text-stone-600 line-clamp-2">
                {seoDescription || excerpt || 'Wawasan dan panduan mutu bahan pangan pilihan terlengkap.'}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Status Publikasi */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="font-semibold text-stone-800 block">Status Publikasi</span>
            <span className="text-[11px] text-stone-500">
              Draf tidak akan tampil di halaman publik hingga Anda menerbitkannya.
            </span>
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ContentStatus)}
            className="px-3.5 py-2 border border-stone-300 rounded-lg font-semibold focus:ring-1 focus:ring-amber-900 focus:outline-none"
          >
            <option value="draft">Draf (Draft)</option>
            <option value="published">Terbitkan (Published)</option>
            <option value="archived">Arsipkan (Archived)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={() => onNavigate('/admin/content')}
            className="px-5 py-2.5 font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 font-semibold text-white bg-amber-900 hover:bg-amber-800 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{contentId ? 'Simpan Perubahan' : 'Simpan Artikel'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
