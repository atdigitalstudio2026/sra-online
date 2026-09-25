import React, { useState, useEffect } from 'react';
import { ProductWithDetails } from '../types';
import { getProducts } from '../services/productService';
import { ProductCard } from '../components/product/ProductCard';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { updateMetaTags } from '../utils/seo';
import { useToast } from '../components/common/Toast';
import { siteConfig } from '../config/site';
import {
  Sparkles,
  Ticket,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Truck,
  Users,
  MessageSquare,
  Gift,
} from 'lucide-react';

interface PromoLandingPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const PromoLandingPage: React.FC<PromoLandingPageProps> = ({ slug, onNavigate }) => {
  const { success } = useToast();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const promoTitle = slug === 'ramadan' ? 'Semarak Panen Berkah Ramadan & Idul Fitri' : 'Promo Spesial Pangan Pilihan';
  const promoSubtitle = 'Diskon Komoditas Pangan hingga 25% + Potongan Ongkos Kirim Se-Indonesia';

  useEffect(() => {
    return updateMetaTags({
      title: `${promoTitle} | Diskon Komoditas Pangan`,
      description: `Nikmati penawaran eksklusif ${promoTitle}. Dapatkan pasokan kurma premium, wijen murni, kacang pilihan, dan aneka rempah berkualitas dengan harga terbaik.`,
      canonicalUrl: `/promo/${slug}`,
      keywords: 'promo kurma, diskon wijen, voucher sembako, promo ramadan komoditas',
      ogType: 'website',
    });
  }, [slug, promoTitle]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getProducts({ limit: 8, is_featured: true });
        setProducts(res.data);
      } catch (e) {
        console.warn('Failed loading promo products:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const vouchers = [
    {
      code: 'RAMADAN2027',
      discount: 'Diskon Rp25.000',
      minOrder: 'Min. Belanja Rp200.000',
      expiry: 'Berlaku s.d. 30 April 2026',
    },
    {
      code: 'BERKAHONGKIR',
      discount: 'Gratis Ongkir Rp15.000',
      minOrder: 'Min. Belanja Rp150.000',
      expiry: 'Khusus Pengiriman Reguler',
    },
    {
      code: 'GROSIR50',
      discount: 'Diskon Grosir Rp50.000',
      minOrder: 'Min. Belanja Rp1.000.000',
      expiry: 'Untuk Pelaku Horeca & Bakery',
    },
  ];

  const handleCopyVoucher = (code: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      success(`Kode voucher "${code}" berhasil disalin!`);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Top Hero Banner */}
      <section className="relative overflow-hidden bg-stone-950 text-white pt-12 sm:pt-16 pb-20">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1598030304671-5aa1d6f21128?auto=format&fit=crop&w=1600&q=80"
            alt="Promo Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <Breadcrumb
            items={[
              { label: 'Promo & Penawaran', path: '/products' },
              { label: promoTitle },
            ]}
            onNavigate={onNavigate}
            className="text-stone-400"
          />

          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold backdrop-blur-xs border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Penawaran Terbatas Musim Panen</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              {promoTitle}
            </h1>

            <p className="text-base sm:text-lg text-stone-300 leading-relaxed">
              {promoSubtitle}. Belanja kebutuhan bahan baku berkualitas untuk industri roti, katering, dan santapan keluarga dengan jaminan mutu murni.
            </p>

            {/* CTAs (Section 28) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('/products')}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Belanja Sekarang
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('promo-vouchers');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-xl transition-all"
              >
                Gunakan Voucher
              </button>
              <a
                href={`https://wa.me/${siteConfig.contact.whatsapp}?text=Halo,%20saya%20tertarik%20mendaftar%20reseller%20komoditas%20pangan`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Daftar Reseller</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Vouchers Section (Section 27) */}
      <section id="promo-vouchers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-900" />
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Klaim Voucher Diskon Spesial
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vouchers.map((v) => (
            <div
              key={v.code}
              className="p-5 bg-gradient-to-br from-amber-50/80 to-stone-50 border border-amber-200/80 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    {v.discount}
                  </span>
                  <Ticket className="w-4 h-4 text-amber-800" />
                </div>
                <div className="text-xs text-stone-600 font-medium">{v.minOrder}</div>
                <div className="text-[11px] text-stone-400">{v.expiry}</div>
              </div>

              <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-stone-200">
                <span className="font-mono text-xs font-bold text-stone-900 pl-1">{v.code}</span>
                <button
                  type="button"
                  onClick={() => handleCopyVoucher(v.code)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-900 hover:bg-amber-800 text-white text-[11px] font-semibold rounded-lg transition-colors"
                >
                  {copiedCode === v.code ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Eligible Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Produk Pilihan Berlaku Promo
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Stok langsung dari gudang penyortiran mutu Grade A.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-950"
          >
            <span>Lihat Semua Produk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onSelect={() => onNavigate(`/products/${p.slug}`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
