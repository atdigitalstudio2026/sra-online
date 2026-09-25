import React, { useState, useEffect } from 'react';
import { ContentWithProducts } from '../types';
import { getContentBySlug } from '../services/contentService';
import { updateMetaTags, generateArticleSchema } from '../utils/seo';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { ProductCard } from '../components/product/ProductCard';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { siteConfig } from '../config/site';
import { useToast } from '../components/common/Toast';
import {
  Calendar,
  User,
  Share2,
  Check,
  Package,
  MessageSquare,
  ArrowLeft,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';

interface BlogPostPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug, onNavigate }) => {
  const { success } = useToast();
  const [content, setContent] = useState<ContentWithProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const item = await getContentBySlug(slug);
        if (!item) {
          setError('Artikel yang Anda cari tidak ditemukan atau belum dipublikasikan.');
        } else {
          setContent(item);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat artikel.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Dynamic SEO meta tags and Schema.org Article (Section 19, 62)
  useEffect(() => {
    if (!content) return;

    const canonicalUrl = `/blog/${content.slug}`;
    const articleSchema = generateArticleSchema(content, canonicalUrl);

    return updateMetaTags({
      title: content.seo_title || content.title,
      description: content.seo_description || content.excerpt,
      canonicalUrl,
      ogType: 'article',
      ogImage: content.featured_image || undefined,
      structuredData: articleSchema,
    });
  }, [content]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      success('Tautan artikel berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Baca ulasan menarik: "${content?.title}" di ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = `${content?.title}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(
        window.location.href
      )}`,
      '_blank'
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LoadingState message="Memuat artikel komoditas..." fullHeight />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ErrorState
          title="Artikel Tidak Ditemukan"
          message={error || 'Artikel yang Anda tuju tidak tersedia.'}
          onRetry={() => onNavigate('/blog')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb Navigation (Section 11) */}
      <Breadcrumb
        items={[
          { label: 'Artikel & Panduan', path: '/blog' },
          { label: content.title },
        ]}
        onNavigate={onNavigate}
      />

      {/* Main Article Header */}
      <header className="space-y-4 border-b border-stone-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>{content.content_type.replace('_', ' ')}</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-stone-950 leading-[1.2]">
          {content.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-stone-500">
          <div className="flex items-center gap-4">
            {content.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(content.published_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </span>
            )}
            {content.author_name && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Oleh: {content.author_name}</span>
              </span>
            )}
          </div>

          {/* Social Sharing (Section 62) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-400 mr-1 flex items-center gap-1">
              <Share2 className="w-3 h-3" /> Bagikan:
            </span>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1 text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold rounded-lg transition-colors"
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleShareTwitter}
              className="px-2.5 py-1 text-xs bg-sky-50 text-sky-800 hover:bg-sky-100 font-semibold rounded-lg transition-colors"
            >
              X / Twitter
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg transition-colors"
              title="Salin Tautan"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <LinkIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {content.featured_image && (
        <div className="relative aspect-16/9 rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
          <img
            src={content.featured_image}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Excerpt Lead */}
      {content.excerpt && (
        <p className="text-base sm:text-lg font-medium text-stone-700 leading-relaxed border-l-4 border-amber-900 pl-4 py-1 italic bg-amber-50/40 rounded-r-lg">
          {content.excerpt}
        </p>
      )}

      {/* Body Content */}
      <article className="prose prose-stone max-w-none text-stone-800 leading-relaxed space-y-4 text-sm sm:text-base">
        {content.content.split('\n\n').map((paragraph, idx) => {
          if (paragraph.startsWith('## ')) {
            return (
              <h2 key={idx} className="font-serif text-2xl font-bold text-stone-900 mt-6 mb-2">
                {paragraph.replace('## ', '')}
              </h2>
            );
          }
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={idx} className="font-serif text-xl font-bold text-stone-900 mt-4 mb-2">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
            const listItems = paragraph.split('\n');
            return (
              <ul key={idx} className="list-disc pl-5 space-y-1.5 my-3">
                {listItems.map((li, lIdx) => (
                  <li key={lIdx} className="leading-relaxed">
                    {li.replace(/^[\*\-]\s+/, '')}
                  </li>
                ))}
              </ul>
            );
          }
          if (paragraph.match(/^\d+\.\s/)) {
            const listItems = paragraph.split('\n');
            return (
              <ol key={idx} className="list-decimal pl-5 space-y-1.5 my-3">
                {listItems.map((li, lIdx) => (
                  <li key={lIdx} className="leading-relaxed">
                    {li.replace(/^\d+\.\s+/, '')}
                  </li>
                ))}
              </ol>
            );
          }
          return (
            <p key={idx} className="leading-relaxed">
              {paragraph}
            </p>
          );
        })}
      </article>

      {/* Related Products Section (Section 20 & 59) */}
      {content.related_products && content.related_products.length > 0 && (
        <section className="pt-10 border-t border-stone-200 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-900" />
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Produk Komoditas Terkait Artikel Ini
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/products')}
              className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline"
            >
              Lihat Semua Produk
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {content.related_products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={() => onNavigate(`/products/${prod.slug}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Back to Blog Button */}
      <div className="pt-6">
        <button
          type="button"
          onClick={() => onNavigate('/blog')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 px-4 py-2 border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Semua Artikel</span>
        </button>
      </div>
    </div>
  );
};
