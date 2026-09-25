import React from 'react';
import { Category } from '../../types';
import { ChevronRight, Sparkles, Package, ArrowRight, ShieldCheck } from 'lucide-react';

interface MegaMenuProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  categories,
  isOpen,
  onClose,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute top-full left-0 w-full bg-white border-b border-stone-200/90 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Column 1: Category Listing (8 cols) */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>Katalog Seluruh Komoditas Pangan</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('/products');
                }}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1 group"
              >
                <span>Lihat Semua Produk</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate(`/category/${cat.slug}`);
                  }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 border border-transparent hover:border-stone-200/80 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 group-hover:text-emerald-900 transition-colors">
                      {cat.name}
                    </h4>
                    <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                      {cat.description || 'Komoditas murni kualitas teruji'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Spotlight B2B & Featured Highlight (4 cols) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-emerald-950 to-emerald-900 rounded-2xl p-6 text-white flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-400 text-stone-950 font-bold text-[10px] tracking-wider uppercase rounded-full mb-4">
                <Sparkles className="w-3 h-3" />
                <span>Program Kemitraan FMCG</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-emerald-50 mb-2 leading-snug">
                Pasokan Grosir untuk Bisnis Anda
              </h3>
              <p className="text-xs text-emerald-200/90 leading-relaxed mb-4">
                Dapatkan tier diskon berjenjang, kemudahan pemesanan repeat order, dan faktur resmi pajak untuk horeca, toko, dan industri.
              </p>

              <div className="space-y-2 text-xs text-emerald-100/90 mb-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Kualitas grade ekspor terverifikasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Potongan harga hingga 15% untuk reseller</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('/#b2b');
              }}
              className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Pelajari Syarat Kemitraan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
