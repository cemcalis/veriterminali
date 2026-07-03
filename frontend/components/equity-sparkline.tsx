'use client';

import type { EquitySnapshot } from '@/lib/types';

/** Minimal dependency-free line sparkline for the portfolio equity curve.
 * Not worth pulling in the full lightweight-charts imperative API for a
 * handful of daily points. */
export function EquitySparkline({ history }: { history: EquitySnapshot[] }) {
  if (history.length < 2) {
    return <div className="text-[11px] text-slate-500 py-6 text-center">Eğri için en az 2 günlük veri gerekli</div>;
  }

  const width = 320;
  const height = 64;
  const values = history.map((h) => h.totalValue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = history.map((h, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - ((h.totalValue - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const isUp = values[values.length - 1] >= values[0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16" preserveAspectRatio="none">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={isUp ? '#34d399' : '#f87171'}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
