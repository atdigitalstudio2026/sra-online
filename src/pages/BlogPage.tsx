import React, { useState, useEffect } from 'react';
import { Content, ContentType } from '../types';
import { getContents } from '../services/contentService';
import { updateMetaTags } from '../utils/seo';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { LoadingState } from '../components/common/LoadingState';
import { BookOpen, Calendar, User, ArrowRight, Search, Sparkles, Filter } from 'lucide-react';
import { siteConfig } from '../config/site';

interface BlogPageProps {
  onNavigate: (path: string) => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({ onNavigate }) => {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // SEO Meta tags
  useEffect(() => {
    return updateMetaTags({
      title: 'Artikel, Panduan & Edukasi Komoditas Pangan',
      description: 'Kumpulan artikel komprehensif, panduan memilih komoditas grade A, karakteristik kurma, wijen, rempah, dan tips pasokan pangan.',
      canonicalUrl: '/blog',
      keywords: 'artikel kurma, panduan wijen, mutu bawang kating, tips komoditas pangan',
      ogType: 'website',
    });
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getContents({
          status: 'published',
          type: selectedType === 'all' ? undefined : selectedType,
          search: searchQuery || undefined,
        });
        setContents(data);
      } catch (err) {
        console.warn('Failed loading articles:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedType, searchQuery]);

  const typeLabels: Record<string, string> = {
    all: 'Semua Artikel',
    buying_guide: 'Panduan Belanja',
    product_guide: 'Karakteristik Produk',
    article: 'Artikel Edukasi',
    news: 'Berita & Pasar',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[{ label: 'Artikel & Panduan Komoditas', path: '/blog' }]}
        onNavigate={onNavigate}
      />

      {/* Header Banner */}
      <div className="border-b border-stone-200 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pusat Edukasi & Pengetahuan Komoditas</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-950">
            Wawasan Pangan & Panduan Mutu Bahan Baku
          </h1>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            Panduan kurasi, spesifikasi mutu komoditas, perbandingan varietas, serta tips efisiensi rantai pasok untuk pelaku usaha kuliner dan keluarga.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari topik atau bahan pangan..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:ring-1 focus:ring-amber-900 focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-100 scrollbar-none">
        {(['all', 'buying_guide', 'product_guide', 'article', 'news'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedType === type
                ? 'bg-amber-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {typeLabels[type]}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <LoadingState message="Memuat artikel & panduan komoditas..." fullHeight />
      ) : contents.length === 0 ? (
        <div className="text-center py-20 bg-stone-50 rounded-2xl border border-stone-200/80 p-8">
          <BookOpen className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-stone-900">Belum Ada Artikel Ditemukan</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Tidak ditemukan artikel untuk kata kunci atau kategori yang Anda pilih. Silakan ganti kata kunci.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {contents.map((item) => (
            <article
              key={item.id}
              onClick={() => onNavigate(`/blog/${item.slug}`)}
              className="group flex flex-col bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                {item.featured_image ? (
                  <img
                    src={item.featured_image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <BookOpen className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-stone-950/80 text-white text-[10px] font-semibold uppercase tracking-wider backdrop-blur-xs">
                  {typeLabels[item.content_type] || 'Artikel'}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    {item.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.published_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    {item.author_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.author_name}
                      </span>
                    )}
                  </div>

                  <h2 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-900 transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h2>

                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                    {item.excerpt}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-amber-900 group-hover:text-amber-950">
                  <span>Baca Selengkapnya</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
