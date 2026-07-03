'use client';

import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import { GreetingHeader } from '@/components/greeting-header';
import { MarketStatus } from '@/components/market-status';
import { ExchangeSessionsStrip } from '@/components/exchange-sessions-strip';
import { QuickActions } from '@/components/quick-actions';
import { MarketOverview } from '@/components/market-overview';
import { TopMovers } from '@/components/top-movers';
import { RecentlyViewed } from '@/components/recently-viewed';
import { ProviderHealthStrip } from '@/components/provider-health-strip';
import { Section } from '@/components/section';
import { PriceCard } from '@/components/price-card';
import { useMarketStore } from '@/lib/store';
import { SYMBOL_CATALOG } from '@/lib/symbols';
import { useSymbolSubscription } from '@/lib/use-market-socket';

const symbolIndex = new Map(SYMBOL_CATALOG.map((s) => [s.symbol, s]));

function WatchlistPreview() {
  const watchlist = useMarketStore((s) => s.watchlist);
  useSymbolSubscription(watchlist);
  if (watchlist.length === 0) return null;
  const defs = watchlist.map((s) => symbolIndex.get(s)).filter((d): d is NonNullable<typeof d> => !!d).slice(0, 5);

  return (
    <section className="px-4 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          <Star size={13} className="text-amber-400" /> İzleme Listem
        </h2>
        <Link href="/piyasalar?category=watchlist" className="flex items-center gap-0.5 text-[11px] text-emerald-400">
          Tümünü gör <ChevronRight size={12} />
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {defs.map((def) => (
          <PriceCard key={def.symbol} def={def} />
        ))}
      </div>
    </section>
  );
}

export default function AnasayfaPage() {
  return (
    <div className="pb-4">
      <GreetingHeader />
      <MarketStatus />
      <ExchangeSessionsStrip />
      <QuickActions />
      <MarketOverview />
      <TopMovers title="Yükselenler" direction="up" emptyHint="Şu an yükselen enstrüman verisi bekleniyor" />
      <TopMovers title="Düşenler" direction="down" emptyHint="Şu an düşen enstrüman verisi bekleniyor" />
      <TopMovers title="Trend Kripto" direction="up" category="crypto" emptyHint="Kripto verisi akışa bağlanıyor" />
      <WatchlistPreview />
      <RecentlyViewed />
      <ProviderHealthStrip />
      <Section title="Kripto Paralar" category="crypto" />
      <Section title="Kripto Vadeli" category="crypto_futures" />
      <Section title="Endeksler" category="index" />
      <Section title="Forex" category="forex" />
      <Section title="Emtia" category="commodity" />
      <Section title="BIST" category="bist" />
      <Section title="ABD Hisseleri" category="us_stock" />
      <Section title="ETF" category="etf" />
    </div>
  );
}
