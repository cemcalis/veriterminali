'use client';

import { motion } from 'framer-motion';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import { SYMBOL_CATALOG } from '@/lib/symbols';

export function MarketStatus() {
  const wsStatus = useMarketStore((s) => s.wsStatus);
  const quoteCount = useMarketStore((s) => Object.keys(s.quotes).length);

  const statusLabel = { connecting: 'Bağlanıyor…', open: 'Canlı', closed: 'Bağlantı kesildi' }[wsStatus];
  const colorClass = { connecting: 'text-amber-400', open: 'text-emerald-400', closed: 'text-red-500' }[wsStatus];
  const Icon = wsStatus === 'open' ? Wifi : wsStatus === 'connecting' ? Loader2 : WifiOff;
  const pct = Math.min(100, (quoteCount / SYMBOL_CATALOG.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-4 mt-3 panel-elevated px-3.5 py-3"
    >
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 ${colorClass}`}>
          <Icon size={15} className={wsStatus === 'connecting' ? 'animate-spin' : ''} />
          <span className="text-sm text-[var(--foreground)] font-medium">{statusLabel}</span>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {quoteCount} / {SYMBOL_CATALOG.length}
        </span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${wsStatus === 'open' ? 'gradient-accent' : 'bg-amber-500'}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </motion.div>
  );
}
