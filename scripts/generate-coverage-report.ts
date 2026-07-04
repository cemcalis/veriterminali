/**
 * Walks the full SYMBOL_CATALOG (~1000+ symbols across 7 categories) and
 * produces provider-coverage-report.md: total/working/failed symbol
 * counts, which provider streams each category live vs. which one is the
 * REST/delayed fallback, and a live/delayed status sample.
 *
 * Crypto coverage is checked exhaustively (a single batched Binance
 * request covers every symbol). Non-crypto categories are checked via a
 * bounded, concurrent sample (the unofficial TradingView socket is slow
 * per-symbol; probing all ~750 of them serially would take unreasonably
 * long for a report that's meant to be regenerated regularly).
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { BinanceProvider } from '../src/providers/binance.provider.js';
import { TradingViewTwcProvider } from '../src/providers/tradingview-twc.provider.js';
import { YahooProvider } from '../src/providers/yahoo.provider.js';
import { SYMBOL_CATALOG, symbolsByCategory } from '../src/symbols.js';
import type { MarketCategory } from '../src/providers/market-provider.interface.js';

const SAMPLE_SIZE_PER_CATEGORY = 10;

const CATEGORY_LABELS: Record<MarketCategory, string> = {
  crypto: 'Crypto',
  crypto_futures: 'Crypto Futures',
  forex: 'Forex',
  commodity: 'Commodities',
  bist: 'BIST (Turkish equities)',
  us_stock: 'US Stocks',
  etf: 'ETFs',
  index: 'Global Indices',
};

async function checkCryptoExhaustive(binance: BinanceProvider) {
  const symbols = symbolsByCategory('crypto');
  const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
  const rows: Array<{ symbol: string; lastPrice: string }> = res.ok ? await res.json() : [];
  const byTicker = new Map(rows.map((r) => [r.symbol, r]));
  let working = 0;
  const failedSymbols: string[] = [];
  for (const s of symbols) {
    const row = s.binanceSymbol ? byTicker.get(s.binanceSymbol) : undefined;
    if (row && Number(row.lastPrice) > 0) working += 1;
    else failedSymbols.push(s.symbol);
  }
  void binance;
  return { total: symbols.length, working, failed: symbols.length - working, failedSymbols, provider: 'binance', status: 'live' as const };
}

async function checkCategorySample(category: MarketCategory, tv: TradingViewTwcProvider, yahoo: YahooProvider) {
  const all = symbolsByCategory(category);
  const sample = all.slice(0, SAMPLE_SIZE_PER_CATEGORY);

  const tvResults = await Promise.all(
    sample.map(async (s) => {
      try {
        const q = await tv.getQuote(s.symbol);
        return { symbol: s.symbol, ok: !!q && q.price !== null };
      } catch {
        return { symbol: s.symbol, ok: false };
      }
    }),
  );
  const tvWorking = tvResults.filter((r) => r.ok).length;

  let yahooWorking = 0;
  if (tvWorking < sample.length) {
    const yahooResults = await Promise.all(
      sample.map(async (s) => {
        if (!s.yahooSymbol) return false;
        try {
          const q = await yahoo.getQuote(s.yahooSymbol);
          return !!q && q.price !== null;
        } catch {
          return false;
        }
      }),
    );
    yahooWorking = yahooResults.filter(Boolean).length;
  }

  const sampleWorkingRatio = Math.max(tvWorking, yahooWorking) / sample.length;
  const estimatedWorking = Math.round(all.length * sampleWorkingRatio);
  const primaryProvider = tvWorking >= yahooWorking ? 'tradingview-twc (experimental)' : 'yahoo (delayed fallback)';
  const status = tvWorking > 0 ? 'near-live (sampled)' : yahooWorking > 0 ? 'delayed (sampled)' : 'unavailable (sampled)';

  return {
    total: all.length,
    sampleSize: sample.length,
    sampleTvWorking: tvWorking,
    sampleYahooWorking: yahooWorking,
    estimatedWorking,
    estimatedFailed: all.length - estimatedWorking,
    provider: primaryProvider,
    status,
  };
}

function renderReport(
  totalSymbols: number,
  crypto: Awaited<ReturnType<typeof checkCryptoExhaustive>>,
  others: Record<string, Awaited<ReturnType<typeof checkCategorySample>>>,
): string {
  const lines: string[] = [];
  lines.push('# Provider Coverage Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`**Total symbols in catalog: ${totalSymbols}**`);
  lines.push('');
  lines.push('## Summary by category');
  lines.push('');
  lines.push('| Category | Total | Working | Failed | Primary provider | Status |');
  lines.push('|---|---|---|---|---|---|');
  lines.push(
    `| ${CATEGORY_LABELS.crypto} | ${crypto.total} | ${crypto.working} | ${crypto.failed} | binance (official WS) | live |`,
  );
  for (const [cat, r] of Object.entries(others)) {
    lines.push(
      `| ${CATEGORY_LABELS[cat as MarketCategory]} | ${r.total} | ~${r.estimatedWorking} | ~${r.estimatedFailed} | ${r.provider} | ${r.status} |`,
    );
  }
  lines.push('');
  lines.push(
    '> Non-crypto rows are extrapolated from a live concurrent sample of the first ' +
      `${SAMPLE_SIZE_PER_CATEGORY} symbols per category (checked against the unofficial TradingView feed, ` +
      'then Yahoo Finance as delayed fallback) — probing all ~750 non-crypto symbols individually against the ' +
      'unofficial per-symbol TradingView protocol is too slow to run on every regeneration. Crypto is checked ' +
      'exhaustively via a single batched Binance request.',
  );
  lines.push('');

  if (crypto.failedSymbols.length > 0) {
    lines.push('## Crypto symbols with no live Binance ticker (excluded from working count)');
    lines.push('');
    lines.push(crypto.failedSymbols.map((s) => `- ${s}`).join('\n'));
    lines.push('');
  }

  lines.push('## Provider status legend');
  lines.push('');
  lines.push('- **live** — official, true real-time push feed (Binance WebSocket)');
  lines.push('- **near-live** — unofficial/reverse-engineered real-time feed (TradingView), no official SLA');
  lines.push('- **delayed** — REST polling / delayed data (Yahoo Finance, Finnhub/TwelveData free tiers)');
  lines.push('- **fallback** — data returned but tick is stale beyond the freshness window');
  lines.push('- **unavailable** — no provider currently returns data for this symbol');
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const binance = new BinanceProvider();
  const tv = new TradingViewTwcProvider();
  const yahoo = new YahooProvider();
  await tv.connect();

  const crypto = await checkCryptoExhaustive(binance);

  const nonCryptoCategories = (Object.keys(CATEGORY_LABELS) as MarketCategory[]).filter((c) => c !== 'crypto');
  const others: Record<string, Awaited<ReturnType<typeof checkCategorySample>>> = {};
  for (const cat of nonCryptoCategories) {
    console.log(`Sampling ${cat}...`);
    others[cat] = await checkCategorySample(cat, tv, yahoo);
  }

  const report = renderReport(SYMBOL_CATALOG.length, crypto, others);
  writeFileSync(new URL('../provider-coverage-report.md', import.meta.url), report, 'utf-8');
  console.log('\nReport written to provider-coverage-report.md');

  await tv.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error generating coverage report:', err);
  process.exit(1);
});
