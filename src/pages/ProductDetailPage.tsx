import React, { useState, useEffect } from 'react';
import { ProductWithDetails } from '../types';
import { formatRupiah, formatWeight, calculateDiscount } from '../utils/formatters';
import { ProductImageGallery } from '../components/product/ProductImageGallery';
import { PriceDisplay } from '../components/common/PriceDisplay';
import { RatingStars } from '../components/common/RatingStars';
import { ProductReviewSection } from '../components/product/ProductReviewSection';
import { BackInStockModal } from '../components/product/BackInStockModal';
import { PriceDropModal } from '../components/product/PriceDropModal';
import { updateMetaTags, generateProductSchema } from '../utils/seo';
import { recordFunnelEvent } from '../utils/marketing';
import { siteConfig } from '../config/site';
import {
  ArrowLeft,
  ShoppingBag,
  Zap,
  Heart,
  MessageSquare,
  ShieldCheck,
  Truck,
  CheckCircle,
  Package,
  Layers,
  Scale,
  Sparkles,
  TrendingDown,
  Info,
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../hooks/useWishlist';
import { QuantitySelector } from '../components/cart/QuantitySelector';

interface ProductDetailPageProps {
  product: ProductWithDetails;
  onNavigate: (path: string) => void;
  customerLevelName?: string | null;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onNavigate,
  customerLevelName,
}) => {
  const { addToCart, isSyncing, openMiniCart, user } = useCart();
  const { isFavorited, toggleWishlist } = useWishlist();
  const { error, success } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'shipping' | 'reviews'>('desc');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

  const discount = calculateDiscount(product.price, product.compare_price);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= product.low_stock_threshold;
  const isSaved = isFavorited(product.id);

  // Derive tiered wholesale prices
  const tier1Price = product.price;
  const tier2Price = Math.round(product.price * 0.92); // ~8% discount for 10-49 pcs
  const tier3Price = Math.round(product.price * 0.85); // ~15% discount for 50+ pcs

  // SEO & Structured Data
  useEffect(() => {
    recordFunnelEvent('product_view', { product_id: product.id, user_id: user?.id || null });

    const canonicalUrl = `/products/${product.slug}`;
    const productSchema = generateProductSchema(product, canonicalUrl);

    const pageTitle = product.seo_title || (product.brand ? `${product.name} | ${product.brand.name}` : `${product.name} | ${siteConfig.name}`);
    const metaDesc = product.seo_description || product.short_description || product.description?.slice(0, 150) || siteConfig.description;

    return updateMetaTags({
      title: pageTitle,
      description: metaDesc,
      keywords: product.seo_keywords || `${product.name}, ${product.category?.name || 'komoditas'}, beli ${product.name}`,
      canonicalUrl,
      ogType: 'product',
      ogImage: product.primary_image || undefined,
      structuredData: productSchema,
    });
  }, [product, user]);

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      error('Stok produk habis.');
      return;
    }

    if (quantity > product.stock) {
      error(`Tidak dapat menambahkan produk melebihi stok yang tersedia (tersisa ${product.stock} ${product.unit}).`);
      return;
    }

    const added = await addToCart(product.id, quantity);
    if (added) {
      openMiniCart();
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) {
      error('Stok produk habis.');
      return;
    }

    const added = await addToCart(product.id, quantity);
    if (added) {
      onNavigate('/checkout');
    }
  };

  const whatsappUrl = `https://wa.me/${siteConfig.contact.whatsapp}?text=Halo%20${encodeURIComponent(
    siteConfig.name
  )},%20saya%20ingin%20konsultasi%20pemesanan%20produk%20"${encodeURIComponent(
    product.name
  )}"%20(SKU:%20${product.sku})`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Breadcrumbs */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => onNavigate('/products')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Produk</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span>Katalog</span>
          <span>/</span>
          <span className="text-emerald-900 font-medium">{product.category?.name || 'Komoditas'}</span>
        </div>
      </div>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
        {/* Left Column: Image Gallery (6 cols) */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <ProductImageGallery
            images={product.images}
            productName={product.name}
            categorySlug={product.category?.slug}
            fallbackImage={product.primary_image}
          />
        </div>

        {/* Right Column: Information & Purchase Module (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Brand, Category, SKU */}
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 uppercase tracking-wider">
                  {product.brand?.name || product.category?.name || 'Komoditas Pangan'}
                </span>
                <span className="text-stone-300">•</span>
                <span className="font-mono text-stone-400">SKU: {product.sku}</span>
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-red-600 transition-colors"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{isSaved ? 'Tersimpan' : 'Simpan'}</span>
              </button>
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-950 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Rating Row with Click to Scroll */}
            <div className="flex items-center gap-3 mt-3">
              <RatingStars rating={product.average_rating || 4.9} count={product.review_count || 18} size="sm" />
              <span className="text-stone-300">•</span>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline"
              >
                Lihat Ulasan Pelanggan
              </button>
            </div>
          </div>

          {/* Pricing Display Module */}
          <div className="p-4 sm:p-5 bg-stone-50/80 border border-stone-200/90 rounded-2xl space-y-2">
            <PriceDisplay
              price={product.price}
              comparePrice={product.compare_price}
              customerLevelName={customerLevelName}
              unit={formatWeight(product.weight, product.unit)}
              size="lg"
            />

            <p className="text-xs text-stone-500 pt-1">
              Harga netto sudah termasuk pajak reguler komoditas.
            </p>
          </div>

          {/* Wholesale Quantity Tier Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Tier Harga Grosir / Kuantitas</span>
              </span>
              <span className="text-emerald-800 font-semibold text-[11px]">Diskon Otomatis</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setQuantity(1)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  quantity < 10
                    ? 'border-emerald-800 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-800/30'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <span className="block text-[11px] text-stone-400">1 – 9 pcs</span>
                <span className="font-bold tabular-nums">{formatRupiah(tier1Price)}</span>
              </button>

              <button
                type="button"
                onClick={() => setQuantity(10)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  quantity >= 10 && quantity < 50
                    ? 'border-emerald-800 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-800/30'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="block text-[11px] text-stone-400">10 – 49 pcs</span>
                  <span className="text-[9px] bg-orange-100 text-orange-700 font-bold px-1 rounded">-8%</span>
                </div>
                <span className="font-bold tabular-nums text-emerald-950">{formatRupiah(tier2Price)}</span>
              </button>

              <button
                type="button"
                onClick={() => setQuantity(50)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  quantity >= 50
                    ? 'border-emerald-800 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-800/30'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="block text-[11px] text-stone-400">50+ pcs</span>
                  <span className="text-[9px] bg-emerald-200 text-emerald-900 font-bold px-1 rounded">-15%</span>
                </div>
                <span className="font-bold tabular-nums text-emerald-950">{formatRupiah(tier3Price)}</span>
              </button>
            </div>
          </div>

          {/* Quick Specifications Matrix */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-stone-200 text-xs">
            <div className="flex items-center gap-2.5 text-stone-600">
              <Scale className="w-4 h-4 text-emerald-800 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px]">Berat Bersih</span>
                <span className="font-semibold text-stone-900">
                  {formatWeight(product.weight, product.unit)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-stone-600">
              <Package className="w-4 h-4 text-emerald-800 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px]">Ketersediaan</span>
                {isOutOfStock ? (
                  <span className="font-bold text-red-600">Stok Habis</span>
                ) : isLowStock ? (
                  <span className="font-semibold text-amber-700">
                    Sisa {product.stock} {product.unit} (Terbatas)
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-800">
                    Tersedia ({product.stock} {product.unit})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-stone-600">
              <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px]">Sertifikasi Mutu</span>
                <span className="font-semibold text-stone-900">Halal & BPOM Terdaftar</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-stone-600">
              <Truck className="w-4 h-4 text-emerald-800 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px]">Pengiriman</span>
                <span className="font-semibold text-stone-900">Bisa Kirim Se-Indonesia</span>
              </div>
            </div>
          </div>

          {/* Quantity Stepper & Dual CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider shrink-0">
                Jumlah:
              </span>
              <QuantitySelector
                quantity={quantity}
                maxStock={product.stock}
                onChange={setQuantity}
                disabled={isOutOfStock}
                size="md"
              />
              <span className="text-xs text-stone-400">
                {product.unit}
              </span>
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Emerald CTA: Tambah ke Keranjang */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isSyncing}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-950 hover:bg-emerald-900 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isOutOfStock
                    ? 'Stok Habis'
                    : isSyncing
                    ? 'Menyimpan...'
                    : '+ Tambah ke Keranjang'}
                </span>
              </button>

              {/* Warm Orange CTA: Beli Sekarang */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock || isSyncing}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-600 hover:bg-orange-500 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>Beli Sekarang</span>
              </button>
            </div>

            {/* Direct WhatsApp Consultation Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>Konsultasi Pasokan Grosir via WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Container: Deskripsi, Spesifikasi, Pengiriman, Ulasan */}
      <div className="pt-8 border-t border-stone-200">
        <div className="flex items-center gap-2 sm:gap-4 border-b border-stone-200 pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`pb-2 text-xs sm:text-sm font-bold transition-all relative ${
              activeTab === 'desc'
                ? 'text-emerald-950 border-b-2 border-emerald-950'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            Deskripsi Produk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`pb-2 text-xs sm:text-sm font-bold transition-all relative ${
              activeTab === 'specs'
                ? 'text-emerald-950 border-b-2 border-emerald-950'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            Spesifikasi & Standar Mutu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`pb-2 text-xs sm:text-sm font-bold transition-all relative ${
              activeTab === 'shipping'
                ? 'text-emerald-950 border-b-2 border-emerald-950'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            Informasi Logistik
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`pb-2 text-xs sm:text-sm font-bold transition-all relative ${
              activeTab === 'reviews'
                ? 'text-emerald-950 border-b-2 border-emerald-950'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            Ulasan Pelanggan
          </button>
        </div>

        {/* Tab 1: Deskripsi */}
        {activeTab === 'desc' && (
          <div className="py-6 space-y-4 max-w-3xl">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Tentang {product.name}
            </h3>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
              {product.description || product.short_description || 'Komoditas pangan berkualitas tinggi dengan seleksi mutu ketat untuk kebutuhan bisnis maupun konsumsi rumah tangga.'}
            </p>
          </div>
        )}

        {/* Tab 2: Spesifikasi */}
        {activeTab === 'specs' && (
          <div className="py-6 max-w-2xl">
            <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 text-xs">
              <div className="grid grid-cols-3 p-3.5 bg-stone-50 font-bold text-stone-900">
                <span>Parameter</span>
                <span className="col-span-2">Rincian</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-stone-500 font-medium">SKU Produk</span>
                <span className="col-span-2 font-mono font-semibold text-stone-900">{product.sku}</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-stone-500 font-medium">Kategori</span>
                <span className="col-span-2 font-semibold text-stone-900">{product.category?.name || '-'}</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-stone-500 font-medium">Berat Bersih / Kemasan</span>
                <span className="col-span-2 font-semibold text-stone-900">{formatWeight(product.weight, product.unit)}</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-stone-500 font-medium">Brand Produsen</span>
                <span className="col-span-2 font-semibold text-stone-900">{product.brand?.name || 'Agro Pangan Nusantara'}</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-stone-500 font-medium">Kondisi Penyimpanan</span>
                <span className="col-span-2 text-stone-700">Simpan di tempat kering, sejuk, dan terlindung dari sinar matahari langsung</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Pengiriman */}
        {activeTab === 'shipping' && (
          <div className="py-6 space-y-4 max-w-3xl text-xs sm:text-sm text-stone-700 leading-relaxed">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Ketentuan Logistik & Ekspedisi
            </h3>
            <p>
              Kami mendukung pengiriman komoditas ke seluruh penjuru Nusantara melalui mitra ekspedisi terpercaya (JNE, J&T Cargo, SiCepat) serta armada logistik truk khusus untuk pesanan skala tonase.
            </p>
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
              <span className="font-bold text-emerald-950 block">Kebijakan Garansi Mutu</span>
              <p className="text-xs text-emerald-900/80">
                Jika kemasan rusak atau mutu komoditas tidak sesuai spesifikasi saat diterima, kami menjamin penukaran barang atau pengembalian dana 100%.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Ulasan */}
        {activeTab === 'reviews' && (
          <div className="py-6">
            <ProductReviewSection
              productId={product.id}
              productName={product.name}
            />
          </div>
        )}
      </div>

      {/* Back in stock modal if requested */}
      <BackInStockModal
        product={product}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
      />

      {/* Price drop modal if requested */}
      <PriceDropModal
        product={product}
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
      />
    </div>
  );
};
