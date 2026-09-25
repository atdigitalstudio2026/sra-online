import React, { useState } from 'react';
import { siteConfig } from '../config/site';
import { Category, ProductWithDetails } from '../types';
import { CategoryCard } from '../components/product/CategoryCard';
import { ProductCard } from '../components/product/ProductCard';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Building2,
  CheckCircle,
  Copy,
  Check,
  Star,
  Quote,
  BookOpen,
  Send,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '../components/common/Toast';

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
  const { success } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success(`Kode ${code} siap digunakan di halaman checkout.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    success('Terima kasih telah mendaftar buletin harga komoditas pangan.');
    setNewsletterEmail('');
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F4F1EA]/80 via-[#FAF9F6] to-[#FAF9F6] pt-12 sm:pt-20 pb-16 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline & Action */}
            <div className="lg:col-span-7 space-y-6">
              {/* Quiet Kicker */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-900/10 text-emerald-950 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-900/15">
                <span className="w-2 h-2 rounded-full bg-emerald-800" />
                <span>Distributor & Penyedia Komoditas Pangan Pilihan</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-stone-950 leading-[1.12]">
                Produk Berkualitas untuk Kebutuhan Bisnis & Rumah Tangga
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
                Temukan aneka komoditas murni seperti kurma premium, wijen bersih, bawang kating, aneka kacang pangan, dan rempah pilihan dengan jaminan mutu teruji dan pasokan kontinu.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/products')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-950 hover:bg-emerald-900 text-white text-sm font-semibold rounded-xl shadow-md transition-all hover:translate-y-[-1px] active:scale-95"
                >
                  <span>Belanja Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#b2b"
                  className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 text-sm font-semibold rounded-xl transition-all shadow-2xs hover:border-emerald-800"
                >
                  <Building2 className="w-4 h-4 text-emerald-800" />
                  <span>Katalog Grosir B2B</span>
                </a>
              </div>

              {/* Trust Markers */}
              <div className="pt-4 flex items-center gap-4 text-xs text-stone-500 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <CheckCircle className="w-4 h-4 text-emerald-700" /> 100% Mutu Teruji
                </span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <CheckCircle className="w-4 h-4 text-emerald-700" /> Pasokan Berkelanjutan
                </span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <CheckCircle className="w-4 h-4 text-emerald-700" /> Skala Curah & Kemasan
                </span>
              </div>
            </div>

            {/* Right Visual Card Spotlight */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-stone-200/90 bg-white p-6 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Komoditas Unggulan Siap Kirim</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      Ready Stock
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 hover:bg-emerald-50/60 transition-colors">
                      <div>
                        <div className="text-sm font-bold text-stone-900">Kurma Ajwa Madinah</div>
                        <div className="text-xs text-stone-500">Grade A Al-Munawwarah (500g)</div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-950 tabular-nums">Rp 135.000</span>
                        <div className="text-[10px] text-amber-800 font-semibold">Reseller Rp 124.000</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 hover:bg-emerald-50/60 transition-colors">
                      <div>
                        <div className="text-sm font-bold text-stone-900">Wijen Putih Bersih Murni</div>
                        <div className="text-xs text-stone-500">Tanpa pemutih kimia (500g)</div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-950 tabular-nums">Rp 28.000</span>
                        <div className="text-[10px] text-amber-800 font-semibold">Reseller Rp 25.500</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 hover:bg-emerald-50/60 transition-colors">
                      <div>
                        <div className="text-sm font-bold text-stone-900">Bawang Putih Kating Super</div>
                        <div className="text-xs text-stone-500">Siung padat aroma harum (1kg)</div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-950 tabular-nums">Rp 48.000</span>
                        <div className="text-[10px] text-amber-800 font-semibold">Reseller Rp 44.000</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('/products')}
                      className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Lihat Seluruh Katalog 40+ Produk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CATEGORY SECTION                                                      */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
              Kategori Komoditas
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Pilihan Bahan Pangan Pokok
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 hover:text-emerald-950 transition-colors group"
          >
            <span>Semua Kategori</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={(c) => onNavigate(`/category/${c.slug}`)}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. BEST SELLER PRODUCTS                                                  */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Paling Banyak Dipesan</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Komoditas Terlaris Minggu Ini
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 hover:text-emerald-950 transition-colors group"
          >
            <span>Lihat Semua Produk</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {(bestSellerProducts.length > 0 ? bestSellerProducts : featuredProducts).slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PROMOTION & VOUCHER EDITORIAL BANNER                                  */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white p-6 sm:p-10 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-stone-950 text-xs font-extrabold uppercase tracking-wider rounded-full shadow-xs">
                Penawaran Terbatas
              </span>
              <h3 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
                Diskon 10% Pesanan Pertama & Bebas Ongkir
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed max-w-xl">
                Gunakan kode voucher saat checkout untuk menikmati potongan harga langsung dan pengiriman prioritas ke alamat Anda.
              </p>

              {/* Vouchers Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-xl">
                  <span className="font-mono text-xs font-bold text-amber-300">WELCOME10</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode('WELCOME10')}
                    className="p-1 hover:text-amber-300 transition-colors"
                    title="Salin Voucher"
                  >
                    {copiedCode === 'WELCOME10' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-xl">
                  <span className="font-mono text-xs font-bold text-amber-300">FREEONGKIR</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode('FREEONGKIR')}
                    className="p-1 hover:text-amber-300 transition-colors"
                    title="Salin Voucher"
                  >
                    {copiedCode === 'FREEONGKIR' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <button
                type="button"
                onClick={() => onNavigate('/products')}
                className="py-3 px-6 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md text-center"
              >
                Gunakan Voucher Sekarang
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/promo/ramadan-berkah')}
                className="py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors text-center border border-white/20"
              >
                Lihat Semua Promo Aktif
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. B2B & RESELLER WHOLESALE SECTION                                      */}
      {/* ========================================================================= */}
      <section id="b2b" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-900 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-200">
                <Building2 className="w-3.5 h-3.5" />
                <span>Program Khusus Bisnis & Horeca</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-stone-900 leading-tight">
                Solusi Belanja Bahan Pangan untuk Bisnis Anda
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                Kami melayani pasokan komoditas rutin untuk jaringan katering, hotel, restoran, pabrik roti, dan toko kelontong dengan skema harga grosir bertingkat yang kompetitif.
              </p>

              {/* 4 B2B Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-stone-900">Harga Grosir Bertingkat</h5>
                    <p className="text-[11px] text-stone-500">Diskon otomatis semakin besar belanja Anda.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-stone-900">Repeat Order Mudah</h5>
                    <p className="text-[11px] text-stone-500">Pesan ulang kebutuhan rutin 1-klik di portal akun.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-stone-900">Faktur Resmi Pajak</h5>
                    <p className="text-[11px] text-stone-500">Dokumen faktur lengkap untuk pembukuan usaha.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-stone-900">Pengiriman Tonase Cepat</h5>
                    <p className="text-[11px] text-stone-500">Dukungan logistik armada langsung ke gudang Anda.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <a
                  href={`https://wa.me/${siteConfig.contact.whatsapp}?text=Halo%20${encodeURIComponent(siteConfig.name)},%20saya%20ingin%20mendaftar%20akun%20Reseller%20/%20B2B%20untuk%20usaha%20saya`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <span>Daftar Sebagai Mitra Reseller</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => onNavigate('/products')}
                  className="px-5 py-3 border border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold text-xs sm:text-sm rounded-xl transition-colors"
                >
                  Lihat Katalog Produk
                </button>
              </div>
            </div>

            {/* Right B2B Pricing Tier Simulation Table */}
            <div className="lg:col-span-6 bg-[#FAF9F6] border border-stone-200/90 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Simulasi Skema Harga Volume
                </span>
                <span className="text-[10px] text-stone-500">Contoh: Wijen Hitam Murni 500g</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200">
                  <div>
                    <span className="font-bold text-stone-900">Eceran (1 – 9 pcs)</span>
                    <p className="text-[11px] text-stone-500">Untuk pemakaian rumah tangga</p>
                  </div>
                  <span className="font-extrabold text-stone-900 tabular-nums">Rp 50.000 / pcs</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-950">Reseller (10 – 49 pcs)</span>
                      <span className="bg-emerald-200 text-emerald-950 text-[10px] font-bold px-1.5 py-0.2 rounded">Hemat 8%</span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80">Katering & toko kue</p>
                  </div>
                  <span className="font-extrabold text-emerald-950 tabular-nums">Rp 46.000 / pcs</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-950">Grosir & Distributor (50+ pcs)</span>
                      <span className="bg-amber-200 text-amber-950 text-[10px] font-bold px-1.5 py-0.2 rounded">Hemat 15%</span>
                    </div>
                    <p className="text-[11px] text-amber-900/80">Distribusi wilayah & pabrik pangan</p>
                  </div>
                  <span className="font-extrabold text-amber-950 tabular-nums">Rp 42.500 / pcs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FEATURED BRANDS & DISTRIBUTOR PARTNERS                                */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
            Jaringan Produsen Terpercaya
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1">
            Brand Komoditas Pilihan
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 text-center hover:border-emerald-700 transition-colors">
            <h4 className="text-sm font-bold text-stone-900">Al-Munawwarah</h4>
            <p className="text-xs text-stone-500 mt-0.5">Kurma Madinah Terverifikasi</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 text-center hover:border-emerald-700 transition-colors">
            <h4 className="text-sm font-bold text-stone-900">Dapur Nusantara</h4>
            <p className="text-xs text-stone-500 mt-0.5">Bawang & Aneka Bumbu</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 text-center hover:border-emerald-700 transition-colors">
            <h4 className="text-sm font-bold text-stone-900">Agro Pangan Mas</h4>
            <p className="text-xs text-stone-500 mt-0.5">Wijen & Biji-bijian Pangan</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200/80 text-center hover:border-emerald-700 transition-colors">
            <h4 className="text-sm font-bold text-stone-900">Rempah Wangi</h4>
            <p className="text-xs text-stone-500 mt-0.5">Kemiri, Lada & Rempah Asli</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. WHY CHOOSE US / TRUST INDICATORS                                      */}
      {/* ========================================================================= */}
      <section className="bg-white py-16 border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Standar Profesional Kami
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-1">
              Mengapa Memilih {siteConfig.name}?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Mutu Higienis Teruji</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Setiap karung komoditas melewati proses sortir kebersihan, kadar air terkontrol, dan sertifikasi Halal.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Pengiriman Terjadwal</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Pengiriman cepat dengan armada langsung, kurir instan perkotaan, dan ekspedisi kargo untuk luar pulau.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Harga Kompetitif Produsen</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Dapatkan harga tangan pertama langsung dari jalur sentra pertanian tanpa perantara berlebih.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Layanan B2B & Faktur</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Layanan khusus untuk industri, katering, dan supermarket dengan faktur pajak dan termin pembayaran resmi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. CUSTOMER REVIEWS                                                      */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
              <span>Testimoni Pelanggan</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Dipercaya Ratusan Mitra Kuliner
            </h2>
          </div>
          <div className="text-xs text-stone-500">
            Rating Rata-rata <strong className="text-stone-900">4.9 / 5.0</strong> dari 1.250+ ulasan
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center text-amber-500 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-500" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                &ldquo;Kualitas wijen putih dan kurma ajwa sangat bersih, aroma segar tanpa apek. Katering kami repeat order setiap minggu tanpa pernah ada komplain mutu.&rdquo;
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-stone-900">Ibu Dian Permata</span>
                <span className="text-[11px] text-stone-400 block">Owner Katering Sejahtera, Jakarta</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Verified Buyer
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center text-amber-500 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-500" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                &ldquo;Bawang putih kating siungnya besar dan padat, susutnya minim sekali saat dikupas. Harga grosirnya sangat kompetitif untuk restoran kami.&rdquo;
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-stone-900">Bapak Hendra Gunawan</span>
                <span className="text-[11px] text-stone-400 block">Chef Restoran Nusantara Rasa, Bekasi</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Verified Buyer
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center text-amber-500 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-500" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                &ldquo;Pelayanan admin sangat responsif, pengiriman kargo cepat sampai dan packing rapi dengan bubble tebal. Sangat rekomendasi untuk reseller toko sembako.&rdquo;
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-stone-900">Ibu Siti Rahma</span>
                <span className="text-[11px] text-stone-400 block">Toko Sembako Berkah, Tangerang</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Verified Buyer
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. CONTENT & GUIDES SECTION                                              */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Edukasi & Wawasan</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Panduan Memilih & Menyimpan Bahan Pangan
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/blog')}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 hover:text-emerald-950 transition-colors group"
          >
            <span>Baca Semua Artikel</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => onNavigate('/blog/cara-menyimpan-kurma-ajwa')}
            className="group rounded-2xl bg-white border border-stone-200/80 overflow-hidden hover:border-emerald-800/40 hover:shadow-md transition-all cursor-pointer flex flex-col"
          >
            <div className="aspect-video bg-emerald-950/5 p-4 flex items-center justify-center text-emerald-900 font-serif font-bold text-lg">
              Panduan Kurma Murni
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Tips Penyimpanan
                </span>
                <h4 className="text-sm font-bold text-stone-900 group-hover:text-emerald-950 transition-colors mt-1">
                  Cara Menyimpan Kurma Ajwa Agar Tetap Lembap dan Bebas Kutu
                </h4>
                <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">
                  Ketahui suhu ideal penyimpanan dan wadah kedap udara yang tepat untuk menjaga kelembutan buah kurma.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-900 mt-4 inline-flex items-center gap-1">
                Baca Selengkapnya <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('/blog/memilih-wijen-berkualitas')}
            className="group rounded-2xl bg-white border border-stone-200/80 overflow-hidden hover:border-emerald-800/40 hover:shadow-md transition-all cursor-pointer flex flex-col"
          >
            <div className="aspect-video bg-amber-950/5 p-4 flex items-center justify-center text-amber-900 font-serif font-bold text-lg">
              Standar Wijen Pangan
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Kualitas Pangan
                </span>
                <h4 className="text-sm font-bold text-stone-900 group-hover:text-emerald-950 transition-colors mt-1">
                  Ciri Wijen Putih Asli Tanpa Bahan Pemutih Kimia
                </h4>
                <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">
                  Pembeda fisik antara wijen yang dicuci alami dengan biji yang menggunakan zat kimia buatan.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-900 mt-4 inline-flex items-center gap-1">
                Baca Selengkapnya <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('/blog/peluang-reseller-komoditas')}
            className="group rounded-2xl bg-white border border-stone-200/80 overflow-hidden hover:border-emerald-800/40 hover:shadow-md transition-all cursor-pointer flex flex-col"
          >
            <div className="aspect-video bg-emerald-950/5 p-4 flex items-center justify-center text-emerald-900 font-serif font-bold text-lg">
              Kemitraan Usaha
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Peluang Bisnis
                </span>
                <h4 className="text-sm font-bold text-stone-900 group-hover:text-emerald-950 transition-colors mt-1">
                  Potensi Keuntungan Menjadi Reseller Bahan Pangan Pokok
                </h4>
                <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">
                  Analisis perputaran modal, margin keuntungan kemasan repack, dan pasar langganan katering.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-900 mt-4 inline-flex items-center gap-1">
                Baca Selengkapnya <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. NEWSLETTER & CONSULTATION CTA                                        */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-emerald-950 text-white p-8 sm:p-12 shadow-xl border border-emerald-900">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Pembaruan Harga & Panen Komoditas
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Dapatkan Update Fluktuasi Harga Pasar & Promo Khusus
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed max-w-lg">
                Daftarkan email usaha Anda untuk menerima katalog harga komoditas terbaru setiap awal pekan langsung dari divisi gudang.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 pt-2 max-w-md">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Masukkan alamat email usaha Anda..."
                  required
                  className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs sm:text-sm placeholder:text-emerald-300/60 focus:bg-white focus:text-stone-900 focus:outline-hidden transition-all flex-1"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Berlangganan</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center sm:text-left">
              <h4 className="text-sm font-bold text-white mb-1.5 flex items-center justify-center sm:justify-start gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Konsultasi Pasokan via WhatsApp</span>
              </h4>
              <p className="text-xs text-emerald-200/80 leading-relaxed mb-4">
                Butuh sampel fisik atau negosiasi kontrak pasokan partai besar? Hubungi tim penjualan kami langsung.
              </p>
              <a
                href={`https://wa.me/${siteConfig.contact.whatsapp}?text=Halo%20${encodeURIComponent(siteConfig.name)},%20saya%20ingin%20konsultasi%20pasokan%20komoditas%20pangan`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                <span>Chat Penjualan Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
