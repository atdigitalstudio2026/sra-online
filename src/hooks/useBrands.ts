import { useState, useEffect, useCallback } from 'react';
import { Brand } from '../types';
import { getBrands } from '../services/brandService';

export function useBrands(includeInactive = false) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrnds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBrands(includeInactive);
      setBrands(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat brand.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchBrnds();
  }, [fetchBrnds]);

  return { brands, isLoading, error, refetch: fetchBrnds };
}
