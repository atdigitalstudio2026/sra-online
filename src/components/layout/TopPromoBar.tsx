import React from 'react';
import { Truck, Sparkles, Building2, PhoneCall } from 'lucide-react';
import { siteConfig } from '../../config/site';

interface TopPromoBarProps {
  onNavigate: (path: string) => void;
}

export const TopPromoBar: React.FC<TopPromoBarProps> = ({ onNavigate }) => {
  return (
    <div className="bg-emerald-950 text-emerald-100 text-xs py-2 px-4 border-b border-emerald-900/60 selection:bg-emerald-700">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Key Value Propositions */}
        <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto no-scrollbar whitespace-nowrap">
          <span className="flex items-center gap-1.5 font-medium text-emerald-200">
            <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Gratis Ongkir se-Jabodetabek Min. Rp250.000</span>
          </span>
          <span className="text-emerald-700 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5 font-medium text-emerald-200 hidden sm:flex">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Harga Spesial Grosir & Reseller</span>
          </span>
          <span className="text-emerald-700 hidden md:inline">•</span>
          <span className="text-emerald-300/80 hidden md:inline">
            100% Produk Halal & Pangan Teruji
          </span>
        </div>

        {/* Right: B2B Wholesale Portal & WhatsApp Direct Link */}
        <div className="flex items-center gap-4 shrink-0 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => onNavigate('/#b2b')}
            className="flex items-center gap-1 text-amber-300 hover:text-amber-200 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Daftar Reseller / B2B</span>
          </button>

          <a
            href={`https://wa.me/${siteConfig.contact.whatsapp}?text=Halo%20${encodeURIComponent(siteConfig.name)},%20saya%20ingin%20tanya%20info%20produk%20dan%20pemesanan`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1 text-emerald-200 hover:text-white transition-colors"
          >
            <PhoneCall className="w-3 h-3 text-emerald-400" />
            <span>Bantuan CS: {siteConfig.contact.whatsappFormatted}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
