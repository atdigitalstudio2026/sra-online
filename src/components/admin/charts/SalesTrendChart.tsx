import React, { useState } from 'react';
import { SalesOverTimePoint } from '../../../types';
import { formatRupiah } from '../../../utils/formatters';

interface SalesTrendChartProps {
  data: SalesOverTimePoint[];
  title?: string;
  metric?: 'sales' | 'orders';
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data,
  title = 'Tren Penjualan & Pesanan',
  metric = 'sales',
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<SalesOverTimePoint | null>(null);
  const [activeMetric, setActiveMetric] = useState<'sales' | 'orders'>(metric);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-stone-400 text-xs">
        <span>Tidak ada data transaksi pada rentang waktu ini.</span>
      </div>
    );
  }

  const values = data.map((d) => (activeMetric === 'sales' ? d.sales : d.orders));
  const maxValue = Math.max(...values, activeMetric === 'sales' ? 100000 : 5);
  const minValue = 0;

  // Chart dimensions
  const height = 220;
  const paddingX = 40;
  const paddingY = 25;
  const chartWidth = 600;

  const points = data.map((d, idx) => {
    const val = activeMetric === 'sales' ? d.sales : d.orders;
    const x = paddingX + (idx / Math.max(1, data.length - 1)) * (chartWidth - paddingX * 2);
    const y = height - paddingY - ((val - minValue) / (maxValue - minValue || 1)) * (height - paddingY * 2);
    return { x, y, data: d };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
          {title}
        </h3>

        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveMetric('sales')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeMetric === 'sales'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Nilai Penjualan (IDR)
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('orders')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeMetric === 'orders'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Volume Pesanan
          </button>
        </div>
      </div>

      {/* SVG Responsive Container */}
      <div className="relative bg-stone-50/50 border border-stone-100 rounded-xl p-3 overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-56 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b45309" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - paddingY - ratio * (height - paddingY * 2);
            const val = minValue + ratio * (maxValue - minValue);
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#e7e5e4"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-stone-400 font-mono"
                >
                  {activeMetric === 'sales' ? `${Math.round(val / 1000)}k` : Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {/* Line curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#92400e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint?.date === pt.data.date ? 5 : 3.5}
                className="fill-white stroke-amber-800 transition-all cursor-pointer"
                strokeWidth="2"
                onMouseEnter={() => setHoveredPoint(pt.data)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* X Axis Date labels (sample every few points to avoid crowding) */}
              {(points.length <= 8 || i % Math.ceil(points.length / 7) === 0) && (
                <text
                  x={pt.x}
                  y={height - 6}
                  textAnchor="middle"
                  className="text-[9px] fill-stone-400 font-mono"
                >
                  {pt.data.label}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-stone-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-0.5 pointer-events-none animate-in fade-in duration-150">
            <div className="text-[10px] text-stone-400 font-mono">{hoveredPoint.date}</div>
            <div className="font-bold text-amber-400">
              {formatRupiah(hoveredPoint.sales)}
            </div>
            <div className="text-[11px] text-stone-300">
              {hoveredPoint.orders} transaksi pesanan
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
