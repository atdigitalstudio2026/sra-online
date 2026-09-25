import React, { useState } from 'react';
import { ProductWithDetails } from '../types';
import { formatRupiah, formatWeight, calculateDiscount } from '../utils/formatters';
import { ProductImageGallery } from '../components/product/ProductImageGallery';
import { siteConfig } from '../config/site';
import {
  ArrowLeft,
  ShoppingCart,
  MessageSquare,
  ShieldCheck,
  Truck,
  CheckCircle,
  Package,
  Layers,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { useCart } from '../context/CartContext';
import { QuantitySelector } from '../components/cart/QuantitySelector';

interface ProductDetailPageProps {
  product: ProductWithDetails;
  onNavigate: (path: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onNavigate,
}) => {
  const { addToCart, isSyncing, openMiniCart } = useCart();
  const { error } = useToast();
  const [quantity, setQuantity] = useState(1);

  const discount = calculateDiscount(product.price, product.compare_price);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= product.low_stock_threshold;

  // Active handler for Tahap 2 Cart integration
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

  // WhatsApp consultation link
  const whatsappUrl = `https://wa.me/${siteConfig.contact.whatsapp}?text=Halo%20${encodeURIComponent(
    siteConfig.name
  )},%20saya%20ingin%20bertanya%20mengenai%20produk%20"${encodeURIComponent(
    product.name
  )}"%20(SKU:%20${product.sku})`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back to Products Navigation */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => onNavigate('/products')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Produk</span>
        </button>
      </div>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <ProductImageGallery
            images={product.images}
            productName={product.name}
            categorySlug={product.category?.slug}
            fallbackImage={product.primary_image}
          />
        </div>

        {/* Right Column: Contiguous Purchase Module (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header Metadata */}
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
              <span className="font-semibold text-stone-700 uppercase tracking-wider">
                {product.category?.name || 'Komoditas'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-stone-400">SKU: {product.sku}</span>
              {product.brand && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-stone-600">{product.brand.name}</span>
                </>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-snug">
              {product.name}
            </h1>
          </div>

          {/* Pricing Row */}
          <div className="p-4 bg-stone-100/70 border border-stone-200/80 rounded-xl space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-stone-950 tabular-nums">
                {formatRupiah(product.price)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-sm sm:text-base text-stone-400 line-through tabular-nums">
                  {formatRupiah(product.compare_price)}
                </span>
              )}
              {discount && (
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-sm">
                  Hemat {discount}%
                </span>
              )}
            </div>
            <div className="text-xs text-stone-500">
              Harga berlaku per {formatWeight(product.weight, product.unit)}
            </div>
          </div>

          {/* Short Description */}
          {product.short_description && (
            <p className="text-sm text-stone-600 leading-relaxed">
              {product.short_description}
            </p>
          )}

          {/* Quick Specifications Matrix */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-stone-200 text-xs">
            <div className="flex items-center gap-2.5 text-stone-600">
              <Scale className="w-4 h-4 text-stone-400 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px]">Berat Bersih</span>
                <span className="font-semibold text-stone-800">
                  {formatWeight(product.weight, product.unit)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-stone-600">
              <Package className="w-4 h-4 text-stone-400 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px]">Ketersediaan</span>
                {isOutOfStock ? (
                  <span className="font-semibold text-rose-600">Stok Habis</span>
                ) : isLowStock ? (
                  <span className="font-semibold text-amber-700">
                    Sisa {product.stock} {product.unit} (Menipis)
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-700">
                    Tersedia ({product.stock} {product.unit})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-stone-600">
              <Layers className="w-4 h-4 text-stone-400 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px]">Kategori</span>
                <span className="font-semibold text-stone-800">
                  {product.category?.name || '-'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-stone-600">
              <ShieldCheck className="w-4 h-4 text-stone-400 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px]">Standar Mutu</span>
                <span className="font-semibold text-stone-800">Grade A Bersertifikat</span>
              </div>
            </div>
          </div>

          {/* Quantity Stepper & Add to Cart (Tahap 2) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <QuantitySelector
                quantity={quantity}
                maxStock={product.stock}
                onChange={setQuantity}
                disabled={isOutOfStock}
                size="md"
              />

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isSyncing}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-950 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:translate-y-[-1px]"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {isOutOfStock
                    ? 'Stok Habis'
                    : isSyncing
                    ? 'Menambahkan...'
                    : 'Tambah ke Keranjang'}
                </span>
              </button>
            </div>

            {/* Direct WhatsApp Consultation Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>Hubungi Kami via WhatsApp untuk Pembelian / Grosir</span>
            </a>
          </div>

          {/* Full Detailed Description */}
          {product.description && (
            <div className="pt-6 border-t border-stone-200 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                Deskripsi & Uraian Lengkap
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Logistics & Guarantee Note */}
          <div className="p-4 bg-stone-50 border border-stone-200/60 rounded-xl space-y-2 text-xs text-stone-600">
            <div className="flex items-center gap-2 font-semibold text-stone-800">
              <Truck className="w-4 h-4 text-stone-500" />
              <span>Informasi Logistik & Pengiriman Komoditas</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Pengiriman menjangkau seluruh wilayah Indonesia menggunakan ekspedisi kargo darat, laut, maupun armada logistik khusus untuk pengiriman muatan tonase besar ke gudang pelanggan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
