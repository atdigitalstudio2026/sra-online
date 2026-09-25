import React from 'react';
import { siteConfig } from '../../config/site';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  ShieldCheck,
  Truck,
  CreditCard,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { Category } from '../../types';

interface FooterProps {
  categories: Category[];
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ categories, onNavigate }) => {
  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Trust Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 mb-12 border-b border-stone-800 text-stone-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">100% Mutu Teruji</h5>
              <p className="text-[11px] text-stone-400">Standar higienis & pangan murni</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Pengiriman Cepat</h5>
              <p className="text-[11px] text-stone-400">Armada sendiri & ekspedisi terpercaya</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Harga Reseller & B2B</h5>
              <p className="text-[11px] text-stone-400">Tier grosir volume bertingkat</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Pembayaran Aman</h5>
              <p className="text-[11px] text-stone-400">Virtual Account & QRIS otomatis</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* Column 1: Brand Info (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs">
                NP
              </div>
              <h3 className="font-serif text-xl font-bold tracking-tight text-white">
                {siteConfig.name}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm">
              {siteConfig.description}
            </p>

            <div className="pt-1 flex items-center gap-3 text-stone-400">
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center hover:text-white hover:bg-stone-800 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center hover:text-white hover:bg-stone-800 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={siteConfig.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center hover:text-white hover:bg-stone-800 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={siteConfig.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center hover:text-white hover:bg-stone-800 transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Katalog Produk */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Katalog Produk
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/products')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Semua Produk
                </button>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/category/${cat.slug}`)}
                    className="hover:text-emerald-400 transition-colors text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Kemitraan B2B & Layanan */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Kemitraan & Bisnis
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/#b2b')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Program Reseller & Grosir
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/orders')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Lacak Status Pesanan
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/blog')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Panduan & Artikel Komoditas
                </button>
              </li>
              <li>
                <a
                  href={`https://wa.me/${siteConfig.contact.whatsapp}?text=Halo%20${encodeURIComponent(siteConfig.name)},%20saya%20ingin%20permintaan%20penawaran%20harga%20faktur%20komoditas`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Minta Penawaran Faktur</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Kontak & Pergudangan */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Layanan Pelanggan
            </h4>
            <ul className="space-y-3 text-xs text-stone-400">
              <li className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{siteConfig.contact.whatsappFormatted}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{siteConfig.contact.email}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{siteConfig.contact.workingHours}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{siteConfig.address.city}, Indonesia</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Partners & Payment Methods Section */}
        <div className="pt-8 pb-8 border-t border-stone-800/80 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-stone-500">
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <span className="font-semibold text-stone-400 mr-2">Metode Pembayaran:</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300 font-mono text-[11px]">QRIS</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300 font-mono text-[11px]">BCA Virtual Account</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300 font-mono text-[11px]">Mandiri</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300 font-mono text-[11px]">BNI / BRI</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300 font-mono text-[11px]">Kartu Kredit</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
            <span className="font-semibold text-stone-400 mr-2">Mitra Ekspedisi:</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300 text-[11px]">JNE</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300 text-[11px]">J&T Cargo</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300 text-[11px]">SiCepat</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-stone-300 text-[11px]">Armada Gudang</span>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="pt-6 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} {siteConfig.companyName}. Seluruh Hak Cipta Dilindungi Undang-Undang.</p>
          <div className="flex items-center gap-6">
            <span>Kebijakan Privasi</span>
            <span>Syarat & Ketentuan</span>
            <span>FMCG Commerce Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
