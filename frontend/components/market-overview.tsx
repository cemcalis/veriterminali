'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import { useMarketStore } from '@/lib/store';

const CARDS = [
  { key: 'gainers', label: 'Yükselenler', icon: TrendingUp, tone: 'text-emerald-400' },
  { key: 'losers', label: 'Düşenler', icon: TrendingDown, tone: 'text-red-400' },
  { key: 'watchlist', label: 'İzleme Listem', icon: Star, tone: 'text-amber-400' },
] as const;

export function MarketOverview() {
  const quotes = useMarketStore((s) => s.quotes);
  const watchlist = useMarketStore((s) => s.watchlist);

  const stats = useMemo(() => {
    const values = Object.values(quotes);
    const gainers = values.filter((q) => (q.changePercent ?? 0) > 0).length;
    const losers = values.filter((q) => (q.changePercent ?? 0) < 0).length;
    return { gainers, losers, watchlist: watchlist.length };
  }, [quotes, watchlist]);

  return (
    <div className="px-4 pt-3 grid grid-cols-3 gap-2">
      {CARDS.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="panel-elevated flex flex-col items-center justify-center gap-1 py-3 px-1"
          >
            <Icon size={15} className={card.tone} />
            <span className="text-sm font-mono font-semibold">{stats[card.key].toLocaleString('tr-TR')}</span>
            <span className="text-[9px] text-slate-500 text-center leading-tight">{card.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
