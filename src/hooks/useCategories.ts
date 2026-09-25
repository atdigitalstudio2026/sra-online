import { useState, useEffect, useCallback } from 'react';
import { Category } from '../types';
import { getCategories } from '../services/categoryService';

export function useCategories(includeInactive = false) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCategories(includeInactive);
      setCategories(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat kategori.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchCats();
  }, [fetchCats]);

  return { categories, isLoading, error, refetch: fetchCats };
}
