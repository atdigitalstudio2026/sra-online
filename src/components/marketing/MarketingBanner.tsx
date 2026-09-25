import React, { useEffect, useState } from 'react';
import { Banner, BannerPosition } from '../../types';
import { getActiveBannersForPosition, recordBannerEvent } from '../../services/bannerService';
import { ArrowRight, Sparkles } from 'lucide-react';

interface MarketingBannerProps {
  position: BannerPosition;
  onNavigate?: (path: string) => void;
  className?: string;
}

export const MarketingBanner: React.FC<MarketingBannerProps> = ({
  position,
  onNavigate,
  className = '',
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const list = await getActiveBannersForPosition(position);
        if (mounted) {
          setBanners(list);
          // Record view event for all visible banners
          if (list.length > 0) {
            recordBannerEvent(list[0].id, 'view').catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Failed loading banners for position:', position, e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [position]);

  if (loading || banners.length === 0) {
    return null;
  }

  const banner = banners[0];

  const handleClick = () => {
    recordBannerEvent(banner.id, 'click').catch(() => {});
    if (banner.link_url && onNavigate) {
      if (banner.link_url.startsWith('http')) {
        window.open(banner.link_url, '_blank', 'noopener,noreferrer');
      } else {
        onNavigate(banner.link_url);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative overflow-hidden rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer bg-stone-900 ${className}`}
    >
      {/* Responsive Picture: Desktop vs Mobile Image (Section 25) */}
      <picture className="w-full h-full block">
        {banner.mobile_image_url && (
          <source
            media="(max-width: 640px)"
            srcSet={banner.mobile_image_url}
          />
        )}
        <img
          src={banner.image_url}
          alt={banner.title}
          className="w-full h-56 sm:h-72 md:h-80 object-cover object-center group-hover:scale-[1.01] transition-transform duration-500 opacity-85 group-hover:opacity-95"
          loading="lazy"
        />
      </picture>

      {/* Subtle Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
        <div className="max-w-2xl space-y-2">
          {banner.subtitle && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-semibold tracking-wide backdrop-blur-xs border border-amber-400/30">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{banner.subtitle}</span>
            </div>
          )}

          <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white leading-snug">
            {banner.title}
          </h3>

          {banner.button_text && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-stone-950 text-xs font-semibold rounded-lg shadow-sm group-hover:bg-amber-100 transition-colors">
                <span>{banner.button_text}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
