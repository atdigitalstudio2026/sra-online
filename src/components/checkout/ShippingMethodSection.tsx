import React from 'react';
import { ShippingMethod } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { Truck, Zap, PackageCheck, Check } from 'lucide-react';

interface ShippingMethodSectionProps {
  methods: ShippingMethod[];
  selectedMethodId: string;
  onSelectMethod: (id: string) => void;
  isLoading?: boolean;
  error?: string;
}

export const ShippingMethodSection: React.FC<ShippingMethodSectionProps> = ({
  methods,
  selectedMethodId,
  onSelectMethod,
  isLoading = false,
  error,
}) => {
  const getIcon = (code: string) => {
    switch (code) {
      case 'EXP':
        return <Zap className="w-4 h-4 text-amber-600" />;
      case 'CARGO':
        return <PackageCheck className="w-4 h-4 text-purple-600" />;
      default:
        return <Truck className="w-4 h-4 text-stone-600" />;
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
        <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
          3
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
          Metode Pengiriman
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-16 bg-stone-100 rounded-xl" />
          <div className="h-16 bg-stone-100 rounded-xl" />
        </div>
      ) : methods.length === 0 ? (
        <div className="p-4 text-center text-xs text-stone-500 bg-stone-50 rounded-xl">
          Belum ada metode pengiriman yang aktif.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {methods.map((method) => {
            const isSelected = selectedMethodId === method.id;
            return (
              <div
                key={method.id}
                onClick={() => onSelectMethod(method.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-stone-950 ring-2 ring-stone-950/5 bg-stone-50/70 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {getIcon(method.code)}
                      <span className="text-xs font-bold text-stone-900">{method.name}</span>
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                    {method.description || 'Pengiriman komoditas pilihan'}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-baseline justify-between">
                  <span className="text-[10px] text-stone-400 font-medium">
                    {method.estimated_days}
                  </span>
                  <span className="text-xs font-bold text-stone-950 tabular-nums">
                    {formatRupiah(method.price)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
};
