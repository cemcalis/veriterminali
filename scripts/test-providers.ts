import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { BinanceProvider } from '../src/providers/binance.provider.js';
import { TradingViewTwcProvider } from '../src/providers/tradingview-twc.provider.js';
import { TradingViewMicroserviceProvider } from '../src/providers/tradingview-microservice.provider.js';
import { TradingViewWsClientProvider } from '../src/providers/tradingview-ws-client.provider.js';
import { StockerApiProvider } from '../src/providers/stockerapi.provider.js';
import { FinnhubProvider } from '../src/providers/finnhub.provider.js';
import { TwelveDataProvider } from '../src/providers/twelvedata.provider.js';
import { YahooProvider } from '../src/providers/yahoo.provider.js';
import { FmpProvider } from '../src/providers/fmp.provider.js';
import { AlphaVantageProvider } from '../src/providers/alphavantage.provider.js';
import { PolygonProvider } from '../src/providers/polygon.provider.js';
import { EcbProvider } from '../src/providers/ecb.provider.js';
import { BigparaProvider } from '../src/providers/bigpara.provider.js';
import { IsYatirimProvider } from '../src/providers/isyatirim.provider.js';
import { TcmbEvdsProvider } from '../src/providers/tcmb-evds.provider.js';
import { BiQuoteProvider } from '../src/providers/biquote.provider.js';
import type { MarketProvider } from '../src/providers/market-provider.interface.js';

const SYMBOLS = {
  crypto: ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:SOLUSDT'],
  forex: ['EURUSD', 'GBPUSD', 'USDTRY', 'XAUUSD', 'XAGUSD'],
  commodity: ['GOLD', 'SILVER', 'USOIL', 'BRENT', 'NATGAS'],
  bist: ['BIST:XU100', 'BIST:THYAO', 'BIST:ASELS', 'BIST:KCHOL', 'BIST:SISE'],
  us_stock: ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'SPY', 'QQQ'],
};

// bigpara/isyatirim expect a bare BIST code (no "BIST:" prefix); tcmb-evds
// expects a plain 6-letter pair (no "FX:" prefix) like the other REST
// providers already handle via mapSymbolForProvider below.

// TradingView-format symbol aliases for sources that need EXCHANGE:TICKER
const TV_ALIASES: Record<string, string> = {
  GOLD: 'TVC:GOLD',
  SILVER: 'TVC:SILVER',
  USOIL: 'TVC:USOIL',
  BRENT: 'BLACKBULL:BRENT',
  NATGAS: 'NATGAS',
  XAUUSD: 'OANDA:XAUUSD',
  XAGUSD: 'OANDA:XAGUSD',
  EURUSD: 'FX:EURUSD',
  GBPUSD: 'FX:GBPUSD',
  USDTRY: 'FX_IDC:USDTRY',
};

interface SymbolResult {
  symbol: string;
  ok: boolean;
  price: number | null;
  latencyMs: number | null;
  error?: string;
}

interface ProviderResult {
  id: string;
  name: string;
  experimental: boolean;
  isRealtime: boolean;
  health: { healthy: boolean; message: string; latencyMs: number | null; requiresApiKey: boolean; apiKeyPresent: boolean };
  byCategory: Record<string, SymbolResult[]>;
}

async function testProviderQuote(
  provider: MarketProvider,
  symbol: string,
): Promise<SymbolResult> {
  const start = Date.now();
  try {
    const quote = await Promise.race([
      provider.getQuote(symbol),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout 8s')), 8000)),
    ]);
    const latencyMs = Date.now() - start;
    if (!quote || quote.price === null || Number.isNaN(quote.price)) {
      return { symbol, ok: false, price: null, latencyMs, error: 'no price returned' };
    }
    return { symbol, ok: true, price: quote.price, latencyMs };
  } catch (err) {
    return {
      symbol,
      ok: false,
      price: null,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function mapSymbolForProvider(providerId: string, symbol: string): string {
  if (providerId.startsWith('tradingview') && TV_ALIASES[symbol]) return TV_ALIASES[symbol];
  return symbol;
}

async function runProviderTests(provider: MarketProvider): Promise<ProviderResult> {
  console.log(`\n=== Testing provider: ${provider.id} (${provider.name}) ===`);
  const health = await provider.healthCheck();
  console.log(`  health: healthy=${health.healthy} latency=${health.latencyMs}ms msg="${health.message}"`);

  const byCategory: Record<string, SymbolResult[]> = {};

  for (const category of provider.categories) {
    const symbols = SYMBOLS[category as keyof typeof SYMBOLS];
    if (!symbols) continue;
    const results: SymbolResult[] = [];
    for (const symbol of symbols) {
      const mapped = mapSymbolForProvider(provider.id, symbol);
      const result = await testProviderQuote(provider, mapped);
      result.symbol = `${symbol}${mapped !== symbol ? ` (as ${mapped})` : ''}`;
      results.push(result);
      const status = result.ok ? `OK price=${result.price}` : `FAIL ${result.error}`;
      console.log(`    [${category}] ${result.symbol}: ${status} (${result.latencyMs}ms)`);
    }
    byCategory[category] = results;
  }

  return {
    id: provider.id,
    name: provider.name,
    experimental: provider.experimental,
    isRealtime: provider.isRealtime,
    health: {
      healthy: health.healthy,
      message: health.message,
      latencyMs: health.latencyMs,
      requiresApiKey: health.requiresApiKey,
      apiKeyPresent: health.apiKeyPresent,
    },
    byCategory,
  };
}

function renderReport(results: ProviderResult[]): string {
  const lines: string[] = [];
  lines.push('# Provider Test Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Provider | Realtime | Experimental | Health | API Key |');
  lines.push('|---|---|---|---|---|');
  for (const r of results) {
    const keyCol = r.health.requiresApiKey
      ? r.health.apiKeyPresent
        ? 'required, present'
        : 'required, MISSING'
      : 'not required';
    lines.push(
      `| ${r.name} (\`${r.id}\`) | ${r.isRealtime ? 'yes' : 'no'} | ${r.experimental ? 'YES (unofficial)' : 'no'} | ${r.health.healthy ? 'OK' : 'DOWN'} — ${r.health.message} | ${keyCol} |`,
    );
  }
  lines.push('');

  for (const r of results) {
    lines.push(`## ${r.name} (\`${r.id}\`)`);
    lines.push('');
    lines.push(`- Realtime: ${r.isRealtime}`);
    lines.push(`- Experimental/unofficial: ${r.experimental}`);
    lines.push(`- Health: ${r.health.healthy ? 'OK' : 'DOWN'} (${r.health.latencyMs ?? 'n/a'}ms) — ${r.health.message}`);
    lines.push('');
    const categories = Object.keys(r.byCategory);
    if (categories.length === 0) {
      lines.push('_No categories tested (provider not applicable or no API key)._');
      lines.push('');
      continue;
    }
    for (const cat of categories) {
      const results = r.byCategory[cat];
      const okCount = results.filter((x) => x.ok).length;
      lines.push(`### ${cat} (${okCount}/${results.length} working)`);
      lines.push('');
      lines.push('| Symbol | Status | Price | Latency |');
      lines.push('|---|---|---|---|');
      for (const res of results) {
        lines.push(
          `| ${res.symbol} | ${res.ok ? 'OK' : `FAIL: ${res.error}`} | ${res.price ?? '-'} | ${res.latencyMs ?? '-'}ms |`,
        );
      }
      lines.push('');
    }
  }

  lines.push('## Conclusions & Recommended Routing');
  lines.push('');
  const workingRealtime = results.filter((r) => r.isRealtime && r.health.healthy && !r.experimental);
  const workingExperimental = results.filter((r) => r.isRealtime && r.health.healthy && r.experimental);
  const workingFallback = results.filter((r) => !r.isRealtime && r.health.healthy);
  lines.push(`- Official realtime sources that work: ${workingRealtime.map((r) => r.id).join(', ') || 'none'}`);
  lines.push(`- Experimental/unofficial realtime sources that work: ${workingExperimental.map((r) => r.id).join(', ') || 'none'}`);
  lines.push(`- Delayed/fallback sources that work: ${workingFallback.map((r) => r.id).join(', ') || 'none'}`);
  lines.push('');
  lines.push('Recommended routing implemented in `provider-registry.ts`:');
  lines.push('1. Crypto -> `binance` (official, free, true realtime, no key)');
  lines.push('2. Forex/commodities/BIST/US stocks/indices -> `tradingview-twc` (experimental unofficial feed, true realtime, no key) as primary since it is the only source with full free coverage of all these markets');
  lines.push('3. If TradingView unofficial feed is unavailable -> `finnhub` / `twelvedata` if API keys are configured (delayed/polling)');
  lines.push('4. Final fallback -> `yahoo` (unofficial, delayed, no key)');
  lines.push('5. `stockerapi` is disabled by default: the repo has no free tier, it is a paid product shell');
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const providers: MarketProvider[] = [
    new BinanceProvider(),
    new TradingViewTwcProvider(),
    new TradingViewMicroserviceProvider(),
    new TradingViewWsClientProvider(),
    new StockerApiProvider(),
    new FinnhubProvider(),
    new TwelveDataProvider(),
    new FmpProvider(),
    new AlphaVantageProvider(),
    new PolygonProvider(),
    new EcbProvider(),
    new BigparaProvider(),
    new IsYatirimProvider(),
    new TcmbEvdsProvider(),
    new BiQuoteProvider(),
    new YahooProvider(),
  ];

  const results: ProviderResult[] = [];
  let anyWorking = false;

  for (const provider of providers) {
    try {
      const result = await runProviderTests(provider);
      results.push(result);
      const anyOk = Object.values(result.byCategory).some((arr) => arr.some((x) => x.ok));
      if (anyOk) anyWorking = true;
    } catch (err) {
      console.error(`Provider ${provider.id} crashed during testing:`, err);
    } finally {
      try {
        await provider.disconnect();
      } catch {
        /* ignore */
      }
    }
  }

  const report = renderReport(results);
  writeFileSync(new URL('../provider-test-report.md', import.meta.url), report, 'utf-8');
  console.log('\nReport written to provider-test-report.md');
  console.log(anyWorking ? '\nAt least one provider returned real data.' : '\nWARNING: no provider returned real data.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});
