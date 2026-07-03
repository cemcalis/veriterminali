'use client';

import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import { SYMBOL_CATALOG } from '@/lib/symbols';

export function MarketStatus() {
  const wsStatus = useMarketStore((s) => s.wsStatus);
  const quoteCount = useMarketStore((s) => Object.keys(s.quotes).length);

  const statusLabel = { connecting: 'Bağlanıyor…', open: 'Canlı', closed: 'Bağlantı kesildi' }[wsStatus];
  const colorClass = { connecting: 'text-amber-400', open: 'text-emerald-400', closed: 'text-red-500' }[wsStatus];
  const Icon = wsStatus === 'open' ? Wifi : wsStatus === 'connecting' ? Loader2 : WifiOff;

  return (
    <div className="mx-3 mt-3 panel px-3 py-2 flex items-center justify-between">
      <div className={`flex items-center gap-2 ${colorClass}`}>
        <Icon size={15} className={wsStatus === 'connecting' ? 'animate-spin' : ''} />
        <span className="text-sm text-[var(--foreground)]">{statusLabel}</span>
      </div>
      <span className="text-xs text-slate-500">
        {quoteCount} / {SYMBOL_CATALOG.length} sembol akışta
      </span>
    </div>
  );
}
