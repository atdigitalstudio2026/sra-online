import { useState, useEffect, useCallback } from 'react';
import { ProductWithDetails } from '../types';
import { getProductBySlug } from '../services/productService';

export function useProduct(slug?: string) {
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!slug) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getProductBySlug(slug);
      setProduct(data);
      if (!data) {
        setError('Produk yang Anda cari tidak ditemukan atau sudah tidak aktif.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat detail produk.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { product, isLoading, error, refetch: fetchDetail };
}
