'use client';

import { useMarketStore } from '@/lib/store';

export function MarketStatus() {
  const wsStatus = useMarketStore((s) => s.wsStatus);
  const quoteCount = useMarketStore((s) => Object.keys(s.quotes).length);

  const statusLabel = { connecting: 'Bağlanıyor…', open: 'Canlı', closed: 'Bağlantı kesildi' }[wsStatus];
  const dotClass = { connecting: 'bg-amber-400', open: 'bg-emerald-400', closed: 'bg-red-500' }[wsStatus];

  return (
    <div className="mx-3 mt-3 panel px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotClass} ${wsStatus === 'open' ? 'animate-pulse' : ''}`} />
        <span className="text-sm">{statusLabel}</span>
      </div>
      <span className="text-xs text-slate-500">{quoteCount} sembol</span>
    </div>
  );
}
