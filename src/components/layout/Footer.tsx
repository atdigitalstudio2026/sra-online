import React from 'react';
import { siteConfig } from '../../config/site';
import { Phone, Mail, MapPin, Clock, MessageSquare, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react';
import { Category } from '../../types';

interface FooterProps {
  categories: Category[];
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ categories, onNavigate }) => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* Brand and Description (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-serif text-2xl font-bold tracking-tight text-white">
              {siteConfig.name}
            </h3>
            <p className="text-sm text-stone-400 leading-relaxed max-w-sm">
              {siteConfig.description}
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${siteConfig.contact.whatsapp}?text=Halo%20${encodeURIComponent(siteConfig.name)},%20saya%20tertarik%20dengan%20produk%20komoditas%20pangan`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Konsultasi via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Navigasi Produk */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Katalog Produk
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/products')}
                  className="hover:text-white transition-colors"
                >
                  Semua Produk
                </button>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/category/${cat.slug}`)}
                    className="hover:text-white transition-colors text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak & Jam Operasional */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Kontak Layanan
            </h4>
            <ul className="space-y-3 text-xs text-stone-400">
              <li className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{siteConfig.contact.whatsappFormatted}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{siteConfig.contact.email}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span>{siteConfig.contact.workingHours}</span>
              </li>
            </ul>
          </div>

          {/* Alamat & Legal */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Alamat Pergudangan
            </h4>
            <div className="flex items-start gap-2 text-xs text-stone-400 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
              <span>
                {siteConfig.address.street}, {siteConfig.address.city}, {siteConfig.address.province} {siteConfig.address.postalCode}
              </span>
            </div>
            {/* Social links */}
            <div className="mt-5 flex items-center gap-3 text-stone-400">
              <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href={siteConfig.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-white transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            © {new Date().getFullYear()} {siteConfig.companyName} — {siteConfig.name}. Hak cipta dilindungi.
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Fondasi Katalog Produk (Tahap 1)</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="hover:text-stone-300 transition-colors"
            >
              Panel Kelola
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
