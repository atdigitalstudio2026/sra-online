import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingBag, Package, User, ArrowRight, X } from 'lucide-react';
import { getAdminOrders } from '../../services/orderService';
import { getProducts } from '../../services/productService';
import { getCustomerMetrics } from '../../services/customerService';
import { formatRupiah } from '../../utils/formatters';

interface AdminGlobalSearchProps {
  onNavigate: (path: string) => void;
}

export const AdminGlobalSearch: React.FC<AdminGlobalSearchProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{
    orders: { id: string; title: string; subtitle: string; path: string }[];
    products: { id: string; title: string; subtitle: string; path: string }[];
    customers: { id: string; title: string; subtitle: string; path: string }[];
  }>({ orders: [], products: [], customers: [] });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ orders: [], products: [], customers: [] });
      return;
    }

    const timer = setTimeout(async () => {
      const q = query.trim().toLowerCase();

      try {
        const [ordersRes, prodsRes, custs] = await Promise.all([
          getAdminOrders({ search: q, limit: 5 }),
          getProducts({ search: q, limit: 5 }),
          getCustomerMetrics({ search: q }),
        ]);

        const matchedOrders = ordersRes.orders.slice(0, 4).map((o) => ({
          id: o.id,
          title: o.order_number,
          subtitle: `${o.customer_name} • ${formatRupiah(o.grand_total)}`,
          path: `/admin/orders/${o.id}`,
        }));

        const matchedProducts = prodsRes.data.slice(0, 4).map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: `${p.sku} • Stok: ${p.stock} • ${formatRupiah(p.price)}`,
          path: `/admin/products/${p.id}/edit`,
        }));

        const matchedCustomers = custs.slice(0, 4).map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: `${c.phone} • ${c.total_orders} pesanan`,
          path: `/admin/customers/${c.id}`,
        }));

        setResults({
          orders: matchedOrders,
          products: matchedProducts,
          customers: matchedCustomers,
        });
        setIsOpen(true);
      } catch (err) {
        console.warn('Global search query error', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery('');
    onNavigate(path);
  };

  const hasAnyResults =
    results.orders.length > 0 || results.products.length > 0 || results.customers.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari pesanan, produk, pelanggan..."
          className="w-full pl-8 pr-7 py-1.5 text-xs bg-stone-100 hover:bg-stone-50 focus:bg-white border border-transparent focus:border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 transition-all focus:outline-hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs divide-y divide-stone-100 max-h-96 overflow-y-auto animate-in fade-in duration-100">
          {hasAnyResults ? (
            <>
              {/* Orders Group */}
              {results.orders.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-3 h-3" />
                    <span>Pesanan ({results.orders.length})</span>
                  </div>
                  {results.orders.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item.path)}
                      className="p-2 rounded-lg hover:bg-stone-50 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-mono font-bold text-stone-900">{item.title}</div>
                        <div className="text-[11px] text-stone-500">{item.subtitle}</div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-stone-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Products Group */}
              {results.products.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <Package className="w-3 h-3" />
                    <span>Produk ({results.products.length})</span>
                  </div>
                  {results.products.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item.path)}
                      className="p-2 rounded-lg hover:bg-stone-50 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-stone-900">{item.title}</div>
                        <div className="text-[11px] text-stone-500">{item.subtitle}</div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-stone-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Customers Group */}
              {results.customers.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    <span>Pelanggan ({results.customers.length})</span>
                  </div>
                  {results.customers.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item.path)}
                      className="p-2 rounded-lg hover:bg-stone-50 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-stone-900">{item.title}</div>
                        <div className="text-[11px] text-stone-500">{item.subtitle}</div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-stone-400" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-stone-400">
              Tidak ada hasil yang cocok dengan "{query}".
            </div>
          )}
        </div>
      )}
    </div>
  );
};
