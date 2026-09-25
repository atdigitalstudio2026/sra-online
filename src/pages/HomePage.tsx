import React from 'react';
import { siteConfig } from '../config/site';
import { Category, ProductWithDetails } from '../types';
import { CategoryCard } from '../components/product/CategoryCard';
import { ProductCard } from '../components/product/ProductCard';
import { ArrowRight, ShieldCheck, Truck, Sparkles, Building2, CheckCircle } from 'lucide-react';

interface HomePageProps {
  categories: Category[];
  featuredProducts: ProductWithDetails[];
  bestSellerProducts: ProductWithDetails[];
  isLoadingFeatured: boolean;
  isLoadingBestSellers: boolean;
  onNavigate: (path: string) => void;
  onSelectProduct: (product: ProductWithDetails) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  featuredProducts,
  bestSellerProducts,
  isLoadingFeatured,
  isLoadingBestSellers,
  onNavigate,
  onSelectProduct,
}) => {
  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-100/80 via-stone-50 to-[#FBFBFA] pt-12 sm:pt-20 pb-16 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline */}
            <div className="lg:col-span-7 space-y-6">
              {/* Quiet Kicker */}
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-900">
                <span className="w-2 h-2 rounded-full bg-amber-800" />
                <span>Distributor & Penyedia Komoditas Pangan Pilihan</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-stone-950 leading-[1.15] text-balance">
                {siteConfig.tagline}
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
                {siteConfig.subTagline} Kami menyediakan aneka komoditas murni seperti kurma premium, wijen, bawang kating, kacang pangan, dan rempah untuk skala industri, horeca, maupun retail.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/products')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-stone-950 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:translate-y-[-1px]"
                >
                  <span>Belanja Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://wa.me/${siteConfig.contact.whatsapp}?text=Halo%20${encodeURIComponent(siteConfig.name)},%20saya%20ingin%20konsultasi%20pasokan%20komoditas%20pangan`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-sm font-semibold rounded-xl transition-colors shadow-2xs"
                >
                  <span>Hubungi Penjualan</span>
                </a>
              </div>

              {/* Trust markers (quiet metadata line) */}
              <div className="pt-4 flex items-center gap-4 text-xs text-stone-500 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Mutu Teruji
                </span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Pasokan Berkelanjutan
                </span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Skala Curah & Kemasan
                </span>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-stone-200/80 bg-white p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Komoditas Unggulan Hari Ini
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                      Stok Siap Kirim
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100/80 transition-colors">
                      <div>
                        <div className="text-sm font-semibold text-stone-900">Kurma Ajwa Madinah</div>
                        <div className="text-xs text-stone-500">Al-Munawwarah Grade A (500g)</div>
                      </div>
                      <span className="text-xs font-bold text-stone-900 tabular-nums">Rp 135.000</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100/80 transition-colors">
                      <div>
                        <div className="text-sm font-semibold text-stone-900">Wijen Putih Bersih</div>
                        <div className="text-xs text-stone-500">Murni tanpa pemutih (500g)</div>
                      </div>
                      <span className="text-xs font-bold text-stone-900 tabular-nums">Rp 28.000</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100/80 transition-colors">
                      <div>
                        <div className="text-sm font-semibold text-stone-900">Bawang Putih Kating</div>
                        <div className="text-xs text-stone-500">Siung tebal aroma tajam (1kg)</div>
                      </div>
                      <span className="text-xs font-bold text-stone-900 tabular-nums">Rp 42.000</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate('/products')}
                    className="w-full mt-2 py-2 text-xs font-semibold text-center text-amber-900 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    Lihat Seluruh Katalog Produk →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
              Jelajahi Berdasarkan Kategori
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Pilihan Komoditas Pangan
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1 group transition-colors"
          >
            <span>Semua Kategori</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onClick={() => onNavigate(`/category/${cat.slug}`)}
            />
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-900 mb-1">
              Pilihan Editor
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Produk Unggulan
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1 group transition-colors"
          >
            <span>Buka Katalog Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {isLoadingFeatured ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-stone-200/60 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. BEST SELLER SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-900 mb-1">
              Paling Banyak Diminati
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Produk Terlaris
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1 group transition-colors"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {isLoadingBestSellers ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-stone-200/60 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {bestSellerProducts.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. PROMOTION & PARTNERSHIP SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-stone-900 text-stone-100 p-8 sm:p-12 border border-stone-800 relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Pemesanan Skala Grosir & Horeca
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              Kebutuhan Bahan Pangan Industri dan Pasokan Restoran
            </h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              Membutuhkan pasokan komoditas dalam satuan karung (25kg - 50kg) atau kontrak pasokan rutin bulanan? Dapatkan harga khusus mitra distributor dan kemudahan logistik langsung ke gudang Anda.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href={`https://wa.me/${siteConfig.contact.whatsapp}?text=Halo%20${encodeURIComponent(siteConfig.name)},%20saya%20ingin%20bermitra%20untuk%20pasokan%20grosir`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg transition-colors"
              >
                <span>Dapatkan Penawaran Grosir</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => onNavigate('/products')}
                className="px-5 py-2.5 text-xs font-semibold text-stone-300 hover:text-white border border-stone-700 hover:border-stone-500 rounded-lg transition-colors"
              >
                Cek Katalog Retail
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
