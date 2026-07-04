/**
 * TradingView's public Screener/Scanner backend (scanner.tradingview.com),
 * discovered via veriterminali-data/bist_data_fetcher.py. This is a
 * DIFFERENT endpoint from the tradingview-twc quote-session socket
 * (data.tradingview.com) this project already relies on for per-symbol
 * quotes -- one POST returns all ~600+ BIST-listed stocks in a single
 * batch (last price, absolute/percent change, volume), which is a much
 * better fit for bulk table/scanner views than per-symbol subscriptions.
 *
 * Scope is deliberately narrow: bulk BIST scanner/table data ONLY. This
 * provider is NEVER added to fallbackChainFor() (see market-hub.ts) and
 * therefore never participates in single-symbol quote lookups --
 * bigpara/isyatirim/tradingview-twc remain the only sources for
 * /api/market/quote/:symbol. It also does not, and must never claim to,
 * return order-book depth, AKD, settlement, or theoretical price --
 * those columns don't exist in this response at all (a prior in-repo
 * script mislabeled a similar scanner call as "get_depth()"; this
 * provider intentionally only exposes price/change/volume to avoid
 * repeating that mistake).
 *
 * Same unofficial-endpoint risk class as tradingview-twc: since
 * data.tradingview.com's WS was confirmed HTTP-451-blocked on Render
 * (shared IP range, Cloudflare), scanner.tradingview.com may or may not
 * share that block -- untested from Render until deployed. Gated by its
 * own independent flag (ENABLE_TRADINGVIEW_SCANNER, default true) so it
 * can be disabled without touching ENABLE_TRADINGVIEW, and every call
 * goes through MarketHub via providerHealth's circuit breaker so three
 * consecutive failures (e.g. a sustained 451) open the breaker and stop
 * further attempts automatically -- no manual intervention needed if
 * Render blocks it.
 */
import { fetchWithTimeout } from './fetch-with-timeout.js';
import type {
  Candle,
  CandleInterval,
  MarketCategory,
  MarketProvider,
  ProviderHealth,
  Quote,
  QuoteListener,
} from './market-provider.interface.js';

const SCAN_URL = 'https://scanner.tradingview.com/global/scan';

export interface BistScanRow {
  /** canonical catalog symbol, e.g. "BIST:GARAN" */
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
}

function buildPayload(limit: number): string {
  return JSON.stringify({
    filter: [{ left: 'exchange', operation: 'equal', right: 'BIST' }],
    options: { lang: 'tr' },
    symbols: { query: { types: [] }, tickers: [] },
    columns: ['name', 'close', 'change', 'change_abs', 'volume'],
    sort: { sortBy: 'volume', sortOrder: 'desc' },
    range: [0, limit],
  });
}

export class TradingViewScannerProvider implements MarketProvider {
  readonly id = 'tradingview-scanner';
  readonly name = 'TradingView Scanner (experimental, bulk BIST table data only)';
  readonly isRealtime = false;
  readonly experimental = true;
  readonly categories: MarketCategory[] = ['bist'];

  private get enabled(): boolean {
    return process.env.ENABLE_TRADINGVIEW_SCANNER !== 'false';
  }

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('tradingview-scanner: bulk snapshot only, no per-symbol streaming');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  /** Bulk fetch: every BIST symbol TradingView's scanner knows about, in
   * one request. This is the only thing this provider is for -- see
   * MarketHub.getBistScannerRows(), which wraps this in the circuit
   * breaker and a short cache. */
  async scanBist(limit = 1000): Promise<BistScanRow[] | null> {
    if (!this.enabled) return null;
    const res = await fetchWithTimeout(SCAN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildPayload(limit),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { data?: Array<{ s: string; d: unknown[] }> };
    if (!j.data) return null;
    return j.data.map((item) => {
      const [name, close, changePercent, changeAbs, volume] = item.d as [string, number, number, number, number];
      return {
        symbol: `BIST:${name}`,
        price: close ?? null,
        change: changeAbs ?? null,
        changePercent: changePercent ?? null,
        volume: volume ?? null,
      };
    });
  }

  /** Interface compliance only -- intentionally never wired into
   * fallbackChainFor(), so this is never actually called in production
   * request paths. Falls back to a fresh bulk scan for symbol lookup
   * rather than duplicating single-symbol quote logic elsewhere. */
  async getQuote(symbol: string): Promise<Quote | null> {
    const rows = await this.scanBist();
    const row = rows?.find((r) => r.symbol === symbol);
    if (!row || row.price == null) return null;
    return {
      symbol,
      price: row.price,
      change: row.change,
      changePercent: row.changePercent,
      volume: row.volume,
      timestamp: Date.now(),
      provider: this.id,
      delayed: false,
      experimental: true,
    };
  }

  async getCandles(_symbol: string, _interval: CandleInterval): Promise<Candle[]> {
    return [];
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.enabled) {
      return {
        provider: this.id,
        healthy: false,
        latencyMs: null,
        message: 'ENABLE_TRADINGVIEW_SCANNER=false -- disabled by config',
        checkedAt: Date.now(),
        requiresApiKey: false,
        apiKeyPresent: true,
        experimental: true,
      };
    }
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(SCAN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: buildPayload(1),
      });
      const latencyMs = Date.now() - start;
      return {
        provider: this.id,
        healthy: res.ok,
        latencyMs,
        message: res.ok
          ? 'OK (experimental, bulk BIST scanner/table data only -- not used for single-symbol quotes)'
          : `HTTP ${res.status} -- likely blocked (same risk class as tradingview-twc on shared hosting IPs)`,
        checkedAt: Date.now(),
        requiresApiKey: false,
        apiKeyPresent: true,
        experimental: true,
      };
    } catch (err) {
      return {
        provider: this.id,
        healthy: false,
        latencyMs: null,
        message: err instanceof Error ? err.message : 'unknown error',
        checkedAt: Date.now(),
        requiresApiKey: false,
        apiKeyPresent: true,
        experimental: true,
      };
    }
  }
}
