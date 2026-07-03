'use client';

import { motion } from 'framer-motion';
import { useMarketStore } from '@/lib/store';
import { SYMBOL_CATALOG } from '@/lib/symbols';

const LABELS = {
  open: 'Piyasalar canlı',
  connecting: 'Veriler güncelleniyor',
  closed: 'Bağlantı kesildi',
} as const;

/** Public, non-technical connection indicator: a clean status line with a
 * green pulse dot. No symbol counts, provider names, or other internal
 * details -- those only ever show up in developer/debug mode (Ayarlar). */
export function MarketStatus() {
  const wsStatus = useMarketStore((s) => s.wsStatus);
  const quoteCount = useMarketStore((s) => Object.keys(s.quotes).length);
  const debugMode = useMarketStore((s) => s.debugMode);

  const dotClass = { open: 'bg-emerald-400', connecting: 'bg-amber-400', closed: 'bg-red-500' }[wsStatus];
  const textClass = { open: 'text-[var(--foreground)]', connecting: 'text-amber-300', closed: 'text-red-400' }[wsStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-4 mt-3 panel-elevated px-4 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-2.5">
        <span className={`relative flex h-2.5 w-2.5 shrink-0`}>
          {wsStatus === 'open' && (
            <span className={`absolute inline-flex h-full w-full rounded-full ${dotClass} opacity-60 animate-ping`} />
          )}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotClass}`} />
        </span>
        <span className={`text-sm font-medium ${textClass}`}>{LABELS[wsStatus]}</span>
      </div>
      {debugMode && <span className="text-xs text-slate-500 font-mono">{quoteCount} / {SYMBOL_CATALOG.length}</span>}
    </motion.div>
  );
}
