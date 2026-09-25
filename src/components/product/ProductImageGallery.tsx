import React, { useState, useEffect } from 'react';
import { ProductImage } from '../../types';
import { ProductImageFallback } from '../common/ProductImageFallback';

interface ProductImageGalleryProps {
  images?: ProductImage[];
  productName: string;
  categorySlug?: string;
  fallbackImage?: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images = [],
  productName,
  categorySlug,
  fallbackImage,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (images && images.length > 0) {
      const primary = images.find((i) => i.is_primary)?.image_url || images[0].image_url;
      setSelectedImage(primary);
    } else if (fallbackImage) {
      setSelectedImage(fallbackImage);
    }
  }, [images, fallbackImage]);

  const allImages = images.length > 0 ? images : fallbackImage ? [{ id: 'fallback', product_id: '', image_url: fallbackImage, alt_text: productName, sort_order: 1, is_primary: true, created_at: '' }] : [];

  return (
    <div className="flex flex-col gap-3">
      {/* Main Large Image Slot */}
      <div className="w-full rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 shadow-xs">
        <ProductImageFallback
          src={selectedImage}
          alt={productName}
          aspectRatio="4/3"
          categorySlug={categorySlug}
          className="transition-all duration-300"
        />
      </div>

      {/* Thumbnails Row if multiple images */}
      {allImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
          {allImages.map((img, idx) => {
            const isSelected = selectedImage === img.image_url;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedImage(img.image_url)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden border shrink-0 transition-all ${
                  isSelected
                    ? 'border-stone-900 ring-2 ring-stone-900/10 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 opacity-70 hover:opacity-100'
                }`}
              >
                <ProductImageFallback
                  src={img.image_url}
                  alt={img.alt_text || `${productName} foto ${idx + 1}`}
                  aspectRatio="square"
                  categorySlug={categorySlug}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
