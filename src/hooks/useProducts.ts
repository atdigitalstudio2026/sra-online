import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductWithDetails, ProductFilterParams, PaginatedResult } from '../types';
import { getProducts } from '../services/productService';

interface UseProductsOptions extends ProductFilterParams {
  debounceMs?: number;
}

export function useProducts(initialParams: UseProductsOptions = {}) {
  const [params, setParams] = useState<UseProductsOptions>(initialParams);
  const [result, setResult] = useState<PaginatedResult<ProductWithDetails>>({
    data: [],
    total: 0,
    page: initialParams.page || 1,
    limit: initialParams.limit || 12,
    total_pages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProductsList = useCallback(async (currentParams: ProductFilterParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getProducts(currentParams);
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat katalog produk.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update effect with debounce for search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const { debounceMs = 300, ...queryParams } = params;

    if (params.search !== undefined) {
      debounceTimerRef.current = setTimeout(() => {
        fetchProductsList(queryParams);
      }, debounceMs);
    } else {
      fetchProductsList(queryParams);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [params, fetchProductsList]);

  const updateFilters = useCallback((newParams: Partial<ProductFilterParams>) => {
    setParams((prev) => ({
      ...prev,
      ...newParams,
      // Reset page to 1 when changing filters, unless page is explicitly provided
      page: newParams.page !== undefined ? newParams.page : 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setParams({
      page: 1,
      limit: initialParams.limit || 12,
      search: '',
      category_id: undefined,
      category_slug: undefined,
      brand_id: undefined,
      min_price: undefined,
      max_price: undefined,
      stock_status: 'all',
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  }, [initialParams.limit]);

  const refetch = useCallback(() => {
    const { debounceMs, ...queryParams } = params;
    fetchProductsList(queryParams);
  }, [params, fetchProductsList]);

  return {
    products: result.data,
    total: result.total,
    page: result.page,
    totalPages: result.total_pages,
    limit: result.limit,
    isLoading,
    error,
    filters: params,
    updateFilters,
    resetFilters,
    refetch,
  };
}
